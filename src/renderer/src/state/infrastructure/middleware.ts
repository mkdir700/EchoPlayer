import { loggerService } from '@logger'
import { Serializable } from '@types'
import type { StateCreator } from 'zustand'
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

import { createStorageConfig, StorageOptions } from './storage-config'

const logger = loggerService.withContext('State-Middleware')

/**
 * 中间件配置选项 / Middleware Configuration Options
 */
export interface MiddlewareOptions<T = unknown> {
  /** Store 名称，用于 DevTools / Store name for DevTools */
  name: string
  /** 是否启用 DevTools / Whether to enable DevTools */
  enableDevTools?: boolean
  /** 是否启用持久化 / Whether to enable persistence */
  enablePersistence?: boolean
  /** 持久化配置 / Persistence configuration */
  storageOptions?: Omit<StorageOptions<T>, 'name'>
  /** 是否启用订阅选择器 / Whether to enable subscribe with selector */
  enableSubscribeWithSelector?: boolean
}

/**
 * 创建 V2 中间件栈 / Create V2 middleware stack
 *
 * 这个函数创建一个完整的 Zustand 中间件栈，包含以下功能：
 * - Immer: 支持不可变状态更新，允许直接修改状态对象
 * - 持久化: 自动将状态保存到本地存储并在应用重启时恢复
 * - 订阅选择器: 允许精确订阅状态的特定部分，提升性能
 * - DevTools: 开发环境下的状态调试工具集成
 *
 * This function creates a complete Zustand middleware stack with the following features:
 * - Immer: Supports immutable state updates, allows direct modification of state objects
 * - Persistence: Automatically saves state to local storage and restores on app restart
 * - Subscribe with Selector: Allows precise subscription to specific parts of state for better performance
 * - DevTools: Development environment state debugging tools integration
 *
 * @param options 中间件配置选项 / Middleware configuration options
 * @param options.name Store 名称，用于 DevTools 和持久化标识 / Store name for DevTools and persistence identification
 * @param options.enableDevTools 是否启用 DevTools，默认 true / Whether to enable DevTools, default true
 * @param options.enablePersistence 是否启用持久化，默认 true / Whether to enable persistence, default true
 * @param options.storageOptions 持久化配置选项 / Persistence configuration options
 * @param options.enableSubscribeWithSelector 是否启用订阅选择器，默认 false / Whether to enable subscribe with selector, default false
 * @returns 配置好的中间件函数 / Configured middleware function
 *
 * @example
 * // 基础用法 - 创建带持久化的 store / Basic usage - create store with persistence
 * interface UserState {
 *   user: { id: string; name: string } | null
 *   setUser: (user: { id: string; name: string }) => void
 *   clearUser: () => void
 * }
 *
 * const useUserStore = create<UserState>()(
 *   createMiddleware<UserState>({
 *     name: 'user-store',
 *     enablePersistence: true,
 *     enableSubscribeWithSelector: false
 *   })((set) => ({
 *     user: null,
 *     setUser: (user) => set((state) => {
 *       state.user = user // Immer 允许直接修改 / Immer allows direct modification
 *     }),
 *     clearUser: () => set((state) => {
 *       state.user = null
 *     })
 *   }))
 * )
 *
 * @example
 * // 高级用法 - 使用订阅选择器和自定义持久化配置 / Advanced usage - with subscribe selector and custom persistence
 * interface SettingsState {
 *   theme: 'light' | 'dark'
 *   language: string
 *   notifications: boolean
 *   updateTheme: (theme: 'light' | 'dark') => void
 *   updateLanguage: (lang: string) => void
 *   toggleNotifications: () => void
 * }
 *
 * const useSettingsStore = create<SettingsState>()(
 *   createMiddleware<SettingsState>({
 *     name: 'settings-store',
 *     enablePersistence: true,
 *     enableSubscribeWithSelector: true, // 启用精确订阅 / Enable precise subscription
 *     storageOptions: {
 *       partialize: (state) => ({
 *         theme: state.theme,
 *         language: state.language
 *       }), // 只持久化部分状态 / Only persist partial state
 *       version: 1
 *     }
 *   })((set) => ({
 *     theme: 'light',
 *     language: 'zh-CN',
 *     notifications: true,
 *     updateTheme: (theme) => set((state) => {
 *       state.theme = theme
 *     }),
 *     updateLanguage: (lang) => set((state) => {
 *       state.language = lang
 *     }),
 *     toggleNotifications: () => set((state) => {
 *       state.notifications = !state.notifications
 *     })
 *   }))
 * )
 *
 * // 使用订阅选择器监听特定状态变化 / Use subscribe selector to listen to specific state changes
 * useSettingsStore.subscribe(
 *   (state) => state.theme, // 选择器函数 / Selector function
 *   (theme) => {
 *     console.log('主题变化:', theme) // 只有主题变化时才触发 / Only triggered when theme changes
 *     document.documentElement.setAttribute('data-theme', theme)
 *   }
 * )
 *
 * @example
 * // 使用预设配置 / Using preset configurations
 * // 1. 基础配置 - 无持久化 / Basic - no persistence
 * const useTemporaryStore = create<TempState>()(
 *   MiddlewarePresets.basic<TempState>('temp-store')((set) => ({ ... }))
 * )
 *
 * // 2. 持久化配置 / Persistent configuration
 * const usePersistentStore = create<PersistentState>()(
 *   MiddlewarePresets.persistent<PersistentState>('persistent-store')((set) => ({ ... }))
 * )
 *
 * // 3. 完整配置 - 包含所有中间件 / Full configuration - all middleware
 * const useFullStore = create<FullState>()(
 *   MiddlewarePresets.full<FullState>('full-store')((set) => ({ ... }))
 * )
 *
 * @example
 * // 在 React 组件中使用 / Usage in React components
 * function UserProfile() {
 *   // 订阅整个 store / Subscribe to entire store
 *   const { user, setUser } = useUserStore()
 *
 *   // 只订阅特定字段 / Subscribe to specific field only
 *   const theme = useSettingsStore((state) => state.theme)
 *
 *   // 使用 shallow 比较避免不必要的重渲染 / Use shallow comparison to avoid unnecessary re-renders
 *   const { language, notifications } = useSettingsStore(
 *     (state) => ({ language: state.language, notifications: state.notifications }),
 *     shallow
 *   )
 *
 *   return (
 *     <div>
 *       <h1>用户: {user?.name}</h1>
 *       <p>主题: {theme}</p>
 *       <p>语言: {language}</p>
 *     </div>
 *   )
 * }
 *
 * @see {@link MiddlewarePresets} 预设配置选项 / Preset configuration options
 * @see {@link MiddlewareUtils} 中间件工具函数 / Middleware utility functions
 * @see {@link StateMigration} 状态迁移工具 / State migration utilities
 */
