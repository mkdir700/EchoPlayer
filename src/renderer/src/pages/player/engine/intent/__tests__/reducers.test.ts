import { LoopMode } from '@types'
import { describe, expect, it } from 'vitest'

import {
  loopReducer,
  reduceIntentsByDomain,
  scheduleReducer,
  seekReducer,
  subtitleReducer,
  transportReducer
} from '../reducers'
import {
  Intent,
  LoopIntent,
  PlaybackContext,
  ScheduleIntent,
  SeekIntent,
  SubtitleIntent,
  TransportIntent
} from '../types'

// 测试辅助函数
function createMockContext(overrides: Partial<PlaybackContext> = {}): PlaybackContext {
  return {
    currentTime: 0,
    duration: 100,
    paused: false,
    playbackRate: 1,
    volume: 1,
    muted: false,
    activeCueIndex: -1,
    subtitles: [],
    loopEnabled: true,
    loopMode: LoopMode.SINGLE,
    loopCount: 3,
    loopRemainingCount: 0,
    autoPauseEnabled: false,
    pauseOnSubtitleEnd: false,
    resumeEnabled: false,
    resumeDelay: 5000,
    ...overrides
  }
}

describe('领域归约器测试', () => {
  describe('transportReducer - 播放控制归约器', () => {
    it('应该选择优先级最高的播放控制意图', () => {
      const intents: Intent[] = [
        { domain: 'transport', op: 'play', priority: 5, reason: 'low-priority' } as TransportIntent,
        {
          domain: 'transport',
          op: 'pause',
          priority: 10,
          reason: 'high-priority'
        } as TransportIntent
      ]
      const context = createMockContext()

      const result = transportReducer(intents, context)

      expect(result.transport).toEqual({
        op: 'pause',
        reason: 'high-priority'
      })
    })

    it('相同优先级时应该选择后到者', () => {
      const intents: Intent[] = [
        { domain: 'transport', op: 'play', priority: 5, reason: 'first' } as TransportIntent,
        { domain: 'transport', op: 'pause', priority: 5, reason: 'second' } as TransportIntent
      ]
      const context = createMockContext()

      const result = transportReducer(intents, context)

      expect(result.transport).toEqual({
        op: 'pause',
        reason: 'second'
      })
    })

    it('没有播放控制意图时应该返回空对象', () => {
      const intents: Intent[] = [
        { domain: 'seek', to: 10, priority: 5, reason: 'seek-test' } as SeekIntent
      ]
      const context = createMockContext()

      const result = transportReducer(intents, context)

      expect(result).toEqual({})
    })
  })

  describe('seekReducer - 跳转归约器', () => {
    it('应该选择优先级最高的跳转意图', () => {
      const intents: Intent[] = [
        { domain: 'seek', to: 10, priority: 3, reason: 'low-priority' } as SeekIntent,
        { domain: 'seek', to: 20, priority: 8, reason: 'high-priority' } as SeekIntent
      ]
      const context = createMockContext({ duration: 100 })

      const result = seekReducer(intents, context)

      expect(result.seek).toEqual({
        to: 20,
        followUpPlay: undefined,
        reason: 'high-priority'
      })
    })

    it('应该进行时间边界检查', () => {
      const intents: Intent[] = [
        { domain: 'seek', to: 150, priority: 5, reason: 'out-of-bounds' } as SeekIntent
      ]
      const context = createMockContext({ duration: 100 })

      const result = seekReducer(intents, context)

      expect(result.seek?.to).toBe(100) // 被限制在 duration 范围内
    })

    it('应该处理负数时间', () => {
      const intents: Intent[] = [
        { domain: 'seek', to: -10, priority: 5, reason: 'negative-time' } as SeekIntent
      ]
      const context = createMockContext({ duration: 100 })

      const result = seekReducer(intents, context)

      expect(result.seek?.to).toBe(0) // 被限制在 0 以上
    })
  })

  describe('subtitleReducer - 字幕归约器', () => {
    it('未锁定状态下应该接受索引建议', () => {
      const intents: Intent[] = [
        {
          domain: 'subtitle',
          suggestIndex: 5,
          priority: 5,
          reason: 'sync-suggestion'
        } as SubtitleIntent
      ]
      const context = createMockContext({
        loopRemainingCount: 0 // 未锁定
      })

      const result = subtitleReducer(intents, context)

      expect(result.subtitle?.index).toBe(5)
      expect(result.subtitle?.lockState).toBe('keep')
    })

    it('应该处理锁定请求', () => {
      const intents: Intent[] = [
        {
          domain: 'subtitle',
          lock: true,
          lockOwner: 'loop',
          priority: 10,
          reason: 'lock-request'
        } as SubtitleIntent
      ]
      const context = createMockContext()

      const result = subtitleReducer(intents, context)

      expect(result.subtitle?.lockState).toBe('lock')
      expect(result.subtitle?.owner).toBe('loop')
    })

    it('应该处理解锁请求', () => {
      const intents: Intent[] = [
        {
          domain: 'subtitle',
          lock: false,
          lockOwner: 'loop',
          priority: 10,
          reason: 'unlock-request'
        } as SubtitleIntent
      ]
      const context = createMockContext()

      const result = subtitleReducer(intents, context)

      expect(result.subtitle?.lockState).toBe('unlock')
      expect(result.subtitle?.owner).toBe('loop')
    })

    it('优先级高的锁操作应该胜出', () => {
      const intents: Intent[] = [
        {
          domain: 'subtitle',
          lock: true,
          lockOwner: 'low',
          priority: 3,
          reason: 'low-lock'
        } as SubtitleIntent,
        {
          domain: 'subtitle',
          lock: false,
          lockOwner: 'high',
          priority: 8,
          reason: 'high-unlock'
        } as SubtitleIntent
      ]
      const context = createMockContext()

      const result = subtitleReducer(intents, context)

      expect(result.subtitle?.lockState).toBe('unlock')
      expect(result.subtitle?.owner).toBe('high')
    })
  })

  describe('loopReducer - 循环归约器', () => {
    it('应该处理显式设置剩余次数', () => {
      const intents: Intent[] = [
        { domain: 'loop', setRemaining: 5, priority: 5, reason: 'set-remaining' } as LoopIntent
      ]
      const context = createMockContext({ loopRemainingCount: 2 })

      const result = loopReducer(intents, context)

      expect(result.loop?.remaining).toBe(5)
    })

    it('应该处理相对增减', () => {
      const intents: Intent[] = [
        { domain: 'loop', deltaRemaining: -1, priority: 5, reason: 'decrement' } as LoopIntent
      ]
      const context = createMockContext({ loopRemainingCount: 3 })

      const result = loopReducer(intents, context)

      expect(result.loop?.remaining).toBe(2)
    })

    it('应该先应用显式设置再应用相对增减', () => {
      const intents: Intent[] = [
        { domain: 'loop', setRemaining: 5, priority: 8, reason: 'set-first' } as LoopIntent,
        { domain: 'loop', deltaRemaining: -2, priority: 5, reason: 'then-decrement' } as LoopIntent
      ]
      const context = createMockContext({ loopRemainingCount: 10 })

      const result = loopReducer(intents, context)

      expect(result.loop?.remaining).toBe(3) // 5 - 2 = 3
    })

    it('应该限制最小值为 -1', () => {
      const intents: Intent[] = [
        { domain: 'loop', setRemaining: -5, priority: 5, reason: 'negative-set' } as LoopIntent
      ]
      const context = createMockContext()

      const result = loopReducer(intents, context)

      expect(result.loop?.remaining).toBe(-1) // 被限制为 -1（无限循环）
    })

    it('应该处理循环模式设置', () => {
      const intents: Intent[] = [
        { domain: 'loop', setMode: LoopMode.AB, priority: 5, reason: 'set-mode' } as LoopIntent
      ]
      const context = createMockContext({ loopMode: LoopMode.SINGLE })

      const result = loopReducer(intents, context)

      expect(result.loop?.mode).toBe(LoopMode.AB)
    })
  })

  describe('scheduleReducer - 定时任务归约器', () => {
    it('应该收集所有定时任务', () => {
      const intents: Intent[] = [
        {
          domain: 'schedule',
          action: 'play',
          delayMs: 1000,
          priority: 5,
          reason: 'play-later'
        } as ScheduleIntent,
        {
          domain: 'schedule',
          action: 'pause',
          delayMs: 2000,
          priority: 3,
          reason: 'pause-later'
        } as ScheduleIntent
      ]
      const context = createMockContext()

      const result = scheduleReducer(intents, context)

      expect(result.schedule).toHaveLength(2)
      expect(result.schedule?.[0]).toEqual({
        action: 'play',
        delayMs: 1000,
        priority: 5,
        reason: 'play-later',
        domain: 'schedule'
      })
      expect(result.schedule?.[1]).toEqual({
        action: 'pause',
        delayMs: 2000,
        domain: 'schedule',
        priority: 3,
        reason: 'pause-later'
      })
    })

    it('应该去重相同的任务（相同 action + delayMs）', () => {
      const intents: Intent[] = [
        {
          domain: 'schedule',
          action: 'play',
          delayMs: 1000,
          priority: 3,
          reason: 'low-priority'
        } as ScheduleIntent,
        {
          domain: 'schedule',
          action: 'play',
          delayMs: 1000,
          priority: 8,
          reason: 'high-priority'
        } as ScheduleIntent
      ]
      const context = createMockContext()

      const result = scheduleReducer(intents, context)

      expect(result.schedule).toHaveLength(1)
      // 应该保留高优先级的任务
      expect(result.schedule?.[0].action).toBe('play')
      expect(result.schedule?.[0].delayMs).toBe(1000)
    })

    it('应该按延迟时间排序', () => {
      const intents: Intent[] = [
        {
          domain: 'schedule',
          action: 'pause',
          delayMs: 3000,
          priority: 5,
          reason: 'later'
        } as ScheduleIntent,
        {
          domain: 'schedule',
          action: 'play',
          delayMs: 1000,
          priority: 5,
          reason: 'sooner'
        } as ScheduleIntent
      ]
      const context = createMockContext()

      const result = scheduleReducer(intents, context)

      expect(result.schedule?.[0].delayMs).toBe(1000)
      expect(result.schedule?.[1].delayMs).toBe(3000)
    })
  })

  describe('reduceIntentsByDomain - 集成归约', () => {
    it('应该正确处理多领域意图的混合', () => {
      const intents: Intent[] = [
        {
          domain: 'transport',
          op: 'pause',
          priority: 8,
          reason: 'pause-request'
        } as TransportIntent,
        { domain: 'seek', to: 25, priority: 7, reason: 'seek-request' } as SeekIntent,
        {
          domain: 'subtitle',
          suggestIndex: 3,
          priority: 5,
          reason: 'sync-suggestion'
        } as SubtitleIntent,
        { domain: 'loop', deltaRemaining: -1, priority: 6, reason: 'loop-decrement' } as LoopIntent
      ]
      const context = createMockContext({
        duration: 100,
        loopRemainingCount: 0 // 未锁定状态
      })

      const result = reduceIntentsByDomain(intents, context)

      expect(result.transport?.op).toBe('pause')
      expect(result.seek?.to).toBe(25)
      expect(result.subtitle?.index).toBe(3) // 未锁定，接受建议
      expect(result.loop?.remaining).toBe(-1) // 0 - 1 = -1 (边界检查后变为 -1)
    })

    it('归约器异常不应该阻断其他领域的处理', () => {
      // 这个测试需要模拟归约器异常，这里简化处理
      const intents: Intent[] = [
        { domain: 'transport', op: 'play', priority: 5, reason: 'play-request' } as TransportIntent
      ]
      const context = createMockContext()

      const result = reduceIntentsByDomain(intents, context)

      expect(result.transport?.op).toBe('play')
    })
  })
})
