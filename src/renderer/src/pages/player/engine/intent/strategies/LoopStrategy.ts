import { LoopMode, SubtitleItem } from '@types'

import { TimeMath } from '../../core/TimeMath'
import { Intent, PlaybackContext } from '../types'
import { ActivationConditions, BaseStrategy, StrategyPriorities } from './BaseStrategy'

/**
 * 循环播放策略 - 统一协议版本
 * 使用 BaseStrategy 统一激活条件判断，实现精确的循环回跳
 * 支持左闭右开区间 [start, end) 语义，确保与其他策略的边界行为一致
 */
export class LoopStrategy extends BaseStrategy {
  // 追踪上一个活跃的字幕索引，用于检测字幕切换
  private lastActiveCueIndex = -1
  // 追踪上一个时间点，用于检测边界跨越
  private lastCurrentTime = -1

  constructor() {
    super('LoopStrategy', StrategyPriorities.LOOP)
  }

  protected getActivationConditions(context: PlaybackContext): ActivationConditions {
    return {
      featureEnabled: context.loopEnabled,
      dataAvailable: context.subtitles.length > 0,
      // 策略激活不要求特定循环模式或字幕索引
      // onEvent 中会进一步检查具体条件
      stateConditions: true,
      contextConditions: true
    }
  }

  onEvent(context: PlaybackContext): Intent[] {
    const intents: Intent[] = []

    // 检测字幕切换：使用 TimeMath.inside 判断是否进入了新的字幕时间窗口
    if (context.loopMode === LoopMode.SINGLE && context.activeCueIndex >= 0) {
      const currentCue = context.subtitles[context.activeCueIndex]

      // 检查是否首次进入这个字幕的时间窗口（使用左闭右开区间 [start, end)）
      if (
        currentCue &&
        context.activeCueIndex !== this.lastActiveCueIndex &&
        TimeMath.inside(currentCue.startTime, currentCue.endTime, context.currentTime)
      ) {
        this.lastActiveCueIndex = context.activeCueIndex

        intents.push({
          domain: 'loop',
          setRemaining: context.loopCount,
          priority: this.priority,
          reason: `进入新字幕的时间窗口 [${currentCue.startTime.toFixed(3)}, ${currentCue.endTime.toFixed(3)}) (索引: ${context.activeCueIndex})，重置循环次数为 ${context.loopCount === -1 ? '∞' : context.loopCount}`
        })

        this.logger.debug('首次进入字幕时间窗口，重置循环次数', {
          newIndex: context.activeCueIndex,
          timeWindow: [currentCue.startTime, currentCue.endTime],
          currentTime: context.currentTime,
          resetCount: context.loopCount,
          willSetRemaining: context.loopCount
        })

        // 开始循环时锁定字幕
        intents.push({
          domain: 'subtitle',
          suggestIndex: context.activeCueIndex,
          lock: true,
          lockOwner: 'loop',
          priority: this.priority,
          reason: `锁定字幕(${context.activeCueIndex})`
        })

        this.logger.debug('开始循环字幕', {
          loopingIndex: context.activeCueIndex,
          loopCount: context.loopCount,
          currentRemaining: context.loopRemainingCount,
          timeWindow: [currentCue.startTime, currentCue.endTime]
        })
      }

      // 单句循环：使用 TimeMath.crossedRightBoundary 检测是否跨越了字幕的结束边界
      if (currentCue && this.lastCurrentTime >= 0) {
        if (
          TimeMath.crossedRightBoundary(
            this.lastCurrentTime,
            context.currentTime,
            currentCue.endTime
          )
        ) {
          intents.push(...this.onEndTime(context, currentCue))
        }
      }
    }

    // 更新上一个时间点
    this.lastCurrentTime = context.currentTime

    // 区间循环：检查是否到达区间结束时间
    // if (context.loopMode === LoopMode.AB) {
    //   intents.push(...this.handleSegmentLoop(context))
    // }

    return intents
  }

  onDeactivate(context: PlaybackContext): Intent[] {
    this.logger.debug(`${this.name} onDeactivate`)
    const intents: Intent[] = []
    intents.push({
      domain: 'subtitle',
      lock: false,
      lockOwner: 'loop',
      priority: this.priority,
      reason: `循环功能关闭，解除锁定字幕(${context.activeCueIndex}),`
    })
    return intents
  }

  /**
   * 处理单句循环到达字幕的时间边界
   */
  private onEndTime(context: PlaybackContext, currentCue: SubtitleItem): Intent[] {
    const intents: Intent[] = []

    // 检查剩余循环次数
    if (context.loopRemainingCount === 0) {
      intents.push({
        domain: 'subtitle',
        lock: false,
        lockOwner: 'loop',
        priority: this.priority,
        reason: '单句循环完成，解锁字幕'
      })

      this.logger.debug('单句循环次数已用完，继续播放', {
        currentIndex: context.activeCueIndex
      })
      return intents
    }

    // 执行循环：跳回句首
    intents.push({
      domain: 'seek',
      to: currentCue.startTime,
      followUpPlay: true,
      priority: this.priority,
      reason: '单句循环回跳'
    })

    this.logger.debug('建议执行单句循环', {
      cue: currentCue,
      remaining: context.loopRemainingCount
    })

    // 更新剩余次数：每次循环完成后减1（-1表示无限循环不减）
    if (context.loopRemainingCount > 0) {
      intents.push({
        domain: 'loop',
        deltaRemaining: -1,
        priority: this.priority,
        reason: `单句循环计数减一 (从${context.loopRemainingCount}减到${context.loopRemainingCount - 1})`
      })

      this.logger.debug('建议循环计数减1', {
        remaining: context.loopRemainingCount
      })
    }

    return intents
  }

  /**
   * 处理区间循环逻辑
   */
  // private handleSegmentLoop(_context: PlaybackContext): Intent[] {
  //   // TODO: 区间循环需要额外的区间定义状态
  //   // 这里暂时返回空数组，后续可以扩展
  //   this.logger.debug('区间循环模式暂未实现')
  //   return []
  // }

  dispose(): void {
    // 清理状态
    this.lastActiveCueIndex = -1
    this.lastCurrentTime = -1
    super.dispose?.()
  }
}
