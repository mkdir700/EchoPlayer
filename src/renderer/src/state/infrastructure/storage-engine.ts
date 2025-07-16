/**
 * V2 状态管理存储引擎 / V2 State Management Storage Engine
 *
 * 统一的数据持久化管理，支持异步存储
 * Unified data persistence management with async storage support
 */

import { loggerService } from '@logger'
import { Serializable } from '@renderer/infrastructure'
import { PersistStorage, StorageValue } from 'zustand/middleware'

const logger = loggerService.withContext('State-StorageEngine')

/**
 * V2 存储引擎类 / V2 Storage Engine Class
 *
 * 实现 StateStorage 接口，提供 localStorage 存储机制
 * Implements StateStorage interface, providing localStorage storage mechanism
 */
export class StorageEngine<T extends Serializable = Serializable> implements PersistStorage<T> {
  /**
   * 构造函数 / Constructor
   * @param storageName 存储命名空间 / Storage namespace
   */
  constructor(private readonly storageName: string) {}

  /**
   * 获取存储项 / Get storage item
   *
   * @param name 存储键名 / Storage key name
   * @returns 存储的字符串值或 null / Stored string value or null
   */
  async getItem(name: string): Promise<StorageValue<T> | null> {
    try {
      logger.debug(`📖 从 localStorage 读取状态: ${name}`)
      const storageKey = this.getStorageKey(name)
      const rawData = window.localStorage.getItem(storageKey)

      if (rawData) {
        const data = JSON.parse(rawData) as StorageValue<T>
        logger.debug(`✅ 状态读取成功: ${name}`, { dataType: typeof data })
        return data
      }

      logger.debug(`📭 状态不存在: ${name}`)
      return null
    } catch (error) {
      logger.error(`❌ 读取状态失败: ${name}`, { error })
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
    try {
      const storageKey = this.getStorageKey(name)
      const stringifiedValue = JSON.stringify(value)
      window.localStorage.setItem(storageKey, stringifiedValue)
      logger.debug(`✅ 状态保存成功: ${name}`)
    } catch (error) {
      logger.error(`❌ 保存状态失败: ${name}`, { error })
      throw error
    }
  }

  /**
   * 移除存储项 / Remove storage item
   *
   * @param name 存储键名 / Storage key name
   */
  async removeItem(name: string): Promise<void> {
    try {
      const storageKey = this.getStorageKey(name)
      window.localStorage.removeItem(storageKey)
      logger.debug(`🗑️ 状态删除成功: ${name}`)
    } catch (error) {
      logger.error(`❌ 删除状态失败: ${name}`, { error })
      throw error
    }
  }

  /**
   * 获取 localStorage 键名 / Get localStorage key
   *
   * @param name 原始键名 / Original key name
   * @returns 带命名空间的 localStorage 键名 / Namespaced localStorage key name
   */
  private getStorageKey(name: string): string {
    return name
  }
}

/**
 * 创建指定命名空间的存储引擎实例 / Create storage engine instance with specified namespace
 * @param storageName 存储命名空间 / Storage namespace
 * @returns 存储引擎实例 / Storage engine instance
 */
export function createStorageEngine<T extends Serializable>(
  storageName: string
): PersistStorage<T> {
  return new StorageEngine<T>(storageName)
}
