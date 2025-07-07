/**
 * 词典服务 / Dictionary Service
 *
 * 统一的词典查询服务，支持多种词典引擎、缓存和批量查询
 * Unified dictionary query service with support for multiple engines, caching, and batch queries
 */

import { BaseService } from '../../infrastructure/core/base-service'
import {
  IDictionaryService,
  DictionaryEngine,
  DictionaryConfig,
  DictionaryQueryResult,
  DictionaryServiceStatus,
  DictionaryTestResult,
  DictionaryServiceStats,
  DictionaryCacheItem,
  DictionaryBatchQueryRequest,
  DictionaryBatchQueryResult
} from '../../infrastructure/types/service/dictionary.types'
import {
  ServiceResult,
  ServiceInitOptions,
  ServiceErrorType
} from '../../infrastructure/types/service/base.types'
import { DictionaryEngineFactory, BaseDictionaryEngine } from './engines'

/**
 * 词典缓存接口 / Dictionary Cache Interface
 */
interface IDictionaryCache {
  get(key: string): Promise<DictionaryCacheItem | null>
  set(key: string, item: DictionaryCacheItem): Promise<void>
  delete(key: string): Promise<void>
  clear(): Promise<void>
  getStats(): Promise<{ size: number; hits: number; misses: number }>
}

/**
 * 内存缓存实现 / Memory Cache Implementation
 */
class MemoryDictionaryCache implements IDictionaryCache {
  private cache = new Map<string, DictionaryCacheItem>()
  private stats = { hits: 0, misses: 0 }

  async get(key: string): Promise<DictionaryCacheItem | null> {
    const item = this.cache.get(key)
    if (!item) {
      this.stats.misses++
      return null
    }

    // 检查TTL / Check TTL
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key)
      this.stats.misses++
      return null
    }

    // 更新访问计数 / Update access count
    item.accessCount++
    this.stats.hits++
    return item
  }

  async set(key: string, item: DictionaryCacheItem): Promise<void> {
    this.cache.set(key, item)
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key)
  }

  async clear(): Promise<void> {
    this.cache.clear()
    this.stats = { hits: 0, misses: 0 }
  }

  async getStats(): Promise<{ size: number; hits: number; misses: number }> {
    return {
      size: this.cache.size,
      hits: this.stats.hits,
      misses: this.stats.misses
    }
  }
}

/**
 * 词典服务实现 / Dictionary Service Implementation
 */
export class DictionaryService extends BaseService implements IDictionaryService {
  private _engine: DictionaryEngine = 'eudic-html'
  private _config: DictionaryConfig = { engine: 'eudic-html' }
  private _cache: IDictionaryCache = new MemoryDictionaryCache()
  private _engines = new Map<DictionaryEngine, BaseDictionaryEngine>()
  private _stats: DictionaryServiceStats = {
    totalQueries: 0,
    successfulQueries: 0,
    failedQueries: 0,
    cacheHits: 0,
    averageResponseTime: 0,
    quotaUsed: 0,
    quotaLimit: 0
  }

  constructor() {
    super('DictionaryService', '1.0.0')
  }

  /**
   * 获取当前引擎 / Get Current Engine
   */
  get engine(): DictionaryEngine {
    return this._engine
  }

  /**
   * 初始化服务 / Initialize Service
   */
  protected async onInitialize(options?: ServiceInitOptions): Promise<void> {
    this.logInfo('Initializing dictionary service...')

    // 注册默认引擎 / Register default engines
    await this.registerEngines()

    // 设置配置 / Set configuration
    this._config = { ...this._config, ...options?.config }

    // 设置默认配置（在初始化过程中不调用ensureInitialized检查）
    // Set default configuration (don't call ensureInitialized check during initialization)
    await this.internalConfigure(this._config)

    this.logInfo('Dictionary service initialized successfully')
  }

