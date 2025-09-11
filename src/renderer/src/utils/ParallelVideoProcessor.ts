/**
 * 并行视频处理工具
 * 优化视频导入流程的并行处理
 */

import { loggerService } from '@logger'
import type { FileMetadata } from '@shared/types/database'

import { type FormatAnalysis, MediaFormatStrategy } from './MediaFormatStrategy'

const logger = loggerService.withContext('ParallelVideoProcessor')

export interface FileValidationResult {
  isValid: boolean
  localPath: string
  fileExists: boolean
  fileSize: number
  error?: string
}

export interface ParserAvailability {
  mediaInfoAvailable: boolean
  ffmpegAvailable: boolean
  recommendedParser: 'mediainfo' | 'ffmpeg'
  error?: string
}

export interface ProcessingContext {
  file: FileMetadata
  validation: FileValidationResult
  parserInfo: ParserAvailability
  formatAnalysis: FormatAnalysis
  processingStartTime: number
}

/**
 * 并行视频处理器
 */
export class ParallelVideoProcessor {
  /**
   * 并行执行文件验证和解析器准备
   */
  static async prepareProcessing(file: FileMetadata): Promise<ProcessingContext> {
    const processingStartTime = performance.now()

    logger.info('🚀 开始并行准备视频处理', {
      fileName: file.name,
      fileSize: `${Math.round(file.size / 1024 / 1024)}MB`
    })

    try {
      // 并行执行三个独立的操作
      const [validation, parserInfo, formatAnalysis] = await Promise.all([
        this.validateFileAsync(file),
        this.checkParserAvailabilityAsync(),
        this.analyzeFormatAsync(file)
      ])

      const preparationTime = performance.now() - processingStartTime

      logger.info('✅ 并行准备完成', {
        fileName: file.name,
        preparationTime: `${preparationTime.toFixed(2)}ms`,
        isValid: validation.isValid,
        recommendedParser: parserInfo.recommendedParser,
        strategy: formatAnalysis.strategy,
        estimatedTime: `${formatAnalysis.estimatedTime}ms`
      })

      return {
        file,
        validation,
        parserInfo,
        formatAnalysis,
        processingStartTime
      }
    } catch (error) {
      const preparationTime = performance.now() - processingStartTime
      logger.error('❌ 并行准备失败', {
        fileName: file.name,
        preparationTime: `${preparationTime.toFixed(2)}ms`,
        error: error instanceof Error ? error.message : String(error)
      })
      throw error
    }
  }

