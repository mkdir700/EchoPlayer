import { loggerService } from '@logger'
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
export function usePlayerCommandsOrchestrated() {
  const { orchestrator } = usePlayerEngine()
  const subtitles = usePlayerSubtitlesStore((s) => s.subtitles)

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

    try {
      await orchestrator.requestTogglePlay()
      logger.info('Command: playPause executed')
    } catch (error) {
      logger.error('Failed to execute playPause command:', { error })
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
    const prevIndex = context.activeCueIndex - 1

    if (prevIndex >= 0) {
      const prev = subtitles[prevIndex]
      orchestrator.requestUserSeekBySubtitleIndex(prevIndex)
      logger.info('Command: goToPreviousSubtitle executed', {
        to: prev.startTime,
        index: prevIndex
      })
    }
  }, [orchestrator, subtitles])

  const goToNextSubtitle = useCallback(() => {
    if (!orchestrator || !subtitles || subtitles.length === 0) {
      logger.warn('Prerequisites not available for goToNextSubtitle command')
      return
    }

    const context = orchestrator.getContext()
    const nextSubtitleIndex = context.activeCueIndex + 1

    if (nextSubtitleIndex < subtitles.length) {
      orchestrator.requestUserSeekBySubtitleIndex(nextSubtitleIndex)
      const next = subtitles[nextSubtitleIndex]
      logger.info('Command: goToNextSubtitle executed', {
        to: next.startTime,
        index: nextSubtitleIndex
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

    // 音量控制
    changeVolumeBy,
    volumeUpByStep,
    volumeDownByStep,
    toggleMute,

    // 播放速度
    setPlaybackRate,

    // 字幕导航
    goToPreviousSubtitle,
    goToNextSubtitle
  }
}
