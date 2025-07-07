/**
 * 存储服务类型定义
 * Storage Service Types
 */

import { ServiceResult } from './base.types'

// 存储引擎类型 / Storage Engine Type
export enum StorageEngine {
  MEMORY = 'memory',
  LOCAL_STORAGE = 'localStorage',
  SESSION_STORAGE = 'sessionStorage',
  INDEXED_DB = 'indexedDB',
  ELECTRON_STORE = 'electronStore',
  FILE_SYSTEM = 'fileSystem'
}

// 存储配置 / Storage Configuration
export interface StorageConfig {
  engine: StorageEngine
  namespace?: string
  encryption?: boolean
  compression?: boolean
  maxSize?: number
  ttl?: number
  version?: string
  migrations?: StorageMigration[]
}

// 存储迁移 / Storage Migration
export interface StorageMigration {
  version: string
  migrate: (data: Record<string, unknown>) => Promise<Record<string, unknown>>
}

// 存储项 / Storage Item
export interface StorageItem<T = unknown> {
  key: string
  value: T
  timestamp: number
  ttl?: number
  version?: string
  metadata?: Record<string, unknown>
}

// 存储查询选项 / Storage Query Options
export interface StorageQueryOptions {
  prefix?: string
  suffix?: string
  pattern?: RegExp
  limit?: number
  offset?: number
  sortBy?: 'key' | 'timestamp' | 'ttl'
  sortOrder?: 'asc' | 'desc'
  includeExpired?: boolean
}

// 存储统计信息 / Storage Statistics
export interface StorageStatistics {
  totalItems: number
  totalSize: number
  usedSpace: number
  availableSpace: number
  expiredItems: number
  engineType: StorageEngine
  namespace?: string
  lastCleanup?: number
}

// 存储事件类型 / Storage Event Types
export enum StorageEventType {
  SET = 'set',
  GET = 'get',
  DELETE = 'delete',
  CLEAR = 'clear',
  EXPIRE = 'expire',
  ERROR = 'error'
}

// 存储事件 / Storage Event
export interface StorageEvent<T = unknown> {
  type: StorageEventType
  key?: string
  value?: T
  oldValue?: T
  timestamp: number
  namespace?: string
}

// 存储监听器 / Storage Listener
export type StorageListener<T = unknown> = (event: StorageEvent<T>) => void

// 存储服务接口 / Storage Service Interface
export interface IStorageService {
  readonly engine: StorageEngine
  readonly namespace: string

  // 基础操作 / Basic Operations
  set<T>(key: string, value: T, ttl?: number): Promise<ServiceResult<void>>
  get<T>(key: string, defaultValue?: T): Promise<ServiceResult<T>>
  has(key: string): Promise<boolean>
  delete(key: string): Promise<ServiceResult<void>>
  clear(): Promise<ServiceResult<void>>

  // 批量操作 / Batch Operations
  setMultiple<T>(items: Record<string, T>, ttl?: number): Promise<ServiceResult<void>>
  getMultiple<T>(keys: string[], defaultValue?: T): Promise<ServiceResult<Record<string, T>>>
  deleteMultiple(keys: string[]): Promise<ServiceResult<void>>

  // 查询操作 / Query Operations
  keys(options?: StorageQueryOptions): Promise<ServiceResult<string[]>>
  values<T>(options?: StorageQueryOptions): Promise<ServiceResult<T[]>>
  entries<T>(options?: StorageQueryOptions): Promise<ServiceResult<Array<[string, T]>>>

  // 高级操作 / Advanced Operations
  size(): Promise<number>
  statistics(): Promise<StorageStatistics>
  cleanup(): Promise<ServiceResult<number>>
  compress(): Promise<ServiceResult<void>>
  backup(): Promise<ServiceResult<string>>
  restore(backupData: string): Promise<ServiceResult<void>>

  // 事件监听 / Event Listening
  addEventListener<T>(type: StorageEventType, listener: StorageListener<T>): void
  removeEventListener<T>(type: StorageEventType, listener: StorageListener<T>): void

  // 生命周期 / Lifecycle
  initialize(config: StorageConfig): Promise<ServiceResult<void>>
  dispose(): Promise<ServiceResult<void>>
}

// 配置存储服务接口 / Configuration Storage Service Interface
export interface IConfigStorageService extends IStorageService {
  // 配置特定操作 / Configuration Specific Operations
  getConfig<T>(section: string, key: string, defaultValue?: T): Promise<ServiceResult<T>>
  setConfig<T>(section: string, key: string, value: T): Promise<ServiceResult<void>>
  deleteConfig(section: string, key?: string): Promise<ServiceResult<void>>
  getSection<T>(section: string): Promise<ServiceResult<T>>
  setSection<T>(section: string, value: T): Promise<ServiceResult<void>>

  // 配置验证 / Configuration Validation
  validateConfig(schema: Record<string, unknown>): Promise<ServiceResult<void>>
  migrateConfig(targetVersion: string): Promise<ServiceResult<void>>

  // 配置监听 / Configuration Watching
  watchConfig(section: string, listener: StorageListener): void
  unwatchConfig(section: string, listener: StorageListener): void
}

// 缓存存储服务接口 / Cache Storage Service Interface
export interface ICacheStorageService extends IStorageService {
  // 缓存特定操作 / Cache Specific Operations
  setWithTags<T>(key: string, value: T, tags: string[], ttl?: number): Promise<ServiceResult<void>>
  getByTag<T>(tag: string): Promise<ServiceResult<T[]>>
  deleteByTag(tag: string): Promise<ServiceResult<void>>

  // 缓存统计 / Cache Statistics
  getHitRate(): Promise<number>
  getMissRate(): Promise<number>
  resetStatistics(): Promise<void>

  // 缓存策略 / Cache Strategies
  setEvictionPolicy(policy: 'lru' | 'lfu' | 'fifo' | 'ttl'): Promise<ServiceResult<void>>
  setMaxSize(maxSize: number): Promise<ServiceResult<void>>

  // 预加载 / Preloading
  preload<T>(keys: string[], loader: (key: string) => Promise<T>): Promise<ServiceResult<void>>
  refresh<T>(key: string, loader: (key: string) => Promise<T>): Promise<ServiceResult<void>>
}

// 用户数据存储服务接口 / User Data Storage Service Interface
export interface IUserDataStorageService extends IStorageService {
  // 用户数据特定操作 / User Data Specific Operations
  getUserData<T>(userId: string, key: string, defaultValue?: T): Promise<ServiceResult<T>>
  setUserData<T>(userId: string, key: string, value: T): Promise<ServiceResult<void>>
  deleteUserData(userId: string, key?: string): Promise<ServiceResult<void>>

  // 用户数据导入导出 / User Data Import/Export
  exportUserData(userId: string): Promise<ServiceResult<string>>
  importUserData(userId: string, data: string): Promise<ServiceResult<void>>

  // 用户数据同步 / User Data Synchronization
  syncUserData(userId: string): Promise<ServiceResult<void>>
  getUserDataVersion(userId: string): Promise<ServiceResult<string>>
}
