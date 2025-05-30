import React, { useState } from 'react'
import { Typography } from 'antd'
import { formatTime } from '@renderer/utils/helpers'
import styles from './VideoProgressBar.module.css'
import { useVideoStateRefs, useVideoControls } from '@renderer/hooks/useVideoPlayerHooks'

const { Text } = Typography

export function VideoProgressBar(): React.JSX.Element {
  const [isHovered, setIsHovered] = useState(false)
  const { durationRef, currentTimeRef, isVideoLoadedRef } = useVideoStateRefs()

  const duration = durationRef.current
  const currentTime = currentTimeRef.current
  const isVideoLoaded = isVideoLoadedRef.current
  const { seekTo } = useVideoControls()

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  // 处理进度条点击
  const handleProgressClick = (event: React.MouseEvent<HTMLDivElement>): void => {
    if (!isVideoLoaded || duration === 0) return

    const rect = event.currentTarget.getBoundingClientRect()
    const clickX = event.clientX - rect.left
    const percentage = clickX / rect.width
    const newTime = percentage * duration

    seekTo(Math.max(0, Math.min(duration, newTime)))
  }

  return (
    <div
      className={`${styles.progressContainer} ${isHovered ? styles.enhanced : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleProgressClick}
    >
      <div className={styles.progressTrack}>
        <div className={styles.progressFill} style={{ width: `${progress}%` }} />
        <div className={styles.progressHandle} style={{ left: `${progress}%` }} />
      </div>

      {isHovered && (
        <div className={styles.timeTooltip}>
          <Text className={styles.timeText}>
            {formatTime(currentTime)} / {formatTime(duration)}
          </Text>
        </div>
      )}
    </div>
  )
}
