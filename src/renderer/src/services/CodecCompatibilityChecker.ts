import { loggerService } from '@logger'
import type { FFmpegVideoInfo } from '@types'

const logger = loggerService.withContext('CodecCompatibilityChecker')

/**
 * 编解码器兼容性结果
 */
export interface CodecCompatibilityResult {
  /** 视频编解码器是否兼容 */
  videoSupported: boolean
  /** 音频编解码器是否兼容 */
  audioSupported: boolean
  /** 是否需要转码 */
  needsTranscode: boolean
  /** 不兼容的原因 */
  incompatibilityReasons: string[]
  /** 检测到的编解码器信息 */
  detectedCodecs: {
    video?: string
    audio?: string
  }
}

/**
 * 扩展的错误类型，支持更精确的编解码器错误分类
 */
export type ExtendedErrorType =
  | 'file-missing'
  | 'unsupported-format'
  | 'decode-error'
  | 'network-error'
  | 'h265-unsupported'
  | 'audio-codec-unsupported'
  | 'video-codec-unsupported'
  | 'codec-unsupported'
  | 'hls-player-missing' // HLS 播放器未就绪，转码已完成但无法播放
  | 'unknown'

/**
 * 编解码器兼容性检测器
 *
 * 解决"有画面没声音"问题的核心组件：
 * - 主动检测视频和音频编解码器兼容性
 * - 集成 MediaParserService 获取详细编解码器信息
 * - 提供精确的转码触发条件
 */
export class CodecCompatibilityChecker {
  /**
   * 不支持的视频编解码器列表（在 Chrome/Edge 中原生不支持）
   */
  private static readonly UNSUPPORTED_VIDEO_CODECS = new Set([
    // H.265/HEVC 相关
    'hevc',
    'hev1',
    'hvc1',
    'h265',
    // 其他可能不支持的编解码器
    'av1', // 部分老版本浏览器不支持
    'vp9' // 部分场景下可能有问题
  ])

  /**
   * 不支持的音频编解码器列表（在 Web 环境下支持有限）
   */
  private static readonly UNSUPPORTED_AUDIO_CODECS = new Set([
    // Dolby 音频格式
    'ac-3',
    'ac3',
    'eac3',
    'e-ac-3',
    // DTS 音频格式
    'dts',
    'dca',
    'dts-hd',
    // 其他高级音频格式
    'truehd',
    'mlp',
    'pcm_s24le',
    'pcm_s32le'
  ])

  /**
   * 检查视频编解码器兼容性
   */
  private static checkVideoCodecSupport(codec: string): boolean {
    const normalizedCodec = codec.toLowerCase().trim()

    // 检查是否在不支持列表中
    if (this.UNSUPPORTED_VIDEO_CODECS.has(normalizedCodec)) {
      return false
    }

    // 使用 canPlayType 进行进一步检测
    const video = document.createElement('video')

    // 构建不同的 MIME 类型进行测试
    const testTypes = [
      `video/mp4; codecs="${codec}"`,
      `video/mp4; codecs="${normalizedCodec}"`,
      `video/webm; codecs="${codec}"`
    ]

    return testTypes.some((type) => {
      const support = video.canPlayType(type)
      return support === 'probably' || support === 'maybe'
    })
  }

  /**
   * 检查音频编解码器兼容性
   */
  private static checkAudioCodecSupport(codec: string): boolean {
    const normalizedCodec = codec.toLowerCase().trim()

    // 检查是否在不支持列表中
    if (this.UNSUPPORTED_AUDIO_CODECS.has(normalizedCodec)) {
      return false
    }

    // 使用 canPlayType 进行进一步检测
    const audio = document.createElement('audio')

    // 构建不同的 MIME 类型进行测试
    const testTypes = [
      `audio/mp4; codecs="${codec}"`,
      `audio/mp4; codecs="${normalizedCodec}"`,
      `audio/webm; codecs="${codec}"`,
      `audio/mpeg; codecs="${codec}"`
    ]

    return testTypes.some((type) => {
      const support = audio.canPlayType(type)
      return support === 'probably' || support === 'maybe'
    })
  }

