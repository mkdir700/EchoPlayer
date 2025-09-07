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
import { usePlayerStore } from '@renderer/state'
import { SubtitleBackgroundType, SubtitleDisplayMode } from '@types'
import { Tooltip } from 'antd'
import React, { memo, useCallback, useEffect, useMemo, useRef } from 'react'
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
    avoidCollision,
    calculateOptimalPosition
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
          calculateOptimalPosition(newBounds)
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
    const observer = new ResizeObserver((entries) => {
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

    return () => {
      clearTimeout(resizeTimer)
      window.removeEventListener('resize', handleResize)
      observer.disconnect()
    }
  }, [
    containerRef,
    updateContainerBounds,
    adaptToContainerResize,
    calculateOptimalPosition,
    currentConfig?.isInitialized
  ])

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

          const newPosition = {
            x: Math.max(
              0,
              Math.min(100 - size.width, startPosition.x + (deltaX / containerBounds.width) * 100)
            ),
            y: Math.max(
              0,
              Math.min(100 - 20, startPosition.y + (deltaY / containerBounds.height) * 100)
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
      event.stopPropagation()

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
  const handleWordClick = useCallback((word: string, token: any) => {
    logger.debug('字幕单词被点击', { word, tokenIndex: token.index })
    // TODO: 实现单词点击的 popup 功能
  }, [])

  // === ResizeHandle 双击扩展处理 ===
  const handleResizeDoubleClick = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault()
      event.stopPropagation()

      // 计算当前字幕框的中心点
      const currentCenterX = position.x + size.width / 2

      const maxWidth = 95 // 最大宽度95%

      // 计算新的位置，让字幕框向两边扩展
      const newX = Math.max(
        0, // 不能超出左边界
        Math.min(
          100 - maxWidth, // 不能超出右边界
          currentCenterX - maxWidth / 2 // 以中心点为基准向两边扩展
        )
      )

      const newSize = {
        ...size,
        width: maxWidth
      }

      const newPosition = {
        ...position,
        x: newX
      }

      // 同时更新尺寸和位置
      setSize(newSize)
      setPosition(newPosition)

      logger.info('字幕覆盖层双击扩展', {
        newSize,
        newPosition,
        currentCenterX,
        expandedFromCenter: true
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
        />
      </ContentContainer>

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
  min-height: 60px;
  max-height: 200px;

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
