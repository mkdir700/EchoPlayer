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
  const { styles } = useTheme()
  const currentBackgroundConfig =
    BACKGROUND_TYPES.find((bg) => bg.type === backgroundType) || BACKGROUND_TYPES[0]

  const dynamicControlButtonStyle: React.CSSProperties = {
    width: `${buttonSize}px`,
    height: `${buttonSize}px`,
    fontSize: `${iconSize}px`
  }

  // Enhanced styling for mask mode button with high contrast
  const maskModeButtonStyle: React.CSSProperties = {
    ...styles.subtitleControlButton,
    ...dynamicControlButtonStyle,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    ...(isMaskMode
      ? {
          ...styles.subtitleControlButtonActive,
          background: 'linear-gradient(135deg, #ff4d4f, #ff7875) !important',
          color: '#ffffff !important',
          boxShadow: '0 0 15px rgba(255, 77, 79, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.4)',
          border: '2px solid #ffffff !important',
          transform: 'scale(1.08)'
        }
      : {
          background: 'rgba(255, 255, 255, 0.9) !important',
          color: '#1890ff !important',
          border: '2px solid rgba(24, 144, 255, 0.8) !important',
          backdropFilter: 'blur(8px)',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
        })
  }

  // High contrast icon styling
  const iconStyle: React.CSSProperties = {
    fontSize: `${iconSize}px`,
    lineHeight: 1,
    fontWeight: 'bold' as const,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center'
  }

  // Mask mode icon styling with perfect alignment
  const maskIconStyle: React.CSSProperties = {
    fontSize: `${iconSize}px`,
    lineHeight: 1,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#ffffff',
    filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.8))',
    verticalAlign: 'middle',
    height: '100%',
    width: '100%'
  }

  // Regular icon styling with high contrast
  const regularIconStyle: React.CSSProperties = {
    ...iconStyle,
    color: '#ffffff',
    filter: 'drop-shadow(0 1px 3px rgba(0, 0, 0, 0.9))',
    textShadow: '0 1px 2px rgba(0, 0, 0, 1), 0 0 4px rgba(0, 0, 0, 0.8)'
  }

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
          style={maskModeButtonStyle}
        >
          {isMaskMode ? (
            <EyeInvisibleOutlined style={maskIconStyle} />
          ) : (
            <EyeOutlined style={maskIconStyle} />
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
          style={{
            ...styles.subtitleControlButton,
            ...dynamicControlButtonStyle,
            color: '#ffffff !important'
          }}
        >
          <span style={regularIconStyle}>{currentBackgroundConfig.icon}</span>
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
          style={{
            ...styles.subtitleControlButton,
            ...dynamicControlButtonStyle,
            color: '#ffffff !important'
          }}
        >
          <span style={regularIconStyle}>↺</span>
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
          style={{
            ...styles.subtitleControlButton,
            ...dynamicControlButtonStyle,
            color: '#ffffff !important'
          }}
        >
          <span style={regularIconStyle}>↔</span>
        </Button>
      </Tooltip>
    </div>
  )
}
