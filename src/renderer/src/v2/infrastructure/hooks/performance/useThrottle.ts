import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * 节流 Hook - 限制值更新的频率，在指定时间间隔内最多更新一次
 * Throttle Hook - Limits the frequency of value updates, updating at most once within specified time interval
 *
 * @param value 要节流的值 / Value to throttle
 * @param delay 节流间隔时间（毫秒）/ Throttle interval time in milliseconds
 * @param options 节流选项 / Throttle options
 * @returns 节流后的值 / Throttled value
 *
 * @example
 * ```typescript
* const [scrollPosition, setScrollPosition] = useState(0)
 * const throttledScrollPosition = useThrottle(scrollPosition, 100)
 *
 * useEffect(() => {
 *   // 滚动位置最多每100ms更新一次，减少重渲染
 *   // Scroll position updates at most once every 100ms, reducing re-renders
 *   updateScrollIndicator(throttledScrollPosition)
 * }, [throttledScrollPosition])
 *
```
 */
export function useThrottle<T>(
  value: T,
  delay: number,
  options: { leading?: boolean; trailing?: boolean } = {}
): T {
  const { leading = true, trailing = true } = options
  const [throttledValue, setThrottledValue] = useState<T>(value)
  const lastExecutedRef = useRef<number>(0)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastValueRef = useRef<T>(value)
  const previousValueRef = useRef<T>(value)

  useEffect(() => {
    // 如果值没有变化，不需要处理
    // If value hasn't changed, no need to process
    if (Object.is(value, previousValueRef.current)) {
      return
    }

    lastValueRef.current = value
    previousValueRef.current = value
    const now = Date.now()
    const timeSinceLastExecution = now - lastExecutedRef.current

    // 如果是第一次调用或者已经超过延迟时间，并且启用了 leading
    // If it's the first call or delay time has passed, and leading is enabled
    if (leading && (lastExecutedRef.current === 0 || timeSinceLastExecution >= delay)) {
      setThrottledValue(value)
      lastExecutedRef.current = now

      // 清除任何待执行的 trailing 调用
      // Clear any pending trailing call
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
      return
    }

    // 如果启用 trailing，设置定时器在延迟后执行
    // If trailing is enabled, set timer to execute after delay
    if (trailing) {
      // 清除之前的定时器
      // Clear previous timer
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      const remainingTime = delay - timeSinceLastExecution
      timeoutRef.current = setTimeout(
        () => {
          setThrottledValue(lastValueRef.current)
          lastExecutedRef.current = Date.now()
          timeoutRef.current = null
        },
        remainingTime > 0 ? remainingTime : delay
      )
    }

    // 清理函数
    // Cleanup function
    return (): void => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }
  }, [value, delay, leading, trailing])

  return throttledValue
}

/**
 * 节流回调 Hook - 节流函数调用而不是值
 * Throttled callback Hook - Throttles function calls instead of values
 *
 * @param callback 要节流的回调函数 / Callback function to throttle
 * @param delay 节流间隔时间（毫秒）/ Throttle interval time in milliseconds
 * @param options 节流选项 / Throttle options
 * @returns 节流后的回调函数 / Throttled callback function
 *
 * @example
 * ```typescript
* const handleScroll = useThrottledCallback((event: Event) => {
 *   updateScrollPosition(event.target.scrollTop)
 * }, 100)
 *
 * // 在滚动事件中使用
 * // Use in scroll event
 * <div onScroll={handleScroll}>...</div>
 *
```
 */
export function useThrottledCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number,
  options: { leading?: boolean; trailing?: boolean } = {}
): (...args: Parameters<T>) => void {
  const { leading = true, trailing = true } = options
  const lastExecutedRef = useRef<number>(0)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastArgsRef = useRef<Parameters<T> | null>(null)

  return useCallback(
    (...args: Parameters<T>): void => {
      lastArgsRef.current = args
      const now = Date.now()
      const timeSinceLastExecution = now - lastExecutedRef.current

      // 如果启用 leading 且是第一次调用或已经超过延迟时间
      // If leading is enabled and it's first call or delay time has passed
      if (leading && (lastExecutedRef.current === 0 || timeSinceLastExecution >= delay)) {
        callback(...args)
        lastExecutedRef.current = now
        return
      }

      // 如果启用 trailing，设置定时器在延迟后执行
      // If trailing is enabled, set timer to execute after delay
      if (trailing) {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }

        const remainingTime = delay - timeSinceLastExecution
        timeoutRef.current = setTimeout(
          () => {
            if (lastArgsRef.current) {
              callback(...lastArgsRef.current)
              lastExecutedRef.current = Date.now()
            }
            timeoutRef.current = null
          },
          remainingTime > 0 ? remainingTime : delay
        )
      }
    },
    [callback, delay, leading, trailing]
  )
}

