import { useState, useEffect, useCallback } from 'react'
import { useVideoPlayerContext } from './useVideoPlayerContext'
import ReactPlayer from 'react-player'
import { message } from 'antd'

// 需要响应时间变化的组件使用这个 hook
export const useVideoTime = (): number => {
  const { currentTimeRef, subscribeToTime } = useVideoPlayerContext()
  const [currentTime, setCurrentTime] = useState(currentTimeRef.current)

  useEffect(() => {
    const unsubscribe = subscribeToTime((time) => {
      setCurrentTime(time)
    })

    return unsubscribe
  }, [subscribeToTime])

  return currentTime
}

// 需要响应播放状态变化的组件使用这个 hook
export const useVideoPlayState = (): boolean => {
  const { isPlayingRef, subscribeToPlayState } = useVideoPlayerContext()
  const [isPlaying, setIsPlaying] = useState(isPlayingRef.current)

  useEffect(() => {
    const unsubscribe = subscribeToPlayState((playing) => {
      setIsPlaying(playing)
    })

    return unsubscribe
  }, [subscribeToPlayState])

  return isPlaying
}

// 需要响应视频时长变化的组件使用这个 hook
export const useVideoDuration = (): number => {
  const { durationRef, subscribeToDuration } = useVideoPlayerContext()
  const [duration, setDuration] = useState(durationRef.current)

  useEffect(() => {
    const unsubscribe = subscribeToDuration((dur) => {
      setDuration(dur)
    })

    return unsubscribe
  }, [subscribeToDuration])

  return duration
}

// 需要响应加载状态变化的组件使用这个 hook
export const useVideoLoadState = (): boolean => {
  const { isVideoLoadedRef, subscribeToLoadState } = useVideoPlayerContext()
  const [isLoaded, setIsLoaded] = useState(isVideoLoadedRef.current)

  useEffect(() => {
    const unsubscribe = subscribeToLoadState((loaded) => {
      setIsLoaded(loaded)
    })

    return unsubscribe
  }, [subscribeToLoadState])

  return isLoaded
}

// 需要响应错误状态变化的组件使用这个 hook
export const useVideoError = (): string | null => {
  const { videoErrorRef, subscribeToError } = useVideoPlayerContext()
  const [error, setError] = useState(videoErrorRef.current)

  useEffect(() => {
    const unsubscribe = subscribeToError((err) => {
      setError(err)
    })

    return unsubscribe
  }, [subscribeToError])

  return error
}

// 只需要读取当前时间但不需要响应变化的组件使用这个
export const useVideoTimeRef = (): React.RefObject<number> => {
  const { currentTimeRef } = useVideoPlayerContext()
  return currentTimeRef
}

// 只需要读取播放状态但不需要响应变化的组件使用这个
export const useVideoPlayStateRef = (): React.RefObject<boolean> => {
  const { isPlayingRef } = useVideoPlayerContext()
  return isPlayingRef
}

// 只需要读取视频时长但不需要响应变化的组件使用这个
export const useVideoDurationRef = (): React.RefObject<number> => {
  const { durationRef } = useVideoPlayerContext()
  return durationRef
}

// 只需要读取其他状态 ref 的组件使用这个
export const useVideoStateRefs = (): {
  currentTimeRef: React.RefObject<number>
  durationRef: React.RefObject<number>
  playbackRateRef: React.RefObject<number>
  volumeRef: React.RefObject<number>
  isPlayingRef: React.RefObject<boolean>
  isDraggingRef: React.RefObject<boolean>
  isVideoLoadedRef: React.RefObject<boolean>
  videoErrorRef: React.RefObject<string | null>
} => {
  const {
    currentTimeRef,
    durationRef,
    playbackRateRef,
    volumeRef,
    isPlayingRef,
    isDraggingRef,
    isVideoLoadedRef,
    videoErrorRef
  } = useVideoPlayerContext()

  return {
    currentTimeRef,
    durationRef,
    playbackRateRef,
    volumeRef,
    isPlayingRef,
    isDraggingRef,
    isVideoLoadedRef,
    videoErrorRef
  }
}

