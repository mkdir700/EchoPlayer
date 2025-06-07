import React from 'react'
import { LoopToggleButton, AutoPauseButton, PlaybackRateSelector } from './index'
import { useTheme } from '@renderer/hooks/useTheme'

interface FullScreenLeftControlsProps {
  isVideoLoaded: boolean
}

export function FullScreenLeftControls({
  isVideoLoaded
}: FullScreenLeftControlsProps): React.JSX.Element {
  const { styles } = useTheme()

  return (
    <div style={styles.fullscreenControlsLeft}>
      <div style={styles.fullscreenControlGroup}>
        {/* 循环播放 - 使用全屏模式变体 */}
        <LoopToggleButton isVideoLoaded={isVideoLoaded} variant="fullscreen" />

        {/* 自动暂停 - 使用全屏模式变体 */}
        <AutoPauseButton isVideoLoaded={isVideoLoaded} variant="fullscreen" />

        {/* 播放倍数 - 使用全屏模式变体 */}
        <PlaybackRateSelector isVideoLoaded={isVideoLoaded} variant="fullscreen" />
      </div>
    </div>
  )
}
