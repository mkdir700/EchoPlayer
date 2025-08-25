import { loggerService } from '@logger'

import { Intent, IntentBasedStrategy, PlaybackContext } from '../types'

/**
 * 策略激活条件类型
 * 定义策略在什么情况下应该被激活
 */
export interface ActivationConditions {
  /** 主要功能开关 - 策略对应的功能是否启用 */
  featureEnabled?: boolean
  /** 数据可用性 - 策略所需的数据是否可用 */
  dataAvailable?: boolean
  /** 状态条件 - 播放器必须处于特定状态 */
  stateConditions?: boolean
  /** 上下文条件 - 其他上下文相关的条件 */
  contextConditions?: boolean
}

/**
 * 策略基类
 * 提供统一的激活条件判断和日志记录
 */
export abstract class BaseStrategy implements IntentBasedStrategy {
  protected readonly logger: ReturnType<typeof loggerService.withContext>

  constructor(
    public readonly name: string,
    public readonly priority: number
  ) {
    this.logger = loggerService.withContext(name)
  }

  /**
   * 统一的激活条件检查
   * 子类应该重写 getActivationConditions() 而不是 shouldActivate()
   */
  shouldActivate(context: PlaybackContext): boolean {
    const conditions = this.getActivationConditions(context)

    // 所有定义的条件都必须为 true
    const isActive = Object.entries(conditions)
      .filter(([, value]) => value !== undefined)
      .every(([, value]) => value === true)

    if (!isActive) {
      this.logger.debug(`策略未激活`, {
        strategy: this.name,
        conditions,
        context: this.getContextSummary(context)
      })
    }

    return isActive
  }

  /**
   * 子类需要实现的激活条件获取方法
   * 返回具体的激活条件对象
   */
  protected abstract getActivationConditions(context: PlaybackContext): ActivationConditions

  /**
   * 生命周期：策略被激活
   * 默认不产生意图，子类可重写并返回初始化意图
   */
  onActivate?(context: PlaybackContext): Intent[] {
    void context
    this.logger.debug(`${this.name} onActivate`)
    return []
  }

  /**
   * 标准的事件处理方法
   * 子类必须实现
   */
  abstract onEvent(context: PlaybackContext): Intent[]

  /**
   * 生命周期：策略被停用
   * 默认不产生意图，子类可重写并返回清理意图
   */
  onDeactivate?(context: PlaybackContext): Intent[] {
    void context
    this.logger.debug(`${this.name} onDeactivate`)
    return []
  }

  /**
   * 获取上下文摘要用于日志记录
   */
  protected getContextSummary(context: PlaybackContext): Record<string, any> {
    return {
      currentTime: context.currentTime,
      activeCueIndex: context.activeCueIndex,
      paused: context.paused,
      subtitleCount: context.subtitles.length,
      loopEnabled: context.loopEnabled,
      autoPauseEnabled: context.autoPauseEnabled
    }
  }

  /**
   * 标准的资源清理方法
   */
  dispose?(): void {
    this.logger.debug(`${this.name} disposed`)
  }
}

/**
 * 策略优先级常量
 * 数值越高优先级越高
 */
export const StrategyPriorities = {
  /** 字幕同步策略 - 基础优先级，为其他策略提供字幕索引建议 */
  SUBTITLE_SYNC: 6,

  /** 循环策略 - 中等优先级，在字幕同步基础上添加循环逻辑 */
  LOOP: 7,

  /** 自动暂停策略 - 高优先级，在特定条件下暂停播放 */
  AUTO_PAUSE: 8
} as const

/**
 * 策略协议验证
 * 验证策略实现是否符合统一协议
 */
export class StrategyValidator {
  /**
   * 验证策略优先级设置是否合理
   */
  static validatePriority(strategy: IntentBasedStrategy): boolean {
    return strategy.priority >= 1 && strategy.priority <= 10
  }

  /**
   * 验证策略名称是否符合规范
   */
  static validateName(strategy: IntentBasedStrategy): boolean {
    return strategy.name.endsWith('Strategy') && strategy.name.length > 8
  }

  /**
   * 验证意图输出是否符合规范
   */
  static validateIntents(intents: Intent[]): boolean {
    return intents.every(
      (intent) =>
        intent.domain &&
        typeof intent.priority === 'number' &&
        intent.priority >= 1 &&
        intent.priority <= 10
    )
  }
}
