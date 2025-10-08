import { parseMedia } from '@remotion/media-parser'
import { nodeReader } from '@remotion/media-parser/node'
import { PathConverter } from '@shared/utils/PathConverter'
import type { FFmpegVideoInfo } from '@types'
import * as fs from 'fs'

import FFmpegService from './FFmpegService'
import { loggerService } from './LoggerService'

const logger = loggerService.withContext('MediaParserService')

class MediaParserService {
  private ffmpegService: FFmpegService

  constructor() {
    this.ffmpegService = new FFmpegService()
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

      // 记录完整的原始结果结构以便调试
      logger.debug('📋 Remotion 原始结果结构', {
        keys: Object.keys(result),
        videoCodec: result.videoCodec,
        audioCodec: result.audioCodec,
        videoTracks: result.videoTracks,
        audioTracks: result.audioTracks,
        dimensions: result.dimensions,
        tracks: result.tracks,
        fullResult: JSON.stringify(result, null, 2)
      })

      // 获取时长（秒）
      const duration = result.durationInSeconds || 0

      // 获取视频轨道信息
      let videoCodec = 'unknown'
      let resolution = '0x0'
      const bitrate = '0' // Remotion 不提供比特率信息

      // 1. 优先从 dimensions 获取分辨率
      if (result.dimensions && result.dimensions.width && result.dimensions.height) {
        resolution = `${result.dimensions.width}x${result.dimensions.height}`
      }

      // 2. 优先使用顶级字段 videoCodec
      if (result.videoCodec) {
        videoCodec = result.videoCodec
      }

      // 3. 从 tracks 数组中查找视频轨道信息（补充/覆盖）
      if (result.tracks && result.tracks.length > 0) {
        const videoTrack = result.tracks.find((track: any) => track.type === 'video')
        if (videoTrack) {
          // 如果顶级字段没有 codec，从轨道中获取
          if (videoCodec === 'unknown') {
            videoCodec = videoTrack.codecEnum || videoTrack.codec || 'unknown'
          }

          // 如果 dimensions 没有提供分辨率，从轨道中获取
          if (resolution === '0x0' && videoTrack.width && videoTrack.height) {
            resolution = `${videoTrack.width}x${videoTrack.height}`
          }

          // 注意：Remotion 似乎不提供比特率信息，保持默认值 '0'
        }
      }

      // 获取音频编解码器
      let audioCodec = 'unknown'
      // 优先使用顶级字段 audioCodec
      if (result.audioCodec) {
        audioCodec = result.audioCodec
      } else if (result.tracks && result.tracks.length > 0) {
        const audioTrack = result.tracks.find((track: any) => track.type === 'audio')
        if (audioTrack) {
          audioCodec = audioTrack.codecEnum || audioTrack.codec || 'unknown'
        }
      }

      // 如果编解码器信息无效,返回 null 触发 fallback
      if (videoCodec === 'unknown' && audioCodec === 'unknown') {
        logger.warn('⚠️ Remotion 未能解析出有效的编解码器信息，将触发 FFmpeg fallback', {
          duration,
          videoTracks: result.videoTracks?.length || 0,
          audioTracks: result.audioTracks?.length || 0
        })
        return null
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
        raw: {
          videoTracks: result.videoTracks?.length || 0,
          audioTracks: result.audioTracks?.length || 0,
          container: result.container,
          topLevelVideoCodec: result.videoCodec || 'none',
          topLevelAudioCodec: result.audioCodec || 'none'
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
   * 策略化获取视频信息，支持自定义解析策略和超时
   */
  public async getVideoInfoWithStrategy(
    inputPath: string,
    strategy:
      | 'remotion-first'
      | 'ffmpeg-first'
      | 'remotion-only'
      | 'ffmpeg-only' = 'remotion-first',
    timeoutMs: number = 10000
  ): Promise<FFmpegVideoInfo | null> {
    const startTime = Date.now()
    logger.info('🎬 开始策略化获取视频信息', {
      inputPath,
      strategy,
      timeout: `${timeoutMs}ms`
    })

    try {
      // 使用优化的路径转换
      const pathResult = PathConverter.convertToLocalPath(inputPath)

      if (!pathResult.isValid) {
        logger.error(`❌ 路径转换失败: ${pathResult.error}`)
        return null
      }

      // 快速检查文件存在性
      if (!fs.existsSync(pathResult.localPath)) {
        logger.error(`❌ 文件不存在: ${pathResult.localPath}`)
        return null
      }

      const fileSize = fs.statSync(pathResult.localPath).size
      logger.info(`📊 文件大小: ${Math.round((fileSize / 1024 / 1024) * 100) / 100}MB`)

      // 根据策略选择解析器
      const parsers = this.getParsersFromStrategy(strategy)

      for (const parser of parsers) {
        const parseStartTime = Date.now()
        try {
          let result: FFmpegVideoInfo | null = null

          if (parser === 'remotion') {
            result = await Promise.race([
              this.parseWithRemotion(pathResult.localPath),
              this.createTimeoutPromise<typeof result>(timeoutMs, 'Remotion')
            ])
          } else {
            result = await Promise.race([
              this.ffmpegService.getVideoInfo(inputPath),
              this.createTimeoutPromise<typeof result>(timeoutMs, 'FFmpeg')
            ])
          }

          if (result) {
            const totalTime = Date.now() - startTime
            const parseTime = Date.now() - parseStartTime
            logger.info(
              `✅ 成功获取视频信息 (${parser})，解析耗时: ${parseTime}ms，总耗时: ${totalTime}ms`,
              {
                ...result,
                parser,
                strategy
              }
            )
            return result
          }
        } catch (error) {
          const parseTime = Date.now() - parseStartTime
          const errorMsg = error instanceof Error ? error.message : String(error)

          if (errorMsg.includes('timeout')) {
            logger.warn(`⏰ ${parser} 解析超时 (${parseTime}ms)，尝试下一个解析器`, {
              parser,
              timeout: timeoutMs
            })
          } else {
            logger.warn(`⚠️ ${parser} 解析失败 (${parseTime}ms)，尝试下一个解析器`, {
              parser,
              error: errorMsg
            })
          }

          // 如果是 only 模式，直接失败
          if (strategy.endsWith('-only')) {
            throw error
          }
        }
      }

      // 所有解析器都失败
      const totalTime = Date.now() - startTime
      logger.error(`❌ 所有解析器都失败，总耗时: ${totalTime}ms`, {
        inputPath,
        strategy,
        parsers
      })
      return null
    } catch (error) {
      const totalTime = Date.now() - startTime
      logger.error(`❌ 策略化获取视频信息失败，耗时: ${totalTime}ms`, {
        inputPath,
        strategy,
        error: error instanceof Error ? error.message : String(error)
      })
      return null
    }
  }

  /**
   * 获取视频文件信息，优先使用 Remotion，失败时 fallback 到 FFmpeg
   */
  public async getVideoInfo(inputPath: string): Promise<FFmpegVideoInfo | null> {
    const startTime = Date.now()
    logger.info('🎬 开始获取视频信息 (Remotion + FFmpeg fallback)', { inputPath })

    try {
      // 转换文件路径
      const pathConvertStartTime = Date.now()
      const localInputPath = this.convertFileUrlToLocalPath(inputPath)
      const pathConvertEndTime = Date.now()

      logger.info(`🔄 路径转换耗时: ${pathConvertEndTime - pathConvertStartTime}ms`, {
        inputPath,
        localInputPath
      })

      // 检查文件是否存在
      const fileCheckStartTime = Date.now()
      const fileExists = fs.existsSync(localInputPath)
      const fileCheckEndTime = Date.now()

      logger.info(`📁 文件存在性检查耗时: ${fileCheckEndTime - fileCheckStartTime}ms`, {
        fileExists
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
        fileSize: `${Math.round((fileSize / 1024 / 1024) * 100) / 100}MB`
      })

      // 首先尝试使用 Remotion parseMedia 分析文件
      try {
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

        // 解析结果
        const parseStartTime = Date.now()
        const videoInfo = this.parseRemotionResult(result)
        const parseEndTime = Date.now()

        logger.info(`📊 Remotion 结果解析耗时: ${parseEndTime - parseStartTime}ms`)

        if (videoInfo) {
          const totalTime = Date.now() - startTime
          logger.info(`✅ 成功获取视频信息 (Remotion)，总耗时: ${totalTime}ms`, {
            ...videoInfo
          })
          return videoInfo
        } else {
          logger.warn('⚠️ Remotion 解析结果为空，尝试 FFmpeg fallback')
        }
      } catch (remotionError) {
        const remotionErrorMsg =
          remotionError instanceof Error ? remotionError.message : String(remotionError)
        logger.warn('⚠️ Remotion 解析失败，尝试 FFmpeg fallback', {
          remotionError: remotionErrorMsg
        })
      }

      // Remotion 失败时，fallback 到 FFmpeg
      logger.info('🔄 开始 FFmpeg fallback 解析')

      try {
        const ffmpegVideoInfo = await this.ffmpegService.getVideoInfo(inputPath)

        if (ffmpegVideoInfo) {
          const totalTime = Date.now() - startTime
          logger.info(`✅ 成功获取视频信息 (FFmpeg fallback)，总耗时: ${totalTime}ms`, {
            ...ffmpegVideoInfo
          })
          return ffmpegVideoInfo
        } else {
          logger.error('❌ FFmpeg fallback 也无法解析视频信息')
        }
      } catch (ffmpegError) {
        const ffmpegErrorMsg =
          ffmpegError instanceof Error ? ffmpegError.message : String(ffmpegError)
        logger.error('❌ FFmpeg fallback 解析失败', {
          ffmpegError: ffmpegErrorMsg
        })
      }

      // 两种方法都失败
      const totalTime = Date.now() - startTime
      logger.error(`❌ 所有解析方法都失败，总耗时: ${totalTime}ms`, {
        inputPath
      })
      return null
    } catch (error) {
      const totalTime = Date.now() - startTime
      logger.error(`❌ 获取视频信息失败，耗时: ${totalTime}ms`, {
        inputPath,
        error: error instanceof Error ? error.message : String(error)
      })
      return null
    }
  }

  /**
   * 检查媒体解析器是否可用 (Remotion + FFmpeg fallback)
   */
  public async checkExists(): Promise<boolean> {
    try {
      // Remotion media-parser 总是可用（包含在应用中），但如果需要 fallback，也检查 FFmpeg
      const ffmpegExists = await this.ffmpegService.checkFFmpegExists()

      logger.info('📊 媒体解析器可用性检查', {
        remotion: true,
        ffmpeg: ffmpegExists,
        fallbackAvailable: ffmpegExists
      })

      // 只要有一个可用就返回 true，优先使用 Remotion，FFmpeg 作为 fallback
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
      const ffmpegVersion = await this.ffmpegService.getFFmpegVersion()
      const versionInfo = ffmpegVersion
        ? `@remotion/media-parser + FFmpeg(${ffmpegVersion})`
        : '@remotion/media-parser (FFmpeg not available)'

      logger.info('📊 媒体解析器版本信息', { versionInfo })
      return versionInfo
    } catch (error) {
      logger.error('获取媒体解析器版本失败:', {
        error: error instanceof Error ? error : new Error(String(error))
      })
      return '@remotion/media-parser (version check failed)'
    }
  }

  /**
   * 根据策略获取解析器列表
   */
  private getParsersFromStrategy(strategy: string): ('remotion' | 'ffmpeg')[] {
    switch (strategy) {
      case 'remotion-first':
        return ['remotion', 'ffmpeg']
      case 'ffmpeg-first':
        return ['ffmpeg', 'remotion']
      case 'remotion-only':
        return ['remotion']
      case 'ffmpeg-only':
        return ['ffmpeg']
      default:
        return ['remotion', 'ffmpeg']
    }
  }

  /**
   * 使用 Remotion 解析视频信息
   */
  private async parseWithRemotion(localInputPath: string): Promise<FFmpegVideoInfo | null> {
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

    return this.parseRemotionResult(result)
  }

  /**
   * 创建超时 Promise
   */
  private createTimeoutPromise<T>(timeoutMs: number, parserName: string): Promise<T> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`${parserName} parsing timeout after ${timeoutMs}ms`))
      }, timeoutMs)
    })
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
