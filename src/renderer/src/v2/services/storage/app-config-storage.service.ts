/**
 * 配置存储服务实现 / Configuration Storage Service Implementation
 *
 * 基于 electron-conf 的类型安全配置存储服务，提供验证、迁移和变更通知功能
 * Type-safe configuration storage service based on electron-conf with validation, migration, and change notification
 */

import {
  IConfigStorageService,
  StorageConfig,
  StorageEngine,
  StorageEvent,
  StorageEventType,
  StorageListener,
  StorageStatistics,
  StorageMigration,
  StorageQueryOptions
} from '../../infrastructure/types/service/storage.types'
import {
  ServiceResult,
  ServiceStatus,
  ServiceErrorType,
  HealthCheckResult,
  ServiceInitOptions
} from '../../infrastructure/types/service/base.types'
import { BaseService } from '../../infrastructure/core/base-service'
import { logger } from '@renderer/utils'
import { DEFAULT_APP_CONFIG_STORAGE_SERVICE_CONFIG } from './app-config-storage.service.config'
import { createIPCClientService } from '../api/ipc-client.service'
import type { IIPCClientService } from '../../infrastructure/types/service/ipc-client.types'

// 配置监听器类型 / Configuration Listener Type
interface AppConfigListener {
  section: string
  listener: StorageListener
}

// 配置验证结果 / Configuration Validation Result
interface AppConfigValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

// 配置模式定义 / Configuration Schema Definition
interface AppConfigSchema {
  [key: string]: {
    type: 'string' | 'number' | 'boolean' | 'object' | 'array'
    required?: boolean
    default?: unknown
    validate?: (value: unknown) => boolean
    description?: string
  }
}

/**
 * 配置存储服务实现 / Configuration Storage Service Implementation
 */
export class AppConfigStorageService extends BaseService implements IConfigStorageService {
  readonly engine = StorageEngine.ELECTRON_STORE

  private _namespace: string = 'config'
  private _config: StorageConfig | null = null
  private _listeners: Map<StorageEventType, Set<StorageListener>> = new Map()
  private _configListeners: AppConfigListener[] = []
  private _schema: AppConfigSchema | null = null
  private _migrations: Map<string, StorageMigration> = new Map()
  private _ipcClient: IIPCClientService

  constructor() {
    super('AppConfigStorageService', '1.0.0')
    this._ipcClient = createIPCClientService()
  }

  get namespace(): string {
    return this._namespace
  }

  protected async onInitialize(options?: ServiceInitOptions): Promise<void> {
    // 初始化 IPC 客户端 / Initialize IPC client
    await this._ipcClient.initialize()

    // 合并运行时配置和默认配置 / Merge runtime options with default config
    // 运行时配置优先级更高，覆盖默认配置 / Runtime options have higher priority and override defaults
    const config: StorageConfig = {
      ...DEFAULT_APP_CONFIG_STORAGE_SERVICE_CONFIG,
      ...options?.config
    }

    // 初始化存储服务 / Initialize storage service
    this.configure(config)
  }

  async configure(config: StorageConfig): Promise<ServiceResult<void>> {
    try {
      this._status = ServiceStatus.LOADING

      // 验证配置 / Validate configuration
      if (!config) {
        throw new Error('Configuration is required')
      }

      this._config = config
      this._namespace =
        config.namespace || DEFAULT_APP_CONFIG_STORAGE_SERVICE_CONFIG.namespace || 'config'

      // 设置迁移 / Setup migrations
      if (config.migrations) {
        for (const migration of config.migrations) {
          this._migrations.set(migration.version, migration)
        }
      }

      // 执行配置迁移 / Execute configuration migration
      if (config.version) {
        const migrationResult = await this.migrateConfig(config.version)
        if (!migrationResult.success) {
          throw new Error(`Migration failed: ${migrationResult.error}`)
        }
      }

      this._initialized = true
      this._status = ServiceStatus.SUCCESS

      return { success: true }
    } catch (error) {
      this._status = ServiceStatus.ERROR
      const serviceError = this.createError(
        ServiceErrorType.INTERNAL,
        error instanceof Error ? error.message : 'Unknown initialization error'
      )
      return { success: false, error: serviceError.message }
    }
  }

