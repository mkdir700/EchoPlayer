import React, { useState } from 'react'
import { Button, Tooltip, Typography } from 'antd'
import { SettingOutlined } from '@ant-design/icons'
import { useTheme } from '@renderer/hooks/features/ui/useTheme'

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
      // 全屏模式强制使用暗黑主题
      return {
        ...styles.fullscreenSettingsPopup,
        background: 'rgba(20, 20, 20, 0.95)', // 强制使用暗色背景
        border: '1px solid rgba(255, 255, 255, 0.1)', // 暗色边框
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.8)', // 更深的阴影
        color: 'rgba(255, 255, 255, 0.9)' // 强制使用白色文字
      }
    }
    return {}
  }

  const getContentStyles = (): React.CSSProperties => {
    if (variant === 'fullscreen') {
      return styles.fullscreenSettingsContent
    }
    return {}
  }

  const getTitleStyles = (): React.CSSProperties => {
    if (variant === 'fullscreen') {
      // 全屏模式强制使用白色文字
      return {
        ...styles.fullscreenSettingsTitle,
        color: 'rgba(255, 255, 255, 0.9)' // 强制使用白色文字
      }
    }
    return styles.fullscreenSettingsTitle
  }

  const getLabelStyles = (): React.CSSProperties => {
    if (variant === 'fullscreen') {
      // 全屏模式强制使用白色文字
      return {
        ...styles.fullscreenSettingsLabel,
        color: 'rgba(255, 255, 255, 0.7)' // 强制使用较透明的白色文字
      }
    }
    return styles.fullscreenSettingsLabel
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
            <Text style={getTitleStyles()}>播放设置</Text>
            <div style={styles.fullscreenSettingsItem}>
              <Text style={getLabelStyles()}>更多功能即将推出...</Text>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
