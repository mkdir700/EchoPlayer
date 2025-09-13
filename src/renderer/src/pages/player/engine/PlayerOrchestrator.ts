import { loggerService } from '@logger'
import { LoopMode } from '@types'

import { ClockScheduler } from './core'
import {
  AutoPauseStrategy,
  Effect,
  EffectExecutionResult,
  Intent,
  IntentStrategyManager,
  LoopStrategy,
  PhasePerformanceMetrics,
  PlaybackContext,
  reduceIntentsByDomain,
  ResolutionByDomain,
  SubtitleSyncStrategy,
  TraceRecord
} from './intent'
import { createSubtitleLockFSM, SubtitleLockFSM } from './intent/SubtitleLockFSM'
import { MediaClock, MediaClockEvent } from './MediaClock'
import { SubtitleIndexCalculator } from './utils'

const logger = loggerService.withContext('PlayerOrchestrator')

export interface PlayerOrchestratorConfig {
  // 时钟配置
  clockThrottleMs?: number

  // 调试配置
  enableDebugLogs?: boolean
  enableIntentLogs?: boolean
}

export interface VideoController {
  play(): Promise<void>
  pause(): void
  seek(time: number): void
  setPlaybackRate(rate: number): void
  setVolume(volume: number): void
  setMuted(muted: boolean): void
  getCurrentTime(): number
  getDuration(): number
  isPaused(): boolean
  getPlaybackRate(): number
  getVolume(): number
  isMuted(): boolean
}

export interface StateUpdater {
  setCurrentTime(time: number): void
  setDuration(duration: number): void
  setPlaying(playing: boolean): void
  updateLoopRemaining(count: number): void
  setPlaybackRate(rate: number): void
  setVolume(volume: number): void
  setMuted(muted: boolean): void
  setSeeking?(seeking: boolean): void
  setEnded?(ended: boolean): void
  setActiveCueIndex?(index: number): void
  updateUIState(updates: { openAutoResumeCountdown?: boolean }): void
}

/**
 * 状态变更数据结构 - 纯数据，无副作用
 */
interface StateChanges {
  contextUpdates?: Partial<PlaybackContext> & {
    subtitleIndexRequest?: {
      before: number
      requested: number
      winnerMeta?: any
    }
  }
  externalStateUpdates?: {
    activeCueIndex?: number
    loopRemaining?: number
    uiUpdates?: Record<string, any>
  }
  fsmActions?: {
    type: 'lock' | 'unlock'
    owner: string
    index?: number
  }[]
  debugInfo?: {
    appliedSubtitleIndex?: { from: number; to: number; winnerMeta?: any; fsm: any }
  }
}

/**
 * 执行计划数据结构 - 包含副作用和状态变更计划
 */
interface ExecutionPlan {
  effects: Effect[]
  stateChanges: StateChanges
}

/**
 * 播放器编排器 V2 - Intent 版本
 * 使用领域意图归约系统，支持并行处理和清晰的责任分离
 */
export class PlayerOrchestrator {
  private mediaClock: MediaClock
  private clockScheduler: ClockScheduler
  private strategyManager: IntentStrategyManager
  private subtitleLockFSM: SubtitleLockFSM
  private config: Required<PlayerOrchestratorConfig>

  // 外部依赖
  private videoController: VideoController | null = null
  private stateUpdater: StateUpdater | null = null

  // 当前状态上下文
  private context: PlaybackContext = {
    currentTime: 0,
    duration: 0,
    paused: true,
    playbackRate: 1,
    volume: 1,
    activeCueIndex: -1,
    subtitles: [],
    loopEnabled: false,
    loopMode: LoopMode.SINGLE,
    loopCount: -1,
    loopRemainingCount: -1,
    autoPauseEnabled: false,
    pauseOnSubtitleEnd: false,
    resumeEnabled: false,
    resumeDelay: 5000
  }

  // 用户跳转状态管理
  private userSeekTaskId: string | null = null
  private currentIntents: Intent[] = []

  // 定时器管理
  private scheduledActions = new Map<
    number,
    {
      taskId?: string // ClockScheduler 任务ID
      action: 'play' | 'pause' | 'seek'
      params?: any
      reason: string
    }
  >()
  private nextActionId = 1

  // 资源管理
  private disposers: Array<() => void> = []

  constructor(context: Partial<PlaybackContext>, config: PlayerOrchestratorConfig = {}) {
    // 通过 currentTime 计算出初始的字幕索引
    const activeCueIndex = SubtitleIndexCalculator.computeInitialCueIndex(
      context.currentTime || 0,
      context.subtitles || []
    )
    this.context = { ...this.context, ...context, activeCueIndex }
    this.config = {
      clockThrottleMs: 50,
      enableDebugLogs: false,
      enableIntentLogs: false,
      ...config
    }

    // 初始化核心组件
    this.mediaClock = new MediaClock({
      currentTime: this.context.currentTime,
      duration: this.context.duration,
      paused: this.context.paused,
      playbackRate: this.context.playbackRate,
      seeking: false
    })
    this.clockScheduler = new ClockScheduler(this.mediaClock)
    this.strategyManager = new IntentStrategyManager()
    this.subtitleLockFSM = createSubtitleLockFSM()

    // 注册内置策略
    this.registerBuiltinStrategies()

    // 监听时钟事件
    this.setupClockListener()

    logger.debug('PlayerOrchestrator initialized', this.config)
  }