  /**
   * 检查视频文件的编解码器兼容性
   *
   * @param filePath 视频文件路径
   * @returns 兼容性检测结果
   */
  public static async checkCompatibility(filePath: string): Promise<CodecCompatibilityResult> {
    logger.debug('开始检查编解码器兼容性', { filePath })

    try {
      // 使用 MediaParserService 获取详细编解码器信息
      const videoInfo: FFmpegVideoInfo | null = await window.api.mediainfo.getVideoInfo(filePath)

      if (!videoInfo) {
        logger.warn('无法获取视频信息，可能文件不存在或格式不支持', { filePath })
        return {
          videoSupported: false,
          audioSupported: false,
          needsTranscode: true,
          incompatibilityReasons: ['unable-to-parse-media-info'],
          detectedCodecs: {}
        }
      }

      const { videoCodec, audioCodec } = videoInfo

      logger.debug('检测到的编解码器信息', {
        videoCodec,
        audioCodec,
        duration: videoInfo.duration,
        resolution: videoInfo.resolution
      })

      // 检查视频编解码器兼容性
      const videoSupported = this.checkVideoCodecSupport(videoCodec)

      // 检查音频编解码器兼容性
      const audioSupported = this.checkAudioCodecSupport(audioCodec)

      // 确定是否需要转码
      const needsTranscode = !videoSupported || !audioSupported

      // 生成不兼容原因列表
      const incompatibilityReasons: string[] = []
      if (!videoSupported) {
        incompatibilityReasons.push(`video-codec-unsupported: ${videoCodec}`)
      }
      if (!audioSupported) {
        incompatibilityReasons.push(`audio-codec-unsupported: ${audioCodec}`)
      }

      const result: CodecCompatibilityResult = {
        videoSupported,
        audioSupported,
        needsTranscode,
        incompatibilityReasons,
        detectedCodecs: {
          video: videoCodec,
          audio: audioCodec
        }
      }

      logger.info('编解码器兼容性检查完成', {
        filePath,
        result,
        videoInfo: {
          duration: videoInfo.duration,
          resolution: videoInfo.resolution,
          bitrate: videoInfo.bitrate
        }
      })

      return result
    } catch (error) {
      logger.error('编解码器兼容性检查失败', {
        filePath,
        error: error instanceof Error ? error.message : String(error)
      })

      return {
        videoSupported: false,
        audioSupported: false,
        needsTranscode: true,
        incompatibilityReasons: ['compatibility-check-failed'],
        detectedCodecs: {}
      }
    }
  }

  /**
   * 根据兼容性结果生成详细的错误类型
   *
   * @param compatibilityResult 兼容性检测结果
   * @returns 扩展的错误类型
   */
  public static getErrorTypeFromCompatibility(
    compatibilityResult: CodecCompatibilityResult
  ): ExtendedErrorType {
    if (!compatibilityResult.needsTranscode) {
      return 'unknown' // 不需要转码但调用了此方法，可能是其他错误
    }

    const { videoSupported, audioSupported, detectedCodecs } = compatibilityResult

    // 同时不支持视频和音频编解码器
    if (!videoSupported && !audioSupported) {
      return 'codec-unsupported'
    }

    // 仅视频编解码器不支持
    if (!videoSupported) {
      // 特殊处理 H.265/HEVC
      const videoCodec = detectedCodecs.video?.toLowerCase() || ''
      if (
        videoCodec.includes('hevc') ||
        videoCodec.includes('h265') ||
        videoCodec.includes('hev1') ||
        videoCodec.includes('hvc1')
      ) {
        return 'h265-unsupported'
      }
      return 'video-codec-unsupported'
    }

    // 仅音频编解码器不支持
    if (!audioSupported) {
      return 'audio-codec-unsupported'
    }

    return 'unsupported-format'
  }

  /**
   * 生成用户友好的错误消息
   *
   * @param compatibilityResult 兼容性检测结果
   * @returns 用户友好的错误消息
   */
  public static generateErrorMessage(compatibilityResult: CodecCompatibilityResult): string {
    if (!compatibilityResult.needsTranscode) {
      return '视频格式兼容'
    }

    const { videoSupported, audioSupported, detectedCodecs } = compatibilityResult

    if (!videoSupported && !audioSupported) {
      return `视频格式不支持：视频编解码器 ${detectedCodecs.video} 和音频编解码器 ${detectedCodecs.audio} 均不兼容`
    }

    if (!videoSupported) {
      const videoCodec = detectedCodecs.video || '未知'
      if (videoCodec.toLowerCase().includes('hevc') || videoCodec.toLowerCase().includes('h265')) {
        return `H.265/HEVC 视频格式需要转码才能在浏览器中播放`
      }
      return `视频编解码器 ${videoCodec} 不支持，需要转码`
    }

    if (!audioSupported) {
      const audioCodec = detectedCodecs.audio || '未知'
      return `音频编解码器 ${audioCodec} 不支持，可能导致无声音播放`
    }

    return '视频格式需要转码以确保最佳兼容性'
  }
}

export default CodecCompatibilityChecker
