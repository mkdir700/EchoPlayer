/**
 * 统一策略系统导出
 * 所有策略使用 BaseStrategy 统一协议
 */

// 基础策略类和工具
export { BaseStrategy, StrategyPriorities, StrategyValidator } from './BaseStrategy'

// 具体策略实现
export { AutoPauseStrategy } from './AutoPauseStrategy'
export { LoopStrategy } from './LoopStrategy'
export { SubtitleSyncStrategy } from './SubtitleSyncStrategy'

// 导入策略用于工厂函数
import { AutoPauseStrategy } from './AutoPauseStrategy'
import { StrategyValidator } from './BaseStrategy'
import { LoopStrategy } from './LoopStrategy'
import { SubtitleSyncStrategy } from './SubtitleSyncStrategy'

// 策略创建工厂
export function createAllStrategies() {
  return [
    new SubtitleSyncStrategy(), // 基础字幕同步 (优先级 6)
    new LoopStrategy(), // 循环播放 (优先级 7)
    new AutoPauseStrategy() // 自动暂停 (优先级 8)
  ]
}

/**
 * 策略协议验证工具
 * 确保所有策略符合统一协议
 */
export function validateStrategyProtocol() {
  const strategies = createAllStrategies()

  const validationResults = strategies.map((strategy) => {
    const nameValid = StrategyValidator.validateName(strategy)
    const priorityValid = StrategyValidator.validatePriority(strategy)

    return {
      strategy: strategy.name,
      nameValid,
      priorityValid,
      priority: strategy.priority,
      isValid: nameValid && priorityValid
    }
  })

  return {
    allValid: validationResults.every((r) => r.isValid),
    results: validationResults,
    priorities: validationResults
      .map((r) => ({ name: r.strategy, priority: r.priority }))
      .sort((a, b) => a.priority - b.priority)
  }
}
