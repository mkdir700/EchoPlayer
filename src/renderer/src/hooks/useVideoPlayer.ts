import { useState, useCallback, useRef, RefObject } from 'react'
import { message } from 'antd'
import ReactPlayer from 'react-player'
import { SEEK_STEP, PLAYBACK_RATES, VOLUME_SETTINGS } from '../constants'
import { getMediaErrorMessage } from '../utils/helpers'
import { ReactCallback } from '@renderer/types/shared'

interface VideoPlayerState {
  isPlaying: boolean
  currentTimeRef: RefObject<number>
  duration: number
  playbackRateRef: RefObject<number>
  volumeRef: RefObject<number>
  isVideoLoaded: boolean
  videoError: string | null
}

export interface UseVideoPlayerReturn extends VideoPlayerState {
  playerRef: RefObject<ReactPlayer | null>
  handlePlayPause: ReactCallback<() => void>
  handleProgress: ReactCallback<(progress: { played: number; playedSeconds: number }) => void>
  handleSeek: ReactCallback<(value: number) => void>
  handlePlaybackRateChange: ReactCallback<(value: number) => void>
  handleVolumeChange: ReactCallback<(value: number) => void>
  handleStepBackward: ReactCallback<() => void>
  handleStepForward: ReactCallback<() => void>
  handleRestart: ReactCallback<() => void>
  handleVideoReady: ReactCallback<() => void>
  handleVideoError: ReactCallback<(error: Error | MediaError | string | null) => void>
  handleVideoDuration: ReactCallback<(duration: number) => void>
  resetVideoState: ReactCallback<() => void>
  restoreVideoState: ReactCallback<
    (currentTime: number, playbackRate: number, volume: number) => void
  >
  startLoadingTimeout: ReactCallback<() => void>
  clearLoadingTimeout: ReactCallback<() => void>
}

export function useVideoPlayer(): UseVideoPlayerReturn {
  const [state, setState] = useState<VideoPlayerState>({
    isPlaying: false,
    currentTimeRef: useRef(0),
    duration: 0,
    playbackRateRef: useRef(PLAYBACK_RATES.DEFAULT),
    volumeRef: useRef(VOLUME_SETTINGS.DEFAULT),
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
  }, [state.isVideoLoaded, state.videoError])

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
    setState((prev) => ({ ...prev, playbackRateRef: { current: value } }))
  }, [])

  // 音量调整
  const handleVolumeChange = useCallback((value: number): void => {
    setState((prev) => ({ ...prev, volumeRef: { current: value } }))
  }, [])

  // 快退
  const handleStepBackward = useCallback((): void => {
    if (state.isVideoLoaded) {
      const newTime = Math.max(0, state.currentTimeRef.current - SEEK_STEP)
      handleSeek(newTime)
    }
  }, [state.currentTimeRef, state.isVideoLoaded, handleSeek])

  // 快进
  const handleStepForward = useCallback((): void => {
    if (state.isVideoLoaded) {
      const newTime = Math.min(state.duration, state.currentTimeRef.current + SEEK_STEP)
      handleSeek(newTime)
    }
  }, [state.currentTimeRef, state.duration, state.isVideoLoaded, handleSeek])

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

  // 添加视频加载超时检测
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const startLoadingTimeout = useCallback((): void => {
    // 清除之前的超时
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current)
    }

    // 设置30秒超时
    loadingTimeoutRef.current = setTimeout(() => {
      console.warn('⚠️ 视频加载超时 (30秒)')
      setState((prev) => ({
        ...prev,
        videoError: '视频加载超时。如果是 H.265 视频，请尝试转换为 H.264 格式',
        isVideoLoaded: false,
        isPlaying: false
      }))

      message.error({
        content: '视频加载超时，可能是编解码器不支持导致的',
        duration: 6,
        key: 'loading-timeout'
      })

      // 延迟显示转换建议
      setTimeout(() => {
        message.info({
          content: '建议将 H.265 视频转换为 H.264 格式，或查看设置中的"视频转换指南"',
          duration: 8,
          key: 'conversion-suggestion'
        })
      }, 2000)
    }, 30000) // 30秒超时
  }, [])

  const clearLoadingTimeout = useCallback((): void => {
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current)
      loadingTimeoutRef.current = null
    }
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

    // 检查是否是编解码器相关错误
    const isCodecError =
      error instanceof MediaError &&
      (error.code === MediaError.MEDIA_ERR_DECODE ||
        error.code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED)

    if (isCodecError) {
      message.error({
        content: `视频加载失败: ${errorMessage}`,
        duration: 6,
        key: 'video-error'
      })

      // 延迟显示转换指导提示
      setTimeout(() => {
        message.info({
          content: '如需帮助转换视频格式，请查看应用设置中的"视频转换指南"',
          duration: 8,
          key: 'conversion-guide-hint'
        })
      }, 2000)
    } else {
      message.error(`视频加载失败: ${errorMessage}`)
    }
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
      currentTimeRef: { current: 0 },
      duration: 0,
      playbackRateRef: { current: PLAYBACK_RATES.DEFAULT },
      volumeRef: { current: VOLUME_SETTINGS.DEFAULT },
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
        currentTimeRef: { current: currentTime },
        playbackRateRef: { current: playbackRate },
        volumeRef: { current: volume }
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
    restoreVideoState,
    startLoadingTimeout,
    clearLoadingTimeout
  }
}
