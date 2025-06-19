/**
 * API通信类型定义
 * API Communication Type Definitions
 *
 * 定义HTTP请求、响应和错误处理相关的类型
 * Defines types for HTTP requests, responses, and error handling
 */

// HTTP方法枚举 / HTTP Method Enum
export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
  PATCH = 'PATCH',
  HEAD = 'HEAD',
  OPTIONS = 'OPTIONS'
}

// HTTP状态码枚举 / HTTP Status Code Enum
export enum HttpStatusCode {
  // 成功状态码 / Success Status Codes
  OK = 200,
  CREATED = 201,
  ACCEPTED = 202,
  NO_CONTENT = 204,

  // 重定向状态码 / Redirection Status Codes
  MOVED_PERMANENTLY = 301,
  FOUND = 302,
  NOT_MODIFIED = 304,

  // 客户端错误状态码 / Client Error Status Codes
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  METHOD_NOT_ALLOWED = 405,
  CONFLICT = 409,
  UNPROCESSABLE_ENTITY = 422,
  TOO_MANY_REQUESTS = 429,

  // 服务器错误状态码 / Server Error Status Codes
  INTERNAL_SERVER_ERROR = 500,
  NOT_IMPLEMENTED = 501,
  BAD_GATEWAY = 502,
  SERVICE_UNAVAILABLE = 503,
  GATEWAY_TIMEOUT = 504
}

// API请求配置接口 / API Request Config Interface
export interface ApiRequestConfig {
  readonly method: HttpMethod
  readonly url: string
  readonly headers?: Record<string, string>
  readonly params?: Record<string, unknown>
  readonly data?: unknown
  readonly timeout?: number
  readonly retries?: number
  readonly validateStatus?: (status: number) => boolean
}

// API响应接口 / API Response Interface
export interface ApiResponse<T = unknown> {
  readonly data: T
  readonly status: HttpStatusCode
  readonly statusText: string
  readonly headers: Record<string, string>
  readonly config: ApiRequestConfig
  readonly request?: unknown
}

// API错误接口 / API Error Interface
export interface ApiError {
  readonly message: string
  readonly code: string
  readonly status: HttpStatusCode
  readonly details?: unknown
  readonly timestamp: Date
  readonly requestId?: string
}

// 分页API响应接口 / Paginated API Response Interface
export interface PaginatedApiResponse<T> {
  readonly data: readonly T[]
  readonly pagination: {
    readonly page: number
    readonly pageSize: number
    readonly total: number
    readonly totalPages: number
    readonly hasNext: boolean
    readonly hasPrev: boolean
  }
  readonly meta?: Record<string, unknown>
}

// API客户端配置接口 / API Client Config Interface
export interface ApiClientConfig {
  readonly baseURL: string
  readonly timeout: number
  readonly headers: Record<string, string>
  readonly retries: number
  readonly retryDelay: number
  readonly validateStatus: (status: number) => boolean
}

// 请求拦截器接口 / Request Interceptor Interface
export interface RequestInterceptor {
  readonly onFulfilled?: (config: ApiRequestConfig) => ApiRequestConfig | Promise<ApiRequestConfig>
  readonly onRejected?: (error: unknown) => unknown
}

// 响应拦截器接口 / Response Interceptor Interface
export interface ResponseInterceptor {
  readonly onFulfilled?: <T>(response: ApiResponse<T>) => ApiResponse<T> | Promise<ApiResponse<T>>
  readonly onRejected?: (error: unknown) => unknown
}

// 上传进度接口 / Upload Progress Interface
export interface UploadProgress {
  readonly loaded: number
  readonly total: number
  readonly percentage: number
  readonly speed: number // bytes per second
  readonly timeRemaining: number // seconds
}

// 下载进度接口 / Download Progress Interface
export interface DownloadProgress {
  readonly loaded: number
  readonly total: number
  readonly percentage: number
  readonly speed: number // bytes per second
  readonly timeRemaining: number // seconds
}

// 文件上传配置接口 / File Upload Config Interface
export interface FileUploadConfig {
  readonly url: string
  readonly method: HttpMethod
  readonly headers?: Record<string, string>
  readonly data?: Record<string, unknown>
  readonly onProgress?: (progress: UploadProgress) => void
  readonly onSuccess?: (response: ApiResponse) => void
  readonly onError?: (error: ApiError) => void
  readonly maxSize?: number
  readonly allowedTypes?: readonly string[]
  readonly multiple?: boolean
}

