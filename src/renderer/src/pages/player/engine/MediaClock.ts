import { loggerService } from '@logger'

import { TimeMath } from './core/TimeMath'

const logger = loggerService.withContext('MediaClock')

export interface MediaClockState {
  currentTime: number
  duration: number
  paused: boolean
  playbackRate: number
  seeking: boolean
}

export interface MediaClockEvent {
  type: 'time_update' | 'play' | 'pause' | 'ended' | 'seeking' | 'seeked' | 'duration_change'
  timestamp: number
  currentTime: number
  duration: number
  paused: boolean
  playbackRate: number
}

export type MediaClockListener = (event: MediaClockEvent) => void

/**
 * 监听器元数据，用于生命周期管理和性能监控
 */
interface ListenerMetadata {
  id: string
  listener: MediaClockListener
  name?: string
  category?: string
  addedAt: number
  callCount: number
  totalExecutionTime: number
  lastExecutionTime: number
  errorCount: number
  lastError?: Error
}

/**
 * 性能监控数据
 */
interface PerformanceStats {
  eventDispatchCount: number
  totalDispatchTime: number
  averageDispatchTime: number
  listenerStats: {
    totalListeners: number
    activeListeners: number
    totalCalls: number
    totalErrors: number
    slowestListener?: {
      id: string
      name?: string
      avgExecutionTime: number
    }
  }
  memoryStats: {
    eventHistorySize: number
    timeHistorySize: number
    listenerCount: number
  }
}

/**
 * 事件重复检测记录
 */
interface EventRecord {
  type: MediaClockEvent['type']
  timestamp: number
  currentTime: number
  details?: any
}

/**
 * Seek 事件协调器
 * 确保 seeking/seeked 事件的正确序列和状态管理
 */
class SeekEventCoordinator {
  private seekingActive = false
  private lastSeekingTime = -1
  private seekingStartTimestamp = 0

  /**
   * 检查是否可以开始新的 seeking
   */
  canStartSeeking(): boolean {
    return !this.seekingActive
  }

  /**
   * 开始 seeking 操作
   */
  startSeeking(currentTime: number): boolean {
    if (this.seekingActive) {
      // 如果已经在 seeking，忽略重复的开始请求
      logger.debug('Ignoring duplicate seeking start request', { currentTime })
      return false
    }

    this.seekingActive = true
    this.lastSeekingTime = currentTime
    this.seekingStartTimestamp = Date.now()

    logger.debug('Seeking started', {
      currentTime,
      timestamp: this.seekingStartTimestamp
    })

    return true
  }

  /**
   * 完成 seeking 操作
   */
  endSeeking(currentTime: number): boolean {
    if (!this.seekingActive) {
      // 没有活跃的 seeking，忽略 seeked 事件
      logger.debug('Ignoring seeked without active seeking', { currentTime })
      return false
    }

    const seekDuration = Date.now() - this.seekingStartTimestamp

    this.seekingActive = false
    this.lastSeekingTime = -1
    this.seekingStartTimestamp = 0

    logger.debug('Seeking ended', {
      currentTime,
      duration: seekDuration
    })

    return true
  }

  /**
   * 重置状态（用于异常情况）
   */
  reset(): void {
    this.seekingActive = false
    this.lastSeekingTime = -1
    this.seekingStartTimestamp = 0
    logger.debug('SeekEventCoordinator reset')
  }

  /**
   * 获取当前状态（用于调试）
   */
  getState() {
    return {
      seekingActive: this.seekingActive,
      lastSeekingTime: this.lastSeekingTime,
      seekingStartTimestamp: this.seekingStartTimestamp,
      seekingDuration: this.seekingActive ? Date.now() - this.seekingStartTimestamp : 0
    }
  }
}

/**
 * 智能事件去重器
 * 基于事件类型、时间戳和内容进行精确去重
 * 集成 TimeMath 进行精确的时间比较
 */
class EventDeduplicator {
  private readonly eventHistory = new Map<string, EventRecord>()
  private readonly historyLimit = 20 // 保持最近20个事件记录
  private readonly eventKeys: string[] = []
  private readonly timeHistory: number[] = [] // 用于边界抖动检测

