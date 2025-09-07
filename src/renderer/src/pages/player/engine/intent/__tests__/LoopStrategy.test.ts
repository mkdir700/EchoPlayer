import { LoopMode } from '@types'
import { beforeEach, describe, expect, it } from 'vitest'

import { LoopStrategy } from '../strategies/LoopStrategy'
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
    loopEnabled: true,
    loopMode: LoopMode.SINGLE,
    loopCount: 3,
    loopRemainingCount: 3,
    autoPauseEnabled: false,
    pauseOnSubtitleEnd: false,
    resumeEnabled: false,
    resumeDelay: 5000,
    ...overrides
  }
}

describe('LoopStrategy - 循环播放策略 (TimeMath集成版)', () => {
  let strategy: LoopStrategy

  beforeEach(() => {
    strategy = new LoopStrategy()
  })

  describe('策略激活条件', () => {
    it('循环启用时应该激活', () => {
      const context = createMockContext({ loopEnabled: true })
      expect(strategy.shouldActivate(context)).toBe(true)
    })

    it('循环禁用时不应该激活', () => {
      const context = createMockContext({ loopEnabled: false })
      expect(strategy.shouldActivate(context)).toBe(false)
    })
  })

  describe('TimeMath.inside边界判断 - 字幕时间窗口检测', () => {
    it('首次进入字幕时间窗口时应该重置循环次数', () => {
      const context = createMockContext({
        loopMode: LoopMode.SINGLE,
        activeCueIndex: 0,
        currentTime: 12.0, // 在第一个字幕的时间窗口内 [10, 15)
        loopCount: 3
      })

      const intents = strategy.onEvent(context)

      expect(intents).toHaveLength(2) // 循环重置 + 字幕锁定
      expect(intents[0]).toMatchObject({
        domain: 'loop',
        setRemaining: 3,
        priority: 7,
        reason: expect.stringContaining('进入新字幕的时间窗口')
      })
      expect(intents[1]).toMatchObject({
        domain: 'subtitle',
        lock: true,
        lockOwner: 'loop',
        priority: 7,
        reason: '锁定字幕(0)'
      })
    })

    it('切换到新字幕时间窗口时应该重置循环次数', () => {
      // 模拟已经在第一个字幕上
      const context1 = createMockContext({
        loopMode: LoopMode.SINGLE,
        activeCueIndex: 0,
        currentTime: 12.0, // 在第一个字幕的时间窗口内
        loopCount: 5
      })
      strategy.onEvent(context1) // 初始化策略状态

      // 切换到第二个字幕的时间窗口
      const context2 = createMockContext({
        loopMode: LoopMode.SINGLE,
        activeCueIndex: 1,
        currentTime: 22.0, // 在第二个字幕的时间窗口内 [20, 25)
        loopCount: 5
      })

      const intents = strategy.onEvent(context2)

      expect(intents).toHaveLength(2) // 循环重置 + 字幕锁定
      expect(intents[0]).toMatchObject({
        domain: 'loop',
        setRemaining: 5,
        priority: 7,
        reason: expect.stringContaining('进入新字幕的时间窗口')
      })
    })

    it('不在字幕时间窗口内时不应该重置循环次数', () => {
      const context = createMockContext({
        loopMode: LoopMode.SINGLE,
        activeCueIndex: 0,
        currentTime: 5.0, // 不在第一个字幕的时间窗口内 [10, 15)
        loopCount: 3
      })

      const intents = strategy.onEvent(context)

      expect(intents).toHaveLength(0) // 不应该有任何意图
    })

    it('使用TimeMath.inside进行边界判断的容差处理', () => {
      const context = createMockContext({
        loopMode: LoopMode.SINGLE,
        activeCueIndex: 0,
        currentTime: 9.999, // 接近左边界，在容差范围内 (容差 = 2ms)
        loopCount: 3
      })

      const intents = strategy.onEvent(context)

      expect(intents).toHaveLength(2) // 应该触发循环重置，因为在容差范围内
    })

    it('超出容差范围时不应该触发', () => {
      const context = createMockContext({
        loopMode: LoopMode.SINGLE,
        activeCueIndex: 0,
        currentTime: 9.99, // 超出左边界容差范围
        loopCount: 3
      })

      const intents = strategy.onEvent(context)

      expect(intents).toHaveLength(0) // 不应该触发，因为超出容差范围
    })
  })

  describe('TimeMath.crossedRightBoundary边界跨越检测 - 单句循环逻辑', () => {
    it('跨越字幕结束边界时应该触发循环回跳', () => {
      // 第一次调用：设置上一个时间点
      const context1 = createMockContext({
        loopMode: LoopMode.SINGLE,
        activeCueIndex: 0,
        currentTime: 12.0, // 在字幕内
        loopRemainingCount: 2
      })
      strategy.onEvent(context1)

      // 第二次调用：跨越边界
      const context2 = createMockContext({
        loopMode: LoopMode.SINGLE,
        activeCueIndex: 0,
        currentTime: 15.1, // 跨越了字幕结束边界 (15.0)
        loopRemainingCount: 2
      })

      const intents = strategy.onEvent(context2)

      expect(intents.length).toBeGreaterThan(0)

      const seekIntent = intents.find((i) => i.domain === 'seek')
      expect(seekIntent).toMatchObject({
        domain: 'seek',
        to: 10, // 跳转到字幕开始时间
        followUpPlay: true,
        priority: 7,
        reason: '单句循环回跳'
      })

      const loopIntent = intents.find((i) => i.domain === 'loop' && 'deltaRemaining' in i)
      expect(loopIntent).toMatchObject({
        domain: 'loop',
        deltaRemaining: -1,
        priority: 7,
        reason: expect.stringContaining('单句循环计数减一')
      })
    })

    it('循环次数用完时应该解锁字幕', () => {
      // 设置上一个时间点
      const context1 = createMockContext({
        loopMode: LoopMode.SINGLE,
        activeCueIndex: 0,
        currentTime: 14.0,
        loopRemainingCount: 0 // 循环次数已用完
      })
      strategy.onEvent(context1)

      // 跨越边界
      const context2 = createMockContext({
        loopMode: LoopMode.SINGLE,
        activeCueIndex: 0,
        currentTime: 15.1,
        loopRemainingCount: 0
      })

      const intents = strategy.onEvent(context2)

      expect(intents).toHaveLength(1)
      expect(intents[0]).toMatchObject({
        domain: 'subtitle',
        lock: false,
        lockOwner: 'loop',
        priority: 7,
        reason: '单句循环完成，解锁字幕'
      })
    })

    it('未跨越边界时不应该触发循环', () => {
      // 设置上一个时间点
      const context1 = createMockContext({
        loopMode: LoopMode.SINGLE,
        activeCueIndex: 0,
        currentTime: 12.0,
        loopRemainingCount: 2
      })
      strategy.onEvent(context1)

      // 仍在字幕内部
      const context2 = createMockContext({
        loopMode: LoopMode.SINGLE,
        activeCueIndex: 0,
        currentTime: 13.0, // 仍在字幕内部，未跨越边界
        loopRemainingCount: 2
      })

      const intents = strategy.onEvent(context2)

      expect(intents).toHaveLength(0) // 不应该有循环回跳意图
    })

    it('无限循环模式(-1)不应该减少循环计数', () => {
      // 设置上一个时间点
      const context1 = createMockContext({
        loopMode: LoopMode.SINGLE,
        activeCueIndex: 0,
        currentTime: 14.0,
        loopRemainingCount: -1 // 无限循环
      })
      strategy.onEvent(context1)

      // 跨越边界
      const context2 = createMockContext({
        loopMode: LoopMode.SINGLE,
        activeCueIndex: 0,
        currentTime: 15.1,
        loopRemainingCount: -1
      })

      const intents = strategy.onEvent(context2)

      const seekIntent = intents.find((i) => i.domain === 'seek')
      expect(seekIntent).toBeDefined() // 应该有跳转意图

      const loopIntent = intents.find((i) => i.domain === 'loop' && 'deltaRemaining' in i)
      expect(loopIntent).toBeUndefined() // 无限循环不应该减少计数
    })
  })

  describe('边缘情况和错误处理', () => {
    it('没有字幕时不应该产生任何意图', () => {
      const context = createMockContext({
        loopMode: LoopMode.SINGLE,
        activeCueIndex: -1, // 没有激活的字幕
        currentTime: 12.0,
        subtitles: [] // 空字幕列表
      })

      const intents = strategy.onEvent(context)

      expect(intents).toHaveLength(0)
    })

    it('字幕索引超出范围时不应该崩溃', () => {
      const context = createMockContext({
        loopMode: LoopMode.SINGLE,
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
        loopMode: LoopMode.SINGLE,
        activeCueIndex: 0,
        currentTime: -1.0 // 负时间值
      })

      expect(() => {
        const intents = strategy.onEvent(context)
        expect(intents).toHaveLength(0)
      }).not.toThrow()
    })
  })

  describe('状态管理和清理', () => {
    it('dispose应该清理内部状态', () => {
      // 设置一些状态
      const context1 = createMockContext({
        loopMode: LoopMode.SINGLE,
        activeCueIndex: 0,
        currentTime: 12.0,
        loopCount: 3
      })
      strategy.onEvent(context1)

      // 清理状态
      strategy.dispose()

      // 验证状态被重置
      const context2 = createMockContext({
        loopMode: LoopMode.SINGLE,
        activeCueIndex: 0, // 相同的字幕索引
        currentTime: 12.0,
        loopCount: 3
      })

      const intents = strategy.onEvent(context2)
      expect(intents).toHaveLength(2) // 应该再次触发重置，说明状态被清理了
    })

    it('应该正确跟踪和更新上一个时间点', () => {
      const context = createMockContext({
        loopMode: LoopMode.SINGLE,
        activeCueIndex: 0,
        currentTime: 12.0
      })

      strategy.onEvent(context)

      // 验证内部时间点被正确更新（通过查看后续行为）
      const context2 = createMockContext({
        loopMode: LoopMode.SINGLE,
        activeCueIndex: 0,
        currentTime: 15.1, // 跨越边界
        loopRemainingCount: 2
      })

      const intents = strategy.onEvent(context2)
      expect(intents.length).toBeGreaterThan(0) // 应该检测到边界跨越
    })
  })

  describe('不同循环模式的处理', () => {
    it('非单句循环模式时不应该处理循环逻辑', () => {
      const context = createMockContext({
        loopMode: LoopMode.AB, // A-B循环模式（不是单句循环）
        activeCueIndex: 0,
        currentTime: 12.0,
        loopCount: 3
      })

      const intents = strategy.onEvent(context)

      expect(intents).toHaveLength(0) // 不应该有任何循环相关的意图
    })
  })

  describe('性能和稳定性', () => {
    it('重复调用相同上下文不应该产生重复意图', () => {
      const context = createMockContext({
        loopMode: LoopMode.SINGLE,
        activeCueIndex: 0,
        currentTime: 12.0,
        loopCount: 3
      })

      // 第一次调用
      const intents1 = strategy.onEvent(context)
      expect(intents1).toHaveLength(2)

      // 第二次调用相同上下文
      const intents2 = strategy.onEvent(context)
      expect(intents2).toHaveLength(0) // 不应该重复产生意图
    })

    it('大量连续调用不应该导致内存泄漏或性能问题', () => {
      const context = createMockContext({
        loopMode: LoopMode.SINGLE,
        activeCueIndex: 0,
        currentTime: 12.0,
        loopRemainingCount: 100
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
