/**
 * SubtitleOverlay Component
 *
 * 字幕覆盖层组件，提供：
 * - 可拖拽和调整尺寸的字幕显示
 * - 多种显示模式（隐藏/原文/译文/双语）
 * - 自定义背景样式（透明/模糊/纯色）
 * - 与播放器引擎的时间同步
 * - 文本选中和复制功能
 * - 响应式定位和尺寸适配
 */

import { loggerService } from '@logger'
import {
  ANIMATION_DURATION,
  BORDER_RADIUS,
  EASING,
  FONT_SIZES,
  FONT_WEIGHTS,
  GLASS_EFFECT,
  SHADOWS,
  SPACING,
  Z_INDEX
} from '@renderer/infrastructure/styles/theme'
import { usePlayerStore } from '@renderer/state'
import { DictionaryResult, SubtitleBackgroundType, SubtitleDisplayMode } from '@types'
import { Button, Spin, Tooltip } from 'antd'
import { Volume2 } from 'lucide-react'
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import styled, { css } from 'styled-components'

import { useSubtitleOverlay, useSubtitleOverlayUI } from '../hooks'
import SubtitleContent from './SubtitleContent'

const logger = loggerService.withContext('SubtitleOverlay')

// === 接口定义 ===
export interface SubtitleOverlayProps {
  /** 容器元素引用（用于计算边界） */
  containerRef?: React.RefObject<HTMLElement | null>
}

