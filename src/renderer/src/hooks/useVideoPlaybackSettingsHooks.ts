import { useState, useEffect, useCallback } from 'react'
import { useVideoPlaybackSettingsContext } from './useVideoPlaybackSettingsContext'
import { VideoPlaybackSettings, SubtitleDisplaySettings } from '@types_/shared'

// 需要响应字幕显示模式变化的组件使用这个 hook
export const useSubtitleDisplayMode = (): VideoPlaybackSettings['displayMode'] => {
  const { subtitleDisplayModeRef, subscribeToSubtitleDisplayMode } =
    useVideoPlaybackSettingsContext()
  const [displayMode, setDisplayMode] = useState(subtitleDisplayModeRef.current)

  useEffect(() => {
    const unsubscribe = subscribeToSubtitleDisplayMode((mode) => {
      setDisplayMode(mode)
    })

    return unsubscribe
  }, [subscribeToSubtitleDisplayMode])

  return displayMode
}

// 需要响应音量变化的组件使用这个 hook
export const usePlaybackVolume = (): VideoPlaybackSettings['volume'] => {
  const { volumeRef, subscribeToVolume } = useVideoPlaybackSettingsContext()
  const [volume, setVolume] = useState(volumeRef.current)

  useEffect(() => {
    const unsubscribe = subscribeToVolume((vol) => {
      setVolume(vol)
    })

    return unsubscribe
  }, [subscribeToVolume])

  return volume
}

// 需要响应播放速度变化的组件使用这个 hook
export const usePlaybackRate = (): VideoPlaybackSettings['playbackRate'] => {
  const { playbackRateRef, subscribeToPlaybackRate } = useVideoPlaybackSettingsContext()
  const [playbackRate, setPlaybackRate] = useState(playbackRateRef.current)

  useEffect(() => {
    const unsubscribe = subscribeToPlaybackRate((rate) => {
      setPlaybackRate(rate)
    })

    return unsubscribe
  }, [subscribeToPlaybackRate])

  return playbackRate
}

// 需要响应单句循环状态变化的组件使用这个 hook
export const useIsSingleLoop = (): VideoPlaybackSettings['isSingleLoop'] => {
  const { isSingleLoopRef, subscribeToIsSingleLoop } = useVideoPlaybackSettingsContext()
  const [isSingleLoop, setIsSingleLoop] = useState(isSingleLoopRef.current)

  useEffect(() => {
    const unsubscribe = subscribeToIsSingleLoop((loop) => {
      setIsSingleLoop(loop)
    })

    return unsubscribe
  }, [subscribeToIsSingleLoop])

  return isSingleLoop
}

// 需要响应自动暂停状态变化的组件使用这个 hook
export const useIsAutoPause = (): VideoPlaybackSettings['isAutoPause'] => {
  const { isAutoPauseRef, subscribeToIsAutoPause } = useVideoPlaybackSettingsContext()
  const [isAutoPause, setIsAutoPause] = useState(isAutoPauseRef.current)

  useEffect(() => {
    const unsubscribe = subscribeToIsAutoPause((autoPause) => {
      setIsAutoPause(autoPause)
    })

    return unsubscribe
  }, [subscribeToIsAutoPause])

  return isAutoPause
}

// 需要响应字幕显示设置变化的组件使用这个 hook
export const useSubtitleDisplaySettings = (): SubtitleDisplaySettings => {
  const { subtitleDisplaySettingsRef, subscribeToSubtitleDisplaySettings } =
    useVideoPlaybackSettingsContext()
  const [subtitleDisplaySettings, setSubtitleDisplaySettings] = useState(
    subtitleDisplaySettingsRef.current
  )

  useEffect(() => {
    const unsubscribe = subscribeToSubtitleDisplaySettings((settings) => {
      setSubtitleDisplaySettings(settings)
    })

    return unsubscribe
  }, [subscribeToSubtitleDisplaySettings])

  return subtitleDisplaySettings
}

// 只需要读取字幕显示模式但不需要响应变化的组件使用这个
export const useSubtitleDisplayModeRef = (): React.RefObject<
  VideoPlaybackSettings['displayMode']
> => {
  const { subtitleDisplayModeRef } = useVideoPlaybackSettingsContext()
  return subtitleDisplayModeRef
}

// 只需要读取音量但不需要响应变化的组件使用这个
export const usePlaybackVolumeRef = (): React.RefObject<VideoPlaybackSettings['volume']> => {
  const { volumeRef } = useVideoPlaybackSettingsContext()
  return volumeRef
}

// 只需要读取播放速度但不需要响应变化的组件使用这个
export const usePlaybackRateRef = (): React.RefObject<VideoPlaybackSettings['playbackRate']> => {
  const { playbackRateRef } = useVideoPlaybackSettingsContext()
  return playbackRateRef
}

