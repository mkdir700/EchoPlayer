import { renderHook, act } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  useDebounce,
  useDebouncedCallback,
  useImmediateDebounce
} from '@renderer/v2/infrastructure/hooks/performance/useDebounce'

describe('useDebounce Hook / useDebounce Hook', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
  })

  describe('useDebounce / useDebounce', () => {
    it('should return initial value immediately / 应该立即返回初始值', () => {
      const { result } = renderHook(() => useDebounce('initial', 500))

      expect(result.current).toBe('initial')
    })

    it('should debounce value updates / 应该防抖值更新', () => {
      const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
        initialProps: { value: 'initial', delay: 500 }
      })

      expect(result.current).toBe('initial')

      // 更新值但不等待
      // Update value but don't wait
      rerender({ value: 'updated', delay: 500 })
      expect(result.current).toBe('initial') // 仍然是初始值 / Still initial value

      // 快进时间但不到延迟时间
      // Fast forward time but not to delay time
      act(() => {
        vi.advanceTimersByTime(300)
      })
      expect(result.current).toBe('initial') // 仍然是初始值 / Still initial value

      // 快进到延迟时间
      // Fast forward to delay time
      act(() => {
        vi.advanceTimersByTime(200)
      })
      expect(result.current).toBe('updated') // 现在应该更新 / Should be updated now
    })

    it('should reset timer on rapid value changes / 快速值变化时应该重置定时器', () => {
      const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
        initialProps: { value: 'initial', delay: 500 }
      })

      // 快速连续更新值
      // Rapidly update values
      rerender({ value: 'update1', delay: 500 })
      act(() => {
        vi.advanceTimersByTime(300)
      })

      rerender({ value: 'update2', delay: 500 })
      act(() => {
        vi.advanceTimersByTime(300)
      })

      rerender({ value: 'final', delay: 500 })

      // 值应该仍然是初始值，因为定时器被重置了
      // Value should still be initial because timer was reset
      expect(result.current).toBe('initial')

      // 等待完整的延迟时间
      // Wait for full delay time
      act(() => {
        vi.advanceTimersByTime(500)
      })

      // 现在应该是最后的值
      // Should be the final value now
      expect(result.current).toBe('final')
    })

    it('should handle different data types / 应该处理不同的数据类型', () => {
      // 测试数字
      // Test number
      const { result: numberResult, rerender: numberRerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        {
          initialProps: { value: 0, delay: 100 }
        }
      )

      numberRerender({ value: 42, delay: 100 })
      act(() => {
        vi.advanceTimersByTime(100)
      })
      expect(numberResult.current).toBe(42)

      // 测试对象
      // Test object
      const initialObj = { name: 'initial' }
      const updatedObj = { name: 'updated' }

      const { result: objectResult, rerender: objectRerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        {
          initialProps: { value: initialObj, delay: 100 }
        }
      )

      objectRerender({ value: updatedObj, delay: 100 })
      act(() => {
        vi.advanceTimersByTime(100)
      })
      expect(objectResult.current).toBe(updatedObj)

      // 测试数组
      // Test array
      const { result: arrayResult, rerender: arrayRerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        {
          initialProps: { value: [1, 2], delay: 100 }
        }
      )

      arrayRerender({ value: [3, 4, 5], delay: 100 })
      act(() => {
        vi.advanceTimersByTime(100)
      })
      expect(arrayResult.current).toEqual([3, 4, 5])
    })

    it('should handle delay changes / 应该处理延迟时间变化', () => {
      const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
        initialProps: { value: 'initial', delay: 500 }
      })

      rerender({ value: 'updated', delay: 200 }) // 改变延迟时间 / Change delay time

      act(() => {
        vi.advanceTimersByTime(200)
      })

      expect(result.current).toBe('updated')
    })
  })

  describe('useDebouncedCallback / useDebouncedCallback', () => {
    it('should debounce callback execution / 应该防抖回调执行', () => {
      const mockCallback = vi.fn()
      const { result } = renderHook(() => useDebouncedCallback(mockCallback, 500))

      // 快速连续调用
      // Rapidly call multiple times
      act(() => {
        result.current('arg1')
        result.current('arg2')
        result.current('arg3')
      })

      // 回调不应该被调用
      // Callback should not be called yet
      expect(mockCallback).not.toHaveBeenCalled()

      // 快进时间
      // Fast forward time
      act(() => {
        vi.advanceTimersByTime(500)
      })

      // 回调应该只被调用一次，使用最后的参数
      // Callback should be called once with last arguments
      expect(mockCallback).toHaveBeenCalledTimes(1)
      expect(mockCallback).toHaveBeenCalledWith('arg3')
    })

    it('should handle multiple arguments / 应该处理多个参数', () => {
      const mockCallback = vi.fn()
      const { result } = renderHook(() => useDebouncedCallback(mockCallback, 300))

      act(() => {
        result.current('arg1', 'arg2', 42)
      })

      act(() => {
        vi.advanceTimersByTime(300)
      })

      expect(mockCallback).toHaveBeenCalledWith('arg1', 'arg2', 42)
    })

    it('should cancel previous calls / 应该取消之前的调用', () => {
      const mockCallback = vi.fn()
      const { result } = renderHook(() => useDebouncedCallback(mockCallback, 500))

      act(() => {
        result.current('first')
      })

      act(() => {
        vi.advanceTimersByTime(300)
      })

      act(() => {
        result.current('second')
      })

      act(() => {
        vi.advanceTimersByTime(500)
      })

      // 只有最后一次调用应该被执行
      // Only the last call should be executed
      expect(mockCallback).toHaveBeenCalledTimes(1)
      expect(mockCallback).toHaveBeenCalledWith('second')
    })
  })

  describe('useImmediateDebounce / useImmediateDebounce', () => {
    it('should execute immediately when immediate is true / immediate为true时应该立即执行', () => {
      const mockCallback = vi.fn()
      const { result } = renderHook(() => useImmediateDebounce(mockCallback, 500, true))

      act(() => {
        result.current('immediate')
      })

      // 应该立即被调用
      // Should be called immediately
      expect(mockCallback).toHaveBeenCalledTimes(1)
      expect(mockCallback).toHaveBeenCalledWith('immediate')
    })

    it('should debounce subsequent calls when immediate is true / immediate为true时应该防抖后续调用', () => {
      const mockCallback = vi.fn()
      const { result } = renderHook(() => useImmediateDebounce(mockCallback, 500, true))

      act(() => {
        result.current('first')
        result.current('second')
        result.current('third')
      })

      // 只有第一次调用应该立即执行
      // Only first call should execute immediately
      expect(mockCallback).toHaveBeenCalledTimes(1)
      expect(mockCallback).toHaveBeenCalledWith('first')

      act(() => {
        vi.advanceTimersByTime(500)
      })

      // 延迟后不应该有额外的调用（因为immediate模式）
      // No additional calls after delay (because of immediate mode)
      expect(mockCallback).toHaveBeenCalledTimes(1)
    })

    it('should behave like regular debounce when immediate is false / immediate为false时应该像常规防抖一样', () => {
      const mockCallback = vi.fn()
      const { result } = renderHook(() => useImmediateDebounce(mockCallback, 500, false))

      act(() => {
        result.current('delayed')
      })

      // 不应该立即被调用
      // Should not be called immediately
      expect(mockCallback).not.toHaveBeenCalled()

      act(() => {
        vi.advanceTimersByTime(500)
      })

      // 延迟后应该被调用
      // Should be called after delay
      expect(mockCallback).toHaveBeenCalledTimes(1)
      expect(mockCallback).toHaveBeenCalledWith('delayed')
    })

    it('should reset immediate behavior after delay / 延迟后应该重置立即行为', () => {
      const mockCallback = vi.fn()
      const { result } = renderHook(() => useImmediateDebounce(mockCallback, 500, true))

      // 第一次调用
      // First call
      act(() => {
        result.current('first')
      })
      expect(mockCallback).toHaveBeenCalledTimes(1)

      // 等待延迟时间
      // Wait for delay
      act(() => {
        vi.advanceTimersByTime(500)
      })

      // 重置后，下一次调用应该再次立即执行
      // After reset, next call should execute immediately again
      act(() => {
        result.current('second')
      })
      expect(mockCallback).toHaveBeenCalledTimes(2)
      expect(mockCallback).toHaveBeenLastCalledWith('second')
    })
  })
})