/**
 * 立即节流 Hook - 第一次调用立即执行，后续调用节流
 * Immediate throttle Hook - First call executes immediately, subsequent calls are throttled
 *
 * @param callback 要节流的回调函数 / Callback function to throttle
 * @param delay 节流间隔时间（毫秒）/ Throttle interval time in milliseconds
 * @returns 节流后的回调函数 / Throttled callback function
 *
 * @example
 * ```typescript
 * const handleResize = useImmediateThrottle((event: Event) => {
 *   updateLayout(event)
 * }, 250)
 *
 * // 第一次调用立即执行，后续调用在250ms内节流
 * // First call executes immediately, subsequent calls are throttled within 250ms
 * window.addEventListener('resize', handleResize)
 * ```
 */
export function useImmediateThrottle<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number
): (...args: Parameters<T>) => void {
  return useThrottledCallback(callback, delay, { leading: true, trailing: false })
}

/**
 * 尾随节流 Hook - 只在节流周期结束时执行最后一次调用
 * Trailing throttle Hook - Only executes the last call at the end of throttle cycle
 *
 * @param callback 要节流的回调函数 / Callback function to throttle
 * @param delay 节流间隔时间（毫秒）/ Throttle interval time in milliseconds
 * @returns 节流后的回调函数 / Throttled callback function
 *
 * @example
 * ```typescript
 * const handleInput = useTrailingThrottle((value: string) => {
 *   saveToServer(value)
 * }, 1000)
 *
 * // 只在用户停止输入1秒后保存最后的值
 * // Only saves the last value after user stops typing for 1 second
 * <input onChange={(e) => handleInput(e.target.value)} />
 * ```
 */
export function useTrailingThrottle<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number
): (...args: Parameters<T>) => void {
  return useThrottledCallback(callback, delay, { leading: false, trailing: true })
}

/**
 * 可控节流 Hook - 提供手动控制节流状态的能力
 * Controllable throttle Hook - Provides ability to manually control throttle state
 *
 * @param callback 要节流的回调函数 / Callback function to throttle
 * @param delay 节流间隔时间（毫秒）/ Throttle interval time in milliseconds
 * @param options 节流选项 / Throttle options
 * @returns 包含节流回调和控制方法的对象 / Object containing throttled callback and control methods
 *
 * @example
 * ```typescript
* const { throttledCallback, cancel, flush, isThrottled } = useControllableThrottle(
 *   (data: string) => sendData(data),
 *   500
 * )
 *
 * // 使用节流回调
 * // Use throttled callback
 * throttledCallback('data')
 *
 * // 取消待执行的调用
 * // Cancel pending call
 * cancel()
 *
 * // 立即执行待执行的调用
 * // Immediately execute pending call
 * flush()
 *
```
 */
export function useControllableThrottle<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number,
  options: { leading?: boolean; trailing?: boolean } = {}
): {
  throttledCallback: (...args: Parameters<T>) => void
  cancel: () => void
  flush: () => void
  isThrottled: boolean
} {
  const { leading = true, trailing = true } = options
  const lastExecutedRef = useRef<number>(0)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastArgsRef = useRef<Parameters<T> | null>(null)
  const [isThrottled, setIsThrottled] = useState<boolean>(false)

  const cancel = useCallback((): void => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
      setIsThrottled(false)
    }
    lastArgsRef.current = null
  }, [])

  const flush = useCallback((): void => {
    if (timeoutRef.current && lastArgsRef.current) {
      clearTimeout(timeoutRef.current)
      callback(...lastArgsRef.current)
      lastExecutedRef.current = Date.now()
      timeoutRef.current = null
      lastArgsRef.current = null
      setIsThrottled(false)
    }
  }, [callback])

  const throttledCallback = useCallback(
    (...args: Parameters<T>): void => {
      lastArgsRef.current = args
      const now = Date.now()
      const timeSinceLastExecution = now - lastExecutedRef.current

      // 如果启用 leading 且是第一次调用或已经超过延迟时间
      // If leading is enabled and it's first call or delay time has passed
      if (leading && (lastExecutedRef.current === 0 || timeSinceLastExecution >= delay)) {
        callback(...args)
        lastExecutedRef.current = now
        setIsThrottled(false)
        return
      }

      // 如果启用 trailing，设置定时器在延迟后执行
      // If trailing is enabled, set timer to execute after delay
      if (trailing) {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }

        setIsThrottled(true)
        const remainingTime = delay - timeSinceLastExecution
        timeoutRef.current = setTimeout(
          () => {
            if (lastArgsRef.current) {
              callback(...lastArgsRef.current)
              lastExecutedRef.current = Date.now()
            }
            timeoutRef.current = null
            lastArgsRef.current = null
            setIsThrottled(false)
          },
          remainingTime > 0 ? remainingTime : delay
        )
      }
    },
    [callback, delay, leading, trailing]
  )

  return {
    throttledCallback,
    cancel,
    flush,
    isThrottled
  }
}
