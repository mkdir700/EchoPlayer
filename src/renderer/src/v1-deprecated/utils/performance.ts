/**
 * 性能监控工具函数
 */

interface PerformanceMetrics {
  name: string
  startTime: number
  endTime?: number
  duration?: number
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetrics> = new Map()
  private isEnabled: boolean = process.env.NODE_ENV === 'development'

  /**
   * 开始性能测量
   */
  start(name: string): void {
    if (!this.isEnabled) return

    this.metrics.set(name, {
      name,
      startTime: performance.now()
    })
  }

  /**
   * 结束性能测量
   */
  end(name: string): number | null {
    if (!this.isEnabled) return null

    const metric = this.metrics.get(name)
    if (!metric) {
      console.warn(`Performance metric "${name}" not found`)
      return null
    }

    const endTime = performance.now()
    const duration = endTime - metric.startTime

    metric.endTime = endTime
    metric.duration = duration

    console.log(`⏱️ ${name}: ${duration.toFixed(2)}ms`)

    return duration
  }

  /**
   * 测量函数执行时间
   */
  measure<T>(name: string, fn: () => T): T {
    if (!this.isEnabled) return fn()

    this.start(name)
    const result = fn()
    this.end(name)

    return result
  }

  /**
   * 测量异步函数执行时间
   */
  async measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    if (!this.isEnabled) return fn()

    this.start(name)
    const result = await fn()
    this.end(name)

    return result
  }

  /**
   * 获取所有性能指标
   */
  getMetrics(): PerformanceMetrics[] {
    return Array.from(this.metrics.values())
  }

  /**
   * 清除所有性能指标
   */
  clear(): void {
    this.metrics.clear()
  }

  /**
   * 启用/禁用性能监控
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled
  }
}

// 创建全局性能监控实例
export const performanceMonitor = new PerformanceMonitor()

/**
 * 防抖函数 - 优化版本
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number,
  immediate = false
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return function executedFunction(...args: Parameters<T>) {
    const later = (): void => {
      timeout = null
      if (!immediate) func(...args)
    }

    const callNow = immediate && !timeout

    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(later, wait)

    if (callNow) func(...args)
  }
}

/**
 * 节流函数 - 优化版本
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

/**
 * 检查是否为慢设备
 */
export function isSlowDevice(): boolean {
  // 检查硬件并发数
  const cores = navigator.hardwareConcurrency || 1
  if (cores <= 2) return true

  // 检查内存（如果可用）
  const memory = (navigator as unknown as { deviceMemory?: number }).deviceMemory
  if (memory && memory <= 2) return true

  // 检查连接速度（如果可用）
  const connection = (navigator as unknown as { connection?: { effectiveType?: string } })
    .connection
  if (
    connection &&
    connection.effectiveType &&
    ['slow-2g', '2g', '3g'].includes(connection.effectiveType)
  ) {
    return true
  }

  return false
}

/**
 * 获取设备性能等级
 */
export function getDevicePerformanceLevel(): 'low' | 'medium' | 'high' {
  const cores = navigator.hardwareConcurrency || 1
  const memory = (navigator as unknown as { deviceMemory?: number }).deviceMemory || 4

  if (cores <= 2 || memory <= 2) return 'low'
  if (cores <= 4 || memory <= 4) return 'medium'
  return 'high'
}
