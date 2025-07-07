/**
 * 服务层基础类型定义
 * Service Layer Base Types
 */

// 服务调用结果基础接口 / Service Call Result Base Interface
export interface ServiceResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
  code?: string
}

// 异步操作进度信息 / Async Operation Progress Info
export interface ProgressInfo {
  percentage: number
  message: string
  currentStep?: string
  totalSteps?: number
}

// 服务状态枚举 / Service Status Enum
export enum ServiceStatus {
  IDLE = 'idle',
  LOADING = 'loading',
  SUCCESS = 'success',
  ERROR = 'error'
}

// 服务配置基础接口 / Service Configuration Base Interface
export interface ServiceConfig {
  timeout?: number
  retries?: number
  retryDelay?: number
}

// 服务初始化选项 / Service Initialization Options
export interface ServiceInitOptions {
  config?: ServiceConfig
  debug?: boolean
  logLevel?: 'debug' | 'info' | 'warn' | 'error'
}

// 服务健康检查结果 / Service Health Check Result
export interface HealthCheckResult {
  healthy: boolean
  message: string
  timestamp: number
  details?: Record<string, unknown>
}

// 服务错误类型 / Service Error Types
export enum ServiceErrorType {
  NETWORK = 'network',
  TIMEOUT = 'timeout',
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  PERMISSION = 'permission',
  NOT_FOUND = 'not_found',
  INTERNAL = 'internal',
  EXTERNAL = 'external'
}

// 服务错误信息 / Service Error Info
export interface ServiceError {
  type: ServiceErrorType
  message: string
  code?: string
  details?: Record<string, unknown>
  timestamp: number
}

// 异步操作回调 / Async Operation Callback
export type ProgressCallback = (progress: ProgressInfo) => void
export type ErrorCallback = (error: ServiceError) => void

// 服务基础接口 / Service Base Interface
export interface IBaseService {
  readonly name: string
  readonly version: string
  readonly status: ServiceStatus
  readonly isInitialized: boolean
  readonly isDisposed: boolean
  initialize(options?: ServiceInitOptions): Promise<void>
  healthCheck(): Promise<HealthCheckResult>
  dispose(): Promise<void>
}
