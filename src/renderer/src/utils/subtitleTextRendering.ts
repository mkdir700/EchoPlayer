/**
 * 字幕文本渲染工具函数
 * Subtitle text rendering utility functions
 */

import React from 'react'
import { WordWrapper } from '@renderer/components/VideoPlayer/WordWrapper'
import {
  createTextSplitResult,
  isClickableChineseChar,
  isClickableWord,
  cleanWordText
} from './subtitleTextProcessing'

/**
 * 带主题集成的增强文本分割函数
 * Enhanced text splitting function with theme integration
 */
export const splitTextWithTheme = (
  text: string,
  onWordHover: (isHovering: boolean) => void,
  onWordClick: (word: string, event: React.MouseEvent) => void
): React.ReactNode[] => {
  const { isChineseText: isChinese, renderTokens } = createTextSplitResult(text)

  if (isChinese) {
    return renderTokens.map((char, index) => {
      const isClickableChar = isClickableChineseChar(char)

      return React.createElement(
        WordWrapper,
        {
          key: index,
          isClickable: isClickableChar,
          onWordHover,
          onWordClick: isClickableChar
            ? (e: React.MouseEvent) => {
                e.stopPropagation()
                e.preventDefault()
                onWordClick(char, e)
              }
            : undefined
        },
        char
      )
    })
  } else {
    return renderTokens.map((word, index) => {
      if (word.trim() === '') {
        return React.createElement('span', { key: index }, word)
      }

      const trimWord = cleanWordText(word)
      const isClickable = isClickableWord(word)

      return React.createElement(
        WordWrapper,
        {
          key: index,
          isClickable,
          onWordHover,
          onWordClick: isClickable
            ? (e: React.MouseEvent) => {
                e.stopPropagation()
                e.preventDefault()
                onWordClick(trimWord, e)
              }
            : undefined
        },
        word
      )
    })
  }
}
