import { useCallback } from 'react'
import ReactPlayer from 'react-player'
import { useVideoPlayerContext } from './useVideoPlayerContext'
import { useVideoPlaybackSettingsContext } from './useVideoPlaybackSettingsContext'

interface PlayerControllerReturn {
  // 播放器引用（单例）
  playerRef: React.RefObject<ReactPlayer | null>

  // 基础播放控制
  play: () => void
  pause: () => void
  toggle: () => void

  // 跳转控制
  seekTo: (time: number, type?: 'seconds' | 'fraction') => void
  seekToPercent: (percent: number) => void
  seekRelative: (seconds: number) => void
  fastSeek: (targetTime: number) => void

  // 步进控制
  stepForward: () => void
  stepBackward: () => void
  restart: () => void

  // 音量控制
  setVolume: (volume: number) => void
  adjustVolume: (delta: number) => void

  // 播放速度控制
  setPlaybackRate: (rate: number) => void
  adjustPlaybackRate: (delta: number) => void

  // 状态获取
  getPlayerState: () => {
    currentTime: number
    duration: number
    isPlaying: boolean
    isLoaded: boolean
    error: string | null
    volume: number
    playbackRate: number
    progress: number
  }
  getInternalPlayer: () => unknown
  getLoadedProgress: () => number
  isPlayerReady: () => boolean

  // 状态管理
  resetVideoState: () => void
  restoreVideoState: (currentTime: number, playbackRate: number, volume: number) => void

  // 事件处理器
  createEventHandlers: () => {
    onReady: () => void
    onError: (error: Error | string) => void
    onLoadStart: () => void
    onProgress: (progress: {
      played: number
      playedSeconds: number
      loaded: number
      loadedSeconds: number
    }) => void
    onDuration: (duration: number) => void
    onPlay: () => void
    onPause: () => void
    onEnded: () => void
  }

  // 安全操作包装器
  safePlayerAction: <T>(action: (player: ReactPlayer) => T, fallback?: T) => T | undefined

  // 状态引用
  refs: {
    currentTime: React.RefObject<number>
    duration: React.RefObject<number>
    isPlaying: React.RefObject<boolean>
    isLoaded: React.RefObject<boolean>
    error: React.RefObject<string | null>
    volume: React.RefObject<number>
    playbackRate: React.RefObject<number>
  }
}

interface SimplePlayerControllerReturn {
  playerRef: React.RefObject<ReactPlayer | null>
  play: () => void
  pause: () => void
  toggle: () => void
  seekTo: (time: number, type?: 'seconds' | 'fraction') => void
  isPlayerReady: () => boolean
  getPlayerState: () => {
    currentTime: number
    duration: number
    isPlaying: boolean
    isLoaded: boolean
    error: string | null
    volume: number
    playbackRate: number
    progress: number
  }
}

/**
 * ReactPlayer 控制器 Hook
 *
 * 提供统一的 ReactPlayer 实例控制接口，包括：
 * - 播放器引用（单例形式）
 * - 播放控制方法（播放、暂停、跳转等）
 * - 状态同步方法
 * - 高级控制功能
 *
 * 这个 hook 确保在整个应用中任何组件都能访问到同一个播放器实例
 */