// WebSocket连接状态枚举 / WebSocket Connection State Enum
export enum WebSocketState {
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  DISCONNECTING = 'disconnecting',
  DISCONNECTED = 'disconnected',
  ERROR = 'error'
}

// WebSocket消息接口 / WebSocket Message Interface
export interface WebSocketMessage<T = unknown> {
  readonly type: string
  readonly data: T
  readonly timestamp: Date
  readonly id?: string
}

// WebSocket配置接口 / WebSocket Config Interface
export interface WebSocketConfig {
  readonly url: string
  readonly protocols?: readonly string[]
  readonly reconnect?: boolean
  readonly reconnectInterval?: number
  readonly maxReconnectAttempts?: number
  readonly heartbeat?: boolean
  readonly heartbeatInterval?: number
}

// 缓存策略枚举 / Cache Strategy Enum
export enum CacheStrategy {
  NO_CACHE = 'no-cache',
  CACHE_FIRST = 'cache-first',
  NETWORK_FIRST = 'network-first',
  CACHE_ONLY = 'cache-only',
  NETWORK_ONLY = 'network-only',
  STALE_WHILE_REVALIDATE = 'stale-while-revalidate'
}

// API缓存配置接口 / API Cache Config Interface
export interface ApiCacheConfig {
  readonly strategy: CacheStrategy
  readonly ttl: number // 缓存生存时间（毫秒）
  readonly maxSize: number
  readonly key?: string
  readonly tags?: readonly string[]
}

// 批量请求接口 / Batch Request Interface
export interface BatchRequest {
  readonly requests: readonly ApiRequestConfig[]
  readonly concurrent?: boolean
  readonly maxConcurrency?: number
  readonly failFast?: boolean
}

// 批量响应接口 / Batch Response Interface
export interface BatchResponse<T = unknown> {
  readonly responses: readonly (ApiResponse<T> | ApiError)[]
  readonly success: boolean
  readonly errors: readonly ApiError[]
  readonly duration: number
}

// 请求重试配置接口 / Request Retry Config Interface
export interface RequestRetryConfig {
  readonly maxAttempts: number
  readonly delay: number
  readonly backoffFactor: number
  readonly maxDelay: number
  readonly retryCondition: (error: ApiError) => boolean
  readonly onRetry?: (attempt: number, error: ApiError) => void
}

// API端点配置接口 / API Endpoint Config Interface
export interface ApiEndpointConfig {
  readonly path: string
  readonly method: HttpMethod
  readonly cache?: ApiCacheConfig
  readonly retry?: RequestRetryConfig
  readonly timeout?: number
  readonly headers?: Record<string, string>
  readonly params?: Record<string, unknown>
}

// 常用HTTP头部常量 / Common HTTP Headers Constants
export const HTTP_HEADERS = {
  CONTENT_TYPE: 'Content-Type',
  AUTHORIZATION: 'Authorization',
  ACCEPT: 'Accept',
  USER_AGENT: 'User-Agent',
  CACHE_CONTROL: 'Cache-Control',
  ETAG: 'ETag',
  IF_NONE_MATCH: 'If-None-Match',
  LAST_MODIFIED: 'Last-Modified',
  IF_MODIFIED_SINCE: 'If-Modified-Since'
} as const

// 常用MIME类型常量 / Common MIME Types Constants
export const MIME_TYPES = {
  JSON: 'application/json',
  XML: 'application/xml',
  HTML: 'text/html',
  TEXT: 'text/plain',
  FORM_DATA: 'multipart/form-data',
  URL_ENCODED: 'application/x-www-form-urlencoded',
  OCTET_STREAM: 'application/octet-stream'
} as const

// API错误代码常量 / API Error Codes Constants
export const API_ERROR_CODES = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  PARSE_ERROR: 'PARSE_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  NOT_FOUND_ERROR: 'NOT_FOUND_ERROR',
  CONFLICT_ERROR: 'CONFLICT_ERROR',
  RATE_LIMIT_ERROR: 'RATE_LIMIT_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
} as const
