/**
 * 双语字幕组件
 * Bilingual subtitle component
 */

import React from 'react'
import { useTheme } from '@renderer/hooks/features/ui/useTheme'
import { SmartTextContent } from './SmartTextContent'

export interface BilingualSubtitleLineProps {
  text: string
  style: React.CSSProperties
  onWordHover: (isHovering: boolean) => void
  onWordClick: (word: string, event: React.MouseEvent) => void
  language: 'english' | 'chinese' | 'original'
  enableTextSelection?: boolean
  onSelectionChange?: (selectedText: string) => void
}

/**
 * 双语字幕行组件
 * Bilingual subtitle line component
 */
export const BilingualSubtitleLine: React.FC<BilingualSubtitleLineProps> = ({
  text,
  style,
  onWordHover,
  onWordClick,
  language,
  enableTextSelection = false,
  onSelectionChange
}) => {
  const { styles } = useTheme()

  const lineStyle: React.CSSProperties = {
    width: '100%',
    textAlign: 'center',
    margin: 0,
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2px',
    boxSizing: 'border-box'
  }

  const getTextStyle = (): React.CSSProperties => {
    const baseStyle = { ...styles.subtitleText, ...style }
    switch (language) {
      case 'english':
        return { ...baseStyle, ...styles.subtitleTextEnglish }
      case 'chinese':
        return { ...baseStyle, ...styles.subtitleTextChinese }
      default:
        return baseStyle
    }
  }

  return (
    <div style={lineStyle}>
      <SmartTextContent
        text={text}
        style={getTextStyle()}
        onWordHover={onWordHover}
        onWordClick={onWordClick}
        enableTextSelection={enableTextSelection}
        onSelectionChange={onSelectionChange}
      />
    </div>
  )
}

BilingualSubtitleLine.displayName = 'BilingualSubtitleLine'
