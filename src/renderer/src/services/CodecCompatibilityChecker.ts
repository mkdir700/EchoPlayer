import { loggerService } from '@logger'
import type { FFmpegVideoInfo } from '@types'

const logger = loggerService.withContext('CodecCompatibilityChecker')

/**
 * 编解码器规则配置
 */
interface CodecRule {
  /** 主编解码器名称 */
  name: string
  /** 编解码器别名列表 */
  aliases: string[]
  /** 用于检测的 MIME 类型列表 */
  mimeTypes: string[]
  /** 是否原生支持 */
  supported: boolean
  /** 编解码器分类 */
  category: 'common' | 'advanced' | 'legacy'
  /** 用户友好的显示名称 */
  displayName: string
}

/**
 * 编解码器注册中心
 */
class CodecRegistry {
  /** 视频编解码器规则 */
  private static readonly VIDEO_RULES: CodecRule[] = [
    // 常见支持的视频编解码器
    {
      name: 'h264',
      aliases: ['avc1', 'avc'],
      mimeTypes: ['video/mp4; codecs="avc1"', 'video/mp4; codecs="h264"'],
      supported: true,
      category: 'common',
      displayName: 'H.264/AVC'
    },
    {
      name: 'vp8',
      aliases: [],
      mimeTypes: ['video/webm; codecs="vp8"'],
      supported: true,
      category: 'common',
      displayName: 'VP8'
    },
    {
      name: 'vp9',
      aliases: [],
      mimeTypes: ['video/webm; codecs="vp9"'],
      supported: true,
      category: 'common',
      displayName: 'VP9'
    },
    {
      name: 'av1',
      aliases: [],
      mimeTypes: ['video/mp4; codecs="av01"', 'video/webm; codecs="av01"'],
      supported: true,
      category: 'common',
      displayName: 'AV1'
    },
    {
      name: 'theora',
      aliases: [],
      mimeTypes: ['video/ogg; codecs="theora"'],
      supported: true,
      category: 'legacy',
      displayName: 'Theora'
    },
    {
      name: 'hevc',
      aliases: ['h265', 'hev1', 'hvc1'],
      mimeTypes: ['video/mp4; codecs="hev1"', 'video/mp4; codecs="hvc1"'],
      supported: true,
      category: 'advanced',
      displayName: 'H.265/HEVC'
    }
  ]

  /** 音频编解码器规则 */
  private static readonly AUDIO_RULES: CodecRule[] = [
    // 常见支持的音频编解码器
    {
      name: 'aac',
      aliases: ['mp4a'],
      mimeTypes: ['audio/mp4; codecs="mp4a.40.2"', 'audio/aac'],
      supported: true,
      category: 'common',
      displayName: 'AAC'
    },
    {
      name: 'mp3',
      aliases: [],
      mimeTypes: ['audio/mpeg', 'audio/mp3'],
      supported: true,
      category: 'common',
      displayName: 'MP3'
    },
    {
      name: 'opus',
      aliases: [],
      mimeTypes: ['audio/webm; codecs="opus"', 'audio/ogg; codecs="opus"'],
      supported: true,
      category: 'common',
      displayName: 'Opus'
    },
    {
      name: 'vorbis',
      aliases: [],
      mimeTypes: ['audio/webm; codecs="vorbis"', 'audio/ogg; codecs="vorbis"'],
      supported: true,
      category: 'common',
      displayName: 'Vorbis'
    },
    {
      name: 'flac',
      aliases: [],
      mimeTypes: ['audio/flac'],
      supported: true,
      category: 'common',
      displayName: 'FLAC'
    },
    {
      name: 'pcm',
      aliases: [],
      mimeTypes: ['audio/wav; codecs="1"'],
      supported: true,
      category: 'common',
      displayName: 'PCM'
    },
    // 不支持的音频编解码器
    {
      name: 'ac3',
      aliases: ['ac-3'],
      mimeTypes: ['audio/ac3'],
      supported: false,
      category: 'advanced',
      displayName: 'Dolby Digital (AC-3)'
    },
    {
      name: 'eac3',
      aliases: ['e-ac-3'],
      mimeTypes: ['audio/eac3'],
      supported: false,
      category: 'advanced',
      displayName: 'Dolby Digital Plus (E-AC-3)'
    },
    {
      name: 'dts',
      aliases: ['dca'],
      mimeTypes: ['audio/vnd.dts'],
      supported: false,
      category: 'advanced',
      displayName: 'DTS'
    },
    {
      name: 'dts-hd',
      aliases: [],
      mimeTypes: ['audio/vnd.dts.hd'],
      supported: false,
      category: 'advanced',
      displayName: 'DTS-HD'
    },
    {
      name: 'truehd',
      aliases: ['mlp'],
      mimeTypes: ['audio/vnd.dolby.mlp'],
      supported: false,
      category: 'advanced',
      displayName: 'Dolby TrueHD'
    },
    {
      name: 'pcm_s24le',
      aliases: [],
      mimeTypes: ['audio/wav; codecs="pcm_s24le"'],
      supported: false,
      category: 'advanced',
      displayName: 'PCM 24-bit'
    },
    {
      name: 'pcm_s32le',
      aliases: [],
      mimeTypes: ['audio/wav; codecs="pcm_s32le"'],
      supported: false,
      category: 'advanced',
      displayName: 'PCM 32-bit'
    }
  ]

