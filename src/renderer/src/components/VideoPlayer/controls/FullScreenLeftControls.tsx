import React from 'react'
import { LoopToggleButton, AutoPauseButton, SubtitleModeSelector } from './index'
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

        <SubtitleModeSelector variant="fullscreen" />
      </div>
    </div>
  )
}
