/**
 * 通用基础类型定义
 * Common Base Type Definitions
 *
 * 提供整个应用通用的基础类型和接口
 * Provides common base types and interfaces for the entire application
 */

// 基础实体接口 / Base Entity Interface
export interface BaseEntity {
  readonly id: string
  readonly createdAt: Date
  readonly updatedAt: Date
}

// 操作结果接口 / Operation Result Interface
export interface OperationResult<T = void> {
  readonly success: boolean
  readonly data?: T
  readonly error?: string
  readonly code?: string
  readonly timestamp?: Date
}

// 分页参数接口 / Pagination Parameters Interface
export interface PaginationParams {
  readonly page: number
  readonly pageSize: number
  readonly sortBy?: string
  readonly sortOrder?: SortOrder
}

// 排序顺序枚举 / Sort Order Enum
export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc'
}

// 分页结果接口 / Paginated Result Interface
export interface PaginatedResult<T> {
  readonly items: readonly T[]
  readonly total: number
  readonly page: number
  readonly pageSize: number
  readonly totalPages: number
  readonly hasNext: boolean
  readonly hasPrev: boolean
}

// 加载状态接口 / Loading State Interface
export interface LoadingState {
  readonly isLoading: boolean
  readonly progress?: number
  readonly error?: string
  readonly stage?: string
}

// 文件信息接口 / File Info Interface
export interface FileInfo {
  readonly path: string
  readonly name: string
  readonly extension: string
  readonly size: number
  readonly mimeType: string
  readonly lastModified: Date
  readonly isDirectory: boolean
}

// 坐标点接口 / Point Interface
export interface Point {
  readonly x: number
  readonly y: number
}

// 尺寸接口 / Size Interface
export interface Size {
  readonly width: number
  readonly height: number
}

// 矩形区域接口 / Rectangle Interface
export interface Rectangle extends Point, Size {}

// 时间范围接口 / Time Range Interface
export interface TimeRange {
  readonly start: number
  readonly end: number
  readonly duration: number
}

// 验证结果接口 / Validation Result Interface
export interface ValidationResult {
  readonly isValid: boolean
  readonly errors: readonly string[]
  readonly warnings?: readonly string[]
}

// 配置项接口 / Config Item Interface
export interface ConfigItem<T = unknown> {
  readonly key: string
  readonly value: T
  readonly defaultValue: T
  readonly description?: string
  readonly category?: string
  readonly isRequired?: boolean
}

// 选项项接口 / Option Item Interface
export interface OptionItem<T = unknown> {
  readonly value: T
  readonly label: string
  readonly description?: string
  readonly disabled?: boolean
  readonly icon?: string
}

// 搜索参数接口 / Search Parameters Interface
export interface SearchParams {
  readonly query: string
  readonly filters?: Record<string, unknown>
  readonly pagination?: PaginationParams
  readonly includeHighlight?: boolean
}

// 搜索结果接口 / Search Result Interface
export interface SearchResult<T> {
  readonly items: readonly T[]
  readonly total: number
  readonly query: string
  readonly took: number // 搜索耗时（毫秒）
  readonly highlights?: Record<string, string[]>
}

// 缓存项接口 / Cache Item Interface
export interface CacheItem<T> {
  readonly key: string
  readonly value: T
  readonly expiredAt: Date
  readonly createdAt: Date
  readonly accessCount: number
  readonly lastAccessAt: Date
}

// 缓存配置接口 / Cache Config Interface
export interface CacheConfig {
  readonly maxSize: number
  readonly ttl: number // 生存时间（毫秒）
  readonly cleanupInterval: number
  readonly strategy: 'lru' | 'lfu' | 'fifo'
}

// 日志级别枚举 / Log Level Enum
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

// 日志条目接口 / Log Entry Interface
export interface LogEntry {
  readonly level: LogLevel
  readonly message: string
  readonly timestamp: Date
  readonly source: string
  readonly data?: unknown
  readonly error?: Error
}

// 性能指标接口 / Performance Metrics Interface
export interface PerformanceMetrics {
  readonly startTime: number
  readonly endTime: number
  readonly duration: number
  readonly memoryUsage?: {
    used: number
    total: number
    percentage: number
  }
  readonly cpuUsage?: number
}

// 错误信息接口 / Error Info Interface
export interface ErrorInfo {
  readonly message: string
  readonly code: string
  readonly stack?: string
  readonly context?: unknown
  readonly timestamp: Date
  readonly severity: 'low' | 'medium' | 'high' | 'critical'
}

// 重试配置接口 / Retry Config Interface
export interface RetryConfig {
  readonly maxAttempts: number
  readonly delay: number
  readonly backoffFactor: number
  readonly maxDelay: number
  readonly retryCondition?: (error: Error) => boolean
}

// 通用回调函数类型 / Generic Callback Function Types
export type Callback<T = void> = (data: T) => void
export type AsyncCallback<T = void> = (data: T) => Promise<void>
export type ErrorCallback = (error: Error) => void
export type ProgressCallback = (progress: number) => void

// 通用事件处理器类型 / Generic Event Handler Types
export type EventHandler<T = unknown> = (event: T) => void
export type AsyncEventHandler<T = unknown> = (event: T) => Promise<void>

// 通用比较函数类型 / Generic Comparator Function Type
export type Comparator<T> = (a: T, b: T) => number

// 通用过滤函数类型 / Generic Filter Function Type
export type FilterFunction<T> = (item: T) => boolean

// 通用映射函数类型 / Generic Mapper Function Type
export type MapperFunction<T, R> = (item: T) => R

// 通用谓词函数类型 / Generic Predicate Function Type
export type PredicateFunction<T> = (item: T) => boolean

// 深度只读类型 / Deep Readonly Type
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P]
}

// 可选字段类型 / Optional Fields Type
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

// 必需字段类型 / Required Fields Type
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>

// 键值对类型 / Key-Value Pair Type
export type KeyValuePair<K = string, V = unknown> = {
  readonly key: K
  readonly value: V
}