  /**
   * 获取配置值 / Get configuration value
   */
  async get<T>(key: string, defaultValue?: T): Promise<ServiceResult<T>> {
    try {
      this.ensureInitialized()

      const result = await this._ipcClient.appConfig.getConfig()
      if (!result.success) {
        throw new Error(result.error || 'Failed to get configuration')
      }

      const value = this.getNestedValue(result.data, key) ?? defaultValue

      // 触发获取事件 / Trigger get event
      this.emitEvent(StorageEventType.GET, key, value)

      return { success: true, data: value as T }
    } catch (error) {
      const serviceError = this.createError(
        ServiceErrorType.EXTERNAL,
        error instanceof Error ? error.message : 'Unknown get error'
      )
      return { success: false, error: serviceError.message }
    }
  }

  /**
   * 设置配置值 / Set configuration value
   */
  async set<T>(key: string, value: T): Promise<ServiceResult<void>> {
    try {
      this.ensureInitialized()

      const updates = this.setNestedValue({}, key, value)
      const result = await this._ipcClient.appConfig.updateConfig(updates)

      if (!result.success) {
        throw new Error(result.error || 'Failed to set configuration')
      }

      // 触发设置事件 / Trigger set event
      this.emitEvent(StorageEventType.SET, key, value)

      return { success: true }
    } catch (error) {
      const serviceError = this.createError(
        ServiceErrorType.EXTERNAL,
        error instanceof Error ? error.message : 'Unknown set error'
      )
      return { success: false, error: serviceError.message }
    }
  }

  /**
   * 检查配置键是否存在 / Check if configuration key exists
   */
  async has(key: string): Promise<boolean> {
    try {
      this.ensureInitialized()

      const result = await this._ipcClient.appConfig.getConfig()
      if (!result.success) {
        logger.error('Failed to get config for key check:', result.error)
        return false
      }
      return this.getNestedValue(result.data, key) !== undefined
    } catch (error) {
      logger.error('Failed to check if key exists:', error)
      return false
    }
  }

  /**
   * 删除配置值 / Delete configuration value
   */
  async delete(key: string): Promise<ServiceResult<void>> {
    try {
      this.ensureInitialized()

      const result = await this._ipcClient.appConfig.getConfig()
      if (!result.success) {
        throw new Error(result.error || 'Failed to get configuration')
      }

      const config = { ...result.data }
      this.deleteNestedValue(config, key)

      const updateResult = await this._ipcClient.appConfig.updateConfig(config)
      if (!updateResult.success) {
        throw new Error(updateResult.error || 'Failed to update configuration')
      }

      // 触发删除事件 / Trigger delete event
      this.emitEvent(StorageEventType.DELETE, key)

      return { success: true }
    } catch (error) {
      const serviceError = this.createError(
        ServiceErrorType.EXTERNAL,
        error instanceof Error ? error.message : 'Unknown delete error'
      )
      return { success: false, error: serviceError.message }
    }
  }

  /**
   * 清空所有配置 / Clear all configuration
   */
  async clear(): Promise<ServiceResult<void>> {
    try {
      this.ensureInitialized()

      const result = await this._ipcClient.appConfig.resetConfig()
      if (!result.success) {
        throw new Error(result.error || 'Failed to reset configuration')
      }

      // 触发清空事件 / Trigger clear event
      this.emitEvent(StorageEventType.CLEAR)

      return { success: true }
    } catch (error) {
      const serviceError = this.createError(
        ServiceErrorType.EXTERNAL,
        error instanceof Error ? error.message : 'Unknown clear error'
      )
      return { success: false, error: serviceError.message }
    }
  }

  /**
   * 获取配置值（支持节区） / Get configuration value (supports sections)
   */
  async getConfig<T>(section: string, key: string, defaultValue?: T): Promise<ServiceResult<T>> {
    const fullKey = `${section}.${key}`
    return this.get<T>(fullKey, defaultValue)
  }

  /**
   * 设置配置值（支持节区） / Set configuration value (supports sections)
   */
  async setConfig<T>(section: string, key: string, value: T): Promise<ServiceResult<void>> {
    const fullKey = `${section}.${key}`
    return this.set<T>(fullKey, value)
  }

  /**
   * 删除配置（支持节区） / Delete configuration (supports sections)
   */
  async deleteConfig(section: string, key?: string): Promise<ServiceResult<void>> {
    const fullKey = key ? `${section}.${key}` : section
    return this.delete(fullKey)
  }

