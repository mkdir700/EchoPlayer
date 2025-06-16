import { useState, useEffect } from 'react'
import { useVideoPlayerContext } from '@renderer/hooks/core/useVideoPlayerContext'
import ReactPlayer from 'react-player'

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
  isPlayingRef: React.RefObject<boolean>
  isDraggingRef: React.RefObject<boolean>
  isVideoLoadedRef: React.RefObject<boolean>
  videoErrorRef: React.RefObject<string | null>
} => {
  const {
    currentTimeRef,
    durationRef,
    isPlayingRef,
    isDraggingRef,
    isVideoLoadedRef,
    videoErrorRef
  } = useVideoPlayerContext()

  return {
    currentTimeRef,
    durationRef,
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