  /**
   * 连接视频控制器
   */
  connectVideoController(controller: VideoController): void {
    this.videoController = controller
    logger.debug('Video controller connected')

    // 启动调度器
    this.clockScheduler.start()

    // 初始化播放器的状态
    controller.seek(this.context.currentTime)
    controller.setPlaybackRate(this.context.playbackRate)
    controller.setVolume(this.context.volume)
    logger.debug('ClockScheduler started')
  }

  /**
   * 连接状态更新器
   */
  connectStateUpdater(updater: StateUpdater): void {
    this.stateUpdater = updater

    // 立即同步当前的 activeCueIndex 到 store
    if (updater.setActiveCueIndex) {
      updater.setActiveCueIndex(this.context.activeCueIndex)
    }

    logger.debug('State updater connected')
  }

  /**
   * 获取当前状态更新器
   */
  getStateUpdater(): StateUpdater | null {
    return this.stateUpdater
  }

  /**
   * 更新播放上下文
   */
  updateContext(updates: Partial<PlaybackContext>): void {
    const prevContext = { ...this.context }
    this.context = { ...this.context, ...updates }

    // 同步 activeCueIndex 到 store（如果有变化）
    if (updates.activeCueIndex !== undefined && this.stateUpdater?.setActiveCueIndex) {
      this.stateUpdater.setActiveCueIndex(updates.activeCueIndex)
    }

    if (this.config.enableDebugLogs) {
      const changedFields = Object.keys(updates).filter(
        (key) => prevContext[key as keyof PlaybackContext] !== updates[key as keyof PlaybackContext]
      )
      if (changedFields.length > 0) {
        logger.debug('Context updated', { changedFields, updates, prevContext })
      }
    }
  }

  /**
   * 获取当前上下文（只读）
   */
  getContext(): Readonly<PlaybackContext> {
    return { ...this.context }
  }

  // === 统一命令接口 ===

  /**
   * 请求播放
   */
  async requestPlay(): Promise<void> {
    if (!this.videoController) {
      logger.warn('Video controller not connected, ignoring play request')
      return
    }

    try {
      // 记录播放前的状态
      const wasActuallyPaused = this.videoController.isPaused()
      const wasContextPaused = this.context.paused

      logger.debug('requestPlay initiated', {
        wasActuallyPaused,
        wasContextPaused,
        currentTime: this.context.currentTime
      })

      // 乐观更新内部状态
      if (wasContextPaused) {
        this.updateContext({ paused: false })
      }

      await this.videoController.play()
      logger.debug('Command: requestPlay executed successfully')

      // 延迟验证播放是否真正开始
      setTimeout(() => {
        if (this.videoController?.isPaused()) {
          logger.warn('Video element still paused after play() call, investigating...', {
            contextPaused: this.context.paused,
            videoPaused: this.videoController?.isPaused()
          })

          // 尝试再次播放
          this.videoController?.play().catch((retryError) => {
            logger.error('Retry play() also failed:', { retryError })
            // 回滚乐观更新
            this.updateContext({ paused: true })
          })
        }
      }, 150)
    } catch (error) {
      logger.error('Failed to execute requestPlay:', { error })
      // 回滚乐观更新
      this.updateContext({ paused: true })

      // 尝试强制同步状态
      this.syncPlaybackState()
      // 不重新抛出异常，让调用者能正常处理
    }
  }

  /**
   * 请求暂停
   */
  requestPause(): void {
    if (!this.videoController) {
      logger.warn('Video controller not connected, ignoring pause request')
      return
    }

    try {
      // 记录暂停前的状态
      const wasActuallyPaused = this.videoController.isPaused()
      const wasContextPaused = this.context.paused

      logger.debug('requestPause initiated', {
        wasActuallyPaused,
        wasContextPaused,
        currentTime: this.context.currentTime
      })

      // 乐观更新内部状态
      if (!wasContextPaused) {
        this.updateContext({ paused: true })
      }

      this.videoController.pause()
      logger.debug('Command: requestPause executed successfully')

      // 延迟验证暂停是否真正生效
      setTimeout(() => {
        if (!this.videoController?.isPaused()) {
          logger.warn('Video element still playing after pause() call, investigating...', {
            contextPaused: this.context.paused,
            videoPaused: this.videoController?.isPaused()
          })

          // 尝试再次暂停
          this.videoController?.pause()
          // 强制同步状态
          this.syncPlaybackState()
        }
      }, 50)
    } catch (error) {
      logger.error('Failed to execute requestPause:', { error })
      // 回滚乐观更新
      this.updateContext({ paused: false })

      // 尝试强制同步状态
      this.syncPlaybackState()
    }
  }

  /**
   * 请求切换播放状态
   */
  async requestTogglePlay(): Promise<void> {
    if (!this.videoController) {
      logger.warn('Video controller not connected, ignoring toggle play request')
      return
    }

    // 使用内部上下文状态而非直接查询视频元素，避免状态不同步问题
    const isPaused = this.context.paused

    try {
      if (isPaused) {
        await this.requestPlay()
        // 验证播放操作是否成功
        setTimeout(() => {
          if (this.videoController?.isPaused() && !this.context.paused) {
            logger.warn('Play command failed to take effect, attempting sync')
            this.syncPlaybackState()
          }
        }, 100)
      } else {
        this.requestPause()
        // 验证暂停操作是否成功
        setTimeout(() => {
          if (!this.videoController?.isPaused() && this.context.paused) {
            logger.warn('Pause command failed to take effect, attempting sync')
            this.syncPlaybackState()
          }
        }, 50)
      }
    } catch (error) {
      logger.error('Failed to toggle play state:', { error, isPaused })
      // 尝试强制同步状态
      this.syncPlaybackState()
      // 不重新抛出异常，让调用者能正常处理
    }
  }