  /**
   * 生成事件的唯一键，使用 TimeMath 进行时间量化
   */
  private generateEventKey(event: MediaClockEvent): string {
    // 对于时间相关事件，使用 TimeMath 的精度标准
    if (event.type === 'time_update') {
      // 使用 TimeMath.EPS 的精度进行量化，避免浮点精度问题
      const quantizedTime = Math.floor(event.currentTime / TimeMath.EPS) * TimeMath.EPS
      return `${event.type}_${quantizedTime.toFixed(6)}`
    }

    // 对于状态变化事件，包含相关状态
    if (event.type === 'play' || event.type === 'pause') {
      return `${event.type}_${event.paused}`
    }

    if (event.type === 'seeking' || event.type === 'seeked') {
      // seeking/seeked 事件使用更高精度，结合时间戳
      const quantizedTime = Math.floor(event.currentTime / TimeMath.EPS) * TimeMath.EPS
      return `${event.type}_${quantizedTime.toFixed(6)}_${Math.floor(event.timestamp / 10)}`
    }

    if (event.type === 'duration_change') {
      return `${event.type}_${event.duration}`
    }

    // 默认键（ended等）
    return `${event.type}_${event.timestamp}`
  }

  /**
   * 检查事件是否为重复事件
   * 集成 TimeMath 进行精确时间比较和边界抖动检测
   */
  isDuplicate(event: MediaClockEvent): boolean {
    const key = this.generateEventKey(event)
    const existing = this.eventHistory.get(key)

    if (!existing) {
      return false
    }

    // 使用 TimeMath 进行时间相等性检查
    if (event.type === 'time_update') {
      // 检查是否为相同时间点（在容差范围内） - 减少重复日志
      if (TimeMath.equals(existing.currentTime, event.currentTime)) {
        // 降低重复事件日志频率，只记录采样的重复事件
        if (Math.random() < 0.05) {
          logger.debug('Duplicate time_update event (TimeMath.equals - sampled)', {
            existing: existing.currentTime,
            current: event.currentTime,
            epsilon: TimeMath.EPS
          })
        }
        return true
      }

      // 更新时间历史用于抖动检测
      this.updateTimeHistory(event.currentTime)

      // 检查边界抖动：如果检测到抖动，认为是重复事件
      if (this.timeHistory.length >= 3) {
        const boundaries = [0, existing.currentTime, event.currentTime] // 可能的边界点
        for (const boundary of boundaries) {
          if (TimeMath.detectBoundaryFlutter(this.timeHistory, boundary)) {
            // 减少边界抖动检测日志频率
            if (Math.random() < 0.1) {
              logger.debug('Boundary flutter detected, treating as duplicate (sampled)', {
                boundary,
                timeHistory: this.timeHistory.slice(0, 3),
                currentTime: event.currentTime
              })
            }
            return true
          }
        }
      }
    }

    // 检查时间窗口：相同事件在短时间内（50ms）视为重复
    const timeDiff = event.timestamp - existing.timestamp
    if (timeDiff < 50) {
      logger.debug('Duplicate event detected (time window)', {
        type: event.type,
        currentTime: event.currentTime,
        timeDiff
      })
      return true
    }

    return false
  }

  /**
   * 更新时间历史记录，用于边界抖动检测
   */
  private updateTimeHistory(currentTime: number): void {
    this.timeHistory.unshift(currentTime) // 最新的时间在前
    if (this.timeHistory.length > 5) {
      this.timeHistory.pop() // 只保留最近5个时间点
    }
  }

  /**
   * 记录事件
   */
  recordEvent(event: MediaClockEvent): void {
    const key = this.generateEventKey(event)

    this.eventHistory.set(key, {
      type: event.type,
      timestamp: event.timestamp,
      currentTime: event.currentTime,
      details: {
        paused: event.paused,
        duration: event.duration,
        playbackRate: event.playbackRate
      }
    })

    this.eventKeys.push(key)

    // 限制历史记录大小
    if (this.eventKeys.length > this.historyLimit) {
      const oldKey = this.eventKeys.shift()!
      this.eventHistory.delete(oldKey)
    }
  }

  /**
   * 清理历史记录
   */
  clear(): void {
    this.eventHistory.clear()
    this.eventKeys.length = 0
  }

  /**
   * 获取当前历史记录（用于调试）
   */
  getHistory(): EventRecord[] {
    return this.eventKeys.map((key) => this.eventHistory.get(key)!).filter(Boolean)
  }
}

/**
 * 动态节流策略枚举
 */
