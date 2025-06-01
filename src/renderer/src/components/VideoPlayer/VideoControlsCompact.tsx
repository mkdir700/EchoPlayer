import React from 'react'
import { Slider, Typography } from 'antd'
import type { VideoControlsProps } from '@renderer/types'

// 导入样式
import styles from './VideoControlsCompact.module.css'

// 导入控制按钮组件
import {
  LoopToggleButton,
  AutoPauseButton,
  SubtitlePositionButton,
  SubtitleModeSelector,
  PlaybackControlButtons,
  PlaybackRateSelector,
  VolumeControl,
  FullscreenButton,
  SettingsButton
} from './controls'

const { Text } = Typography

export function VideoControlsCompact({
  duration,
  currentTime,
  isVideoLoaded,
  isPlaying,
  videoError,
  isLooping,
  autoPause,
  subtitlePosition,
  displayModeRef,
  onSeek,
  onStepBackward,
  onPlayPause,
  onStepForward,
  onPlaybackRateChange,
  onVolumeChange,
  onLoopToggle,
  onAutoSkipToggle,
  onSubtitlePositionToggle,
  onFullscreenToggle,
  onPreviousSubtitle,
  onNextSubtitle,
  onDisplayModeChange
}: VideoControlsProps): React.JSX.Element {
  // 格式化时间显示
  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  return (
    <div className={styles.compactControlsContainer}>
      {/* 进度条 */}
      <div className={styles.progressSection}>
        <Slider
          min={0}
          max={duration}
          value={currentTime}
          onChange={onSeek}
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

      {/* 主控制区 */}
      <div className={styles.mainControls}>
        {/* 左侧功能按钮 */}
        <div className={styles.leftControls}>
          {/* 循环播放 */}
          <LoopToggleButton
            isLooping={isLooping}
            isVideoLoaded={isVideoLoaded}
            onLoopToggle={onLoopToggle}
            className={`${styles.controlBtn} ${isLooping ? styles.activeBtn : ''}`}
          />

          {/* 自动暂停 */}
          <AutoPauseButton
            autoPause={autoPause}
            isVideoLoaded={isVideoLoaded}
            onAutoSkipToggle={onAutoSkipToggle}
            className={`${styles.controlBtn} ${autoPause ? styles.activeBtn : ''}`}
          />

          {/* 字幕位置 */}
          <SubtitlePositionButton
            subtitlePosition={subtitlePosition}
            onSubtitlePositionToggle={onSubtitlePositionToggle}
          />

          {/* 字幕显示模式控制 */}
          <SubtitleModeSelector
            displayModeRef={displayModeRef}
            onDisplayModeChange={onDisplayModeChange}
          />
        </div>

        {/* 中央播放控制 */}
        <PlaybackControlButtons
          isPlaying={isPlaying}
          isVideoLoaded={isVideoLoaded}
          videoError={videoError}
          onPreviousSubtitle={onPreviousSubtitle}
          onStepBackward={onStepBackward}
          onPlayPause={onPlayPause}
          onStepForward={onStepForward}
          onNextSubtitle={onNextSubtitle}
          className={styles.centerControls}
          buttonClassName={styles.controlBtn}
          playPauseClassName={styles.playPauseBtn}
        />

        {/* 右侧系统控制 */}
        <div className={styles.rightControls}>
          {/* 播放倍数 */}
          <PlaybackRateSelector
            isVideoLoaded={isVideoLoaded}
            onPlaybackRateChange={onPlaybackRateChange}
            className={styles.playbackRateControl}
          />

          {/* 音量控制 */}
          <VolumeControl
            onVolumeChange={onVolumeChange}
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