export function createMiddleware<T = unknown>(options: MiddlewareOptions<T>) {
  const {
    name,
    enableDevTools = true,
    enablePersistence = true,
    storageOptions = {},
    enableSubscribeWithSelector = false
  } = options

  return (storeInitializer: StateCreator<T, [], [], T>) => {
    let store: any = storeInitializer

    // 1. Immer 中间件 - 支持不可变状态更新 / Immer middleware - supports immutable state updates
    store = immer(store)

    // 2. 持久化中间件 / Persistence middleware
    if (enablePersistence) {
      const persistConfig = createStorageConfig({
        name,
        ...storageOptions
      } as StorageOptions<Serializable>)

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
        name: `${name}`,
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
      logger.debug(`🛠️ 已启用 DevTools: ${name}`)
    }

    return store
  }
}

/**
 * 预设的中间件配置 / Preset middleware configurations
 */
export const MiddlewarePresets = {
  /**
   * 基础配置 - 只包含 Immer 和 DevTools / Basic configuration - only includes Immer and DevTools
   */
  basic: <T = unknown>(name: string) =>
    createMiddleware<T>({
      name,
      enablePersistence: false,
      enableSubscribeWithSelector: false
    }),

  /**
   * 持久化配置 - 包含 Immer、DevTools 和持久化 / Persistent configuration - includes Immer, DevTools and persistence
   */
  persistent: <T = unknown>(name: string, storageOptions?: Omit<StorageOptions<T>, 'name'>) =>
    createMiddleware<T>({
      name,
      enablePersistence: true,
      storageOptions,
      enableSubscribeWithSelector: false
    }),

  /**
   * 完整配置 - 包含所有中间件 / Full configuration - includes all middleware
   */
  full: <T = unknown>(name: string, storageOptions?: Omit<StorageOptions<T>, 'name'>) =>
    createMiddleware<T>({
      name,
      enablePersistence: true,
      storageOptions,
      enableSubscribeWithSelector: true
    }),

  /**
   * 临时配置 - 不持久化，适用于临时状态 / Temporary configuration - no persistence, suitable for temporary state
   */
  temporary: <T = unknown>(name: string) =>
    createMiddleware<T>({
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
