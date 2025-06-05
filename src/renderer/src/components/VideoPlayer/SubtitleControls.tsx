import React from 'react'
import { Button, Tooltip } from 'antd'
import { EyeInvisibleOutlined, EyeOutlined } from '@ant-design/icons'
import { BACKGROUND_TYPES, type BackgroundType } from '@renderer/hooks/useSubtitleState'
import { useTheme } from '@renderer/hooks/useTheme'

interface SubtitleControlsProps {
  isMaskMode: boolean
  backgroundType: BackgroundType
  buttonSize: number
  iconSize: number
  onToggleMaskMode: () => void
  onToggleBackgroundType: () => void
  onReset: () => void
  onExpandHorizontally: () => void
}

export const SubtitleControls: React.FC<SubtitleControlsProps> = ({
  isMaskMode,
  backgroundType,
  buttonSize,
  iconSize,
  onToggleMaskMode,
  onToggleBackgroundType,
  onReset,
  onExpandHorizontally
}) => {
  const { token, styles } = useTheme()
  const currentBackgroundConfig =
    BACKGROUND_TYPES.find((bg) => bg.type === backgroundType) || BACKGROUND_TYPES[0]

  // Dynamic sizing based on props
  const dynamicSizing: React.CSSProperties = {
    width: `${buttonSize}px`,
    height: `${buttonSize}px`,
    fontSize: `${iconSize}px`
  }

  // Mask mode button styling using theme tokens
  const getMaskModeButtonStyle = (): React.CSSProperties => ({
    ...styles.subtitleControlButton,
    ...dynamicSizing,
    ...(isMaskMode
      ? styles.subtitleControlButtonMaskActive
      : styles.subtitleControlButtonMaskInactive)
  })

  // Regular control button styling using theme tokens
  const getRegularButtonStyle = (): React.CSSProperties => ({
    ...styles.subtitleControlButton,
    ...dynamicSizing,
    color: `${token.colorWhite} !important`
  })

  // Icon styling using theme system
  const getIconStyle = (isMaskButton = false): React.CSSProperties => ({
    ...(isMaskButton ? styles.subtitleControlIconMask : styles.subtitleControlIcon),
    fontSize: `${iconSize}px`
  })

  return (
    <div style={styles.subtitleControls}>
      <Tooltip title={`遮罩模式: ${isMaskMode ? '开启' : '关闭'}`}>
        <Button
          size="small"
          type={isMaskMode ? 'primary' : 'text'}
          onClick={(e) => {
            e.stopPropagation()
            onToggleMaskMode()
          }}
          style={getMaskModeButtonStyle()}
        >
          {isMaskMode ? (
            <EyeInvisibleOutlined style={getIconStyle(true)} />
          ) : (
            <EyeOutlined style={getIconStyle(true)} />
          )}
        </Button>
      </Tooltip>
      <Tooltip title={`背景类型: ${currentBackgroundConfig.label}`}>
        <Button
          size="small"
          type="text"
          onClick={(e) => {
            e.stopPropagation()
            onToggleBackgroundType()
          }}
          style={getRegularButtonStyle()}
        >
          <span style={getIconStyle()}>{currentBackgroundConfig.icon}</span>
        </Button>
      </Tooltip>
      <Tooltip title="重置位置和大小">
        <Button
          size="small"
          type="text"
          onClick={(e) => {
            e.stopPropagation()
            onReset()
          }}
          style={getRegularButtonStyle()}
        >
          <span style={getIconStyle()}>↺</span>
        </Button>
      </Tooltip>
      <Tooltip title="铺满左右区域">
        <Button
          size="small"
          type="text"
          onClick={(e) => {
            e.stopPropagation()
            onExpandHorizontally()
          }}
          style={getRegularButtonStyle()}
        >
          <span style={getIconStyle()}>↔</span>
        </Button>
      </Tooltip>
    </div>
  )
}
