/**
 * V2 状态管理工具函数 / V2 State Management Utility Functions
 *
 * 提供状态管理相关的工具函数和辅助方法
 * Provides utility functions and helper methods for state management
 */

import { logger } from '@renderer/utils/logger'

/**
 * 状态验证工具 / State validation utilities
 */
export const StateValidation = {
  /**
   * 验证状态对象是否有效 / Validate if state object is valid
   *
   * @param state 要验证的状态 / State to validate
   * @param requiredKeys 必需的键名列表 / List of required keys
   * @returns 验证结果 / Validation result
   */
  validateState: <T extends Record<string, unknown>>(
    state: T,
    requiredKeys: (keyof T)[]
  ): { isValid: boolean; missingKeys: string[] } => {
    const missingKeys: string[] = []

    requiredKeys.forEach((key) => {
      if (!(key in state) || state[key] === undefined) {
        missingKeys.push(String(key))
      }
    })

    const isValid = missingKeys.length === 0

    if (!isValid) {
      logger.warn('状态验证失败', { missingKeys, state })
    }

    return { isValid, missingKeys }
  },

  /**
   * 验证状态类型 / Validate state type
   *
   * @param state 要验证的状态 / State to validate
   * @param typeCheckers 类型检查器映射 / Type checker mapping
   * @returns 验证结果 / Validation result
   */
  validateStateTypes: <T extends Record<string, unknown>>(
    state: T,
    typeCheckers: Record<keyof T, (value: unknown) => boolean>
  ): { isValid: boolean; invalidKeys: string[] } => {
    const invalidKeys: string[] = []

    Object.entries(typeCheckers).forEach(([key, checker]) => {
      if (key in state && !checker(state[key])) {
        invalidKeys.push(key)
      }
    })

    const isValid = invalidKeys.length === 0

    if (!isValid) {
      logger.warn('状态类型验证失败', { invalidKeys, state })
    }

    return { isValid, invalidKeys }
  }
}

/**
 * 状态转换工具 / State transformation utilities
 */
export const StateTransformation = {
  /**
   * 深度克隆状态对象 / Deep clone state object
   *
   * @param state 要克隆的状态 / State to clone
   * @returns 克隆后的状态 / Cloned state
   */
  deepClone: <T>(state: T): T => {
    if (state === null || typeof state !== 'object') {
      return state
    }

    if (state instanceof Date) {
      return new Date(state.getTime()) as unknown as T
    }

    if (Array.isArray(state)) {
      return state.map((item) => StateTransformation.deepClone(item)) as unknown as T
    }

    const cloned = {} as T
    Object.keys(state).forEach((key) => {
      cloned[key as keyof T] = StateTransformation.deepClone(
        (state as Record<string, unknown>)[key]
      ) as T[keyof T]
    })

    return cloned
  },

  /**
   * 合并状态对象 / Merge state objects
   *
   * @param target 目标状态 / Target state
   * @param source 源状态 / Source state
   * @returns 合并后的状态 / Merged state
   */
  mergeStates: <T extends Record<string, unknown>>(target: T, source: Partial<T>): T => {
    const result = { ...target }

    Object.keys(source).forEach((key) => {
      const sourceValue = source[key]
      const targetValue = result[key]

      if (sourceValue !== undefined) {
        if (
          typeof sourceValue === 'object' &&
          sourceValue !== null &&
          !Array.isArray(sourceValue) &&
          typeof targetValue === 'object' &&
          targetValue !== null &&
          !Array.isArray(targetValue)
        ) {
          // 递归合并对象 / Recursively merge objects
          ;(result as Record<string, unknown>)[key] = StateTransformation.mergeStates(
            targetValue as Record<string, unknown>,
            sourceValue as Record<string, unknown>
          )
        } else {
          // 直接赋值 / Direct assignment
          ;(result as Record<string, unknown>)[key] = sourceValue
        }
      }
    })

    return result
  },

  /**
   * 选择状态字段 / Pick state fields
   *
   * @param state 源状态 / Source state
   * @param keys 要选择的键名列表 / List of keys to pick
   * @returns 选择后的状态 / Picked state
   */
  pickFields: <T extends Record<string, unknown>, K extends keyof T>(
    state: T,
    keys: K[]
  ): Pick<T, K> => {
    const result = {} as Pick<T, K>
    keys.forEach((key) => {
      if (key in state) {
        result[key] = state[key]
      }
    })
    return result
  },

  /**
   * 排除状态字段 / Omit state fields
   *
   * @param state 源状态 / Source state
   * @param keys 要排除的键名列表 / List of keys to omit
   * @returns 排除后的状态 / Omitted state
   */
  omitFields: <T extends Record<string, unknown>, K extends keyof T>(
    state: T,
    keys: K[]
  ): Omit<T, K> => {
    const result = { ...state }
    keys.forEach((key) => {
      delete result[key]
    })
    return result
  }
}

/**
 * 状态调试工具 / State debugging utilities
 */
