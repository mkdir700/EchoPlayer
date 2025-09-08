import type { FFmpegVideoInfo } from '@types'
import * as fs from 'fs'
import type { MediaInfo, ReadChunkFunc } from 'mediainfo.js'
import * as path from 'path'

import { loggerService } from './LoggerService'

const logger = loggerService.withContext('MediaInfoService')

class MediaInfoService {
  private mediaInfo: MediaInfo<'object'> | null = null
  private isInitialized = false

  constructor() {
    // 构造函数可以用于初始化操作
  }

  /**
   * 创建文件读取函数
   */
  private makeReadChunk(filePath: string): ReadChunkFunc {
    return async (chunkSize: number, offset: number) => {
      const fd = fs.openSync(filePath, 'r')
      try {
        const buffer = Buffer.alloc(chunkSize)
        const bytesRead = fs.readSync(fd, buffer, 0, chunkSize, offset)
        return new Uint8Array(buffer.buffer, buffer.byteOffset, bytesRead)
      } finally {
        fs.closeSync(fd)
      }
    }
  }

  /**
   * 初始化 MediaInfo WebAssembly
   */
  private async initializeMediaInfo(): Promise<void> {
    if (this.isInitialized && this.mediaInfo) {
      return
    }

    try {
      logger.info('🚀 开始初始化 MediaInfo WebAssembly')
      const startTime = Date.now()

      // 使用动态导入来处理 ESM 模块
      const { default: mediaInfoFactory } = await import('mediainfo.js')
      this.mediaInfo = await mediaInfoFactory({
        format: 'object',
        locateFile: (wasmPath: string) => {
          // 在 Electron 中寻找 WASM 文件路径
          if (wasmPath === 'MediaInfoModule.wasm') {
            // 开发环境路径
            const devPath = path.join(__dirname, 'assets', wasmPath)
            if (fs.existsSync(devPath)) {
              logger.info('🔧 使用开发环境 WASM 文件路径', { path: devPath })
              return devPath
            }

            // 生产环境路径
            const prodPath = path.join(
              process.resourcesPath || __dirname,
              'app.asar.unpacked/out/main/assets',
              wasmPath
            )
            if (fs.existsSync(prodPath)) {
              logger.info('🔧 使用生产环境 WASM 文件路径', { path: prodPath })
              return prodPath
            }

            logger.warn('⚠️ 未找到 WASM 文件，使用默认路径')
          }
          return wasmPath
        }
      })

      const initTime = Date.now() - startTime
      this.isInitialized = true

      logger.info(`✅ MediaInfo 初始化成功，耗时: ${initTime}ms`)
    } catch (error) {
      logger.error('❌ MediaInfo 初始化失败:', {
        error: error instanceof Error ? error : new Error(String(error))
      })
      throw error
    }
  }

  /**
   * 将文件 URL 转换为本地路径
   */
  private convertFileUrlToLocalPath(inputPath: string): string {
    // 如果是file://URL，需要转换为本地路径
    if (inputPath.startsWith('file://')) {
      try {
        const url = new URL(inputPath)
        let localPath = decodeURIComponent(url.pathname)

        // Windows路径处理：移除开头的斜杠
        if (process.platform === 'win32' && localPath.startsWith('/')) {
          localPath = localPath.substring(1)
        }

        logger.info('🔄 URL路径转换', {
          原始路径: inputPath,
          转换后路径: localPath,
          平台: process.platform,
          文件是否存在: fs.existsSync(localPath)
        })

        return localPath
      } catch (error) {
        logger.error('URL路径转换失败:', {
          error: error instanceof Error ? error : new Error(String(error))
        })
        // 如果转换失败，返回原路径
        return inputPath
      }
    }

    // 如果不是file://URL，直接返回
    return inputPath
  }