export enum ThrottleMode {
  /** 正常播放模式：50ms 节流 (20fps) */
  NORMAL = 'normal',
  /** 拖拽模式：16ms 节流 (60fps) */
  SEEKING = 'seeking',
  /** 高精度模式：用于 seek settle 检测 */
  HIGH_PRECISION = 'high_precision'
}

/**
 * 动态节流器
 * 根据播放状态自适应调整节流间隔
 */
class DynamicThrottler {
  private static readonly THROTTLE_INTERVALS = {
    [ThrottleMode.NORMAL]: 50, // 20fps
    [ThrottleMode.SEEKING]: 16, // ~60fps
    [ThrottleMode.HIGH_PRECISION]: 8 // ~120fps，用于 settle 检测
  }

  private currentMode: ThrottleMode = ThrottleMode.NORMAL
  private lastEmitTime = 0
  private settleFrameCount = 0
  private readonly maxSettleFrames = 2 // seek 后前 2 帧保持高精度

  /**
   * 获取当前节流间隔
   */
  getCurrentInterval(): number {
    return DynamicThrottler.THROTTLE_INTERVALS[this.currentMode]
  }

  /**
   * 切换节流模式
   */
  setMode(mode: ThrottleMode): void {
    if (this.currentMode !== mode) {
      logger.debug(`ThrottleMode changed: ${this.currentMode} → ${mode}`)
      this.currentMode = mode
      this.lastEmitTime = 0 // 重置节流时间，立即允许下次更新
    }
  }

  /**
   * 检查是否应该更新（考虑节流）
   */
  shouldUpdate(force = false): boolean {
    if (force) return true

    const now = Date.now()
    const interval = this.getCurrentInterval()

    if (now - this.lastEmitTime >= interval) {
      this.lastEmitTime = now

      // 处理 settle 模式的帧计数
      if (this.currentMode === ThrottleMode.HIGH_PRECISION) {
        this.settleFrameCount++
        if (this.settleFrameCount >= this.maxSettleFrames) {
          // settle 完成，切回正常模式
          this.setMode(ThrottleMode.NORMAL)
        }
      }

      return true
    }

    return false
  }

  /**
   * 开始 seek settle 检测
   */
  startSeekSettle(): void {
    this.settleFrameCount = 0
    this.setMode(ThrottleMode.HIGH_PRECISION)
  }

  /**
   * 获取当前模式
   */
  getMode(): ThrottleMode {
    return this.currentMode
  }
}

/**
 * 媒体时钟系统
 * 统一管理播放器的时间状态，提供高精度的时间事件分发
 * 支持自适应节流策略和 seek settle 检测
 */
export class MediaClock {
  // 使用 TimeMath 统一容差常量，保持向后兼容
  public static readonly EPSILON_MS = TimeMath.EPS * 1000 // 转换为毫秒，与 TimeMath.EPS 保持同步
  private state: MediaClockState = {
    currentTime: 0,
    duration: 0,
    paused: true,
    playbackRate: 1,
    seeking: false
  }

  // 升级监听器管理系统
  private listeners: Map<string, ListenerMetadata> = new Map()
  private listenerIdCounter = 0

  // 核心组件
  private throttler = new DynamicThrottler()
  private seekCoordinator = new SeekEventCoordinator()
  private deduplicator = new EventDeduplicator()

  // 性能监控
  private performanceStats: PerformanceStats = {
    eventDispatchCount: 0,
    totalDispatchTime: 0,
    averageDispatchTime: 0,
    listenerStats: {
      totalListeners: 0,
      activeListeners: 0,
      totalCalls: 0,
      totalErrors: 0
    },
    memoryStats: {
      eventHistorySize: 0,
      timeHistorySize: 0,
      listenerCount: 0
    }
  }

  constructor(state?: Partial<MediaClockState>) {
    logger.debug('MediaClock initialized with enhanced lifecycle management')
    this.state = { ...this.state, ...state }
    this.updateMemoryStats()
  }

  /**
   * 获取当前时钟状态
   */
  getState(): Readonly<MediaClockState> {
    return { ...this.state }
  }

  /**
   * 获取动态容差值：ε = max(TimeMath.EPS, 0.5 * currentThrottleInterval)
   * 根据当前节流模式动态调整容差，保持与 TimeMath 模块的一致性
   */
  getEpsilon(): number {
    const currentInterval = this.throttler.getCurrentInterval()
    return Math.max(TimeMath.EPS, (currentInterval * 0.5) / 1000) // 转换为秒
  }