// === 组件实现 ===
export const SubtitleOverlay = memo(function SubtitleOverlay({
  containerRef
}: SubtitleOverlayProps) {
  // === i18n 翻译 ===
  const { t } = useTranslation()

  // === 状态集成（重构版） ===
  const integration = useSubtitleOverlay()

  // === UI 状态和操作（来自新的 Hook） ===
  const {
    isDragging,
    isResizing,
    showBoundaries,
    isHovered,
    containerBounds,
    startDragging,
    stopDragging,
    startResizing,
    stopResizing,
    setHovered,
    setSelectedText,
    updateContainerBounds,
    adaptToContainerResize,
    avoidCollision
  } = useSubtitleOverlayUI()

  // === 配置数据（来自当前视频项目） ===
  const currentConfig = usePlayerStore((s) => s.subtitleOverlay)
  const displayMode = currentConfig.displayMode
  const position = currentConfig.position
  const size = currentConfig.size
  const backgroundStyle = currentConfig.backgroundStyle

  // === 配置操作（通过 integration） ===
  const setPosition = integration.setPosition
  const setSize = integration.setSize

  // === 本地状态 ===
  const overlayRef = useRef<HTMLDivElement>(null)
  const [toastVisible, setToastVisible] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [dictionaryData, setDictionaryData] = useState<DictionaryResult | null>(null)
  const [dictionaryVisible, setDictionaryVisible] = useState(false)
  const [dictionaryLoading, setDictionaryLoading] = useState(false)
  const [dictionaryError, setDictionaryError] = useState<string | null>(null)
  const [dictionaryPosition, setDictionaryPosition] = useState<{ x: number; y: number } | null>(
    null
  )
  const hideToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // === 复制成功toast监听器 ===
  useEffect(() => {
    const handleSubtitleCopied = (event: CustomEvent<{ message: string }>) => {
      const { message } = event.detail
      setToastMessage(message)
      setToastVisible(true)

      // 2秒后自动隐藏toast（防抖）
      if (hideToastTimerRef.current) {
        clearTimeout(hideToastTimerRef.current)
      }
      hideToastTimerRef.current = setTimeout(() => {
        setToastVisible(false)
        hideToastTimerRef.current = null
      }, 800)
    }

    window.addEventListener('subtitle-copied', handleSubtitleCopied as EventListener)

    return () => {
      if (hideToastTimerRef.current) {
        clearTimeout(hideToastTimerRef.current)
        hideToastTimerRef.current = null
      }
      window.removeEventListener('subtitle-copied', handleSubtitleCopied as EventListener)
    }
  }, [])

  // === 初始化和容器边界更新 ===
  useEffect(() => {
    let resizeTimer: NodeJS.Timeout

    const updateBounds = (isInitial = false) => {
      const container =
        containerRef?.current || document.querySelector('[data-testid="video-surface"]')
      if (container) {
        const rect = container.getBoundingClientRect()
        const newBounds = { width: rect.width, height: rect.height }

        if (isInitial || !currentConfig?.isInitialized) {
          // 初始化时使用 updateContainerBounds
          updateContainerBounds(newBounds)
          // calculateOptimalPosition(newBounds)
        } else {
          // 容器尺寸变化时使用智能适应
          adaptToContainerResize(newBounds)
        }
      }
    }

    const handleResize = () => {
      // 防抖处理，避免频繁重新计算
      clearTimeout(resizeTimer)
      resizeTimer = setTimeout(() => updateBounds(false), 150)
    }

    // 初始化
    updateBounds(true)

    // 监听窗口尺寸变化
    window.addEventListener('resize', handleResize)

    // 监听全屏模式变化（可能导致容器尺寸变化）
    let observer: ResizeObserver | null = null

    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver((entries) => {
        for (const entry of entries) {
          if (
            entry.target ===
            (containerRef?.current || document.querySelector('[data-testid="video-surface"]'))
          ) {
            handleResize()
          }
        }
      })

      const container =
        containerRef?.current || document.querySelector('[data-testid="video-surface"]')
      if (container) {
        observer.observe(container)
      }
    }

    return () => {
      clearTimeout(resizeTimer)
      window.removeEventListener('resize', handleResize)
      if (observer && typeof observer.disconnect === 'function') {
        observer.disconnect()
      }
    }
  }, [containerRef, updateContainerBounds, adaptToContainerResize, currentConfig?.isInitialized])

  // === 智能冲突检测 ===
  useEffect(() => {
    // 检测可能的冲突区域（控制面板、进度条等）
    const detectConflictAreas = () => {
      const conflictSelectors = [
        '[data-testid="controller-panel"]',
        '[data-testid="transport-bar"]',
        '[aria-label="transport-bar"]',
        '.progress-section',
        '.controller-panel'
      ]

      const conflictAreas: Array<{ x: number; y: number; width: number; height: number }> = []
      const container =
        containerRef?.current || document.querySelector('[data-testid="video-surface"]')

      if (!container) return conflictAreas

      const containerRect = container.getBoundingClientRect()

      conflictSelectors.forEach((selector) => {
        const element = document.querySelector(selector) as HTMLElement
        if (element && element.offsetParent) {
          // 确保元素可见
          const rect = element.getBoundingClientRect()

          // 转换为相对于容器的百分比坐标
          const relativeArea = {
            x: ((rect.left - containerRect.left) / containerRect.width) * 100,
            y: ((rect.top - containerRect.top) / containerRect.height) * 100,
            width: (rect.width / containerRect.width) * 100,
            height: (rect.height / containerRect.height) * 100
          }

          // 只关注可能与字幕区域重叠的元素
          if (relativeArea.y > 50) {
            // 只检测下半部分
            conflictAreas.push(relativeArea)
          }
        }
      })

      return conflictAreas
    }

    // 定期检测冲突区域（UI 元素可能动态显示/隐藏）
    const conflictCheckTimer = setInterval(() => {
      if (displayMode !== SubtitleDisplayMode.NONE) {
        const conflicts = detectConflictAreas()
        if (conflicts.length > 0) {
          avoidCollision(conflicts)
        }
      }
    }, 2000) // 每 2 秒检测一次

    return () => {
      clearInterval(conflictCheckTimer)
    }
  }, [containerRef, displayMode, avoidCollision])

  // === 拖拽功能（优化版本） ===
  const handleMouseDown = useCallback(
    (event: React.MouseEvent) => {
      if (isResizing) return

      event.preventDefault()
      event.stopPropagation() // 阻止事件冒泡，防止触发VideoSurface的点击事件
      const startX = event.clientX
      const startY = event.clientY
      const startPosition = { x: position.x, y: position.y }

      startDragging()

      let animationId: number
      const handleMouseMove = (moveEvent: MouseEvent) => {
        // 取消之前的动画帧
        if (animationId) {
          cancelAnimationFrame(animationId)
        }

        animationId = requestAnimationFrame(() => {
          const deltaX = moveEvent.clientX - startX
          const deltaY = moveEvent.clientY - startY

          // 使用估算的字幕高度（自适应模式下约为 160px）
          const estimatedHeightPercent = Math.min(12, (160 / containerBounds.height) * 100)

          const newPosition = {
            x: Math.max(
              0,
              Math.min(100 - size.width, startPosition.x + (deltaX / containerBounds.width) * 100)
            ),
            y: Math.max(
              0,
              Math.min(
                100 - estimatedHeightPercent,
                startPosition.y + (deltaY / containerBounds.height) * 100
              )
            )
          }
          setPosition(newPosition)
        })
      }

      const handleMouseUp = () => {
        if (animationId) {
          cancelAnimationFrame(animationId)
        }
        stopDragging()
        logger.info('字幕覆盖层位置更新', { newPosition: position })

        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }

      document.addEventListener('mousemove', handleMouseMove, { passive: true })
      document.addEventListener('mouseup', handleMouseUp)
    },
    [position, size, containerBounds, startDragging, stopDragging, setPosition, isResizing]
  )

  // === 调整尺寸功能（优化版本） ===
  const handleResizeMouseDown = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault()
      event.stopPropagation() // 阻止事件冒泡，防止触发VideoSurface的点击事件

      const startX = event.clientX
      const startY = event.clientY
      const startSize = { width: size.width, height: size.height }

      startResizing()

      let animationId: number
      const handleMouseMove = (moveEvent: MouseEvent) => {
        // 取消之前的动画帧
        if (animationId) {
          cancelAnimationFrame(animationId)
        }

        animationId = requestAnimationFrame(() => {
          const deltaX = moveEvent.clientX - startX
          const deltaY = moveEvent.clientY - startY

          const newSize = {
            width: Math.max(
              20,
              Math.min(95, startSize.width + (deltaX / containerBounds.width) * 100)
            ),
            height: Math.max(
              10,
              Math.min(40, startSize.height + (deltaY / containerBounds.height) * 100)
            )
          }
          setSize(newSize)
        })
      }

      const handleMouseUp = () => {
        if (animationId) {
          cancelAnimationFrame(animationId)
        }
        stopResizing()
        logger.info('字幕覆盖层尺寸更新', { newSize: size })

        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }

      document.addEventListener('mousemove', handleMouseMove, { passive: true })
      document.addEventListener('mouseup', handleMouseUp)
    },
    [size, containerBounds, startResizing, stopResizing, setSize]
  )

  // === 悬停状态处理 ===
  const handleMouseEnter = useCallback(() => {
    setHovered(true)
  }, [setHovered])

  const handleMouseLeave = useCallback(() => {
    if (!isDragging && !isResizing) {
      setHovered(false)
    }
  }, [setHovered, isDragging, isResizing])

  // === 文本选中处理 ===
  const handleTextSelection = useCallback(
    (selectedText: string) => {
      setSelectedText(selectedText)
    },
    [setSelectedText]
  )

  // === 单词点击处理 ===
  const handleWordClick = useCallback(async (word: string, token: any, event: React.MouseEvent) => {
    logger.debug('字幕单词被点击', { word, tokenIndex: token.index })

    // 设置弹窗位置
    const target = event.currentTarget as HTMLElement
    const targetRect = target.getBoundingClientRect()
    const overlayRect = overlayRef.current?.getBoundingClientRect()
    const positionX = targetRect.left - (overlayRect?.left ?? 0) + targetRect.width / 2
    const positionY = targetRect.top - (overlayRect?.top ?? 0)

    setDictionaryPosition({ x: positionX, y: positionY })
    setDictionaryVisible(true)
    setDictionaryLoading(true)
    setDictionaryError(null)
    setDictionaryData(null)

    try {
      const result = await window.api.dictionary.queryEudic(word)
      if (result.success && result.data) {
        setDictionaryData(result.data)
      } else {
        setDictionaryError(result.error || '查询失败')
      }
    } catch (error) {
      logger.error('查询单词失败', { word, error })
      setDictionaryError('网络错误，请稍后重试')
    } finally {
      setDictionaryLoading(false)
    }
  }, [])

  // === 发音处理 ===
  const handlePronunciation = useCallback(async (word: string) => {
    try {
      // 使用浏览器内置的语音合成
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(word)
        utterance.lang = 'en-US'
        utterance.rate = 0.8
        window.speechSynthesis.speak(utterance)
      }
    } catch (error) {
      logger.error('发音失败', { word, error })
    }
  }, [])

  // === 通用点击处理（阻止冒泡到VideoSurface） ===
  const handleClick = useCallback((event: React.MouseEvent) => {
    // 阻止所有点击事件冒泡到VideoSurface，防止触发播放/暂停
    event.stopPropagation()
    setDictionaryVisible(false)
    setDictionaryData(null)
    setDictionaryPosition(null)
    setDictionaryError(null)
  }, [])

  // === 点击外部关闭词典 ===
  useEffect(() => {
    if (!dictionaryVisible) return
    const handleOutside = () => {
      setDictionaryVisible(false)
      setDictionaryData(null)
      setDictionaryPosition(null)
      setDictionaryError(null)
    }
    document.addEventListener('click', handleOutside)
    return () => document.removeEventListener('click', handleOutside)
  }, [dictionaryVisible])

  // === ResizeHandle 双击扩展处理 ===
  const handleResizeDoubleClick = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault()
      event.stopPropagation() // 阻止事件冒泡，防止触发VideoSurface的点击事件

      const maxWidth = 95 // 最大宽度95%

      // 计算扩展后的居中位置（95%宽度居中）
      const expandedCenterX = 50 - maxWidth / 2

      const newSize = {
        ...size,
        width: maxWidth
      }

      const newPosition = {
        ...position,
        x: Math.max(0, Math.min(100 - maxWidth, expandedCenterX))
      }

      // 同时更新尺寸和位置
      setSize(newSize)
      setPosition(newPosition)

      logger.info('字幕覆盖层双击扩展', {
        newSize,
        newPosition,
        centerFirst: true,
        thenExpand: true
      })
    },
    [size, position, setSize, setPosition]
  )

  // === 条件渲染：配置未加载或隐藏模式不显示 ===
  const shouldRender = useMemo(
    () => displayMode !== SubtitleDisplayMode.NONE && integration.shouldShow,
    [displayMode, integration.shouldShow]
  )

  if (!shouldRender) {
    return null
  }

  logger.debug('渲染 SubtitleOverlay', {
    displayMode,
    position,
    size,
    isDragging,
    isResizing,
    showBoundaries
  })

  return (
    <OverlayContainer
      ref={overlayRef}
      $position={position}
      $size={size}
      $showBoundaries={showBoundaries}
      $isDragging={isDragging}
      $isResizing={isResizing}
      $isHovered={isHovered}
      $backgroundType={backgroundStyle.type}
      $opacity={backgroundStyle.opacity}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      data-testid="subtitle-overlay"
      role="region"
      aria-label="字幕覆盖层"
      tabIndex={0}
    >
      <ContentContainer $backgroundType={backgroundStyle.type} $opacity={backgroundStyle.opacity}>
        <SubtitleContent
          displayMode={displayMode}
          originalText={integration.currentSubtitle?.originalText || ''}
          translatedText={integration.currentSubtitle?.translatedText}
          onTextSelection={handleTextSelection}
          onWordClick={handleWordClick}
          containerHeight={containerBounds.height}
        />
      </ContentContainer>

      {dictionaryVisible && dictionaryPosition && (
        <DictionaryPopover
          style={{ left: dictionaryPosition.x, top: dictionaryPosition.y }}
          data-testid="dictionary-popover"
          onClick={(e) => e.stopPropagation()}
        >
          {dictionaryLoading ? (
            <LoadingContent>
              <Spin size="small" />
              <span>查询中...</span>
            </LoadingContent>
          ) : dictionaryError ? (
            <ErrorContent>
              <span>查询失败</span>
              <div>{dictionaryError}</div>
            </ErrorContent>
          ) : dictionaryData ? (
            <>
              <WordHeader>
                <WordTitle>{dictionaryData.word}</WordTitle>
                <PronunciationButton
                  type="text"
                  size="small"
                  icon={<Volume2 size={14} />}
                  onClick={() => handlePronunciation(dictionaryData.word)}
                  title="点击发音"
                />
              </WordHeader>

              {dictionaryData.phonetic && <PhoneticText>{dictionaryData.phonetic}</PhoneticText>}

              {dictionaryData.definitions.length > 0 && (
                <>
                  <Divider $margin={SPACING.XS} />
                  <DefinitionsList>
                    {dictionaryData.definitions.slice(0, 6).map((def, idx) => (
                      <DefinitionItem key={idx}>
                        {def.partOfSpeech && <PartOfSpeech>{def.partOfSpeech}</PartOfSpeech>}
                        <MeaningText>{def.meaning}</MeaningText>
                      </DefinitionItem>
                    ))}
                    {dictionaryData.definitions.length > 6 && (
                      <MoreIndicator>
                        ... 还有 {dictionaryData.definitions.length - 6} 个释义
                      </MoreIndicator>
                    )}
                  </DefinitionsList>
                </>
              )}

              {dictionaryData.translations && dictionaryData.translations.length > 0 && (
                <>
                  <Divider $margin={SPACING.XS} />
                  <TranslationSection>
                    <SectionTitle>常用翻译</SectionTitle>
                    <TranslationList>
                      {dictionaryData.translations.slice(0, 3).map((translation, idx) => (
                        <TranslationItem key={idx}>{translation}</TranslationItem>
                      ))}
                    </TranslationList>
                  </TranslationSection>
                </>
              )}
            </>
          ) : null}
        </DictionaryPopover>
      )}

      <Tooltip
        title={t('settings.playback.subtitle.overlay.resizeHandle.tooltip')}
        placement="top"
        mouseEnterDelay={0.5}
        mouseLeaveDelay={0}
      >
        <ResizeHandle
          $visible={isHovered || isDragging || isResizing}
          onMouseDown={handleResizeMouseDown}
          onDoubleClick={handleResizeDoubleClick}
          data-testid="subtitle-resize-handle"
        />
      </Tooltip>

      <ToastContainer $visible={toastVisible} role="status" aria-live="polite" aria-atomic="true">
        <ToastContent>{toastMessage}</ToastContent>
      </ToastContainer>
    </OverlayContainer>
  )
})