export const useReactPlayerController = (): PlayerControllerReturn => {
  // 获取播放器引用（来自 Context，确保单例）
  const { playerRef } = useVideoPlayerContext()

  // 获取视频播放器状态和控制方法
  const {
    currentTimeRef,
    durationRef,
    isPlayingRef,
    isVideoLoadedRef,
    videoErrorRef,
    updateTime,
    setPlaying,
    setDuration,
    setVideoLoaded,
    setVideoError,
    play,
    pause,
    toggle,
    seekTo,
    stepForward,
    stepBackward,
    restart,
    resetVideoState,
    restoreVideoState
  } = useVideoPlayerContext()

  // 获取播放设置相关的状态和控制
  const { playbackRateRef, volumeRef, updateVolume, updatePlaybackRate } =
    useVideoPlaybackSettingsContext()

  // 缓存播放器实例检查，避免频繁访问 ref
  const isPlayerReady = useCallback((): boolean => {
    return !!(playerRef.current && isVideoLoadedRef.current && !videoErrorRef.current)
  }, [playerRef, isVideoLoadedRef, videoErrorRef])

  // 安全的播放器操作包装器
  const safePlayerAction = useCallback(
    <T>(action: (player: ReactPlayer) => T, fallback?: T): T | undefined => {
      if (isPlayerReady() && playerRef.current) {
        try {
          return action(playerRef.current)
        } catch (error) {
          console.error('ReactPlayer 操作失败:', error)
          return fallback
        }
      }
      return fallback
    },
    [isPlayerReady, playerRef]
  )

  // 播放控制方法
  const playVideo = useCallback((): void => {
    if (isPlayerReady()) {
      play()
    }
  }, [play, isPlayerReady])

  const pauseVideo = useCallback((): void => {
    if (isPlayerReady()) {
      pause()
    }
  }, [pause, isPlayerReady])

  const togglePlayPause = useCallback((): void => {
    if (isPlayerReady()) {
      toggle()
    }
  }, [toggle, isPlayerReady])

  // 跳转控制
  const seekToTime = useCallback(
    (time: number, type: 'seconds' | 'fraction' = 'seconds'): void => {
      if (isPlayerReady()) {
        seekTo(time)
        // 如果是按秒跳转，更新 Context 中的时间
        if (type === 'seconds') {
          updateTime(time)
        }
      }
    },
    [seekTo, updateTime, isPlayerReady]
  )

  // 按百分比跳转
  const seekToPercent = useCallback(
    (percent: number): void => {
      if (isPlayerReady() && durationRef.current > 0) {
        const targetTime = (percent / 100) * durationRef.current
        seekToTime(targetTime, 'seconds')
      }
    },
    [seekToTime, durationRef, isPlayerReady]
  )

  // 相对时间跳转（向前/向后几秒）
  const seekRelative = useCallback(
    (seconds: number): void => {
      if (isPlayerReady()) {
        const currentTime = currentTimeRef.current
        const newTime = Math.max(0, Math.min(currentTime + seconds, durationRef.current))
        seekToTime(newTime)
      }
    },
    [seekToTime, currentTimeRef, durationRef, isPlayerReady]
  )

  // 音量控制
  const setVolume = useCallback(
    (volume: number): void => {
      const clampedVolume = Math.max(0, Math.min(1, volume))
      updateVolume(clampedVolume)
    },
    [updateVolume]
  )

  const adjustVolume = useCallback(
    (delta: number): void => {
      const currentVolume = volumeRef.current
      const newVolume = Math.max(0, Math.min(1, currentVolume + delta))
      setVolume(newVolume)
    },
    [volumeRef, setVolume]
  )

  // 播放速度控制
  const setPlaybackRate = useCallback(
    (rate: number): void => {
      const clampedRate = Math.max(0.25, Math.min(4, rate))
      updatePlaybackRate(clampedRate)
    },
    [updatePlaybackRate]
  )

  const adjustPlaybackRate = useCallback(
    (delta: number): void => {
      const currentRate = playbackRateRef.current
      const newRate = Math.max(0.25, Math.min(4, currentRate + delta))
      setPlaybackRate(newRate)
    },
    [playbackRateRef, setPlaybackRate]
  )

  // 获取当前播放器状态
  const getPlayerState = useCallback(() => {
    return {
      currentTime: currentTimeRef.current,
      duration: durationRef.current,
      isPlaying: isPlayingRef.current,
      isLoaded: isVideoLoadedRef.current,
      error: videoErrorRef.current,
      volume: volumeRef.current,
      playbackRate: playbackRateRef.current,
      progress: durationRef.current > 0 ? currentTimeRef.current / durationRef.current : 0
    }
  }, [
    currentTimeRef,
    durationRef,
    isPlayingRef,
    isVideoLoadedRef,
    videoErrorRef,
    volumeRef,
    playbackRateRef
  ])

  // ReactPlayer 的事件处理器工厂
  const createEventHandlers = useCallback(() => {
    return {
      onReady: () => {
        console.log('🎬 ReactPlayer onReady 触发')
        setVideoLoaded(true)
        setVideoError(null)
      },

      onError: (error: Error | string) => {
        console.error('🚨 ReactPlayer onError 触发:', error)
        const errorMessage = typeof error === 'string' ? error : error.message
        setVideoError(errorMessage)
        setVideoLoaded(false)
      },

      onLoadStart: () => {
        console.log('🔄 视频开始加载...')
      },

      onProgress: (progress: {
        played: number
        playedSeconds: number
        loaded: number
        loadedSeconds: number
      }) => {
        updateTime(progress.playedSeconds)
      },

      onDuration: (duration: number) => {
        setDuration(duration)
        if (duration > 0) {
          setVideoLoaded(true)
        }
      },

      onPlay: () => {
        console.log('🎬 ReactPlayer onPlay 触发 - 同步播放状态')
        setPlaying(true)
      },

      onPause: () => {
        console.log('⏸️ ReactPlayer onPause 触发 - 同步暂停状态')
        setPlaying(false)
      },

      onEnded: () => {
        console.log('🏁 ReactPlayer onEnded 触发 - 视频播放结束')
        setPlaying(false)
      }
    }
  }, [setVideoLoaded, setVideoError, updateTime, setDuration, setPlaying])

  // 高级控制方法
  const fastSeek = useCallback(
    (targetTime: number): void => {
      // 使用 ReactPlayer 的内部方法进行快速跳转（如果可用）
      safePlayerAction((player) => {
        if (player.seekTo) {
          player.seekTo(targetTime, 'seconds')
          updateTime(targetTime)
        }
      })
    },
    [safePlayerAction, updateTime]
  )

  // 获取播放器内部信息
  const getInternalPlayer = useCallback(() => {
    return safePlayerAction((player) => player.getInternalPlayer())
  }, [safePlayerAction])

  // 获取当前加载进度
  const getLoadedProgress = useCallback((): number => {
    return (
      safePlayerAction((player) => {
        // 尝试从内部播放器获取缓冲进度
        const internalPlayer = player.getInternalPlayer()
        if (internalPlayer && internalPlayer.buffered && internalPlayer.buffered.length > 0) {
          const buffered = internalPlayer.buffered
          const currentTime = currentTimeRef.current
          const duration = durationRef.current

          // 找到包含当前时间的缓冲区间
          for (let i = 0; i < buffered.length; i++) {
            if (buffered.start(i) <= currentTime && currentTime <= buffered.end(i)) {
              return duration > 0 ? buffered.end(i) / duration : 0
            }
          }
        }
        return 0
      }, 0) || 0
    )
  }, [safePlayerAction, currentTimeRef, durationRef])

  return {
    // 播放器引用（单例）
    playerRef,

    // 基础播放控制
    play: playVideo,
    pause: pauseVideo,
    toggle: togglePlayPause,

    // 跳转控制
    seekTo: seekToTime,
    seekToPercent,
    seekRelative,
    fastSeek,

    // 步进控制（来自 Context）
    stepForward,
    stepBackward,
    restart,

    // 音量控制
    setVolume,
    adjustVolume,

    // 播放速度控制
    setPlaybackRate,
    adjustPlaybackRate,

    // 状态获取
    getPlayerState,
    getInternalPlayer,
    getLoadedProgress,
    isPlayerReady,

    // 状态管理
    resetVideoState,
    restoreVideoState,

    // 事件处理器
    createEventHandlers,

    // 安全操作包装器
    safePlayerAction,

    // 状态引用（用于不需要重渲染的组件）
    refs: {
      currentTime: currentTimeRef,
      duration: durationRef,
      isPlaying: isPlayingRef,
      isLoaded: isVideoLoadedRef,
      error: videoErrorRef,
      volume: volumeRef,
      playbackRate: playbackRateRef
    }
  }
}

/**
 * 简化版本的 ReactPlayer 控制 hook
 * 只提供最常用的功能，适合简单的播放控制需求
 */
export const useSimplePlayerController = (): SimplePlayerControllerReturn => {
  const controller = useReactPlayerController()

  return {
    playerRef: controller.playerRef,
    play: controller.play,
    pause: controller.pause,
    toggle: controller.toggle,
    seekTo: controller.seekTo,
    isPlayerReady: controller.isPlayerReady,
    getPlayerState: controller.getPlayerState
  }
}

export default useReactPlayerController
