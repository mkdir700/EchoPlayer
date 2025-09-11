/**
 * @fileoverview 性能监控工具类 - 提供精确的性能计时、指标收集和瓶颈分析功能
 *
 * @description 这个模块提供了一套完整的性能监控解决方案，包括：
 * - PerformanceMonitor 类：核心性能监控器
 * - 便捷函数：createPerformanceMonitor、measureAsync、measureSync
 * - 装饰器：monitorPerformance（用于自动监控方法性能）
 * - 类型定义：PerformanceMetric、PerformanceReport
 *
 * @example
 * // 基础使用
 * import { PerformanceMonitor, measureAsync } from '@/utils/PerformanceMonitor'
 *
 * const monitor = new PerformanceMonitor('VideoProcessing')
 * monitor.startTiming('encode')
 * // ... 执行操作
 * monitor.endTiming('encode')
 * const report = monitor.finish()
 *
 * @example
 * // 使用便捷函数
 * const { result, duration } = await measureAsync(
 *   'fetchData',
 *   () => fetch('/api/data').then(r => r.json())
 * )
 *
 * @example
 * // 使用装饰器
 * class Service {
 *   @monitorPerformance()
 *   async processData() {
 *     // 自动监控这个方法的性能
 *   }
 * }
 *
 * @author mkdir700
 * @since 1.0.0
 */

import { loggerService } from '@logger'

const logger = loggerService.withContext('PerformanceMonitor')

/**
 * 性能指标接口
 *
 * @interface PerformanceMetric
 * @description 描述单个性能测量操作的详细信息
 *
 * @example
 * const metric: PerformanceMetric = {
 *   name: 'videoEncode',
 *   startTime: 1640995200000,
 *   endTime: 1640995205000,
 *   duration: 5000,
 *   metadata: { resolution: '1080p', codec: 'h264' }
 * }
 */
export interface PerformanceMetric {
  /** 操作名称 */
  name: string
  /** 开始时间戳（毫秒） */
  startTime: number
  /** 结束时间戳（毫秒），可选 */
  endTime?: number
  /** 操作耗时（毫秒），可选 */
  duration?: number
  /** 附加元数据，可选 */
  metadata?: Record<string, any>
}

/**
 * 性能报告接口
 *
 * @interface PerformanceReport
 * @description 包含完整的性能分析结果
 *
 * @example
 * const report: PerformanceReport = {
 *   totalDuration: 15234,
 *   metrics: [metric1, metric2, metric3],
 *   bottlenecks: [slowMetric],
 *   summary: {
 *     'videoEncode': 5000,
 *     'audioProcess': 2000,
 *     'fileWrite': 1500
 *   }
 * }
 */
export interface PerformanceReport {
  /** 总耗时（毫秒） */
  totalDuration: number
  /** 所有性能指标 */
  metrics: PerformanceMetric[]
  /** 性能瓶颈列表（超过阈值的操作） */
  bottlenecks: PerformanceMetric[]
  /** 操作耗时汇总 */
  summary: Record<string, number>
}

/**
 * 性能监控器类 - 用于监控和分析代码性能
 *
 * @class PerformanceMonitor
 * @description 提供精确的性能计时、指标收集和瓶颈分析功能
 *
 * @example
 * // 基本使用
 * const monitor = new PerformanceMonitor('VideoProcessor')
 *
 * monitor.startTiming('loadVideo')
 * await loadVideoFile()
 * monitor.endTiming('loadVideo')
 *
 * const report = monitor.finish()
 * console.log(`总耗时: ${report.totalDuration}ms`)
 *
 * @example
 * // 复杂场景监控
 * const monitor = new PerformanceMonitor('DataProcessing')
 *
 * monitor.startTiming('fetchData', { url: 'api/data' })
 * const data = await fetchData()
 * monitor.endTiming('fetchData', { records: data.length })
 *
 * monitor.startTiming('processData')
 * const processed = processData(data)
 * monitor.endTiming('processData', { operations: processed.operations })
 *
 * // 获取报告并检查瓶颈
 * const report = monitor.getReport(50) // 50ms阈值
 * if (monitor.hasBottlenecks(50)) {
 *   console.warn('检测到性能瓶颈:', report.bottlenecks)
 * }
 *
 * @example
 * // 记录已知耗时的操作
 * const monitor = new PerformanceMonitor('FileIO')
 *
 * // 记录外部测量的耗时
 * monitor.recordTiming('fileRead', 125, { size: '2MB' })
 * monitor.recordTiming('fileWrite', 98, { size: '1.5MB' })
 *
 * const summary = monitor.getReport().summary
 * console.log('IO操作汇总:', summary)
 */