  /**
   * 解析 MediaInfo 结果为 FFmpegVideoInfo 格式
   */
  private parseMediaInfoResult(result: any): FFmpegVideoInfo | null {
    try {
      logger.info('🔍 开始解析 MediaInfo 结果')

      if (!result || !result.media || !result.media.track) {
        logger.error('❌ MediaInfo 结果格式无效')
        return null
      }

      const tracks = result.media.track as any[]

      // 查找通用轨道（包含文件信息）
      const generalTrack = tracks.find((track) => track['@type'] === 'General')

      // 查找视频轨道
      const videoTrack = tracks.find((track) => track['@type'] === 'Video')

      // 查找音频轨道
      const audioTrack = tracks.find((track) => track['@type'] === 'Audio')

      if (!videoTrack) {
        logger.error('❌ 未找到视频轨道')
        return null
      }

      // 解析时长（需要检查 MediaInfo 返回的实际格式）
      let duration = 0

      // 先记录原始数据以便调试
      logger.info('📊 MediaInfo 原始时长数据', {
        generalTrack_Duration: generalTrack?.Duration,
        videoTrack_Duration: videoTrack?.Duration,
        generalTrack_DurationString: generalTrack?.['Duration/String'],
        generalTrack_DurationString1: generalTrack?.['Duration/String1'],
        generalTrack_DurationString2: generalTrack?.['Duration/String2'],
        generalTrack_DurationString3: generalTrack?.['Duration/String3']
      })

      if (generalTrack?.Duration) {
        const rawDuration = String(generalTrack.Duration)
        const durationValue = parseFloat(rawDuration)

        // MediaInfo 可能返回毫秒或秒，需要智能判断
        if (durationValue > 3600000) {
          // 如果值大于1小时的毫秒数（3600000），很可能是毫秒
          duration = durationValue / 1000
          logger.info('🕐 检测到毫秒格式时长（大于1小时）', {
            原始值: durationValue,
            转换后秒数: duration
          })
        } else if (durationValue > 60000) {
          // 如果值大于1分钟的毫秒数（60000），很可能是毫秒
          duration = durationValue / 1000
          logger.info('🕐 检测到毫秒格式时长（大于1分钟）', {
            原始值: durationValue,
            转换后秒数: duration
          })
        } else if (durationValue > 3600) {
          // 如果值大于1小时的秒数（3600），很可能是秒
          duration = durationValue
          logger.info('🕐 检测到秒格式时长', {
            原始值: durationValue,
            秒数: duration
          })
        } else {
          // 对于较小的值，假设是秒（因为很少有视频短于1分钟但用毫秒表示会小于60000）
          duration = durationValue
          logger.warn('🕐 时长值较小，假设为秒格式', {
            原始值: durationValue,
            假设秒数: duration
          })
        }
      } else if (videoTrack?.Duration) {
        const rawDuration = String(videoTrack.Duration)
        const durationValue = parseFloat(rawDuration)

        // 同样的逻辑应用于视频轨道时长
        if (durationValue > 3600000) {
          duration = durationValue / 1000
          logger.info('🕐 从视频轨道检测到毫秒格式时长（大于1小时）', {
            原始值: durationValue,
            转换后秒数: duration
          })
        } else if (durationValue > 60000) {
          duration = durationValue / 1000
          logger.info('🕐 从视频轨道检测到毫秒格式时长（大于1分钟）', {
            原始值: durationValue,
            转换后秒数: duration
          })
        } else if (durationValue > 3600) {
          duration = durationValue
          logger.info('🕐 从视频轨道检测到秒格式时长', {
            原始值: durationValue,
            秒数: duration
          })
        } else {
          duration = durationValue
          logger.warn('🕐 从视频轨道获取时长值较小，假设为秒格式', {
            原始值: durationValue,
            假设秒数: duration
          })
        }
      }

      // 解析视频编解码器
      const videoCodec = videoTrack.Format || videoTrack.CodecID || 'unknown'

      // 解析音频编解码器
      const audioCodec = audioTrack?.Format || audioTrack?.CodecID || 'unknown'

      // 解析分辨率
      let resolution = '0x0'
      if (videoTrack.Width && videoTrack.Height) {
        resolution = `${videoTrack.Width}x${videoTrack.Height}`
      }

      // 解析码率
      let bitrate = '0'
      if (generalTrack?.OverallBitRate) {
        bitrate = String(generalTrack.OverallBitRate)
      } else if (videoTrack.BitRate) {
        bitrate = String(videoTrack.BitRate)
      }

      const videoInfo: FFmpegVideoInfo = {
        duration,
        videoCodec,
        audioCodec,
        resolution,
        bitrate
      }

      logger.info('🎬 解析的视频信息', {
        duration: `${duration}s`,
        videoCodec,
        audioCodec,
        resolution,
        bitrate: `${bitrate} bps`,
        原始数据样本: {
          generalTrack: generalTrack ? Object.keys(generalTrack).slice(0, 5) : 'none',
          videoTrack: videoTrack ? Object.keys(videoTrack).slice(0, 8) : 'none',
          audioTrack: audioTrack ? Object.keys(audioTrack).slice(0, 5) : 'none'
        }
      })

      return videoInfo
    } catch (error) {
      logger.error('解析 MediaInfo 结果失败:', {
        error: error instanceof Error ? error : new Error(String(error))
      })
      return null
    }
  }

