import React, { useState, useEffect, useRef } from 'react'
import { Button, Slider, Typography, Select, Tooltip } from 'antd'
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  StepBackwardOutlined,
  StepForwardOutlined,
  SoundOutlined,
  SoundFilled,
  ThunderboltOutlined,
  SettingOutlined,
  ReloadOutlined,
  VerticalAlignTopOutlined,
  VerticalAlignBottomOutlined,
  FullscreenOutlined,
  LeftOutlined,
  RightOutlined,
  TranslationOutlined,
  PauseCircleFilled
} from '@ant-design/icons'
import type { DisplayMode } from '@renderer/types'
import type { VideoControlsProps } from '@renderer/types'

// 导入样式
import styles from './VideoControlsCompact.module.css'

const { Text } = Typography

// 显示模式配置
const DISPLAY_MODE_CONFIG = {
  none: { label: '隐藏', color: '#ff4d4f' },
  original: { label: '原始', color: '#1890ff' },
  chinese: { label: '中文', color: '#52c41a' },
  english: { label: 'English', color: '#722ed1' },
  bilingual: { label: '双语', color: '#fa8c16' }
}

export function VideoControlsCompact({
  duration,
  currentTime,
  isVideoLoaded,
  isPlaying,
  videoError,
  playbackRate,
  volume,
  isLooping,
  autoPause,
  autoSkipSilence,
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
  const [showVolumeSlider, setShowVolumeSlider] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showSubtitleModeSelector, setShowSubtitleModeSelector] = useState(false)
  const subtitleModeSelectorRef = useRef<HTMLDivElement>(null)

  // 格式化时间显示
  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  // 点击外部关闭字幕模式选择器
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      if (
        subtitleModeSelectorRef.current &&
        !subtitleModeSelectorRef.current.contains(event.target as Node)
      ) {
        setShowSubtitleModeSelector(false)
      }
    }

    if (showSubtitleModeSelector) {
      document.addEventListener('mousedown', handleClickOutside)
      return (): void => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
    return undefined
  }, [showSubtitleModeSelector])

  // 获取当前模式的配置
  const validDisplayMode = Object.keys(DISPLAY_MODE_CONFIG).includes(displayModeRef.current)
    ? displayModeRef.current
    : 'bilingual'
  const currentModeConfig = DISPLAY_MODE_CONFIG[validDisplayMode]

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
          <Tooltip title={isLooping ? '关闭单句循环' : '开启单句循环'}>
            <Button
              icon={<ReloadOutlined />}
              onClick={onLoopToggle}
              type="text"
              className={`${styles.controlBtn} ${isLooping ? styles.activeBtn : ''}`}
              disabled={!isVideoLoaded}
              size="small"
            />
          </Tooltip>

          {/* 自动暂停 */}
          <Tooltip title={autoPause ? '关闭自动暂停' : '开启自动暂停'}>
            <Button
              icon={<PauseCircleFilled />}
              onClick={onAutoSkipToggle}
              type="text"
              className={`${styles.controlBtn} ${autoSkipSilence ? styles.activeBtn : ''}`}
              disabled={!isVideoLoaded}
              size="small"
            />
          </Tooltip>

          {/* 字幕位置 */}
          <Tooltip title={`字幕显示在${subtitlePosition === 'top' ? '上方' : '下方'}`}>
            <Button
              icon={
                subtitlePosition === 'top' ? (
                  <VerticalAlignTopOutlined />
                ) : (
                  <VerticalAlignBottomOutlined />
                )
              }
              onClick={onSubtitlePositionToggle}
              type="text"
              className={styles.controlBtn}
              size="small"
            />
          </Tooltip>

          {/* 字幕显示模式控制 */}
          <div className={styles.subtitleModeControl}>
            {/* 字幕模式切换按钮 */}
            <Tooltip title={`字幕模式: ${currentModeConfig.label} (点击切换)`}>
              <Button
                type="text"
                size="small"
                icon={<TranslationOutlined />}
                onClick={() => setShowSubtitleModeSelector(!showSubtitleModeSelector)}
                style={{ color: currentModeConfig.color }}
                className={`${styles.controlBtn} ${showSubtitleModeSelector ? styles.activeBtn : ''}`}
              />
            </Tooltip>

            {/* 展开的模式选择器 */}
            {showSubtitleModeSelector && (
              <div className={styles.subtitleModeSelector} ref={subtitleModeSelectorRef}>
                {Object.entries(DISPLAY_MODE_CONFIG).map(([mode, config]) => (
                  <Button
                    key={mode}
                    type={displayModeRef.current === mode ? 'primary' : 'text'}
                    size="small"
                    onClick={() => {
                      onDisplayModeChange(mode as DisplayMode)
                      setShowSubtitleModeSelector(false)
                    }}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      color: displayModeRef.current === mode ? '#fff' : config.color,
                      marginBottom: '4px'
                    }}
                  >
                    {config.label}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 中央播放控制 */}
        <div className={styles.centerControls}>
          {/* 上一句字幕 */}
          <Tooltip title="上一句字幕">
            <Button
              icon={<StepBackwardOutlined />}
              onClick={onPreviousSubtitle}
              type="text"
              className={styles.controlBtn}
              disabled={!isVideoLoaded}
              size="small"
            />
          </Tooltip>

          {/* 后退10秒 */}
          <Tooltip title="后退10秒">
            <Button
              icon={<LeftOutlined />}
              onClick={onStepBackward}
              type="text"
              className={styles.controlBtn}
              disabled={!isVideoLoaded}
              size="small"
            />
          </Tooltip>

          {/* 播放/暂停 */}
          <Button
            icon={isPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
            onClick={onPlayPause}
            type="text"
            className={`${styles.controlBtn} ${styles.playPauseBtn}`}
            disabled={!isVideoLoaded && !videoError}
          />

          {/* 前进10秒 */}
          <Tooltip title="前进10秒">
            <Button
              icon={<RightOutlined />}
              onClick={onStepForward}
              type="text"
              className={styles.controlBtn}
              disabled={!isVideoLoaded}
              size="small"
            />
          </Tooltip>

          {/* 下一句字幕 */}
          <Tooltip title="下一句字幕">
            <Button
              icon={<StepForwardOutlined />}
              onClick={onNextSubtitle}
              type="text"
              className={styles.controlBtn}
              disabled={!isVideoLoaded}
              size="small"
            />
          </Tooltip>
        </div>

        {/* 右侧系统控制 */}
        <div className={styles.rightControls}>
          {/* 播放倍数 */}
          <div className={styles.playbackRateControl}>
            <Tooltip title="播放速度">
              <Select
                value={playbackRate}
                onChange={onPlaybackRateChange}
                className={styles.playbackRateSelect}
                disabled={!isVideoLoaded}
                size="small"
                suffixIcon={<ThunderboltOutlined />}
                options={[
                  { value: 0.25, label: '0.25x' },
                  { value: 0.5, label: '0.5x' },
                  { value: 0.75, label: '0.75x' },
                  { value: 1, label: '1x' },
                  { value: 1.25, label: '1.25x' },
                  { value: 1.5, label: '1.5x' },
                  { value: 1.75, label: '1.75x' },
                  { value: 2, label: '2x' }
                ]}
              />
            </Tooltip>
          </div>

          {/* 音量控制 */}
          <div
            className={styles.volumeControl}
            onMouseEnter={() => setShowVolumeSlider(true)}
            onMouseLeave={() => setShowVolumeSlider(false)}
          >
            <Tooltip title={`音量: ${Math.round(volume * 100)}%`}>
              <Button
                icon={volume > 0 ? <SoundFilled /> : <SoundOutlined />}
                type="text"
                className={styles.controlBtn}
                size="small"
              />
            </Tooltip>

            {showVolumeSlider && (
              <div className={styles.volumeSliderPopup}>
                <Slider
                  vertical
                  min={0}
                  max={1}
                  step={0.05}
                  value={volume}
                  onChange={onVolumeChange}
                  className={styles.volumeSliderVertical}
                />
                <Text className={styles.volumeText}>{Math.round(volume * 100)}%</Text>
              </div>
            )}
          </div>

          {/* 全屏按钮 */}
          <Tooltip title="进入全屏">
            <Button
              icon={<FullscreenOutlined />}
              onClick={onFullscreenToggle}
              type="text"
              className={styles.controlBtn}
              size="small"
            />
          </Tooltip>

          {/* 设置按钮 */}
          <div className={styles.settingsControl}>
            <Tooltip title="更多设置">
              <Button
                icon={<SettingOutlined />}
                type="text"
                className={styles.controlBtn}
                onClick={() => setShowSettings(!showSettings)}
                size="small"
              />
            </Tooltip>

            {showSettings && (
              <div className={styles.settingsPopup}>
                <div className={styles.settingsContent}>
                  <Text className={styles.settingsTitle}>播放设置</Text>
                  <div className={styles.settingsItem}>
                    <Text className={styles.settingsLabel}>更多功能即将推出...</Text>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
