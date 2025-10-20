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
import { isClickableToken, tokenizeText, type WordToken } from '@renderer/utils/textTokenizer'
import { DictionaryResult, SubtitleDisplayMode } from '@types'
import React, { memo, useCallback, useMemo, useRef, useState } from 'react'
import styled from 'styled-components'

import DictionaryPopover from './DictionaryPopover'

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
  /** 容器高度（用于响应式字体大小计算） */
  containerHeight?: number
  /** 自定义类名 */
  className?: string
  /** 自定义样式 */
  style?: React.CSSProperties
}

// === 组件实现 ===
export const SubtitleContent = memo(function SubtitleContent({
  displayMode,
  originalText,
  translatedText,
  onTextSelection,
  containerHeight = 600, // 默认高度
  className,
  style
}: SubtitleContentProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  // === 响应式字体大小计算 ===
  const responsiveFontSizes = useMemo(() => {
    // 基础字体大小（基于 600px 高度容器的标准尺寸）
    const baseSizes = {
      original: 22,
      originalBilingual: 22,
      translated: 22,
      empty: 16
    }

    // 计算缩放比例（最小 0.7，最大 1.5）
    const scaleFactor = Math.max(0.7, Math.min(1.5, containerHeight / 600))

    return {
      original: `${baseSizes.original * scaleFactor}px`,
      originalBilingual: `${baseSizes.originalBilingual * scaleFactor}px`,
      translated: `${baseSizes.translated * scaleFactor}px`,
      empty: `${baseSizes.empty * scaleFactor}px`
    }
  }, [containerHeight])

  // 划词选择状态
  const [selectionState, setSelectionState] = useState<{
    isSelecting: boolean
    startIndex: number | null
    endIndex: number | null
    hoveredIndex: number | null
  }>({
    isSelecting: false,
    startIndex: null,
    endIndex: null,
    hoveredIndex: null
  })

  // 词典状态管理
  const [dictionaryStates, setDictionaryStates] = useState<{
    [tokenKey: string]: {
      visible: boolean
      loading: boolean
      data: DictionaryResult | null
      error: string | null
    }
  }>({})

  // === 分词处理 ===
  const originalTokens = useMemo(() => tokenizeText(originalText), [originalText])
  // 译文不进行分词处理，保持整句显示

  // === 词典弹窗处理 ===
  const handleWordDictionaryClick = useCallback(
    async (token: WordToken, event: React.MouseEvent) => {
      // 阻止事件冒泡到全局点击处理
      event.stopPropagation()

      if (!isClickableToken(token)) return

      const tokenKey = `${token.index}-${token.start}-${token.text}`

      // 关闭其他所有弹窗，只保留当前点击的
      setDictionaryStates((prev) => {
        const newStates = Object.keys(prev).reduce(
          (acc, key) => {
            acc[key] = { ...prev[key], visible: false }
            return acc
          },
          {} as typeof prev
        )

        // 设置当前点击词汇的状态 - 先不显示，等数据加载完成后再显示
        newStates[tokenKey] = {
          visible: false, // 延迟显示，避免位置偏移
          loading: true,
          data: null,
          error: null
        }
        return newStates
      })

      logger.debug('单词词典查询开始', { word: token.text, tokenKey })

      try {
        const result = await window.api.dictionary.queryEudic(token.text)
        if (result.success && result.data) {
          setDictionaryStates((prev) => ({
            ...prev,
            [tokenKey]: {
              ...prev[tokenKey],
              visible: true, // 数据加载完成后才显示 popover
              loading: false,
              data: result.data || null
            }
          }))
        } else {
          setDictionaryStates((prev) => ({
            ...prev,
            [tokenKey]: {
              ...prev[tokenKey],
              visible: true, // 错误时也要显示 popover
              loading: false,
              error: result.error || '查询失败'
            }
          }))
        }
      } catch (error) {
        logger.error('查询单词失败', { word: token.text, error })
        setDictionaryStates((prev) => ({
          ...prev,
          [tokenKey]: {
            ...prev[tokenKey],
            visible: true, // 网络错误时也要显示 popover
            loading: false,
            error: '网络错误，请稍后重试'
          }
        }))
      }
    },
    []
  )

  // === 单词点击处理 ===
  const handleWordClick = useCallback(
    (token: WordToken, event: React.MouseEvent) => {
      // 词典查询处理
      handleWordDictionaryClick(token, event)

      // 点击单词时清除之前的选中状态
      if (selectionState.startIndex !== null || selectionState.endIndex !== null) {
        setSelectionState((prev) => ({
          ...prev,
          startIndex: null,
          endIndex: null,
          hoveredIndex: token.index
        }))
      }
    },
    [handleWordDictionaryClick, selectionState.startIndex, selectionState.endIndex]
  )

  // === 词典弹窗关闭处理 ===
  const handleDictionaryClose = useCallback((tokenKey: string) => {
    setDictionaryStates((prev) => ({
      ...prev,
      [tokenKey]: {
        ...prev[tokenKey],
        visible: false,
        data: null,
        error: null
      }
    }))

    // 词典弹窗关闭后，将焦点恢复到容器元素，确保快捷键能正常工作
    setTimeout(() => {
      if (containerRef.current) {
        // 找到可以获得焦点的播放器元素
        const videoSurface = document.querySelector('[data-testid="video-surface"]') as HTMLElement
        const subtitleOverlay = document.querySelector(
          '[data-testid="subtitle-overlay"]'
        ) as HTMLElement

        // 优先将焦点给到视频表面，其次是字幕覆盖层
        if (videoSurface) {
          videoSurface.focus()
        } else if (subtitleOverlay) {
          subtitleOverlay.focus()
        }
      }
    }, 100) // 延迟确保弹窗完全关闭后再恢复焦点
  }, [])

  // === 划词选中处理 ===
  const handleWordMouseDown = useCallback((token: WordToken, event: React.MouseEvent) => {
    if (!isClickableToken(token)) return

    // 阻止事件冒泡到 SubtitleOverlay 的拖动处理
    event.stopPropagation()

    setSelectionState({
      isSelecting: true,
      startIndex: token.index,
      endIndex: token.index,
      hoveredIndex: token.index
    })
  }, [])

  const handleWordMouseEnter = useCallback((token: WordToken) => {
    if (!isClickableToken(token)) return

    setSelectionState((prev) => ({
      ...prev,
      hoveredIndex: token.index,
      ...(prev.isSelecting && { endIndex: token.index })
    }))
  }, [])

  const handleWordMouseLeave = useCallback(() => {
    // 鼠标移出时清除悬停状态（但不影响选中状态）
    setSelectionState((prev) => ({
      ...prev,
      hoveredIndex: prev.isSelecting ? prev.hoveredIndex : null
    }))
  }, [])

  const handleWordMouseUp = useCallback(
    (token: WordToken) => {
      if (!isClickableToken(token) || !selectionState.isSelecting) return

      const { startIndex, endIndex } = selectionState
      if (startIndex !== null && endIndex !== null) {
        const minIndex = Math.min(startIndex, endIndex)
        const maxIndex = Math.max(startIndex, endIndex)

        // 获取当前显示模式对应的 tokens
        const isShowingTranslatedOnly =
          displayMode === SubtitleDisplayMode.TRANSLATED && translatedText?.trim()

        // 如果显示的是纯译文（整句），则不进行划词选择处理
        if (!isShowingTranslatedOnly) {
          const currentTokens = originalTokens
          const selectedTokens = currentTokens.slice(minIndex, maxIndex + 1)
          const selectedText = selectedTokens.map((t) => t.text).join('')

          if (selectedText.trim() && onTextSelection) {
            onTextSelection(selectedText)
            logger.debug('划词选中文本', {
              selectedText: selectedText.substring(0, 50) + (selectedText.length > 50 ? '...' : ''),
              length: selectedText.length,
              tokenCount: selectedTokens.length
            })
          }
        }
      }

      // 保持选中状态，只停止拖拽行为
      setSelectionState((prev) => ({
        ...prev,
        isSelecting: false,
        hoveredIndex: null
      }))
    },
    [selectionState, displayMode, originalTokens, translatedText, onTextSelection]
  )

  // === 全局鼠标事件处理 ===
  const handleGlobalMouseUp = useCallback(() => {
    if (selectionState.isSelecting) {
      setSelectionState((prev) => ({ ...prev, isSelecting: false }))
    }
  }, [selectionState.isSelecting])

  // 全局点击清除选中状态
  const handleGlobalClick = useCallback((event: MouseEvent) => {
    const target = event.target as HTMLElement
    // 如果点击的不是字幕内容区域，清除选中状态
    if (!containerRef.current?.contains(target)) {
      setSelectionState((prev) => ({
        ...prev,
        startIndex: null,
        endIndex: null,
        hoveredIndex: null
      }))
    }
  }, [])

  // 字幕切换时重置悬停状态和词典状态
  React.useEffect(() => {
    setSelectionState({
      isSelecting: false,
      startIndex: null,
      endIndex: null,
      hoveredIndex: null
    })
    // 清空所有词典状态
    setDictionaryStates({})
  }, [originalText, translatedText, displayMode])

  // 绑定全局鼠标事件
  React.useEffect(() => {
    if (selectionState.isSelecting) {
      document.addEventListener('mouseup', handleGlobalMouseUp)
      return () => document.removeEventListener('mouseup', handleGlobalMouseUp)
    }
    return undefined
  }, [selectionState.isSelecting, handleGlobalMouseUp])

  // 绑定全局点击事件清除选中状态
  React.useEffect(() => {
    // 只有当有选中状态时才绑定
    if (selectionState.startIndex !== null && selectionState.endIndex !== null) {
      document.addEventListener('click', handleGlobalClick)
      return () => document.removeEventListener('click', handleGlobalClick)
    }
    return undefined
  }, [selectionState.startIndex, selectionState.endIndex, handleGlobalClick])

  // === 渲染分词文本 ===
  const renderTokenizedText = useCallback(
    (tokens: WordToken[]) => {
      return (
        <TokenizedTextContainer>
          {tokens.map((token) => {
            const isClickable = isClickableToken(token)
            const isSelected =
              selectionState.startIndex !== null &&
              selectionState.endIndex !== null &&
              token.index >= Math.min(selectionState.startIndex, selectionState.endIndex) &&
              token.index <= Math.max(selectionState.startIndex, selectionState.endIndex)
            const isHovered = selectionState.hoveredIndex === token.index
            const tokenKey = `${token.index}-${token.start}-${token.text}`
            const dictionaryState = dictionaryStates[tokenKey] || {
              visible: false,
              loading: false,
              data: null,
              error: null
            }

            const wordTokenElement = (
              <WordToken
                key={`${token.index}-${token.start}`}
                $isClickable={isClickable}
                $isSelected={isSelected}
                $isHovered={isHovered && !selectionState.isSelecting}
                data-clickable={isClickable}
                onClick={(e) => handleWordClick(token, e)}
                onMouseDown={(e) => handleWordMouseDown(token, e)}
                onMouseEnter={() => handleWordMouseEnter(token)}
                onMouseLeave={handleWordMouseLeave}
                onMouseUp={() => handleWordMouseUp(token)}
              >
                {token.text}
              </WordToken>
            )

            // 只为可点击的词汇添加词典弹窗
            if (isClickable) {
              return (
                <DictionaryPopover
                  key={tokenKey}
                  visible={dictionaryState.visible}
                  data={dictionaryState.data}
                  loading={dictionaryState.loading}
                  error={dictionaryState.error}
                  onClose={() => handleDictionaryClose(tokenKey)}
                >
                  {wordTokenElement}
                </DictionaryPopover>
              )
            }

            return wordTokenElement
          })}
        </TokenizedTextContainer>
      )
    },
    [
      selectionState,
      dictionaryStates,
      handleWordClick,
      handleWordMouseDown,
      handleWordMouseEnter,
      handleWordMouseLeave,
      handleWordMouseUp,
      handleDictionaryClose
    ]
  )

  // === 渲染内容 ===
  const renderContent = () => {
    switch (displayMode) {
      case SubtitleDisplayMode.NONE:
        return null

      case SubtitleDisplayMode.ORIGINAL:
        if (!originalText.trim()) {
          return <EmptyState $fontSize={responsiveFontSizes.empty}>--Empty--</EmptyState>
        }
        return (
          <OriginalTextLine $fontSize={responsiveFontSizes.original}>
            {renderTokenizedText(originalTokens)}
          </OriginalTextLine>
        )

      case SubtitleDisplayMode.TRANSLATED: {
        const textToShow = translatedText?.trim() || originalText.trim()
        if (!textToShow) {
          return <EmptyState $fontSize={responsiveFontSizes.empty}>--Empty--</EmptyState>
        }
        // 译文显示整句，原文显示分词
        return (
          <TranslatedTextLine $fontSize={responsiveFontSizes.translated}>
            {translatedText?.trim() ? textToShow : renderTokenizedText(originalTokens)}
          </TranslatedTextLine>
        )
      }

      case SubtitleDisplayMode.BILINGUAL:
        if (!originalText.trim()) {
          return <EmptyState $fontSize={responsiveFontSizes.empty}>--Empty--</EmptyState>
        }
        return (
          <>
            <OriginalTextLine
              className="bilingual"
              $fontSize={responsiveFontSizes.originalBilingual}
            >
              {renderTokenizedText(originalTokens)}
            </OriginalTextLine>
            {translatedText?.trim() && (
              <TranslatedTextLine $fontSize={responsiveFontSizes.translated}>
                {translatedText}
              </TranslatedTextLine>
            )}
          </>
        )

      default:
        logger.warn('未知的字幕显示模式', { displayMode })
        return <EmptyState $fontSize={responsiveFontSizes.empty}>--Empty--</EmptyState>
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
      role="region"
      data-testid="subtitle-content"
    >
      {content}
    </ContentContainer>
  )
})

export default SubtitleContent

// === 样式组件 ===
const ContentContainer = styled.div`
  min-height: 60px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  line-height: 1.6;
  user-select: text;
  -webkit-user-select: text;
  color: var(--color-white);
  text-align: center;
  padding: 0 12px;

  /* 文本选中样式 */
  ::selection {
    background: rgba(102, 126, 234, 0.3);
    color: inherit;
  }

  ::-moz-selection {
    background: rgba(102, 126, 234, 0.3);
    color: inherit;
  }
`

const OriginalTextLine = styled.div<{ $fontSize?: string }>`
  font-size: ${(props) => props.$fontSize || '16px'};
  font-weight: 600;
  text-shadow: var(--subtitle-text-shadow);
  transition: all var(--subtitle-transition-duration);
  margin: 4px;
  white-space: pre-wrap;
  word-break: keep-all;
  overflow-wrap: break-word;
  text-align: center;
  width: 100%;
`

const TranslatedTextLine = styled.div<{ $fontSize?: string }>`
  font-size: ${(props) => props.$fontSize || '15px'};
  font-weight: 500;
  opacity: 0.95;
  text-shadow: var(--subtitle-text-shadow);
  transition: all var(--subtitle-transition-duration);
  margin: 4px;
  white-space: pre-wrap;
  word-break: keep-all;
  overflow-wrap: break-word;
  text-align: center;
  width: 100%;
`

const EmptyState = styled.div<{ $fontSize?: string }>`
  font-size: ${(props) => props.$fontSize || '14px'};
  font-style: italic;
  opacity: 0.7;
  background: rgba(0, 0, 0, 0.4);
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px dashed rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(4px);
`

const WordToken = styled.span<{
  $isClickable: boolean
  $isSelected: boolean
  $isHovered: boolean
}>`
  cursor: ${(props) => (props.$isClickable ? 'pointer' : 'inherit')};
  user-select: none;
  transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  display: inline-block;
  padding: 1px 2px;
  margin: 0 1px;
  border-radius: 3px;

  /* 可点击单词的基础样式 */
  ${(props) =>
    props.$isClickable &&
    `
    &:hover {
      background: rgba(102, 126, 234, 0.25);
      transform: translateY(-1px);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    &:active {
      transform: translateY(0);
      background: rgba(102, 126, 234, 0.35);
    }
  `}

  /* 选中状态样式 */
  ${(props) =>
    props.$isSelected &&
    `
    background: rgba(102, 126, 234, 0.45) !important;
    color: #ffffff;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
    transform: none !important;
    box-shadow: 0 0 0 1px rgba(102, 126, 234, 0.6);
  `}

  /* 悬停状态样式（非选择模式） */
  ${(props) =>
    props.$isHovered &&
    !props.$isSelected &&
    `
    background: rgba(102, 126, 234, 0.3);
    transform: translateY(-1px);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
  `}

  /* 标点符号和空格的特殊处理 */
  &:not([data-clickable="true"]) {
    padding: 0;
    margin: 0;
    border-radius: 0;
  }
`

const TokenizedTextContainer = styled.div`
  display: inline;
  user-select: text;
  -webkit-user-select: text;
  white-space: pre-wrap;
  word-break: keep-all;
  overflow-wrap: break-word;
`
