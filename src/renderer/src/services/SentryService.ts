import type { SentryRendererOptions } from '@shared/types/sentry'

import { loggerService } from './Logger'

class SentryRendererService {
  private isInitialized = false
  private sentry: any = null
  private readonly logger = loggerService.withContext('SentryRendererService')

  /**
   * 初始化 Sentry 渲染进程
   */
  async init(): Promise<void> {
    // 固定使用提供的 DSN，不使用环境变量
    const sentryDsn =
      'https://e1ae144a9a63a9bd0034fadcf1fa3c6e@o404286.ingest.us.sentry.io/4510018462482432'

    if (!sentryDsn) {
      this.logger.info('Sentry DSN not provided, skipping initialization')
      return
    }

    try {
      const sentryModule = await import('@sentry/electron/renderer')
      this.sentry = {
        captureException: sentryModule.captureException,
        captureMessage: sentryModule.captureMessage,
        addBreadcrumb: sentryModule.addBreadcrumb,
        configureScope: sentryModule.configureScope
      }

      const getElectronVersion = () => {
        try {
          // 某些构建环境中 renderer 不暴露 process
          const anyProcess: any = typeof process !== 'undefined' ? process : undefined
          return anyProcess?.versions?.electron || 'unknown'
        } catch {
          return 'unknown'
        }
      }

      const getNodeVersion = () => {
        try {
          const anyProcess: any = typeof process !== 'undefined' ? process : undefined
          return anyProcess?.versions?.node || 'unknown'
        } catch {
          return 'unknown'
        }
      }

      const config: SentryRendererOptions = {
        dsn: sentryDsn,
        release: await this.getAppVersion(),
        environment: import.meta.env.MODE,
        sampleRate: this.getSampleRate(),
        debug: import.meta.env.DEV,
        maxBreadcrumbs: 50,
        attachStacktrace: true,
        sendDefaultPii: false,
        captureUnhandledRejections: true,
        captureConsoleIntegration: import.meta.env.DEV,
        captureGlobalErrorHandlers: true,
        beforeSend: this.beforeSend.bind(this),
        beforeBreadcrumb: this.beforeBreadcrumb.bind(this),
        initialScope: {
          tags: {
            component: 'renderer-process',
            window: window.location.href,
            userAgent: navigator.userAgent
          },
          contexts: {
            app: {
              name: 'EchoPlayer',
              version: await this.getAppVersion()
            },
            browser: {
              name: 'Electron',
              version: getElectronVersion()
            },
            runtime: {
              name: 'Node.js',
              version: getNodeVersion()
            }
          }
        }
      }

      sentryModule.init(config)
      this.isInitialized = true
      this.logger.info('Sentry initialized successfully', {
        release: config.release,
        environment: config.environment,
        sampleRate: config.sampleRate
      })

      // 与 loggerService 集成
      this.integrateWithLogger()

      // 监听页面错误
      this.setupErrorHandlers()
    } catch (error) {
      this.logger.error('Failed to initialize Sentry', { error })
    }
  }

  /**
   * 获取应用版本
   */
  private async getAppVersion(): Promise<string> {
    const appInfo = await window.api.getAppInfo()
    return appInfo.version || 'unknown'
  }

  /**
   * 获取采样率配置
   */
  private getSampleRate(): number {
    return import.meta.env.DEV ? 1.0 : 0.1
  }

  /**
   * 数据过滤和隐私保护
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private beforeSend(event: any, _hint?: any): any | null {
    // 过滤敏感数据
    if (event.user) {
      delete event.user.email
      delete event.user.ip_address
      delete event.user.username
    }

    // 过滤 URL 中的敏感信息
    if (event.request?.url && this.containsSensitiveInfo(event.request.url)) {
      event.request.url = '[FILTERED]'
    }

    // 过滤包含敏感信息的异常
    if (event.exception?.values) {
      for (const exception of event.exception.values) {
        if (exception.value && this.containsSensitiveInfo(exception.value)) {
          this.logger.debug('Filtered sensitive exception from Sentry', {
            type: exception.type
          })
          return null
        }
      }
    }

    // 过滤包含敏感信息的消息
    if (
      event.message &&
      this.containsSensitiveInfo(event.message.formatted || event.message.message || '')
    ) {
      this.logger.debug('Filtered sensitive message from Sentry')
      return null
    }

    // 在开发环境下添加更多调试信息
    if (import.meta.env.DEV) {
      event.tags = { ...event.tags, debug: 'true' }
    }

    return event
  }

  /**
   * 面包屑过滤
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private beforeBreadcrumb(breadcrumb: any, _hint?: any): any | null {
    // 过滤控制台输出中的敏感信息
    if (
      breadcrumb.category === 'console' &&
      breadcrumb.message &&
      this.containsSensitiveInfo(breadcrumb.message)
    ) {
      return null
    }

    // 过滤导航相关的面包屑中的敏感路径
    if (
      breadcrumb.category === 'navigation' &&
      breadcrumb.data?.to &&
      this.containsSensitiveInfo(breadcrumb.data.to)
    ) {
      breadcrumb.data.to = '[FILTERED]'
    }

    // 过滤 HTTP 请求中的敏感信息
    if (
      breadcrumb.category === 'http' &&
      breadcrumb.data?.url &&
      this.containsSensitiveInfo(breadcrumb.data.url)
    ) {
      breadcrumb.data.url = '[FILTERED]'
    }

    return breadcrumb
  }

  /**
   * 检查是否包含敏感信息
   */
  private containsSensitiveInfo(text: string): boolean {
    const sensitivePatterns = [
      /password/i,
      /token/i,
      /key/i,
      /secret/i,
      /auth/i,
      /credential/i,
      /api[_-]?key/i,
      /access[_-]?token/i,
      /bearer\s+[a-zA-Z0-9]+/i,
      /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i, // email
      /\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/i, // credit card
      /\b\d{3}-\d{2}-\d{4}\b/i, // SSN
      /[\w-]{20,}/i // long tokens
    ]

    return sensitivePatterns.some((pattern) => pattern.test(text))
  }

