import React from 'react'
import { VolumeControl, FullscreenButton, SettingsButton, PlaybackRateSelector } from './index'
import { useTheme } from '@renderer/hooks/useTheme'

export function FullScreenRightControls(): React.JSX.Element {
  const { styles } = useTheme()

  return (
    <div style={styles.fullscreenControlsRight}>
      <div style={styles.fullscreenControlGroup}>
        {/* 播放倍数 - 使用全屏模式变体 */}
        {/* HACK: 临时解决全屏模式下播放倍数选择器不显示的问题 */}
        <PlaybackRateSelector isVideoLoaded={true} variant="fullscreen" />

        {/* 音量控制 - 复用现有的VolumeControl组件 */}
        <VolumeControl variant="fullscreen" />

        {/* 全屏按钮 - 复用现有的FullscreenButton组件 */}
        <FullscreenButton variant="fullscreen" />

        {/* 设置按钮 - 复用现有的SettingsButton组件 */}
        <div style={styles.fullscreenSettingsControl}>
          <SettingsButton variant="fullscreen" />
        </div>
      </div>
    </div>
  )
}
