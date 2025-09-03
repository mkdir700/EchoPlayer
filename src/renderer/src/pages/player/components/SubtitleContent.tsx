/**
 * SubtitleContent Component
 *
 * 负责渲染字幕内容，支持：
 * - 多种显示模式（原文/译文/双语）
 * - 文本选中和复制功能
 * - 双语内容的布局和样式差异
 * - 无障碍访问支持
 * - 使用现有主题系统的样式令牌
 */

import { loggerService } from '@logger'
import { SubtitleDisplayMode } from '@types'
import React, { memo, useCallback, useRef } from 'react'
import styled from 'styled-components'

const logger = loggerService.withContext('SubtitleContent')

// === 接口定义 ===
export interface SubtitleContentProps {
  /** 显示模式 */
  displayMode: SubtitleDisplayMode
  /** 原文内容 */
  originalText: string
  /** 译文内容（可选） */
  translatedText?: string
  /** 选中文本变化回调 */
  onTextSelection?: (selectedText: string) => void
  /** 自定义类名 */
  className?: string
  /** 自定义样式 */
  style?: React.CSSProperties
}

// === 样式组件 ===
const ContentContainer = styled.div`
  width: 100%;
  line-height: var(--subtitle-line-height, 1.6);
  user-select: text;
  -webkit-user-select: text;
  color: var(--subtitle-text-color, #ffffff);

  /* 文本选中样式 */
  ::selection {
    background: var(--subtitle-selection-bg, rgba(102, 126, 234, 0.3));
    color: inherit;
  }

  ::-moz-selection {
    background: var(--subtitle-selection-bg, rgba(102, 126, 234, 0.3));
    color: inherit;
  }

  /* 样式变量定义 */
  --subtitle-text-color: #ffffff;
  --subtitle-text-shadow:
    0 1px 2px rgba(0, 0, 0, 0.8), 0 2px 4px rgba(0, 0, 0, 0.6), 0 0 8px rgba(0, 0, 0, 0.4);
  --subtitle-line-height: 1.6;
  --subtitle-selection-bg: rgba(102, 126, 234, 0.3);
  --subtitle-transition-duration: 200ms;
`

const OriginalTextLine = styled.div`
  font-size: 16px;
  font-weight: 600;
  text-shadow: var(--subtitle-text-shadow);
  margin-bottom: 0;
  transition: all var(--subtitle-transition-duration);

  /* 在双语模式下添加间距 */
  &.bilingual {
    margin-bottom: 8px;
    font-size: 18px;
  }
`

const TranslatedTextLine = styled.div`
  font-size: 15px;
  font-weight: 500;
  opacity: 0.95;
  color: var(--color-text-2, #f0f0f0);
  text-shadow: var(--subtitle-text-shadow);
  margin-top: 0;
  transition: all var(--subtitle-transition-duration);
`

const EmptyState = styled.div`
  font-size: 14px;
  color: var(--color-text-3, #999999);
  font-style: italic;
  opacity: 0.7;
  background: rgba(0, 0, 0, 0.4);
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px dashed rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(4px);
`

// === 组件实现 ===
export const SubtitleContent = memo(function SubtitleContent({
  displayMode,
  originalText,
  translatedText,
  onTextSelection,
  className,
  style
}: SubtitleContentProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  // === 文本选中处理 ===
  const handleMouseUp = useCallback(() => {
    const selection = window.getSelection()
    const selectedText = selection?.toString() || ''

    if (selectedText && onTextSelection) {
      onTextSelection(selectedText)
      logger.debug('字幕文本被选中', {
        selectedText: selectedText.substring(0, 50) + (selectedText.length > 50 ? '...' : ''),
        length: selectedText.length
      })
    }
  }, [onTextSelection])

  // === 键盘复制支持 ===
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
      const selection = window.getSelection()
      const selectedText = selection?.toString()

      if (selectedText) {
        // 复制到剪贴板
        navigator.clipboard
          .writeText(selectedText)
          .then(() => {
            logger.info('字幕文本已复制到剪贴板', { length: selectedText.length })
          })
          .catch((error) => {
            logger.error('复制到剪贴板失败', { error })
          })
      }
    }
  }, [])

  // === 渲染内容 ===
  const renderContent = () => {
    switch (displayMode) {
      case SubtitleDisplayMode.NONE:
        return null

      case SubtitleDisplayMode.ORIGINAL:
        if (!originalText.trim()) {
          return <EmptyState>没有原文内容</EmptyState>
        }
        return <OriginalTextLine>{originalText}</OriginalTextLine>

      case SubtitleDisplayMode.TRANSLATED: {
        const textToShow = translatedText?.trim() || originalText.trim()
        if (!textToShow) {
          return <EmptyState>没有译文内容</EmptyState>
        }
        return <TranslatedTextLine>{textToShow}</TranslatedTextLine>
      }

      case SubtitleDisplayMode.BILINGUAL:
        if (!originalText.trim()) {
          return <EmptyState>没有字幕内容</EmptyState>
        }
        return (
          <>
            <OriginalTextLine className="bilingual">{originalText}</OriginalTextLine>
            {translatedText?.trim() && <TranslatedTextLine>{translatedText}</TranslatedTextLine>}
          </>
        )

      default:
        logger.warn('未知的字幕显示模式', { displayMode })
        return <EmptyState>未知显示模式</EmptyState>
    }
  }

  const content = renderContent()

  // 如果没有内容要显示，返回 null
  if (!content) {
    return null
  }

  return (
    <ContentContainer
      ref={containerRef}
      className={className}
      style={style}
      onMouseUp={handleMouseUp}
      onKeyDown={handleKeyDown}
      tabIndex={0} // 使元素可聚焦，支持键盘操作
      role="region"
      aria-label="字幕内容"
      aria-live="polite" // 屏幕阅读器支持
      data-testid="subtitle-content"
    >
      {content}
    </ContentContainer>
  )
})

export default SubtitleContent
