// 渲染进程日志工具
// 通过 electron-log 的渲染进程模块记录日志

// 日志级别类型
type LogLevel = 'debug' | 'info' | 'warn' | 'error'

// 用户操作详情类型
interface UserActionDetails {
  [key: string]: unknown
}

// 组件渲染详情类型
interface RenderDetails {
  component: string
  props?: Record<string, unknown>
  state?: Record<string, unknown>
  [key: string]: unknown
}

// 性能监控详情类型
interface PerformanceDetails {
  operation: string
  duration: number
  startTime: number
  endTime: number
  [key: string]: unknown
}

// 渲染进程日志工具类
export class RendererLogger {
  private static isElectron = typeof window !== 'undefined' && window.api

  // 组件渲染日志节流缓存
  private static componentRenderCache = new Map<string, number>()
  private static readonly COMPONENT_RENDER_THROTTLE_MS = 100 // 100ms内同一组件只记录一次

  /**
   * 清理数据，移除不可序列化的属性 - 优化版本，避免深度递归阻塞
   */
  private static sanitizeData(data: unknown, depth = 0, maxDepth = 3): unknown {
    // 限制递归深度，防止深度递归导致阻塞
    if (depth > maxDepth) {
      return '[Max depth exceeded]'
    }

    if (data === null || data === undefined) {
      return data
    }

    if (typeof data === 'function') {
      return '[Function]'
    }

    if (data instanceof Error) {
      return {
        name: data.name,
        message: data.message,
        stack: data.stack
      }
    }

    if (typeof data === 'object') {
      if (data instanceof Date) {
        return data.toISOString()
      }

      if (Array.isArray(data)) {
        // 限制数组长度，避免处理过大的数组
        const maxArrayLength = 10
        const slicedArray = data.slice(0, maxArrayLength)
        const sanitized = slicedArray.map((item) => this.sanitizeData(item, depth + 1, maxDepth))
        if (data.length > maxArrayLength) {
          sanitized.push(`[... ${data.length - maxArrayLength} more items]`)
        }
        return sanitized
      }

      // 检查是否是React Ref对象
      if ('current' in data && Object.keys(data).length === 1) {
        return '[React.RefObject]'
      }

      // DOM元素处理
      if (data instanceof HTMLElement) {
        return `[HTMLElement: ${data.tagName}]`
      }

      // React组件或复杂对象的简化处理
      if ('$$typeof' in data || '_owner' in data || 'type' in data) {
        return '[React.Element]'
      }

      // 普通对象 - 限制属性数量
      const sanitized: Record<string, unknown> = {}
      const keys = Object.keys(data)
      const maxKeys = 20 // 限制属性数量

      for (let i = 0; i < Math.min(keys.length, maxKeys); i++) {
        const key = keys[i]
        const value = (data as Record<string, unknown>)[key]

        // 跳过函数属性
        if (typeof value === 'function') {
          sanitized[key] = '[Function]'
        } else if (
          key.toLowerCase().includes('ref') &&
          typeof value === 'object' &&
          value !== null
        ) {
          // 跳过包含ref的属性
          sanitized[key] = '[React.RefObject]'
        } else {
          try {
            sanitized[key] = this.sanitizeData(value, depth + 1, maxDepth)
          } catch {
            sanitized[key] = '[Non-serializable]'
          }
        }
      }

      if (keys.length > maxKeys) {
        sanitized['...'] = `[${keys.length - maxKeys} more properties]`
      }

      return sanitized
    }

    return data
  }

  /**
   * 通过主进程记录日志 - 非阻塞版本
   */
  private static logToMain(level: LogLevel, message: string, data?: unknown): void {
    if (this.isElectron && window.api?.log) {
      // 使用setTimeout将日志操作推迟到下一个事件循环，避免阻塞当前执行
      setTimeout(async () => {
        try {
          const sanitizedData = this.sanitizeData(data)
          await window.api.log(level, message, sanitizedData)
        } catch (error) {
          console.error('记录日志到主进程失败:', error)
          // 作为备选方案，只记录消息，不传递数据
          try {
            await window.api.log(level, `${message} [数据序列化失败]`)
          } catch {
            // 如果连基本消息都无法发送，则静默失败
          }
        }
      }, 0)
    }
  }

  /**
   * 记录调试信息
   */
  static debug(message: string, data?: unknown): void {
    console.debug(`[DEBUG] ${message}`, data)
    this.logToMain('debug', `[渲染进程] ${message}`, data)
  }

  /**
   * 记录普通信息
   */
  static info(message: string, data?: unknown): void {
    console.info(`[INFO] ${message}`, data)
    this.logToMain('info', `[渲染进程] ${message}`, data)
  }

  /**
   * 记录警告信息
   */
  static warn(message: string, data?: unknown): void {
    console.warn(`[WARN] ${message}`, data)
    this.logToMain('warn', `[渲染进程] ${message}`, data)
  }

  /**
   * 记录错误信息
   */
  static error(message: string, error?: Error | unknown, data?: unknown): void {
    const errorData = {
      message,
      error:
        error instanceof Error
          ? {
              name: error.name,
              message: error.message,
              stack: error.stack
            }
          : error,
      data,
      timestamp: new Date().toISOString(),
      url: window.location.href
    }

    console.error(`[ERROR] ${message}`, errorData)
    this.logToMain('error', `[渲染进程错误] ${message}`, errorData)
  }

