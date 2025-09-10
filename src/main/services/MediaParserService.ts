import { parseMedia } from '@remotion/media-parser'
import { nodeReader } from '@remotion/media-parser/node'
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