  /**
   * 与现有 loggerService 集成
   */
  private integrateWithLogger(): void {
    // 创建原始方法的引用
    const originalError = this.logger.error

    // 重写 error 方法以集成 Sentry
    this.logger.error = (
      message: string,
      ...data: import('@shared/config/logger').LogContextData
    ) => {
      // 调用原始的 error 方法
      originalError.call(this.logger, message, ...data)

      if (this.isInitialized && this.sentry) {
        this.sentry.captureMessage(`[RendererProcess] ${message}`, 'error')

        // 检查第一个参数是否包含 error
        if (data.length > 0) {
          const firstData = data[0]
          if (
            firstData &&
            typeof firstData === 'object' &&
            'error' in firstData &&
            firstData.error instanceof Error
          ) {
            this.sentry.captureException(firstData.error)
          } else if (firstData instanceof Error) {
            this.sentry.captureException(firstData)
          }
        }
      }
    }

    this.logger.info('Integrated Sentry with loggerService')
  }

  /**
   * 设置错误处理器
   */
  private setupErrorHandlers(): void {
    // React 错误边界集成（如果需要）
    window.addEventListener('error', (event) => {
      if (this.isInitialized && this.sentry) {
        this.sentry.addBreadcrumb({
          message: 'Global error occurred',
          category: 'error',
          level: 'error',
          data: {
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno
          }
        })
      }
    })

    window.addEventListener('unhandledrejection', (event) => {
      if (this.isInitialized && this.sentry) {
        this.sentry.addBreadcrumb({
          message: 'Unhandled promise rejection',
          category: 'error',
          level: 'error',
          data: {
            reason: event.reason
          }
        })
      }
    })
  }

  /**
   * 手动捕获异常
   */
  captureException(error: Error, context?: Record<string, any>): string | null {
    if (!this.isInitialized || !this.sentry) {
      return null
    }

    return this.sentry.captureException(error, { extra: context })
  }

  /**
   * 手动捕获消息
   */
  captureMessage(
    message: string,
    level: 'debug' | 'info' | 'warning' | 'error' | 'fatal' = 'info'
  ): string | null {
    if (!this.isInitialized || !this.sentry) {
      return null
    }

    return this.sentry.captureMessage(message, level)
  }

  /**
   * 添加面包屑
   */
  addBreadcrumb(message: string, category?: string, level?: string, data?: any): void {
    if (!this.isInitialized || !this.sentry) {
      return
    }

    this.sentry.addBreadcrumb({
      message,
      category: category || 'manual',
      level: level || 'info',
      timestamp: Date.now() / 1000,
      data
    })
  }

  /**
   * 设置用户上下文（不包含敏感信息）
   */
  setUserContext(user: { id?: string; role?: string; preferences?: Record<string, any> }): void {
    if (!this.isInitialized || !this.sentry) {
      return
    }

    this.sentry.configureScope((scope: any) => {
      scope.setUser({
        id: user.id || 'anonymous',
        role: user.role,
        preferences: user.preferences
      })
    })
  }

  /**
   * 设置标签
   */
  setTag(key: string, value: string): void {
    if (!this.isInitialized || !this.sentry) {
      return
    }

    this.sentry.configureScope((scope: any) => {
      scope.setTag(key, value)
    })
  }

  /**
   * 设置上下文
   */
  setContext(key: string, context: any): void {
    if (!this.isInitialized || !this.sentry) {
      return
    }

    this.sentry.configureScope((scope: any) => {
      scope.setContext(key, context)
    })
  }

  /**
   * 检查是否已初始化
   */
  get initialized(): boolean {
    return this.isInitialized
  }
}

export const sentryRendererService = new SentryRendererService()
