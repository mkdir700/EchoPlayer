import React, { useState, useEffect, memo } from 'react'
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
  FastForwardOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
  LeftOutlined,
  RightOutlined
} from '@ant-design/icons'
import { VideoProgressBar } from './VideoProgressBar'

// 导入样式
import styles from './VideoControlsFullScreen.module.css'

const { Text } = Typography

interface VideoControlsFullScreenProps {
  showControls: boolean
  isVideoLoaded: boolean
  isPlaying: boolean
  videoError: string | null
  isLooping: boolean
  autoSkipSilence: boolean
  isFullscreen: boolean
  playbackRate: number
  volume: number
  onStepBackward: () => void
  onPlayPause: () => void
  onStepForward: () => void
  onPlaybackRateChange: (value: number) => void
  onVolumeChange: (value: number) => void
  onLoopToggle: () => void
  onAutoSkipToggle: () => void
  onFullscreenToggle: () => void
  onPreviousSubtitle: () => void
  onNextSubtitle: () => void
}

function VideoControlsFullScreen({
  showControls,
  isVideoLoaded,
  isPlaying,
  videoError,
  playbackRate,
  volume,
  isLooping,
  autoSkipSilence,
  isFullscreen,
  onStepBackward,
  onPlayPause,
  onStepForward,
  onPlaybackRateChange,
  onVolumeChange,
  onLoopToggle,
  onAutoSkipToggle,
  onFullscreenToggle,
  onPreviousSubtitle,
  onNextSubtitle
}: VideoControlsFullScreenProps): React.JSX.Element {
  const [showVolumeSlider, setShowVolumeSlider] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  // 自动隐藏设置面板
  useEffect(() => {
    if (!showControls) {
      setShowSettings(false)
      setShowVolumeSlider(false)
    }
  }, [showControls])

  return (
    <>
      {/* 顶部进度条 - 独立组件 */}
      <VideoProgressBar />

      {/* 中央播放按钮 - 仅在暂停时显示 */}
      {!isPlaying && showControls && (
        <div className={styles.centerPlayButton}>
          <Button
            icon={<PlayCircleOutlined />}
            onClick={onPlayPause}
            size="large"
            type="text"
            className={styles.centerPlayBtn}
            disabled={!isVideoLoaded && !videoError}
          />
        </div>
      )}

      {/* 主控制栏 - 悬停时显示 */}
      <div className={`${styles.videoControlsBar} ${showControls ? styles.visible : ''}`}>
        {/* 左侧控制区 - 功能按钮 */}
        <div className={styles.controlsLeft}>
          <div className={styles.controlGroup}>
            {/* 循环播放 */}
            <Tooltip title={isLooping ? '关闭循环播放' : '开启循环播放'}>
              <Button
                icon={<ReloadOutlined />}
                onClick={onLoopToggle}
                type="text"
                className={`${styles.controlBtn} ${isLooping ? styles.activeBtn : ''}`}
                disabled={!isVideoLoaded}
              />
            </Tooltip>

            {/* 自动跳过无对话 */}
            <Tooltip title={autoSkipSilence ? '关闭自动跳过' : '开启自动跳过无对话'}>
              <Button
                icon={<FastForwardOutlined />}
                onClick={onAutoSkipToggle}
                type="text"
                className={`${styles.controlBtn} ${autoSkipSilence ? styles.activeBtn : ''}`}
                disabled={!isVideoLoaded}
              />
            </Tooltip>

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
          </div>
        </div>

        {/* 中间控制区 - 播放控制 */}
        <div className={styles.controlsCenter}>
          <div className={styles.controlGroup}>
            {/* 上一句字幕 */}
            <Tooltip title="上一句字幕">
              <Button
                icon={<StepBackwardOutlined />}
                onClick={onPreviousSubtitle}
                type="text"
                className={styles.controlBtn}
                disabled={!isVideoLoaded}
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
              />
            </Tooltip>
          </div>

          {/* 播放/暂停 */}
          <Button
            icon={isPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
            onClick={onPlayPause}
            type="text"
            className={`${styles.controlBtn} ${styles.playPauseBtn}`}
            disabled={!isVideoLoaded && !videoError}
          />

          <div className={styles.controlGroup}>
            {/* 前进10秒 */}
            <Tooltip title="前进10秒">
              <Button
                icon={<RightOutlined />}
                onClick={onStepForward}
                type="text"
                className={styles.controlBtn}
                disabled={!isVideoLoaded}
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
              />
            </Tooltip>
          </div>
        </div>

        {/* 右侧控制区 - 系统控制 */}
        <div className={styles.controlsRight}>
          <div className={styles.controlGroup}>
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
            <Tooltip title={isFullscreen ? '退出全屏' : '进入全屏'}>
              <Button
                icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
                onClick={onFullscreenToggle}
                type="text"
                className={styles.controlBtn}
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
    </>
  )
}

// 自定义比较函数，只在必要时重新渲染
const arePropsEqual = (
  prevProps: VideoControlsFullScreenProps,
  nextProps: VideoControlsFullScreenProps
): boolean => {
  // 比较控制状态
  if (prevProps.showControls !== nextProps.showControls) return false
  if (prevProps.isPlaying !== nextProps.isPlaying) return false
  if (prevProps.isVideoLoaded !== nextProps.isVideoLoaded) return false
  if (prevProps.videoError !== nextProps.videoError) return false
  if (prevProps.isFullscreen !== nextProps.isFullscreen) return false

  // 比较其他控制属性
  if (prevProps.isLooping !== nextProps.isLooping) return false
  if (prevProps.autoSkipSilence !== nextProps.autoSkipSilence) return false

  // 🚫 不比较 currentTime 和 duration
  // 这些属性会频繁变化，但 VideoProgressBar 组件会单独处理
  // 其他UI元素不需要因为时间变化而重新渲染

  return true
}

// 导出 memo 包装的组件
const MemoizedVideoControlsFullScreen = memo(VideoControlsFullScreen, arePropsEqual)

export { MemoizedVideoControlsFullScreen as VideoControlsFullScreen }