  /**
   * 异步验证文件
   */
  private static async validateFileAsync(file: FileMetadata): Promise<FileValidationResult> {
    const startTime = performance.now()

    try {
      // 路径转换
      const localPath = await this.convertFileUrlToLocalPathAsync(file.path)

      // 检查文件存在性
      const fileExists = await window.api.fs.checkFileExists(localPath)

      if (!fileExists) {
        return {
          isValid: false,
          localPath,
          fileExists: false,
          fileSize: 0,
          error: `文件不存在: ${localPath}`
        }
      }

      // 验证文件大小一致性（可选）
      const actualSize = file.size // 在实际应用中可能需要重新获取

      const validationTime = performance.now() - startTime
      logger.info('📁 文件验证完成', {
        fileName: file.name,
        validationTime: `${validationTime.toFixed(2)}ms`,
        fileExists,
        fileSize: `${Math.round(actualSize / 1024 / 1024)}MB`
      })

      return {
        isValid: true,
        localPath,
        fileExists: true,
        fileSize: actualSize
      }
    } catch (error) {
      const validationTime = performance.now() - startTime
      logger.error('❌ 文件验证失败', {
        fileName: file.name,
        validationTime: `${validationTime.toFixed(2)}ms`,
        error: error instanceof Error ? error.message : String(error)
      })

      return {
        isValid: false,
        localPath: file.path,
        fileExists: false,
        fileSize: 0,
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  /**
   * 异步检查解析器可用性
   */
  private static async checkParserAvailabilityAsync(): Promise<ParserAvailability> {
    const startTime = performance.now()

    try {
      // 并行检查两个解析器
      const [mediaInfoAvailable, ffmpegAvailable] = await Promise.all([
        window.api.mediainfo.checkExists(),
        window.api.ffmpeg.checkExists()
      ])

      const checkTime = performance.now() - startTime

      // 决定推荐的解析器
      let recommendedParser: 'mediainfo' | 'ffmpeg' = 'mediainfo'
      if (!mediaInfoAvailable && ffmpegAvailable) {
        recommendedParser = 'ffmpeg'
      }

      logger.info('🔍 解析器检查完成', {
        checkTime: `${checkTime.toFixed(2)}ms`,
        mediaInfoAvailable,
        ffmpegAvailable,
        recommendedParser
      })

      return {
        mediaInfoAvailable,
        ffmpegAvailable,
        recommendedParser
      }
    } catch (error) {
      const checkTime = performance.now() - startTime
      logger.error('❌ 解析器检查失败', {
        checkTime: `${checkTime.toFixed(2)}ms`,
        error: error instanceof Error ? error.message : String(error)
      })

      return {
        mediaInfoAvailable: false,
        ffmpegAvailable: false,
        recommendedParser: 'ffmpeg',
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  /**
   * 异步分析文件格式
   */
  private static async analyzeFormatAsync(file: FileMetadata): Promise<FormatAnalysis> {
    const startTime = performance.now()

    try {
      const analysis = MediaFormatStrategy.analyzeFile(file)

      const analysisTime = performance.now() - startTime
      logger.info('📊 格式分析完成', {
        fileName: file.name,
        analysisTime: `${analysisTime.toFixed(2)}ms`,
        strategy: analysis.strategy,
        confidence: analysis.confidence,
        reasoning: analysis.reasoning,
        estimatedTime: `${analysis.estimatedTime}ms`
      })

      return analysis
    } catch (error) {
      const analysisTime = performance.now() - startTime
      logger.error('❌ 格式分析失败', {
        fileName: file.name,
        analysisTime: `${analysisTime.toFixed(2)}ms`,
        error: error instanceof Error ? error.message : String(error)
      })

      // 返回默认分析结果
      return {
        strategy: 'remotion-first',
        confidence: 0.5,
        reasoning: '格式分析失败，使用默认策略',
        estimatedTime: 2000
      }
    }
  }

  /**
   * 异步路径转换
   */
  private static async convertFileUrlToLocalPathAsync(inputPath: string): Promise<string> {
    return new Promise((resolve) => {
      // 如果是file://URL，需要转换为本地路径
      if (inputPath.startsWith('file://')) {
        try {
          const url = new URL(inputPath)
          let localPath = decodeURIComponent(url.pathname)

          // Windows路径处理：移除开头的斜杠
          if (process.platform === 'win32' && localPath.startsWith('/')) {
            localPath = localPath.substring(1)
          }

          resolve(localPath)
        } catch (error) {
          logger.warn('路径转换失败，使用原路径', {
            inputPath,
            error: error instanceof Error ? error.message : String(error)
          })
          resolve(inputPath)
        }
      } else {
        resolve(inputPath)
      }
    })
  }

  /**
   * 验证处理上下文的完整性
   */
  static validateContext(context: ProcessingContext): string[] {
    const errors: string[] = []

    if (!context.validation.isValid) {
      errors.push(`文件验证失败: ${context.validation.error}`)
    }

    if (!context.parserInfo.mediaInfoAvailable && !context.parserInfo.ffmpegAvailable) {
      errors.push('没有可用的媒体解析器')
    }

    if (context.formatAnalysis.confidence < 0.3) {
      errors.push('格式分析置信度过低')
    }

    return errors
  }

  /**
   * 获取优化的解析策略
   */
  static getOptimizedStrategy(context: ProcessingContext): {
    useParser: 'mediainfo' | 'ffmpeg'
    allowFallback: boolean
    timeoutMs: number
  } {
    const { parserInfo, formatAnalysis } = context

    // 根据解析器可用性和格式分析调整策略
    let useParser: 'mediainfo' | 'ffmpeg' = 'mediainfo'
    let allowFallback = true
    let timeoutMs = 10000 // 默认10秒超时

    if (formatAnalysis.strategy === 'ffmpeg-first' || !parserInfo.mediaInfoAvailable) {
      useParser = 'ffmpeg'
    }

    // 根据预估时间调整超时
    if (formatAnalysis.estimatedTime > 5000) {
      timeoutMs = Math.max(formatAnalysis.estimatedTime * 2, 15000)
      allowFallback = true // 长时间解析允许fallback
    } else {
      timeoutMs = Math.max(formatAnalysis.estimatedTime * 1.5, 5000)
    }

    return {
      useParser,
      allowFallback,
      timeoutMs
    }
  }
}
