import { beforeEach, describe, expect, it } from 'vitest'

import { SubtitleSyncStrategy } from '../strategies/SubtitleSyncStrategy'
import { PlaybackContext, SubtitleIntent } from '../types'

// 测试辅助函数
function createMockContext(overrides: Partial<PlaybackContext> = {}): PlaybackContext {
  return {
    currentTime: 0,
    duration: 100,
    paused: false,
    playbackRate: 1,
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
    autoPauseEnabled: false,
    pauseOnSubtitleEnd: false,
    resumeEnabled: false,
    resumeDelay: 3000,
    ...overrides
  }
}

// 类型辅助函数
function asSubtitleIntent(intent: any): SubtitleIntent {
  return intent as SubtitleIntent
}

describe('SubtitleSyncStrategy - 字幕同步策略 (TimeMath集成版)', () => {
  let strategy: SubtitleSyncStrategy

  beforeEach(() => {
    strategy = new SubtitleSyncStrategy()
  })

  describe('策略激活条件', () => {
    it('有字幕时应该激活', () => {
      const context = createMockContext({
        subtitles: [{ id: '1', startTime: 10, endTime: 15, originalText: 'Test subtitle' }]
      })
      expect(strategy.shouldActivate(context)).toBe(true)
    })

    it('没有字幕时不应该激活', () => {
      const context = createMockContext({
        subtitles: []
      })
      expect(strategy.shouldActivate(context)).toBe(false)
    })
  })

  describe('TimeMath.inside边界判断 - 字幕时间窗口检测', () => {
    it('在字幕时间窗口内应该建议对应索引', () => {
      const context = createMockContext({
        currentTime: 12.0, // 在第一个字幕的时间窗口内 [10, 15)
        activeCueIndex: -1 // 当前没有激活字幕
      })

      const intents = strategy.onEvent(context)

      expect(intents).toHaveLength(1)
      expect(intents[0]).toMatchObject({
        domain: 'subtitle',
        suggestIndex: 0, // 建议第一个字幕
        priority: 6,
        reason: expect.stringContaining('字幕同步建议')
      })
      expect(asSubtitleIntent(intents[0]).suggestIndex).toBe(0)
    })

    it('在多个字幕的时间窗口中应该建议第一个匹配的', () => {
      const context = createMockContext({
        currentTime: 22.0, // 在第二个字幕的时间窗口内 [20, 25)
        activeCueIndex: -1
      })

      const intents = strategy.onEvent(context)

      expect(intents).toHaveLength(1)
      expect(intents[0]).toMatchObject({
        domain: 'subtitle',
        suggestIndex: 1, // 建议第二个字幕
        priority: 6
      })
      expect(asSubtitleIntent(intents[0]).suggestIndex).toBe(1)
    })

    it('使用TimeMath.inside进行边界判断的容差处理', () => {
      const context = createMockContext({
        currentTime: 9.999, // 接近左边界，在容差范围内 (容差 = 30ms)
        activeCueIndex: -1
      })

      const intents = strategy.onEvent(context)

      expect(intents).toHaveLength(1)
      expect(asSubtitleIntent(intents[0]).suggestIndex).toBe(0) // 应该触发第一个字幕，因为在容差范围内
    })

    it('超出容差范围时不应该匹配字幕窗口', () => {
      const context = createMockContext({
        currentTime: 9.95, // 超出左边界容差范围 (30ms = 0.03s)
        activeCueIndex: -1
      })

      const intents = strategy.onEvent(context)

      // 应该寻找最近的字幕
      expect(intents).toHaveLength(1)
      expect(asSubtitleIntent(intents[0]).suggestIndex).toBe(0) // 最近的字幕仍是第一个
    })

    it('右边界测试 - 在endTime之前应该匹配', () => {
      const context = createMockContext({
        currentTime: 14.999, // 在第一个字幕结束前的极小时间
        activeCueIndex: -1
      })

      const intents = strategy.onEvent(context)

      expect(intents).toHaveLength(1)
      expect(asSubtitleIntent(intents[0]).suggestIndex).toBe(0)
    })

    it('右边界测试 - 跨越endTime后不应该匹配时间窗口', () => {
      const context = createMockContext({
        currentTime: 15.001, // 超出第一个字幕的结束时间
        activeCueIndex: -1
      })

      const intents = strategy.onEvent(context)

      expect(intents).toHaveLength(1)
      // 应该匹配最近的字幕，这时应该是第一个字幕 (距离 0.001s)
      expect(asSubtitleIntent(intents[0]).suggestIndex).toBe(0)
    })
  })

  describe('最近字幕搜索逻辑', () => {
    it('当前时间在字幕间隙时应该找到最近的字幕', () => {
      const context = createMockContext({
        currentTime: 17.0, // 在第一和第二个字幕之间
        activeCueIndex: -1
      })

      const intents = strategy.onEvent(context)

      expect(intents).toHaveLength(1)
      // 17.0距离第一个字幕(endTime=15.0)是2s，距离第二个字幕(startTime=20.0)是3s
      // 所以应该选择第一个字幕
      expect(asSubtitleIntent(intents[0]).suggestIndex).toBe(0)
    })

    it('当前时间更接近下一个字幕时应该选择下一个', () => {
      const context = createMockContext({
        currentTime: 18.5, // 在第一和第二个字幕之间，更接近第二个
        activeCueIndex: -1
      })

      const intents = strategy.onEvent(context)

      expect(intents).toHaveLength(1)
      // 18.5距离第一个字幕(endTime=15.0)是3.5s，距离第二个字幕(startTime=20.0)是1.5s
      // 所以应该选择第二个字幕
      expect(asSubtitleIntent(intents[0]).suggestIndex).toBe(1)
    })

    it('使用TimeConstants.MAX_SUBTITLE_DISTANCE_S限制搜索范围', () => {
      const context = createMockContext({
        currentTime: 50.0, // 距离所有字幕都超过10秒
        activeCueIndex: -1,
        subtitles: [{ id: '1', startTime: 10, endTime: 15, originalText: 'Far subtitle' }]
      })

      const intents = strategy.onEvent(context)

      // 当建议索引为-1且当前索引也是-1时，不应该产生意图
      expect(intents).toHaveLength(0)
    })

    it('在搜索距离边界测试 - 恰好10秒应该匹配', () => {
      const context = createMockContext({
        currentTime: 25.0, // 距离第一个字幕结束时间恰好10秒
        activeCueIndex: -1,
        subtitles: [{ id: '1', startTime: 15, endTime: 20, originalText: 'Boundary subtitle' }]
      })

      const intents = strategy.onEvent(context)

      expect(intents).toHaveLength(1)
      expect(asSubtitleIntent(intents[0]).suggestIndex).toBe(0) // 应该匹配
    })

    it('超过搜索距离边界测试 - 超过10秒不应该匹配', () => {
      const context = createMockContext({
        currentTime: 30.1, // 距离字幕结束时间超过10秒
        activeCueIndex: -1,
        subtitles: [{ id: '1', startTime: 15, endTime: 20, originalText: 'Too far subtitle' }]
      })

      const intents = strategy.onEvent(context)

      // 当建议索引为-1且当前索引也是-1时，不应该产生意图
      expect(intents).toHaveLength(0)
    })
  })

  describe('意图产生条件', () => {
    it('建议索引与当前索引相同时不应该产生意图', () => {
      const context = createMockContext({
        currentTime: 12.0, // 在第一个字幕时间窗口内
        activeCueIndex: 0 // 当前已经是第一个字幕
      })

      const intents = strategy.onEvent(context)

      expect(intents).toHaveLength(0) // 不应该产生意图
    })

    it('建议索引与当前索引不同时应该产生意图', () => {
      const context = createMockContext({
        currentTime: 22.0, // 在第二个字幕时间窗口内
        activeCueIndex: 0 // 当前是第一个字幕，但应该切换到第二个
      })

      const intents = strategy.onEvent(context)

      expect(intents).toHaveLength(1)
      expect(intents[0]).toMatchObject({
        domain: 'subtitle',
        suggestIndex: 1,
        priority: 6
      })
      expect(asSubtitleIntent(intents[0]).suggestIndex).toBe(1)
    })

    it('从有效索引切换到无效索引(-1)时应该产生意图', () => {
      const context = createMockContext({
        currentTime: 50.0, // 远离所有字幕
        activeCueIndex: 2 // 当前是第三个字幕
      })

      const intents = strategy.onEvent(context)

      expect(intents).toHaveLength(1)
      expect(asSubtitleIntent(intents[0]).suggestIndex).toBe(-1) // 建议清除字幕
    })

    it('从无效索引(-1)到仍然无效索引(-1)时不应该产生意图', () => {
      const context = createMockContext({
        currentTime: 50.0, // 远离所有字幕
        activeCueIndex: -1 // 当前也是无效索引
      })

      const intents = strategy.onEvent(context)

      expect(intents).toHaveLength(0) // 不应该产生意图
    })
  })

  describe('边缘情况和错误处理', () => {
    it('没有字幕时不应该产生任何意图', () => {
      const context = createMockContext({
        subtitles: [],
        currentTime: 12.0,
        activeCueIndex: -1
      })

      const intents = strategy.onEvent(context)

      expect(intents).toHaveLength(0)
    })

    it('负时间值时不应该崩溃', () => {
      const context = createMockContext({
        currentTime: -1.0,
        activeCueIndex: -1
      })

      expect(() => {
        const intents = strategy.onEvent(context)
        expect(intents).toBeDefined()
      }).not.toThrow()
    })

    it('超大时间值时不应该崩溃', () => {
      const context = createMockContext({
        currentTime: 99999.0,
        activeCueIndex: -1
      })

      expect(() => {
        const intents = strategy.onEvent(context)
        expect(intents).toBeDefined()
      }).not.toThrow()
    })

    it('单个字幕的边界测试', () => {
      const context = createMockContext({
        subtitles: [{ id: '1', startTime: 10, endTime: 15, originalText: 'Single subtitle' }],
        currentTime: 12.5, // 在字幕中间
        activeCueIndex: -1
      })

      const intents = strategy.onEvent(context)

      expect(intents).toHaveLength(1)
      expect(asSubtitleIntent(intents[0]).suggestIndex).toBe(0)
    })
  })

  describe('状态管理和清理', () => {
    it('dispose应该正确清理资源', () => {
      expect(() => {
        strategy.dispose()
      }).not.toThrow()
    })

    it('dispose后策略仍可正常工作', () => {
      strategy.dispose()

      const context = createMockContext({
        currentTime: 12.0,
        activeCueIndex: -1
      })

      expect(() => {
        const intents = strategy.onEvent(context)
        expect(intents).toBeDefined()
      }).not.toThrow()
    })
  })

  describe('性能和稳定性', () => {
    it('处理大量字幕时不应该有性能问题', () => {
      const manySubtitles = Array.from({ length: 1000 }, (_, i) => ({
        id: `subtitle-${i}`,
        startTime: i * 2,
        endTime: i * 2 + 1,
        originalText: `Subtitle ${i}`
      }))

      const context = createMockContext({
        subtitles: manySubtitles,
        currentTime: 500.5, // 在第250个字幕附近
        activeCueIndex: -1
      })

      const startTime = performance.now()
      const intents = strategy.onEvent(context)
      const endTime = performance.now()

      expect(intents).toHaveLength(1)
      expect(endTime - startTime).toBeLessThan(10) // 应该在10ms内完成
    })

    it('重复调用相同上下文应该产生一致结果', () => {
      const context = createMockContext({
        currentTime: 12.0,
        activeCueIndex: -1
      })

      const intents1 = strategy.onEvent(context)
      const intents2 = strategy.onEvent(context)

      expect(intents1).toEqual(intents2)
    })

    it('字幕迟滞(hysteresis)行为验证', () => {
      // 测试字幕迟滞机制：在边界附近应该有稳定的行为
      const context = createMockContext({
        currentTime: 10.001, // 在第一个字幕开始时间稍后 (使用容差)
        activeCueIndex: -1
      })

      const intents = strategy.onEvent(context)

      expect(intents).toHaveLength(1)
      expect(asSubtitleIntent(intents[0]).suggestIndex).toBe(0) // 应该选择第一个字幕
    })
  })

  describe('复杂字幕场景', () => {
    it('重叠字幕时应该选择第一个匹配的', () => {
      const context = createMockContext({
        subtitles: [
          { id: '1', startTime: 10, endTime: 20, originalText: 'Long subtitle' },
          { id: '2', startTime: 15, endTime: 25, originalText: 'Overlapping subtitle' }
        ],
        currentTime: 17.0, // 在两个字幕的重叠区域
        activeCueIndex: -1
      })

      const intents = strategy.onEvent(context)

      expect(intents).toHaveLength(1)
      expect(asSubtitleIntent(intents[0]).suggestIndex).toBe(0) // 应该选择第一个匹配的
    })

    it('相邻字幕的边界切换', () => {
      const context1 = createMockContext({
        currentTime: 14.9, // 在第一个字幕内
        activeCueIndex: 0
      })

      const intents1 = strategy.onEvent(context1)
      expect(intents1).toHaveLength(0) // 不应该切换

      const context2 = createMockContext({
        currentTime: 20.1, // 在第二个字幕内
        activeCueIndex: 0 // 仍然是第一个字幕
      })

      const intents2 = strategy.onEvent(context2)
      expect(intents2).toHaveLength(1)
      expect(asSubtitleIntent(intents2[0]).suggestIndex).toBe(1) // 应该切换到第二个字幕
    })

    it('零长度字幕处理', () => {
      const context = createMockContext({
        subtitles: [{ id: '1', startTime: 10, endTime: 10, originalText: 'Instant subtitle' }],
        currentTime: 10.0,
        activeCueIndex: -1
      })

      const intents = strategy.onEvent(context)

      expect(intents).toHaveLength(1)
      expect(asSubtitleIntent(intents[0]).suggestIndex).toBe(0) // 应该匹配零长度字幕
    })
  })
})
