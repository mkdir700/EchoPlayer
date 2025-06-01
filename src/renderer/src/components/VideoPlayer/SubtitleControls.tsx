import React from 'react'
import { Button, Tooltip } from 'antd'
import { BACKGROUND_TYPES, type BackgroundType } from '@renderer/hooks/useSubtitleState'
import styles from './Subtitle.module.css'

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
  const currentBackgroundConfig =
    BACKGROUND_TYPES.find((bg) => bg.type === backgroundType) || BACKGROUND_TYPES[0]

  const dynamicControlButtonStyle: React.CSSProperties = {
    width: `${buttonSize}px`,
    height: `${buttonSize}px`,
    fontSize: `${iconSize}px`
  }

  return (
    <div className={styles.subtitleControls}>
      <Tooltip title={`遮罩模式: ${isMaskMode ? '开启' : '关闭'}`}>
        <Button
          size="small"
          type={isMaskMode ? 'primary' : 'text'}
          onClick={(e) => {
            e.stopPropagation()
            onToggleMaskMode()
          }}
          className={`${styles.controlButton} ${isMaskMode ? styles.active : ''}`}
          style={dynamicControlButtonStyle}
        >
          <span style={{ fontSize: `${iconSize}px`, lineHeight: 1 }}>{isMaskMode ? '⊞' : '⊡'}</span>
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
          className={styles.controlButton}
          style={dynamicControlButtonStyle}
        >
          <span style={{ fontSize: `${iconSize}px`, lineHeight: 1 }}>
            {currentBackgroundConfig.icon}
          </span>
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
          className={styles.controlButton}
          style={dynamicControlButtonStyle}
        >
          <span style={{ fontSize: `${iconSize}px`, lineHeight: 1 }}>↺</span>
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
          className={styles.controlButton}
          style={dynamicControlButtonStyle}
        >
          <span style={{ fontSize: `${iconSize}px`, lineHeight: 1 }}>↔</span>
        </Button>
      </Tooltip>
    </div>
  )
}
