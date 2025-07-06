/**
 * 服务基础抽象类 / Base Service Abstract Class
 *
 * 提供所有服务的基础功能和生命周期管理
 * Provides base functionality and lifecycle management for all services
 */

import {
  IBaseService,
  ServiceInitOptions,
  HealthCheckResult,
  ServiceError,
  ServiceErrorType,
  ServiceStatus
} from '../types/service/base.types'
import { logger } from '../../../utils/logger'

/**
 * 服务错误类 / Service Error Class
 */
class ServiceErrorClass extends Error implements ServiceError {
  public readonly type: ServiceErrorType
  public readonly code?: string
  public readonly details?: Record<string, unknown>
  public readonly timestamp: number

  constructor(
    type: ServiceErrorType,
    message: string,
    code?: string,
    details?: Record<string, unknown>
  ) {
    super(message)
    this.name = 'ServiceError'
    this.type = type
    this.code = code
    this.details = details
    this.timestamp = Date.now()
  }
}

/**
 * 服务基础抽象类 / Base Service Abstract Class
 *
 * 所有服务都应该继承此类，提供统一的生命周期管理和错误处理
 * All services should inherit from this class, providing unified lifecycle management and error handling
 */
export abstract class BaseService implements IBaseService {
  protected _status: ServiceStatus = ServiceStatus.IDLE
  protected _initialized = false
  protected _disposed = false
  protected _initOptions?: ServiceInitOptions

  constructor(
    public readonly name: string,
    public readonly version: string = '1.0.0'
  ) {
    this.logDebug(`Service ${name} created`)
  }

  /**
   * 获取服务状态 / Get Service Status
   */
  get status(): ServiceStatus {
    return this._status
  }

  /**
   * 检查服务是否已初始化 / Check if Service is Initialized
   */
  get isInitialized(): boolean {
    return this._initialized && !this._disposed
  }

  /**
   * 检查服务是否已销毁 / Check if Service is Disposed
   */
  get isDisposed(): boolean {
    return this._disposed
  }

  /**
   * 初始化服务 / Initialize Service
   */
  async initialize(options?: ServiceInitOptions): Promise<void> {
    if (this._initialized) {
      this.logWarn('Service already initialized')
      return
    }

    if (this._disposed) {
      throw this.createError(ServiceErrorType.INTERNAL, 'Cannot initialize disposed service')
    }

    try {
      this._status = ServiceStatus.LOADING
      this._initOptions = options

      this.logInfo('Initializing service...')
      await this.onInitialize(options)

      this._initialized = true
      this._status = ServiceStatus.SUCCESS
      this.logInfo('Service initialized successfully')
    } catch (error) {
      this._status = ServiceStatus.ERROR
      this.logError('Service initialization failed', error)
      throw this.wrapError(error, 'Service initialization failed')
    }
  }

  /**
   * 健康检查 / Health Check
   */
  async healthCheck(): Promise<HealthCheckResult> {
    try {
      if (this._disposed) {
        return {
          healthy: false,
          message: 'Service disposed',
          timestamp: Date.now()
        }
      }

      if (!this._initialized) {
        return {
          healthy: false,
          message: 'Service not initialized',
          timestamp: Date.now()
        }
      }

      const customCheck = await this.onHealthCheck()
      return {
        healthy: true,
        message: 'Service healthy',
        timestamp: Date.now(),
        details: customCheck
      }
    } catch (error) {
      this.logError('Health check failed', error)
      return {
        healthy: false,
        message: error instanceof Error ? error.message : 'Health check failed',
        timestamp: Date.now()
      }
    }
  }

  /**
   * 销毁服务 / Dispose Service
   */
  async dispose(): Promise<void> {
    if (this._disposed) {
      this.logWarn('Service already disposed')
      return
    }

    try {
      this.logInfo('Disposing service...')
      await this.onDispose()

      this._disposed = true
      this._status = ServiceStatus.IDLE
      this.logInfo('Service disposed successfully')
    } catch (error) {
      this.logError('Service disposal failed', error)
      throw this.wrapError(error, 'Service disposal failed')
    }
  }

  /**
   * 子类需要实现的初始化逻辑 / Initialization logic to be implemented by subclasses
   */
  protected abstract onInitialize(options?: ServiceInitOptions): Promise<void>

  /**
   * 子类可以重写的健康检查逻辑 / Health check logic that can be overridden by subclasses
   */
  protected async onHealthCheck(): Promise<Record<string, unknown> | undefined> {
    return undefined
  }

  /**
   * 子类可以重写的销毁逻辑 / Disposal logic that can be overridden by subclasses
   */
  protected async onDispose(): Promise<void> {
    // Default implementation does nothing
  }

  /**
   * 创建服务错误 / Create Service Error
   */
  protected createError(
    type: ServiceErrorType,
    message: string,
    code?: string,
    details?: Record<string, unknown>
  ): ServiceErrorClass {
    return new ServiceErrorClass(type, message, code, details)
  }

  /**
   * 包装错误 / Wrap Error
   */
  protected wrapError(error: unknown, message: string): ServiceErrorClass {
    if (error instanceof Error) {
      return this.createError(
        ServiceErrorType.INTERNAL,
        `${message}: ${error.message}`,
        undefined,
        { originalError: error.name, stack: error.stack }
      )
    }

    return this.createError(ServiceErrorType.INTERNAL, `${message}: ${String(error)}`)
  }

  /**
   * 日志方法 / Logging Methods
   */
  protected logDebug(message: string, ...args: unknown[]): void {
    if (this._initOptions?.debug || this._initOptions?.logLevel === 'debug') {
      logger.debug(`[${this.name}] ${message}`, ...args)
    }
  }

  protected logInfo(message: string, ...args: unknown[]): void {
    if (!this._initOptions?.logLevel || ['debug', 'info'].includes(this._initOptions.logLevel)) {
      logger.info(`[${this.name}] ${message}`, ...args)
    }
  }

  protected logWarn(message: string, ...args: unknown[]): void {
    if (
      !this._initOptions?.logLevel ||
      ['debug', 'info', 'warn'].includes(this._initOptions.logLevel)
    ) {
      logger.warn(`[${this.name}] ${message}`, ...args)
    }
  }

  protected logError(message: string, error?: unknown, ...args: unknown[]): void {
    logger.error(`[${this.name}] ${message}`, error, ...args)
  }

  /**
   * 确保服务已初始化 / Ensure Service is Initialized
   */
  protected ensureInitialized(): void {
    if (this._disposed) {
      throw this.createError(ServiceErrorType.INTERNAL, 'Service disposed')
    }

    if (!this._initialized) {
      throw this.createError(ServiceErrorType.INTERNAL, 'Service not initialized')
    }
  }

  /**
   * 安全执行异步操作 / Safely Execute Async Operation
   */
  protected async safeExecute<T>(operation: () => Promise<T>, errorMessage: string): Promise<T> {
    this.ensureInitialized()

    try {
      return await operation()
    } catch (error) {
      this.logError(errorMessage, error)
      throw this.wrapError(error, errorMessage)
    }
  }
}
