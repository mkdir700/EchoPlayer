import { loggerService } from '@logger'

import {
  DomainReducer,
  Intent,
  LoopIntent,
  PlaybackContext,
  ResolutionByDomain,
  ScheduleIntent,
  SeekIntent,
  SubtitleIntent,
  TransportIntent
} from './types'

const logger = loggerService.withContext('DomainReducer')

/**
 * 领域归约器实现
 * 每个归约器负责处理特定领域的意图冲突解决
 */

/**
 * 播放控制归约器（互斥领域）
 * 优先级最高者胜出，若同优先级后到者胜出
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const transportReducer: DomainReducer<'transport'> = (intents, _ctx) => {
  const transportIntents = intents.filter((i) => i.domain === 'transport') as TransportIntent[]
  if (transportIntents.length === 0) return {}

  // 按优先级降序排序，同优先级情况下后到者优先
  transportIntents.sort((a, b) => {
    const priorityA = a.priority ?? 0
    const priorityB = b.priority ?? 0
    if (priorityA === priorityB) {
      // 同优先级时，在数组中靠后的（后到者）优先
      return intents.indexOf(b) - intents.indexOf(a)
    }
    return priorityB - priorityA
  })

  const winner = transportIntents[0]
  return {
    transport: {
      op: winner.op,
      reason: winner.reason
    }
  }
}

/**
 * 跳转控制归约器（互斥领域）
 * 优先级最高者胜出，时间进行边界检查
 */
export const seekReducer: DomainReducer<'seek'> = (intents, ctx) => {
  const seekIntents = intents.filter((i) => i.domain === 'seek') as SeekIntent[]
  if (seekIntents.length === 0) return {}

  // 按优先级降序排序
  seekIntents.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))

  const winner = seekIntents[0]
  // 时间边界检查
  const clampedTime = Math.max(0, Math.min(ctx.duration || Infinity, winner.to))

  return {
    seek: {
      to: clampedTime,
      followUpPlay: winner.followUpPlay,
      reason: winner.reason
    }
  }
}

/**
 * 字幕控制归约器（可并行+锁规则领域）
 * 锁状态优先，建议索引在无锁时生效
 */

export const subtitleReducer: DomainReducer<'subtitle'> = (intents, ctx) => {
  void ctx // 未使用上下文，但保留参数以符合签名
  const subtitleIntents = intents.filter((i) => i.domain === 'subtitle') as SubtitleIntent[]
  if (subtitleIntents.length === 0) return {}

  // 1) 归约锁状态：最高优先级的锁操作生效
  const lockOps = subtitleIntents
    .filter((s) => typeof s.lock === 'boolean')
    .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))

  let lockState: 'lock' | 'unlock' | 'keep' = 'keep'
  let owner: string | undefined

  if (lockOps.length > 0) {
    const topLockOp = lockOps[0]
    lockState = topLockOp.lock ? 'lock' : 'unlock'
    owner = topLockOp.lockOwner
  }

  // 2) 归约索引建议：考虑当前锁定状态
  let index: number | undefined

  const suggestions = subtitleIntents
    .filter((s) => s.suggestIndex !== undefined)
    .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))

  if (suggestions.length > 0) {
    const top = suggestions[0]
    index = top.suggestIndex
    logger.debug('采纳索引建议', { index, suggestion: top })
    return {
      subtitle: {
        index,
        lockState,
        owner,
        winnerMeta: { source: top.source, priority: top.priority, reason: top.reason }
      }
    }
  }

  return {
    subtitle: {
      index,
      lockState,
      owner
    }
  }
}

/**
 * 循环控制归约器（可并行领域）
 * 支持显式设置和相对增减的组合
 */
export const loopReducer: DomainReducer<'loop'> = (intents, ctx) => {
  const loopIntents = intents.filter((i) => i.domain === 'loop') as LoopIntent[]
  if (loopIntents.length === 0) return {}

  // 按优先级排序
  loopIntents.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))

  let remaining = ctx.loopRemainingCount
  let mode = ctx.loopMode

  // 先处理显式设置（setRemaining），取最高优先级的设置
  const setOps = loopIntents.filter((i) => typeof i.setRemaining === 'number')
  if (setOps.length > 0) {
    remaining = setOps[0].setRemaining!
  }

  // 再应用所有相对增减（deltaRemaining），按优先级顺序
  for (const intent of loopIntents) {
    if (typeof intent.deltaRemaining === 'number') {
      remaining += intent.deltaRemaining
    }
  }

  // 处理模式设置
  const modeOps = loopIntents.filter((i) => i.setMode !== undefined)
  if (modeOps.length > 0) {
    mode = modeOps[0].setMode!
  }

  // 边界检查：-1 表示无限循环
  remaining = Math.max(-1, remaining)

  logger.debug('循环控制归约器', { remaining, mode })

  return {
    loop: {
      remaining,
      mode
    }
  }
}

/**
 * 定时任务归约器（可并行领域）
 * 收集所有定时任务，支持去重和限流
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const scheduleReducer: DomainReducer<'schedule'> = (intents, _ctx) => {
  const scheduleIntents = intents.filter((i) => i.domain === 'schedule') as ScheduleIntent[]
  if (scheduleIntents.length === 0) return {}

  // 去重：相同 action + delayMs 的任务只保留一个（优先级高者）
  const uniqueSchedules = new Map<string, ScheduleIntent>()

  for (const intent of scheduleIntents) {
    const key = `${intent.action}:${intent.delayMs}`
    const existing = uniqueSchedules.get(key)

    if (!existing || (intent.priority ?? 0) > (existing.priority ?? 0)) {
      uniqueSchedules.set(key, intent)
    }
  }

  // 转换为决议格式，按 delayMs 排序
  const schedules = Array.from(uniqueSchedules.values())
    .sort((a, b) => a.delayMs - b.delayMs)
    .map((s) => ({
      action: s.action,
      delayMs: s.delayMs,
      params: s.params
    }))

  return {
    schedule: schedules
  }
}

/**
 * 归约器注册表
 * 支持动态添加新的领域归约器
 */
export const DOMAIN_REDUCERS = {
  transport: transportReducer,
  seek: seekReducer,
  subtitle: subtitleReducer,
  loop: loopReducer,
  schedule: scheduleReducer
} as const

/**
 * 执行所有领域归约
 */
export function reduceIntentsByDomain(
  intents: Intent[],
  context: PlaybackContext
): ResolutionByDomain {
  const resolution: ResolutionByDomain = {}

  // 逐个执行各领域归约器
  for (const [domain, reducer] of Object.entries(DOMAIN_REDUCERS)) {
    try {
      const domainResolution = reducer(intents, context)
      Object.assign(resolution, domainResolution)
    } catch (error) {
      // 归约器异常不应阻断其他领域的处理
      logger.error(`Domain reducer ${domain} failed`, { error })
    }
  }

  return resolution
}

/**
 * 注册自定义领域归约器
 */
export function registerDomainReducer<D extends string>(
  domain: D,
  reducer: DomainReducer<any>
): void {
  // @ts-ignore - 动态扩展归约器
  DOMAIN_REDUCERS[domain] = reducer
}