export default SubtitleOverlay

// === 样式组件 ===
const OverlayContainer = styled.div<{
  $position: { x: number; y: number }
  $size: { width: number; height: number }
  $showBoundaries: boolean
  $isDragging: boolean
  $isResizing: boolean
  $isHovered: boolean
  $backgroundType: SubtitleBackgroundType
  $opacity: number
}>`
  /* 基础定位和尺寸 */
  position: absolute;
  left: ${(props) => props.$position.x}%;
  top: ${(props) => props.$position.y}%;
  width: ${(props) => props.$size.width}%;
  height: auto;
  min-height: 60px;
  max-height: 160px;

  /* 基础样式 */
  pointer-events: auto;
  user-select: none;
  border-radius: 8px;

  /* 交互状态样式 */
  cursor: ${(props) => {
    if (props.$isDragging) return 'grabbing'
    if (props.$isResizing) return 'nw-resize'
    return 'grab'
  }};

  /* 边界显示 */
  border: ${(props) =>
    props.$showBoundaries || props.$isHovered
      ? '2px dashed rgba(102, 126, 234, 0.6)'
      : '2px dashed transparent'};

  /* 拖拽状态特效 */
  ${(props) =>
    props.$isDragging &&
    css`
      transform: rotate(1deg);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
      border-color: rgba(102, 126, 234, 0.8);
    `}

  /* 动画过渡 */
  transition: all 200ms ease-out;
`

