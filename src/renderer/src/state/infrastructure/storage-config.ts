import { Serializable } from '@renderer/infrastructure'
import { PersistOptions, PersistStorage } from 'zustand/middleware'

import { createStorageEngine } from './storage-engine'

/**
 * 存储配置选项 / Storage Configuration Options
 */
export interface StorageOptions<T = unknown> {
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
export function createStorageConfig<T extends Serializable>(
  options: StorageOptions<T>
): PersistOptions<T, Partial<T>> | undefined {
  const { name, persist = true, partialize, version = 1, migrate } = options

  if (!persist) {
    return undefined
  }

  // 为每个 store 创建命名空间独立的存储引擎实例
  const storeEngine = createStorageEngine<T>(name)

  return {
    name,
    storage: storeEngine as unknown as PersistStorage<Partial<T>>,
    partialize,
    version,
    migrate,
    skipHydration: false,
    merge: (persistedState: unknown, currentState: T): T => ({
      ...currentState,
      ...(persistedState as Partial<T>)
    })
  }
}
