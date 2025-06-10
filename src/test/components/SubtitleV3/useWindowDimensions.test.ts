import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useWindowDimensions } from '@renderer/components/VideoPlayer/SubtitleV3/hooks/useWindowDimensions'

// Mock window properties / 模拟window属性
const mockWindow = {
  innerWidth: 1024,
  innerHeight: 768,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn()
}

// Setup window mock / 设置window模拟
Object.defineProperty(global, 'window', {
  value: mockWindow,
  writable: true
})

describe('useWindowDimensions Hook / useWindowDimensions Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset window dimensions / 重置窗口尺寸
    mockWindow.innerWidth = 1024
    mockWindow.innerHeight = 768
  })

  afterEach(() => {
    vi.clearAllTimers()
  })

  it('should return initial window dimensions / 应该返回初始窗口尺寸', () => {
    const { result } = renderHook(() => useWindowDimensions())

    expect(result.current).toEqual({
      width: 1024,
      height: 768
    })
  })

  it('should add resize event listener on mount / 挂载时应该添加resize事件监听器', () => {
    renderHook(() => useWindowDimensions())

    expect(mockWindow.addEventListener).toHaveBeenCalledWith('resize', expect.any(Function))
  })

  it('should remove resize event listener on unmount / 卸载时应该移除resize事件监听器', () => {
    const { unmount } = renderHook(() => useWindowDimensions())

    unmount()

    expect(mockWindow.removeEventListener).toHaveBeenCalledWith('resize', expect.any(Function))
  })

  it('should update dimensions when window is resized / 窗口调整大小时应该更新尺寸', async () => {
    // Use fake timers for throttling / 使用假定时器进行节流
    vi.useFakeTimers()

    const { result } = renderHook(() => useWindowDimensions())

    // Get the resize handler / 获取resize处理器
    const resizeHandler = mockWindow.addEventListener.mock.calls.find(
      (call) => call[0] === 'resize'
    )?.[1]

    expect(resizeHandler).toBeDefined()

    // Simulate window resize / 模拟窗口调整大小
    act(() => {
      mockWindow.innerWidth = 1200
      mockWindow.innerHeight = 800
      // Call the resize handler / 调用resize处理器
      resizeHandler?.()
      // Fast-forward timers to trigger throttled update / 快进定时器以触发节流更新
      vi.advanceTimersByTime(100)
    })

    expect(result.current).toEqual({
      width: 1200,
      height: 800
    })

    vi.useRealTimers()
  })

  it('should not update state if dimensions have not changed / 如果尺寸未改变应该不更新状态', async () => {
    vi.useFakeTimers()

    const { result } = renderHook(() => useWindowDimensions())
    const initialResult = result.current

    // Get the resize handler / 获取resize处理器
    const resizeHandler = mockWindow.addEventListener.mock.calls.find(
      (call) => call[0] === 'resize'
    )?.[1]

    // Trigger resize with same dimensions / 触发相同尺寸的resize
    act(() => {
      // Keep same dimensions / 保持相同尺寸
      mockWindow.innerWidth = 1024
      mockWindow.innerHeight = 768
      resizeHandler?.()
      vi.advanceTimersByTime(100)
    })

    // Should be the same object reference (no re-render) / 应该是相同的对象引用（无重新渲染）
    expect(result.current).toBe(initialResult)

    vi.useRealTimers()
  })

  it('should throttle resize events / 应该节流resize事件', async () => {
    vi.useFakeTimers()

    const { result } = renderHook(() => useWindowDimensions())

    // Get the resize handler / 获取resize处理器
    const resizeHandler = mockWindow.addEventListener.mock.calls.find(
      (call) => call[0] === 'resize'
    )?.[1]

    // Trigger multiple rapid resize events / 触发多个快速resize事件
    act(() => {
      mockWindow.innerWidth = 800
      mockWindow.innerHeight = 600
      resizeHandler?.()

      mockWindow.innerWidth = 900
      mockWindow.innerHeight = 650
      resizeHandler?.()

      mockWindow.innerWidth = 1000
      mockWindow.innerHeight = 700
      resizeHandler?.()

      // Only advance by 50ms (less than throttle delay) / 只前进50ms（小于节流延迟）
      vi.advanceTimersByTime(50)
    })

    // Should still be initial dimensions / 应该仍然是初始尺寸
    expect(result.current).toEqual({
      width: 1024,
      height: 768
    })

    // Now advance past throttle delay / 现在前进超过节流延迟
    act(() => {
      vi.advanceTimersByTime(60) // Total 110ms, past 100ms throttle
    })

    // Should now have the latest dimensions / 现在应该有最新的尺寸
    expect(result.current).toEqual({
      width: 1000,
      height: 700
    })

    vi.useRealTimers()
  })

  it('should handle different window sizes correctly / 应该正确处理不同的窗口尺寸', async () => {
    vi.useFakeTimers()

    // Test with small window / 测试小窗口
    mockWindow.innerWidth = 320
    mockWindow.innerHeight = 240

    const { result, unmount } = renderHook(() => useWindowDimensions())

    expect(result.current).toEqual({
      width: 320,
      height: 240
    })

    unmount()

    // Test with large window / 测试大窗口
    mockWindow.innerWidth = 2560
    mockWindow.innerHeight = 1440

    const { result: result2 } = renderHook(() => useWindowDimensions())

    expect(result2.current).toEqual({
      width: 2560,
      height: 1440
    })

    vi.useRealTimers()
  })
})