// 需要控制播放器的组件使用这个
/**
 * 提供视频播放器控制功能的 Hook。
 *
 * @returns {Object} 包含控制视频播放的各种方法和状态引用。
 *
 * @property {Function} play - 播放视频。
 * @property {Function} pause - 暂停视频。
 * @property {Function} toggle - 切换播放/暂停状态。
 * @property {Function} seekTo - 跳转到指定时间。
 * @property {Function} stepForward - 向前跳跃固定时间。
 * @property {Function} stepBackward - 向后跳跃固定时间。
 * @property {Function} restart - 重头开始播放视频。
 * @property {Function} setDragging - 设置拖动状态。
 * @property {Function} updateTime - 更新当前播放时间。
 * @property {Function} setPlaying - 设置播放状态。
 * @property {Function} setDuration - 设置视频时长。
 * @property {Function} setVideoLoaded - 设置视频加载状态。
 * @property {Function} setVideoError - 设置视频错误信息。
 * @property {Function} setPlaybackRate - 设置播放速度。
 * @property {Function} setVolume - 设置音量。
 * @property {Function} resetVideoState - 重置视频状态。
 * @property {Function} restoreVideoState - 恢复视频状态。
 * @property {React.RefObject<boolean>} isDraggingRef - 拖动状态的引用。
 */
export const useVideoControls = (): {
  play: () => void
  pause: () => void
  toggle: () => void
  seekTo: (time: number) => void
  stepForward: () => void
  stepBackward: () => void
  restart: () => void
  setDragging: (dragging: boolean) => void
  updateTime: (time: number) => void
  setPlaying: (playing: boolean) => void
  setDuration: (duration: number) => void
  setVideoLoaded: (loaded: boolean) => void
  setVideoError: (error: string | null) => void
  setPlaybackRate: (rate: number) => void
  setVolume: (volume: number) => void
  resetVideoState: () => void
  restoreVideoState: (currentTime: number, playbackRate: number, volume: number) => void
  isDraggingRef: React.RefObject<boolean>
} => {
  const {
    play,
    pause,
    toggle,
    seekTo,
    stepForward,
    stepBackward,
    restart,
    setDragging,
    updateTime,
    setPlaying,
    setDuration,
    setVideoLoaded,
    setVideoError,
    setPlaybackRate,
    setVolume,
    resetVideoState,
    restoreVideoState,
    isDraggingRef
  } = useVideoPlayerContext()

  return {
    // 播放控制
    play,
    pause,
    toggle,
    seekTo,
    stepForward,
    stepBackward,
    restart,

    // 状态控制
    setDragging,
    updateTime,
    setPlaying,
    setDuration,
    setVideoLoaded,
    setVideoError,
    setPlaybackRate,
    setVolume,

    // 状态管理
    resetVideoState,
    restoreVideoState,

    // 常用的状态引用
    isDraggingRef
  }
}

// 需要播放器引用的组件使用这个
export const useVideoPlayerRef = (): React.RefObject<ReactPlayer | null> => {
  const { playerRef } = useVideoPlayerContext()
  return playerRef
}

// 组合 hook - 用于进度条组件
export const useVideoProgress = (): {
  currentTime: number
  duration: number
  currentTimeRef: React.RefObject<number>
  seekTo: (time: number) => void
  setDragging: (dragging: boolean) => void
  isDraggingRef: React.RefObject<boolean>
  progress: number
} => {
  const currentTime = useVideoTime()
  const duration = useVideoDuration()
  const { seekTo, setDragging, isDraggingRef } = useVideoControls()
  const currentTimeRef = useVideoTimeRef()

  return {
    currentTime,
    duration,
    currentTimeRef,
    seekTo,
    setDragging,
    isDraggingRef,
    progress: duration > 0 ? currentTime / duration : 0
  }
}

// 组合 hook - 用于播放控制按钮
export const useVideoPlayback = (): {
  isPlaying: boolean
  isLoaded: boolean
  error: string | null
  play: () => void
  pause: () => void
  toggle: () => void
  canPlay: boolean
} => {
  const isPlaying = useVideoPlayState()
  const isLoaded = useVideoLoadState()
  const error = useVideoError()
  const { play, pause, toggle } = useVideoControls()

  return {
    isPlaying,
    isLoaded,
    error,
    play,
    pause,
    toggle,
    canPlay: isLoaded && !error
  }
}

// 组合 hook - 用于字幕显示组件
export const useVideoSubtitle = (): {
  currentTime: number
  isLoaded: boolean
} => {
  const currentTime = useVideoTime()
  const isLoaded = useVideoLoadState()

  return {
    currentTime,
    isLoaded
  }
}