  /**
   * 获取配置节区 / Get configuration section
   */
  async getSection<T>(section: string): Promise<ServiceResult<T>> {
    return this.get<T>(section)
  }

  /**
   * 设置配置节区 / Set configuration section
   */
  async setSection<T>(section: string, value: T): Promise<ServiceResult<void>> {
    return this.set<T>(section, value)
  }

  /**
   * 验证配置 / Validate configuration
   */
  async validateConfig(schema: Record<string, unknown>): Promise<ServiceResult<void>> {
    try {
      this.ensureInitialized()

      this._schema = schema as AppConfigSchema

      const result = await this._ipcClient.appConfig.getConfig()
      if (!result.success) {
        throw new Error(result.error || 'Failed to get configuration')
      }

      const validationResult = this.validateConfigData(result.data, this._schema)

      if (!validationResult.isValid) {
        throw new Error(`Configuration validation failed: ${validationResult.errors.join(', ')}`)
      }

      return { success: true }
    } catch (error) {
      const serviceError = this.createError(
        ServiceErrorType.EXTERNAL,
        error instanceof Error ? error.message : 'Unknown validation error'
      )
      return { success: false, error: serviceError.message }
    }
  }

  /**
   * 迁移配置 / Migrate configuration
   */
  async migrateConfig(targetVersion: string): Promise<ServiceResult<void>> {
    try {
      // 在初始化过程中调用时不需要检查初始化状态
      // Don't check initialization status when called during initialization

      const migration = this._migrations.get(targetVersion)
      if (!migration) {
        return { success: true } // 无需迁移 / No migration needed
      }

      const result = await this._ipcClient.appConfig.getConfig()
      if (!result.success) {
        throw new Error(result.error || 'Failed to get configuration')
      }

      const migratedData = await migration.migrate(
        result.data as unknown as Record<string, unknown>
      )

      const updateResult = await this._ipcClient.appConfig.updateConfig(migratedData)
      if (!updateResult.success) {
        throw new Error(updateResult.error || 'Failed to apply migrated configuration')
      }

      return { success: true }
    } catch (error) {
      const serviceError = this.createError(
        ServiceErrorType.EXTERNAL,
        error instanceof Error ? error.message : 'Unknown migration error'
      )
      return { success: false, error: serviceError.message }
    }
  }

  /**
   * 监听配置变更 / Watch configuration changes
   */
  watchConfig(section: string, listener: StorageListener): void {
    this._configListeners.push({ section, listener })
  }

  /**
   * 取消监听配置变更 / Unwatch configuration changes
   */
  unwatchConfig(section: string, listener: StorageListener): void {
    this._configListeners = this._configListeners.filter(
      (item) => !(item.section === section && item.listener === listener)
    )
  }

  /** 批量操作方法 / Batch operation methods
   * @param items 配置值对象
   */
  async setMultiple<T>(items: Record<string, T>): Promise<ServiceResult<void>> {
    try {
      this.ensureInitialized()

      const updates: Record<string, unknown> = {}
      for (const [key, value] of Object.entries(items)) {
        this.mergeNestedValue(updates, key, value)
      }

      const result = await this._ipcClient.appConfig.updateConfig(updates)
      if (!result.success) {
        throw new Error(result.error || 'Failed to set multiple values')
      }

      // 触发设置事件 / Trigger set events
      for (const [key, value] of Object.entries(items)) {
        this.emitEvent(StorageEventType.SET, key, value)
      }

      return { success: true }
    } catch (error) {
      const serviceError = this.createError(
        ServiceErrorType.EXTERNAL,
        error instanceof Error ? error.message : 'Unknown setMultiple error'
      )
      return { success: false, error: serviceError.message }
    }
  }

  async getMultiple<T>(
    keys: string[],
    defaultValue?: T
  ): Promise<ServiceResult<Record<string, T>>> {
    try {
      this.ensureInitialized()

      const result = await this._ipcClient.appConfig.getConfig()
      if (!result.success) {
        throw new Error(result.error || 'Failed to get configuration')
      }

      const values: Record<string, T> = {}
      for (const key of keys) {
        const value = this.getNestedValue(result.data, key) ?? defaultValue
        if (value !== undefined) {
          values[key] = value as T
          // 触发获取事件 / Trigger get event
          this.emitEvent(StorageEventType.GET, key, value)
        }
      }

      return { success: true, data: values }
    } catch (error) {
      const serviceError = this.createError(
        ServiceErrorType.EXTERNAL,
        error instanceof Error ? error.message : 'Unknown getMultiple error'
      )
      return { success: false, error: serviceError.message }
    }
  }

