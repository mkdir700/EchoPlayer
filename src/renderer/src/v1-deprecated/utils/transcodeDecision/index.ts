/**
 * Transcode Decision Module / 转码决策模块
 * 提供智能的视频转码决策和执行功能
 * Provides intelligent video transcoding decision-making and execution capabilities
 */

// 导出核心类型和枚举 / Export core types and enums
export {
  type TranscodeDecision,
  TranscodeDecisionMaker,
  transcodeDecisionMaker,
  TranscodeStrategy,
  type VideoCompatibility
} from './transcodeDecisionMaker'

// 导出辅助工具和类型 / Export helper utilities and types
export {
  TranscodeDecisionHelper,
  transcodeDecisionHelper,
  type TranscodeExecutionResult,
  type TranscodeTask,
  usageExamples
} from './transcodeDecisionHelper'
