/**
 * 媒体格式解析策略工具
 * 根据文件特征智能选择最优的解析器
 */

import type { FileMetadata } from '@shared/types/database'

export type ParserType = 'remotion' | 'ffmpeg'
export type ParserStrategy = 'remotion-first' | 'ffmpeg-first' | 'remotion-only' | 'ffmpeg-only'

export interface FormatAnalysis {
  strategy: ParserStrategy
  confidence: number
  reasoning: string
  estimatedTime: number // 预估解析时间（毫秒）
}

/**
 * 媒体格式策略分析器
 */
export class MediaFormatStrategy {
  // 高兼容性格式（Remotion 表现好）
  private static readonly HIGH_COMPATIBILITY_FORMATS = new Set(['.mp4', '.mov', '.m4v', '.webm'])

  // 复杂格式（可能需要 FFmpeg）
  private static readonly COMPLEX_FORMATS = new Set([
    '.avi',
    '.mkv',
    '.wmv',
    '.flv',
    '.f4v',
    '.vob',
    '.ogv',
    '.3gp',
    '.3g2',
    '.asf',
    '.rm',
    '.rmvb'
  ])

  // 大文件阈值
  private static readonly LARGE_FILE_THRESHOLD = 1024 * 1024 * 1024 // 1GB
  private static readonly MEDIUM_FILE_THRESHOLD = 500 * 1024 * 1024 // 500MB

  // 预估解析时间（毫秒）
  private static readonly TIME_ESTIMATES = {
    remotion: {
      small: 200, // < 500MB
      medium: 800, // 500MB - 1GB
      large: 2000 // > 1GB
    },
    ffmpeg: {
      small: 1000, // < 500MB
      medium: 3000, // 500MB - 1GB
      large: 8000 // > 1GB
    }
  }

  /**
   * 分析文件并推荐解析策略
   */
  static analyzeFile(file: FileMetadata): FormatAnalysis {
    const ext = file.ext.toLowerCase()
    const fileSize = file.size

    // 获取文件大小级别
    const sizeCategory = this.getSizeCategory(fileSize)

    // 基于格式的初始策略
    let strategy: ParserStrategy = 'remotion-first'
    let confidence = 0.7
    let reasoning = ''

    if (this.HIGH_COMPATIBILITY_FORMATS.has(ext)) {
      // 高兼容性格式，优先使用 Remotion
      strategy = 'remotion-first'
      confidence = 0.9
      reasoning = `${ext} 格式通常与 Remotion 兼容性好`

      // 但如果是超大文件，考虑直接用 FFmpeg
      if (sizeCategory === 'large') {
        strategy = 'ffmpeg-first'
        confidence = 0.8
        reasoning = `${ext} 格式但文件过大 (${this.formatFileSize(fileSize)})，FFmpeg 处理大文件更稳定`
      }
    } else if (this.COMPLEX_FORMATS.has(ext)) {
      // 复杂格式，优先使用 FFmpeg
      strategy = 'ffmpeg-first'
      confidence = 0.85
      reasoning = `${ext} 格式较复杂，FFmpeg 兼容性更好`
    } else {
      // 未知格式，使用默认策略
      strategy = 'remotion-first'
      confidence = 0.6
      reasoning = `${ext} 格式未知，尝试 Remotion 优先策略`
    }

    // 计算预估时间
    const estimatedTime = this.estimateParsingTime(strategy, sizeCategory)

    return {
      strategy,
      confidence,
      reasoning,
      estimatedTime
    }
  }

  /**
   * 获取文件大小类别
   */
  private static getSizeCategory(fileSize: number): 'small' | 'medium' | 'large' {
    if (fileSize < this.MEDIUM_FILE_THRESHOLD) {
      return 'small'
    } else if (fileSize < this.LARGE_FILE_THRESHOLD) {
      return 'medium'
    } else {
      return 'large'
    }
  }

  /**
   * 预估解析时间
   */
  private static estimateParsingTime(
    strategy: ParserStrategy,
    sizeCategory: 'small' | 'medium' | 'large'
  ): number {
    switch (strategy) {
      case 'remotion-first':
        // Remotion 优先，失败后 FFmpeg fallback
        return (
          this.TIME_ESTIMATES.remotion[sizeCategory] +
          this.TIME_ESTIMATES.ffmpeg[sizeCategory] * 0.3
        )

      case 'ffmpeg-first':
        // FFmpeg 优先，通常不需要 fallback
        return this.TIME_ESTIMATES.ffmpeg[sizeCategory]

      case 'remotion-only':
        return this.TIME_ESTIMATES.remotion[sizeCategory]

      case 'ffmpeg-only':
        return this.TIME_ESTIMATES.ffmpeg[sizeCategory]

      default:
        return this.TIME_ESTIMATES.remotion[sizeCategory]
    }
  }

  /**
   * 格式化文件大小显示
   */
  private static formatFileSize(bytes: number): string {
    if (bytes < 1024 * 1024) {
      return `${Math.round(bytes / 1024)}KB`
    } else if (bytes < 1024 * 1024 * 1024) {
      return `${Math.round(bytes / (1024 * 1024))}MB`
    } else {
      return `${Math.round((bytes / (1024 * 1024 * 1024)) * 10) / 10}GB`
    }
  }

  /**
   * 根据策略获取解析器优先级列表
   */
  static getParserPriority(strategy: ParserStrategy): ParserType[] {
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
   * 检查策略是否允许 fallback
   */
  static allowsFallback(strategy: ParserStrategy): boolean {
    return strategy === 'remotion-first' || strategy === 'ffmpeg-first'
  }
}
