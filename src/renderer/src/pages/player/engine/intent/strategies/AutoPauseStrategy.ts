import { SubtitleItem } from '@types'

import { TimeMath } from '../../core/TimeMath'
import { Intent, PlaybackContext } from '../types'
import { ActivationConditions, BaseStrategy, StrategyPriorities } from './BaseStrategy'

/**
 * 自动暂停策略 - 统一协议版本
 * 使用 BaseStrategy 统一激活条件判断，在字幕结束时自动暂停播放
 * 支持左闭右开区间 [start, end) 语义，确保与其他策略的边界行为一致
 */
export class AutoPauseStrategy extends BaseStrategy {
  // 追踪上一个时间点，用于 TimeMath.crossedRightBoundary 边界跨越检测
  private lastCurrentTime = -1

  constructor() {
    super('AutoPauseStrategy', StrategyPriorities.AUTO_PAUSE)
  }

  protected getActivationConditions(context: PlaybackContext): ActivationConditions {
    return {
      featureEnabled: context.autoPauseEnabled,
      dataAvailable: context.subtitles.length > 0,
      stateConditions: context.pauseOnSubtitleEnd, // 需要启用字幕结束暂停
      contextConditions: context.activeCueIndex >= 0
    }
  }

  onEvent(context: PlaybackContext): Intent[] {
    const intents: Intent[] = []

    // 只有在单独的自动暂停模式下才处理（不与循环冲突）
    if (context.activeCueIndex >= 0 && context.pauseOnSubtitleEnd) {
      const currentCue = context.subtitles[context.activeCueIndex]

      // 使用 TimeMath.crossedRightBoundary 检测是否跨越了字幕结束边界
      if (currentCue && this.lastCurrentTime >= 0) {
        if (
          TimeMath.crossedRightBoundary(
            this.lastCurrentTime,
            context.currentTime,
            currentCue.endTime
          )
        ) {
          intents.push(...this.handleAutoPause(context, currentCue))
        }
      }
    }

    // 更新上一个时间点
    this.lastCurrentTime = context.currentTime

    return intents
  }

  /**
   * 处理自动暂停逻辑
   * 基于 TimeMath.crossedRightBoundary 的边界跨越检测触发
   */
  private handleAutoPause(context: PlaybackContext, currentCue: SubtitleItem): Intent[] {
    const intents: Intent[] = []

    // 立即暂停
    intents.push({
      domain: 'transport',
      op: 'pause',
      priority: this.priority,
      reason: `自动暂停 (跨越字幕结束边界: [${currentCue.startTime.toFixed(3)}, ${currentCue.endTime.toFixed(3)}))`
    })

    // 如果启用了自动恢复播放
    if (context.resumeEnabled && context.resumeDelay > 0) {
      // 通知 UI 层打开倒计时面板
      intents.push({
        domain: 'ui',
        updateState: {
          openAutoResumeCountdown: true
        },
        reason: '请求打开自动恢复倒计时面板'
      })
      this.logger.debug('请求打开自动恢复倒计时面板')

      // intents.push({
      //   domain: 'schedule',
      //   action: 'play',
      //   delayMs: context.resumeDelay,
      //   priority: this.priority,
      //   reason: `自动恢复播放 (延迟: ${context.resumeDelay}ms)`
      // })

      // this.logger.debug('安排自动恢复播放', {
      //   delay: context.resumeDelay,
      //   cueEnd: currentCue.endTime,
      //   timeWindow: [currentCue.startTime, currentCue.endTime]
      // })
    }

    this.logger.debug('执行自动暂停 (TimeMath边界跨越)', {
      cue: currentCue,
      timeWindow: [currentCue.startTime, currentCue.endTime],
      previousTime: this.lastCurrentTime,
      currentTime: context.currentTime,
      crossedBoundary: currentCue.endTime,
      resumeEnabled: context.resumeEnabled
    })

    return intents
  }

  // onDeactivate(context: PlaybackContext): Intent[] {
  //   return [
  //     {
  //       domain: 'schedule',
  //       action 'cancelAutoResume',
  //       reason: '自动恢复播放已停止，取消自动恢复播放计划'
  //     }
  //   ]
  // }

  dispose(): void {
    // 清理状态
    this.lastCurrentTime = -1
    super.dispose?.()
  }
}
