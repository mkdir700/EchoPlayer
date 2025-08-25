import { loggerService } from '@logger'
import { usePlayerStore } from '@renderer/state/stores/player.store'
import { usePlayerSubtitlesStore } from '@renderer/state/stores/player-subtitles.store'
import { useCallback } from 'react'

import { usePlayerEngine } from '../../../hooks/usePlayerEngine'

const logger = loggerService.withContext('PlayerCommands')

// 默认步长（后续可迁移到 SettingsStore）
const DEFAULT_SEEK_STEP_SECONDS = 10
const DEFAULT_VOLUME_STEP = 0.05

/**
 * 播放器命令 Hook - 使用编排者引擎
 *
 * 重构说明：
 * - 视频播放控制（播放/暂停、跳转、音量）使用编排者引擎
 * - UI状态控制（全屏、循环开关）继续使用 store
 * - 字幕导航使用编排者引擎进行跳转，使用 store 重置循环状态
 */
export function usePlayerCommands() {
  // 获取编排者引擎
  const { orchestrator } = usePlayerEngine()

  // UI状态控制相关的 store actions（这些不属于视频播放控制）
  const setFullscreen = usePlayerStore((s) => s.setFullscreen)
  const toggleLoopEnabled = usePlayerStore((s) => s.toggleLoopEnabled)
  const resetLoopRemaining = usePlayerStore((s) => s.resetLoopRemaining)

  // 播放 / 暂停
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
      logger.info('Command play_pause executed')
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
      logger.info('Command seekBy executed', { seconds })
    },
    [orchestrator]
  )

  const seekBackwardByStep = useCallback(() => seekBy(-DEFAULT_SEEK_STEP_SECONDS), [seekBy])
  const seekForwardByStep = useCallback(() => seekBy(DEFAULT_SEEK_STEP_SECONDS), [seekBy])

  // 音量
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

      logger.info('Command changeVolumeBy executed', {
        delta,
        from: currentVolume,
        to: newVolume
      })
    },
    [orchestrator]
  )

  const volumeUpByStep = useCallback(() => changeVolumeBy(DEFAULT_VOLUME_STEP), [changeVolumeBy])
  const volumeDownByStep = useCallback(() => changeVolumeBy(-DEFAULT_VOLUME_STEP), [changeVolumeBy])

  // 字幕导航
  const goToPreviousSubtitle = useCallback(() => {
    if (!orchestrator) {
      logger.warn('Orchestrator not available for goToPreviousSubtitle command')
      return
    }

    const { currentTime } = usePlayerStore.getState()
    const { subtitles } = usePlayerSubtitlesStore.getState()
    if (!subtitles || subtitles.length === 0) return

    const EPS = 0.05
    const ordered = [...subtitles]
      .filter((s) => typeof s.startTime === 'number' && typeof s.endTime === 'number')
      .sort((a, b) => a.startTime - b.startTime)

    // 先判断当前是否处于某条字幕内，若是则选择其前一条；否则选择当前时间之前的最后一条
    const currentIdx = ordered.findIndex(
      (s) => s.startTime - EPS <= currentTime && currentTime <= s.endTime + EPS
    )

    let prev: (typeof ordered)[number] | undefined
    if (currentIdx > 0) {
      prev = ordered[currentIdx - 1]
    } else if (currentIdx === -1) {
      const before = ordered.filter((s) => s.startTime < currentTime - EPS)
      prev = before.length ? before[before.length - 1] : undefined
    }

    if (prev) {
      orchestrator.requestSeek(prev.startTime)
      // 用户手动跳转字幕时重置循环计数器
      resetLoopRemaining()
      logger.info('Command previous_subtitle executed', { to: prev.startTime })
    }
  }, [orchestrator, resetLoopRemaining])

  const goToNextSubtitle = useCallback(() => {
    if (!orchestrator) {
      logger.warn('Orchestrator not available for goToNextSubtitle command')
      return
    }

    const { currentTime } = usePlayerStore.getState()
    const { subtitles } = usePlayerSubtitlesStore.getState()
    if (!subtitles || subtitles.length === 0) return

    const next = [...subtitles]
      .filter((s) => typeof s.startTime === 'number' && s.startTime > currentTime + 0.05)
      .sort((a, b) => a.startTime - b.startTime)[0]
    if (next) {
      orchestrator.requestSeek(next.startTime)
      // 用户手动跳转字幕时重置循环计数器
      resetLoopRemaining()
      logger.info('Command next_subtitle executed', { to: next.startTime })
    }
  }, [orchestrator, resetLoopRemaining])

  // 全屏
  const toggleFullscreen = useCallback(() => {
    const { isFullscreen } = usePlayerStore.getState()
    setFullscreen(!isFullscreen)
    logger.info('Command toggle_fullscreen')
  }, [setFullscreen])

  const escapeFullscreen = useCallback(() => {
    const { isFullscreen } = usePlayerStore.getState()
    if (isFullscreen) {
      setFullscreen(false)
      logger.info('Command escape_fullscreen')
    }
  }, [setFullscreen])

  // 单句循环
  const singleLoop = useCallback(() => {
    toggleLoopEnabled()
    logger.info('Command single_loop')
  }, [toggleLoopEnabled])

  return {
    // 基础
    playPause,

    // 跳转
    seekBy,
    seekBackwardByStep,
    seekForwardByStep,

    // 音量
    changeVolumeBy,
    volumeUpByStep,
    volumeDownByStep,

    // 字幕
    goToPreviousSubtitle,
    goToNextSubtitle,

    // 全屏
    toggleFullscreen,
    escapeFullscreen,

    // 循环
    singleLoop
  }
}
