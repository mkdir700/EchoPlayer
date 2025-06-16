/**
 * 文本渲染工具模块
 * Text rendering utility module with theme integration
 */

import React from 'react'
import { WordWrapper } from './WordWrapper'
import {
  createTextSplitResult,
  isClickableChineseChar,
  isClickableWord,
  cleanWordText
} from '@renderer/utils/subtitleTextProcessing'
import { useSubtitleTextSelection } from '@renderer/hooks/features/subtitle/useSubtitleTextSelection'

export interface TextRendererProps {
  text: string
  onWordHover: (isHovering: boolean) => void
  onWordClick: (word: string, event: React.MouseEvent) => void
  enableTextSelection?: boolean
  onSelectionChange?: (selectedText: string) => void
}

// Import the utility function
import { splitTextWithTheme } from '@renderer/utils/subtitleTextRendering'

/**
 * 文本渲染器组件
 * Text renderer component with text selection support
 */
export const TextRenderer: React.FC<TextRendererProps> = ({
  text,
  onWordHover,
  onWordClick,
  enableTextSelection = false,
  onSelectionChange
}) => {
  const { isChineseText: isChinese, originalWords, renderTokens } = createTextSplitResult(text)

  // 只有启用划词选中时才按字符分割（支持中文原文），否则按单词分割
  // Only split by characters when text selection is enabled (supports Chinese original text), otherwise split by words
  const shouldSplitByCharacters = enableTextSelection && isChinese
  const words = shouldSplitByCharacters ? originalWords : originalWords

  // 使用 useCallback 包装 onSelectionChange 以避免不必要的重新创建
  // Use useCallback to wrap onSelectionChange to avoid unnecessary recreation
  const stableOnSelectionChange = React.useCallback(
    (selectedText: string) => {
      if (enableTextSelection && onSelectionChange) {
        onSelectionChange(selectedText)
      }
    },
    [enableTextSelection, onSelectionChange]
  )

  // 始终调用 hook，但根据 enableTextSelection 决定是否使用
  // Always call hook, but use based on enableTextSelection
  const textSelection = useSubtitleTextSelection(
    words,
    enableTextSelection ? stableOnSelectionChange : undefined
  )

  // 使用 ref 来存储 clearSelection 函数，避免依赖问题
  // Use ref to store clearSelection function to avoid dependency issues
  const clearSelectionRef = React.useRef(textSelection.clearSelection)
  clearSelectionRef.current = textSelection.clearSelection

  // 当文本变化时，清除选择状态 / Clear selection when text changes
  React.useEffect(() => {
    if (enableTextSelection) {
      clearSelectionRef.current()
    }
  }, [text, enableTextSelection])

  if (!enableTextSelection) {
    return <>{splitTextWithTheme(text, onWordHover, onWordClick)}</>
  }

  // 渲染带有划词选中功能的文本 / Render text with selection functionality
  if (shouldSplitByCharacters) {
    return (
      <>
        {renderTokens.map((char, index) => {
          const isClickableChar = isClickableChineseChar(char)
          const wordIndex = originalWords.indexOf(char)
          const isSelected = wordIndex >= 0 && textSelection.isWordSelected(wordIndex)

          return (
            <WordWrapper
              key={index}
              isClickable={isClickableChar}
              onWordHover={onWordHover}
              onWordClick={
                isClickableChar
                  ? (e: React.MouseEvent) => {
                      // 如果正在选择文本，不触发单词点击 / Don't trigger word click if selecting text
                      if (!textSelection.selectionState.isSelecting) {
                        e.stopPropagation()
                        e.preventDefault()
                        onWordClick(char, e)
                      }
                    }
                  : undefined
              }
              // 划词选中相关属性 / Text selection related props
              wordIndex={wordIndex >= 0 ? wordIndex : undefined}
              isSelected={isSelected}
              onSelectionMouseDown={textSelection.handleWordMouseDown}
              onSelectionMouseEnter={textSelection.handleWordMouseEnter}
            >
              {char}
            </WordWrapper>
          )
        })}
      </>
    )
  } else {
    let wordIndex = 0
    return (
      <>
        {renderTokens.map((word, index) => {
          if (word.trim() === '') {
            return <span key={index}>{word}</span>
          }

          const trimWord = cleanWordText(word)
          const isClickable = isClickableWord(word)
          const currentWordIndex = wordIndex
          const isSelected = textSelection.isWordSelected(currentWordIndex)

          wordIndex++

          return (
            <WordWrapper
              key={index}
              isClickable={isClickable}
              onWordHover={onWordHover}
              onWordClick={
                isClickable
                  ? (e: React.MouseEvent) => {
                      // 如果正在选择文本，不触发单词点击 / Don't trigger word click if selecting text
                      if (!textSelection.selectionState.isSelecting) {
                        e.stopPropagation()
                        e.preventDefault()
                        onWordClick(trimWord, e)
                      }
                    }
                  : undefined
              }
              // 划词选中相关属性 / Text selection related props
              wordIndex={currentWordIndex}
              isSelected={isSelected}
              onSelectionMouseDown={textSelection.handleWordMouseDown}
              onSelectionMouseEnter={textSelection.handleWordMouseEnter}
            >
              {word}
            </WordWrapper>
          )
        })}
      </>
    )
  }
}

TextRenderer.displayName = 'TextRenderer'
