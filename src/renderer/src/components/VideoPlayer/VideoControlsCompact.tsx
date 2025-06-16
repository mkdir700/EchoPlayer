import React from 'react'
import { Slider, Typography } from 'antd'
import type { VideoControlsProps } from '@renderer/types'

// 导入主题样式
import { useTheme } from '@renderer/hooks/features/ui/useTheme'

// 导入控制按钮组件
import {
  LoopToggleButton,
  AutoPauseButton,
  SubtitleModeSelector,
  PlaybackControlButtons,
  PlaybackRateSelector,
  VolumeControl,
  FullscreenButton,
  SettingsButton
} from './controls'
import { useVideoControls, useVideoTime } from '@renderer/hooks/features/video/useVideoPlayerHooks'
import { useSubtitleControl } from '@renderer/hooks/features/subtitle/useSubtitleControl'
import { useVideoPlayerContext } from '@renderer/hooks/core/useVideoPlayerContext'

const { Text } = Typography

// 格式化时间显示
function formatTime(time: number): string {
  const minutes = Math.floor(time / 60)
  const seconds = Math.floor(time % 60)
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

// 独立的进度条组件 - 隔离时间更新的重渲染
const ProgressSection = React.memo(
  ({
    seekTo,
    isVideoLoaded,
    progressStyle,
    sliderStyle,
    timeDisplayStyle,
    timeTextStyle
  }: {
    seekTo: (time: number) => void
    isVideoLoaded: boolean
    progressStyle: React.CSSProperties
    sliderStyle: React.CSSProperties
    timeDisplayStyle: React.CSSProperties
    timeTextStyle: React.CSSProperties
  }): React.JSX.Element => {
    const currentTime = useVideoTime()
    const { durationRef } = useVideoPlayerContext()
    const duration = durationRef.current

    return (
      <div style={progressStyle}>
        <div style={sliderStyle}>
          <Slider
            min={0}
            max={duration}
            value={currentTime}
            onChange={seekTo}
            disabled={!isVideoLoaded}
            tooltip={{ formatter: (value) => formatTime(value || 0) }}
          />
        </div>
        <div style={timeDisplayStyle}>
          <Text style={timeTextStyle}>
            {formatTime(currentTime)} / {formatTime(duration)}
          </Text>
        </div>
      </div>
    )
  }
)
ProgressSection.displayName = 'ProgressSection'

/**
 * Renders a compact video playback control bar with progress slider, playback, subtitle, and system controls.
 *
 * @param isVideoLoaded - Indicates whether the video is loaded and controls should be enabled.
 * @param videoError - Error state of the video, used to disable or adjust controls as needed.
 *
 * @returns The compact video controls UI as a React element.
 */
export function VideoControlsCompact({
  isVideoLoaded,
  videoError
}: VideoControlsProps): React.JSX.Element {
  const { styles } = useTheme()
  const { toggle, seekTo, stepBackward, stepForward } = useVideoControls()
  const subtitleControl = useSubtitleControl()

  return (
    <div style={styles.compactControlsContainer}>
      {/* 🎵 进度条区域 */}
      <ProgressSection
        seekTo={seekTo}
        isVideoLoaded={isVideoLoaded}
        progressStyle={styles.progressSection}
        sliderStyle={styles.progressSlider}
        timeDisplayStyle={styles.timeDisplay}
        timeTextStyle={styles.timeText}
      />

      {/* 🎮 控制按钮区域 */}
      <div style={styles.mainControls}>
        {/* 👈 左侧辅助控制 */}
        <div style={styles.leftControls}>
          <LoopToggleButton isVideoLoaded={isVideoLoaded} />
          <AutoPauseButton isVideoLoaded={isVideoLoaded} />
          <SubtitleModeSelector />
        </div>

        {/* 🎯 中央播放控制 */}
        <div style={styles.centerControls}>
          <PlaybackControlButtons
            isVideoLoaded={isVideoLoaded}
            videoError={videoError}
            onPreviousSubtitle={subtitleControl.goToPreviousSubtitle}
            onStepBackward={stepBackward}
            onPlayPause={toggle}
            onStepForward={stepForward}
            onNextSubtitle={subtitleControl.goToNextSubtitle}
          />
        </div>

        {/* 👉 右侧系统控制 */}
        <div style={styles.rightControls}>
          <PlaybackRateSelector isVideoLoaded={isVideoLoaded} />
          <VolumeControl />
          <FullscreenButton />
          <SettingsButton />
        </div>
      </div>
    </div>
  )
}