  /**
   * 请求跳转到指定时间
   */
  requestSeek(to: number): void {
    if (!this.videoController) {
      logger.warn('Video controller not connected, ignoring seek request')
      return
    }

    const clampedTime = Math.max(0, Math.min(this.context.duration || Infinity, to))
    this.videoController.seek(clampedTime)
    logger.debug('Command: requestSeek executed', { to, clampedTime })
  }

  /**
   * 请求用户手动跳转（来自进度条拖拽/点击）
   */
  requestUserSeek(to: number): void {
    if (!this.videoController) {
      logger.warn('Video controller not connected, ignoring user seek request')
      return
    }

    // 清理之前的定时器
    if (this.userSeekTaskId) {
      this.clockScheduler.cancel(this.userSeekTaskId)
      this.userSeekTaskId = null
    }

    // 重置播放器状态（清理意图、重置字幕锁定、重载策略）
    this.resetOnUserSeek()

    // 标记用户跳转状态，暂时禁用自动保存
    import('@renderer/services/PlayerSettingsSaver').then(
      ({ playerSettingsPersistenceService }) => {
        playerSettingsPersistenceService.markUserSeeking()
      }
    )

    // 立即更新 store 中的 currentTime，确保 UI 组件能立即响应
    if (this.stateUpdater) {
      this.stateUpdater.setCurrentTime(to)
    }

    // 执行跳转
    const clampedTime = Math.max(0, Math.min(this.context.duration || Infinity, to))
    this.videoController.seek(clampedTime)

    // 恢复正常状态
    this.userSeekTaskId = null

    logger.debug('Command: requestUserSeek executed', { to, clampedTime })
  }

  /**
   * 请求用户手动跳转（来自字幕列表的点击）
   */
  requestUserSeekBySubtitleIndex(index: number): void {
    if (!this.videoController) {
      logger.warn('Video controller not connected, ignoring user seek request')
      return
    }

    const cue = this.context.subtitles[index]
    if (!cue) {
      logger.warn('Invalid subtitle index, ignoring user seek request', { index })
      return
    }

    // 清理之前的定时器
    if (this.userSeekTaskId) {
      this.clockScheduler.cancel(this.userSeekTaskId)
      this.userSeekTaskId = null
    }

    // 重置播放器状态（清理意图、重置字幕锁定、重载策略）
    this.resetOnUserSeek()

    // 立即锁定字幕状态机，防止 SubtitleSyncStrategy 在 updateContext 时覆盖用户选择
    this.subtitleLockFSM.lock('user_seek', index)

    this.updateContext({ currentTime: cue.startTime, activeCueIndex: index })

    // 设置定时器，2秒后自动解锁，允许自动同步策略重新生效
    this.userSeekTaskId = this.clockScheduler.scheduleAfter(
      2000, // 2秒延迟
      () => {
        this.subtitleLockFSM.unlock('user_seek')
        this.userSeekTaskId = null
        logger.debug('用户跳转锁定已自动解除')
      },
      'user_seek_unlock'
    )
    // 标记用户跳转状态，暂时禁用自动保存
    import('@renderer/services/PlayerSettingsSaver').then(
      ({ playerSettingsPersistenceService }) => {
        playerSettingsPersistenceService.markUserSeeking()
      }
    )

    // 立即更新 store 中的 currentTime，确保字幕 overlay 能立即响应
    if (this.stateUpdater) {
      this.stateUpdater.setCurrentTime(cue.startTime)
    }

    // 执行跳转
    const clampedTime = Math.max(0, Math.min(this.context.duration || Infinity, cue.startTime))
    this.videoController.seek(clampedTime)

    // 恢复正常状态
    this.userSeekTaskId = null

    logger.debug('requestUserSeekBySubtitleIndex executed', { index, clampedTime })
  }

  /**
   * 请求相对跳转
   */
  requestSeekBy(delta: number): void {
    if (!this.videoController) {
      logger.warn('Video controller not connected, ignoring seek by request')
      return
    }

    const currentTime = this.videoController.getCurrentTime()
    const targetTime = currentTime + delta
    this.requestSeek(targetTime)
    logger.debug('Command: requestSeekBy executed', { delta, from: currentTime, to: targetTime })
  }

  /**
   * 请求设置播放速度 - 分离副作用和状态提交
   */
  requestSetPlaybackRate(rate: number): void {
    if (!this.videoController) {
      logger.warn('Video controller not connected, ignoring playback rate request')
      return
    }

    const clampedRate = Math.max(0.25, Math.min(4, rate))

    // 副作用：视频控制器调用
    this.videoController.setPlaybackRate(clampedRate)

    // 状态提交：外部状态同步
    this.stateUpdater?.setPlaybackRate(clampedRate)

    logger.debug('Command: requestSetPlaybackRate executed', { rate, clampedRate })
  }

