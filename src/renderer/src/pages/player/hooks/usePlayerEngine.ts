import { loggerService } from '@logger'
import { usePlayerStore } from '@renderer/state/stores/player.store'
import { usePlayerSubtitlesStore } from '@renderer/state/stores/player-subtitles.store'
import { useCallback, useEffect, useRef } from 'react'

import { PlayerOrchestrator, StateUpdater, VideoController } from '../engine'
import { PlaybackContext } from '../engine/intent'

const logger = loggerService.withContext('usePlayerEngine')

// 全局单例 PlayerOrchestrator 实例
let globalOrchestrator: PlayerOrchestrator | null = null
let globalStateUpdater: StateUpdater | null = null

/**
 * 获取或创建全局 PlayerOrchestrator 实例
 */
function getOrCreateGlobalOrchestrator(context: Partial<PlaybackContext>): PlayerOrchestrator {
  if (!globalOrchestrator) {
    globalOrchestrator = new PlayerOrchestrator(context, {
      enableDebugLogs: process.env.NODE_ENV === 'development'
    })
    logger.debug('Global PlayerOrchestrator created')
  }
  return globalOrchestrator
}

/**
 * 获取或创建全局状态更新器
 */
function getOrCreateGlobalStateUpdater(): StateUpdater {
  if (!globalStateUpdater) {
    globalStateUpdater = {
      setCurrentTime: (time: number) => {
        usePlayerStore.getState().setCurrentTime(time)
      },
      setDuration: (dur: number) => usePlayerStore.getState().setDuration(dur),
      setPlaying: (playing: boolean) => {
        if (playing) usePlayerStore.getState().play()
        else usePlayerStore.getState().pause()
      },
      updateLoopRemaining: (count: number) => {
        usePlayerStore.setState((s) => ({ ...s, loopRemainingCount: count }))
      },
      // 新增播放控制状态同步
      setPlaybackRate: (rate: number) => usePlayerStore.getState().setPlaybackRate(rate),
      setVolume: (volume: number) => usePlayerStore.getState().setVolume(volume),
      setMuted: (muted: boolean) => usePlayerStore.getState().setMuted(muted),
      // 新增媒体状态同步
      setSeeking: (seeking: boolean) => {
        usePlayerStore.getState().setVideoSeeking(seeking)
        logger.debug('Seeking state updated:', { seeking })
      },
      setWaiting: (waiting: boolean) => {
        usePlayerStore.getState().setVideoWaiting(waiting)
        logger.debug('Waiting state updated:', { waiting })
      },
      setEnded: (ended: boolean) => {
        // TODO: 如果需要，可以在 player store 中添加 ended 状态
        logger.debug('Ended state updated:', { ended })
      },
      setActiveCueIndex: (index: number) => {
        usePlayerStore.getState().setActiveCueIndex(index)
        logger.debug('Active cue index updated:', { index })
      },
      // UI状态更新处理
      updateUIState: (updates: { openAutoResumeCountdown?: boolean }) => {
        logger.debug('Processing UI state updates:', { updates })

        // 处理自动恢复倒计时相关更新
        if (updates.openAutoResumeCountdown) {
          usePlayerStore.getState().openAutoResumeCountdown()
        }
      }
    }
    logger.debug('Global StateUpdater created')
  }
  return globalStateUpdater
}

/**
 * 清理全局 orchestrator（应用退出时调用）
 */
export function disposeGlobalOrchestrator(): void {
  if (globalOrchestrator) {
    globalOrchestrator.dispose()
    globalOrchestrator = null
    globalStateUpdater = null
    logger.debug('Global PlayerOrchestrator disposed')
  }
}

/**
 * 播放器引擎Hook
 * 使用全局单例 PlayerOrchestrator 实例避免重复初始化
 */