  /**
   * 获取当前节流模式（用于调试和监控）
   */
  getThrottleMode(): ThrottleMode {
    return this.throttler.getMode()
  }

  /**
   * 手动设置节流模式（用于调试和特殊场景）
   */
  setThrottleMode(mode: ThrottleMode): void {
    this.throttler.setMode(mode)
  }

  /**
   * 订阅时钟事件（增强版本）
   * @param listener 事件监听器
   * @param options 监听器配置选项
   */
  subscribe(
    listener: MediaClockListener,
    options?: {
      name?: string
      category?: string
    }
  ): () => void {
    const id = `listener_${++this.listenerIdCounter}`
    const metadata: ListenerMetadata = {
      id,
      listener,
      name: options?.name,
      category: options?.category,
      addedAt: Date.now(),
      callCount: 0,
      totalExecutionTime: 0,
      lastExecutionTime: 0,
      errorCount: 0
    }

    this.listeners.set(id, metadata)
    this.performanceStats.listenerStats.totalListeners++
    this.performanceStats.listenerStats.activeListeners++
    this.updateMemoryStats()

    logger.debug('Listener subscribed', {
      id,
      name: options?.name,
      category: options?.category,
      totalListeners: this.listeners.size
    })

    // 返回取消订阅函数
    return () => {
      const removed = this.listeners.delete(id)
      if (removed) {
        this.performanceStats.listenerStats.activeListeners--
        this.updateMemoryStats()
        logger.debug('Listener unsubscribed', {
          id,
          name: options?.name,
          activeListeners: this.listeners.size
        })
      }
    }
  }

  /**
   * 批量移除监听器
   */
  removeListeners(predicate?: (metadata: ListenerMetadata) => boolean): number {
    let removedCount = 0

    if (!predicate) {
      // 移除所有监听器
      removedCount = this.listeners.size
      this.listeners.clear()
    } else {
      // 按条件移除监听器
      const toRemove: string[] = []
      for (const [id, metadata] of this.listeners) {
        if (predicate(metadata)) {
          toRemove.push(id)
        }
      }

      toRemove.forEach((id) => {
        this.listeners.delete(id)
        removedCount++
      })
    }

    this.performanceStats.listenerStats.activeListeners = this.listeners.size
    this.updateMemoryStats()

    logger.debug('Batch listener removal', {
      removedCount,
      activeListeners: this.listeners.size
    })

    return removedCount
  }

  /**
   * 获取监听器信息
   */
  getListenerInfo(id?: string): ListenerMetadata[] {
    if (id) {
      const metadata = this.listeners.get(id)
      return metadata ? [metadata] : []
    }
    return Array.from(this.listeners.values())
  }

  /**
   * 更新当前时间（来自video element的timeupdate事件）
   * 支持动态节流和智能去重
   */
  updateTime(currentTime: number, force = false): void {
    // 使用动态节流器判断是否应该更新
    if (!this.throttler.shouldUpdate(force)) {
      // 即使不发送事件，也要更新内部状态
      this.state.currentTime = currentTime
      return
    }

    // 智能去重：使用动态容差避免无意义的时间更新
    const epsilon = this.getEpsilon()
    if (TimeMath.equals(this.state.currentTime, currentTime, epsilon) && !force) {
      return
    }

    // 更新内部状态
    const previousTime = this.state.currentTime
    this.state.currentTime = currentTime

    // 构造并发送事件
    const event: MediaClockEvent = {
      type: 'time_update',
      timestamp: Date.now(),
      currentTime,
      duration: this.state.duration,
      paused: this.state.paused,
      playbackRate: this.state.playbackRate
    }

    // 在高精度模式下添加额外的调试信息 - 降低频率
    if (this.throttler.getMode() === ThrottleMode.HIGH_PRECISION && Math.random() < 0.1) {
      logger.debug('High-precision time update (sampled)', {
        previousTime,
        currentTime,
        epsilon,
        throttleMode: this.throttler.getMode()
      })
    }

    this.emitEvent(event)
  }

