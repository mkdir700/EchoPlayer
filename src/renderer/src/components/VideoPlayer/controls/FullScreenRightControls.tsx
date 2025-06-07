import React from 'react'
import { VolumeControl, FullscreenButton, SettingsButton } from './index'
import { useTheme } from '@renderer/hooks/useTheme'

interface FullScreenRightControlsProps {
  volume: number // 保留用于向后兼容，但不再使用
  isFullscreen: boolean // 保留用于向后兼容，但不再使用
  showControls: boolean // 保留用于向后兼容，但不再使用
  onVolumeChange: (value: number) => void // 保留用于向后兼容，但不再使用
  onFullscreenToggle: () => void
}

export function FullScreenRightControls({
  onFullscreenToggle
}: FullScreenRightControlsProps): React.JSX.Element {
  const { styles } = useTheme()

  return (
    <div style={styles.fullscreenControlsRight}>
      <div style={styles.fullscreenControlGroup}>
        {/* 音量控制 - 复用现有的VolumeControl组件 */}
        <VolumeControl variant="fullscreen" />

        {/* 全屏按钮 - 复用现有的FullscreenButton组件 */}
        <FullscreenButton variant="fullscreen" onFullscreenToggle={onFullscreenToggle} />

        {/* 设置按钮 - 复用现有的SettingsButton组件 */}
        <div style={styles.fullscreenSettingsControl}>
          <SettingsButton variant="fullscreen" />
        </div>
      </div>
    </div>
  )
}
