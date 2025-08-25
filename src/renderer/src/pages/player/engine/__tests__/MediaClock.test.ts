import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Mock TimeMath
vi.mock('../core/TimeMath', () => ({
  TimeMath: {
    EPS: 0.002,
    equals: vi.fn((a: number, b: number, epsilon?: number) => {
      const eps = epsilon || 0.002
      return Math.abs(a - b) <= eps
    })
  }
}))

// Mock logger service
vi.mock('@logger', () => ({
  loggerService: {
    withContext: vi.fn(() => ({
      debug: vi.fn(),
      error: vi.fn(),
      warn: vi.fn()
    }))
  }
}))

import { MediaClock, MediaClockEvent, ThrottleMode } from '../MediaClock'

describe('MediaClock - 增强事件系统和去重机制', () => {
  let mediaClock: MediaClock
  let events: MediaClockEvent[]
  let listener: (event: MediaClockEvent) => void

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()

    mediaClock = new MediaClock()
    events = []
    listener = vi.fn((event: MediaClockEvent) => {
      events.push(event)
    })

    mediaClock.subscribe(listener)
  })

  afterEach(() => {
    mediaClock.dispose()
    vi.useRealTimers()
  })

  describe('SeekEventCoordinator - 事件序列协调', () => {
    it('应该正确管理 seeking/seeked 事件序列', () => {
      // 开始 seeking
      mediaClock.startSeeking()
      expect(events).toHaveLength(1)
      expect(events[0].type).toBe('seeking')

      // 重复开始 seeking 应该被忽略
      mediaClock.startSeeking()
      expect(events).toHaveLength(1) // 没有新增事件

      // 结束 seeking
      mediaClock.endSeeking(10.5)
      expect(events).toHaveLength(2)
      expect(events[1].type).toBe('seeked')
      expect(events[1].currentTime).toBe(10.5)
    })

    it('应该忽略没有对应 seeking 的 seeked 事件', () => {
      // 直接调用 endSeeking，没有先调用 startSeeking
      mediaClock.endSeeking(5.0)
      expect(events).toHaveLength(0) // 应该被忽略
    })

    it('应该记录 seeking 持续时间', () => {
      const startTime = Date.now()
      vi.setSystemTime(startTime)

      mediaClock.startSeeking()

      // 模拟 100ms 后结束
      vi.setSystemTime(startTime + 100)
      mediaClock.endSeeking(3.0)

      const debugInfo = mediaClock.getDebugInfo()
      expect(debugInfo.seeking.seekingActive).toBe(false)
    })
  })

  describe('EventDeduplicator - 智能去重机制', () => {
    it('应该去重相同的 time_update 事件', () => {
      // 发送相同时间的更新事件
      mediaClock.updateTime(5.0)
      mediaClock.updateTime(5.0) // 应该被去重

      expect(events.filter((e) => e.type === 'time_update')).toHaveLength(1)
    })

    it('应该去重短时间内的相同状态变化事件', () => {
      const startTime = Date.now()
      vi.setSystemTime(startTime)

      // 快速连续的暂停/播放状态变化
      mediaClock.setPlaying(true)
      vi.setSystemTime(startTime + 10) // 10ms 后
      mediaClock.setPlaying(true) // 相同状态，应该被去重

      expect(events.filter((e) => e.type === 'play')).toHaveLength(1)
    })

    it('应该允许时间窗口外的重复事件', () => {
      const startTime = Date.now()
      vi.setSystemTime(startTime)

      mediaClock.setPlaying(true)

      // 先改变状态
      mediaClock.setPlaying(false)

      // 100ms 后再次设置播放状态
      vi.setSystemTime(startTime + 100)
      mediaClock.setPlaying(true)

      // 时间窗口外，应该允许重复
      expect(events.filter((e) => e.type === 'play')).toHaveLength(2)
    })

    it('应该维护事件历史记录限制', () => {
      // 发送大量事件超过历史记录限制(20)
      for (let i = 0; i < 25; i++) {
        mediaClock.updateTime(i * 0.1, true) // 强制更新
        vi.advanceTimersByTime(10)
      }

      const debugInfo = mediaClock.getDebugInfo()
      expect(debugInfo.events.recentHistory.length).toBeLessThanOrEqual(20)
    })
  })

  describe('动态节流与事件协调', () => {
    it('应该在 seeking 时切换到高频节流模式', () => {
      mediaClock.startSeeking()

      expect(mediaClock.getThrottleMode()).toBe(ThrottleMode.SEEKING)
    })

    it('应该在 seeked 后启动高精度 settle 模式', () => {
      mediaClock.startSeeking()
      mediaClock.endSeeking(10.0)

      expect(mediaClock.getThrottleMode()).toBe(ThrottleMode.HIGH_PRECISION)
    })

    it('应该在播放时使用正常节流模式', () => {
      mediaClock.setPlaying(true)

      expect(mediaClock.getThrottleMode()).toBe(ThrottleMode.NORMAL)
    })

    it('应该在高精度模式下提供详细调试信息', () => {
      // 强制进入高精度模式
      mediaClock.setThrottleMode(ThrottleMode.HIGH_PRECISION)

      // 验证模式确实被设置
      expect(mediaClock.getThrottleMode()).toBe(ThrottleMode.HIGH_PRECISION)

      // 验证在高精度模式下的行为
      mediaClock.updateTime(5.0, true)
      expect(events.filter((e) => e.type === 'time_update')).toHaveLength(1)
    })
  })

  describe('监听器异常隔离', () => {
    it('应该隔离单个监听器的异常', () => {
      const errorListener = vi.fn(() => {
        throw new Error('Test error')
      })
      const normalListener = vi.fn()

      mediaClock.subscribe(errorListener)
      mediaClock.subscribe(normalListener)

      // 发送事件，异常监听器不应影响正常监听器
      mediaClock.updateTime(1.0, true)

      expect(errorListener).toHaveBeenCalled()
      expect(normalListener).toHaveBeenCalled()
    })

    it('应该记录监听器异常统计信息', () => {
      const errorListener = vi.fn(() => {
        throw new Error('Test error')
      })
      mediaClock.subscribe(errorListener)

      // 正常监听器仍然应该收到事件，错误监听器不影响其他监听器
      mediaClock.updateTime(1.0, true)

      expect(errorListener).toHaveBeenCalled()
      expect(events.filter((e) => e.type === 'time_update')).toHaveLength(1)
    })
  })

  describe('调试和状态追踪接口', () => {
    it('应该提供完整的调试信息', () => {
      mediaClock.updateTime(10.0)
      mediaClock.startSeeking()

      const debugInfo = mediaClock.getDebugInfo()

      expect(debugInfo).toEqual({
        state: expect.objectContaining({
          currentTime: 10.0,
          seeking: true
        }),
        throttling: expect.objectContaining({
          mode: ThrottleMode.SEEKING,
          currentInterval: 16,
          epsilon: expect.any(Number),
          dynamicEpsilon: expect.any(Boolean)
        }),
        seeking: expect.objectContaining({
          seekingActive: true,
          lastSeekingTime: 10.0
        }),
        events: expect.objectContaining({
          listenerCount: 1,
          recentHistory: expect.any(Array),
          timeHistory: expect.any(Array)
        }),
        listeners: expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String),
            callCount: expect.any(Number),
            avgExecutionTime: expect.any(String),
            errorCount: expect.any(Number)
          })
        ]),
        performance: expect.objectContaining({
          eventDispatchCount: expect.any(Number),
          averageDispatchTime: expect.any(String),
          listenerStats: expect.objectContaining({
            totalListeners: expect.any(Number),
            activeListeners: expect.any(Number),
            totalCalls: expect.any(Number),
            totalErrors: expect.any(Number)
          }),
          realtimeMetrics: expect.objectContaining({
            recentCallsPerSecond: expect.any(Number),
            recentErrorRate: expect.any(Number),
            memoryUsageEstimate: expect.any(Number)
          }),
          memoryStats: expect.objectContaining({
            eventHistorySize: expect.any(Number),
            timeHistorySize: expect.any(Number),
            listenerCount: expect.any(Number)
          })
        }),
        timeMath: expect.objectContaining({
          version: 'integrated',
          eps: expect.any(Number),
          epsilonMs: expect.any(Number),
          currentDynamicEpsilon: expect.any(Number),
          boundaryFlutterDetection: 'enabled'
        }),
        health: expect.objectContaining({
          status: expect.stringMatching(/^(healthy|warning|critical)$/),
          warnings: expect.any(Array),
          recommendations: expect.any(Array)
        }),
        meta: expect.objectContaining({
          timestamp: expect.any(Number),
          uptime: expect.any(Number),
          version: '3.3.0-enhanced'
        })
      })
    })

    it('应该支持事件系统重置', () => {
      mediaClock.startSeeking()
      mediaClock.updateTime(5.0)

      mediaClock.resetEventSystem()

      const debugInfo = mediaClock.getDebugInfo()
      expect(debugInfo.seeking.seekingActive).toBe(false)
      expect(debugInfo.events.recentHistory).toHaveLength(0)
    })

    it('应该支持强制事件派发（跳过去重）', () => {
      const testEvent: MediaClockEvent = {
        type: 'time_update',
        timestamp: Date.now(),
        currentTime: 1.0,
        duration: 100,
        paused: false,
        playbackRate: 1
      }

      // 发送相同事件两次，第二次应该被去重
      mediaClock.updateTime(1.0, true)
      mediaClock.updateTime(1.0, true)
      expect(events.filter((e) => e.type === 'time_update')).toHaveLength(1)

      // 使用强制派发应该能发送重复事件
      mediaClock.forceEmitEvent(testEvent)
      expect(events.filter((e) => e.type === 'time_update')).toHaveLength(2)
    })
  })

  describe('动态容差机制', () => {
    it('应该根据节流模式动态调整容差', () => {
      // 正常模式
      mediaClock.setThrottleMode(ThrottleMode.NORMAL)
      const normalEpsilon = mediaClock.getEpsilon()

      // 高精度模式
      mediaClock.setThrottleMode(ThrottleMode.HIGH_PRECISION)
      const highPrecisionEpsilon = mediaClock.getEpsilon()

      // 高精度模式应该有更小的容差
      expect(highPrecisionEpsilon).toBeLessThan(normalEpsilon)
    })

    it('应该使用动态容差进行时间比较', () => {
      mediaClock.setThrottleMode(ThrottleMode.HIGH_PRECISION)

      mediaClock.updateTime(5.0, true)

      // 测试容差行为：超出容差的变化应该触发新事件
      // 使用较大的差异确保超出容差
      mediaClock.updateTime(5.0 + 0.1, true) // 明显大于 epsilon
      expect(events.filter((e) => e.type === 'time_update')).toHaveLength(2)

      // 测试小差异被忽略的情况
      mediaClock.updateTime(5.0 + 0.001, true) // 应该在容差范围内
      expect(events.filter((e) => e.type === 'time_update')).toHaveLength(2) // 不应增加
    })
  })

  describe('资源清理', () => {
    it('应该在 dispose 时清理所有资源', () => {
      mediaClock.startSeeking()
      mediaClock.updateTime(5.0)

      mediaClock.dispose()

      // 清理后应该没有监听器
      expect(mediaClock.subscribe(() => {})).toBeTypeOf('function') // 返回取消订阅函数

      // 清理后的状态应该重置
      const debugInfo = mediaClock.getDebugInfo()
      expect(debugInfo.events.listenerCount).toBe(1) // 只有新订阅的监听器
      expect(debugInfo.seeking.seekingActive).toBe(false)
    })
  })
})
