import React from 'react'
import { Button } from 'antd'
import { PlayCircleOutlined } from '@ant-design/icons'
import { useTheme } from '@renderer/hooks/features/ui/useTheme'

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
  const { styles } = useTheme()

  // 只在暂停时且控制栏隐藏时显示中央播放按钮
  if (isPlaying || showControls || !isVideoLoaded || videoError) {
    return null
  }

  return (
    <div style={styles.fullscreenCenterPlayButton}>
      <Button
        icon={<PlayCircleOutlined />}
        onClick={(e) => {
          onPlayPause()
          e.currentTarget.blur()
        }}
        type="text"
        style={styles.fullscreenCenterPlayBtn}
        size="large"
      />
    </div>
  )
}