  /**
   * 注册词典引擎 / Register Dictionary Engines
   */
  private async registerEngines(): Promise<void> {
    try {
      // 注册所有支持的词典引擎 / Register all supported dictionary engines
      const supportedEngines = DictionaryEngineFactory.getSupportedEngines()

      for (const engineType of supportedEngines) {
        try {
          // 为需要API Key的引擎提供临时配置 / Provide temporary configuration for engines that require API Key
          const engineConfig: DictionaryConfig = { engine: engineType }

          // 为特定引擎添加必需的配置项 / Add required configuration items for specific engines
          if (engineType === 'eudic') {
            engineConfig.apiKey = 'temp-key' // 临时键，后续配置时会覆盖 / Temporary key, will be overridden in later configuration
          } else if (engineType === 'youdao') {
            engineConfig.apiKey = 'temp-key'
            engineConfig.apiSecret = 'temp-secret'
          }

          const engine = DictionaryEngineFactory.createEngine(engineType, engineConfig)
          this._engines.set(engineType, engine)
          this.logDebug(`Registered dictionary engine: ${engineType}`)
        } catch (error) {
          this.logWarn(`Failed to register engine ${engineType}`, error)
          // 继续注册其他引擎，不要因为一个引擎失败就停止 / Continue registering other engines, don't stop because one fails
        }
      }

      if (this._engines.size === 0) {
        throw new Error('No dictionary engines were successfully registered')
      }

      this.logInfo(`Registered ${this._engines.size} dictionary engines`)
    } catch (error) {
      this.logError('Failed to register dictionary engines', error)
      throw this.wrapError(error, 'Engine registration failed')
    }
  }

  /**
   * 配置词典服务 / Configure Dictionary Service
   */
  async configure(config: DictionaryConfig): Promise<void> {
    this.ensureInitialized()
    await this.internalConfigure(config)
  }

  /**
   * 内部配置方法（不检查初始化状态）/ Internal Configuration Method (No Initialization Check)
   */
  private async internalConfigure(config: DictionaryConfig): Promise<void> {
    try {
      // 检查引擎是否支持 / Check if engine is supported
      if (!this._engines.has(config.engine)) {
        throw this.createError(
          ServiceErrorType.VALIDATION,
          `不支持的词典引擎: ${config.engine} / Unsupported dictionary engine: ${config.engine}`
        )
      }

      this._config = { ...this._config, ...config }
      this._engine = config.engine

      // 配置当前引擎 / Configure current engine
      const engine = this._engines.get(this._engine)
      if (engine) {
        await engine.configure(config)
      }

      // 配置缓存 / Configure cache
      if (config.cacheEnabled === false) {
        await this._cache.clear()
      }

      this.logInfo(`Dictionary service configured with engine: ${this._engine}`)
    } catch (error) {
      this.logError('Failed to configure dictionary service', error)
      throw this.wrapError(error, 'Configuration failed')
    }
  }

