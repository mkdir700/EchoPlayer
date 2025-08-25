import { SubtitleItem } from '@types'

import { TimeConstants, TimeMath } from '../../core/TimeMath'
import { Intent, PlaybackContext } from '../types'
import { ActivationConditions, BaseStrategy, StrategyPriorities } from './BaseStrategy'

/**
 * 字幕同步策略 - 统一协议版本
 * 使用 BaseStrategy 统一激活条件判断，负责根据当前播放时间建议合适的字幕索引
 * 优先级设为最低，为其他策略提供基础的字幕索引建议
 */
export class SubtitleSyncStrategy extends BaseStrategy {
  constructor() {
    super('SubtitleSyncStrategy', StrategyPriorities.SUBTITLE_SYNC)
  }

  protected getActivationConditions(context: PlaybackContext): ActivationConditions {
    return {
      featureEnabled: true, // 字幕同步总是启用的基础功能
      dataAvailable: context.subtitles.length > 0,
      stateConditions: true, // 不需要特定播放状态
      contextConditions: true // 不需要特定上下文条件
    }
  }

  onEvent(context: PlaybackContext): Intent[] {
    const suggestedIndex = this.computeActiveCueIndex(context.currentTime, context.subtitles)

    // 只有建议的索引与当前不同时才发出意图
    if (suggestedIndex !== context.activeCueIndex) {
      this.logger.debug('建议字幕索引变更', {
        currentIndex: context.activeCueIndex,
        suggestedIndex,
        currentTime: context.currentTime
      })

      return [
        {
          domain: 'subtitle',
          suggestIndex: suggestedIndex,
          priority: this.priority,
          reason: `字幕同步建议 (时间: ${context.currentTime.toFixed(2)}s)`
        }
      ]
    }

    return []
  }

  /**
   * 根据当前时间计算活跃的字幕索引
   */
  private computeActiveCueIndex(currentTime: number, subtitles: SubtitleItem[]): number {
    if (subtitles.length === 0) return -1

    // 使用 TimeMath 统一的字幕迟滞常量
    const hysteresis = TimeConstants.SUBTITLE_HYSTERESIS_S

    // 使用 TimeMath.inside 统一判断时间边界
    for (let i = 0; i < subtitles.length; i++) {
      const subtitle = subtitles[i]
      if (TimeMath.inside(subtitle.startTime, subtitle.endTime, currentTime, hysteresis)) {
        return i
      }
    }

    // 没有找到精确匹配的字幕，返回最近的一个
    return this.findNearestSubtitleIndex(currentTime, subtitles)
  }

  /**
   * 查找最接近当前时间的字幕索引
   */
  private findNearestSubtitleIndex(currentTime: number, subtitles: SubtitleItem[]): number {
    let nearestIndex = -1
    let minDistance = Infinity

    for (let i = 0; i < subtitles.length; i++) {
      const subtitle = subtitles[i]

      // 计算到字幕区间的最短距离
      let distance: number
      if (currentTime < subtitle.startTime) {
        // 当前时间在字幕开始前
        distance = subtitle.startTime - currentTime
      } else if (currentTime >= subtitle.endTime) {
        // 当前时间在字幕结束后
        distance = currentTime - subtitle.endTime
      } else {
        // 当前时间在字幕区间内（这种情况理论上不会到达这里，因为TimeMath.inside已经处理了）
        distance = 0
      }

      if (distance < minDistance) {
        minDistance = distance
        nearestIndex = i
      }
    }

    // 如果距离太远，返回-1表示没有活跃字幕
    return minDistance <= TimeConstants.MAX_SUBTITLE_DISTANCE_S ? nearestIndex : -1
  }

  dispose(): void {
    super.dispose?.()
  }
}