  /**
   * 请求设置音量 - 分离副作用和状态提交
   */
  requestSetVolume(volume: number): void {
    if (!this.videoController) {
      logger.warn('Video controller not connected, ignoring volume request')
      return
    }

    const clampedVolume = Math.max(0, Math.min(1, volume))

    // 副作用：视频控制器调用
    this.videoController.setVolume(clampedVolume)

    // 状态提交：外部状态同步
    this.stateUpdater?.setVolume(clampedVolume)

    logger.debug('Command: requestSetVolume executed', { volume, clampedVolume })
  }

  /**
   * 请求切换静音状态 - 分离副作用和状态提交
   */
  requestToggleMute(): void {
    if (!this.videoController) {
      logger.warn('Video controller not connected, ignoring mute toggle request')
      return
    }

    const currentlyMuted = this.videoController.isMuted()
    const newMutedState = !currentlyMuted

    // 副作用：视频控制器调用
    this.videoController.setMuted(newMutedState)

    // 状态提交：外部状态同步
    this.stateUpdater?.setMuted(newMutedState)

    logger.debug('Command: requestToggleMute executed', {
      wasMuted: currentlyMuted,
      newMuted: newMutedState
    })
  }

  // === 状态查询接口 ===

  getCurrentVolume(): number {
    return this.videoController?.getVolume() ?? 0
  }

  getActiveSubtitleIndex(): number {
    return SubtitleIndexCalculator.computeActiveCueIndex(
      this.context.currentTime,
      this.context.subtitles
    )
  }

  isMuted(): boolean {
    return this.videoController?.isMuted() ?? false
  }

  isPaused(): boolean {
    return this.videoController?.isPaused() ?? false
  }

  isVideoControllerConnected(): boolean {
    return this.videoController !== null
  }

  // === 媒体事件接口 ===

  onTimeUpdate(currentTime: number): void {
    this.mediaClock.updateTime(currentTime)
    logger.silly('onTimeUpdate', { currentTime })
  }

  onPlay(): void {
    this.mediaClock.setPlaying(true)
  }

  onPause(): void {
    this.mediaClock.setPlaying(false)
  }

  onEnded(): void {
    this.mediaClock.ended()
    this.stateUpdater?.setEnded?.(true)
  }

  onSeeking(): void {
    this.mediaClock.startSeeking()
    this.stateUpdater?.setSeeking?.(true)
  }

  onSeeked(currentTime: number): void {
    this.mediaClock.endSeeking(currentTime)
    this.stateUpdater?.setSeeking?.(false)
  }

  onDurationChange(duration: number): void {
    this.mediaClock.setDuration(duration)
  }

  onPlaybackRateChange(rate: number): void {
    this.mediaClock.setPlaybackRate(rate)
    this.updateContext({ playbackRate: rate })
    this.stateUpdater?.setPlaybackRate(rate)
  }

  // === 策略管理接口 ===

  registerStrategy(strategy: any): void {
    this.strategyManager.registerStrategy(strategy)
  }

  // === 私有方法 ===

  /**
   * 同步播放状态 - 解决内部状态与视频元素状态不一致的问题
   */
  private syncPlaybackState(): void {
    if (!this.videoController) return

    const actualPaused = this.videoController.isPaused()
    const contextPaused = this.context.paused

    if (actualPaused !== contextPaused) {
      logger.warn('Playback state mismatch detected, syncing...', {
        contextPaused,
        actualPaused,
        currentTime: this.context.currentTime
      })

      // 更新内部上下文状态
      this.updateContext({ paused: actualPaused })

      // 同步到外部状态管理器
      this.stateUpdater?.setPlaying(!actualPaused)

      // 同步调度器状态
      if (actualPaused) {
        if (this.clockScheduler.getState() !== 'paused') {
          this.clockScheduler.pause()
          logger.debug('ClockScheduler synced to paused state')
        }
      } else {
        if (this.clockScheduler.getState() !== 'running') {
          this.clockScheduler.resume()
          logger.debug('ClockScheduler synced to running state')
        }
      }

      logger.debug('Playback state synchronized successfully', {
        newState: actualPaused ? 'paused' : 'playing'
      })
    }
  }

  /**
   * 重置播放器状态（用户主动跳转时）
   * 清理未发布的意图、重置字幕锁定状态、重载所有策略
   */
  private resetOnUserSeek(): void {
    // 清理未发布的意图
    if (this.currentIntents.length > 0) {
      logger.debug(`清理 ${this.currentIntents.length} 个未发布的意图`)
      this.currentIntents = []
    }

    // 重置字幕锁定状态
    this.subtitleLockFSM.reset()

    // 收集当前策略用于重载
    const currentStrategies = [
      new SubtitleSyncStrategy(),
      new LoopStrategy(),
      new AutoPauseStrategy()
    ]

    // 重载策略管理器
    this.strategyManager.reload(currentStrategies)

    logger.debug('用户跳转，播放器状态重置完成')
  }

  private registerBuiltinStrategies(): void {
    this.strategyManager.registerStrategy(new SubtitleSyncStrategy())
    this.strategyManager.registerStrategy(new LoopStrategy())
    this.strategyManager.registerStrategy(new AutoPauseStrategy())
  }

