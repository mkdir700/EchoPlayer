import { loggerService } from '@logger'
import type { FFmpegVideoInfo } from '@types'

import {
  CodecCompatibilityChecker,
  type CodecCompatibilityResult,
  type ExtendedErrorType
} from './CodecCompatibilityChecker'

const logger = loggerService.withContext('VideoFormatDetector')

/**
 * 视频格式检测级别
 */
export type DetectionLevel = 'quick' | 'standard' | 'deep'

/**
 * 文件格式信息
 */
export interface FileFormatInfo {
  /** 文件扩展名 */
  extension: string
  /** 推测的容器格式 */
  containerFormat: string
  /** 是否为常见视频格式 */
  isCommonVideoFormat: boolean
  /** 格式支持置信度 (0-1) */
  confidence: number
}

/**
 * MIME 类型检测结果
 */
export interface MimeTypeInfo {
  /** 检测到的 MIME 类型 */
  mimeType: string
  /** 浏览器是否支持该 MIME 类型 */
  browserSupported: boolean
  /** 支持级别 ('probably' | 'maybe' | 'no') */
  supportLevel: string
}

/**
 * 综合格式检测结果
 */
export interface VideoFormatDetectionResult {
  /** 文件格式信息 */
  fileFormat: FileFormatInfo
  /** MIME 类型信息 */
  mimeType: MimeTypeInfo
  /** 编解码器兼容性结果 */
  codecCompatibility: CodecCompatibilityResult | null
  /** 是否需要转码 */
  needsTranscode: boolean
  /** 推荐的播放器类型 */
  recommendedPlayerType: 'native' | 'hls'
  /** 错误类型（如果有） */
  errorType?: ExtendedErrorType
  /** 详细错误信息 */
  errorMessage?: string
  /** 检测级别 */
  detectionLevel: DetectionLevel
}

/**
 * 视频格式检测器
 *
 * 实现多层次的视频格式检测机制：
 * 1. 文件扩展名分析 - 快速初步判断
 * 2. MIME 类型检测 - 浏览器支持性检查
 * 3. 播放错误分析 - 基于实际播放错误的深度分析
 * 4. 编解码器兼容性检测 - 使用 CodecCompatibilityChecker 进行精确检测
 */
export class VideoFormatDetector {
  /**
   * 支持的视频文件扩展名及其置信度
   */
  private static readonly VIDEO_EXTENSIONS = new Map([
    // 高兼容性格式
    ['mp4', { confidence: 0.9, containerFormat: 'MP4', common: true }],
    ['webm', { confidence: 0.85, containerFormat: 'WebM', common: true }],
    ['ogg', { confidence: 0.8, containerFormat: 'Ogg', common: true }],

    // 常见但可能需要转码的格式
    ['mkv', { confidence: 0.7, containerFormat: 'Matroska', common: true }],
    ['avi', { confidence: 0.6, containerFormat: 'AVI', common: true }],
    ['mov', { confidence: 0.75, containerFormat: 'QuickTime', common: true }],
    ['wmv', { confidence: 0.5, containerFormat: 'WMV', common: true }],
    ['flv', { confidence: 0.4, containerFormat: 'FLV', common: true }],

    // 专业和高质量格式
    ['m4v', { confidence: 0.8, containerFormat: 'M4V', common: false }],
    ['3gp', { confidence: 0.3, containerFormat: '3GP', common: false }],
    ['3g2', { confidence: 0.3, containerFormat: '3G2', common: false }],
    ['ts', { confidence: 0.6, containerFormat: 'MPEG-TS', common: false }],
    ['mts', { confidence: 0.6, containerFormat: 'AVCHD', common: false }],
    ['m2ts', { confidence: 0.6, containerFormat: 'AVCHD', common: false }],

    // 其他格式
    ['asf', { confidence: 0.4, containerFormat: 'ASF', common: false }],
    ['rm', { confidence: 0.3, containerFormat: 'RealMedia', common: false }],
    ['rmvb', { confidence: 0.3, containerFormat: 'RealMedia', common: false }]
  ])

  /**
   * MIME 类型映射
   */
  private static readonly MIME_TYPE_MAPPING = new Map([
    ['mp4', 'video/mp4'],
    ['webm', 'video/webm'],
    ['ogg', 'video/ogg'],
    ['mkv', 'video/x-matroska'],
    ['avi', 'video/x-msvideo'],
    ['mov', 'video/quicktime'],
    ['wmv', 'video/x-ms-wmv'],
    ['flv', 'video/x-flv'],
    ['m4v', 'video/x-m4v'],
    ['3gp', 'video/3gpp'],
    ['3g2', 'video/3gpp2'],
    ['ts', 'video/mp2t'],
    ['mts', 'video/mp2t'],
    ['m2ts', 'video/mp2t']
  ])