  /**
   * 设置播放状态
   * 在播放状态切换时调整节流策略
   */
  setPlaying(playing: boolean): void {
    if (this.state.paused === playing) {
      this.state.paused = !playing

      // 在非 seeking 状态下，根据播放状态调整节流模式
      if (!this.state.seeking) {
        if (playing) {
          // 播放开始：使用正常节流模式
          this.throttler.setMode(ThrottleMode.NORMAL)
        } else {
          // 播放暂停：保持当前模式，不主动切换
          // 暂停时可能用户正在操作进度条
        }
      }

      this.emitEvent({
        type: playing ? 'play' : 'pause',
        timestamp: Date.now(),
        currentTime: this.state.currentTime,
        duration: this.state.duration,
        paused: this.state.paused,
        playbackRate: this.state.playbackRate
      })
    }
  }

  /**
   * 设置时长
   */
  setDuration(duration: number): void {
    if (this.state.duration !== duration) {
      this.state.duration = duration

      this.emitEvent({
        type: 'duration_change',
        timestamp: Date.now(),
        currentTime: this.state.currentTime,
        duration,
        paused: this.state.paused,
        playbackRate: this.state.playbackRate
      })
    }
  }

  /**
   * 设置播放速度
   */
  setPlaybackRate(rate: number): void {
    this.state.playbackRate = rate
  }

  /**
   * 标记开始跳转
   * 自动切换到 SEEKING 节流模式以提供更高精度的更新
   */
  startSeeking(): void {
    // 通过 SeekEventCoordinator 检查是否可以开始新的 seeking
    if (!this.seekCoordinator.startSeeking(this.state.currentTime)) {
      return // 忽略重复的 seeking 请求
    }

    this.state.seeking = true

    // 切换到 SEEKING 模式，提高拖拽时的更新频率
    this.throttler.setMode(ThrottleMode.SEEKING)

    this.emitEvent({
      type: 'seeking',
      timestamp: Date.now(),
      currentTime: this.state.currentTime,
      duration: this.state.duration,
      paused: this.state.paused,
      playbackRate: this.state.playbackRate
    })
  }

  /**
   * 标记跳转完成
   * 启动 seek settle 检测机制
   */
  endSeeking(currentTime: number): void {
    // 通过 SeekEventCoordinator 验证 seeked 事件的合法性
    if (!this.seekCoordinator.endSeeking(currentTime)) {
      return // 忽略无效的 seeked 事件
    }

    this.state.seeking = false
    this.state.currentTime = currentTime

    // 启动 settle 检测：前 1-2 帧使用高精度模式
    this.throttler.startSeekSettle()

    this.emitEvent({
      type: 'seeked',
      timestamp: Date.now(),
      currentTime,
      duration: this.state.duration,
      paused: this.state.paused,
      playbackRate: this.state.playbackRate
    })
  }

  /**
   * 播放结束
   */
  ended(): void {
    this.state.paused = true

    this.emitEvent({
      type: 'ended',
      timestamp: Date.now(),
      currentTime: this.state.currentTime,
      duration: this.state.duration,
      paused: true,
      playbackRate: this.state.playbackRate
    })
  }

  /**
   * 发送时钟事件给所有监听器
   * 集成智能去重、监听器异常隔离和性能监控
   */
  private emitEvent(event: MediaClockEvent): void {
    // 智能去重：避免发送重复事件
    if (this.deduplicator.isDuplicate(event)) {
      return
    }

    // 记录事件到历史记录
    this.deduplicator.recordEvent(event)

    // 开始性能监控
    const dispatchStartTime = performance.now()
    let successCount = 0
    let errorCount = 0

    // 安全地向所有监听器派发事件，确保单个监听器异常不影响其他监听器
    for (const [id, metadata] of this.listeners) {
      const listenerStartTime = performance.now()

      try {
        metadata.listener(event)
        successCount++

        // 更新监听器性能统计
        const executionTime = performance.now() - listenerStartTime
        metadata.callCount++
        metadata.totalExecutionTime += executionTime
        metadata.lastExecutionTime = executionTime
        this.performanceStats.listenerStats.totalCalls++
      } catch (error) {
        errorCount++

        // 更新监听器错误统计
        metadata.errorCount++
        metadata.lastError = error instanceof Error ? error : new Error(String(error))
        this.performanceStats.listenerStats.totalErrors++

        logger.error('Error in MediaClock listener:', {
          error: error,
          listenerId: id,
          listenerName: metadata.name,
          listenerCategory: metadata.category,
          eventType: event.type,
          currentTime: event.currentTime,
          callCount: metadata.callCount,
          errorCount: metadata.errorCount
        })
      }
    }

    // 更新全局性能统计
    const totalDispatchTime = performance.now() - dispatchStartTime
    this.performanceStats.eventDispatchCount++
    this.performanceStats.totalDispatchTime += totalDispatchTime
    this.performanceStats.averageDispatchTime =
      this.performanceStats.totalDispatchTime / this.performanceStats.eventDispatchCount

    // 更新最慢监听器统计
    this.updateSlowestListenerStats()

    // 如果有异常，记录统计信息用于调试
    if (errorCount > 0) {
      logger.warn('MediaClock event dispatch completed with errors', {
        eventType: event.type,
        successCount,
        errorCount,
        totalListeners: this.listeners.size,
        totalDispatchTime: totalDispatchTime.toFixed(3) + 'ms'
      })
    }

    // 在调试模式下记录性能数据
    if (this.throttler.getMode() === ThrottleMode.HIGH_PRECISION && totalDispatchTime > 5) {
      logger.debug('Slow event dispatch detected', {
        eventType: event.type,
        dispatchTime: totalDispatchTime.toFixed(3) + 'ms',
        listenerCount: this.listeners.size,
        throttleMode: this.throttler.getMode()
      })
    }
  }