  /**
   * 查找编解码器规则
   */
  static findRule(codec: string, rules: CodecRule[]): CodecRule | undefined {
    const normalizedCodec = codec.toLowerCase().trim()

    return rules.find(
      (rule) =>
        rule.name === normalizedCodec ||
        rule.aliases.includes(normalizedCodec) ||
        normalizedCodec.includes(rule.name) ||
        rule.aliases.some((alias) => normalizedCodec.includes(alias))
    )
  }

  /**
   * 获取视频编解码器规则
   */
  static getVideoRule(codec: string): CodecRule | undefined {
    return this.findRule(codec, this.VIDEO_RULES)
  }

  /**
   * 获取音频编解码器规则
   */
  static getAudioRule(codec: string): CodecRule | undefined {
    return this.findRule(codec, this.AUDIO_RULES)
  }

  /**
   * 获取所有视频编解码器规则
   */
  static getAllVideoRules(): ReadonlyArray<CodecRule> {
    return this.VIDEO_RULES
  }

  /**
   * 获取所有音频编解码器规则
   */
  static getAllAudioRules(): ReadonlyArray<CodecRule> {
    return this.AUDIO_RULES
  }
}

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
  | 'audio-codec-unsupported'
  | 'video-codec-unsupported'
  | 'codec-unsupported'
  | 'hls-player-missing' // HLS 播放器未就绪，转码已完成但无法播放
  | 'hls-playback-error' // HLS 播放过程中的错误
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
   * 通用编解码器兼容性检测
   *
   * @param codec 编解码器名称
   * @param rule 编解码器规则配置
   * @param elementType 检测使用的 HTML 元素类型
   */
  private static checkCodecSupportByRule(
    codec: string,
    rule: CodecRule | undefined,
    elementType: 'video' | 'audio'
  ): boolean {
    // 如果找到规则，直接返回配置的支持状态
    if (rule) {
      logger.debug(`找到编解码器规则: ${rule.displayName}`, {
        codec,
        supported: rule.supported,
        category: rule.category
      })
      return rule.supported
    }

    // 未知编解码器，使用浏览器 canPlayType API 动态检测
    logger.debug(`未知编解码器，使用动态检测: ${codec}`, { elementType })

    const element = document.createElement(elementType)
    const normalizedCodec = codec.toLowerCase().trim()

    // 构建默认 MIME 类型进行检测
    const testTypes =
      elementType === 'video'
        ? [
            `video/mp4; codecs="${codec}"`,
            `video/mp4; codecs="${normalizedCodec}"`,
            `video/webm; codecs="${codec}"`
          ]
        : [
            `audio/mp4; codecs="${codec}"`,
            `audio/mp4; codecs="${normalizedCodec}"`,
            `audio/webm; codecs="${codec}"`,
            `audio/mpeg; codecs="${codec}"`
          ]

    const isSupported = testTypes.some((type) => {
      const support = element.canPlayType(type)
      const result = support === 'probably' || support === 'maybe'

      if (result) {
        logger.debug(`编解码器检测成功: ${type}`, { support })
      }

      return result
    })

    logger.debug(`动态检测结果: ${codec}`, {
      elementType,
      supported: isSupported
    })

    return isSupported
  }

  /**
   * 检查视频编解码器兼容性
   */
  private static checkVideoCodecSupport(codec: string): boolean {
    const rule = CodecRegistry.getVideoRule(codec)
    return this.checkCodecSupportByRule(codec, rule, 'video')
  }

  /**
   * 检查音频编解码器兼容性
   */
  private static checkAudioCodecSupport(codec: string): boolean {
    const rule = CodecRegistry.getAudioRule(codec)
    return this.checkCodecSupportByRule(codec, rule, 'audio')
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

    const { videoSupported, audioSupported } = compatibilityResult

    // 同时不支持视频和音频编解码器
    if (!videoSupported && !audioSupported) {
      return 'codec-unsupported'
    }

    // 仅视频编解码器不支持
    if (!videoSupported) {
      return 'video-codec-unsupported'
    }

    // 仅音频编解码器不支持
    if (!audioSupported) {
      return 'audio-codec-unsupported'
    }

    return 'unsupported-format'
  }

  /**
   * 获取编解码器的友好显示名称
   */
  private static getCodecDisplayName(codec: string | undefined, type: 'video' | 'audio'): string {
    if (!codec) return '未知'

    const rule =
      type === 'video' ? CodecRegistry.getVideoRule(codec) : CodecRegistry.getAudioRule(codec)

    return rule?.displayName || codec
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

    // 获取友好的编解码器名称
    const videoCodecName = this.getCodecDisplayName(detectedCodecs.video, 'video')
    const audioCodecName = this.getCodecDisplayName(detectedCodecs.audio, 'audio')

    // 同时不支持视频和音频
    if (!videoSupported && !audioSupported) {
      return `视频格式不支持：视频编解码器 ${videoCodecName} 和音频编解码器 ${audioCodecName} 均不兼容`
    }

    // 仅视频不支持
    if (!videoSupported) {
      return `视频编解码器 ${videoCodecName} 不支持，需要转码`
    }

    // 仅音频不支持
    if (!audioSupported) {
      return `音频编解码器 ${audioCodecName} 不支持，可能导致无声音播放`
    }

    return '视频格式需要转码以确保最佳兼容性'
  }
}

export default CodecCompatibilityChecker
