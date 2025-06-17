import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * 防抖 Hook - 延迟更新值直到指定时间内没有新的变化
 * Debounce Hook - Delays value updates until no new changes occur within specified time
 *
 * @param value 要防抖的值 / Value to debounce
 * @param delay 延迟时间（毫秒）/ Delay time in milliseconds
 * @returns 防抖后的值 / Debounced value
 *
 * @example
 * ```typescript
 * const [searchTerm, setSearchTerm] = useState('')
 * const debouncedSearchTerm = useDebounce(searchTerm, 500)
 *
 * useEffect(() => {
 *   // 只有在用户停止输入500ms后才执行搜索
 *   // Only execute search after user stops typing for 500ms
 *   if (debouncedSearchTerm) {
 *     performSearch(debouncedSearchTerm)
 *   }
 * }, [debouncedSearchTerm])
 * ```
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    // 设置定时器，在延迟时间后更新防抖值
    // Set timer to update debounced value after delay
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    // 清理函数：如果值在延迟时间内再次改变，清除之前的定时器
    // Cleanup function: clear previous timer if value changes within delay
    return (): void => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

/**
 * 防抖回调 Hook - 防抖函数调用而不是值
 * Debounced callback Hook - Debounces function calls instead of values
 *
 * @param callback 要防抖的回调函数 / Callback function to debounce
 * @param delay 延迟时间（毫秒）/ Delay time in milliseconds
 * @returns 防抖后的回调函数 / Debounced callback function
 *
 * @example
 * ```typescript
 * const handleSearch = useDebouncedCallback((term: string) => {
 *   performSearch(term)
 * }, 500)
 *
 * // 在输入框中使用
 * // Use in input field
 * <input onChange={(e) => handleSearch(e.target.value)} />
 * ```
 */
export function useDebouncedCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  return useCallback(
    (...args: Parameters<T>): void => {
      // 清除之前的定时器
      // Clear previous timer
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      // 设置新的定时器
      // Set new timer
      timeoutRef.current = setTimeout(() => {
        callback(...args)
      }, delay)
    },
    [callback, delay]
  )
}

/**
 * 立即防抖 Hook - 第一次调用立即执行，后续调用防抖
 * Immediate debounce Hook - First call executes immediately, subsequent calls are debounced
 *
 * @param callback 要防抖的回调函数 / Callback function to debounce
 * @param delay 延迟时间（毫秒）/ Delay time in milliseconds
 * @param immediate 是否立即执行第一次调用 / Whether to execute first call immediately
 * @returns 防抖后的回调函数 / Debounced callback function
 *
 * @example
 * ```typescript
 * const handleSave = useImmediateDebounce((data: FormData) => {
 *   saveData(data)
 * }, 1000, true)
 *
 * // 第一次点击立即保存，后续点击在1秒内防抖
 * // First click saves immediately, subsequent clicks are debounced within 1 second
 * <button onClick={() => handleSave(formData)}>保存</button>
 * ```
 */
export function useImmediateDebounce<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number,
  immediate = false
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  return useCallback(
    (...args: Parameters<T>): void => {
      const callNow = immediate && !timeoutRef.current

      // 清除之前的定时器
      // Clear previous timer
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      // 设置新的定时器
      // Set new timer
      timeoutRef.current = setTimeout(() => {
        timeoutRef.current = null
        if (!immediate) {
          callback(...args)
        }
      }, delay)

      // 如果是立即模式且没有正在进行的定时器，立即执行
      // If immediate mode and no ongoing timer, execute immediately
      if (callNow) {
        callback(...args)
      }
    },
    [callback, delay, immediate]
  )
}