const ContentContainer = styled.div<{
  $backgroundType: SubtitleBackgroundType
  $opacity: number
}>`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px 16px;
  border-radius: 8px;
  box-sizing: border-box;
  position: relative;

  /* 背景样式 */
  ${(props) => {
    switch (props.$backgroundType) {
      case SubtitleBackgroundType.TRANSPARENT:
        return css`
          background: transparent;
          backdrop-filter: none;
        `
      case SubtitleBackgroundType.BLUR:
        return css`
          background: rgba(0, 0, 0, ${props.$opacity * 0.6});
          backdrop-filter: blur(12px) saturate(180%);
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow:
            0 8px 32px rgba(0, 0, 0, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
        `
      case SubtitleBackgroundType.SOLID_BLACK:
        return css`
          background: rgba(0, 0, 0, ${props.$opacity});
          border: 1px solid rgba(255, 255, 255, 0.05);
          box-shadow:
            0 4px 16px rgba(0, 0, 0, 0.4),
            inset 0 1px 0 rgba(255, 255, 255, 0.05);
        `
      case SubtitleBackgroundType.SOLID_GRAY:
        return css`
          background: rgba(128, 128, 128, ${props.$opacity});
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow:
            0 4px 16px rgba(0, 0, 0, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
        `
      default:
        return css`
          background: transparent;
        `
    }
  }}

  /* 文本选中支持 */
  user-select: text;
  -webkit-user-select: text;
`

const ResizeHandle = styled.div<{ $visible: boolean }>`
  position: absolute;
  bottom: -4px;
  right: -4px;
  width: 12px;
  height: 12px;
  background: rgba(102, 126, 234, 0.8);
  border: 2px solid rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  cursor: nw-resize;
  opacity: ${(props) => (props.$visible ? 1 : 0)};
  transition: all 200ms ease;

  &:hover {
    background: #007aff;
    transform: scale(1.2);
    box-shadow: 0 2px 8px rgba(102, 126, 234, 0.4);
  }
`

const ToastContainer = styled.div<{ $visible: boolean }>`
  position: absolute;
  top: -40px;
  left: 50%;
  transform: translateX(-50%);
  opacity: ${(props) => (props.$visible ? 1 : 0)};
  visibility: ${(props) => (props.$visible ? 'visible' : 'hidden')};
  transition: opacity ${ANIMATION_DURATION.SLOW} ${EASING.APPLE};
  z-index: ${Z_INDEX.MODAL};
  pointer-events: none;
`

const ToastContent = styled.div`
  background: rgba(0, 0, 0, ${GLASS_EFFECT.BACKGROUND_ALPHA.LIGHT});
  color: #ffffff;
  padding: ${SPACING.XS}px ${SPACING.MD}px;
  border-radius: ${BORDER_RADIUS.SM}px;
  font-size: ${FONT_SIZES.SM}px;
  font-weight: ${FONT_WEIGHTS.MEDIUM};
  white-space: nowrap;
  backdrop-filter: blur(${GLASS_EFFECT.BLUR_STRENGTH.SUBTLE}px);
  border: 1px solid rgba(255, 255, 255, ${GLASS_EFFECT.BORDER_ALPHA.SUBTLE});
  box-shadow: ${SHADOWS.SM};
`

const DictionaryPopover = styled.div`
  position: absolute;
  transform: translate(-50%, calc(-100% - ${SPACING.SM}px));
  background: var(--ant-color-bg-elevated, rgba(0, 0, 0, ${GLASS_EFFECT.BACKGROUND_ALPHA.LIGHT}));
  backdrop-filter: blur(${GLASS_EFFECT.BLUR_STRENGTH.MEDIUM}px);
  border: 1px solid rgba(255, 255, 255, ${GLASS_EFFECT.BORDER_ALPHA.SUBTLE});
  border-radius: ${BORDER_RADIUS.LG}px;
  box-shadow: ${SHADOWS.LG};
  padding: ${SPACING.MD}px;
  color: var(--ant-color-white, #ffffff);
  min-width: 280px;
  max-width: 360px;
  max-height: 400px;
  overflow-y: auto;
  z-index: ${Z_INDEX.TOOLTIP};

  /* 渐入动画 */
  animation: fadeInUp 0.2s ease-out;

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translate(-50%, calc(-100% - ${SPACING.SM}px - 8px));
    }
    to {
      opacity: 1;
      transform: translate(-50%, calc(-100% - ${SPACING.SM}px));
    }
  }

  /* 自定义滚动条 */
  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 2px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.3);
    border-radius: 2px;

    &:hover {
      background: rgba(255, 255, 255, 0.5);
    }
  }

  /* 响应式调整 */
  @media (max-width: 600px) {
    min-width: 240px;
    max-width: 90vw;
    max-height: 300px;
  }
`

const LoadingContent = styled.div`
  display: flex;
  align-items: center;
  gap: ${SPACING.SM}px;
  padding: ${SPACING.SM}px 0;
  color: rgba(255, 255, 255, 0.8);
  font-size: ${FONT_SIZES.SM}px;

  .ant-spin {
    .ant-spin-dot {
      i {
        background-color: rgba(255, 255, 255, 0.8);
      }
    }
  }
`

const ErrorContent = styled.div`
  color: #ff7875;
  text-align: center;
  padding: ${SPACING.SM}px 0;

  span {
    font-weight: ${FONT_WEIGHTS.MEDIUM};
    margin-bottom: ${SPACING.XS}px;
    display: block;
  }

  div {
    font-size: ${FONT_SIZES.SM}px;
    opacity: 0.8;
  }
`

const WordHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${SPACING.XS}px;
`

const WordTitle = styled.h3`
  margin: 0;
  font-size: ${FONT_SIZES.LG}px;
  font-weight: ${FONT_WEIGHTS.SEMIBOLD};
  color: var(--ant-color-white, #ffffff);
  flex: 1;
`

const PronunciationButton = styled(Button)`
  &&& {
    color: rgba(255, 255, 255, 0.8);
    border: none;
    padding: 0 ${SPACING.XS}px;
    height: 24px;
    min-width: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;

    &:hover {
      color: #ffffff;
      background: rgba(255, 255, 255, 0.1);
    }

    &:active {
      background: rgba(255, 255, 255, 0.2);
    }
  }
`

const PhoneticText = styled.div`
  color: rgba(255, 255, 255, 0.7);
  font-size: ${FONT_SIZES.SM}px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  margin-bottom: ${SPACING.SM}px;
`

const DefinitionsList = styled.div`
  margin: 0;
`

const DefinitionItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${SPACING.XS / 2}px;
  margin-bottom: ${SPACING.SM}px;
  padding-bottom: ${SPACING.SM}px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);

  &:last-child {
    margin-bottom: 0;
    padding-bottom: 0;
    border-bottom: none;
  }
`

const PartOfSpeech = styled.span`
  font-size: ${FONT_SIZES.XS}px;
  font-weight: ${FONT_WEIGHTS.MEDIUM};
  color: #52c41a;
  background: rgba(82, 196, 26, 0.1);
  padding: 2px ${SPACING.XS}px;
  border-radius: ${BORDER_RADIUS.SM}px;
  display: inline-block;
  margin-bottom: ${SPACING.XS / 2}px;
`

const MeaningText = styled.div`
  color: rgba(255, 255, 255, 0.9);
  font-size: ${FONT_SIZES.SM}px;
  line-height: 1.5;
`

const MoreIndicator = styled.div`
  color: rgba(255, 255, 255, 0.6);
  font-size: ${FONT_SIZES.XS}px;
  text-align: center;
  padding: ${SPACING.XS}px 0;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
`

const TranslationSection = styled.div`
  margin-top: ${SPACING.SM}px;
`

const SectionTitle = styled.div`
  color: rgba(255, 255, 255, 0.8);
  font-size: ${FONT_SIZES.SM}px;
  font-weight: ${FONT_WEIGHTS.MEDIUM};
  margin-bottom: ${SPACING.XS}px;
`

const TranslationList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${SPACING.XS}px;
`

const TranslationItem = styled.span`
  background: rgba(22, 119, 255, 0.15);
  color: #40a9ff;
  padding: 2px ${SPACING.XS}px;
  border-radius: ${BORDER_RADIUS.SM}px;
  font-size: ${FONT_SIZES.SM}px;
  border: 1px solid rgba(64, 169, 255, 0.3);
`

// 自定义 Divider 组件
const Divider = styled.div<{ $margin: number }>`
  height: 1px;
  background: rgba(255, 255, 255, 0.08);
  margin: ${(props) => props.$margin}px 0;
`
