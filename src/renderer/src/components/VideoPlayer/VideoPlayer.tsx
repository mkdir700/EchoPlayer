import React, { useRef, useCallback } from 'react'
import ReactPlayer from 'react-player'
import { VideoPlaceholder } from './VideoPlaceholder'
import { LoadingIndicator } from '../LoadingIndicator'
import { ErrorIndicator } from '../ErrorIndicator'
import { VideoControlsFullScreen } from './VideoControlsFullScreen'
import {
  useVideoPlayerRef,
  useVideoPlayState,
  useVideoError
} from '@renderer/hooks/useVideoPlayerHooks'
import { usePlayingVideoContext } from '@renderer/hooks/usePlayingVideoContext'
// 导入新的统一控制器
import { useReactPlayerController } from '@renderer/hooks/useReactPlayerController'
// 导入内聚的功能 hooks / Import cohesive functionality hooks
import { useVideoControlsDisplay } from '@renderer/hooks/useVideoControlsDisplay'
import { useVideoPlayerInteractions } from '@renderer/hooks/useVideoPlayerInteractions'
import { useVideoTextSelection } from '@renderer/hooks/useVideoTextSelection'
import { useVideoPlayerNotifications } from '@renderer/hooks/useVideoPlayerNotifications'

// 导入样式
import styles from './VideoPlayer.module.css'
import RendererLogger from '@renderer/utils/logger'
import { SubtitleOverlay } from '@renderer/components/VideoPlayer/SubtitleOverlay'
import { useVideoConfig } from '@renderer/hooks/useVideoConfig'
import { CopySuccessToast } from '@renderer/components/CopySuccessToast/CopySuccessToast'
import { useFullscreenMode } from '@renderer/hooks/useFullscreenMode'
import { SpeedOverlay } from './SpeedOverlay'
import { useSpeedOverlay } from '@renderer/hooks/useSpeedOverlay'
import { usePlaybackSpeedMonitor } from '@renderer/hooks/usePlaybackSpeedMonitor'
// 导入字幕模式覆盖层相关组件和 hooks
import { SubtitleModeOverlay } from './SubtitleModeOverlay'
import { useSubtitleModeOverlay } from '@renderer/hooks/useSubtitleModeOverlay'
import { useSubtitleModeMonitor } from '@renderer/hooks/useSubtitleModeMonitor'

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
  const { isFullscreen } = useFullscreenMode()

  // 获取播放设置（用于不需要响应变化的逻辑）
  const { playbackRate, volume } = useVideoConfig()

  // 内聚功能 hooks / Cohesive functionality hooks
  const controlsDisplay = useVideoControlsDisplay()
  const playerInteractions = useVideoPlayerInteractions({
    showControlsWithTimeout: controlsDisplay.showControlsWithTimeout
  })
  const textSelection = useVideoTextSelection()

  // 外部通知管理
  useVideoPlayerNotifications({ onFullscreenToggle })

  // 速度覆盖层管理 / Speed overlay management
  const speedOverlay = useSpeedOverlay()

  // 监听播放速度变化 / Monitor playback speed changes
  usePlaybackSpeedMonitor({
    onSpeedChange: speedOverlay.showSpeedOverlay
  })

  // 字幕模式覆盖层管理 / Subtitle mode overlay management
  const subtitleModeOverlay = useSubtitleModeOverlay()

  // 监听字幕模式变化 / Monitor subtitle mode changes
  useSubtitleModeMonitor({
    onModeChange: subtitleModeOverlay.showModeOverlay
  })

  // 节流相关的 refs（保留在组件中，因为它们是实现细节）
  const mouseMoveThrottleTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  RendererLogger.componentRender({
    component: 'VideoPlayer',
    props: {
      videoFile: playingVideoContext.videoFile,
      isPlaying,
      videoError
      // 不记录频繁变化的状态
    }
  })

  // 使用新控制器提供的事件处理器
  const eventHandlers = playerController.createEventHandlers()

  // 重写 onReady 回调以添加自定义逻辑
  const handleReactPlayerReady = useCallback(() => {
    console.log('🎬 ReactPlayer onReady 触发')
    onVideoReady?.()
    eventHandlers.onReady()
  }, [eventHandlers, onVideoReady])

  // 清理定时器（保留在组件中）
  React.useEffect(() => {
    return () => {
      if (mouseMoveThrottleTimeoutRef.current) {
        clearTimeout(mouseMoveThrottleTimeoutRef.current)
      }
    }
  }, [])

  return (
    <div className={styles.videoSection}>
      <div
        className={styles.videoContainer}
        onMouseEnter={controlsDisplay.handleMouseEnter}
        onMouseLeave={controlsDisplay.handleMouseLeave}
        onMouseMove={controlsDisplay.handleMouseMove}
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
              volume={volume}
              playbackRate={playbackRate}
              onProgress={eventHandlers.onProgress}
              onDuration={eventHandlers.onDuration}
              onReady={handleReactPlayerReady}
              onError={eventHandlers.onError}
              onLoadStart={eventHandlers.onLoadStart}
              onClick={playerInteractions.handleVideoClick}
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

            {/* 字幕覆盖层 - 字幕显示和交互 */}
            <div className={styles.subtitleOverlay}>
              <SubtitleOverlay
                onWordHover={controlsDisplay.handleWordHoverForControls}
                enableTextSelection={true}
                onSelectionChange={textSelection.handleSelectionChange}
              />
            </div>

            {/* 控制器覆盖层(仅在全屏模式下显示) - 播放控制 */}
            <div className={styles.controlsOverlay}>
              {isFullscreen && (
                <VideoControlsFullScreen
                  showControls={controlsDisplay.showControls}
                  isVideoLoaded={isVideoLoaded}
                  videoError={videoError}
                />
              )}
            </div>

            {/* 速度覆盖层 - 播放速度反馈 */}
            <SpeedOverlay
              speed={speedOverlay.currentSpeed}
              visible={speedOverlay.isVisible}
              onHide={speedOverlay.hideSpeedOverlay}
            />

            {/* 字幕模式覆盖层 - 字幕模式切换反馈 */}
            <SubtitleModeOverlay
              mode={subtitleModeOverlay.currentMode}
              visible={subtitleModeOverlay.isVisible}
              onHide={subtitleModeOverlay.hideModeOverlay}
            />

            {/* 复制成功提示 */}
            <CopySuccessToast
              visible={textSelection.toastState.visible}
              position={textSelection.toastState.position}
              copiedText={textSelection.toastState.copiedText}
              onComplete={textSelection.hideCopySuccess}
            />
          </>
        ) : (
          <VideoPlaceholder />
        )}
      </div>
    </div>
  )
}

export default VideoPlayer