export class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric> = new Map()
  private startTime: number
  private context: string

  /**
   * 创建性能监控器实例
   *
   * @param {string} context - 监控上下文名称，用于日志标识
   *
   * @example
   * const monitor = new PerformanceMonitor('VideoImport')
   */
  constructor(context: string) {
    this.context = context
    this.startTime = performance.now()
    logger.info(`🚀 开始性能监控: ${context}`)
  }

  /**
   * 开始计时一个操作
   *
   * @param {string | Function} nameOrFunction - 操作名称或函数引用
   * @param {Record<string, any>} [metadata] - 可选的元数据
   *
   * @example
   * // 使用字符串名称
   * monitor.startTiming('videoEncode', { resolution: '1080p', codec: 'h264' })
   *
   * @example
   * // 使用函数引用，自动提取函数名
   * function processVideo()
   * monitor.startTiming(processVideo, { type: 'h264' })
   *
   * @example
   * // 使用方法引用，自动提取方法名
   * class VideoProcessor {
   *   encodeVideo()
   * }
   * const processor = new VideoProcessor()
   * monitor.startTiming(processor.encodeVideo.bind(processor), { quality: 'high' })
   */
  startTiming(
    nameOrFunction: string | ((...args: any[]) => any),
    metadata?: Record<string, any>
  ): void {
    const name =
      typeof nameOrFunction === 'function' ? nameOrFunction.name || 'anonymous' : nameOrFunction

    const metric: PerformanceMetric = {
      name,
      startTime: performance.now(),
      metadata
    }
    this.metrics.set(name, metric)
    logger.info(`⏱️ 开始计时: ${name}`, metadata)
  }

  /**
   * 结束计时一个操作
   *
   * @param {string | Function} nameOrFunction - 操作名称或函数引用（需与startTiming对应）
   * @param {Record<string, any>} [metadata] - 可选的元数据
   * @returns {number} 操作耗时（毫秒）
   *
   * @example
   * // 使用字符串名称
   * const duration = monitor.endTiming('videoEncode', { outputSize: '2.5MB' })
   * console.log(`编码耗时: ${duration}ms`)
   *
   * @example
   * // 使用函数引用，自动提取函数名
   * function processVideo()
   * monitor.startTiming(processVideo)
   * // ... 执行操作
   * const duration = monitor.endTiming(processVideo, { result: 'success' })
   *
   * @example
   * // 完整的函数监控示例
   * const videoProcessor = {
   *   encodeVideo() {
   *     monitor.startTiming(this.encodeVideo, { input: 'raw.mp4' })
   *     // ... 编码逻辑
   *     monitor.endTiming(this.encodeVideo, { output: 'encoded.mp4' })
   *   }
   * }
   */
  endTiming(
    nameOrFunction: string | ((...args: any[]) => any),
    metadata?: Record<string, any>
  ): number {
    const name =
      typeof nameOrFunction === 'function' ? nameOrFunction.name || 'anonymous' : nameOrFunction

    const metric = this.metrics.get(name)
    if (!metric) {
      logger.warn(`⚠️ 未找到计时器: ${name}`)
      return 0
    }

    const endTime = performance.now()
    const duration = endTime - metric.startTime

    metric.endTime = endTime
    metric.duration = duration
    if (metadata) {
      metric.metadata = { ...metric.metadata, ...metadata }
    }

    logger.info(`✅ 完成计时: ${name}, 耗时: ${duration.toFixed(2)}ms`, {
      ...metric.metadata,
      duration: `${duration.toFixed(2)}ms`
    })

    return duration
  }

  /**
   * 记录一个瞬时操作的耗时
   *
   * @param {string} name - 操作名称
   * @param {number} duration - 耗时（毫秒）
   * @param {Record<string, any>} [metadata] - 可选的元数据
   *
   * @example
   * // 记录外部测量的耗时
   * const externalDuration = await measureExternalOperation()
   * monitor.recordTiming('externalAPI', externalDuration, { api: 'transcription' })
   */
  recordTiming(name: string, duration: number, metadata?: Record<string, any>): void {
    const now = performance.now()
    const metric: PerformanceMetric = {
      name,
      startTime: now - duration,
      endTime: now,
      duration,
      metadata
    }
    this.metrics.set(name, metric)
    logger.info(`📊 记录耗时: ${name}, 耗时: ${duration.toFixed(2)}ms`, {
      ...metadata,
      duration: `${duration.toFixed(2)}ms`
    })
  }

  /**
   * 获取性能报告
   *
   * @param {number} [bottleneckThreshold=100] - 性能瓶颈阈值（毫秒）
   * @returns {PerformanceReport} 性能报告对象
   *
   * @example
   * const report = monitor.getReport(50)
   * console.log(`总耗时: ${report.totalDuration}ms`)
   * console.log(`瓶颈数量: ${report.bottlenecks.length}`)
   * console.log('操作汇总:', report.summary)
   */
  getReport(bottleneckThreshold: number = 100): PerformanceReport {
    const totalDuration = performance.now() - this.startTime
    const metrics = Array.from(this.metrics.values())
    const bottlenecks = metrics.filter((m) => (m.duration || 0) > bottleneckThreshold)

    const summary: Record<string, number> = {}
    metrics.forEach((metric) => {
      if (metric.duration !== undefined) {
        summary[metric.name] = metric.duration
      }
    })

    const report: PerformanceReport = {
      totalDuration,
      metrics,
      bottlenecks,
      summary
    }

    logger.info(`📈 性能报告 - ${this.context}`, {
      totalE: `${totalDuration.toFixed(2)}ms`,
      metric: metrics.length,
      bottlenecks: bottlenecks.length,
      details: Object.fromEntries(
        Object.entries(summary).map(([key, value]) => [key, `${value.toFixed(2)}ms`])
      )
    })

    // 如果有性能瓶颈，记录警告
    if (bottlenecks.length > 0) {
      logger.warn(
        `⚠️ 检测到 ${bottlenecks.length} 个性能瓶颈 (>${bottleneckThreshold}ms):`,
        bottlenecks.map((b) => `${b.name}: ${b.duration?.toFixed(2)}ms`)
      )
    }

    return report
  }

  /**
   * 完成监控并生成报告
   *
   * @param {number} [bottleneckThreshold] - 性能瓶颈阈值（毫秒）
   * @returns {PerformanceReport} 最终性能报告
   *
   * @example
   * // 完成监控并获取报告
   * const finalReport = monitor.finish()
   * if (finalReport.bottlenecks.length > 0) {
   *   console.warn('发现性能瓶颈:', finalReport.bottlenecks)
   * }
   */
  finish(bottleneckThreshold?: number): PerformanceReport {
    const report = this.getReport(bottleneckThreshold)
    logger.info(`🏁 性能监控完成: ${this.context}, 总耗时: ${report.totalDuration.toFixed(2)}ms`)
    return report
  }

  /**
   * 获取单个操作的耗时
   *
   * @param {string} name - 操作名称
   * @returns {number | undefined} 操作耗时（毫秒），如果操作不存在则返回undefined
   *
   * @example
   * const encodeDuration = monitor.getDuration('videoEncode')
   * if (encodeDuration !== undefined) {
   *   console.log(`视频编码耗时: ${encodeDuration}ms`)
   * }
   */
  getDuration(name: string): number | undefined {
    return this.metrics.get(name)?.duration
  }

  /**
   * 检查是否存在性能瓶颈
   *
   * @param {number} [threshold=100] - 性能瓶颈阈值（毫秒）
   * @returns {boolean} 是否存在性能瓶颈
   *
   * @example
   * if (monitor.hasBottlenecks(50)) {
   *   const report = monitor.getReport(50)
   *   console.warn('检测到性能瓶颈:', report.bottlenecks.map(b => b.name))
   * }
   */
  hasBottlenecks(threshold: number = 100): boolean {
    return Array.from(this.metrics.values()).some((m) => (m.duration || 0) > threshold)
  }

  /**
   * 清除所有计时数据
   *
   * @example
   * monitor.clear() // 清除之前的计时数据，重新开始监控
   */
  clear(): void {
    this.metrics.clear()
    this.startTime = performance.now()
    logger.info(`🧹 清除性能监控数据: ${this.context}`)
  }
}