  /**
   * 记录用户操作（UI交互）
   */
  static userInteraction(action: string, details?: UserActionDetails): void {
    const logData = {
      action,
      details,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent
    }

    console.info(`[用户交互] ${action}`, logData)
    this.logToMain('info', `[用户交互] ${action}`, logData)
  }

  /**
   * 记录组件渲染信息 - 优化版本，带节流和简化数据
   */
  static componentRender(details: RenderDetails): void {
    const componentKey = details.component
    const now = Date.now()

    // 检查节流
    const lastLogTime = this.componentRenderCache.get(componentKey)
    if (lastLogTime && now - lastLogTime < this.COMPONENT_RENDER_THROTTLE_MS) {
      return // 跳过这次日志记录
    }

    // 更新缓存
    this.componentRenderCache.set(componentKey, now)

    // 简化日志数据，只包含必要信息
    const logData = {
      component: details.component,
      // 简化props，只记录基本类型和字符串的前50个字符
      props: details.props ? this.simplifyProps(details.props) : undefined,
      timestamp: new Date().toISOString()
    }

    console.debug(`[组件渲染] ${details.component}`, logData)
    this.logToMain('debug', `[组件渲染] ${details.component}`, logData)
  }

  /**
   * 简化props，只保留基本信息，避免复杂对象处理
   */
  private static simplifyProps(props: Record<string, unknown>): Record<string, unknown> {
    const simplified: Record<string, unknown> = {}
    let propCount = 0
    const maxProps = 5 // 最多记录5个属性

    for (const [key, value] of Object.entries(props)) {
      if (propCount >= maxProps) {
        simplified['...'] = `[${Object.keys(props).length - maxProps} more props]`
        break
      }

      if (typeof value === 'string') {
        simplified[key] = value.length > 50 ? value.substring(0, 50) + '...' : value
      } else if (typeof value === 'number' || typeof value === 'boolean') {
        simplified[key] = value
      } else if (value === null || value === undefined) {
        simplified[key] = value
      } else if (typeof value === 'function') {
        simplified[key] = '[Function]'
      } else if (value instanceof HTMLElement) {
        simplified[key] = `[HTMLElement: ${value.tagName}]`
      } else {
        simplified[key] = '[Object]'
      }

      propCount++
    }

    return simplified
  }

  /**
   * 记录性能监控数据
   */
  static performance(details: PerformanceDetails): void {
    const logData = {
      ...details,
      timestamp: new Date().toISOString(),
      url: window.location.href
    }

    const level = details.duration > 1000 ? 'warn' : 'info'
    console[level](`[性能] ${details.operation} 耗时: ${details.duration}ms`, logData)
    this.logToMain(level, `[性能监控] ${details.operation}`, logData)
  }

  /**
   * 记录视频播放相关操作
   */
  static videoAction(
    action: string,
    details?: {
      currentTime?: number
      duration?: number
      playbackRate?: number
      volume?: number
      videoSrc?: string
      [key: string]: unknown
    }
  ): void {
    const logData = {
      action,
      details,
      timestamp: new Date().toISOString()
    }

    console.info(`[视频操作] ${action}`, logData)
    this.logToMain('info', `[视频操作] ${action}`, logData)
  }

  /**
   * 记录字幕相关操作
   */
  static subtitleAction(
    action: string,
    details?: {
      subtitleIndex?: number
      subtitleText?: string
      displayMode?: string
      [key: string]: unknown
    }
  ): void {
    const logData = {
      action,
      details,
      timestamp: new Date().toISOString()
    }

    console.info(`[字幕操作] ${action}`, logData)
    this.logToMain('info', `[字幕操作] ${action}`, logData)
  }

  /**
   * 记录页面导航
   */
  static pageNavigation(from: string, to: string, details?: unknown): void {
    const logData = {
      from,
      to,
      details,
      timestamp: new Date().toISOString()
    }

    console.info(`[页面导航] ${from} -> ${to}`, logData)
    this.logToMain('info', `[页面导航] ${from} -> ${to}`, logData)
  }

  /**
   * 性能计时器
   */
  static startPerformanceTimer(operation: string): () => void {
    const startTime = performance.now()

    return () => {
      const endTime = performance.now()
      const duration = endTime - startTime

      this.performance({
        operation,
        duration,
        startTime,
        endTime
      })
    }
  }

  /**
   * 异步操作包装器（自动记录性能和错误）
   */
  static async wrapAsync<T>(operation: string, asyncFn: () => Promise<T>): Promise<T> {
    const endTimer = this.startPerformanceTimer(operation)

    try {
      this.debug(`开始异步操作: ${operation}`)
      const result = await asyncFn()
      this.debug(`异步操作成功: ${operation}`)
      return result
    } catch (error) {
      this.error(`异步操作失败: ${operation}`, error)
      throw error
    } finally {
      endTimer()
    }
  }
}

// 全局错误捕获
if (typeof window !== 'undefined') {
  // 捕获未处理的 Promise 拒绝
  window.addEventListener('unhandledrejection', (event) => {
    RendererLogger.error('未处理的 Promise 拒绝', event.reason, {
      promise: event.promise,
      url: window.location.href
    })
  })

  // 捕获 JavaScript 错误
  window.addEventListener('error', (event) => {
    RendererLogger.error('JavaScript 错误', event.error, {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      url: window.location.href
    })
  })
}

export default RendererLogger
