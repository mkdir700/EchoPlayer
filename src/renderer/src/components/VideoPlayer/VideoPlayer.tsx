import React, { useState, useRef, useEffect, useCallback } from 'react'
import ReactPlayer from 'react-player'
import { VideoPlaceholder } from './VideoPlaceholder'
import { LoadingIndicator } from '../LoadingIndicator'
import { ErrorIndicator } from '../ErrorIndicator'
import { VideoControlsFullScreen } from './VideoControlsFullScreen'
import { useFullscreen } from '@renderer/hooks/useFullscreen'
import {
  useVideoPlayerRef,
  useVideoPlayState,
  useVideoError,
  useVideoStateRefs,
  useVideoControls
} from '@renderer/hooks/useVideoPlayerHooks'
import { usePlayingVideoContext } from '@renderer/hooks/usePlayingVideoContext'

// 导入样式
import styles from './VideoPlayer.module.css'
import RendererLogger from '@renderer/utils/logger'
import { SubtitleOverlay } from '@renderer/components/VideoPlayer/SubtitleOverlay'

interface VideoPlayerProps {
  isVideoLoaded: boolean
  onFullscreenToggle?: (isFullscreen: boolean) => void
  onVideoReady?: () => void
}

function VideoPlayer({
  isVideoLoaded,
  onFullscreenToggle,
  onVideoReady
}: VideoPlayerProps): React.JSX.Element {
  // 使用 Context 获取状态和控制方法，避免 props 传递
  const playingVideoContext = usePlayingVideoContext()
  const playerRef = useVideoPlayerRef()
  const isPlaying = useVideoPlayState()
  const videoError = useVideoError()

  // 获取状态 Refs（用于不需要响应变化的逻辑）
  const { playbackRateRef, volumeRef } = useVideoStateRefs()

  // 获取控制方法
  const {
    updateTime,
    setDuration,
    setVideoLoaded,
    setVideoError,
    setPlaybackRate,
    setVolume,
    toggle,
    stepBackward,
    stepForward,
    setPlaying
  } = useVideoControls()

  RendererLogger.componentRender({
    component: 'VideoPlayer',
    props: {
      videoFile: playingVideoContext.videoFile,
      isPlaying,
      videoError
      // 不记录频繁变化的状态
    }
  })

  // 内部状态管理 - 只管理 UI 相关的本地状态
  const [showControls, setShowControls] = useState(false)
  const [isUserInteracting, setIsUserInteracting] = useState(false)
  const [isPausedByHover, setIsPausedByHover] = useState(false)
  const hideControlsTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // 优化：添加节流相关的 refs
  const lastMouseMoveTimeRef = useRef(0)
  const mouseMoveThrottleTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // 全屏状态管理
  const { isFullscreen, toggleFullscreen } = useFullscreen()

  // 监听全屏状态变化并通知父组件
  useEffect(() => {
    onFullscreenToggle?.(isFullscreen)
  }, [isFullscreen, onFullscreenToggle])

  // // 将全屏切换函数传递给父组件
  // useEffect(() => {
  //   onFullscreenToggleReady?.(toggleFullscreen)
  // }, [toggleFullscreen, onFullscreenToggleReady])

  // 定义空的回调函数避免每次渲染创建新函数
  const emptyCallback = useCallback(() => {}, [])
  const handleLoopToggle = emptyCallback
  const handleAutoSkipToggle = emptyCallback
  const handlePreviousSubtitle = emptyCallback
  const handleNextSubtitle = emptyCallback

  // 字幕相关的回调函数
  const handleWordHoverForControls = useCallback((isHovering: boolean) => {
    if (isHovering) {
      setShowControls(true)
    }
  }, [])

  const handlePauseOnHover = useCallback(() => {
    if (isPlaying) {
      toggle()
      setIsPausedByHover(true)
    }
  }, [isPlaying, toggle])

  // ReactPlayer 的回调函数
  const handleReactPlayerReady = useCallback(() => {
    console.log('🎬 ReactPlayer onReady 触发')
    onVideoReady?.()
    setVideoLoaded(true)
    setVideoError(null)
  }, [setVideoLoaded, setVideoError, onVideoReady])

  const handleReactPlayerError = useCallback(
    (error: Error | string) => {
      console.error('🚨 ReactPlayer onError 触发:', error)
      const errorMessage = typeof error === 'string' ? error : error.message
      setVideoError(errorMessage)
      setVideoLoaded(false)
    },
    [setVideoError, setVideoLoaded]
  )

  const handleReactPlayerLoadStart = useCallback(() => {
    console.log('🔄 视频开始加载...')
  }, [])

  // ReactPlayer 进度回调
  const handleProgress = useCallback(
    (progress: {
      played: number
      playedSeconds: number
      loaded: number
      loadedSeconds: number
    }) => {
      updateTime(progress.playedSeconds)
    },
    [updateTime]
  )

  // ReactPlayer 时长回调
  const handleDuration = useCallback(
    (duration: number) => {
      setDuration(duration)
      if (duration > 0) {
        setVideoLoaded(true)
      }
    },
    [setDuration, setVideoLoaded]
  )

  // 播放速度变化处理
  const handlePlaybackRateChange = useCallback(
    (rate: number) => {
      setPlaybackRate(rate)
    },
    [setPlaybackRate]
  )

  // 音量变化处理
  const handleVolumeChange = useCallback(
    (volume: number) => {
      setVolume(volume)
    },
    [setVolume]
  )

  // 优化：提取控制栏显示逻辑，避免重复代码
  const showControlsWithTimeout = useCallback(
    (timeout: number = 3000) => {
      setShowControls(true)

      if (hideControlsTimeoutRef.current) {
        clearTimeout(hideControlsTimeoutRef.current)
      }

      if (!isUserInteracting) {
        hideControlsTimeoutRef.current = setTimeout(() => {
          setShowControls(false)
        }, timeout)
      }
    },
    [isUserInteracting]
  )

  // 智能控制显示逻辑
  const handleMouseEnter = useCallback((): void => {
    showControlsWithTimeout()
  }, [showControlsWithTimeout])

  // 鼠标离开时，如果用户没有交互，则隐藏控制栏
  const handleMouseLeave = useCallback((): void => {
    if (!isUserInteracting) {
      hideControlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false)
      }, 2000) // 2秒后隐藏
    }
  }, [isUserInteracting])

  // 优化：添加节流的鼠标移动处理
  const handleMouseMove = useCallback((): void => {
    const now = Date.now()
    const timeSinceLastMove = now - lastMouseMoveTimeRef.current

    // 如果已经显示控制栏且时间间隔小于100ms，则跳过更新
    if (showControls && timeSinceLastMove < 100) {
      return
    }

    lastMouseMoveTimeRef.current = now

    // 只有在控制栏未显示时才更新状态
    if (!showControls) {
      setShowControls(true)
    }

    // 重置定时器
    if (hideControlsTimeoutRef.current) {
      clearTimeout(hideControlsTimeoutRef.current)
    }

    if (!isUserInteracting) {
      hideControlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false)
      }, 3000) // 3秒无操作后隐藏
    }
  }, [showControls, isUserInteracting])

  const handleUserInteractionStart = useCallback((): void => {
    setIsUserInteracting(true)
    setShowControls(true)
  }, [])

  const handleUserInteractionEnd = useCallback((): void => {
    setIsUserInteracting(false)
    hideControlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false)
    }, 2000)
  }, [])

  // 处理视频播放器点击事件
  const handleVideoClick = useCallback((): void => {
    toggle()
    showControlsWithTimeout()
  }, [toggle, showControlsWithTimeout])

  // 清理定时器
  useEffect(() => {
    return () => {
      if (hideControlsTimeoutRef.current) {
        clearTimeout(hideControlsTimeoutRef.current)
      }
      if (mouseMoveThrottleTimeoutRef.current) {
        clearTimeout(mouseMoveThrottleTimeoutRef.current)
      }
    }
  }, [])

  // 播放状态变化时的控制逻辑
  useEffect(() => {
    if (!isPlaying) {
      setShowControls(true)
      if (hideControlsTimeoutRef.current) {
        clearTimeout(hideControlsTimeoutRef.current)
      }
    } else if (!isUserInteracting) {
      hideControlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false)
      }, 3000)
    }

    // 如果是因为悬停暂停的，当播放状态变为播放时，重置悬停状态
    if (isPlaying && isPausedByHover) {
      setIsPausedByHover(false)
    }
  }, [isPlaying, isUserInteracting, isPausedByHover])

  // ReactPlayer 播放状态同步回调
  const handleReactPlayerPlay = useCallback(() => {
    console.log('🎬 ReactPlayer onPlay 触发 - 同步播放状态')
    setPlaying(true)
  }, [setPlaying])

  const handleReactPlayerPause = useCallback(() => {
    console.log('⏸️ ReactPlayer onPause 触发 - 同步暂停状态')
    setPlaying(false)
  }, [setPlaying])

  const handleReactPlayerEnded = useCallback(() => {
    console.log('🏁 ReactPlayer onEnded 触发 - 视频播放结束')
    setPlaying(false)
  }, [setPlaying])

  return (
    <div className={styles.videoSection}>
      <div
        className={styles.videoContainer}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onMouseMove={handleMouseMove}
      >
        {playingVideoContext.videoFile ? (
          <>
            <ReactPlayer
              ref={playerRef}
              url={playingVideoContext.videoFile}
              className={styles.videoPlayer}
              width="100%"
              height="100%"
              playing={isPlaying}
              volume={volumeRef.current}
              playbackRate={playbackRateRef.current}
              onProgress={handleProgress}
              onDuration={handleDuration}
              onReady={handleReactPlayerReady}
              onError={handleReactPlayerError}
              onLoadStart={handleReactPlayerLoadStart}
              onClick={handleVideoClick}
              controls={false}
              progressInterval={300}
              style={{ cursor: 'pointer' }}
              config={{
                file: {
                  attributes: {
                    controlsList: 'nodownload',
                    disablePictureInPicture: false,
                    preload: 'metadata'
                    // 移除 crossOrigin 设置，因为本地文件不需要 CORS
                  },
                  forceHLS: false,
                  forceDASH: false,
                  forceVideo: true
                }
              }}
              onPlay={handleReactPlayerPlay}
              onPause={handleReactPlayerPause}
              onEnded={handleReactPlayerEnded}
            />

            {/* 加载状态提示 */}
            {!isVideoLoaded && !videoError && <LoadingIndicator />}

            {/* 错误状态提示 */}
            {videoError && <ErrorIndicator error={videoError} />}

            {/* 字幕显示组件 - 独立组件，不会导致 VideoPlayer 频繁渲染 */}
            <SubtitleOverlay
              onWordHover={handleWordHoverForControls}
              onPauseOnHover={handlePauseOnHover}
            />

            {/* 视频控制组件 - 仅在全屏模式下显示 */}
            {isFullscreen && showControls && (
              <div
                className={styles.controlsOverlay}
                onMouseEnter={handleUserInteractionStart}
                onMouseLeave={handleUserInteractionEnd}
              >
                <VideoControlsFullScreen
                  showControls={showControls}
                  isVideoLoaded={isVideoLoaded}
                  isPlaying={isPlaying}
                  videoError={videoError}
                  isLooping={false}
                  autoSkipSilence={false}
                  isFullscreen={isFullscreen}
                  playbackRate={playbackRateRef.current}
                  volume={volumeRef.current}
                  onStepBackward={stepBackward}
                  onPlayPause={toggle}
                  onStepForward={stepForward}
                  onPlaybackRateChange={handlePlaybackRateChange}
                  onVolumeChange={handleVolumeChange}
                  onLoopToggle={handleLoopToggle}
                  onAutoSkipToggle={handleAutoSkipToggle}
                  onFullscreenToggle={toggleFullscreen}
                  onPreviousSubtitle={handlePreviousSubtitle}
                  onNextSubtitle={handleNextSubtitle}
                />
              </div>
            )}
          </>
        ) : (
          <VideoPlaceholder />
        )}
      </div>
    </div>
  )
}

export { VideoPlayer }
