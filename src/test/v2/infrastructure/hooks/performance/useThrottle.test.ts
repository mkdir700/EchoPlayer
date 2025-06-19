import { renderHook, act } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  useThrottle,
  useThrottledCallback,
  useImmediateThrottle,
  useTrailingThrottle,
  useControllableThrottle
} from '@renderer/v2/infrastructure/hooks/performance/useThrottle'

describe('useThrottle Hooks / useThrottle Hooks', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
  })

  describe('useThrottle / useThrottle', () => {
    it('should return initial value immediately / 应该立即返回初始值', () => {
      const { result } = renderHook(() => useThrottle('initial', 500))

      expect(result.current).toBe('initial')
    })

    it('should throttle value updates / 应该节流值更新', () => {
      const { result, rerender } = renderHook(({ value }) => useThrottle(value, 500), {
        initialProps: { value: 'initial' }
      })

      expect(result.current).toBe('initial')

      // 第一次更新应该立即生效（leading edge）
      // First update should take effect immediately (leading edge)
      rerender({ value: 'update1' })
      expect(result.current).toBe('update1') // leading edge

      // 快速连续更新应该被节流
      // Rapid consecutive updates should be throttled
      rerender({ value: 'update2' })
      expect(result.current).toBe('update1') // throttled

      rerender({ value: 'update3' })
      expect(result.current).toBe('update1') // throttled

      // 快进时间到延迟结束
      // Fast forward time to end of delay
      act(() => {
        vi.advanceTimersByTime(500)
      })

      // 应该执行最后一次更新（trailing edge）
      // Should execute the last update (trailing edge)
      expect(result.current).toBe('update3') // trailing edge
    })

    it('should respect leading option / 应该遵循 leading 选项', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useThrottle(value, 500, { leading: false }),
        { initialProps: { value: 'initial' } }
      )

      expect(result.current).toBe('initial')

      rerender({ value: 'update1' })
      expect(result.current).toBe('initial') // no leading edge

      act(() => {
        vi.advanceTimersByTime(500)
      })

      expect(result.current).toBe('update1') // trailing edge
    })

    it('should respect trailing option / 应该遵循 trailing 选项', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useThrottle(value, 500, { trailing: false }),
        { initialProps: { value: 'initial' } }
      )

      expect(result.current).toBe('initial')

      rerender({ value: 'update1' })
      expect(result.current).toBe('update1') // leading edge

      rerender({ value: 'update2' })
      expect(result.current).toBe('update1') // throttled

      act(() => {
        vi.advanceTimersByTime(500)
      })

      expect(result.current).toBe('update1') // no trailing edge
    })

    it('should handle complex object values / 应该处理复杂对象值', () => {
      const initialValue = { count: 0, name: 'test' }
      const { result, rerender } = renderHook(({ value }) => useThrottle(value, 500), {
        initialProps: { value: initialValue }
      })

      expect(result.current).toEqual(initialValue)

      const newValue = { count: 1, name: 'updated' }
      rerender({ value: newValue })
      expect(result.current).toEqual(newValue) // leading edge

      const finalValue = { count: 2, name: 'final' }
      rerender({ value: finalValue })
      expect(result.current).toEqual(newValue) // throttled

      act(() => {
        vi.advanceTimersByTime(500)
      })

      expect(result.current).toEqual(finalValue) // trailing edge
    })
  })

  describe('useThrottledCallback / useThrottledCallback', () => {
    it('should throttle callback execution / 应该节流回调执行', () => {
      const mockCallback = vi.fn()
      const { result } = renderHook(() => useThrottledCallback(mockCallback, 500))

      // 快速连续调用
      // Rapidly call multiple times
      act(() => {
        result.current('arg1')
        result.current('arg2')
        result.current('arg3')
      })

      // 第一次调用应该立即执行（leading edge）
      // First call should execute immediately (leading edge)
      expect(mockCallback).toHaveBeenCalledTimes(1)
      expect(mockCallback).toHaveBeenCalledWith('arg1')

      // 快进时间
      // Fast forward time
      act(() => {
        vi.advanceTimersByTime(500)
      })

      // 应该执行最后一次调用（trailing edge）
      // Should execute the last call (trailing edge)
      expect(mockCallback).toHaveBeenCalledTimes(2)
      expect(mockCallback).toHaveBeenLastCalledWith('arg3')
    })

    it('should respect leading and trailing options / 应该遵循 leading 和 trailing 选项', () => {
      const mockCallback = vi.fn()
      const { result } = renderHook(() =>
        useThrottledCallback(mockCallback, 500, { leading: false, trailing: true })
      )

      act(() => {
        result.current('arg1')
        result.current('arg2')
      })

      // 没有 leading edge，不应该立即执行
      // No leading edge, should not execute immediately
      expect(mockCallback).not.toHaveBeenCalled()

      act(() => {
        vi.advanceTimersByTime(500)
      })

      // 应该执行最后一次调用（trailing edge）
      // Should execute the last call (trailing edge)
      expect(mockCallback).toHaveBeenCalledTimes(1)
      expect(mockCallback).toHaveBeenCalledWith('arg2')
    })

    it('should handle multiple arguments / 应该处理多个参数', () => {
      const mockCallback = vi.fn()
      const { result } = renderHook(() => useThrottledCallback(mockCallback, 500))

      act(() => {
        result.current('arg1', 'arg2', 'arg3')
      })

      expect(mockCallback).toHaveBeenCalledWith('arg1', 'arg2', 'arg3')
    })

    it('should maintain callback reference stability / 应该保持回调引用稳定性', () => {
      const mockCallback = vi.fn()
      const { result, rerender } = renderHook(
        ({ callback }) => useThrottledCallback(callback, 500),
        { initialProps: { callback: mockCallback } }
      )

      const firstCallback = result.current

      // 重新渲染但回调没有变化
      // Re-render but callback hasn't changed
      rerender({ callback: mockCallback })
      expect(result.current).toBe(firstCallback)

      // 回调变化时应该返回新的引用
      // Should return new reference when callback changes
      const newMockCallback = vi.fn()
      rerender({ callback: newMockCallback })
      expect(result.current).not.toBe(firstCallback)
    })
  })

  describe('useImmediateThrottle / useImmediateThrottle', () => {
    it('should execute immediately and throttle subsequent calls / 应该立即执行并节流后续调用', () => {
      const mockCallback = vi.fn()
      const { result } = renderHook(() => useImmediateThrottle(mockCallback, 500))

      act(() => {
        result.current('arg1')
        result.current('arg2')
        result.current('arg3')
      })

      // 应该立即执行第一次调用
      // Should execute first call immediately
      expect(mockCallback).toHaveBeenCalledTimes(1)
      expect(mockCallback).toHaveBeenCalledWith('arg1')

      act(() => {
        vi.advanceTimersByTime(500)
      })

      // 不应该有 trailing edge 执行
      // Should not have trailing edge execution
      expect(mockCallback).toHaveBeenCalledTimes(1)
    })
  })

  describe('useTrailingThrottle / useTrailingThrottle', () => {
    it('should only execute at the end of throttle cycle / 应该只在节流周期结束时执行', () => {
      const mockCallback = vi.fn()
      const { result } = renderHook(() => useTrailingThrottle(mockCallback, 500))

      act(() => {
        result.current('arg1')
        result.current('arg2')
        result.current('arg3')
      })

      // 不应该立即执行
      // Should not execute immediately
      expect(mockCallback).not.toHaveBeenCalled()

      act(() => {
        vi.advanceTimersByTime(500)
      })

      // 应该执行最后一次调用
      // Should execute the last call
      expect(mockCallback).toHaveBeenCalledTimes(1)
      expect(mockCallback).toHaveBeenCalledWith('arg3')
    })
  })

  describe('useControllableThrottle / useControllableThrottle', () => {
    it('should provide throttled callback with control methods / 应该提供带控制方法的节流回调', () => {
      const mockCallback = vi.fn()
      const { result } = renderHook(() => useControllableThrottle(mockCallback, 500))

      expect(result.current).toHaveProperty('throttledCallback')
      expect(result.current).toHaveProperty('cancel')
      expect(result.current).toHaveProperty('flush')
      expect(result.current).toHaveProperty('isThrottled')
      expect(result.current.isThrottled).toBe(false)
    })

    it('should cancel pending execution / 应该取消待执行的调用', () => {
      const mockCallback = vi.fn()
      const { result } = renderHook(() => useControllableThrottle(mockCallback, 500))

      act(() => {
        result.current.throttledCallback('arg1')
        result.current.throttledCallback('arg2')
      })

      expect(mockCallback).toHaveBeenCalledTimes(1) // leading edge
      expect(result.current.isThrottled).toBe(true)

      // 取消待执行的调用
      // Cancel pending execution
      act(() => {
        result.current.cancel()
      })

      expect(result.current.isThrottled).toBe(false)

      act(() => {
        vi.advanceTimersByTime(500)
      })

      // 不应该执行被取消的调用
      // Should not execute cancelled call
      expect(mockCallback).toHaveBeenCalledTimes(1)
    })

    it('should flush pending execution immediately / 应该立即执行待执行的调用', () => {
      const mockCallback = vi.fn()
      const { result } = renderHook(() => useControllableThrottle(mockCallback, 500))

      act(() => {
        result.current.throttledCallback('arg1')
        result.current.throttledCallback('arg2')
      })

      expect(mockCallback).toHaveBeenCalledTimes(1) // leading edge
      expect(result.current.isThrottled).toBe(true)

      // 立即执行待执行的调用
      // Flush pending execution immediately
      act(() => {
        result.current.flush()
      })

      expect(mockCallback).toHaveBeenCalledTimes(2)
      expect(mockCallback).toHaveBeenLastCalledWith('arg2')
      expect(result.current.isThrottled).toBe(false)
    })

    it('should track throttled state correctly / 应该正确跟踪节流状态', () => {
      const mockCallback = vi.fn()
      const { result } = renderHook(() => useControllableThrottle(mockCallback, 500))

      expect(result.current.isThrottled).toBe(false)

      act(() => {
        result.current.throttledCallback('arg1')
      })

      expect(result.current.isThrottled).toBe(false) // leading edge executed

      act(() => {
        result.current.throttledCallback('arg2')
      })

      expect(result.current.isThrottled).toBe(true) // pending execution

      act(() => {
        vi.advanceTimersByTime(500)
      })

      expect(result.current.isThrottled).toBe(false) // execution completed
    })
  })
})
