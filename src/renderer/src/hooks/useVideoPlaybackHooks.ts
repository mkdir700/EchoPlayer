import { useVideoConfig } from './useVideoConfig'
import { VideoPlaybackSettings, SubtitleDisplaySettings } from '@types_/shared'

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
