import React from 'react'
import { Button, Tooltip } from 'antd'
import { VerticalAlignTopOutlined, VerticalAlignBottomOutlined } from '@ant-design/icons'
import styles from '../VideoControlsCompact.module.css'

interface SubtitlePositionButtonProps {
  subtitlePosition: 'top' | 'bottom'
  onSubtitlePositionToggle: () => void
  className?: string
}

export function SubtitlePositionButton({
  subtitlePosition,
  onSubtitlePositionToggle
}: SubtitlePositionButtonProps): React.JSX.Element {
  return (
    <Tooltip title={`字幕显示在${subtitlePosition === 'top' ? '上方' : '下方'}`}>
      <Button
        icon={
          subtitlePosition === 'top' ? (
            <VerticalAlignTopOutlined />
          ) : (
            <VerticalAlignBottomOutlined />
          )
        }
        onClick={(e) => {
          onSubtitlePositionToggle()
          e.currentTarget.blur() // 点击后立即移除焦点，避免空格键触发
        }}
        type="text"
        className={`${styles.controlBtn} ${styles.subtitlePositionControl}`}
        size="small"
      />
    </Tooltip>
  )
}
