/**
 * 性能监控工具类
 * 用于统一管理性能日志记录和分析
 */

// TODO: 已迁移至 @shared/utils/PerformanceMonitor

import { loggerService } from '@logger'

const logger = loggerService.withContext('PerformanceMonitor')

export interface PerformanceMetric {
  name: string
  startTime: number
  endTime?: number
  duration?: number
  metadata?: Record<string, any>
}

export interface PerformanceReport {
  totalDuration: number
  metrics: PerformanceMetric[]
  bottlenecks: PerformanceMetric[]
  summary: Record<string, number>
}

/**
 * 性能监控器类
 */
export class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric> = new Map()
  private startTime: number
  private context: string

  constructor(context: string) {
    this.context = context
    this.startTime = performance.now()
    logger.info(`🚀 开始性能监控: ${context}`)
  }

  /**
   * 开始计时一个操作
   */
  startTiming(name: string, metadata?: Record<string, any>): void {
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
   */
  endTiming(name: string, metadata?: Record<string, any>): number {
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
      总耗时: `${totalDuration.toFixed(2)}ms`,
      操作数量: metrics.length,
      性能瓶颈: bottlenecks.length,
      详细统计: Object.fromEntries(
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
   */
  finish(bottleneckThreshold?: number): PerformanceReport {
    const report = this.getReport(bottleneckThreshold)
    logger.info(`🏁 性能监控完成: ${this.context}, 总耗时: ${report.totalDuration.toFixed(2)}ms`)
    return report
  }

  /**
   * 获取单个操作的耗时
   */
  getDuration(name: string): number | undefined {
    return this.metrics.get(name)?.duration
  }

  /**
   * 检查是否存在性能瓶颈
   */
  hasBottlenecks(threshold: number = 100): boolean {
    return Array.from(this.metrics.values()).some((m) => (m.duration || 0) > threshold)
  }

  /**
   * 清除所有计时数据
   */
  clear(): void {
    this.metrics.clear()
    this.startTime = performance.now()
    logger.info(`🧹 清除性能监控数据: ${this.context}`)
  }
}

/**
 * 创建性能监控器的便捷函数
 */
export function createPerformanceMonitor(context: string): PerformanceMonitor {
  return new PerformanceMonitor(context)
}

/**
 * 装饰器：自动监控异步函数的性能
 */
export function monitorPerformance(name?: string) {
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
 * 简单的性能计时工具函数
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
