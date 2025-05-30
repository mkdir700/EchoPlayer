import React, { useRef, useCallback } from 'react'
import { VideoPlayerContext, type VideoPlayerContextType } from './video-player-context'
import { PLAYBACK_RATES, SEEK_STEP, VOLUME_SETTINGS } from '../constants'
import ReactPlayer from 'react-player'

export function VideoPlayerProvider({
  children
}: {
  children: React.ReactNode
}): React.JSX.Element {
  // Refs 存储状态
  const currentTimeRef = useRef(0)
  const durationRef = useRef(0)
  const playbackRateRef = useRef(PLAYBACK_RATES.DEFAULT)
  const volumeRef = useRef(VOLUME_SETTINGS.DEFAULT)
  const isPlayingRef = useRef(false)
  const isDraggingRef = useRef(false)
  const isVideoLoadedRef = useRef(false)
  const videoErrorRef = useRef<string | null>(null)
  const playerRef = useRef<ReactPlayer | null>(null)

  // 待恢复时间状态
  const pendingRestoreTimeRef = useRef<number | null>(null)

  // 订阅者集合
  const timeSubscribersRef = useRef(new Set<(time: number) => void>())
  const playStateSubscribersRef = useRef(new Set<(isPlaying: boolean) => void>())
  const durationSubscribersRef = useRef(new Set<(duration: number) => void>())
  const loadStateSubscribersRef = useRef(new Set<(isLoaded: boolean) => void>())
  const errorSubscribersRef = useRef(new Set<(error: string | null) => void>())

  // 通知订阅者的方法
  const notifyTimeSubscribers = useCallback((time: number) => {
    timeSubscribersRef.current.forEach((callback) => callback(time))
  }, [])

  const notifyPlayStateSubscribers = useCallback((isPlaying: boolean) => {
    playStateSubscribersRef.current.forEach((callback) => callback(isPlaying))
  }, [])

  const notifyDurationSubscribers = useCallback((duration: number) => {
    durationSubscribersRef.current.forEach((callback) => callback(duration))
  }, [])

  const notifyLoadStateSubscribers = useCallback((isLoaded: boolean) => {
    loadStateSubscribersRef.current.forEach((callback) => callback(isLoaded))
  }, [])

  const notifyErrorSubscribers = useCallback((error: string | null) => {
    errorSubscribersRef.current.forEach((callback) => callback(error))
  }, [])

  // 订阅方法
  const subscribeToTime = useCallback((callback: (time: number) => void) => {
    timeSubscribersRef.current.add(callback)
    return () => {
      timeSubscribersRef.current.delete(callback)
    }
  }, [])

  const subscribeToPlayState = useCallback((callback: (isPlaying: boolean) => void) => {
    playStateSubscribersRef.current.add(callback)
    return () => {
      playStateSubscribersRef.current.delete(callback)
    }
  }, [])

  const subscribeToDuration = useCallback((callback: (duration: number) => void) => {
    durationSubscribersRef.current.add(callback)
    return () => {
      durationSubscribersRef.current.delete(callback)
    }
  }, [])

  const subscribeToLoadState = useCallback((callback: (isLoaded: boolean) => void) => {
    loadStateSubscribersRef.current.add(callback)
    return () => {
      loadStateSubscribersRef.current.delete(callback)
    }
  }, [])

  const subscribeToError = useCallback((callback: (error: string | null) => void) => {
    errorSubscribersRef.current.add(callback)
    return () => {
      errorSubscribersRef.current.delete(callback)
    }
  }, [])

  // 状态更新方法
  const updateTime = useCallback(
    (time: number) => {
      currentTimeRef.current = time

      // 只在非拖拽状态下通知订阅者
      if (!isDraggingRef.current) {
        notifyTimeSubscribers(time)
      }
    },
    [notifyTimeSubscribers]
  )

  const setPlaying = useCallback(
    (playing: boolean) => {
      isPlayingRef.current = playing
      notifyPlayStateSubscribers(playing)
    },
    [notifyPlayStateSubscribers]
  )

  const setDuration = useCallback(
    (duration: number) => {
      durationRef.current = duration
      notifyDurationSubscribers(duration)
    },
    [notifyDurationSubscribers]
  )

  const setDragging = useCallback((dragging: boolean) => {
    isDraggingRef.current = dragging
  }, [])

  const setVideoLoaded = useCallback(
    (loaded: boolean) => {
      isVideoLoadedRef.current = loaded
      notifyLoadStateSubscribers(loaded)
    },
    [notifyLoadStateSubscribers]
  )

  const setVideoError = useCallback(
    (error: string | null) => {
      videoErrorRef.current = error
      notifyErrorSubscribers(error)
    },
    [notifyErrorSubscribers]
  )

  const setPlaybackRate = useCallback((rate: number) => {
    playbackRateRef.current = rate
  }, [])

  const setVolume = useCallback((volume: number) => {
    volumeRef.current = volume
  }, [])

  // 播放控制方法
  const play = useCallback(() => {
    if (isVideoLoadedRef.current && !videoErrorRef.current) {
      setPlaying(true)
    }
  }, [setPlaying])

  const pause = useCallback(() => {
    setPlaying(false)
  }, [setPlaying])

  const toggle = useCallback(() => {
    if (isVideoLoadedRef.current && !videoErrorRef.current) {
      setPlaying(!isPlayingRef.current)
    }
  }, [setPlaying])

  const seekTo = useCallback(
    (time: number) => {
      currentTimeRef.current = time
      notifyTimeSubscribers(time)

      // 触发实际的视频跳转
      if (playerRef.current && isVideoLoadedRef.current) {
        playerRef.current.seekTo(time, 'seconds')
      } else {
        // 保存待恢复时间
        pendingRestoreTimeRef.current = time
      }
    },
    [notifyTimeSubscribers]
  )

  const stepForward = useCallback(() => {
    if (isVideoLoadedRef.current) {
      const newTime = Math.min(durationRef.current, currentTimeRef.current + SEEK_STEP)
      seekTo(newTime)
    }
  }, [seekTo])

  const stepBackward = useCallback(() => {
    if (isVideoLoadedRef.current) {
      const newTime = Math.max(0, currentTimeRef.current - SEEK_STEP)
      seekTo(newTime)
    }
  }, [seekTo])

  const restart = useCallback(() => {
    if (isVideoLoadedRef.current) {
      seekTo(0)
    }
  }, [seekTo])

  // 状态重置
  const resetVideoState = useCallback(() => {
    currentTimeRef.current = 0
    durationRef.current = 0
    playbackRateRef.current = PLAYBACK_RATES.DEFAULT
    volumeRef.current = VOLUME_SETTINGS.DEFAULT
    isPlayingRef.current = false
    isDraggingRef.current = false
    isVideoLoadedRef.current = false
    videoErrorRef.current = null
    pendingRestoreTimeRef.current = null

    // 通知所有订阅者
    notifyTimeSubscribers(0)
    notifyPlayStateSubscribers(false)
    notifyDurationSubscribers(0)
    notifyLoadStateSubscribers(false)
    notifyErrorSubscribers(null)
  }, [
    notifyTimeSubscribers,
    notifyPlayStateSubscribers,
    notifyDurationSubscribers,
    notifyLoadStateSubscribers,
    notifyErrorSubscribers
  ])

  // 状态恢复
  const restoreVideoState = useCallback(
    (currentTime: number, playbackRate: number, volume: number) => {
      currentTimeRef.current = currentTime
      playbackRateRef.current = playbackRate
      volumeRef.current = volume

      // 如果视频已加载，立即跳转
      if (isVideoLoadedRef.current && playerRef.current) {
        playerRef.current.seekTo(currentTime, 'seconds')
        notifyTimeSubscribers(currentTime)
      } else {
        // 保存待恢复时间
        pendingRestoreTimeRef.current = currentTime
      }
    },
    [notifyTimeSubscribers]
  )

  const value: VideoPlayerContextType = {
    // Refs
    currentTimeRef,
    durationRef,
    playbackRateRef,
    volumeRef,
    isPlayingRef,
    isDraggingRef,
    isVideoLoadedRef,
    videoErrorRef,
    playerRef,

    // 订阅者集合
    timeSubscribers: timeSubscribersRef.current,
    playStateSubscribers: playStateSubscribersRef.current,
    durationSubscribers: durationSubscribersRef.current,
    loadStateSubscribers: loadStateSubscribersRef.current,
    errorSubscribers: errorSubscribersRef.current,

    // 订阅方法
    subscribeToTime,
    subscribeToPlayState,
    subscribeToDuration,
    subscribeToLoadState,
    subscribeToError,

    // 更新方法
    updateTime,
    setPlaying,
    setDuration,
    setDragging,
    setVideoLoaded,
    setVideoError,
    setPlaybackRate,
    setVolume,

    // 播放控制
    play,
    pause,
    toggle,
    seekTo,
    stepForward,
    stepBackward,
    restart,

    // 状态管理
    resetVideoState,
    restoreVideoState
  }

  return <VideoPlayerContext.Provider value={value}>{children}</VideoPlayerContext.Provider>
}