  async deleteMultiple(keys: string[]): Promise<ServiceResult<void>> {
    try {
      this.ensureInitialized()

      const result = await this._ipcClient.appConfig.getConfig()
      if (!result.success) {
        throw new Error(result.error || 'Failed to get configuration')
      }

      const config = { ...result.data }
      for (const key of keys) {
        this.deleteNestedValue(config, key)
      }

      const updateResult = await this._ipcClient.appConfig.updateConfig(config)
      if (!updateResult.success) {
        throw new Error(updateResult.error || 'Failed to update configuration')
      }

      // 触发删除事件 / Trigger delete events
      for (const key of keys) {
        this.emitEvent(StorageEventType.DELETE, key)
      }

      return { success: true }
    } catch (error) {
      const serviceError = this.createError(
        ServiceErrorType.EXTERNAL,
        error instanceof Error ? error.message : 'Unknown deleteMultiple error'
      )
      return { success: false, error: serviceError.message }
    }
  }

  // 查询操作方法 / Query operation methods
  async keys(options?: StorageQueryOptions): Promise<ServiceResult<string[]>> {
    try {
      this.ensureInitialized()

      const result = await this._ipcClient.appConfig.getConfig()
      if (!result.success) {
        throw new Error(result.error || 'Failed to get configuration')
      }

      let keys = this.getAllKeys(result.data, '', [])

      // 应用查询选项 / Apply query options
      if (options?.prefix) {
        keys = keys.filter((key) => key.startsWith(options.prefix!))
      }
      if (options?.suffix) {
        keys = keys.filter((key) => key.endsWith(options.suffix!))
      }
      if (options?.pattern) {
        keys = keys.filter((key) => options.pattern!.test(key))
      }

      // 应用分页 / Apply pagination
      if (options?.offset || options?.limit) {
        const start = options.offset || 0
        const end = options.limit ? start + options.limit : undefined
        keys = keys.slice(start, end)
      }

      return { success: true, data: keys }
    } catch (error) {
      const serviceError = this.createError(
        ServiceErrorType.EXTERNAL,
        error instanceof Error ? error.message : 'Unknown keys error'
      )
      return { success: false, error: serviceError.message }
    }
  }

  async values<T>(options?: StorageQueryOptions): Promise<ServiceResult<T[]>> {
    try {
      const keysResult = await this.keys(options)
      if (!keysResult.success) {
        return { success: false, error: keysResult.error }
      }

      const result = await this._ipcClient.appConfig.getConfig()
      if (!result.success) {
        throw new Error(result.error || 'Failed to get configuration')
      }

      const values: T[] = []
      for (const key of keysResult.data || []) {
        const value = this.getNestedValue(result.data, key)
        if (value !== undefined) {
          values.push(value as T)
        }
      }

      return { success: true, data: values }
    } catch (error) {
      const serviceError = this.createError(
        ServiceErrorType.EXTERNAL,
        error instanceof Error ? error.message : 'Unknown values error'
      )
      return { success: false, error: serviceError.message }
    }
  }

  async entries<T>(options?: StorageQueryOptions): Promise<ServiceResult<Array<[string, T]>>> {
    try {
      const keysResult = await this.keys(options)
      if (!keysResult.success) {
        return { success: false, error: keysResult.error }
      }

      const result = await this._ipcClient.appConfig.getConfig()
      if (!result.success) {
        throw new Error(result.error || 'Failed to get configuration')
      }

      const entries: Array<[string, T]> = []
      for (const key of keysResult.data || []) {
        const value = this.getNestedValue(result.data, key)
        if (value !== undefined) {
          entries.push([key, value as T])
        }
      }

      return { success: true, data: entries }
    } catch (error) {
      const serviceError = this.createError(
        ServiceErrorType.EXTERNAL,
        error instanceof Error ? error.message : 'Unknown entries error'
      )
      return { success: false, error: serviceError.message }
    }
  }

  // 高级操作方法 / Advanced operation methods
  async size(): Promise<number> {
    try {
      this.ensureInitialized()

      const keysResult = await this.keys()
      return keysResult.success ? keysResult.data?.length || 0 : 0
    } catch (error) {
      logger.error('Failed to get storage size:', error)
      return 0
    }
  }

