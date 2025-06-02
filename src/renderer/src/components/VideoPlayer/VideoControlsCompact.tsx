import React from 'react'
import { Slider, Typography } from 'antd'
import type { VideoControlsProps } from '@renderer/types'

// 导入样式
import styles from './VideoControlsCompact.module.css'

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
import { useVideoControls, useVideoTime } from '@renderer/hooks/useVideoPlayerHooks'
import { useSubtitleControl } from '@renderer/hooks/useSubtitleControl'
import { useVideoPlayerContext } from '@renderer/hooks/useVideoPlayerContext'

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
    isVideoLoaded
  }: {
    seekTo: (time: number) => void
    isVideoLoaded: boolean
  }): React.JSX.Element => {
    const currentTime = useVideoTime()
    const { durationRef } = useVideoPlayerContext()
    const duration = durationRef.current

    return (
      <div className={styles.progressSection}>
        <Slider
          min={0}
          max={duration}
          value={currentTime}
          onChange={seekTo}
          className={styles.progressSlider}
          disabled={!isVideoLoaded}
          tooltip={{ formatter: (value) => formatTime(value || 0) }}
        />
        <div className={styles.timeDisplay}>
          <Text className={styles.timeText}>
            {formatTime(currentTime)} / {formatTime(duration)}
          </Text>
        </div>
      </div>
    )
  }
)
ProgressSection.displayName = 'ProgressSection'

export function VideoControlsCompact({
  isVideoLoaded,
  videoError,
  onFullscreenToggle
}: VideoControlsProps): React.JSX.Element {
  const { setPlaybackRate, setVolume, toggle, seekTo, stepBackward, stepForward } =
    useVideoControls()
  const subtitleControl = useSubtitleControl()

  return (
    <div className={styles.compactControlsContainer}>
      {/* 进度条 - 使用独立组件 */}
      <ProgressSection seekTo={seekTo} isVideoLoaded={isVideoLoaded} />

      {/* 主控制区 */}
      <div className={styles.mainControls}>
        {/* 左侧功能按钮 */}
        <div className={styles.leftControls}>
          {/* 循环播放 */}
          <LoopToggleButton isVideoLoaded={isVideoLoaded} />

          {/* 自动暂停 */}
          <AutoPauseButton isVideoLoaded={isVideoLoaded} />

          {/* 字幕显示模式控制 */}
          <SubtitleModeSelector />
        </div>

        {/* 中央播放控制 */}
        <PlaybackControlButtons
          isVideoLoaded={isVideoLoaded}
          videoError={videoError}
          onPreviousSubtitle={subtitleControl.goToPreviousSubtitle}
          onStepBackward={stepBackward}
          onPlayPause={toggle}
          onStepForward={stepForward}
          onNextSubtitle={subtitleControl.goToNextSubtitle}
          className={styles.centerControls}
          buttonClassName={styles.controlBtn}
          playPauseClassName={styles.playPauseBtn}
        />

        {/* 右侧系统控制 */}
        <div className={styles.rightControls}>
          {/* 播放倍数 */}
          <PlaybackRateSelector
            isVideoLoaded={isVideoLoaded}
            onPlaybackRateChange={setPlaybackRate}
            className={styles.playbackRateControl}
          />

          {/* 音量控制 */}
          <VolumeControl
            onVolumeChange={setVolume}
            className={styles.volumeControl}
            sliderClassName={styles.volumeSliderPopup}
            sliderVerticalClassName={styles.volumeSliderVertical}
            textClassName={styles.volumeText}
            buttonClassName={styles.controlBtn}
          />

          {/* 全屏按钮 */}
          <FullscreenButton onFullscreenToggle={onFullscreenToggle} className={styles.controlBtn} />

          {/* 设置按钮 */}
          <SettingsButton
            className={styles.settingsControl}
            popupClassName={styles.settingsPopup}
            buttonClassName={styles.controlBtn}
          />
        </div>
      </div>
    </div>
  )
}