// 只需要读取单句循环状态但不需要响应变化的组件使用这个
export const useIsSingleLoopRef = (): React.RefObject<VideoPlaybackSettings['isSingleLoop']> => {
  const { isSingleLoopRef } = useVideoPlaybackSettingsContext()
  return isSingleLoopRef
}

// 只需要读取自动暂停状态但不需要响应变化的组件使用这个
export const useIsAutoPauseRef = (): React.RefObject<VideoPlaybackSettings['isAutoPause']> => {
  const { isAutoPauseRef } = useVideoPlaybackSettingsContext()
  return isAutoPauseRef
}

// 只需要读取字幕显示设置但不需要响应变化的组件使用这个
export const useSubtitleDisplaySettingsRef = (): React.RefObject<SubtitleDisplaySettings> => {
  const { subtitleDisplaySettingsRef } = useVideoPlaybackSettingsContext()
  return subtitleDisplaySettingsRef
}

// 只需要读取所有状态 ref 的组件使用这个
export const useVideoPlaybackSettingsStateRefs = (): {
  subtitleDisplayModeRef: React.RefObject<VideoPlaybackSettings['displayMode']>
  volumeRef: React.RefObject<VideoPlaybackSettings['volume']>
  playbackRateRef: React.RefObject<VideoPlaybackSettings['playbackRate']>
  isSingleLoopRef: React.RefObject<VideoPlaybackSettings['isSingleLoop']>
  isAutoPauseRef: React.RefObject<VideoPlaybackSettings['isAutoPause']>
  subtitleDisplaySettingsRef: React.RefObject<SubtitleDisplaySettings>
} => {
  const {
    subtitleDisplayModeRef,
    volumeRef,
    playbackRateRef,
    isSingleLoopRef,
    isAutoPauseRef,
    subtitleDisplaySettingsRef
  } = useVideoPlaybackSettingsContext()

  return {
    subtitleDisplayModeRef,
    volumeRef,
    playbackRateRef,
    isSingleLoopRef,
    isAutoPauseRef,
    subtitleDisplaySettingsRef
  }
}

// 需要控制播放设置的组件使用这个
/**
 * 提供视频播放设置控制功能的 Hook。
 *
 * @returns {Object} 包含控制视频播放设置的各种方法和状态引用。
 *
 * @property {Function} updateSubtitleDisplayMode - 更新字幕显示模式。
 * @property {Function} updateVolume - 更新音量。
 * @property {Function} updatePlaybackRate - 更新播放速度。
 * @property {Function} updateIsSingleLoop - 更新单句循环状态。
 * @property {Function} updateIsAutoPause - 更新自动暂停状态。
 * @property {Function} restoreSettings - 恢复播放设置。
 */
export const useVideoPlaybackSettingsControls = (): {
  updateSubtitleDisplayMode: (displayMode: VideoPlaybackSettings['displayMode']) => void
  updateVolume: (volume: VideoPlaybackSettings['volume']) => void
  updatePlaybackRate: (playbackRate: VideoPlaybackSettings['playbackRate']) => void
  updateIsSingleLoop: (isSingleLoop: VideoPlaybackSettings['isSingleLoop']) => void
  updateIsAutoPause: (isAutoPause: VideoPlaybackSettings['isAutoPause']) => void
  restoreSettings: (settings: VideoPlaybackSettings) => void
} => {
  const {
    updateSubtitleDisplayMode,
    updateVolume,
    updatePlaybackRate,
    updateIsSingleLoop,
    updateIsAutoPause,
    restoreSettings
  } = useVideoPlaybackSettingsContext()

  return {
    updateSubtitleDisplayMode,
    updateVolume,
    updatePlaybackRate,
    updateIsSingleLoop,
    updateIsAutoPause,
    restoreSettings
  }
}

// 组合 hook - 用于字幕显示控制组件
export const useSubtitleDisplayControl = (): {
  displayMode: VideoPlaybackSettings['displayMode']
  subtitleDisplaySettings: SubtitleDisplaySettings
  updateDisplayMode: (displayMode: VideoPlaybackSettings['displayMode']) => void
} => {
  const displayMode = useSubtitleDisplayMode()
  const subtitleDisplaySettings = useSubtitleDisplaySettings()
  const { updateSubtitleDisplayMode } = useVideoPlaybackSettingsControls()

  return {
    displayMode,
    subtitleDisplaySettings,
    updateDisplayMode: updateSubtitleDisplayMode
  }
}

