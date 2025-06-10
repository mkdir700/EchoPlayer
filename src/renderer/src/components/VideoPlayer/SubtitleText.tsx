/**
 * 字幕文本组件集合
 * Subtitle text components collection
 */

import React from 'react'
import { useTheme } from '@renderer/hooks/useTheme'
import { SmartTextContent } from './SmartTextContent'
import RendererLogger from '@renderer/utils/logger'

export interface SubtitleTextProps {
  text: string
  style: React.CSSProperties
  onWordHover: (isHovering: boolean) => void
  onWordClick: (word: string, event: React.MouseEvent) => void
  enableTextSelection?: boolean
  onSelectionChange?: (selectedText: string) => void
}

/**
 * 字幕容器样式常量
 * Subtitle container style constants
 */
const SUBTITLE_CONTAINER_STYLE: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '100%',
  height: '100%',
  textAlign: 'center',
  overflow: 'hidden',
  boxSizing: 'border-box'
}

/**
 * 原始字幕文本组件
 * Original subtitle text component
 */
export const OriginalSubtitleText: React.FC<SubtitleTextProps> = ({
  text,
  style,
  onWordHover,
  onWordClick,
  enableTextSelection = false,
  onSelectionChange
}) => {
  const { styles } = useTheme()

  RendererLogger.componentRender({
    component: 'OriginalSubtitleText',
    props: { text: text.substring(0, 20) + '...' }
  })

  return (
    <div style={SUBTITLE_CONTAINER_STYLE}>
      <SmartTextContent
        text={text}
        style={{ ...styles.subtitleText, ...style }}
        onWordHover={onWordHover}
        onWordClick={onWordClick}
        enableTextSelection={enableTextSelection}
        onSelectionChange={onSelectionChange}
      />
    </div>
  )
}

/**
 * 中文字幕文本组件
 * Chinese subtitle text component
 */
export const ChineseSubtitleText: React.FC<SubtitleTextProps> = ({
  text,
  style,
  onWordHover,
  onWordClick,
  enableTextSelection = false,
  onSelectionChange
}) => {
  const { styles } = useTheme()

  RendererLogger.componentRender({
    component: 'ChineseSubtitleText',
    props: { text: text.substring(0, 20) + '...' }
  })

  return (
    <div style={SUBTITLE_CONTAINER_STYLE}>
      <SmartTextContent
        text={text}
        style={{ ...styles.subtitleText, ...styles.subtitleTextChinese, ...style }}
        onWordHover={onWordHover}
        onWordClick={onWordClick}
        enableTextSelection={enableTextSelection}
        onSelectionChange={onSelectionChange}
      />
    </div>
  )
}

/**
 * 英文字幕文本组件
 * English subtitle text component
 */
export const EnglishSubtitleText: React.FC<SubtitleTextProps> = ({
  text,
  style,
  onWordHover,
  onWordClick,
  enableTextSelection = false,
  onSelectionChange
}) => {
  const { styles } = useTheme()

  return (
    <div style={SUBTITLE_CONTAINER_STYLE}>
      <SmartTextContent
        text={text}
        style={{ ...styles.subtitleText, ...styles.subtitleTextEnglish, ...style }}
        onWordHover={onWordHover}
        onWordClick={onWordClick}
        enableTextSelection={enableTextSelection}
        onSelectionChange={onSelectionChange}
      />
    </div>
  )
}

// Set display names for better debugging
OriginalSubtitleText.displayName = 'OriginalSubtitleText'
ChineseSubtitleText.displayName = 'ChineseSubtitleText'
EnglishSubtitleText.displayName = 'EnglishSubtitleText'