  /**
   * 获取视频文件信息
   */
  public async getVideoInfo(inputPath: string): Promise<FFmpegVideoInfo | null> {
    const startTime = Date.now()
    logger.info('🎬 开始获取视频信息 (MediaInfo)', { inputPath })

    try {
      // 确保 MediaInfo 已初始化
      await this.initializeMediaInfo()

      if (!this.mediaInfo) {
        throw new Error('MediaInfo 未初始化')
      }

      // 转换文件路径
      const pathConvertStartTime = Date.now()
      const localInputPath = this.convertFileUrlToLocalPath(inputPath)
      const pathConvertEndTime = Date.now()

      logger.info(`🔄 路径转换耗时: ${pathConvertEndTime - pathConvertStartTime}ms`, {
        原始输入路径: inputPath,
        转换后本地路径: localInputPath
      })

      // 检查文件是否存在
      const fileCheckStartTime = Date.now()
      const fileExists = fs.existsSync(localInputPath)
      const fileCheckEndTime = Date.now()

      logger.info(`📁 文件存在性检查耗时: ${fileCheckEndTime - fileCheckStartTime}ms`, {
        文件存在性: fileExists
      })

      if (!fileExists) {
        logger.error(`❌ 文件不存在: ${localInputPath}`)
        return null
      }

      // 获取文件大小
      const fileStatsStartTime = Date.now()
      const fileStats = fs.statSync(localInputPath)
      const fileSize = fileStats.size
      const fileStatsEndTime = Date.now()

      logger.info(`📊 文件信息获取耗时: ${fileStatsEndTime - fileStatsStartTime}ms`, {
        文件大小: `${Math.round((fileSize / 1024 / 1024) * 100) / 100}MB`
      })

      // 使用 MediaInfo 分析文件（参考例子的方式）
      const analysisStartTime = Date.now()
      const result = await this.mediaInfo.analyzeData(fileSize, this.makeReadChunk(localInputPath))
      const analysisEndTime = Date.now()

      logger.info(`🔍 MediaInfo 分析耗时: ${analysisEndTime - analysisStartTime}ms`)

      // 解析结果
      const parseStartTime = Date.now()
      const videoInfo = this.parseMediaInfoResult(result)
      const parseEndTime = Date.now()

      logger.info(`📊 结果解析耗时: ${parseEndTime - parseStartTime}ms`)

      if (videoInfo) {
        const totalTime = Date.now() - startTime
        logger.info(`✅ 成功获取视频信息 (MediaInfo)，总耗时: ${totalTime}ms`, {
          ...videoInfo,
          性能统计: {
            路径转换: `${pathConvertEndTime - pathConvertStartTime}ms`,
            文件检查: `${fileCheckEndTime - fileCheckStartTime}ms`,
            文件信息获取: `${fileStatsEndTime - fileStatsStartTime}ms`,
            MediaInfo分析: `${analysisEndTime - analysisStartTime}ms`,
            结果解析: `${parseEndTime - parseStartTime}ms`,
            总耗时: `${totalTime}ms`
          }
        })
        return videoInfo
      } else {
        logger.error('❌ 无法解析视频信息')
        return null
      }
    } catch (error) {
      const totalTime = Date.now() - startTime
      logger.error(`❌ 获取视频信息失败，耗时: ${totalTime}ms`, {
        inputPath,
        error: error instanceof Error ? error.message : String(error),
        总耗时: `${totalTime}ms`
      })
      return null
    }
  }

  /**
   * 检查 MediaInfo 是否可用
   */
  public async checkMediaInfoExists(): Promise<boolean> {
    try {
      await this.initializeMediaInfo()
      return this.isInitialized && this.mediaInfo !== null
    } catch (error) {
      logger.error('MediaInfo 检查失败:', {
        error: error instanceof Error ? error : new Error(String(error))
      })
      return false
    }
  }

  /**
   * 获取 MediaInfo 版本信息
   */
  public async getMediaInfoVersion(): Promise<string | null> {
    try {
      await this.initializeMediaInfo()
      if (this.mediaInfo) {
        // MediaInfo.js 没有稳定的运行时版本查询 API；如需展示版本请从 package.json 读取
        return 'mediainfo.js'
      }
      return null
    } catch (error) {
      logger.error('获取 MediaInfo 版本失败:', {
        error: error instanceof Error ? error : new Error(String(error))
      })
      return null
    }
  }

  /**
   * 清理资源
   */
  public async dispose(): Promise<void> {
    if (this.mediaInfo) {
      try {
        // 根据参考例子，调用 close 方法清理资源
        logger.info('🧹 清理 MediaInfo 资源')
        this.mediaInfo.close()
        this.mediaInfo = null
        this.isInitialized = false
      } catch (error) {
        logger.error('清理 MediaInfo 资源失败:', {
          error: error instanceof Error ? error : new Error(String(error))
        })
      }
    }
  }
}

export default MediaInfoService
