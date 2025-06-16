/**
 * 字幕占位符组件
 * Subtitle placeholder component
 */

import React from 'react'
import { Typography } from 'antd'
import { useTheme } from '@renderer/hooks/features/ui/useTheme'

const { Text } = Typography

export interface SubtitlePlaceholderProps {
  message: string
}

/**
 * 字幕占位符组件 - 显示空状态或加载状态的占位文本
 * Subtitle placeholder component - Display placeholder text for empty or loading states
 */
export const SubtitlePlaceholder: React.FC<SubtitlePlaceholderProps> = ({ message }) => {
  const { styles } = useTheme()

  const placeholderStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
    color: 'rgba(255, 255, 255, 0.4)',
    fontStyle: 'italic',
    textShadow: '0 1px 2px rgba(0, 0, 0, 0.6)'
  }

  return (
    <div style={placeholderStyle}>
      <Text style={styles.subtitleTextHidden}>{message}</Text>
    </div>
  )
}

SubtitlePlaceholder.displayName = 'SubtitlePlaceholder'