export function usePlayerEngine() {
  const videoElementRef = useRef<HTMLVideoElement | null>(null)

  // Store selectors - 使用单字段选择器避免重渲染
  const currentTime = usePlayerStore((s) => s.currentTime)
  const duration = usePlayerStore((s) => s.duration)
  const paused = usePlayerStore((s) => s.paused)
  const playbackRate = usePlayerStore((s) => s.playbackRate)
  const volume = usePlayerStore((s) => s.volume)

  // 循环设置
  const loopEnabled = usePlayerStore((s) => s.loopEnabled)
  const loopMode = usePlayerStore((s) => s.loopMode)
  const loopCount = usePlayerStore((s) => s.loopCount)
  const loopRemainingCount = usePlayerStore((s) => s.loopRemainingCount)

  // 自动暂停设置
  const autoPauseEnabled = usePlayerStore((s) => s.autoPauseEnabled)
  const pauseOnSubtitleEnd = usePlayerStore((s) => s.pauseOnSubtitleEnd)
  const resumeEnabled = usePlayerStore((s) => s.resumeEnabled)
  const resumeDelay = usePlayerStore((s) => s.resumeDelay)

  // 字幕数据
  const subtitles = usePlayerSubtitlesStore((s) => s.subtitles)

  // 构建上下文
  const context = {
    currentTime,
    duration,
    paused,
    volume,
    playbackRate,
    subtitles,
    loopEnabled,
    loopMode,
    loopCount,
    loopRemainingCount,
    autoPauseEnabled,
    pauseOnSubtitleEnd,
    resumeEnabled,
    resumeDelay
  }

  // 获取全局单例 orchestrator 和 stateUpdater
  const orchestrator = getOrCreateGlobalOrchestrator(context)
  const stateUpdater = getOrCreateGlobalStateUpdater()

  // 确保状态更新器已连接（只连接一次）
  useEffect(() => {
    if (!orchestrator.getStateUpdater()) {
      orchestrator.connectStateUpdater(stateUpdater)
      logger.debug('Global StateUpdater connected to orchestrator')
    }
  }, [orchestrator, stateUpdater])

  // 同步播放上下文到编排器
  useEffect(() => {
    orchestrator.updateContext({
      currentTime,
      duration,
      paused,
      playbackRate,
      volume,
      subtitles,
      loopEnabled,
      loopMode,
      loopCount,
      loopRemainingCount,
      autoPauseEnabled,
      pauseOnSubtitleEnd,
      resumeEnabled,
      resumeDelay
    })
  }, [
    orchestrator,
    currentTime,
    duration,
    paused,
    playbackRate,
    volume,
    subtitles,
    loopEnabled,
    loopMode,
    loopCount,
    loopRemainingCount,
    autoPauseEnabled,
    pauseOnSubtitleEnd,
    resumeEnabled,
    resumeDelay
  ])

  // 创建视频控制器
  const createVideoController = useCallback((videoElement: HTMLVideoElement): VideoController => {
    return {
      async play(): Promise<void> {
        await videoElement.play()
      },

      pause(): void {
        videoElement.pause()
      },

      seek(time: number): void {
        videoElement.currentTime = time
      },

      setPlaybackRate(rate: number): void {
        videoElement.playbackRate = rate
      },

      setVolume(volume: number): void {
        videoElement.volume = Math.max(0, Math.min(1, volume))
      },

      setMuted(muted: boolean): void {
        videoElement.muted = muted
      },

      getCurrentTime(): number {
        return videoElement.currentTime
      },

      getDuration(): number {
        return videoElement.duration || 0
      },

      isPaused(): boolean {
        return videoElement.paused
      },

      getPlaybackRate(): number {
        return videoElement.playbackRate
      },

      getVolume(): number {
        return videoElement.volume
      },

      isMuted(): boolean {
        return videoElement.muted
      }
    }
  }, [])

  // 连接视频元素
  const connectVideoElement = useCallback(
    (videoElement: HTMLVideoElement) => {
      if (videoElementRef.current === videoElement) return

      videoElementRef.current = videoElement

      // 连接到全局 orchestrator
      const controller = createVideoController(videoElement)
      orchestrator.connectVideoController(controller)

      logger.debug('Video controller connected to global orchestrator', {
        isConnected: orchestrator.isVideoControllerConnected(),
        src: videoElement.src
      })
    },
    [orchestrator, createVideoController]
  )

  // 媒体事件处理器 - 使用全局 orchestrator
  const getMediaEventHandlers = useCallback(() => {
    return {
      onTimeUpdate: (e: Event) => {
        const video = e.target as HTMLVideoElement
        orchestrator.onTimeUpdate(video.currentTime)
      },
      onPlay: () => {
        orchestrator.onPlay()
      },
      onPause: () => {
        orchestrator.onPause()
      },
      onEnded: () => {
        orchestrator.onEnded()
      },
      onSeeking: () => {
        orchestrator.onSeeking()
      },
      onSeeked: (e: Event) => {
        const video = e.target as HTMLVideoElement
        orchestrator.onSeeked(video.currentTime)
      },
      onWaiting: () => {
        orchestrator.onWaiting()
      },
      onCanPlay: () => {
        orchestrator.onCanPlay()
      },
      onDurationChange: (e: Event) => {
        const video = e.target as HTMLVideoElement
        orchestrator.onDurationChange(video.duration)
      },
      onRateChange: (e: Event) => {
        const video = e.target as HTMLVideoElement
        orchestrator.onPlaybackRateChange(video.playbackRate)
      }
    }
  }, [orchestrator])

  return {
    connectVideoElement,
    getMediaEventHandlers,
    orchestrator
  }
}
