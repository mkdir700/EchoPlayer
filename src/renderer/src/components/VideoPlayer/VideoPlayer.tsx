import React, { useState, useRef, useEffect, useCallback } from 'react'
import ReactPlayer from 'react-player'
import { VideoPlaceholder } from './VideoPlaceholder'
import { LoadingIndicator } from '../LoadingIndicator'
import { ErrorIndicator } from '../ErrorIndicator'
import { VideoControlsFullScreen } from './VideoControlsFullScreen'
import { useFullscreenMode } from '@renderer/hooks/useFullscreenMode'
import {
  useVideoPlayerRef,
  useVideoPlayState,
  useVideoError,
  useVideoControls
} from '@renderer/hooks/useVideoPlayerHooks'
import { usePlayingVideoContext } from '@renderer/hooks/usePlayingVideoContext'
// 导入新的统一控制器
import { useReactPlayerController } from '@renderer/hooks/useReactPlayerController'

// 导入样式
import styles from './VideoPlayer.module.css'
import RendererLogger from '@renderer/utils/logger'
import { SubtitleOverlay } from '@renderer/components/VideoPlayer/SubtitleOverlay'
import { useVideoPlaybackSettingsContext } from '@renderer/hooks/useVideoPlaybackSettingsContext'

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
  // 使用新的统一 ReactPlayer 控制器
  const playerController = useReactPlayerController()

  // 使用 Context 获取状态和控制方法，避免 props 传递
  const playingVideoContext = usePlayingVideoContext()
  const playerRef = useVideoPlayerRef()
  const isPlaying = useVideoPlayState()
  const videoError = useVideoError()

  // 获取状态 Refs（用于不需要响应变化的逻辑）
  const { playbackRateRef, volumeRef } = useVideoPlaybackSettingsContext()

  // 获取控制方法
  const { toggle } = useVideoControls()

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
  const { isFullscreen } = useFullscreenMode()

  // 监听全屏状态变化并通知父组件
  useEffect(() => {
    onFullscreenToggle?.(isFullscreen)
  }, [isFullscreen, onFullscreenToggle])

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

  // 处理鼠标离开单词时恢复播放 / Handle resuming playback when mouse leaves word
  const handleResumeOnLeave = useCallback(() => {
    if (isPausedByHover) {
      toggle()
      setIsPausedByHover(false)
    }
  }, [isPausedByHover, toggle])

  // 使用新控制器提供的事件处理器
  const eventHandlers = playerController.createEventHandlers()

  // 重写 onReady 回调以添加自定义逻辑
  const handleReactPlayerReady = useCallback(() => {
    console.log('🎬 ReactPlayer onReady 触发')
    onVideoReady?.()
    eventHandlers.onReady()
  }, [eventHandlers, onVideoReady])

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
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
              onProgress={eventHandlers.onProgress}
              onDuration={eventHandlers.onDuration}
              onReady={handleReactPlayerReady}
              onError={eventHandlers.onError}
              onLoadStart={eventHandlers.onLoadStart}
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
              onPlay={eventHandlers.onPlay}
              onPause={eventHandlers.onPause}
              onEnded={eventHandlers.onEnded}
            />

            {/* 加载状态提示 */}
            {!isVideoLoaded && !videoError && <LoadingIndicator />}

            {/* 错误状态提示 */}
            {videoError && <ErrorIndicator error={videoError} />}

            {/* 字幕显示组件 - 独立组件，不会导致 VideoPlayer 频繁渲染 */}
            <SubtitleOverlay
              onWordHover={handleWordHoverForControls}
              onPauseOnHover={handlePauseOnHover}
              onResumeOnLeave={handleResumeOnLeave}
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
                  videoError={videoError}
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