  private setupClockListener(): void {
    // 在 dev 环境暴露增强的调试接口
    if (import.meta?.env?.DEV) {
      ;(window as any).__engine = {
        // 基本追踪查询
        lastTrace: () => this._traceBuf.at(-1),
        traces: (n = 20) => this._traceBuf.slice(-n),
        getFSM: () => this.subtitleLockFSM.getState(),
        getCtx: () => this.getContext(),

        // 增强的性能分析
        getPerformanceStats: (n = 50) => {
          const recent = this._traceBuf.slice(-n)
          if (recent.length === 0) return null

          const stats = {
            samples: recent.length,
            totalTime: {
              avg: recent.reduce((sum, r) => sum + r.performance.total, 0) / recent.length,
              max: Math.max(...recent.map((r) => r.performance.total)),
              min: Math.min(...recent.map((r) => r.performance.total))
            },
            phases: {
              updateFacts:
                recent.reduce((sum, r) => sum + r.performance.updateFacts, 0) / recent.length,
              collect: recent.reduce((sum, r) => sum + r.performance.collect, 0) / recent.length,
              reduce: recent.reduce((sum, r) => sum + r.performance.reduce, 0) / recent.length,
              plan: recent.reduce((sum, r) => sum + r.performance.plan, 0) / recent.length,
              execute: recent.reduce((sum, r) => sum + r.performance.execute, 0) / recent.length,
              commit: recent.reduce((sum, r) => sum + r.performance.commit, 0) / recent.length
            },
            errorRate: recent.filter((r) => r.meta.hasErrors).length / recent.length
          }
          return stats
        },

        // Effect 执行统计
        getEffectStats: (n = 50) => {
          const recent = this._traceBuf.slice(-n)
          const effectResults = recent.flatMap((r) => r.executeResult.effectResults || [])

          if (effectResults.length === 0) return null

          const byType = effectResults.reduce(
            (acc, result) => {
              if (!acc[result.type]) {
                acc[result.type] = { count: 0, successCount: 0, totalTime: 0 }
              }
              acc[result.type].count++
              if (result.success) acc[result.type].successCount++
              acc[result.type].totalTime += result.executionTimeMs
              return acc
            },
            {} as Record<string, { count: number; successCount: number; totalTime: number }>
          )

          return Object.entries(byType).map(([type, stats]) => ({
            type,
            count: stats.count,
            successRate: stats.successCount / stats.count,
            avgExecutionTime: stats.totalTime / stats.count
          }))
        },

        // 查找问题追踪
        findProblematicTraces: (n = 100) => {
          const recent = this._traceBuf.slice(-n)
          return recent.filter(
            (r) =>
              r.meta.hasErrors ||
              r.performance.total > 10 ||
              r.executeResult.effectsExecuted !== r.effects.length
          )
        }
      }
    }
    const unsubscribe = this.mediaClock.subscribe((event: MediaClockEvent) => {
      this.handleClockEvent(event)
    })
    this.disposers.push(unsubscribe)
  }

  /**
   * 处理时钟事件 - Intent 系统核心流程
   */
  private _traceBuf: TraceRecord[] = []
  private _nextTraceId = 0
  private _nextEffectId = 0

  private handleClockEvent(event: MediaClockEvent): void {
    const traceId = ++this._nextTraceId
    const traceStartTime = performance.now()
    const phaseMetrics: PhasePerformanceMetrics = {
      updateFacts: 0,
      collect: 0,
      reduce: 0,
      plan: 0,
      execute: 0,
      commit: 0,
      total: 0
    }

    // === 标准 6 阶段数据流处理（带性能统计） ===

    // 阶段1: updateFacts - 更新系统事实状态
    let phaseStart = performance.now()
    this.updateFacts(event)
    phaseMetrics.updateFacts = performance.now() - phaseStart

    // 阶段2: collect - 收集策略意图
    phaseStart = performance.now()
    const intents = this.collect()
    phaseMetrics.collect = performance.now() - phaseStart

    // 阶段3: reduce - 领域归约处理
    phaseStart = performance.now()
    const resolution = this.reduce(intents)
    phaseMetrics.reduce = performance.now() - phaseStart

    // 阶段4: plan - 制定执行计划
    phaseStart = performance.now()
    const plan = this.plan(resolution)
    phaseMetrics.plan = performance.now() - phaseStart

    // 阶段5: execute - 执行副作用（外部IO操作）
    phaseStart = performance.now()
    const executeResult = this.execute(plan)
    phaseMetrics.execute = performance.now() - phaseStart

    // 阶段6: commit - 提交状态变更（内部状态修改）
    phaseStart = performance.now()
    const commitResult = this.commit(plan)
    phaseMetrics.commit = performance.now() - phaseStart

    phaseMetrics.total = performance.now() - traceStartTime

    // === 增强的追踪和记录 ===
    this.recordEnhancedTrace(
      traceId,
      event,
      intents,
      resolution,
      plan,
      executeResult,
      commitResult,
      phaseMetrics
    )

    // 清理当前意图状态
    this.currentIntents = []
  }

  /**
   * 阶段1: updateFacts - 更新系统事实状态
   * 职责：从时钟事件更新播放器事实状态，包括时间、暂停状态等
   * 纯度：有副作用（更新内部状态和外部状态）
   */
  private updateFacts(event: MediaClockEvent): void {
    // 更新内部播放上下文
    this.updateContext({
      currentTime: event.currentTime,
      duration: event.duration,
      paused: event.paused,
      playbackRate: event.playbackRate
    })

    // 同步到外部状态管理器
    this.stateUpdater?.setCurrentTime(event.currentTime)
    this.stateUpdater?.setDuration(event.duration)
    this.stateUpdater?.setPlaying(!event.paused)
  }

