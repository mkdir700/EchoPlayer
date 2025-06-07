import React from 'react'
import { Button, Select, Tooltip } from 'antd'
import { ReloadOutlined, FastForwardOutlined, ThunderboltOutlined } from '@ant-design/icons'
import styles from '../VideoControlsFullScreen.module.css'

interface FullScreenLeftControlsProps {
  isVideoLoaded: boolean
  isLooping: boolean
  autoSkipSilence: boolean
  playbackRate: number
  onLoopToggle: () => void
  onAutoSkipToggle: () => void
  onPlaybackRateChange: (value: number) => void
}

export function FullScreenLeftControls({
  isVideoLoaded,
  isLooping,
  autoSkipSilence,
  playbackRate,
  onLoopToggle,
  onAutoSkipToggle,
  onPlaybackRateChange
}: FullScreenLeftControlsProps): React.JSX.Element {
  return (
    <div className={styles.controlsLeft}>
      <div className={styles.controlGroup}>
        {/* 循环播放 Loop Toggle */}
        <Tooltip title={isLooping ? '关闭循环播放' : '开启循环播放'}>
          <Button
            icon={<ReloadOutlined />}
            onClick={onLoopToggle}
            type="text"
            className={`${styles.controlBtn} ${isLooping ? styles.activeBtn : ''}`}
            disabled={!isVideoLoaded}
          />
        </Tooltip>

        {/* 自动跳过无对话 Auto Skip Silence */}
        <Tooltip title={autoSkipSilence ? '关闭自动跳过' : '开启自动跳过无对话'}>
          <Button
            icon={<FastForwardOutlined />}
            onClick={onAutoSkipToggle}
            type="text"
            className={`${styles.controlBtn} ${autoSkipSilence ? styles.activeBtn : ''}`}
            disabled={!isVideoLoaded}
          />
        </Tooltip>

        {/* 播放倍数 Playback Rate */}
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
  )
}
