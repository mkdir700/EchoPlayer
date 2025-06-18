import { useCallback, useRef, useMemo } from 'react'

/**
 * 记忆化回调 Hook - 提供更智能的 useCallback 优化
 * Memoized callback Hook - Provides smarter useCallback optimization
 *
 * @param callback 要记忆化的回调函数 / Callback function to memoize
 * @param deps 依赖数组 / Dependency array
 * @returns 记忆化的回调函数 / Memoized callback function
 *
 * @example
 * ```typescript
 * const handleClick = useMemoizedCallback((id: string) => {
 *   onItemClick(id)
 * }, [onItemClick])
 *
 * // 在列表渲染中使用
 * // Use in list rendering
 * {items.map(item => (
 *   <Item key={item.id} onClick={() => handleClick(item.id)} />
 * ))}
 * ```
 */
export function useMemoizedCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  deps: React.DependencyList
): T {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useCallback(callback, deps)
}

/**
 * 深度记忆化回调 Hook - 使用深度比较依赖项
 * Deep memoized callback Hook - Uses deep comparison for dependencies
 *
 * @param callback 要记忆化的回调函数 / Callback function to memoize
 * @param deps 依赖数组 / Dependency array
 * @returns 记忆化的回调函数 / Memoized callback function
 *
 * @example
 * ```typescript
 * const handleSubmit = useDeepMemoizedCallback((formData: FormData) => {
 *   submitForm(formData)
 * }, [formData]) // 即使 formData 是对象，也会进行深度比较
 *
 * // 适用于复杂对象依赖的场景
 * // Suitable for scenarios with complex object dependencies
 * ```
 */
export function useDeepMemoizedCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  deps: React.DependencyList
): T {
  const depsRef = useRef<React.DependencyList | undefined>(undefined)

  // 深度比较依赖项
  // Deep compare dependencies
  const depsChanged = useMemo(() => {
    if (!depsRef.current) return true
    if (depsRef.current.length !== deps.length) return true

    return deps.some((dep, index) => {
      const prevDep = depsRef.current![index]
      return !deepEqual(dep, prevDep)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps])

  // 使用 useCallback 但基于深度比较的结果
  // Use useCallback but based on deep comparison result
  const memoizedCallback = useCallback(callback, [callback, depsChanged])

  // 更新依赖引用
  // Update dependency reference
  if (depsChanged) {
    depsRef.current = [...deps]
  }

  return memoizedCallback
}

/**
 * 稳定回调 Hook - 提供永远稳定的回调引用
 * Stable callback Hook - Provides always stable callback reference
 *
 * @param callback 要稳定化的回调函数 / Callback function to stabilize
 * @returns 稳定的回调函数 / Stable callback function
 *
 * @example
 * ```typescript
 * const handleEvent = useStableCallback((event: Event) => {
 *   // 这个函数引用永远不会改变，但内部逻辑会使用最新的闭包
 *   // This function reference never changes, but internal logic uses latest closure
 *   console.log(currentState, event)
 * })
 *
 * // 适用于需要稳定引用但依赖经常变化的场景
 * // Suitable for scenarios requiring stable reference but frequently changing dependencies
 * ```
 */
export function useStableCallback<T extends (...args: unknown[]) => unknown>(callback: T): T {
  const callbackRef = useRef<T>(callback)
  const stableCallbackRef = useRef<T | undefined>(undefined)

  // 更新最新的回调引用
  // Update latest callback reference
  callbackRef.current = callback

  // 创建稳定的回调函数（只创建一次）
  // Create stable callback function (created only once)
  if (!stableCallbackRef.current) {
    stableCallbackRef.current = ((...args: Parameters<T>) => {
      return callbackRef.current(...args)
    }) as T
  }

  return stableCallbackRef.current
}

/**
 * 条件记忆化回调 Hook - 根据条件决定是否记忆化
 * Conditional memoized callback Hook - Decides whether to memoize based on condition
 *
 * @param callback 要记忆化的回调函数 / Callback function to memoize
 * @param deps 依赖数组 / Dependency array
 * @param shouldMemoize 是否应该记忆化的条件 / Condition for whether to memoize
 * @returns 可能记忆化的回调函数 / Possibly memoized callback function
 *
 * @example
 * ```typescript
 * const handleClick = useConditionalMemoizedCallback(
 *   (id: string) => onItemClick(id),
 *   [onItemClick],
 *   items.length > 100 // 只有在列表很长时才记忆化
 * )
 *
 * // 适用于性能优化需要根据条件决定的场景
 * // Suitable for scenarios where performance optimization depends on conditions
 * ```
 */
export function useConditionalMemoizedCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  deps: React.DependencyList,
  shouldMemoize: boolean
): T {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const memoizedCallback = useCallback(callback, deps)
  return shouldMemoize ? memoizedCallback : callback
}

/**
 * 简单的深度相等比较函数
 * Simple deep equality comparison function
 */
function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true
  if (a == null || b == null) return false
  if (typeof a !== typeof b) return false

  if (typeof a === 'object' && typeof b === 'object') {
    // 处理数组
    // Handle arrays
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false
      return a.every((item, index) => deepEqual(item, b[index]))
    }

    // 处理对象
    // Handle objects
    if (!Array.isArray(a) && !Array.isArray(b)) {
      const aObj = a as Record<string, unknown>
      const bObj = b as Record<string, unknown>
      const aKeys = Object.keys(aObj)
      const bKeys = Object.keys(bObj)

      if (aKeys.length !== bKeys.length) return false
      return aKeys.every((key) => deepEqual(aObj[key], bObj[key]))
    }

    // 一个是数组，一个是对象
    // One is array, one is object
    return false
  }

  return false
}