/**
 * 创建性能监控器的便捷函数
 *
 * @param {string} context - 监控上下文名称
 * @returns {PerformanceMonitor} 性能监控器实例
 *
 * @example
 * const monitor = createPerformanceMonitor('MediaProcessing')
 * monitor.startTiming('processVideo')
 * // ... 处理视频
 * monitor.endTiming('processVideo')
 */
export function createPerformanceMonitor(context: string): PerformanceMonitor {
  return new PerformanceMonitor(context)
}

/**
 * 装饰器：自动监控异步函数的性能
 *
 * @param {string} [name] - 自定义监控名称
 * @returns {CallableFunction} 装饰器函数
 *
 * @example
 * class VideoProcessor {
 *   @monitorPerformance('customEncode')
 *   async encodeVideo(inputPath: string) {
 *     // 视频编码逻辑
 *     return encodedVideo
 *   }
 *
 *   @monitorPerformance() // 使用默认名称: VideoProcessor.processAudio
 *   async processAudio() {
 *     // 音频处理逻辑
 *   }
 * }
 */
export function monitorPerformance(name?: string): CallableFunction {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value
    const methodName = name || `${target.constructor.name}.${propertyKey}`

    descriptor.value = async function (...args: any[]) {
      const monitor = createPerformanceMonitor(methodName)
      monitor.startTiming('execution')

      try {
        const result = await originalMethod.apply(this, args)
        monitor.endTiming('execution')
        monitor.finish()
        return result
      } catch (error) {
        monitor.endTiming('execution', { error: true })
        monitor.finish()
        throw error
      }
    }

    return descriptor
  }
}