  async statistics(): Promise<StorageStatistics> {
    try {
      this.ensureInitialized()

      const size = await this.size()

      return {
        totalItems: size,
        totalSize: 0, // 无法准确计算 / Cannot accurately calculate
        usedSpace: 0,
        availableSpace: Number.MAX_SAFE_INTEGER,
        expiredItems: 0, // 配置不支持 TTL / Configuration doesn't support TTL
        engineType: this.engine,
        namespace: this.namespace,
        lastCleanup: Date.now()
      }
    } catch (error) {
      logger.error('Failed to get storage statistics:', error)
      return {
        totalItems: 0,
        totalSize: 0,
        usedSpace: 0,
        availableSpace: 0,
        expiredItems: 0,
        engineType: this.engine,
        namespace: this.namespace
      }
    }
  }

  async cleanup(): Promise<ServiceResult<number>> {
    // 配置存储不需要清理 / Configuration storage doesn't need cleanup
    return { success: true, data: 0 }
  }

  async compress(): Promise<ServiceResult<void>> {
    // 配置存储不需要压缩 / Configuration storage doesn't need compression
    return { success: true }
  }

  async backup(): Promise<ServiceResult<string>> {
    try {
      this.ensureInitialized()

      const result = await this._ipcClient.appConfig.getConfig()
      if (!result.success) {
        throw new Error(result.error || 'Failed to get configuration')
      }

      const backupData = JSON.stringify({
        version: this._config?.version || '1.0.0',
        timestamp: Date.now(),
        namespace: this.namespace,
        data: result.data
      })

      return { success: true, data: backupData }
    } catch (error) {
      const serviceError = this.createError(
        ServiceErrorType.EXTERNAL,
        error instanceof Error ? error.message : 'Unknown backup error'
      )
      return { success: false, error: serviceError.message }
    }
  }

  async restore(backupData: string): Promise<ServiceResult<void>> {
    try {
      this.ensureInitialized()

      const backup = JSON.parse(backupData)
      if (!backup.data) {
        throw new Error('Invalid backup data format')
      }

      const result = await this._ipcClient.appConfig.updateConfig(backup.data)
      if (!result.success) {
        throw new Error(result.error || 'Failed to restore configuration')
      }

      return { success: true }
    } catch (error) {
      const serviceError = this.createError(
        ServiceErrorType.EXTERNAL,
        error instanceof Error ? error.message : 'Unknown restore error'
      )
      return { success: false, error: serviceError.message }
    }
  }

  // 事件监听方法 / Event listening methods
  addEventListener<T>(type: StorageEventType, listener: StorageListener<T>): void {
    if (!this._listeners.has(type)) {
      this._listeners.set(type, new Set())
    }
    this._listeners.get(type)!.add(listener as StorageListener)
  }

  removeEventListener<T>(type: StorageEventType, listener: StorageListener<T>): void {
    const listeners = this._listeners.get(type)
    if (listeners) {
      listeners.delete(listener as StorageListener)
    }
  }

  // 生命周期方法 / Lifecycle methods
  async dispose(): Promise<void> {
    try {
      this._listeners.clear()
      this._configListeners = []
      this._schema = null
      this._migrations.clear()
      this._config = null

      // 清理 IPC 客户端 / Dispose IPC client
      await this._ipcClient.dispose()

      await super.dispose()
    } catch (error) {
      logger.error('Failed to dispose app config storage:', error)
    }
  }

  // 健康检查 / Health check
  async healthCheck(): Promise<HealthCheckResult> {
    const timestamp = Date.now()

    try {
      this.ensureInitialized()

      // 测试配置读取 / Test configuration reading
      const result = await this._ipcClient.appConfig.getConfig()
      if (!result.success) {
        throw new Error(result.error || 'Failed to access configuration')
      }

      return {
        healthy: true,
        message: 'Configuration storage is healthy',
        timestamp,
        details: {
          engine: this.engine,
          namespace: this.namespace,
          configAccessible: true
        }
      }
    } catch (error) {
      return {
        healthy: false,
        message: error instanceof Error ? error.message : 'Unknown health check error',
        timestamp,
        details: { error: error instanceof Error ? error.message : error }
      }
    }
  }

  // 私有辅助方法 / Private helper methods

