/**
 * V2 状态管理工具函数 / V2 State Management Utility Functions
 *
 * 提供状态管理相关的工具函数和辅助方法
 * Provides utility functions and helper methods for state management
 */

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
