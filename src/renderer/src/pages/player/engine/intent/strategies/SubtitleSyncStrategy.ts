import { SubtitleIndexCalculator } from '../../utils'
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
    const suggestedIndex = SubtitleIndexCalculator.computeActiveCueIndex(
      context.currentTime,
      context.subtitles
    )

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

  dispose(): void {
    super.dispose?.()
  }
}
