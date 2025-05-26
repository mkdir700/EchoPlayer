import { useState, useCallback, useRef } from 'react'
import { message } from 'antd'
import ReactPlayer from 'react-player'
import { VideoPlayerState } from '../types'
import { SEEK_STEP, PLAYBACK_RATES, VOLUME_SETTINGS } from '../constants'
import { getMediaErrorMessage } from '../utils/helpers'

interface UseVideoPlayerReturn extends VideoPlayerState {
  playerRef: React.RefObject<ReactPlayer | null>
  handlePlayPause: () => void
  handleProgress: (progress: { played: number; playedSeconds: number }) => void
  handleSeek: (value: number) => void
  handlePlaybackRateChange: (value: number) => void
  handleVolumeChange: (value: number) => void
  handleStepBackward: () => void
  handleStepForward: () => void
  handleRestart: () => void
  handleVideoReady: () => void
  handleVideoError: (error: Error | MediaError | string | null) => void
  handleVideoDuration: (duration: number) => void
  resetVideoState: () => void
  restoreVideoState: (currentTime: number, playbackRate: number, volume: number) => void
}

export function useVideoPlayer(): UseVideoPlayerReturn {
  const [state, setState] = useState<VideoPlayerState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    playbackRate: PLAYBACK_RATES.DEFAULT,
    volume: VOLUME_SETTINGS.DEFAULT,
    isVideoLoaded: false,
    videoError: null
  })

  const playerRef = useRef<ReactPlayer | null>(null)

  // 添加待恢复的时间状态
  const pendingRestoreTimeRef = useRef<number | null>(null)

  // 播放/暂停
  const handlePlayPause = useCallback((): void => {
    if (state.isVideoLoaded && !state.videoError) {
      console.log('🎬 播放/暂停回调触发')
      setState((prev) => ({ ...prev, isPlaying: !prev.isPlaying }))
    } else if (state.videoError) {
      message.error('视频加载失败，请重新选择视频文件')
    } else {
      message.warning('视频正在加载中，请稍候...')
    }
  }, [state.isVideoLoaded, state.videoError, state.isPlaying])

  // 进度更新
  const handleProgress = useCallback(
    (progress: { played: number; playedSeconds: number }): void => {
      setState((prev) => ({ ...prev, currentTime: progress.playedSeconds }))
    },
    []
  )

  // 跳转到指定时间
  const handleSeek = useCallback(
    (value: number): void => {
      if (playerRef.current && state.isVideoLoaded) {
        playerRef.current.seekTo(value, 'seconds')
        setState((prev) => ({ ...prev, currentTime: value }))
      }
    },
    [state.isVideoLoaded]
  )

  // 播放速度调整
  const handlePlaybackRateChange = useCallback((value: number): void => {
    setState((prev) => ({ ...prev, playbackRate: value }))
  }, [])

  // 音量调整
  const handleVolumeChange = useCallback((value: number): void => {
    setState((prev) => ({ ...prev, volume: value }))
  }, [])

  // 快退
  const handleStepBackward = useCallback((): void => {
    if (state.isVideoLoaded) {
      const newTime = Math.max(0, state.currentTime - SEEK_STEP)
      handleSeek(newTime)
    }
  }, [state.currentTime, state.isVideoLoaded, handleSeek])

  // 快进
  const handleStepForward = useCallback((): void => {
    if (state.isVideoLoaded) {
      const newTime = Math.min(state.duration, state.currentTime + SEEK_STEP)
      handleSeek(newTime)
    }
  }, [state.currentTime, state.duration, state.isVideoLoaded, handleSeek])

  // 重新开始
  const handleRestart = useCallback((): void => {
    if (state.isVideoLoaded) {
      handleSeek(0)
    }
  }, [state.isVideoLoaded, handleSeek])

  // 视频就绪
  const handleVideoReady = useCallback((): void => {
    console.log('🎬 视频就绪回调触发')

    setState((prev) => ({
      ...prev,
      isVideoLoaded: true,
      videoError: null
    }))

    // 如果有待恢复的时间，立即跳转
    if (pendingRestoreTimeRef.current !== null && playerRef.current) {
      const restoreTime = pendingRestoreTimeRef.current
      console.log('🎯 视频加载完成，跳转到恢复时间点:', restoreTime)

      // 使用 setTimeout 确保视频完全准备好
      setTimeout(() => {
        if (playerRef.current) {
          console.log('⏰ 执行时间跳转:', restoreTime)
          playerRef.current.seekTo(restoreTime, 'seconds')
          setState((prev) => ({ ...prev, currentTime: restoreTime }))
          pendingRestoreTimeRef.current = null // 清除待恢复状态
          console.log('✅ 成功跳转到恢复时间点:', restoreTime)
        } else {
          console.warn('⚠️ playerRef.current 为空，无法执行时间跳转')
        }
      }, 100) // 给视频播放器100ms的准备时间
    } else {
      console.log('📝 无待恢复时间或播放器未准备好:', {
        pendingTime: pendingRestoreTimeRef.current,
        hasPlayer: !!playerRef.current
      })
    }

    message.success('视频加载完成，可以开始播放了！')
  }, [])

  // 视频错误处理
  const handleVideoError = useCallback((error: Error | MediaError | string | null): void => {
    console.error('Video player error:', error)

    const errorMessage = getMediaErrorMessage(error)

    setState((prev) => ({
      ...prev,
      videoError: errorMessage,
      isVideoLoaded: false,
      isPlaying: false
    }))

    // 清除待恢复状态
    pendingRestoreTimeRef.current = null

    message.error(`视频加载失败: ${errorMessage}`)
  }, [])

  // 视频时长设置
  const handleVideoDuration = useCallback((duration: number): void => {
    setState((prev) => ({
      ...prev,
      duration,
      isVideoLoaded: duration > 0
    }))
  }, [])

  // 重置视频状态
  const resetVideoState = useCallback((): void => {
    setState({
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      playbackRate: PLAYBACK_RATES.DEFAULT,
      volume: VOLUME_SETTINGS.DEFAULT,
      isVideoLoaded: false,
      videoError: null
    })

    // 清除待恢复状态
    pendingRestoreTimeRef.current = null
  }, [])

  // 恢复视频状态
  const restoreVideoState = useCallback(
    (currentTime: number, playbackRate: number, volume: number): void => {
      console.log('🔄 恢复视频状态:', {
        currentTime,
        playbackRate,
        volume,
        isVideoLoaded: state.isVideoLoaded
      })

      setState((prev) => ({
        ...prev,
        currentTime,
        playbackRate,
        volume
      }))

      // 如果视频已加载，立即跳转
      if (state.isVideoLoaded && playerRef.current) {
        console.log('🎯 视频已加载，立即跳转到时间点:', currentTime)
        playerRef.current.seekTo(currentTime, 'seconds')
      } else {
        // 如果视频还未加载，保存待恢复的时间
        console.log('⏳ 视频未加载，保存待恢复时间点:', currentTime)
        pendingRestoreTimeRef.current = currentTime
      }
    },
    [state.isVideoLoaded]
  )

  return {
    playerRef,
    ...state,
    handlePlayPause,
    handleProgress,
    handleSeek,
    handlePlaybackRateChange,
    handleVolumeChange,
    handleStepBackward,
    handleStepForward,
    handleRestart,
    handleVideoReady,
    handleVideoError,
    handleVideoDuration,
    resetVideoState,
    restoreVideoState
  }
}