// 组合 hook - 用于音频控制组件
export const useAudioControl = (): {
  volume: VideoPlaybackSettings['volume']
  playbackRate: VideoPlaybackSettings['playbackRate']
  updateVolume: (volume: VideoPlaybackSettings['volume']) => void
  updatePlaybackRate: (playbackRate: VideoPlaybackSettings['playbackRate']) => void
} => {
  const volume = usePlaybackVolume()
  const playbackRate = usePlaybackRate()
  const { updateVolume, updatePlaybackRate } = useVideoPlaybackSettingsControls()

  return {
    volume,
    playbackRate,
    updateVolume,
    updatePlaybackRate
  }
}

// 组合 hook - 用于学习模式控制组件
export const useLearningModeControl = (): {
  isSingleLoop: VideoPlaybackSettings['isSingleLoop']
  isAutoPause: VideoPlaybackSettings['isAutoPause']
  updateIsSingleLoop: (isSingleLoop: VideoPlaybackSettings['isSingleLoop']) => void
  updateIsAutoPause: (isAutoPause: VideoPlaybackSettings['isAutoPause']) => void
} => {
  const isSingleLoop = useIsSingleLoop()
  const isAutoPause = useIsAutoPause()
  const { updateIsSingleLoop, updateIsAutoPause } = useVideoPlaybackSettingsControls()

  return {
    isSingleLoop,
    isAutoPause,
    updateIsSingleLoop,
    updateIsAutoPause
  }
}

// 组合 hook - 获取所有当前播放设置
export const useCurrentVideoPlaybackSettings = (): VideoPlaybackSettings => {
  const displayMode = useSubtitleDisplayMode()
  const volume = usePlaybackVolume()
  const playbackRate = usePlaybackRate()
  const isSingleLoop = useIsSingleLoop()
  const isAutoPause = useIsAutoPause()
  const subtitleDisplay = useSubtitleDisplaySettings()

  return {
    displayMode,
    volume,
    playbackRate,
    isSingleLoop,
    isAutoPause,
    subtitleDisplay
  }
}

// 带消息提示的播放设置控制 hook - 兼容旧的设置方法
export const useVideoPlaybackSettingsControlsWithMessages = (): {
  handleDisplayModeChange: (displayMode: VideoPlaybackSettings['displayMode']) => void
  handleVolumeChange: (volume: VideoPlaybackSettings['volume']) => void
  handlePlaybackRateChange: (playbackRate: VideoPlaybackSettings['playbackRate']) => void
  handleSingleLoopToggle: () => void
  handleAutoPauseToggle: () => void
  handleSettingsRestore: (settings: VideoPlaybackSettings) => void
} => {
  const {
    updateSubtitleDisplayMode,
    updateVolume,
    updatePlaybackRate,
    updateIsSingleLoop,
    updateIsAutoPause,
    restoreSettings
  } = useVideoPlaybackSettingsControls()

  const { isSingleLoopRef, isAutoPauseRef } = useVideoPlaybackSettingsStateRefs()

  const handleDisplayModeChange = useCallback(
    (displayMode: VideoPlaybackSettings['displayMode']): void => {
      console.log('🎬 字幕显示模式切换:', displayMode)
      updateSubtitleDisplayMode(displayMode)
    },
    [updateSubtitleDisplayMode]
  )

  const handleVolumeChange = useCallback(
    (volume: VideoPlaybackSettings['volume']): void => {
      console.log('🔊 音量调整:', volume)
      updateVolume(volume)
    },
    [updateVolume]
  )

  const handlePlaybackRateChange = useCallback(
    (playbackRate: VideoPlaybackSettings['playbackRate']): void => {
      console.log('⚡ 播放速度调整:', playbackRate)
      updatePlaybackRate(playbackRate)
    },
    [updatePlaybackRate]
  )

  const handleSingleLoopToggle = useCallback((): void => {
    const newValue = !isSingleLoopRef.current
    console.log('🔁 单句循环切换:', newValue)
    updateIsSingleLoop(newValue)
  }, [updateIsSingleLoop, isSingleLoopRef])

  const handleAutoPauseToggle = useCallback((): void => {
    const newValue = !isAutoPauseRef.current
    console.log('⏸️ 自动暂停切换:', newValue)
    updateIsAutoPause(newValue)
  }, [updateIsAutoPause, isAutoPauseRef])

  const handleSettingsRestore = useCallback(
    (settings: VideoPlaybackSettings): void => {
      console.log('🔄 恢复播放设置:', settings)
      restoreSettings(settings)
    },
    [restoreSettings]
  )

  return {
    handleDisplayModeChange,
    handleVolumeChange,
    handlePlaybackRateChange,
    handleSingleLoopToggle,
    handleAutoPauseToggle,
    handleSettingsRestore
  }
}
