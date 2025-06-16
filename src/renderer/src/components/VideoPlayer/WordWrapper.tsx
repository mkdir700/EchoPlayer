/**
 * 单词包装器组件
 * Word wrapper component for handling hover states, clicks, and text selection
 */

import React, { useState } from 'react'
import { useTheme } from '@renderer/hooks/features/ui/useTheme'

export interface WordWrapperProps {
  children?: React.ReactNode
  isClickable: boolean
  onWordHover: (isHovering: boolean) => void
  onWordClick?: (event: React.MouseEvent) => void
  // 划词选中相关属性 / Text selection related props
  wordIndex?: number
  charIndex?: number
  isSelected?: boolean
  onSelectionMouseDown?: (wordIndex: number, charIndex?: number) => (e: React.MouseEvent) => void
  onSelectionMouseEnter?: (wordIndex: number, charIndex?: number) => void
}

/**
 * 单词包装器组件 - 处理悬停状态、点击和文本选择
 * Word wrapper component - Handle hover states, clicks, and text selection
 */
export const WordWrapper: React.FC<WordWrapperProps> = ({
  children,
  isClickable,
  onWordHover,
  onWordClick,
  wordIndex,
  charIndex,
  isSelected = false,
  onSelectionMouseDown,
  onSelectionMouseEnter
}) => {
  const { styles, token } = useTheme()
  const [isHovered, setIsHovered] = useState(false)

  const handleMouseEnter = (): void => {
    setIsHovered(true)
    onWordHover(true)

    // 处理划词选中的鼠标进入事件 / Handle text selection mouse enter
    if (typeof wordIndex === 'number' && onSelectionMouseEnter) {
      onSelectionMouseEnter(wordIndex, charIndex)
    }
  }

  const handleMouseLeave = (): void => {
    setIsHovered(false)
    onWordHover(false)
  }

  const handleMouseDown = (e: React.MouseEvent): void => {
    // 处理划词选中的鼠标按下事件 / Handle text selection mouse down
    if (typeof wordIndex === 'number' && onSelectionMouseDown) {
      const selectionHandler = onSelectionMouseDown(wordIndex, charIndex)
      selectionHandler(e)
    }
  }

  const baseStyle = {
    ...styles.subtitleWord,
    ...(isClickable ? styles.subtitleWordClickable : {})
  }

  const hoverStyle = isHovered
    ? isClickable
      ? styles.subtitleWordClickableHover
      : styles.subtitleWordHover
    : {}

  // 选中状态样式 / Selection state style
  const selectionStyle = isSelected
    ? {
        backgroundColor: token.colorPrimary + '80', // 80% 透明度，更明显 / 80% transparency, more visible
        color: token.colorWhite, // 使用白色文字确保对比度 / Use white text for better contrast
        padding: '1px 2px' // 添加轻微内边距 / Add slight padding
      }
    : {}

  return (
    <span
      data-word-wrapper
      className={isClickable ? 'clickableWord' : undefined}
      style={{ ...baseStyle, ...hoverStyle, ...selectionStyle }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onClick={onWordClick}
    >
      {children}
    </span>
  )
}

WordWrapper.displayName = 'WordWrapper'