  /**
   * 阶段2: collect - 收集策略意图
   * 职责：从所有注册策略收集当前上下文下的意图
   * 纯度：纯函数（基于当前上下文计算意图）
   */
  private collect(): Intent[] {
    const intents = this.strategyManager.collectIntents(this.context)

    // 记录收集到的意图（用于调试）
    if (this.config.enableIntentLogs && intents.length > 0) {
      logger.debug('阶段2-收集意图', {
        count: intents.length,
        domains: [...new Set(intents.map((i) => i.domain))],
        intents: intents.map((i) => ({
          domain: i.domain,
          priority: i.priority,
          reason: i.reason
        }))
      })
    }

    // 暂存到实例变量以供 trace 使用
    this.currentIntents = intents
    return intents
  }

  /**
   * 阶段3: reduce - 领域归约处理
   * 职责：按领域对收集到的意图进行归约，解决冲突并产生最终决策
   * 纯度：纯函数（基于意图和上下文计算归约结果）
   */
  private reduce(intents: Intent[]): ResolutionByDomain {
    const resolution = reduceIntentsByDomain(intents, this.context)

    if (this.config.enableDebugLogs && Object.keys(resolution).length > 0) {
      logger.debug('阶段3-领域归约结果', { resolution })
    }

    return resolution
  }

  /**
   * 阶段4: plan - 制定执行计划
   * 职责：根据归约结果制定具体的执行计划，包括副作用和状态变更
   * 纯度：纯函数（基于归约结果计算执行计划）
   */
  private plan(resolution: ResolutionByDomain): ExecutionPlan {
    const effects: Effect[] = []

    // 规划传输控制副作用
    if (resolution.transport?.op === 'pause') {
      effects.push({
        type: 'pause',
        reason: resolution.transport.reason,
        source: 'transport-domain',
        executionId: this.generateEffectId()
      })
    }
    if (resolution.transport?.op === 'play') {
      effects.push({
        type: 'play',
        reason: resolution.transport.reason,
        source: 'transport-domain',
        executionId: this.generateEffectId()
      })
    }

    // 规划跳转副作用
    if (resolution.seek) {
      effects.push({
        type: 'seek',
        payload: resolution.seek,
        reason: resolution.seek.reason,
        source: 'seek-domain',
        executionId: this.generateEffectId()
      })
    }

    // 规划调度副作用
    if (resolution.schedule?.length) {
      for (const schedule of resolution.schedule) {
        effects.push({
          type: 'schedule',
          payload: schedule,
          reason: 'scheduled-action',
          source: 'schedule-domain',
          executionId: this.generateEffectId()
        })
      }
    }

    // 规划状态变更
    const stateChanges = this.calculateStateChanges(resolution)

    return {
      effects,
      stateChanges
    }
  }

  /**
   * 阶段5: execute - 执行副作用
   * 职责：执行所有外部系统交互副作用，不修改内部状态
   * 纯度：有副作用（外部IO调用），无状态修改
   */
  private execute(plan: ExecutionPlan): {
    effectsExecuted: number
    effectResults?: EffectExecutionResult[]
    errors?: Array<{ error: any }>
  } {
    const result = {
      effectsExecuted: 0,
      effectResults: [] as EffectExecutionResult[],
      errors: [] as Array<{ error: any }>
    }

    // 执行副作用（纯IO操作，不碰状态）
    for (const effect of plan.effects) {
      const effectStart = performance.now()
      const effectResult: EffectExecutionResult = {
        effectId: effect.executionId || 'unknown',
        type: effect.type,
        source: effect.source,
        success: false,
        executionTimeMs: 0,
        timestamp: Date.now()
      }

      try {
        switch (effect.type) {
          case 'pause':
            // 纯副作用：调用视频控制器
            this.videoController?.pause()
            break
          case 'play':
            // 纯副作用：调用视频控制器
            this.videoController?.play()
            break
          case 'seek':
            // 纯副作用：执行跳转
            this.videoController?.seek(effect.payload.to)
            if (effect.payload.followUpPlay) {
              // 纯副作用：调度延迟播放
              this.clockScheduler.scheduleAfter(
                80,
                () => this.videoController?.play(),
                'followUpPlay after seek'
              )
            }
            break
          case 'schedule':
            // 纯副作用：调度延迟动作
            this.scheduleDelayedAction({
              action: effect.payload.action,
              delay: effect.payload.delayMs,
              params: effect.payload.params,
              reason: effect.reason || 'scheduled-by-reducer'
            })
            break
        }

        effectResult.success = true
        result.effectsExecuted++
      } catch (error) {
        effectResult.success = false
        effectResult.error = error as Error
        result.errors.push({ error })
        logger.error('阶段5-执行副作用失败:', { error, effect })
      }

      effectResult.executionTimeMs = performance.now() - effectStart
      result.effectResults.push(effectResult)
    }

    return result
  }