export const StateDebug = {
  /**
   * 记录状态变化 / Log state changes
   *
   * @param storeName Store 名称 / Store name
   * @param actionName 动作名称 / Action name
   * @param prevState 之前的状态 / Previous state
   * @param nextState 之后的状态 / Next state
   */
  logStateChange: <T>(storeName: string, actionName: string, prevState: T, nextState: T): void => {
    if (process.env.NODE_ENV === 'development') {
      logger.debug(`🔄 [${storeName}] ${actionName}`, {
        prevState,
        nextState,
        diff: StateDebug.getStateDiff(prevState, nextState)
      })
    }
  },

  /**
   * 获取状态差异 / Get state differences
   *
   * @param prevState 之前的状态 / Previous state
   * @param nextState 之后的状态 / Next state
   * @returns 状态差异 / State differences
   */
  getStateDiff: <T>(prevState: T, nextState: T): Record<string, { prev: T; next: T }> => {
    const diff: Record<string, { prev: T; next: T }> = {}

    if (typeof prevState !== 'object' || typeof nextState !== 'object') {
      return diff
    }

    const allKeys = new Set([
      ...Object.keys(prevState as Record<string, unknown>),
      ...Object.keys(nextState as Record<string, unknown>)
    ])

    allKeys.forEach((key) => {
      const prevValue = (prevState as Record<string, unknown>)[key]
      const nextValue = (nextState as Record<string, unknown>)[key]

      if (prevValue !== nextValue) {
        diff[key] = { prev: prevValue as T, next: nextValue as T }
      }
    })

    return diff
  },

  /**
   * 创建状态快照 / Create state snapshot
   *
   * @param state 要快照的状态 / State to snapshot
   * @param label 快照标签 / Snapshot label
   * @returns 状态快照 / State snapshot
   */
  createSnapshot: <T>(
    state: T,
    label?: string
  ): { timestamp: number; label?: string; state: T } => {
    return {
      timestamp: Date.now(),
      label,
      state: StateTransformation.deepClone(state)
    }
  }
}

/**
 * 性能监控工具 / Performance monitoring utilities
 */
export const StatePerformance = {
  /**
   * 测量状态操作性能 / Measure state operation performance
   *
   * @param operation 要测量的操作 / Operation to measure
   * @param label 操作标签 / Operation label
   * @returns 操作结果 / Operation result
   */
  measureOperation: async <T>(operation: () => T | Promise<T>, label: string): Promise<T> => {
    const startTime = performance.now()

    try {
      const result = await operation()
      const endTime = performance.now()
      const duration = endTime - startTime

      if (process.env.NODE_ENV === 'development') {
        logger.debug(`⏱️ [性能] ${label}: ${duration.toFixed(2)}ms`)
      }

      return result
    } catch (error) {
      const endTime = performance.now()
      const duration = endTime - startTime

      logger.error(`❌ [性能] ${label} 失败: ${duration.toFixed(2)}ms`, error)
      throw error
    }
  },

  /**
   * 创建性能监控装饰器 / Create performance monitoring decorator
   *
   * @param label 监控标签 / Monitoring label
   * @returns 装饰器函数 / Decorator function
   */
  createPerformanceDecorator: (label: string) => {
    return <T extends (...args: unknown[]) => unknown>(
      _target: unknown,
      propertyKey: string,
      descriptor: TypedPropertyDescriptor<T>
    ) => {
      const originalMethod = descriptor.value

      if (originalMethod) {
        descriptor.value = async function (this: unknown, ...args: unknown[]) {
          return StatePerformance.measureOperation(
            () => (originalMethod as (...args: unknown[]) => unknown).apply(this, args),
            `${label}.${propertyKey}`
          )
        } as T
      }

      return descriptor
    }
  }
}

/**
 * 类型工具 / Type utilities
 */
export type StateSelector<T, R> = (state: T) => R
export type StateAction<T> = (state: T) => void | T
export type AsyncStateAction<T> = (state: T) => Promise<void | T>

/**
 * 创建类型安全的状态选择器 / Create type-safe state selector
 *
 * @param selector 选择器函数 / Selector function
 * @returns 类型安全的选择器 / Type-safe selector
 */
export function createSelector<T, R>(selector: StateSelector<T, R>): StateSelector<T, R> {
  return selector
}

import { StoreApi, UseBoundStore } from 'zustand'

type WithSelectors<S> = S extends { getState: () => infer T }
  ? S & { use: { [K in keyof T]: () => T[K] } }
  : never

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const createSelectors = <S extends UseBoundStore<StoreApi<object>>>(_store: S) => {
  const store = _store as WithSelectors<typeof _store>
  store.use = {}
  for (const k of Object.keys(store.getState())) {
    ;(store.use as Record<string, () => unknown>)[k] = () => store((s) => s[k as keyof typeof s])
  }

  return store
}

/**
 * 创建类型安全的状态动作 / Create type-safe state action
 *
 * @param action 动作函数 / Action function
 * @returns 类型安全的动作 / Type-safe action
 */
export function createAction<T>(action: StateAction<T>): StateAction<T> {
  return action
}

/**
 * 格式化时间工具函数 / Format time utility function
 */
export const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}