  /**
   * 从文件路径提取扩展名
   */
  private static extractExtension(filePath: string): string {
    const lastDotIndex = filePath.lastIndexOf('.')
    if (lastDotIndex === -1) return ''

    return filePath.slice(lastDotIndex + 1).toLowerCase()
  }

  /**
   * 检测文件格式信息
   */
  private static detectFileFormat(filePath: string): FileFormatInfo {
    const extension = this.extractExtension(filePath)
    const formatInfo = this.VIDEO_EXTENSIONS.get(extension)

    if (!formatInfo) {
      return {
        extension,
        containerFormat: 'Unknown',
        isCommonVideoFormat: false,
        confidence: 0
      }
    }

    return {
      extension,
      containerFormat: formatInfo.containerFormat,
      isCommonVideoFormat: formatInfo.common,
      confidence: formatInfo.confidence
    }
  }

  /**
   * 检测 MIME 类型支持性
   */
  private static detectMimeTypeSupport(extension: string): MimeTypeInfo {
    const mimeType = this.MIME_TYPE_MAPPING.get(extension) || `video/${extension}`

    // 使用 HTML5 video 元素检测 MIME 类型支持
    const video = document.createElement('video')
    const supportLevel = video.canPlayType(mimeType)

    return {
      mimeType,
      browserSupported: supportLevel === 'probably' || supportLevel === 'maybe',
      supportLevel: supportLevel || 'no'
    }
  }

  /**
   * 基于播放错误分析格式问题
   */
  public static analyzePlaybackError(
    error: MediaError | null,
    filePath: string
  ): { errorType: ExtendedErrorType; needsTranscode: boolean; errorMessage: string } {
    if (!error) {
      return {
        errorType: 'unknown',
        needsTranscode: false,
        errorMessage: '无错误信息'
      }
    }

    const fileFormat = this.detectFileFormat(filePath)

    logger.debug('分析播放错误', {
      errorCode: error.code,
      errorMessage: error.message,
      filePath,
      fileFormat
    })

    switch (error.code) {
      case MediaError.MEDIA_ERR_DECODE:
        // 解码错误通常表示编解码器不兼容
        if (fileFormat.extension === 'mkv' || fileFormat.extension === 'avi') {
          return {
            errorType: 'codec-unsupported',
            needsTranscode: true,
            errorMessage: `${fileFormat.containerFormat} 容器中的编解码器可能不受支持`
          }
        }
        return {
          errorType: 'decode-error',
          needsTranscode: true,
          errorMessage: '视频解码错误，可能需要转码'
        }

      case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
        // 源不支持 - 可能是格式或编解码器问题
        if (fileFormat.confidence < 0.5) {
          return {
            errorType: 'unsupported-format',
            needsTranscode: true,
            errorMessage: `${fileFormat.containerFormat} 格式可能不受支持`
          }
        }

        // 常见格式但不支持，很可能是编解码器问题
        if (fileFormat.extension === 'mp4' || fileFormat.extension === 'mkv') {
          return {
            errorType: 'codec-unsupported',
            needsTranscode: true,
            errorMessage: '视频编解码器不受支持，可能包含 H.265/HEVC 或高级音频格式'
          }
        }

        return {
          errorType: 'unsupported-format',
          needsTranscode: true,
          errorMessage: `${fileFormat.containerFormat} 格式需要转码`
        }

      case MediaError.MEDIA_ERR_NETWORK:
        return {
          errorType: 'network-error',
          needsTranscode: false,
          errorMessage: '网络错误，无法加载视频'
        }

      case MediaError.MEDIA_ERR_ABORTED:
        return {
          errorType: 'unknown',
          needsTranscode: false,
          errorMessage: '视频加载被中断'
        }

      default:
        return {
          errorType: 'unknown',
          needsTranscode: false,
          errorMessage: error.message || '未知播放错误'
        }
    }
  }

  /**
   * 快速格式检测 - 仅基于文件扩展名和 MIME 类型
   */
  public static async quickDetection(filePath: string): Promise<VideoFormatDetectionResult> {
    logger.debug('执行快速格式检测', { filePath })

    const fileFormat = this.detectFileFormat(filePath)
    const mimeType = this.detectMimeTypeSupport(fileFormat.extension)

    // 基于置信度和浏览器支持性决定是否需要转码
    const needsTranscode = fileFormat.confidence < 0.8 || !mimeType.browserSupported

    const result: VideoFormatDetectionResult = {
      fileFormat,
      mimeType,
      codecCompatibility: null,
      needsTranscode,
      recommendedPlayerType: needsTranscode ? 'hls' : 'native',
      detectionLevel: 'quick'
    }

    logger.debug('快速检测完成', result)
    return result
  }