  /**
   * 更新最慢监听器统计信息
   */
  private updateSlowestListenerStats(): void {
    let slowest: ListenerMetadata | null = null
    let maxAvgTime = 0

    for (const metadata of this.listeners.values()) {
      if (metadata.callCount > 0) {
        const avgTime = metadata.totalExecutionTime / metadata.callCount
        if (avgTime > maxAvgTime) {
          maxAvgTime = avgTime
          slowest = metadata
        }
      }
    }

    if (slowest) {
      this.performanceStats.listenerStats.slowestListener = {
        id: slowest.id,
        name: slowest.name,
        avgExecutionTime: maxAvgTime
      }
    }
  }

  /**
   * 更新内存统计信息
   */
  private updateMemoryStats(): void {
    this.performanceStats.memoryStats = {
      eventHistorySize: this.deduplicator.getHistory().length,
      timeHistorySize: this.deduplicator['timeHistory']?.length || 0,
      listenerCount: this.listeners.size
    }
  }

  /**
   * 获取调试信息（增强版本）
   * 包含当前状态、节流信息、事件历史、性能统计等完整信息
   */
  getDebugInfo() {
    // 计算实时性能指标
    const realtimeMetrics = this.calculateRealtimeMetrics()

    return {
      // 基础状态信息
      state: this.getState(),

      // 节流系统信息
      throttling: {
        mode: this.throttler.getMode(),
        currentInterval: this.throttler.getCurrentInterval(),
        epsilon: this.getEpsilon(),
        dynamicEpsilon: this.getEpsilon() !== TimeMath.EPS
      },

      // Seek 协调器状态
      seeking: this.seekCoordinator.getState(),

      // 事件系统信息
      events: {
        listenerCount: this.listeners.size,
        recentHistory: this.deduplicator.getHistory().slice(-5), // 最近5个事件
        timeHistory: this.deduplicator['timeHistory']?.slice(0, 3) || [] // 最近3个时间点
      },

      // 监听器详细信息
      listeners: this.getListenerInfo().map((metadata) => ({
        id: metadata.id,
        name: metadata.name,
        category: metadata.category,
        addedAt: metadata.addedAt,
        callCount: metadata.callCount,
        avgExecutionTime:
          metadata.callCount > 0
            ? (metadata.totalExecutionTime / metadata.callCount).toFixed(3) + 'ms'
            : '0ms',
        errorCount: metadata.errorCount,
        hasRecentError: metadata.lastError && Date.now() - metadata.addedAt < 60000
      })),

      // 性能统计
      performance: {
        ...this.performanceStats,
        realtimeMetrics,
        averageDispatchTime: this.performanceStats.averageDispatchTime.toFixed(3) + 'ms'
      },

      // TimeMath 集成状态
      timeMath: {
        version: 'integrated',
        eps: TimeMath.EPS,
        epsilonMs: TimeMath.EPS * 1000,
        currentDynamicEpsilon: this.getEpsilon(),
        boundaryFlutterDetection: 'enabled'
      },

      // 系统健康状态
      health: {
        status: this.assessSystemHealth(),
        warnings: this.getHealthWarnings(),
        recommendations: this.getOptimizationRecommendations()
      },

      // 元信息
      meta: {
        timestamp: Date.now(),
        uptime:
          Date.now() -
          (this.listeners.size > 0
            ? Math.min(...Array.from(this.listeners.values()).map((m) => m.addedAt))
            : Date.now()),
        version: '3.3.0-enhanced'
      }
    }
  }

