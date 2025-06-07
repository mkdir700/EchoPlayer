import React from 'react'
import { Button } from 'antd'
import { PlayCircleOutlined } from '@ant-design/icons'
import styles from '../VideoControlsFullScreen.module.css'

interface FullScreenCenterPlayButtonProps {
  isPlaying: boolean
  showControls: boolean
  isVideoLoaded: boolean
  videoError: string | null
  onPlayPause: () => void
}

export function FullScreenCenterPlayButton({
  isPlaying,
  showControls,
  isVideoLoaded,
  videoError,
  onPlayPause
}: FullScreenCenterPlayButtonProps): React.JSX.Element | null {
  // 只在暂停且控制条显示时显示中央播放按钮
  // Only show center play button when paused and controls are visible
  if (isPlaying || !showControls) {
    return null
  }

  return (
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
  )
}
