import React, { useState, useCallback } from 'react'
import { VideoPlayer } from '@renderer/components/VideoPlayer/VideoPlayer'
import { VideoControlsCompact } from '@renderer/components/VideoPlayer/VideoControlsCompact'
import { VideoPlaybackSettingsProvider } from '@renderer/contexts/VideoPlaybackSettingsContext'
import { SubtitleControlProvider } from '@renderer/contexts/subtitle-control-context'
import { useVideoError } from '@renderer/hooks/useVideoPlayerHooks'
import { usePlayingVideoContext } from '@renderer/hooks/usePlayingVideoContext'
import { useSubtitleControl } from '@renderer/hooks/useSubtitleControl'
import { useShortcutGroup } from '@renderer/hooks/useComponentShortcuts'
import styles from './VideoSection.module.css'

// 内部组件 - 需要在 SubtitleControlProvider 内部使用
function VideoSectionInner(): React.JSX.Element {
  const videoError = useVideoError()
  const playingVideoContext = usePlayingVideoContext()
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isVideoLoaded, setIsVideoLoaded] = useState(false)
  const subtitleControl = useSubtitleControl()

  // 注册组件特定的快捷键
  useShortcutGroup('VideoSection', {
    singleLoop: subtitleControl.toggleSingleLoop, // FIXME: 失效
    autoPause: subtitleControl.toggleAutoPause, // FIXME:  失效
    previousSubtitle: subtitleControl.goToPreviousSubtitle,
    nextSubtitle: subtitleControl.goToNextSubtitle
  })

  // 使用 useCallback 稳定函数引用，避免无限循环
  const handleFullscreenToggle = useCallback((newIsFullscreen: boolean) => {
    setIsFullscreen(newIsFullscreen)
  }, [])

  // 为 VideoControlsCompact 提供切换函数
  const handleFullscreenToggleForControls = useCallback(() => {
    setIsFullscreen(!isFullscreen)
  }, [isFullscreen])

  return (
    <div className={styles.videoSectionContainer}>
      {/* 视频播放区域 */}
      <div className={styles.videoPlayerSection}>
        <VideoPlayer
          isVideoLoaded={isVideoLoaded}
          onFullscreenToggle={handleFullscreenToggle}
          onVideoReady={() => setIsVideoLoaded(true)}
        />
      </div>

      {/* 视频控制区域 - 仅在非全屏模式下显示 */}
      {playingVideoContext.videoFile && !isFullscreen && (
        <div className={styles.videoControlsSection}>
          <VideoControlsCompact
            isVideoLoaded={isVideoLoaded}
            videoError={videoError}
            onFullscreenToggle={handleFullscreenToggleForControls}
          />
        </div>
      )}
    </div>
  )
}

// 外部组件 - 提供所有必要的 Context
export function VideoSection(): React.JSX.Element {
  return (
    <SubtitleControlProvider>
      <VideoSectionInner />
    </SubtitleControlProvider>
  )
}
