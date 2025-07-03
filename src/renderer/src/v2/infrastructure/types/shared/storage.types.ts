/**
 * 存储类型定义
 * Storage Type Definitions
 *
 * 定义数据存储和持久化相关的类型
 * Defines types for data storage and persistence
 */

// 存储引擎类型枚举 / Storage Engine Type Enum
export enum StorageEngineType {
  LOCAL_STORAGE = 'localStorage',
  SESSION_STORAGE = 'sessionStorage',
  INDEXED_DB = 'indexedDB',
  ELECTRON_STORE = 'electronStore',
  MEMORY = 'memory',
  FILE_SYSTEM = 'fileSystem'
}

// 存储操作类型枚举 / Storage Operation Type Enum
export enum StorageOperationType {
  GET = 'get',
  SET = 'set',
  DELETE = 'delete',
  CLEAR = 'clear',
  HAS = 'has',
  KEYS = 'keys',
  SIZE = 'size'
}

// 存储引擎接口 / Storage Engine Interface
export interface StorageEngine {
  readonly type: StorageEngineType
  get<T = unknown>(key: string): Promise<T | null>
  set<T = unknown>(key: string, value: T): Promise<void>
  delete(key: string): Promise<boolean>
  clear(): Promise<void>
  has(key: string): Promise<boolean>
  keys(): Promise<readonly string[]>
  size(): Promise<number>
}

// 存储配置接口 / Storage Config Interface
export interface StorageConfig {
  readonly engine: StorageEngineType
  readonly namespace?: string
  readonly encryption?: boolean
  readonly compression?: boolean
  readonly ttl?: number // 生存时间（毫秒）
  readonly maxSize?: number
  readonly autoCleanup?: boolean
  readonly cleanupInterval?: number
}

// 存储项接口 / Storage Item Interface
export interface StorageItem<T = unknown> {
  readonly key: string
  readonly value: T
  readonly createdAt: Date
  readonly updatedAt: Date
  readonly expiresAt?: Date
  readonly size: number
  readonly metadata?: Record<string, unknown>
}

// 存储操作结果接口 / Storage Operation Result Interface
export interface StorageOperationResult<T = unknown> {
  readonly success: boolean
  readonly data?: T
  readonly error?: string
  readonly operation: StorageOperationType
  readonly key?: string
  readonly timestamp: Date
  readonly duration: number
}

// 存储统计接口 / Storage Statistics Interface
export interface StorageStatistics {
  readonly totalItems: number
  readonly totalSize: number
  readonly usedSpace: number
  readonly availableSpace: number
  readonly hitRate: number
  readonly missRate: number
  readonly operationCounts: Record<StorageOperationType, number>
  readonly lastCleanup?: Date
}

// 存储事件类型枚举 / Storage Event Type Enum
export enum StorageEventType {
  ITEM_ADDED = 'storage:item_added',
  ITEM_UPDATED = 'storage:item_updated',
  ITEM_DELETED = 'storage:item_deleted',
  STORAGE_CLEARED = 'storage:cleared',
  STORAGE_FULL = 'storage:full',
  CLEANUP_STARTED = 'storage:cleanup_started',
  CLEANUP_COMPLETED = 'storage:cleanup_completed',
  ERROR = 'storage:error'
}

// 存储事件接口 / Storage Event Interface
export interface StorageEvent {
  readonly type: StorageEventType
  readonly key?: string
  readonly oldValue?: unknown
  readonly newValue?: unknown
  readonly timestamp: Date
  readonly source: string
}

// 缓存策略枚举 / Cache Strategy Enum
export enum CacheStrategy {
  LRU = 'lru', // Least Recently Used
  LFU = 'lfu', // Least Frequently Used
  FIFO = 'fifo', // First In First Out
  TTL = 'ttl' // Time To Live
}

// 缓存配置接口 / Cache Config Interface
export interface CacheConfig {
  readonly strategy: CacheStrategy
  readonly maxSize: number
  readonly ttl: number
  readonly cleanupInterval: number
  readonly enableMetrics: boolean
  readonly onEvict?: (key: string, value: unknown) => void
}

// 缓存项接口 / Cache Item Interface
export interface CacheItem<T = unknown> {
  readonly key: string
  readonly value: T
  readonly createdAt: Date
  readonly lastAccessAt: Date
  readonly accessCount: number
  readonly expiresAt?: Date
  readonly size: number
}

