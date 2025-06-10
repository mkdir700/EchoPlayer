import { useCallback } from 'react'
import { useVideoConfig } from './useVideoConfig'
import { useVideoPlayerContext } from './useVideoPlayerContext'
import { PLAYBACK_RATES } from '../constants'
import { useSelectedPlaybackRates } from '../stores/slices/videoConfigStore'
import { usePlayingVideoContext } from './usePlayingVideoContext'
import type { VideoPlaybackSettings, SubtitleDisplaySettings } from '@types_/shared'

/**
 * Hook for accessing subtitle display mode
 * 获取字幕显示模式的 Hook
 */
export const useSubtitleDisplayMode = (): VideoPlaybackSettings['displayMode'] => {
  const { displayMode } = useVideoConfig()
  return displayMode
}

/**
 * Hook for accessing playback volume
 * 获取播放音量的 Hook
 */
export const usePlaybackVolume = (): VideoPlaybackSettings['volume'] => {
  const { volume } = useVideoConfig()
  return volume
}

/**
 * Hook for accessing playback rate
 * 获取播放速度的 Hook
 */
export const usePlaybackRate = (): VideoPlaybackSettings['playbackRate'] => {
  const { playbackRate } = useVideoConfig()
  return playbackRate
}

/**
 * Hook for accessing single loop state
 * 获取单句循环状态的 Hook
 */
export const useIsSingleLoop = (): VideoPlaybackSettings['isSingleLoop'] => {
  const { isSingleLoop } = useVideoConfig()
  return isSingleLoop
}

/**
 * Hook for accessing auto pause state
 * 获取自动暂停状态的 Hook
 */
export const useIsAutoPause = (): VideoPlaybackSettings['isAutoPause'] => {
  const { isAutoPause } = useVideoConfig()
  return isAutoPause
}

/**
 * Hook for accessing subtitle display settings
 * 获取字幕显示设置的 Hook
 */
export const useSubtitleDisplaySettings = (): SubtitleDisplaySettings => {
  const { subtitleDisplay } = useVideoConfig()
  return subtitleDisplay
}

/**
 * Hook for accessing display mode controls
 * 获取字幕显示模式控制的 Hook
 */
export const useSubtitleDisplayModeControl = (): {
  displayMode: VideoPlaybackSettings['displayMode']
  updateDisplayMode: (displayMode: VideoPlaybackSettings['displayMode']) => void
} => {
  const { displayMode, setDisplayMode } = useVideoConfig()
  return {
    displayMode,
    updateDisplayMode: setDisplayMode
  }
}

/**
 * Hook for accessing volume and playback rate controls
 * 获取音量和播放速度控制的 Hook
 */
export const useVolumeAndRateControls = (): {
  volume: VideoPlaybackSettings['volume']
  playbackRate: VideoPlaybackSettings['playbackRate']
  updateVolume: (volume: VideoPlaybackSettings['volume']) => void
  updatePlaybackRate: (playbackRate: VideoPlaybackSettings['playbackRate']) => void
} => {
  const { volume, playbackRate, setVolume, setPlaybackRate } = useVideoConfig()
  return {
    volume,
    playbackRate,
    updateVolume: setVolume,
    updatePlaybackRate: setPlaybackRate
  }
}

/**
 * Hook for accessing loop and auto pause controls
 * 获取循环和自动暂停控制的 Hook
 */
export const useLoopAndAutoPauseControls = (): {
  isSingleLoop: VideoPlaybackSettings['isSingleLoop']
  isAutoPause: VideoPlaybackSettings['isAutoPause']
  updateIsSingleLoop: (isSingleLoop: VideoPlaybackSettings['isSingleLoop']) => void
  updateIsAutoPause: (isAutoPause: VideoPlaybackSettings['isAutoPause']) => void
} => {
  const { isSingleLoop, isAutoPause, setIsSingleLoop, setIsAutoPause } = useVideoConfig()
  return {
    isSingleLoop,
    isAutoPause,
    updateIsSingleLoop: setIsSingleLoop,
    updateIsAutoPause: setIsAutoPause
  }
}

/**
 * Hook for accessing current video playback settings
 * 获取当前视频播放设置的 Hook
 */
export const useCurrentVideoPlaybackSettings = (): VideoPlaybackSettings => {
  const { displayMode, volume, playbackRate, isSingleLoop, isAutoPause, subtitleDisplay } =
    useVideoConfig()
  return {
    displayMode,
    volume,
    playbackRate,
    isSingleLoop,
    isAutoPause,
    subtitleDisplay
  }
}

/**
 * Hook for accessing all playback controls with messages
 * 获取所有播放控制（带消息提示）的 Hook
 */
