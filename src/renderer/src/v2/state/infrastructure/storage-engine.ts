/**
 * V2 状态管理存储引擎 / V2 State Management Storage Engine
 *
 * 统一的数据持久化管理，支持内存缓存和异步存储
 * Unified data persistence management with memory cache and async storage support
 */

import { PersistOptions, PersistStorage, StorageValue } from 'zustand/middleware'
import { logger } from '@renderer/utils/logger'
import { Serializable } from '@renderer/v2/infrastructure'

/**
 * V2 存储引擎类 / V2 Storage Engine Class
 *
 * 实现 StateStorage 接口，提供内存缓存 + Electron 存储的双层存储机制
 * Implements StateStorage interface, providing dual-layer storage with memory cache + Electron storage
 */
export class V2StorageEngine<T extends Serializable = Serializable> implements PersistStorage<T> {
  private cache = new Map<string, T>()
  private readonly cachePrefix = 'v2-state-'

  /**
   * 获取存储项 / Get storage item
   *
   * @param name 存储键名 / Storage key name
   * @returns 存储的字符串值或 null / Stored string value or null
   */
  async getItem(name: string): Promise<StorageValue<T> | null> {
    const cacheKey = this.getCacheKey(name)

    try {
      // 1. 先从内存缓存获取 / First try to get from memory cache
      if (this.cache.has(cacheKey)) {
        const cachedData = this.cache.get(cacheKey)
        logger.debug(`📖 从内存缓存读取状态: ${name}`, { cacheKey, hasData: !!cachedData })
        return cachedData ? { state: cachedData, version: 1 } : null
      }

      // 2. 从 Electron 存储获取 / Get from Electron storage
      logger.debug(`📖 从 Electron 存储读取状态: ${name}`)
      const data = await window.api.store.getRawData(name)

      if (data) {
        // 解析数据并更新内存缓存 / Parse data and update memory cache
        const parsedData = JSON.parse(data)
        this.cache.set(cacheKey, parsedData.state)
        logger.debug(`✅ 状态读取成功: ${name}`, { dataType: typeof parsedData })
        return parsedData
      }

      logger.debug(`📭 状态不存在: ${name}`)
      return null
    } catch (error) {
      logger.error(`❌ 读取状态失败: ${name}`, error)
      return null
    }
  }

  /**
   * 设置存储项 / Set storage item
   *
   * @param name 存储键名 / Storage key name
   * @param value 要存储的字符串值 / String value to store
   */
  async setItem(name: string, value: StorageValue<T>): Promise<void> {
    const cacheKey = this.getCacheKey(name)

    try {
      const data = value.state

      // 1. 立即更新内存缓存 / Immediately update memory cache
      this.cache.set(cacheKey, data)
      logger.debug(`💾 更新内存缓存: ${name}`, { cacheKey, dataType: typeof data })

      // 2. 异步保存到 Electron 存储 / Async save to Electron storage
      await window.api.store.setRawData(name, JSON.stringify(value))
      logger.debug(`✅ 状态保存成功: ${name}`)
    } catch (error) {
      // 如果保存失败，从缓存中移除 / Remove from cache if save fails
      this.cache.delete(cacheKey)
      logger.error(`❌ 保存状态失败: ${name}`, error)
      throw error
    }
  }

  /**
   * 移除存储项 / Remove storage item
   *
   * @param name 存储键名 / Storage key name
   */
  async removeItem(name: string): Promise<void> {
    const cacheKey = this.getCacheKey(name)

    try {
      // 1. 从内存缓存移除 / Remove from memory cache
      this.cache.delete(cacheKey)

      // 2. 从 Electron 存储移除 / Remove from Electron storage
      await window.api.store.removeRawData(name)
      logger.debug(`🗑️ 状态删除成功: ${name}`)
    } catch (error) {
      logger.error(`❌ 删除状态失败: ${name}`, error)
      throw error
    }
  }

  /**
   * 清空所有缓存 / Clear all cache
   */
  clearCache(): void {
    this.cache.clear()
    logger.debug('🧹 内存缓存已清空')
  }

  /**
   * 获取缓存统计信息 / Get cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    }
  }

  /**
   * 预热缓存 / Warm up cache
   *
   * @param keys 要预加载的键名列表 / List of keys to preload
   */
  async warmUpCache(keys: string[]): Promise<void> {
    logger.debug('🔥 开始预热缓存', { keys })

    const promises = keys.map(async (key) => {
      try {
        await this.getItem(key)
      } catch (error) {
        logger.warn(`预热缓存失败: ${key}`, error)
      }
    })

    await Promise.all(promises)
    logger.debug('✅ 缓存预热完成')
  }

  /**
   * 获取缓存键名 / Get cache key
   *
   * @param name 原始键名 / Original key name
   * @returns 带前缀的缓存键名 / Prefixed cache key name
   */
  private getCacheKey(name: string): string {
    return `${this.cachePrefix}${name}`
  }
}

/**
 * V2 存储引擎实例 / V2 Storage Engine Instance
 *
 * 全局单例，供所有 V2 状态存储使用
 * Global singleton for all V2 state stores
 */
export const v2StorageEngine = new V2StorageEngine()

/**
 * 存储配置选项 / Storage Configuration Options
 */
export interface V2StorageOptions<T = unknown> {
  /** 存储键名 / Storage key name */
  name: string
  /** 是否启用持久化 / Whether to enable persistence */
  persist?: boolean
  /** 状态分割函数，用于选择性持久化 / State partialize function for selective persistence */
  partialize?: (state: T) => Partial<T>
  /** 版本号，用于状态迁移 / Version number for state migration */
  version?: number
  /** 状态迁移函数 / State migration function */
  migrate?: (persistedState: unknown, version: number) => T
}

/**
 * 创建存储配置 / Create storage configuration
 *
 * @param options 存储选项 / Storage options
 * @returns Zustand persist 配置 / Zustand persist configuration
 */
export function createV2StorageConfig<T>(
  options: V2StorageOptions<T>
): PersistOptions<T, Partial<T>> | undefined {
  const { name, persist = true, partialize, version = 1, migrate } = options

  if (!persist) {
    return undefined
  }

  return {
    name,
    storage: v2StorageEngine as PersistStorage<Partial<T>>,
    partialize,
    version,
    migrate,
    // 跳过水合检查，因为我们使用自定义存储引擎 / Skip hydration check as we use custom storage engine
    skipHydration: false,
    // 合并策略：深度合并 / Merge strategy: deep merge
    merge: (persistedState: unknown, currentState: T): T => ({
      ...currentState,
      ...(persistedState as Partial<T>)
    })
  } satisfies PersistOptions<T, Partial<T>>
}
