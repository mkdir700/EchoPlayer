import React from 'react'
import { VideoPlayer } from '../VideoPlayer/VideoPlayer'
import { VideoControlsCompact } from '../VideoPlayer/VideoControlsCompact'
import { useSubtitleListContext } from '@renderer/hooks/useSubtitleListContext'
import { usePlayingVideoContext } from '@renderer/hooks/usePlayingVideoContext'
import { useSubtitleControl } from '@renderer/hooks/useSubtitleControl'
import { useShortcutGroup } from '@renderer/hooks/useComponentShortcuts'
import {
  useVideoTime,
  useVideoPlayState,
  useVideoDuration,
  useVideoLoadState,
  useVideoError,
  useVideoControls
} from '@renderer/hooks/useVideoPlayerHooks'
import type { DisplayMode } from '@renderer/types'
import styles from './VideoSection.module.css'

interface VideoSectionProps {
  displayModeRef: React.RefObject<DisplayMode>
  isFullscreen: boolean
  onFullscreenChange: (isFullscreen: boolean) => void
  onFullscreenToggleReady: (toggleFn: () => void) => void
  onDisplayModeChange: (mode: DisplayMode) => void
}

export function VideoSection({
  displayModeRef,
  isFullscreen,
  onFullscreenChange,
  onFullscreenToggleReady,
  onDisplayModeChange
}: VideoSectionProps): React.JSX.Element {
  // 使用新的优化 hooks
  const currentTime = useVideoTime()
  const isPlaying = useVideoPlayState()
  const duration = useVideoDuration()
  const isVideoLoaded = useVideoLoadState()
  const videoError = useVideoError()
  const { setPlaybackRate, setVolume, toggle, seekTo, stepBackward, stepForward } =
    useVideoControls()

  const subtitleListContext = useSubtitleListContext()
  const playingVideoContext = usePlayingVideoContext()

  // 计算当前字幕索引（在这个组件中计算，避免PlayPage重新渲染）
  const currentSubtitleIndex = subtitleListContext.getCurrentSubtitleIndex(currentTime)

  // 字幕控制 Hook
  const subtitleControl = useSubtitleControl({
    currentSubtitleIndex,
    currentTime,
    isPlaying,
    isVideoLoaded,
    onSeek: seekTo,
    onPause: toggle
  })

  // 注册组件特定的快捷键
  useShortcutGroup(
    'VideoSection',
    {
      singleLoop: subtitleControl.toggleSingleLoop,
      autoPause: subtitleControl.toggleAutoPause,
      previousSubtitle: subtitleControl.goToPreviousSubtitle,
      nextSubtitle: subtitleControl.goToNextSubtitle
    },
    {
      enabled: isVideoLoaded && !!playingVideoContext.videoFile,
      priority: 10 // 高优先级，确保在视频播放时优先处理
    }
  )

  // 播放速度变化处理
  const handlePlaybackRateChange = React.useCallback(
    (rate: number) => {
      setPlaybackRate(rate)
    },
    [setPlaybackRate]
  )

  // 音量变化处理
  const handleVolumeChange = React.useCallback(
    (volume: number) => {
      setVolume(volume)
    },
    [setVolume]
  )

  return (
    <div className={styles.videoSectionContainer}>
      {/* 视频播放区域 */}
      <div className={styles.videoPlayerSection}>
        <VideoPlayer
          displayModeRef={displayModeRef}
          onFullscreenChange={onFullscreenChange}
          onFullscreenToggleReady={onFullscreenToggleReady}
        />
      </div>

      {/* 视频控制区域 - 仅在非全屏模式下显示 */}
      {playingVideoContext.videoFile && !isFullscreen && (
        <div className={styles.videoControlsSection}>
          <VideoControlsCompact
            duration={duration}
            currentTime={currentTime}
            isVideoLoaded={isVideoLoaded}
            isPlaying={isPlaying}
            videoError={videoError}
            isLooping={subtitleControl.isSingleLoop}
            autoPause={subtitleControl.isAutoPause}
            autoSkipSilence={false}
            displayModeRef={displayModeRef}
            onSeek={seekTo}
            onStepBackward={stepBackward}
            onPlayPause={toggle}
            onStepForward={stepForward}
            onPlaybackRateChange={handlePlaybackRateChange}
            onVolumeChange={handleVolumeChange}
            onLoopToggle={subtitleControl.toggleSingleLoop}
            onAutoSkipToggle={subtitleControl.toggleAutoPause}
            onFullscreenToggle={() => {}}
            onPreviousSubtitle={subtitleControl.goToPreviousSubtitle}
            onNextSubtitle={subtitleControl.goToNextSubtitle}
            onDisplayModeChange={onDisplayModeChange}
          />
        </div>
      )}
    </div>
  )
}
