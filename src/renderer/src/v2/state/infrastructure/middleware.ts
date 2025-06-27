/**
 * V2 状态管理中间件配置 / V2 State Management Middleware Configuration
 *
 * 提供统一的中间件配置，包括 DevTools、持久化、Immer 等
 * Provides unified middleware configuration including DevTools, persistence, Immer, etc.
 */

import { devtools, persist, subscribeWithSelector } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import type { StateCreator } from 'zustand'
import { createV2StorageConfig, V2StorageOptions } from './storage-engine'
import { logger } from '@renderer/utils/logger'

/**
 * 中间件配置选项 / Middleware Configuration Options
 */
export interface V2MiddlewareOptions<T = unknown> {
  /** Store 名称，用于 DevTools / Store name for DevTools */
  name: string
  /** 是否启用 DevTools / Whether to enable DevTools */
  enableDevTools?: boolean
  /** 是否启用持久化 / Whether to enable persistence */
  enablePersistence?: boolean
  /** 持久化配置 / Persistence configuration */
  storageOptions?: Omit<V2StorageOptions<T>, 'name'>
  /** 是否启用订阅选择器 / Whether to enable subscribe with selector */
  enableSubscribeWithSelector?: boolean
}

/**
 * 创建 V2 中间件栈 / Create V2 middleware stack
 *
 * @param options 中间件配置选项 / Middleware configuration options
 * @returns 配置好的中间件函数 / Configured middleware function
 */
export function createV2Middleware<T = unknown>(options: V2MiddlewareOptions<T>) {
  const {
    name,
    enableDevTools = true,
    enablePersistence = true,
    storageOptions = {},
    enableSubscribeWithSelector = false
  } = options

  return <T>(storeInitializer: StateCreator<T, [], [], T>) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let store: any = storeInitializer

    // 1. Immer 中间件 - 支持不可变状态更新 / Immer middleware - supports immutable state updates
    store = immer(store)

    // 2. 持久化中间件 / Persistence middleware
    if (enablePersistence) {
      const persistConfig = createV2StorageConfig({
        name,
        ...storageOptions
      })

      if (persistConfig) {
        store = persist(store, persistConfig)
        logger.debug(`🔄 已启用持久化: ${name}`, persistConfig)
      }
    }

    // 3. 订阅选择器中间件 / Subscribe with selector middleware
    if (enableSubscribeWithSelector) {
      store = subscribeWithSelector(store)
      logger.debug(`🎯 已启用订阅选择器: ${name}`)
    }

    // 4. DevTools 中间件 / DevTools middleware
    if (enableDevTools && process.env.NODE_ENV === 'development') {
      store = devtools(store, {
        name: `V2-${name}`,
        enabled: true,
        // 序列化配置 / Serialization configuration
        serialize: {
          options: {
            // 限制状态树深度 / Limit state tree depth
            maxDepth: 10,
            // 忽略函数 / Ignore functions
            ignoreFunction: true,
            // 忽略 undefined / Ignore undefined
            ignoreUndefined: true
          }
        },
        // 动作类型配置 / Action type configuration
        actionCreators: {},
        // 跟踪配置 / Trace configuration
        trace: true,
        traceLimit: 25
      })
      logger.debug(`🛠️ 已启用 DevTools: V2-${name}`)
    }

    return store
  }
}

/**
 * 预设的中间件配置 / Preset middleware configurations
 */
export const V2MiddlewarePresets = {
  /**
   * 基础配置 - 只包含 Immer 和 DevTools / Basic configuration - only includes Immer and DevTools
   */
  basic: <T = unknown>(name: string) =>
    createV2Middleware<T>({
      name,
      enablePersistence: false,
      enableSubscribeWithSelector: false
    }),

  /**
   * 持久化配置 - 包含 Immer、DevTools 和持久化 / Persistent configuration - includes Immer, DevTools and persistence
   */
  persistent: <T = unknown>(name: string, storageOptions?: Omit<V2StorageOptions<T>, 'name'>) =>
    createV2Middleware<T>({
      name,
      enablePersistence: true,
      storageOptions,
      enableSubscribeWithSelector: false
    }),

  /**
   * 完整配置 - 包含所有中间件 / Full configuration - includes all middleware
   */
  full: <T = unknown>(name: string, storageOptions?: Omit<V2StorageOptions<T>, 'name'>) =>
    createV2Middleware<T>({
      name,
      enablePersistence: true,
      storageOptions,
      enableSubscribeWithSelector: true
    }),

  /**
   * 临时配置 - 不持久化，适用于临时状态 / Temporary configuration - no persistence, suitable for temporary state
   */
  temporary: <T = unknown>(name: string) =>
    createV2Middleware<T>({
      name,
      enablePersistence: false,
      enableSubscribeWithSelector: true
    })
}

/**
 * 状态迁移工具 / State migration utilities
 */
export const StateMigration = {
  /**
   * 创建版本迁移函数 / Create version migration function
   *
   * @param migrations 迁移映射 / Migration mapping
   * @returns 迁移函数 / Migration function
   */
  createMigration: <T>(migrations: Record<number, (state: T) => T>) => {
    return (persistedState: T, version: number): T => {
      let state = persistedState
      const currentVersion = Math.max(...Object.keys(migrations).map(Number))

      // 从持久化版本逐步迁移到当前版本 / Migrate step by step from persisted version to current version
      for (let v = version; v < currentVersion; v++) {
        const nextVersion = v + 1
        if (migrations[nextVersion]) {
          logger.debug(`🔄 状态迁移: v${v} -> v${nextVersion}`)
          state = migrations[nextVersion](state)
        }
      }

      return state
    }
  },

  /**
   * 重置状态迁移 / Reset state migration
   *
   * @param defaultState 默认状态 / Default state
   * @returns 重置后的状态 / Reset state
   */
  reset: <T>(defaultState: T) => {
    return (): T => {
      logger.warn('🔄 状态已重置为默认值')
      return defaultState
    }
  }
}

/**
 * 中间件工具函数 / Middleware utility functions
 */
export const MiddlewareUtils = {
  /**
   * 创建状态分割函数 / Create state partialize function
   *
   * @param keys 要持久化的键名列表 / List of keys to persist
   * @returns 分割函数 / Partialize function
   */
  createPartialize: <T extends Record<string, unknown>>(keys: (keyof T)[]) => {
    return (state: T) => {
      const result: Partial<T> = {}
      keys.forEach((key) => {
        if (key in state) {
          result[key] = state[key]
        }
      })
      return result
    }
  },

  /**
   * 创建状态合并函数 / Create state merge function
   *
   * @param customMerge 自定义合并逻辑 / Custom merge logic
   * @returns 合并函数 / Merge function
   */
  createMerge: <T>(customMerge?: (persisted: Partial<T>, current: T) => T) => {
    return (persistedState: Partial<T>, currentState: T): T => {
      if (customMerge) {
        return customMerge(persistedState, currentState)
      }

      // 默认深度合并 / Default deep merge
      return {
        ...currentState,
        ...persistedState
      }
    }
  }
}