  /**
   * 标准格式检测 - 包含编解码器兼容性检测
   */
  public static async standardDetection(filePath: string): Promise<VideoFormatDetectionResult> {
    logger.debug('执行标准格式检测', { filePath })

    const fileFormat = this.detectFileFormat(filePath)
    const mimeType = this.detectMimeTypeSupport(fileFormat.extension)

    // 执行编解码器兼容性检测
    let codecCompatibility: CodecCompatibilityResult | null = null
    try {
      codecCompatibility = await CodecCompatibilityChecker.checkCompatibility(filePath)
    } catch (error) {
      logger.warn('编解码器兼容性检测失败', {
        filePath,
        error: error instanceof Error ? error.message : String(error)
      })
    }

    // 综合决定是否需要转码
    const needsTranscode =
      codecCompatibility?.needsTranscode ??
      (fileFormat.confidence < 0.8 || !mimeType.browserSupported)

    // 生成错误信息
    let errorType: ExtendedErrorType | undefined
    let errorMessage: string | undefined

    if (needsTranscode && codecCompatibility) {
      errorType = CodecCompatibilityChecker.getErrorTypeFromCompatibility(codecCompatibility)
      errorMessage = CodecCompatibilityChecker.generateErrorMessage(codecCompatibility)
    }

    const result: VideoFormatDetectionResult = {
      fileFormat,
      mimeType,
      codecCompatibility,
      needsTranscode,
      recommendedPlayerType: needsTranscode ? 'hls' : 'native',
      errorType,
      errorMessage,
      detectionLevel: 'standard'
    }

    logger.info('标准检测完成', result)
    return result
  }

  /**
   * 深度格式检测 - 包含详细的媒体信息分析
   */
  public static async deepDetection(filePath: string): Promise<VideoFormatDetectionResult> {
    logger.debug('执行深度格式检测', { filePath })

    // 先执行标准检测
    const standardResult = await this.standardDetection(filePath)

    // 如果标准检测已经表明需要转码，并且有详细的编解码器信息，就不需要额外处理
    if (standardResult.codecCompatibility && standardResult.needsTranscode) {
      return {
        ...standardResult,
        detectionLevel: 'deep'
      }
    }

    // 如果标准检测无法确定，尝试获取更多媒体信息
    try {
      const videoInfo: FFmpegVideoInfo | null = await window.api.mediainfo.getVideoInfo(filePath)

      if (videoInfo) {
        logger.debug('获取到详细媒体信息', {
          videoInfo: {
            duration: videoInfo.duration,
            resolution: videoInfo.resolution,
            bitrate: videoInfo.bitrate,
            videoCodec: videoInfo.videoCodec,
            audioCodec: videoInfo.audioCodec
          }
        })

        // 基于详细信息重新评估兼容性
        const updatedCompatibility: CodecCompatibilityResult = {
          videoSupported: standardResult.codecCompatibility?.videoSupported ?? true,
          audioSupported: standardResult.codecCompatibility?.audioSupported ?? true,
          needsTranscode: standardResult.needsTranscode,
          incompatibilityReasons: standardResult.codecCompatibility?.incompatibilityReasons ?? [],
          detectedCodecs: {
            video: videoInfo.videoCodec,
            audio: videoInfo.audioCodec
          }
        }

        return {
          ...standardResult,
          codecCompatibility: updatedCompatibility,
          detectionLevel: 'deep'
        }
      }
    } catch (error) {
      logger.warn('深度检测获取媒体信息失败', {
        filePath,
        error: error instanceof Error ? error.message : String(error)
      })
    }

    return {
      ...standardResult,
      detectionLevel: 'deep'
    }
  }

  /**
   * 智能格式检测 - 根据文件大小和扩展名自动选择检测级别
   */
  public static async smartDetection(filePath: string): Promise<VideoFormatDetectionResult> {
    const fileFormat = this.detectFileFormat(filePath)

    // 高兼容性格式使用快速检测
    if (fileFormat.confidence >= 0.9 && fileFormat.isCommonVideoFormat) {
      return this.quickDetection(filePath)
    }

    // 中等兼容性格式使用标准检测
    if (fileFormat.confidence >= 0.6) {
      return this.standardDetection(filePath)
    }

    // 低兼容性或未知格式使用深度检测
    return this.deepDetection(filePath)
  }
}

export default VideoFormatDetector
