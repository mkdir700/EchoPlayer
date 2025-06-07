import React from 'react'
import { Button, Tooltip } from 'antd'
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  StepBackwardOutlined,
  StepForwardOutlined,
  LeftOutlined,
  RightOutlined
} from '@ant-design/icons'
import styles from '../VideoControlsFullScreen.module.css'

interface FullScreenCenterControlsProps {
  isVideoLoaded: boolean
  isPlaying: boolean
  videoError: string | null
  onStepBackward: () => void
  onPlayPause: () => void
  onStepForward: () => void
  onPreviousSubtitle: () => void
  onNextSubtitle: () => void
}

export function FullScreenCenterControls({
  isVideoLoaded,
  isPlaying,
  videoError,
  onStepBackward,
  onPlayPause,
  onStepForward,
  onPreviousSubtitle,
  onNextSubtitle
}: FullScreenCenterControlsProps): React.JSX.Element {
  return (
    <div className={styles.controlsCenter}>
      <div className={styles.controlGroup}>
        {/* 上一句字幕 Previous Subtitle */}
        <Tooltip title="上一句字幕">
          <Button
            icon={<StepBackwardOutlined />}
            onClick={onPreviousSubtitle}
            type="text"
            className={styles.controlBtn}
            disabled={!isVideoLoaded}
          />
        </Tooltip>

        {/* 后退10秒 Step Backward 10s */}
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

      {/* 播放/暂停 Play/Pause */}
      <Button
        icon={isPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
        onClick={onPlayPause}
        type="text"
        className={`${styles.controlBtn} ${styles.playPauseBtn}`}
        disabled={!isVideoLoaded && !videoError}
      />

      <div className={styles.controlGroup}>
        {/* 前进10秒 Step Forward 10s */}
        <Tooltip title="前进10秒">
          <Button
            icon={<RightOutlined />}
            onClick={onStepForward}
            type="text"
            className={styles.controlBtn}
            disabled={!isVideoLoaded}
          />
        </Tooltip>

        {/* 下一句字幕 Next Subtitle */}
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
  )
}
