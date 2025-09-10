import { parseMedia } from '@remotion/media-parser'
import { nodeReader } from '@remotion/media-parser/node'
import type { FFmpegVideoInfo } from '@types'
import * as fs from 'fs'

import { loggerService } from './LoggerService'

const logger = loggerService.withContext('MediaParserService')

class MediaParserService {
  constructor() {
    // 构造函数可以用于初始化操作
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
   * 将 Remotion parseMedia 结果转换为 FFmpegVideoInfo 格式
   */
  private parseRemotionResult(result: any): FFmpegVideoInfo | null {
    try {
      logger.info('🔍 开始解析 Remotion 媒体解析结果')

      if (!result) {
        logger.error('❌ Remotion 结果为空')
        return null
      }

      // 获取时长（秒）
      const duration = result.durationInSeconds || 0

      // 获取视频轨道信息
      let videoCodec = 'unknown'
      let resolution = '0x0'
      let bitrate = '0'

      if (result.videoTracks && result.videoTracks.length > 0) {
        const videoTrack = result.videoTracks[0]
        videoCodec = videoTrack.codecWithoutConfig || videoTrack.codec || 'unknown'

        if (videoTrack.width && videoTrack.height) {
          resolution = `${videoTrack.width}x${videoTrack.height}`
        }

        if (videoTrack.bitrate) {
          bitrate = String(videoTrack.bitrate)
        }
      }

      // 获取音频编解码器
      let audioCodec = 'unknown'
      if (result.audioTracks && result.audioTracks.length > 0) {
        const audioTrack = result.audioTracks[0]
        audioCodec = audioTrack.codecWithoutConfig || audioTrack.codec || 'unknown'
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
          videoTracks: result.videoTracks?.length || 0,
          audioTracks: result.audioTracks?.length || 0,
          container: result.container
        }
      })

      return videoInfo
    } catch (error) {
      logger.error('解析 Remotion 结果失败:', {
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
    logger.info('🎬 开始获取视频信息 (Remotion)', { inputPath })

    try {
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

      // 使用 Remotion parseMedia 分析文件
      const analysisStartTime = Date.now()
      const result = await parseMedia({
        src: localInputPath,
        reader: nodeReader,
        fields: {
          durationInSeconds: true,
          dimensions: true,
          videoCodec: true,
          audioCodec: true,
          tracks: true,
          container: true
        },
        logLevel: 'error' // 减少日志输出
      })
      const analysisEndTime = Date.now()

      logger.info(`🔍 Remotion 分析耗时: ${analysisEndTime - analysisStartTime}ms`)

      // 解析结果
      const parseStartTime = Date.now()
      const videoInfo = this.parseRemotionResult(result)
      const parseEndTime = Date.now()

      logger.info(`📊 结果解析耗时: ${parseEndTime - parseStartTime}ms`)

      if (videoInfo) {
        const totalTime = Date.now() - startTime
        logger.info(`✅ 成功获取视频信息 (Remotion)，总耗时: ${totalTime}ms`, {
          ...videoInfo,
          性能统计: {
            路径转换: `${pathConvertEndTime - pathConvertStartTime}ms`,
            文件检查: `${fileCheckEndTime - fileCheckStartTime}ms`,
            文件信息获取: `${fileStatsEndTime - fileStatsStartTime}ms`,
            Remotion分析: `${analysisEndTime - analysisStartTime}ms`,
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
   * 检查媒体解析器是否可用
   */
  public async checkExists(): Promise<boolean> {
    try {
      // Remotion media-parser 不需要特殊初始化，总是可用
      return true
    } catch (error) {
      logger.error('媒体解析器检查失败:', {
        error: error instanceof Error ? error : new Error(String(error))
      })
      return false
    }
  }

  /**
   * 获取媒体解析器版本信息
   */
  public async getVersion(): Promise<string | null> {
    try {
      // 返回 Remotion media-parser 标识
      return '@remotion/media-parser'
    } catch (error) {
      logger.error('获取媒体解析器版本失败:', {
        error: error instanceof Error ? error : new Error(String(error))
      })
      return null
    }
  }

  /**
   * 清理资源
   */
  public async dispose(): Promise<void> {
    try {
      logger.info('🧹 清理媒体解析器资源')
      // Remotion media-parser 不需要特殊清理
    } catch (error) {
      logger.error('清理媒体解析器资源失败:', {
        error: error instanceof Error ? error : new Error(String(error))
      })
    }
  }
}

export default MediaParserService
