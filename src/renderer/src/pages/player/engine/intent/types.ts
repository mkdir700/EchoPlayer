import { LoopMode, SubtitleItem } from '@types'

/**
 * 领域意图归约系统类型定义
 * 将决策从"策略竞争"进化到"领域意图归约"
 */

// ===== 领域枚举 =====
export type Domain =
  | 'transport' // play/pause 播放控制
  | 'seek' // 瞬时 seek 跳转
  | 'subtitle' // 索引建议/锁 字幕控制
  | 'loop' // 计数/模式 循环控制
  | 'schedule' // 延迟动作 定时任务
  | 'ui' // 仅UI状态（可选）

// ===== 通用意图基类 =====
export interface IntentBase<D extends Domain = Domain> {
  domain: D
  priority?: number // 领域内优先级（默认 0）
  reason?: string // 意图产生的原因
  source?: string // 意图来源策略名称（调试用）
}

// ===== 各领域意图 =====

/**
 * 播放控制意图（互斥领域）
 */
export interface TransportIntent extends IntentBase<'transport'> {
  op: 'play' | 'pause'
}

/**
 * 跳转意图（互斥领域）
 */
export interface SeekIntent extends IntentBase<'seek'> {
  to: number // 目标时间（秒）
  followUpPlay?: boolean // 跳转后是否自动播放
}

/**
 * 字幕控制意图（可并行+锁规则领域）
 */
export interface SubtitleIntent extends IntentBase<'subtitle'> {
  suggestIndex?: number // 建议索引（可空：表示"维持"）
  lock?: boolean // 请求锁定（true/false均可表达）
  lockOwner?: string // 谁申请/持有锁（Loop/Drag/Hotkey...）
}

/**
 * 循环控制意图（可并行领域）
 */
export interface LoopIntent extends IntentBase<'loop'> {
  setRemaining?: number // 显式设置剩余次数
  deltaRemaining?: number // 相对增减
  setMode?: LoopMode // 设置循环模式
}

/**
 * 定时任务意图（可并行领域）
 */
export interface ScheduleIntent extends IntentBase<'schedule'> {
  action: 'play' | 'pause' | 'seek'
  delayMs: number
  reason?: string
  params?: any
}

/**
 * UI状态意图（可并行领域，可选）
 */
export interface UIIntent extends IntentBase<'ui'> {
  updateState?: {
    openAutoResumeCountdown?: boolean
  }
}

/**
 * 联合意图类型
 */
export type Intent =
  | TransportIntent
  | SeekIntent
  | SubtitleIntent
  | LoopIntent
  | ScheduleIntent
  | UIIntent

// ===== 领域归约后的决议（Resolution）=====

/**
 * 各领域归约后的最终决议
 */
export type ResolutionByDomain = {
  transport?: {
    op: 'play' | 'pause'
    reason?: string
  }
  seek?: {
    to: number
    followUpPlay?: boolean
    reason?: string
  }
  subtitle?: {
    index?: number
    lockState?: 'lock' | 'unlock' | 'keep'
    owner?: string
    winnerMeta?: { source?: string; priority?: number; reason?: string }
  }
  loop?: {
    remaining?: number
    mode?: LoopMode
  }
  schedule?: Array<ScheduleIntent>
  ui?: {
    updates?: Record<string, any>
  }
}

// ===== 归约器类型 =====

/**
 * 播放上下文（归约器输入）
 */
export interface PlaybackContext {
  // 播放器状态
  currentTime: number
  duration: number
  paused: boolean
  playbackRate: number
  volume: number

  // 字幕相关
  activeCueIndex: number
  subtitles: SubtitleItem[]

  // 循环设置
  loopEnabled: boolean
  loopMode: LoopMode
  loopCount: number
  loopRemainingCount: number

  // 自动暂停
  autoPauseEnabled: boolean
  pauseOnSubtitleEnd: boolean
  resumeEnabled: boolean
  resumeDelay: number
}

/**
 * 领域归约器接口
 */
export type DomainReducer<D extends Domain> = (
  intents: Intent[],
  ctx: PlaybackContext
) => Partial<Pick<ResolutionByDomain, D>>

interface EffectBase {
  reason?: string
  // 增强追踪字段
  source?: string // 来源策略名称
  sourceIntent?: string // 来源意图ID（用于追踪）
  executionId?: string // 执行唯一标识
}

interface PlayPauseEffect extends EffectBase {
  type: 'play' | 'pause'
}

interface SeekEffect extends EffectBase {
  type: 'seek'
  payload: NonNullable<ResolutionByDomain['seek']>
}

interface ScheduleEffect extends EffectBase {
  type: 'schedule'
  payload: NonNullable<ScheduleIntent>
}

export type Effect = PlayPauseEffect | SeekEffect | ScheduleEffect

/**
 * Effect 执行结果
 */
export interface EffectExecutionResult {
  effectId: string
  type: Effect['type']
  source?: string
  success: boolean
  error?: Error
  executionTimeMs: number
  timestamp: number
}

/**
 * 阶段执行性能统计
 */
export interface PhasePerformanceMetrics {
  updateFacts: number
  collect: number
  reduce: number
  plan: number
  execute: number
  commit: number
  total: number
}

/**
 * 资源管理接口
 */
export interface DisposableResource {
  dispose(): void | Promise<void>
  isDisposed(): boolean
}

export interface ResourceManager {
  register<T extends DisposableResource>(resource: T): T
  dispose(): Promise<void>
  isDisposed(): boolean
  getResourceCount(): number
}

/**
 * 增强的追踪记录
 */
export interface TraceRecord {
  traceId: number
  timestamp: number
  event: any // MediaClockEvent

  // 各阶段数据
  intents: Intent[]
  resolution: ResolutionByDomain
  effects: Effect[]
  stateChanges: any

  // 执行结果
  executeResult: {
    effectsExecuted: number
    effectResults?: EffectExecutionResult[]
    errors?: Array<{ error: any }>
  }
  commitResult: {
    appliedSubtitleIndex?: any
  }

  // 性能指标
  performance: PhasePerformanceMetrics

  // 追踪元数据
  meta: {
    intentCount: number
    effectCount: number
    hasErrors: boolean
    hasSubtitleChange: boolean
  }
}

/**
 * 新的策略接口 - 直接输出 Intent
 */
export interface IntentBasedStrategy {
  readonly name: string
  readonly priority: number // 策略的基础优先级

  /**
   * 策略是否应该激活
   */
  shouldActivate(context: PlaybackContext): boolean

  /**
   * 策略被激活时触发（可选）。
   * 可返回初始化阶段需要立刻生效的意图（如锁定字幕、设置模式等）。
   */
  onActivate?(context: PlaybackContext): Intent[]

  /**
   * 处理事件并返回 Intent 数组
   */
  onEvent(context: PlaybackContext): Intent[]

  /**
   * 策略被停用时触发（可选）。
   * 可返回清理阶段需要立刻生效的意图（如释放锁、恢复默认设置等）。
   */
  onDeactivate?(context: PlaybackContext): Intent[]

  /**
   * 清理资源
   */
  dispose?(): void
}
