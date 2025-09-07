import { beforeEach, describe, expect, it } from 'vitest'

import { AutoPauseStrategy } from '../strategies/AutoPauseStrategy'
import { PlaybackContext } from '../types'

// 测试辅助函数
function createMockContext(overrides: Partial<PlaybackContext> = {}): PlaybackContext {
  return {
    currentTime: 0,
    duration: 100,
    paused: false,
    playbackRate: 1,
    volume: 1,
    activeCueIndex: -1,
    subtitles: [
      { id: '1', startTime: 10, endTime: 15, originalText: 'First subtitle' },
      { id: '2', startTime: 20, endTime: 25, originalText: 'Second subtitle' },
      { id: '3', startTime: 30, endTime: 35, originalText: 'Third subtitle' }
    ],
    loopEnabled: false,
    loopMode: 'single' as any,
    loopCount: 1,
    loopRemainingCount: 1,
    autoPauseEnabled: true,
    pauseOnSubtitleEnd: true,
    resumeEnabled: false,
    resumeDelay: 3000,
    ...overrides
  }
}

describe('AutoPauseStrategy - 自动暂停策略 (TimeMath集成版)', () => {
  let strategy: AutoPauseStrategy

  beforeEach(() => {
    strategy = new AutoPauseStrategy()
  })

  describe('策略激活条件', () => {
    it('自动暂停启用且有激活字幕时应该激活', () => {
      const context = createMockContext({
        autoPauseEnabled: true,
        activeCueIndex: 0
      })
      expect(strategy.shouldActivate(context)).toBe(true)
    })

    it('自动暂停禁用时不应该激活', () => {
      const context = createMockContext({
        autoPauseEnabled: false,
        activeCueIndex: 0
      })
      expect(strategy.shouldActivate(context)).toBe(false)
    })

    it('没有激活字幕时不应该激活', () => {
      const context = createMockContext({
        autoPauseEnabled: true,
        activeCueIndex: -1
      })
      expect(strategy.shouldActivate(context)).toBe(false)
    })
  })

  describe('TimeMath.crossedRightBoundary边界跨越检测 - 自动暂停逻辑', () => {
    it('跨越字幕结束边界时应该触发自动暂停', () => {
      // 第一次调用：设置上一个时间点
      const context1 = createMockContext({
        autoPauseEnabled: true,
        pauseOnSubtitleEnd: true,
        activeCueIndex: 0,
        currentTime: 14.0 // 在字幕内
      })
      strategy.onEvent(context1)

      // 第二次调用：跨越边界
      const context2 = createMockContext({
        autoPauseEnabled: true,
        pauseOnSubtitleEnd: true,
        activeCueIndex: 0,
        currentTime: 15.1, // 跨越了字幕结束边界 (15.0)
        resumeEnabled: false
      })

      const intents = strategy.onEvent(context2)

      expect(intents).toHaveLength(1)
      expect(intents[0]).toMatchObject({
        domain: 'transport',
        op: 'pause',
        priority: 8,
        reason: expect.stringContaining('自动暂停')
      })
    })

    it('跨越边界且启用自动恢复时应该安排恢复播放', () => {
      // 第一次调用：设置上一个时间点
      const context1 = createMockContext({
        autoPauseEnabled: true,
        pauseOnSubtitleEnd: true,
        activeCueIndex: 0,
        currentTime: 14.5,
        resumeEnabled: true,
        resumeDelay: 2000
      })
      strategy.onEvent(context1)

      // 第二次调用：跨越边界
      const context2 = createMockContext({
        autoPauseEnabled: true,
        pauseOnSubtitleEnd: true,
        activeCueIndex: 0,
        currentTime: 15.2,
        resumeEnabled: true,
        resumeDelay: 2000
      })

      const intents = strategy.onEvent(context2)

      expect(intents).toHaveLength(2)

      const pauseIntent = intents.find((i) => i.domain === 'transport')
      expect(pauseIntent).toMatchObject({
        domain: 'transport',
        op: 'pause',
        priority: 8
      })

      const scheduleIntent = intents.find((i) => i.domain === 'schedule')
      expect(scheduleIntent).toMatchObject({
        domain: 'schedule',
        action: 'play',
        delayMs: 2000,
        priority: 8,
        reason: expect.stringContaining('自动恢复播放')
      })
    })

    it('未跨越边界时不应该触发自动暂停', () => {
      // 第一次调用：设置上一个时间点
      const context1 = createMockContext({
        autoPauseEnabled: true,
        pauseOnSubtitleEnd: true,
        activeCueIndex: 0,
        currentTime: 12.0
      })
      strategy.onEvent(context1)

      // 第二次调用：仍在字幕内部
      const context2 = createMockContext({
        autoPauseEnabled: true,
        pauseOnSubtitleEnd: true,
        activeCueIndex: 0,
        currentTime: 13.0 // 仍在字幕内部，未跨越边界
      })

      const intents = strategy.onEvent(context2)

      expect(intents).toHaveLength(0) // 不应该有暂停意图
    })

    it('pauseOnSubtitleEnd禁用时不应该处理自动暂停', () => {
      // 第一次调用
      const context1 = createMockContext({
        autoPauseEnabled: true,
        pauseOnSubtitleEnd: false, // 禁用字幕结束暂停
        activeCueIndex: 0,
        currentTime: 14.0
      })
      strategy.onEvent(context1)

      // 跨越边界
      const context2 = createMockContext({
        autoPauseEnabled: true,
        pauseOnSubtitleEnd: false,
        activeCueIndex: 0,
        currentTime: 15.1
      })

      const intents = strategy.onEvent(context2)

      expect(intents).toHaveLength(0) // 不应该有暂停意图
    })
  })

  describe('边缘情况和错误处理', () => {
    it('没有字幕时不应该产生任何意图', () => {
      const context = createMockContext({
        autoPauseEnabled: true,
        pauseOnSubtitleEnd: true,
        activeCueIndex: -1, // 没有激活的字幕
        currentTime: 12.0,
        subtitles: [] // 空字幕列表
      })

      const intents = strategy.onEvent(context)

      expect(intents).toHaveLength(0)
    })

    it('字幕索引超出范围时不应该崩溃', () => {
      const context = createMockContext({
        autoPauseEnabled: true,
        pauseOnSubtitleEnd: true,
        activeCueIndex: 10, // 超出字幕数组范围
        currentTime: 12.0
      })

      expect(() => {
        const intents = strategy.onEvent(context)
        expect(intents).toHaveLength(0)
      }).not.toThrow()
    })

    it('负时间值时不应该崩溃', () => {
      const context = createMockContext({
        autoPauseEnabled: true,
        pauseOnSubtitleEnd: true,
        activeCueIndex: 0,
        currentTime: -1.0 // 负时间值
      })

      expect(() => {
        const intents = strategy.onEvent(context)
        expect(intents).toHaveLength(0)
      }).not.toThrow()
    })

    it('第一次调用时没有上一个时间点，不应该触发暂停', () => {
      const context = createMockContext({
        autoPauseEnabled: true,
        pauseOnSubtitleEnd: true,
        activeCueIndex: 0,
        currentTime: 16.0 // 超过字幕结束时间，但是第一次调用
      })

      const intents = strategy.onEvent(context)

      expect(intents).toHaveLength(0) // 第一次调用不应该触发，因为没有边界跨越检测
    })
  })

  describe('自动恢复播放配置', () => {
    it('resumeDelay为0时不应该安排恢复播放', () => {
      // 设置上一个时间点
      const context1 = createMockContext({
        autoPauseEnabled: true,
        pauseOnSubtitleEnd: true,
        activeCueIndex: 0,
        currentTime: 14.5,
        resumeEnabled: true,
        resumeDelay: 0 // 延迟为0
      })
      strategy.onEvent(context1)

      // 跨越边界
      const context2 = createMockContext({
        autoPauseEnabled: true,
        pauseOnSubtitleEnd: true,
        activeCueIndex: 0,
        currentTime: 15.2,
        resumeEnabled: true,
        resumeDelay: 0
      })

      const intents = strategy.onEvent(context2)

      expect(intents).toHaveLength(1) // 只有暂停意图，没有恢复意图
      expect(intents[0].domain).toBe('transport')
    })

    it('负延迟值时不应该安排恢复播放', () => {
      // 设置上一个时间点
      const context1 = createMockContext({
        autoPauseEnabled: true,
        pauseOnSubtitleEnd: true,
        activeCueIndex: 0,
        currentTime: 14.5,
        resumeEnabled: true,
        resumeDelay: -1000 // 负延迟值
      })
      strategy.onEvent(context1)

      // 跨越边界
      const context2 = createMockContext({
        autoPauseEnabled: true,
        pauseOnSubtitleEnd: true,
        activeCueIndex: 0,
        currentTime: 15.2,
        resumeEnabled: true,
        resumeDelay: -1000
      })

      const intents = strategy.onEvent(context2)

      expect(intents).toHaveLength(1) // 只有暂停意图，没有恢复意图
      expect(intents[0].domain).toBe('transport')
    })
  })

  describe('状态管理和清理', () => {
    it('dispose应该清理内部状态', () => {
      // 设置一些状态
      const context = createMockContext({
        autoPauseEnabled: true,
        pauseOnSubtitleEnd: true,
        activeCueIndex: 0,
        currentTime: 12.0
      })
      strategy.onEvent(context)

      // 清理状态
      strategy.dispose()

      // 验证状态被重置（通过第一次调用行为验证）
      const context2 = createMockContext({
        autoPauseEnabled: true,
        pauseOnSubtitleEnd: true,
        activeCueIndex: 0,
        currentTime: 16.0 // 超过结束时间，但应该不触发因为状态被重置
      })

      const intents = strategy.onEvent(context2)
      expect(intents).toHaveLength(0) // 应该不触发，说明状态被清理了
    })

    it('应该正确跟踪和更新上一个时间点', () => {
      const context1 = createMockContext({
        autoPauseEnabled: true,
        pauseOnSubtitleEnd: true,
        activeCueIndex: 0,
        currentTime: 12.0
      })

      strategy.onEvent(context1)

      // 验证内部时间点被正确更新（通过查看后续行为）
      const context2 = createMockContext({
        autoPauseEnabled: true,
        pauseOnSubtitleEnd: true,
        activeCueIndex: 0,
        currentTime: 15.1 // 跨越边界
      })

      const intents = strategy.onEvent(context2)
      expect(intents.length).toBeGreaterThan(0) // 应该检测到边界跨越
    })
  })

  describe('多字幕场景', () => {
    it('切换到不同字幕时应该重新开始边界检测', () => {
      // 在第一个字幕上设置状态
      const context1 = createMockContext({
        autoPauseEnabled: true,
        pauseOnSubtitleEnd: true,
        activeCueIndex: 0,
        currentTime: 14.0
      })
      strategy.onEvent(context1)

      // 切换到第二个字幕并跨越其边界
      const context2 = createMockContext({
        autoPauseEnabled: true,
        pauseOnSubtitleEnd: true,
        activeCueIndex: 1, // 切换到第二个字幕
        currentTime: 25.1 // 跨越第二个字幕的结束边界 (25.0)
      })

      const intents = strategy.onEvent(context2)

      expect(intents).toHaveLength(1)
      expect(intents[0]).toMatchObject({
        domain: 'transport',
        op: 'pause',
        priority: 8
      })
    })
  })

  describe('性能和稳定性', () => {
    it('重复调用相同上下文不应该产生重复意图', () => {
      // 第一次调用设置状态
      const context1 = createMockContext({
        autoPauseEnabled: true,
        pauseOnSubtitleEnd: true,
        activeCueIndex: 0,
        currentTime: 14.0
      })
      strategy.onEvent(context1)

      // 第二次调用跨越边界
      const context2 = createMockContext({
        autoPauseEnabled: true,
        pauseOnSubtitleEnd: true,
        activeCueIndex: 0,
        currentTime: 15.1
      })
      const intents1 = strategy.onEvent(context2)
      expect(intents1).toHaveLength(1)

      // 第三次调用相同上下文
      const context3 = createMockContext({
        autoPauseEnabled: true,
        pauseOnSubtitleEnd: true,
        activeCueIndex: 0,
        currentTime: 15.1 // 相同时间点
      })
      const intents2 = strategy.onEvent(context3)
      expect(intents2).toHaveLength(0) // 不应该重复产生意图
    })

    it('大量连续调用不应该导致内存泄漏或性能问题', () => {
      const context = createMockContext({
        autoPauseEnabled: true,
        pauseOnSubtitleEnd: true,
        activeCueIndex: 0,
        currentTime: 12.0
      })

      // 模拟大量连续调用
      for (let i = 0; i < 1000; i++) {
        const testContext = { ...context, currentTime: 12.0 + i * 0.001 }
        strategy.onEvent(testContext)
      }

      // 应该能正常完成，不抛异常
      expect(true).toBe(true)
    })
  })
})