export const useVideoPlaybackControlsWithMessages = (): {
  handleDisplayModeChange: (displayMode: VideoPlaybackSettings['displayMode']) => void
  handleVolumeChange: (volume: VideoPlaybackSettings['volume']) => void
  handlePlaybackRateChange: (playbackRate: VideoPlaybackSettings['playbackRate']) => void
  handleSingleLoopToggle: () => void
  handleAutoPauseToggle: () => void
  handleSettingsRestore: (settings: VideoPlaybackSettings) => void
} => {
  const {
    setDisplayMode,
    setVolume,
    setPlaybackRate,
    isSingleLoop,
    setIsSingleLoop,
    isAutoPause,
    setIsAutoPause,
    setPlaybackSettings
  } = useVideoConfig()

  const handleDisplayModeChange = (displayMode: VideoPlaybackSettings['displayMode']): void => {
    console.log('🎬 字幕显示模式变更:', displayMode)
    setDisplayMode(displayMode)
  }

  const handleVolumeChange = (volume: VideoPlaybackSettings['volume']): void => {
    console.log('🔊 音量变更:', volume)
    setVolume(volume)
  }

  const handlePlaybackRateChange = (playbackRate: VideoPlaybackSettings['playbackRate']): void => {
    console.log('⚡ 播放速度变更:', playbackRate)
    setPlaybackRate(playbackRate)
  }

  const handleSingleLoopToggle = (): void => {
    const newValue = !isSingleLoop
    console.log('🔄 单句循环切换:', newValue)
    setIsSingleLoop(newValue)
  }

  const handleAutoPauseToggle = (): void => {
    const newValue = !isAutoPause
    console.log('⏸️ 自动暂停切换:', newValue)
    setIsAutoPause(newValue)
  }

  const handleSettingsRestore = (settings: VideoPlaybackSettings): void => {
    console.log('🔄 恢复播放设置:', settings)
    setPlaybackSettings(settings)
  }

  return {
    handleDisplayModeChange,
    handleVolumeChange,
    handlePlaybackRateChange,
    handleSingleLoopToggle,
    handleAutoPauseToggle,
    handleSettingsRestore
  }
}

/**
 * Hook for playback speed keyboard shortcuts
 * 播放速度键盘快捷键的 Hook
 */
export const usePlaybackSpeedShortcuts = (): {
  increaseSpeed: () => void
  decreaseSpeed: () => void
  resetSpeed: () => void
} => {
  const { playbackRate, setPlaybackRate } = useVideoConfig()
  const { playerRef, isVideoLoadedRef } = useVideoPlayerContext()

  const increaseSpeed = useCallback(() => {
    // 使用固定步长调整（保持原有逻辑作为后备方案）/ Use fixed step adjustment (keep original logic as fallback)
    const newRate = Math.min(PLAYBACK_RATES.MAX, playbackRate + PLAYBACK_RATES.KEYBOARD_STEP)
    setPlaybackRate(newRate)

    // 直接控制播放器的播放速度 / Directly control player playback speed
    if (playerRef.current && isVideoLoadedRef.current) {
      const internalPlayer = playerRef.current.getInternalPlayer()
      if (internalPlayer && 'playbackRate' in internalPlayer) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(internalPlayer as any).playbackRate = newRate
      }
    }
  }, [playbackRate, setPlaybackRate, playerRef, isVideoLoadedRef])

  const decreaseSpeed = useCallback(() => {
    // 使用固定步长调整（保持原有逻辑作为后备方案）/ Use fixed step adjustment (keep original logic as fallback)
    const newRate = Math.max(PLAYBACK_RATES.MIN, playbackRate - PLAYBACK_RATES.KEYBOARD_STEP)
    setPlaybackRate(newRate)

    // 直接控制播放器的播放速度 / Directly control player playback speed
    if (playerRef.current && isVideoLoadedRef.current) {
      const internalPlayer = playerRef.current.getInternalPlayer()
      if (internalPlayer && 'playbackRate' in internalPlayer) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(internalPlayer as any).playbackRate = newRate
      }
    }
  }, [playbackRate, setPlaybackRate, playerRef, isVideoLoadedRef])

  const resetSpeed = useCallback(() => {
    const newRate = PLAYBACK_RATES.DEFAULT
    setPlaybackRate(newRate)

    // 直接控制播放器的播放速度 / Directly control player playback speed
    if (playerRef.current && isVideoLoadedRef.current) {
      const internalPlayer = playerRef.current.getInternalPlayer()
      if (internalPlayer && 'playbackRate' in internalPlayer) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(internalPlayer as any).playbackRate = newRate
      }
    }
  }, [setPlaybackRate, playerRef, isVideoLoadedRef])

  return {
    increaseSpeed,
    decreaseSpeed,
    resetSpeed
  }
}