  /**
   * 计算实时性能指标
   */
  private calculateRealtimeMetrics() {
    const now = Date.now()
    const recentThreshold = 10000 // 最近10秒

    let recentCalls = 0
    let recentErrors = 0
    let recentTotalTime = 0

    for (const metadata of this.listeners.values()) {
      if (now - metadata.addedAt < recentThreshold) {
        recentCalls += metadata.callCount
        recentErrors += metadata.errorCount
        recentTotalTime += metadata.totalExecutionTime
      }
    }

    return {
      recentCallsPerSecond: recentCalls / (recentThreshold / 1000),
      recentErrorRate: recentCalls > 0 ? recentErrors / recentCalls : 0,
      recentAvgExecutionTime: recentCalls > 0 ? recentTotalTime / recentCalls : 0,
      memoryUsageEstimate: this.estimateMemoryUsage()
    }
  }

  /**
   * 评估系统健康状态
   */
  private assessSystemHealth(): 'healthy' | 'warning' | 'critical' {
    const errorRate =
      this.performanceStats.listenerStats.totalCalls > 0
        ? this.performanceStats.listenerStats.totalErrors /
          this.performanceStats.listenerStats.totalCalls
        : 0

    const avgDispatchTime = this.performanceStats.averageDispatchTime

    if (errorRate > 0.1 || avgDispatchTime > 50) {
      return 'critical'
    } else if (errorRate > 0.01 || avgDispatchTime > 10) {
      return 'warning'
    }

    return 'healthy'
  }

  /**
   * 获取健康警告
   */
  private getHealthWarnings(): string[] {
    const warnings: string[] = []

    const errorRate =
      this.performanceStats.listenerStats.totalCalls > 0
        ? this.performanceStats.listenerStats.totalErrors /
          this.performanceStats.listenerStats.totalCalls
        : 0

    if (errorRate > 0.01) {
      warnings.push(`High error rate: ${(errorRate * 100).toFixed(1)}%`)
    }

    if (this.performanceStats.averageDispatchTime > 10) {
      warnings.push(`Slow dispatch: ${this.performanceStats.averageDispatchTime.toFixed(1)}ms avg`)
    }

    if (this.listeners.size > 20) {
      warnings.push(`High listener count: ${this.listeners.size}`)
    }

    const memUsage = this.estimateMemoryUsage()
    if (memUsage > 1000000) {
      // 1MB
      warnings.push(`High memory usage: ~${(memUsage / 1024 / 1024).toFixed(1)}MB`)
    }

    return warnings
  }

  /**
   * 获取优化建议
   */
  private getOptimizationRecommendations(): string[] {
    const recommendations: string[] = []

    // 基于监听器性能提供建议
    const slowestListener = this.performanceStats.listenerStats.slowestListener
    if (slowestListener && slowestListener.avgExecutionTime > 5) {
      recommendations.push(
        `Optimize slowest listener: ${slowestListener.name || slowestListener.id}`
      )
    }

    // 基于错误率提供建议
    const highErrorListeners = Array.from(this.listeners.values()).filter(
      (m) => m.callCount > 10 && m.errorCount / m.callCount > 0.05
    )

    if (highErrorListeners.length > 0) {
      recommendations.push(
        `Review error-prone listeners: ${highErrorListeners.map((m) => m.name || m.id).join(', ')}`
      )
    }

    // 基于内存使用提供建议
    if (this.deduplicator.getHistory().length > 50) {
      recommendations.push('Consider reducing event history limit')
    }

    return recommendations
  }

  /**
   * 估算内存使用量（字节）
   */
  private estimateMemoryUsage(): number {
    let estimate = 0

    // 监听器元数据
    estimate += this.listeners.size * 200 // 每个监听器约200字节

    // 事件历史
    estimate += this.deduplicator.getHistory().length * 100 // 每个事件约100字节

    // 时间历史
    estimate += (this.deduplicator['timeHistory']?.length || 0) * 8 // 每个数字8字节

    // 性能统计
    estimate += 1000 // 固定开销

    return estimate
  }

  /**
   * 获取性能统计信息
   */
  getPerformanceStats(): PerformanceStats {
    this.updateMemoryStats()
    return { ...this.performanceStats }
  }