// 带消息提示的播放控制 hook - 兼容旧的 handlePlayPause 等方法
export const useVideoControlsWithMessages = (): {
  handlePlayPause: () => void
  handleStepBackward: () => void
  handleStepForward: () => void
  handleSeek: (value: number) => void
  handlePlaybackRateChange: (rate: number) => void
  handleVolumeChange: (volume: number) => void
  handleRestart: () => void
  handleVideoReady: () => void
  handleVideoError: (error: Error | MediaError | string | null) => void
  handleVideoDuration: (duration: number) => void
  handleProgress: (progress: { played: number; playedSeconds: number }) => void
} => {
  const {
    toggle,
    stepBackward,
    stepForward,
    seekTo,
    setPlaybackRate,
    setVolume,
    restart,
    setVideoLoaded,
    setVideoError,
    setDuration,
    updateTime
  } = useVideoControls()

  const { isVideoLoadedRef, videoErrorRef } = useVideoStateRefs()

  const handlePlayPause = useCallback((): void => {
    if (isVideoLoadedRef.current && !videoErrorRef.current) {
      console.log('🎬 播放/暂停回调触发')
      toggle()
    } else if (videoErrorRef.current) {
      message.error('视频加载失败，请重新选择视频文件')
    } else {
      message.warning('视频正在加载中，请稍候...')
    }
  }, [toggle, isVideoLoadedRef, videoErrorRef])

  const handleStepBackward = useCallback((): void => {
    if (isVideoLoadedRef.current) {
      stepBackward()
    }
  }, [stepBackward, isVideoLoadedRef])

  const handleStepForward = useCallback((): void => {
    if (isVideoLoadedRef.current) {
      stepForward()
    }
  }, [stepForward, isVideoLoadedRef])

  const handleSeek = useCallback(
    (value: number): void => {
      if (isVideoLoadedRef.current) {
        seekTo(value)
      }
    },
    [seekTo, isVideoLoadedRef]
  )

  const handlePlaybackRateChange = useCallback(
    (rate: number): void => {
      setPlaybackRate(rate)
    },
    [setPlaybackRate]
  )

  const handleVolumeChange = useCallback(
    (volume: number): void => {
      setVolume(volume)
    },
    [setVolume]
  )

  const handleRestart = useCallback((): void => {
    if (isVideoLoadedRef.current) {
      restart()
    }
  }, [restart, isVideoLoadedRef])

  const handleVideoReady = useCallback((): void => {
    console.log('🎬 视频就绪回调触发')
    setVideoLoaded(true)
    setVideoError(null)
    message.success('视频加载完成，可以开始播放了！')
  }, [setVideoLoaded, setVideoError])

  const handleVideoError = useCallback(
    (error: Error | MediaError | string | null): void => {
      console.error('Video player error:', error)

      let errorMessage = '视频播放出错'
      if (typeof error === 'string') {
        errorMessage = error
      } else if (error instanceof Error) {
        errorMessage = error.message
      } else if (error instanceof MediaError) {
        switch (error.code) {
          case MediaError.MEDIA_ERR_ABORTED:
            errorMessage = '视频播放被中止'
            break
          case MediaError.MEDIA_ERR_NETWORK:
            errorMessage = '网络错误导致视频下载失败'
            break
          case MediaError.MEDIA_ERR_DECODE:
            errorMessage = '视频解码失败，可能是编解码器不支持'
            break
          case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
            errorMessage = '视频格式不支持'
            break
          default:
            errorMessage = '未知的视频播放错误'
        }
      }

      setVideoError(errorMessage)
      setVideoLoaded(false)
      message.error(`视频加载失败: ${errorMessage}`)
    },
    [setVideoError, setVideoLoaded]
  )

  const handleVideoDuration = useCallback(
    (duration: number): void => {
      setDuration(duration)
      if (duration > 0) {
        setVideoLoaded(true)
      }
    },
    [setDuration, setVideoLoaded]
  )

  const handleProgress = useCallback(
    (progress: { played: number; playedSeconds: number }): void => {
      updateTime(progress.playedSeconds)
    },
    [updateTime]
  )

  return {
    handlePlayPause,
    handleStepBackward,
    handleStepForward,
    handleSeek,
    handlePlaybackRateChange,
    handleVolumeChange,
    handleRestart,
    handleVideoReady,
    handleVideoError,
    handleVideoDuration,
    handleProgress
  }
}