// 缓存统计接口 / Cache Statistics Interface
export interface CacheStatistics {
  readonly size: number
  readonly maxSize: number
  readonly hitCount: number
  readonly missCount: number
  readonly evictionCount: number
  readonly hitRate: number
  readonly missRate: number
  readonly averageAccessTime: number
}

// 持久化配置接口 / Persistence Config Interface
export interface PersistenceConfig {
  readonly enabled: boolean
  readonly key: string
  readonly storage: StorageEngine
  readonly serialize?: (value: unknown) => string
  readonly deserialize?: (value: string) => unknown
  readonly migrate?: (persistedState: unknown, version: number) => unknown
  readonly version?: number
  readonly whitelist?: readonly string[]
  readonly blacklist?: readonly string[]
}

// 迁移配置接口 / Migration Config Interface
export interface MigrationConfig {
  readonly fromVersion: number
  readonly toVersion: number
  readonly migrate: (state: unknown) => unknown
  readonly description?: string
}

// 备份配置接口 / Backup Config Interface
export interface BackupConfig {
  readonly enabled: boolean
  readonly interval: number // 备份间隔（毫秒）
  readonly maxBackups: number
  readonly compression: boolean
  readonly encryption: boolean
  readonly location: string
}

// 备份项接口 / Backup Item Interface
export interface BackupItem {
  readonly id: string
  readonly timestamp: Date
  readonly size: number
  readonly checksum: string
  readonly version: number
  readonly metadata?: Record<string, unknown>
}

// 同步配置接口 / Sync Config Interface
export interface SyncConfig {
  readonly enabled: boolean
  readonly endpoint: string
  readonly interval: number
  readonly conflictResolution: 'client' | 'server' | 'merge'
  readonly authentication?: {
    readonly type: 'bearer' | 'basic' | 'api-key'
    readonly credentials: Record<string, string>
  }
}

// 同步状态枚举 / Sync Status Enum
export enum SyncStatus {
  IDLE = 'idle',
  SYNCING = 'syncing',
  SUCCESS = 'success',
  ERROR = 'error',
  CONFLICT = 'conflict'
}

// 同步结果接口 / Sync Result Interface
export interface SyncResult {
  readonly status: SyncStatus
  readonly timestamp: Date
  readonly itemsUploaded: number
  readonly itemsDownloaded: number
  readonly conflicts: readonly string[]
  readonly errors: readonly string[]
  readonly duration: number
}

// 存储适配器接口 / Storage Adapter Interface
export interface StorageAdapter<T = unknown> {
  readonly name: string
  readonly version: string
  get(key: string): Promise<T | null>
  set(key: string, value: T): Promise<void>
  delete(key: string): Promise<boolean>
  clear(): Promise<void>
  keys(): Promise<readonly string[]>
  size(): Promise<number>
  isSupported(): boolean
}

// 存储中间件接口 / Storage Middleware Interface
export interface StorageMiddleware {
  readonly name: string
  readonly before?: (
    operation: StorageOperationType,
    key: string,
    value?: unknown
  ) => Promise<unknown>
  readonly after?: (operation: StorageOperationType, key: string, result: unknown) => Promise<void>
  readonly error?: (operation: StorageOperationType, key: string, error: Error) => Promise<void>
}

// 存储观察者接口 / Storage Observer Interface
export interface StorageObserver {
  readonly id: string
  readonly pattern: string | RegExp
  readonly handler: (event: StorageEvent) => void | Promise<void>
  readonly once?: boolean
}

// 存储管理器接口 / Storage Manager Interface
export interface StorageManager {
  readonly config: StorageConfig
  readonly engine: StorageEngine
  get<T = unknown>(key: string): Promise<T | null>
  set<T = unknown>(key: string, value: T, ttl?: number): Promise<void>
  delete(key: string): Promise<boolean>
  clear(): Promise<void>
  has(key: string): Promise<boolean>
  keys(pattern?: string | RegExp): Promise<readonly string[]>
  size(): Promise<number>
  getStatistics(): Promise<StorageStatistics>
  cleanup(): Promise<void>
  backup(): Promise<BackupItem>
  restore(backupId: string): Promise<void>
  sync(): Promise<SyncResult>
  observe(pattern: string | RegExp, handler: (event: StorageEvent) => void): string
  unobserve(observerId: string): boolean
  use(middleware: StorageMiddleware): void
}

// 存储工厂接口 / Storage Factory Interface
export interface StorageFactory {
  create(config: StorageConfig): StorageManager
  createEngine(type: StorageEngineType, options?: unknown): StorageEngine
  getAvailableEngines(): readonly StorageEngineType[]
  isEngineSupported(type: StorageEngineType): boolean
}