  /**
   * 测试连接 / Test Connection
   */
  async testConnection(): Promise<DictionaryTestResult> {
    this.ensureInitialized()

    try {
      const engine = this._engines.get(this._engine)
      if (!engine) {
        return {
          success: false,
          message: `Dictionary engine ${this._engine} not found`,
          error: 'ENGINE_NOT_FOUND'
        }
      }

      const startTime = Date.now()
      const result = await engine.testConnection()
      const responseTime = Date.now() - startTime

      return {
        ...result,
        responseTime
      }
    } catch (error) {
      this.logError('Connection test failed', error)
      return {
        success: false,
        message: 'Connection test failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * 查询单词 / Query Word
   */
  async queryWord(word: string, context?: string): Promise<ServiceResult<DictionaryQueryResult>> {
    this.ensureInitialized()

    if (!word || word.trim().length === 0) {
      return {
        success: false,
        error: 'Word parameter is required',
        code: 'INVALID_INPUT'
      }
    }

    const normalizedWord = word.trim().toLowerCase()
    const cacheKey = this.generateCacheKey(normalizedWord, context)
    const startTime = Date.now()

    try {
      // 尝试从缓存获取 / Try to get from cache
      if (this._config.cacheEnabled !== false) {
        const cachedResult = await this._cache.get(cacheKey)
        if (cachedResult) {
          this._stats.cacheHits++
          this._stats.totalQueries++

          return {
            success: true,
            data: {
              ...cachedResult.result,
              metadata: {
                source: cachedResult.result.metadata?.source || this._engine,
                timestamp: cachedResult.result.metadata?.timestamp || Date.now(),
                cacheHit: true
              }
            }
          }
        }
      }

      // 从引擎查询 / Query from engine
      const engine = this._engines.get(this._engine)
      if (!engine) {
        throw this.createError(
          ServiceErrorType.INTERNAL,
          `Dictionary engine ${this._engine} not found`
        )
      }

      const result = await engine.queryWord(normalizedWord, context)
      const responseTime = Date.now() - startTime

      // 更新统计信息 / Update statistics
      this._stats.totalQueries++
      this._stats.successfulQueries++
      this._stats.averageResponseTime =
        (this._stats.averageResponseTime * (this._stats.totalQueries - 1) + responseTime) /
        this._stats.totalQueries

      // 缓存结果 / Cache result
      if (this._config.cacheEnabled !== false) {
        const cacheItem: DictionaryCacheItem = {
          word: normalizedWord,
          result: {
            ...result,
            metadata: {
              source: this._engine,
              timestamp: Date.now(),
              cacheHit: false
            }
          },
          timestamp: Date.now(),
          ttl: this._config.cacheTtl || 3600000, // 1小时默认TTL / 1 hour default TTL
          accessCount: 1
        }
        await this._cache.set(cacheKey, cacheItem)
      }

      return {
        success: true,
        data: result
      }
    } catch (error) {
      this._stats.totalQueries++
      this._stats.failedQueries++

      this.logError('Word query failed', error)

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Query failed',
        code: 'QUERY_FAILED'
      }
    }
  }

  /**
   * 批量查询单词 / Query Words in Batch
   */
  async queryWords(
    request: DictionaryBatchQueryRequest
  ): Promise<ServiceResult<DictionaryBatchQueryResult>> {
    this.ensureInitialized()

    if (!request.words || request.words.length === 0) {
      return {
        success: false,
        error: 'Words array is required',
        code: 'INVALID_INPUT'
      }
    }

    const results: Record<string, DictionaryQueryResult> = {}
    const errors: Record<string, string> = {}
    let fromCache = 0

    // 并发查询所有单词 / Query all words concurrently
    const promises = request.words.map(async (word) => {
      try {
        const result = await this.queryWord(word, request.context)
        if (result.success && result.data) {
          results[word] = result.data
          if (result.data.metadata?.cacheHit) {
            fromCache++
          }
        } else {
          errors[word] = result.error || 'Query failed'
        }
      } catch (error) {
        errors[word] = error instanceof Error ? error.message : 'Unknown error'
      }
    })

    await Promise.all(promises)

    const statistics = {
      total: request.words.length,
      successful: Object.keys(results).length,
      failed: Object.keys(errors).length,
      fromCache
    }

    return {
      success: true,
      data: {
        results,
        errors,
        statistics
      }
    }
  }

  /**
   * 获取服务状态 / Get Service Status
   */
  async getServiceStatus(): Promise<DictionaryServiceStatus> {
    this.ensureInitialized()

    try {
      const engine = this._engines.get(this._engine)
      if (!engine) {
        return {
          connected: false,
          authenticated: false,
          rateLimited: false,
          lastError: `Engine ${this._engine} not found`
        }
      }

      return await engine.getStatus()
    } catch (error) {
      this.logError('Failed to get service status', error)
      return {
        connected: false,
        authenticated: false,
        rateLimited: false,
        lastError: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * 获取统计信息 / Get Statistics
   */
  async getStatistics(): Promise<DictionaryServiceStats> {
    this.ensureInitialized()
    return { ...this._stats }
  }

  /**
   * 清空缓存 / Clear Cache
   */
  async clearCache(): Promise<void> {
    this.ensureInitialized()

    try {
      await this._cache.clear()
      this._stats.cacheHits = 0
      this.logInfo('Dictionary cache cleared')
    } catch (error) {
      this.logError('Failed to clear cache', error)
      throw this.wrapError(error, 'Cache clear failed')
    }
  }

  /**
   * 获取缓存统计信息 / Get Cache Statistics
   */
  async getCacheStats(): Promise<{ size: number; hits: number; misses: number }> {
    this.ensureInitialized()
    return await this._cache.getStats()
  }

  /**
   * 生成缓存键 / Generate Cache Key
   */
  private generateCacheKey(word: string, context?: string): string {
    const base = `${this._engine}:${word}`
    return context ? `${base}:${context}` : base
  }

  /**
   * 健康检查 / Health Check
   */
  protected async onHealthCheck(): Promise<Record<string, unknown>> {
    const cacheStats = await this._cache.getStats()
    const serviceStatus = await this.getServiceStatus()

    return {
      engine: this._engine,
      cacheEnabled: this._config.cacheEnabled !== false,
      cacheStats,
      serviceStatus,
      statistics: this._stats
    }
  }

  /**
   * 销毁服务 / Dispose Service
   */
  protected async onDispose(): Promise<void> {
    await this._cache.clear()
    this._engines.clear()
  }
}
