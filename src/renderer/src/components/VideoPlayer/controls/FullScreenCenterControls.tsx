import React from 'react'
import { PlaybackControlButtons } from './index'
import { useTheme } from '@renderer/hooks/useTheme'

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
  videoError,
  onStepBackward,
  onPlayPause,
  onStepForward,
  onPreviousSubtitle,
  onNextSubtitle
}: FullScreenCenterControlsProps): React.JSX.Element {
  const { styles } = useTheme()

  return (
    <div style={styles.fullscreenControlsCenter}>
      {/* 播放控制按钮 - 复用现有的PlaybackControlButtons组件 */}
      <PlaybackControlButtons
        isVideoLoaded={isVideoLoaded}
        videoError={videoError}
        onPreviousSubtitle={onPreviousSubtitle}
        onStepBackward={onStepBackward}
        onPlayPause={onPlayPause}
        onStepForward={onStepForward}
        onNextSubtitle={onNextSubtitle}
        variant="fullscreen"
      />
    </div>
  )
}