  /**
   * calculateStateChanges - 计算状态变更计划
   * 职责：根据 resolution 计算需要的状态变更
   * 纯度：纯函数，输入输出可预测
   */
  private calculateStateChanges(resolution: ResolutionByDomain): StateChanges {
    const changes: StateChanges = {
      contextUpdates: {},
      externalStateUpdates: {},
      fsmActions: [],
      debugInfo: {}
    }

    // 处理字幕相关状态
    if (resolution.subtitle) {
      // FSM 动作
      if (resolution.subtitle.lockState === 'lock') {
        changes.fsmActions!.push({
          type: 'lock',
          owner: resolution.subtitle.owner || 'unknown',
          index: resolution.subtitle.index
        })
      }
      if (resolution.subtitle.lockState === 'unlock') {
        changes.fsmActions!.push({
          type: 'unlock',
          owner: resolution.subtitle.owner || 'unknown'
        })
      }

      // 字幕索引处理
      if (resolution.subtitle.index !== undefined) {
        const before = this.context.activeCueIndex
        changes.contextUpdates!.subtitleIndexRequest = {
          before,
          requested: resolution.subtitle.index,
          winnerMeta: resolution.subtitle.winnerMeta
        }
      }
    }

    // 处理循环相关状态
    if (resolution.loop?.remaining !== undefined) {
      changes.externalStateUpdates!.loopRemaining = resolution.loop.remaining
      changes.contextUpdates!.loopRemainingCount = resolution.loop.remaining
    }

    // 处理UI状态更新
    if (resolution.ui?.updates) {
      changes.externalStateUpdates!.uiUpdates = resolution.ui.updates
    }

    return changes
  }

  /**
   * 阶段6: commit - 提交状态变更
   * 职责：执行所有状态修改操作，包括FSM状态、内部上下文、外部状态
   * 纯度：有状态修改，无外部副作用
   */
  private commit(plan: ExecutionPlan): {
    appliedSubtitleIndex?: { from: number; to: number; winnerMeta?: any; fsm: any }
  } {
    const result: {
      appliedSubtitleIndex?: { from: number; to: number; winnerMeta?: any; fsm: any }
    } = {}

    // 1. 执行 FSM 状态变更
    if (plan.stateChanges.fsmActions) {
      for (const action of plan.stateChanges.fsmActions) {
        switch (action.type) {
          case 'lock':
            this.subtitleLockFSM.lock(action.owner, action.index)
            break
          case 'unlock':
            this.subtitleLockFSM.unlock(action.owner)
            break
        }
      }
    }

    // 2. 处理字幕索引请求（现在 FSM 状态已更新）
    if (plan.stateChanges.contextUpdates?.subtitleIndexRequest) {
      const req = plan.stateChanges.contextUpdates.subtitleIndexRequest
      const applied = this.subtitleLockFSM.suggestIndex(req.requested)

      if (applied !== undefined && applied !== req.before) {
        // 更新内部上下文
        this.updateContext({ activeCueIndex: applied })

        result.appliedSubtitleIndex = {
          from: req.before,
          to: applied,
          winnerMeta: req.winnerMeta,
          fsm: this.subtitleLockFSM.getState()
        }

        if (this.config.enableDebugLogs) {
          logger.debug('阶段6-应用字幕索引', result.appliedSubtitleIndex)
        }
      }

      // 清理临时字段
      delete plan.stateChanges.contextUpdates.subtitleIndexRequest
    }

    // 3. 提交其他上下文更新
    if (
      plan.stateChanges.contextUpdates &&
      Object.keys(plan.stateChanges.contextUpdates).length > 0
    ) {
      this.updateContext(plan.stateChanges.contextUpdates)
    }

    // 4. 提交外部状态更新
    if (plan.stateChanges.externalStateUpdates?.loopRemaining !== undefined) {
      this.stateUpdater?.updateLoopRemaining(plan.stateChanges.externalStateUpdates.loopRemaining)

      if (this.config.enableDebugLogs) {
        logger.debug('阶段6-更新循环剩余计数', {
          remaining: plan.stateChanges.externalStateUpdates.loopRemaining
        })
      }
    }

    // 处理UI状态更新
    if (plan.stateChanges.externalStateUpdates?.uiUpdates) {
      this.stateUpdater?.updateUIState(plan.stateChanges.externalStateUpdates.uiUpdates)
      if (this.config.enableDebugLogs) {
        logger.debug('阶段6-更新UI状态', {
          updates: plan.stateChanges.externalStateUpdates.uiUpdates
        })
      }
    }

    return result
  }

  /**
   * 记录增强的追踪信息 - 带性能指标和源头追踪
   */
  private recordEnhancedTrace(
    traceId: number,
    event: MediaClockEvent,
    intents: Intent[],
    resolution: ResolutionByDomain,
    plan: ExecutionPlan,
    executeResult: {
      effectsExecuted: number
      effectResults?: EffectExecutionResult[]
      errors?: Array<{ error: any }>
    },
    commitResult: { appliedSubtitleIndex?: any },
    performance: PhasePerformanceMetrics
  ): void {
    const traceRecord: TraceRecord = {
      traceId,
      timestamp: Date.now(),
      event,
      intents,
      resolution,
      effects: plan.effects,
      stateChanges: plan.stateChanges,
      executeResult,
      commitResult,
      performance,
      meta: {
        intentCount: intents.length,
        effectCount: plan.effects.length,
        hasErrors: (executeResult.errors?.length || 0) > 0,
        hasSubtitleChange: !!commitResult.appliedSubtitleIndex
      }
    }

    // 存储追踪记录（最多 200 条）
    this._traceBuf.push(traceRecord)
    if (this._traceBuf.length > 200) this._traceBuf.shift()

    // 根据配置输出日志
    if (this.config.enableDebugLogs) {
      this.logTraceRecord(traceRecord)
    }

    // 性能预警（单个 cycle 超过 10ms）
    if (performance.total > 10) {
      logger.warn(`[T${traceId}] 性能预警: 单次 cycle 耗时 ${performance.total.toFixed(2)}ms`, {
        phases: performance,
        intentCount: intents.length,
        effectCount: plan.effects.length
      })
    }
  }