  /**
   * 重置性能统计
   */
  resetPerformanceStats(): void {
    // 重置全局统计，保留监听器统计
    this.performanceStats.eventDispatchCount = 0
    this.performanceStats.totalDispatchTime = 0
    this.performanceStats.averageDispatchTime = 0

    // 重置每个监听器的统计
    for (const metadata of this.listeners.values()) {
      metadata.callCount = 0
      metadata.totalExecutionTime = 0
      metadata.lastExecutionTime = 0
      metadata.errorCount = 0
      metadata.lastError = undefined
    }

    this.performanceStats.listenerStats.totalCalls = 0
    this.performanceStats.listenerStats.totalErrors = 0
    this.performanceStats.listenerStats.slowestListener = undefined

    logger.debug('Performance statistics reset')
  }

  /**
   * 重置事件系统状态（用于测试和调试）
   */
  resetEventSystem(): void {
    this.seekCoordinator.reset()
    this.deduplicator.clear()
    logger.debug('MediaClock event system reset')
  }

  /**
   * 强制触发事件（用于测试，跳过去重检查）
   */
  forceEmitEvent(event: MediaClockEvent): void {
    // 直接派发事件，跳过去重逻辑
    const dispatchStartTime = performance.now()
    let successCount = 0
    let errorCount = 0

    for (const [id, metadata] of this.listeners) {
      try {
        metadata.listener(event)
        successCount++
      } catch (error) {
        errorCount++
        logger.error('Error in forced MediaClock listener:', {
          error: error,
          listenerId: id,
          listenerName: metadata.name,
          eventType: event.type
        })
      }
    }

    const dispatchTime = performance.now() - dispatchStartTime
    logger.debug('Forced event emitted', {
      eventType: event.type,
      successCount,
      errorCount,
      dispatchTime: dispatchTime.toFixed(3) + 'ms'
    })
  }

  /**
   * 导出诊断数据
   */
  exportDiagnostics(): string {
    const diagnostics = {
      timestamp: new Date().toISOString(),
      debugInfo: this.getDebugInfo(),
      performanceStats: this.getPerformanceStats(),
      listenerDetails: this.getListenerInfo(),
      timeMathIntegration: {
        version: '3.3.0',
        features: [
          'dynamic-epsilon',
          'boundary-flutter-detection',
          'precise-time-quantization',
          'integrated-deduplication'
        ]
      }
    }

    return JSON.stringify(diagnostics, null, 2)
  }

  /**
   * 从诊断数据导入配置（仅用于调试）
   */
  importDiagnostics(diagnosticsJson: string): boolean {
    try {
      const diagnostics = JSON.parse(diagnosticsJson)

      // 验证数据格式
      if (!diagnostics.debugInfo || !diagnostics.performanceStats) {
        logger.error('Invalid diagnostics data format')
        return false
      }

      // 重置系统状态
      this.resetPerformanceStats()
      this.resetEventSystem()

      logger.debug('Diagnostics imported successfully', {
        importTimestamp: diagnostics.timestamp,
        currentTimestamp: new Date().toISOString()
      })

      return true
    } catch (error) {
      logger.error('Failed to import diagnostics:', { error: error })
      return false
    }
  }

  /**
   * 清理资源（增强版本）
   */
  dispose(): void {
    // 记录清理前的统计信息
    const finalStats = {
      totalListeners: this.listeners.size,
      totalEvents: this.performanceStats.eventDispatchCount,
      totalDispatchTime: this.performanceStats.totalDispatchTime,
      totalErrors: this.performanceStats.listenerStats.totalErrors,
      uptime:
        Date.now() -
        (this.listeners.size > 0
          ? Math.min(...Array.from(this.listeners.values()).map((m) => m.addedAt))
          : Date.now())
    }

    // 清理所有资源
    this.listeners.clear()
    this.deduplicator.clear()
    this.seekCoordinator.reset()

    // 重置性能统计
    this.performanceStats = {
      eventDispatchCount: 0,
      totalDispatchTime: 0,
      averageDispatchTime: 0,
      listenerStats: {
        totalListeners: 0,
        activeListeners: 0,
        totalCalls: 0,
        totalErrors: 0
      },
      memoryStats: {
        eventHistorySize: 0,
        timeHistorySize: 0,
        listenerCount: 0
      }
    }

    logger.debug('MediaClock disposed with enhanced cleanup', finalStats)
  }
}