/**
 * Hook for playback speed keyboard shortcuts that cycle through user-selected speed options
 * 播放速度键盘快捷键的 Hook，在用户选择的速度选项中循环切换
 */
export const usePlaybackSpeedCycleShortcuts = (): {
  increaseSpeed: () => void
  decreaseSpeed: () => void
  resetSpeed: () => void
} => {
  const { playbackRate, setPlaybackRate } = useVideoConfig()
  const { playerRef, isVideoLoadedRef } = useVideoPlayerContext()
  const { fileId } = usePlayingVideoContext()
  const selectedPlaybackRates = useSelectedPlaybackRates(fileId || '')

  // 应用播放速度到播放器 / Apply playback rate to player
  const applyPlaybackRate = useCallback(
    (newRate: number) => {
      setPlaybackRate(newRate)

      // 直接控制播放器的播放速度 / Directly control player playback speed
      if (playerRef.current && isVideoLoadedRef.current) {
        const internalPlayer = playerRef.current.getInternalPlayer()
        if (internalPlayer && 'playbackRate' in internalPlayer) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ;(internalPlayer as any).playbackRate = newRate
        }
      }
    },
    [setPlaybackRate, playerRef, isVideoLoadedRef]
  )

  const increaseSpeed = useCallback(() => {
    // Add defensive check for selectedPlaybackRates - 添加对 selectedPlaybackRates 的防御性检查
    const safeRates = selectedPlaybackRates || []

    // 如果没有选择的速度选项，使用固定步长调整 / If no selected speed options, use fixed step adjustment
    if (safeRates.length === 0) {
      const newRate = Math.min(PLAYBACK_RATES.MAX, playbackRate + PLAYBACK_RATES.KEYBOARD_STEP)
      applyPlaybackRate(newRate)
      return
    }

    // 在用户选择的速度选项中循环切换 / Cycle through user-selected speed options
    const sortedRates = [...safeRates].sort((a, b) => a - b)
    const currentIndex = sortedRates.findIndex((rate) => Math.abs(rate - playbackRate) < 0.01)

    if (currentIndex === -1) {
      // 当前速度不在选择列表中，切换到最接近且更大的速度 / Current speed not in list, switch to closest higher speed
      const nextRate = sortedRates.find((rate) => rate > playbackRate) || sortedRates[0]
      applyPlaybackRate(nextRate)
    } else {
      // 切换到下一个速度，如果已经是最后一个则循环到第一个 / Switch to next speed, cycle to first if at end
      const nextIndex = (currentIndex + 1) % sortedRates.length
      applyPlaybackRate(sortedRates[nextIndex])
    }
  }, [selectedPlaybackRates, playbackRate, applyPlaybackRate])

  const decreaseSpeed = useCallback(() => {
    // Add defensive check for selectedPlaybackRates - 添加对 selectedPlaybackRates 的防御性检查
    const safeRates = selectedPlaybackRates || []

    // 如果没有选择的速度选项，使用固定步长调整 / If no selected speed options, use fixed step adjustment
    if (safeRates.length === 0) {
      const newRate = Math.max(PLAYBACK_RATES.MIN, playbackRate - PLAYBACK_RATES.KEYBOARD_STEP)
      applyPlaybackRate(newRate)
      return
    }

    // 在用户选择的速度选项中循环切换 / Cycle through user-selected speed options
    const sortedRates = [...safeRates].sort((a, b) => a - b)
    const currentIndex = sortedRates.findIndex((rate) => Math.abs(rate - playbackRate) < 0.01)

    if (currentIndex === -1) {
      // 当前速度不在选择列表中，切换到最接近且更小的速度 / Current speed not in list, switch to closest lower speed
      const prevRate = sortedRates.reverse().find((rate) => rate < playbackRate) || sortedRates[0]
      applyPlaybackRate(prevRate)
    } else {
      // 切换到上一个速度，如果已经是第一个则循环到最后一个 / Switch to previous speed, cycle to last if at beginning
      const prevIndex = currentIndex === 0 ? sortedRates.length - 1 : currentIndex - 1
      applyPlaybackRate(sortedRates[prevIndex])
    }
  }, [selectedPlaybackRates, playbackRate, applyPlaybackRate])

  const resetSpeed = useCallback(() => {
    const newRate = PLAYBACK_RATES.DEFAULT
    applyPlaybackRate(newRate)
  }, [applyPlaybackRate])

  return {
    increaseSpeed,
    decreaseSpeed,
    resetSpeed
  }
}
