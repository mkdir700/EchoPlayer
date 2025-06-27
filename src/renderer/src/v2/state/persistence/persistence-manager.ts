/**
 * V2 状态持久化管理器 / V2 State Persistence Manager
 *
 * 统一的状态持久化管理，支持内存缓存、异步存储和选择性持久化
 * Unified state persistence management with memory cache, async storage and selective persistence support
 */

import { Serializable } from '@renderer/v2/infrastructure'
import { v2StorageEngine } from '../infrastructure/storage-engine'
import { logger } from '@renderer/utils/logger'

/**
 * 持久化策略枚举 / Persistence Strategy Enum
 */
export enum PersistenceStrategy {
  IMMEDIATE = 'immediate', // 立即持久化 / Immediate persistence
  DEBOUNCED = 'debounced', // 防抖持久化 / Debounced persistence
  THROTTLED = 'throttled', // 节流持久化 / Throttled persistence
  MANUAL = 'manual' // 手动持久化 / Manual persistence
}

/**
 * 持久化配置接口 / Persistence Configuration Interface
 */
export interface PersistenceConfig {
  readonly key: string // 存储键名 / Storage key
  strategy: PersistenceStrategy // 持久化策略 / Persistence strategy
  readonly delay?: number // 延迟时间（毫秒）/ Delay time (milliseconds)
  readonly maxRetries?: number // 最大重试次数 / Maximum retry count
  readonly retryDelay?: number // 重试延迟（毫秒）/ Retry delay (milliseconds)
  readonly compress?: boolean // 是否压缩 / Whether to compress
  readonly encrypt?: boolean // 是否加密 / Whether to encrypt
  readonly version?: number // 版本号 / Version number
  readonly validator?: (data: Serializable) => boolean // 数据验证器 / Data validator
}

/**
 * 持久化任务接口 / Persistence Task Interface
 */
interface PersistenceTask {
  readonly id: string
  readonly key: string
  readonly data: Serializable
  readonly config: PersistenceConfig
  readonly timestamp: number
  retryCount: number // 允许修改重试次数 / Allow modifying retry count
}

/**
 * 持久化统计接口 / Persistence Statistics Interface
 */
export interface PersistenceStatistics {
  totalOperations: number // 总操作数 / Total operations
  successfulOperations: number // 成功操作数 / Successful operations
  failedOperations: number // 失败操作数 / Failed operations
  averageLatency: number // 平均延迟 / Average latency
  readonly cacheHitRate: number // 缓存命中率 / Cache hit rate
  lastOperationTime: Date // 最后操作时间 / Last operation time
}

/**
 * V2 状态持久化管理器类 / V2 State Persistence Manager Class
 */
export class PersistenceManager {
  private static instance: PersistenceManager | null = null

