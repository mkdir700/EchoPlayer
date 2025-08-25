import { loggerService } from '@logger'

import { Intent, IntentBasedStrategy, PlaybackContext } from './types'

const logger = loggerService.withContext('IntentStrategyManager')

/**
 * Intent 策略管理器
 * 管理所有基于 Intent 的策略，收集并汇总意图
 */
export class IntentStrategyManager {
  private strategies: Map<string, IntentBasedStrategy> = new Map()
  // 记录每个策略在上一次处理时是否处于激活状态
  private activeStates: Map<string, boolean> = new Map()

  /**
   * 注册策略
   */
  registerStrategy(strategy: IntentBasedStrategy): void {
    if (this.strategies.has(strategy.name)) {
      logger.warn(`策略 ${strategy.name} 已存在，将被覆盖`)
    }

    this.strategies.set(strategy.name, strategy)
    // 新注册的策略默认标记为未激活，等待下一次 collectIntents 时根据上下文触发生命周期
    this.activeStates.set(strategy.name, false)
    logger.debug(`注册策略: ${strategy.name} (优先级: ${strategy.priority})`)
  }

  /**
   * 注销策略
   */
  unregisterStrategy(strategyName: string): void {
    const strategy = this.strategies.get(strategyName)
    if (strategy) {
      strategy.dispose?.()
      this.strategies.delete(strategyName)
      this.activeStates.delete(strategyName)
      logger.debug(`注销策略: ${strategyName}`)
    } else {
      logger.warn(`尝试注销不存在的策略: ${strategyName}`)
    }
  }

  /**
   * 处理播放器事件，收集所有策略的意图
   */
  collectIntents(context: PlaybackContext): Intent[] {
    const allIntents: Intent[] = []

    for (const [name, strategy] of this.strategies) {
      try {
        const shouldBeActive = strategy.shouldActivate(context)
        const wasActive = this.activeStates.get(name) ?? false

        // 处理激活/停用的边缘
        if (shouldBeActive && !wasActive) {
          // 进入激活态
          const activateIntents = strategy.onActivate?.(context) ?? []
          if (activateIntents.length > 0) {
            const enriched = activateIntents.map((i) => ({
              ...i,
              source: strategy.name,
              reason: i.reason ?? `${strategy.name} onActivate`
            }))
            allIntents.push(...enriched)
          }
          this.activeStates.set(name, true)
          logger.debug(`策略 ${name} 激活`)
        } else if (!shouldBeActive && wasActive) {
          // 进入停用态
          const deactivateIntents = strategy.onDeactivate?.(context) ?? []
          if (deactivateIntents.length > 0) {
            const enriched = deactivateIntents.map((i) => ({
              ...i,
              source: strategy.name,
              reason: i.reason ?? `${strategy.name} onDeactivate`
            }))
            allIntents.push(...enriched)
          }
          this.activeStates.set(name, false)
          logger.debug(`策略 ${name} 停用`)
          // 停用后不再调用 onEvent
          continue
        }

        // 激活态下才处理事件
        if (!shouldBeActive) {
          continue
        }

        // 收集策略的意图
        const intents = strategy.onEvent(context)
        if (intents.length > 0) {
          const enriched = intents.map((i) => ({
            ...i,
            source: strategy.name,
            reason: i.reason ?? strategy.name
          }))
          allIntents.push(...enriched)

          logger.debug(`策略 ${name} 产出 ${enriched.length} 个意图`, {
            intents: enriched.map((i) => ({
              domain: i.domain,
              priority: i.priority,
              source: i.source,
              reason: i.reason
            }))
          })
        }
      } catch (error) {
        logger.error(`策略 ${name} 执行失败:`, { error })
        // 策略异常不应阻断其他策略的执行
      }
    }

    if (allIntents.length > 0) {
      logger.debug(`共收集到 ${allIntents.length} 个意图`, {
        domains: [...new Set(allIntents.map((i) => i.domain))],
        strategies: [...new Set(allIntents.map((i) => i.reason?.split(' ')[0] || 'unknown'))]
      })
    }

    return allIntents
  }

  /**
   * 获取所有激活的策略
   */
  getActiveStrategies(context: PlaybackContext): IntentBasedStrategy[] {
    const activeStrategies: IntentBasedStrategy[] = []

    for (const strategy of this.strategies.values()) {
      try {
        if (strategy.shouldActivate(context)) {
          activeStrategies.push(strategy)
        }
      } catch (error) {
        logger.error(`检查策略激活状态失败: ${strategy.name}`, { error })
      }
    }

    return activeStrategies
  }

  /**
   * 获取策略统计信息
   */
  getStats(): {
    total: number
    active: number
    strategies: Array<{ name: string; priority: number }>
  } {
    const strategies = Array.from(this.strategies.values()).map((s) => ({
      name: s.name,
      priority: s.priority
    }))

    return {
      total: this.strategies.size,
      active: strategies.length, // 这里简化处理，实际需要 context
      strategies: strategies.sort((a, b) => b.priority - a.priority)
    }
  }

  /**
   * 重载所有策略
   * 立即停止策略执行，注销所有策略并重新挂载
   */
  reload(strategiesToReload: IntentBasedStrategy[]): void {
    logger.debug('重载 IntentStrategyManager')

    // 1. 立即停止所有策略执行并清理
    const strategiesSnapshot = new Map(this.strategies)

    for (const [name, strategy] of strategiesSnapshot) {
      try {
        strategy.dispose?.()
        logger.debug(`停止并清理策略: ${name}`)
      } catch (error) {
        logger.error(`停止策略 ${name} 失败:`, { error })
      }
    }

    // 2. 清空策略映射
    this.strategies.clear()
    this.activeStates.clear()

    // 3. 重新挂载策略
    for (const strategy of strategiesToReload) {
      try {
        this.registerStrategy(strategy)
        logger.debug(`重新挂载策略: ${strategy.name}`)
      } catch (error) {
        logger.error(`重新挂载策略 ${strategy.name} 失败:`, { error })
      }
    }

    logger.debug(`策略重载完成，共重载 ${strategiesToReload.length} 个策略`)
  }

  /**
   * 清理所有策略
   */
  dispose(): void {
    logger.debug('销毁 IntentStrategyManager')

    for (const [name, strategy] of this.strategies) {
      try {
        strategy.dispose?.()
        logger.debug(`清理策略: ${name}`)
      } catch (error) {
        logger.error(`清理策略 ${name} 失败:`, { error })
      }
    }

    this.strategies.clear()
    this.activeStates.clear()
  }
}
