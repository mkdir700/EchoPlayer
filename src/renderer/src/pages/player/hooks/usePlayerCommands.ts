import { loggerService } from '@logger'
import { usePlayerStore } from '@renderer/state'
import { usePlayerSubtitlesStore } from '@renderer/state/stores/player-subtitles.store'
import { useCallback } from 'react'

import { usePlayerEngine } from './usePlayerEngine'

const logger = loggerService.withContext('PlayerCommandsOrchestrated')

// 默认步长（后续可迁移到 SettingsStore）
const DEFAULT_SEEK_STEP_SECONDS = 10
const DEFAULT_VOLUME_STEP = 0.05

/**
 * 基于引擎的播放器命令 Hook
 * 所有命令通过 orchestrator 统一调度，不直接操作 store 或 video 元素
 */
export function usePlayerCommands() {
  const { orchestrator } = usePlayerEngine()
  const subtitles = usePlayerSubtitlesStore((s) => s.subtitles)
  const toggleLoopEnabled = usePlayerStore((s) => s.toggleLoopEnabled)
  const autoPauseEnabled = usePlayerStore((s) => s.autoPauseEnabled)
  const setAutoPauseEnabled = usePlayerStore((s) => s.setAutoPauseEnabled)

  // 播放/暂停
  const playPause = useCallback(async () => {
    if (!orchestrator) {
      logger.warn('Orchestrator not available for playPause command')
      return
    }

    if (!orchestrator.isVideoControllerConnected()) {
      logger.warn('Video controller not connected for playPause command')
      return
    }

    const context = orchestrator.getContext()
    const isCurrentlyPaused = orchestrator.isPaused()

    logger.debug('playPause command initiated', {
      contextPaused: context.paused,
      actuallyPaused: isCurrentlyPaused,
      currentTime: context.currentTime,
      timestamp: Date.now()
    })

    try {
      await orchestrator.requestTogglePlay()
      logger.info('Command: playPause executed successfully')
    } catch (error) {
      logger.error('Failed to execute playPause command:', {
        error,
        contextPaused: context.paused,
        actuallyPaused: isCurrentlyPaused
      })
    }
  }, [orchestrator])

  // 跳转
  const seekBy = useCallback(
    (seconds: number) => {
      if (!orchestrator) {
        logger.warn('Orchestrator not available for seekBy command')
        return
      }

      orchestrator.requestSeekBy(seconds)
      logger.info('Command: seekBy executed', { seconds })
    },
    [orchestrator]
  )

  const seekTo = useCallback(
    (time: number) => {
      if (!orchestrator) {
        logger.warn('Orchestrator not available for seekTo command')
        return
      }

      orchestrator.requestSeek(time)
      logger.info('Command: seekTo executed', { time })
    },
    [orchestrator]
  )

  const seekToUser = useCallback(
    (time: number) => {
      if (!orchestrator) {
        logger.warn('Orchestrator not available for seekToUser command')
        return
      }

      orchestrator.requestUserSeek(time)
      logger.info('Command: seekToUser executed', { time })
    },
    [orchestrator]
  )

  const seekToSubtitle = useCallback(
    (index: number) => {
      if (!orchestrator) {
        logger.warn('Orchestrator not available for seekToSubtitle command')
        return
      }

      orchestrator.requestUserSeekBySubtitleIndex(index)
      logger.info('Command: seekToSubtitle executed', { index })
    },
    [orchestrator]
  )

  const seekBackwardByStep = useCallback(() => seekBy(-DEFAULT_SEEK_STEP_SECONDS), [seekBy])
  const seekForwardByStep = useCallback(() => seekBy(DEFAULT_SEEK_STEP_SECONDS), [seekBy])

  // 音量控制
  const changeVolumeBy = useCallback(
    (delta: number) => {
      if (!orchestrator?.isVideoControllerConnected()) {
        logger.warn('Video controller not available for changeVolumeBy command')
        return
      }

      const currentVolume = orchestrator.getCurrentVolume()
      const newVolume = Math.max(0, Math.min(1, currentVolume + delta))

      orchestrator.requestSetVolume(newVolume)

      // 如果从静音状态调高音量，自动取消静音
      if (newVolume > 0 && orchestrator.isMuted()) {
        orchestrator.requestToggleMute()
      }

      logger.info('Command: changeVolumeBy executed', {
        delta,
        from: currentVolume,
        to: newVolume
      })
    },
    [orchestrator]
  )

  const volumeUpByStep = useCallback(() => changeVolumeBy(DEFAULT_VOLUME_STEP), [changeVolumeBy])
  const volumeDownByStep = useCallback(() => changeVolumeBy(-DEFAULT_VOLUME_STEP), [changeVolumeBy])

  const toggleMute = useCallback(() => {
    if (!orchestrator) {
      logger.warn('Orchestrator not available for toggleMute command')
      return
    }

    orchestrator.requestToggleMute()
    logger.info('Command: toggleMute executed')
  }, [orchestrator])

  const toggleAutoPause = useCallback(() => {
    setAutoPauseEnabled(!autoPauseEnabled)
    logger.info('Command: toggleAutoPause executed', {
      enabled: !autoPauseEnabled
    })
  }, [autoPauseEnabled, setAutoPauseEnabled])

  // 播放速度
  const setPlaybackRate = useCallback(
    (rate: number) => {
      if (!orchestrator) {
        logger.warn('Orchestrator not available for setPlaybackRate command')
        return
      }

      orchestrator.requestSetPlaybackRate(rate)
      logger.info('Command: setPlaybackRate executed', { rate })
    },
    [orchestrator]
  )

  // 字幕导航
  const goToPreviousSubtitle = useCallback(() => {
    if (!orchestrator || !subtitles || subtitles.length === 0) {
      logger.warn('Prerequisites not available for goToPreviousSubtitle command')
      return
    }

    const context = orchestrator.getContext()
    let prevIndex: number

    // 如果当前没有活跃字幕（activeCueIndex为-1），则基于当前时间找到上一个字幕
    if (context.activeCueIndex === -1) {
      // 找到最后一个结束时间小于等于当前时间的字幕
      prevIndex = -1
      for (let i = subtitles.length - 1; i >= 0; i--) {
        if (subtitles[i].endTime <= context.currentTime) {
          prevIndex = i
          break
        }
      }

      // 如果没找到，则不执行跳转
      if (prevIndex === -1) {
        logger.info('Command: goToPreviousSubtitle - no subtitle found before current time', {
          currentTime: context.currentTime
        })
        return
      }
    } else {
      // 正常情况：跳转到上一个字幕
      prevIndex = context.activeCueIndex - 1
    }

    if (prevIndex >= 0) {
      const prev = subtitles[prevIndex]
      orchestrator.requestUserSeekBySubtitleIndex(prevIndex)
      logger.info('Command: goToPreviousSubtitle executed', {
        from: context.activeCueIndex,
        to: prev.startTime,
        index: prevIndex
      })
    } else {
      logger.info('Command: goToPreviousSubtitle - already at first subtitle', {
        currentIndex: context.activeCueIndex
      })
    }
  }, [orchestrator, subtitles])

  const goToNextSubtitle = useCallback(() => {
    if (!orchestrator || !subtitles || subtitles.length === 0) {
      logger.warn('Prerequisites not available for goToNextSubtitle command')
      return
    }

    const context = orchestrator.getContext()
    let nextSubtitleIndex: number

    // 如果当前没有活跃字幕（activeCueIndex为-1），则基于当前时间找到下一个字幕
    if (context.activeCueIndex === -1) {
      // 找到第一个开始时间大于当前时间的字幕
      nextSubtitleIndex = subtitles.findIndex(
        (subtitle) => subtitle.startTime > context.currentTime
      )

      // 如果没找到（说明当前时间已经超过了所有字幕），则不执行跳转
      if (nextSubtitleIndex === -1) {
        logger.info('Command: goToNextSubtitle - no subtitle found after current time', {
          currentTime: context.currentTime
        })
        return
      }
    } else {
      // 正常情况：跳转到下一个字幕
      nextSubtitleIndex = context.activeCueIndex + 1
    }

    if (nextSubtitleIndex < subtitles.length) {
      orchestrator.requestUserSeekBySubtitleIndex(nextSubtitleIndex)
      const next = subtitles[nextSubtitleIndex]
      logger.info('Command: goToNextSubtitle executed', {
        from: context.activeCueIndex,
        to: next.startTime,
        index: nextSubtitleIndex
      })
    } else {
      logger.info('Command: goToNextSubtitle - already at last subtitle', {
        currentIndex: context.activeCueIndex
      })
    }
  }, [orchestrator, subtitles])

  const replayBySubtitle = useCallback(() => {
    if (!orchestrator || !subtitles || subtitles.length === 0) {
      logger.warn('Prerequisites not available for replayBySubtitle command')
      return
    }

    const context = orchestrator.getContext()
    const activeCueIndex = context.activeCueIndex

    if (activeCueIndex >= 0) {
      orchestrator.requestUserSeekBySubtitleIndex(activeCueIndex)
      logger.info('Command: replayBySubtitle executed', {
        to: subtitles[activeCueIndex].startTime,
        index: activeCueIndex
      })
    }
  }, [orchestrator, subtitles])

  return {
    // 基础控制
    playPause,

    // 跳转控制
    seekBy,
    seekTo,
    seekToUser,
    seekToSubtitle,
    seekBackwardByStep,
    seekForwardByStep,
    replayBySubtitle,

    // 音量控制
    changeVolumeBy,
    volumeUpByStep,
    volumeDownByStep,
    toggleMute,

    // 播放速度
    setPlaybackRate,

    // 字幕导航
    goToPreviousSubtitle,
    goToNextSubtitle,

    // 功能控制
    toggleLoopEnabled,
    toggleAutoPause
  }
}
