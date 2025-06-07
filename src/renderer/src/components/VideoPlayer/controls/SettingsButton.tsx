import React, { useState } from 'react'
import { Button, Tooltip, Typography } from 'antd'
import { SettingOutlined } from '@ant-design/icons'
import { useTheme } from '@renderer/hooks/useTheme'

const { Text } = Typography

interface SettingsButtonProps {
  variant?: 'compact' | 'fullscreen' // 新增：支持不同的显示模式
}

export function SettingsButton({ variant = 'compact' }: SettingsButtonProps): React.JSX.Element {
  const [showSettings, setShowSettings] = useState(false)
  const { styles } = useTheme()

  // 根据变体类型选择样式 / Choose styles based on variant type
  const getButtonStyles = (): React.CSSProperties => {
    if (variant === 'fullscreen') {
      // 全屏模式使用主题系统样式 / Fullscreen mode uses theme system styles
      return styles.fullscreenControlBtn
    }

    // 默认紧凑模式样式 / Default compact mode styles
    return styles.controlBtn
  }

  const getPopupStyles = (): React.CSSProperties => {
    if (variant === 'fullscreen') {
      return styles.fullscreenSettingsPopup
    }
    return {}
  }

  const getContentStyles = (): React.CSSProperties => {
    if (variant === 'fullscreen') {
      return styles.fullscreenSettingsContent
    }
    return {}
  }

  return (
    <>
      <Tooltip title="更多设置">
        <Button
          icon={<SettingOutlined />}
          type="text"
          onClick={(e) => {
            setShowSettings(!showSettings)
            e.currentTarget.blur() // 点击后立即移除焦点，避免空格键触发
          }}
          size="small"
          style={getButtonStyles()}
        />
      </Tooltip>

      {showSettings && (
        <div style={getPopupStyles()}>
          <div style={getContentStyles()}>
            <Text style={styles.fullscreenSettingsTitle}>播放设置</Text>
            <div style={styles.fullscreenSettingsItem}>
              <Text style={styles.fullscreenSettingsLabel}>更多功能即将推出...</Text>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