  /**
   * 触发事件 / Emit event
   */
  private emitEvent<T>(type: StorageEventType, key?: string, value?: T, oldValue?: T): void {
    const event: StorageEvent<T> = {
      type,
      key,
      value,
      oldValue,
      timestamp: Date.now(),
      namespace: this.namespace
    }

    // 触发通用监听器 / Trigger general listeners
    const listeners = this._listeners.get(type)
    if (listeners) {
      listeners.forEach((listener) => {
        try {
          listener(event)
        } catch (error) {
          console.error('Error in storage event listener:', error)
        }
      })
    }

    // 触发配置特定监听器 / Trigger config-specific listeners
    if (key && (type === StorageEventType.SET || type === StorageEventType.DELETE)) {
      this._configListeners.forEach(({ section, listener }) => {
        if (key.startsWith(section)) {
          try {
            listener(event)
          } catch (error) {
            console.error('Error in config event listener:', error)
          }
        }
      })
    }
  }

  /**
   * 获取嵌套值 / Get nested value
   */
  private getNestedValue(obj: unknown, path: string): unknown {
    if (!obj || typeof obj !== 'object') {
      return undefined
    }

    const keys = path.split('.')
    let current: unknown = obj

    for (const key of keys) {
      if (current === null || current === undefined || typeof current !== 'object') {
        return undefined
      }
      current = (current as Record<string, unknown>)[key]
    }

    return current
  }

  /**
   * 设置嵌套值 / Set nested value
   */
  private setNestedValue(
    obj: Record<string, unknown>,
    path: string,
    value: unknown
  ): Record<string, unknown> {
    const keys = path.split('.')
    const result = { ...obj }
    let current = result

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i]
      if (!(key in current) || typeof current[key] !== 'object' || current[key] === null) {
        current[key] = {}
      }
      current = current[key] as Record<string, unknown>
    }

    current[keys[keys.length - 1]] = value
    return result
  }

  /**
   * 合并嵌套值到目标对象 / Merge nested value into target object
   */
  private mergeNestedValue(target: Record<string, unknown>, path: string, value: unknown): void {
    const keys = path.split('.')
    let current = target

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i]
      if (!(key in current) || typeof current[key] !== 'object' || current[key] === null) {
        current[key] = {}
      }
      current = current[key] as Record<string, unknown>
    }

    current[keys[keys.length - 1]] = value
  }

  /**
   * 删除嵌套值 / Delete nested value
   */
  private deleteNestedValue(obj: Record<string, unknown>, path: string): void {
    const keys = path.split('.')
    let current = obj

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i]
      if (!(key in current) || typeof current[key] !== 'object' || current[key] === null) {
        return // 路径不存在 / Path doesn't exist
      }
      current = current[key] as Record<string, unknown>
    }

    delete current[keys[keys.length - 1]]
  }

  /**
   * 获取所有键 / Get all keys
   */
  private getAllKeys(obj: unknown, prefix: string, keys: string[]): string[] {
    if (!obj || typeof obj !== 'object') {
      return keys
    }

    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      const fullKey = prefix ? `${prefix}.${key}` : key

      if (value && typeof value === 'object' && !Array.isArray(value)) {
        this.getAllKeys(value, fullKey, keys)
      } else {
        keys.push(fullKey)
      }
    }

    return keys
  }

  /**
   * 验证配置数据 / Validate configuration data
   */
  private validateConfigData(data: unknown, schema: AppConfigSchema): AppConfigValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    if (!data || typeof data !== 'object') {
      errors.push('Configuration data must be an object')
      return { isValid: false, errors, warnings }
    }

    for (const [key, rule] of Object.entries(schema)) {
      const value = this.getNestedValue(data, key)

      // 检查必需字段 / Check required fields
      if (rule.required && (value === undefined || value === null)) {
        errors.push(`Required field '${key}' is missing`)
        continue
      }

      // 检查类型 / Check type
      if (value !== undefined && value !== null) {
        const actualType = Array.isArray(value) ? 'array' : typeof value
        if (actualType !== rule.type) {
          errors.push(`Field '${key}' should be of type '${rule.type}', got '${actualType}'`)
        }

        // 自定义验证 / Custom validation
        if (rule.validate && !rule.validate(value)) {
          errors.push(`Field '${key}' failed custom validation`)
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }
}

// 工厂函数 / Factory function
export function createConfigStorageService(): IConfigStorageService {
  return new AppConfigStorageService()
}