/**
 * 简单的异步性能计时工具函数
 *
 * @template T
 * @param {string} name - 操作名称
 * @param {() => Promise<T>} operation - 要执行的异步操作
 * @param {string} [context] - 可选的日志上下文
 * @returns {Promise<{result: T, duration: number}>} 包含结果和耗时的对象
 *
 * @example
 * const { result, duration } = await measureAsync(
 *   'fetchUserData',
 *   () => fetch('/api/users').then(r => r.json()),
 *   'UserService'
 * )
 * console.log(`获取用户数据耗时: ${duration}ms, 用户数量: ${result.length}`)
 */
export async function measureAsync<T>(
  name: string,
  operation: () => Promise<T>,
  context?: string
): Promise<{ result: T; duration: number }> {
  const startTime = performance.now()
  const contextLogger = context ? loggerService.withContext(context) : logger

  contextLogger.info(`⏱️ 开始测量: ${name}`)

  try {
    const result = await operation()
    const duration = performance.now() - startTime

    contextLogger.info(`✅ 测量完成: ${name}, 耗时: ${duration.toFixed(2)}ms`)

    return { result, duration }
  } catch (error) {
    const duration = performance.now() - startTime
    contextLogger.error(`❌ 测量失败: ${name}, 耗时: ${duration.toFixed(2)}ms`, error as Error)
    throw error
  }
}

/**
 * 同步操作的性能计时工具函数
 *
 * @template T
 * @param {string} name - 操作名称
 * @param {() => T} operation - 要执行的同步操作
 * @param {string} [context] - 可选的日志上下文
 * @returns {{result: T, duration: number}} 包含结果和耗时的对象
 *
 * @example
 * const { result, duration } = measureSync(
 *   'processArray',
 *   () => largeArray.map(item => processItem(item)),
 *   'DataProcessor'
 * )
 * console.log(`数组处理耗时: ${duration}ms, 处理了 ${result.length} 个项目`)
 */
export function measureSync<T>(
  name: string,
  operation: () => T,
  context?: string
): { result: T; duration: number } {
  const startTime = performance.now()
  const contextLogger = context ? loggerService.withContext(context) : logger

  contextLogger.info(`⏱️ 开始测量: ${name}`)

  try {
    const result = operation()
    const duration = performance.now() - startTime

    contextLogger.info(`✅ 测量完成: ${name}, 耗时: ${duration.toFixed(2)}ms`)

    return { result, duration }
  } catch (error) {
    const duration = performance.now() - startTime
    contextLogger.error(`❌ 测量失败: ${name}, 耗时: ${duration.toFixed(2)}ms`, error as Error)
    throw error
  }
}