  /**
   * 输出精简的追踪日志
   */
  private logTraceRecord(record: TraceRecord): void {
    const { traceId, event, meta, performance, executeResult } = record

    logger.debug(`[T${traceId}] 6阶段数据流`, {
      type: event.type,
      time: event.currentTime.toFixed(3),
      intents: meta.intentCount,
      effects: meta.effectCount,
      executed: executeResult.effectsExecuted,
      errors: executeResult.errors?.length || 0,
      // subtitle: meta.hasSubtitleChange,
      totalMs: performance.total.toFixed(2),
      phases: `${performance.updateFacts.toFixed(1)}|${performance.collect.toFixed(1)}|${performance.reduce.toFixed(1)}|${performance.plan.toFixed(1)}|${performance.execute.toFixed(1)}|${performance.commit.toFixed(1)}`
    })

    // 详细 Effect 执行结果（只在有 Effect 时输出）
    if (executeResult.effectResults && executeResult.effectResults.length > 0) {
      for (const result of executeResult.effectResults) {
        if (result.success) {
          logger.debug(`[T${traceId}] Effect 执行成功`, {
            id: result.effectId,
            type: result.type,
            source: result.source,
            timeMs: result.executionTimeMs.toFixed(2)
          })
        } else {
          logger.error(`[T${traceId}] Effect 执行失败`, {
            id: result.effectId,
            type: result.type,
            source: result.source,
            error: result.error?.message,
            timeMs: result.executionTimeMs.toFixed(2)
          })
        }
      }
    }
  }

  /**
   * 生成唯一的 Effect ID
   */
  private generateEffectId(): string {
    return `effect_${++this._nextEffectId}_${Date.now()}`
  }

  private scheduleDelayedAction(action: {
    delay: number
    action: 'play' | 'pause' | 'seek'
    params?: any
    reason: string
  }): void {
    const actionId = this.nextActionId++

    // 使用 ClockScheduler 替换 setTimeout
    const taskId = this.clockScheduler.scheduleAfter(
      action.delay,
      () => {
        this.executeScheduledAction(actionId, action)
      },
      `${action.action} - ${action.reason}`
    )

    this.scheduledActions.set(actionId, {
      taskId, // 保存 ClockScheduler 任务ID
      action: action.action,
      params: action.params,
      reason: action.reason
    })

    logger.debug(`安排延迟动作 ${action.action}`, {
      delay: action.delay,
      reason: action.reason,
      actionId,
      taskId
    })
  }

  /**
   * 执行调度动作 - 纯副作用执行
   * 职责：处理延迟动作的IO操作
   */
  private executeScheduledAction(
    actionId: number,
    action: { action: 'play' | 'pause' | 'seek'; params?: any; reason: string }
  ): void {
    const scheduled = this.scheduledActions.get(actionId)
    if (!scheduled) return

    try {
      // 纯副作用：执行具体的IO操作
      switch (action.action) {
        case 'play':
          this.videoController?.play()
          break
        case 'pause':
          this.videoController?.pause()
          break
        case 'seek':
          if (action.params?.to !== undefined) {
            this.videoController?.seek(action.params.to)
            if (action.params.followUpPlay) {
              // 纯副作用：调度后续动作
              this.clockScheduler.scheduleAfter(
                100,
                () => {
                  this.videoController?.play()
                  logger.debug('跳转后自动继续播放')
                },
                'followUpPlay after scheduled seek'
              )
            }
          }
          break
      }

      logger.debug(`执行延迟副作用 ${action.action}`, { reason: action.reason, actionId })
    } catch (error) {
      logger.error(`执行延迟副作用失败:`, { error, actionId, action })
    } finally {
      // 状态管理：清理已完成的动作
      this.scheduledActions.delete(actionId)
    }
  }

  private clearScheduledActions(): void {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for (const [_actionId, scheduled] of this.scheduledActions) {
      // 取消 ClockScheduler 中的任务
      if (scheduled.taskId) {
        this.clockScheduler.cancel(scheduled.taskId)
      }
    }
    this.scheduledActions.clear()
    logger.debug('清空所有定时动作')
  }

  // === 资源清理 ===

  dispose(): void {
    logger.debug('销毁 PlayerOrchestratorV2')

    // 清理定时器
    this.clearScheduledActions()
    if (this.userSeekTaskId) {
      this.clockScheduler.cancel(this.userSeekTaskId)
      this.userSeekTaskId = null
    }

    // 清理字幕锁定状态
    this.subtitleLockFSM.reset()

    // 清理监听器
    this.disposers.forEach((dispose) => dispose())
    this.disposers.length = 0

    // 清理核心组件
    this.clockScheduler.dispose()
    this.mediaClock.dispose()
    this.strategyManager.dispose()

    // 断开连接
    this.videoController = null
    this.stateUpdater = null
  }
}