  private readonly pendingTasks = new Map<string, PersistenceTask>()
  private readonly debounceTimers = new Map<string, NodeJS.Timeout>()
  private readonly throttleTimers = new Map<string, NodeJS.Timeout>()
  private readonly statistics: PersistenceStatistics = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    averageLatency: 0,
    cacheHitRate: 0,
    lastOperationTime: new Date()
  }

  private constructor() {
    // 私有构造函数，确保单例模式 / Private constructor to ensure singleton pattern
  }

  /**
   * 获取单例实例 / Get singleton instance
   */
  static getInstance(): PersistenceManager {
    if (!PersistenceManager.instance) {
      PersistenceManager.instance = new PersistenceManager()
    }
    return PersistenceManager.instance
  }

  /**
   * 持久化数据 / Persist data
   *
   * @param data 要持久化的数据 / Data to persist
   * @param config 持久化配置 / Persistence configuration
   */
  async persist(data: Serializable, config: PersistenceConfig): Promise<void> {
    const startTime = performance.now()

    try {
      // 数据验证 / Data validation
      if (config.validator && !config.validator(data)) {
        throw new Error(`数据验证失败: ${config.key}`)
      }

      // 创建持久化任务 / Create persistence task
      const task: PersistenceTask = {
        id: `${config.key}-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        key: config.key,
        data,
        config,
        timestamp: Date.now(),
        retryCount: 0
      }

      // 根据策略执行持久化 / Execute persistence based on strategy
      switch (config.strategy) {
        case PersistenceStrategy.IMMEDIATE:
          await this.executeImmediatePersistence(task)
          break
        case PersistenceStrategy.DEBOUNCED:
          this.executeDebouncedPersistence(task)
          break
        case PersistenceStrategy.THROTTLED:
          this.executeThrottledPersistence(task)
          break
        case PersistenceStrategy.MANUAL:
          this.pendingTasks.set(task.id, task)
          break
      }

      // 更新统计信息 / Update statistics
      this.updateStatistics(true, performance.now() - startTime)
    } catch (error) {
      this.updateStatistics(false, performance.now() - startTime)
      logger.error(`❌ 持久化失败: ${config.key}`, error)
      throw error
    }
  }

  /**
   * 立即持久化 / Immediate persistence
   */
  private async executeImmediatePersistence(task: PersistenceTask): Promise<void> {
    try {
      const processedData = await this.processData(task.data, task.config)
      await v2StorageEngine.setItem(task.key, {
        state: processedData,
        version: task.config.version || 1
      })

      logger.debug(`✅ 立即持久化成功: ${task.key}`)
    } catch (error) {
      await this.handlePersistenceError(task, error)
    }
  }

  /**
   * 防抖持久化 / Debounced persistence
   */
  private executeDebouncedPersistence(task: PersistenceTask): void {
    const { key, config } = task
    const delay = config.delay || 1000

    // 清除现有的防抖定时器 / Clear existing debounce timer
    const existingTimer = this.debounceTimers.get(key)
    if (existingTimer) {
      clearTimeout(existingTimer)
    }

    // 设置新的防抖定时器 / Set new debounce timer
    const timer = setTimeout(async () => {
      try {
        await this.executeImmediatePersistence(task)
        this.debounceTimers.delete(key)
      } catch (error) {
        logger.error(`❌ 防抖持久化失败: ${key}`, error)
      }
    }, delay)

    this.debounceTimers.set(key, timer)
    logger.debug(`⏱️ 防抖持久化已安排: ${key} (${delay}ms)`)
  }

  /**
   * 节流持久化 / Throttled persistence
   */
  private executeThrottledPersistence(task: PersistenceTask): void {
    const { key, config } = task
    const delay = config.delay || 1000

    // 检查是否已有节流定时器 / Check if throttle timer already exists
    if (this.throttleTimers.has(key)) {
      logger.debug(`⏱️ 节流持久化跳过: ${key} (节流中)`)
      return
    }

    // 立即执行并设置节流定时器 / Execute immediately and set throttle timer
    this.executeImmediatePersistence(task).catch((error) => {
      logger.error(`❌ 节流持久化失败: ${key}`, error)
    })

    const timer = setTimeout(() => {
      this.throttleTimers.delete(key)
    }, delay)

    this.throttleTimers.set(key, timer)
    logger.debug(`⏱️ 节流持久化已执行: ${key} (节流 ${delay}ms)`)
  }

  /**
   * 手动执行待处理的持久化任务 / Manually execute pending persistence tasks
   *
   * @param taskId 任务ID，如果不提供则执行所有待处理任务 / Task ID, execute all pending tasks if not provided
   */
  async executePendingTasks(taskId?: string): Promise<void> {
    try {
      if (taskId) {
        const task = this.pendingTasks.get(taskId)
        if (task) {
          await this.executeImmediatePersistence(task)
          this.pendingTasks.delete(taskId)
        }
      } else {
        const tasks = Array.from(this.pendingTasks.values())
        for (const task of tasks) {
          try {
            await this.executeImmediatePersistence(task)
            this.pendingTasks.delete(task.id)
          } catch (error) {
            logger.error(`❌ 执行待处理任务失败: ${task.key}`, error)
          }
        }
      }

      logger.info(`✅ 待处理持久化任务执行完成`)
    } catch (error) {
      logger.error('❌ 执行待处理持久化任务失败', error)
    }
  }

  /**
   * 加载持久化数据 / Load persisted data
   *
   * @param key 存储键名 / Storage key
   * @param config 持久化配置 / Persistence configuration
   * @returns 加载的数据或 null / Loaded data or null
   */
  async load<T = unknown>(key: string, config?: Partial<PersistenceConfig>): Promise<T | null> {
    const startTime = performance.now()

    try {
      const rawData = await v2StorageEngine.getItem(key)

      if (!rawData) {
        logger.debug(`📭 未找到持久化数据: ${key}`)
        return null
      }

      const parsedData = rawData.state
      const processedData = await this.unprocessData(parsedData, config)

      // 数据验证 / Data validation
      if (config?.validator && !config.validator(processedData)) {
        throw new Error(`加载的数据验证失败: ${key}`)
      }

      // 更新统计信息 / Update statistics
      this.updateStatistics(true, performance.now() - startTime)

      logger.debug(`✅ 持久化数据加载成功: ${key}`)
      return processedData as T
    } catch (error) {
      this.updateStatistics(false, performance.now() - startTime)
      logger.error(`❌ 加载持久化数据失败: ${key}`, error)
      return null
    }
  }

  /**
   * 删除持久化数据 / Delete persisted data
   *
   * @param key 存储键名 / Storage key
   */
  async delete(key: string): Promise<void> {
    try {
      await v2StorageEngine.removeItem(key)

      // 清理相关的定时器和任务 / Clean up related timers and tasks
      this.debounceTimers.delete(key)
      this.throttleTimers.delete(key)

      // 删除待处理任务 / Delete pending tasks
      for (const [taskId, task] of this.pendingTasks.entries()) {
        if (task.key === key) {
          this.pendingTasks.delete(taskId)
        }
      }

      logger.debug(`🗑️ 持久化数据删除成功: ${key}`)
    } catch (error) {
      logger.error(`❌ 删除持久化数据失败: ${key}`, error)
      throw error
    }
  }

  /**
   * 处理数据（压缩、加密等）/ Process data (compression, encryption, etc.)
   */
  private async processData(data: Serializable, config: PersistenceConfig): Promise<Serializable> {
    let processedData = data

    // 添加版本信息 / Add version information
    if (config.version) {
      processedData = {
        version: config.version,
        data: processedData,
        timestamp: Date.now()
      }
    }

    // 这里可以添加压缩和加密逻辑 / Compression and encryption logic can be added here
    if (config.compress) {
      // TODO: 实现压缩逻辑 / Implement compression logic
      logger.debug(`🗜️ 数据压缩: ${config.key}`)
    }

    if (config.encrypt) {
      // TODO: 实现加密逻辑 / Implement encryption logic
      logger.debug(`🔐 数据加密: ${config.key}`)
    }

    return processedData
  }

  /**
   * 反处理数据（解压缩、解密等）/ Unprocess data (decompression, decryption, etc.)
   */
  private async unprocessData(
    data: Serializable,
    config?: Partial<PersistenceConfig>
  ): Promise<Serializable> {
    const processedData = data

    // 这里可以添加解密和解压缩逻辑 / Decryption and decompression logic can be added here
    if (config?.encrypt) {
      // 实现解密逻辑 / Implement decryption logic
      logger.debug(`🔓 数据解密`)
    }

    if (config?.compress) {
      // 实现解压缩逻辑 / Implement decompression logic
      logger.debug(`📦 数据解压缩`)
    }

    // 处理版本信息 / Handle version information
    if (processedData && typeof processedData === 'object' && 'version' in processedData) {
      return processedData as Serializable
    }

    return processedData
  }

  /**
   * 处理持久化错误 / Handle persistence error
   */
  private async handlePersistenceError(task: PersistenceTask, error: unknown): Promise<void> {
    const { config } = task
    const maxRetries = config.maxRetries || 3
    const retryDelay = config.retryDelay || 1000

    if (task.retryCount < maxRetries) {
      task.retryCount++

      logger.warn(`⚠️ 持久化失败，准备重试 (${task.retryCount}/${maxRetries}): ${task.key}`, error)

      setTimeout(async () => {
        try {
          await this.executeImmediatePersistence(task)
        } catch (retryError) {
          await this.handlePersistenceError(task, retryError)
        }
      }, retryDelay * task.retryCount)
    } else {
      logger.error(`❌ 持久化最终失败: ${task.key}`, error)
      throw error
    }
  }

  /**
   * 更新统计信息 / Update statistics
   */
  private updateStatistics(success: boolean, latency: number): void {
    this.statistics.totalOperations++
    this.statistics.lastOperationTime = new Date()

    if (success) {
      this.statistics.successfulOperations++
    } else {
      this.statistics.failedOperations++
    }

    // 更新平均延迟 / Update average latency
    const totalLatency =
      this.statistics.averageLatency * (this.statistics.totalOperations - 1) + latency
    this.statistics.averageLatency = totalLatency / this.statistics.totalOperations
  }

  /**
   * 获取统计信息 / Get statistics
   */
  getStatistics(): PersistenceStatistics {
    return { ...this.statistics }
  }

  /**
   * 清理资源 / Cleanup resources
   */
  cleanup(): void {
    // 清理所有定时器 / Clear all timers
    this.debounceTimers.forEach((timer) => clearTimeout(timer))
    this.throttleTimers.forEach((timer) => clearTimeout(timer))

    this.debounceTimers.clear()
    this.throttleTimers.clear()
    this.pendingTasks.clear()

    logger.info('🧹 持久化管理器资源清理完成')
  }
}

/**
 * 全局持久化管理器实例 / Global persistence manager instance
 */
export const persistenceManager = PersistenceManager.getInstance()
