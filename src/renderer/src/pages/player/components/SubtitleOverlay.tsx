/**
 * SubtitleOverlay Component (重构版)
 *
 * 字幕覆盖层组件，提供：
 * - 可拖拽和调整尺寸的字幕显示
 * - 多种显示模式（隐藏/原文/译文/双语）
 * - 自定义背景样式（透明/模糊/纯色）
 * - 与播放器引擎的时间同步
 * - 文本选中和复制功能
 * - 响应式定位和尺寸适配
 *
 * 重构后架构：
 * - 主组件负责协调和数据流管理
 * - 复杂逻辑拆分到专门的 hooks
 * - UI 组件独立为子组件
 * - 坐标转换逻辑提取为工具函数
 */

import { usePlayerStore } from '@renderer/state'
import { SubtitleBackgroundType, SubtitleDisplayMode } from '@types'
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import styled, { css } from 'styled-components'

import { useContentWidth, useSubtitleOverlay, useSubtitleOverlayUI } from '../hooks'
import { useContainerBounds } from '../hooks/useContainerBounds'
import { useMaskViewport } from '../hooks/useMaskViewport'
import { useSubtitleDrag } from '../hooks/useSubtitleDrag'
import { useSubtitleResize } from '../hooks/useSubtitleResize'
import {
  fromMaskRelativePosition,
  fromMaskRelativeSize,
  type Position,
  type Size,
  toMaskRelativePosition,
  toMaskRelativeSize
} from '../utils/coordinateTransform'
import SubtitleContent from './SubtitleContent'
import SubtitleResizeHandle from './SubtitleResizeHandle'
import SubtitleToast from './SubtitleToast'

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

  // === 状态集成 ===
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
  const isMaskMode = currentConfig.isMaskMode
  const autoPositioning = currentConfig.autoPositioning

  // === 配置操作（通过 integration） ===
  const setPosition = integration.setPosition
  const setSize = integration.setSize
  const setMaskOnboardingComplete = integration.setMaskOnboardingComplete
  const maskOnboardingComplete = integration.maskOnboardingComplete

  // === 本地状态 ===
  const overlayRef = useRef<HTMLDivElement>(null)
  const [toastVisible, setToastVisible] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState<'copy' | 'mask-onboarding' | null>(null)
  const hideToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 使用动态宽度计算 hook (YouTube 风格 - 纯 CSS 方案)
  const { widthStyle, maxWidthStyle } = useContentWidth({
    maxContainerWidthPercent: 95
  })

  // === 遮罩视口管理 ===
  const { maskViewport } = useMaskViewport({
    containerRef,
    isMaskMode,
    containerBounds
  })

  // === 模式切换坐标转换 ===
  const previousMaskModeRef = useRef(isMaskMode)
  useEffect(() => {
    if (!maskViewport) return

    const modeChanged = isMaskMode !== previousMaskModeRef.current
    previousMaskModeRef.current = isMaskMode

    if (modeChanged) {
      if (isMaskMode) {
        // 切换到遮罩模式：转换为相对坐标
        const relativePosition = toMaskRelativePosition(position, maskViewport)
        const relativeSize = toMaskRelativeSize(size, maskViewport)
        setPosition(relativePosition)
        setSize(relativeSize)
      } else {
        // 切换出遮罩模式：转换为绝对坐标
        const absolutePosition = fromMaskRelativePosition(position, maskViewport)
        const absoluteSize = fromMaskRelativeSize(size, maskViewport)
        setPosition(absolutePosition)
        setSize(absoluteSize)
      }
    }
  }, [isMaskMode, maskViewport, position, size, setPosition, setSize])

  // === 计算覆盖层位置和尺寸 ===
  const overlayPosition = useMemo(() => {
    if (isMaskMode && maskViewport) {
      return fromMaskRelativePosition(position, maskViewport)
    }
    return position
  }, [isMaskMode, maskViewport, position])

  const overlaySize = useMemo(() => {
    if (isMaskMode && maskViewport) {
      return fromMaskRelativeSize(size, maskViewport)
    }
    return size
  }, [isMaskMode, maskViewport, size])

  // === 容器边界管理 ===
  useContainerBounds({
    containerRef,
    displayMode,
    currentConfig,
    updateContainerBounds,
    adaptToContainerResize,
    avoidCollision
  })

  // === 拖拽交互 ===
  const {
    handleMouseDown: handleDragMouseDown,
    updateLatestPosition,
    updateLatestSize: updateLatestSizeFromDrag
  } = useSubtitleDrag({
    overlayPosition,
    overlaySize,
    containerBounds,
    isMaskMode,
    maskViewport,
    isResizing,
    autoPositioning,
    onPositionChange: setPosition,
    onDragStart: startDragging,
    onDragEnd: stopDragging,
    onDisableAutoPositioning: () => {
      usePlayerStore.getState().setSubtitleOverlay({ autoPositioning: false })
    },
    onMaskOnboardingComplete: () => {
      setMaskOnboardingComplete(true)
      setToastVisible(false)
    },
    overlayRef
  })

  // === 尺寸调整交互 ===
  const {
    handleResizeMouseDown,
    handleResizeDoubleClick,
    updateLatestSize,
    updateLatestPosition: updateLatestPositionFromResize
  } = useSubtitleResize({
    overlayPosition,
    overlaySize,
    containerBounds,
    isMaskMode,
    maskViewport,
    autoPositioning,
    onSizeChange: setSize,
    onPositionChange: setPosition,
    onResizeStart: startResizing,
    onResizeEnd: stopResizing,
    onDisableAutoPositioning: () => {
      usePlayerStore.getState().setSubtitleOverlay({ autoPositioning: false })
    },
    onMaskOnboardingComplete: () => {
      setMaskOnboardingComplete(true)
      setToastVisible(false)
    },
    overlayRef
  })

  // === 更新最新位置和尺寸引用 ===
  useEffect(() => {
    updateLatestPosition(overlayPosition)
  }, [overlayPosition, updateLatestPosition])

  useEffect(() => {
    updateLatestSize(overlaySize)
  }, [overlaySize, updateLatestSize])

  useEffect(() => {
    updateLatestSizeFromDrag(overlaySize)
  }, [overlaySize, updateLatestSizeFromDrag])

  useEffect(() => {
    updateLatestPositionFromResize(overlayPosition)
  }, [overlayPosition, updateLatestPositionFromResize])

  // === Toast 消息管理 ===
  const showToast = useCallback((message: string, type: 'copy' | 'mask-onboarding' = 'copy') => {
    setToastMessage(message)
    setToastType(type)
    setToastVisible(true)

    // 清除之前的定时器
    if (hideToastTimerRef.current) {
      clearTimeout(hideToastTimerRef.current)
    }

    // 800ms 后自动隐藏
    hideToastTimerRef.current = setTimeout(() => {
      setToastVisible(false)
      setToastType(null)
      hideToastTimerRef.current = null
    }, 800)
  }, [])

  // === 复制成功toast监听器 ===
  useEffect(() => {
    const handleSubtitleCopied = (event: CustomEvent<{ message: string }>) => {
      const { message } = event.detail
      showToast(message, 'copy')
    }

    window.addEventListener('subtitle-copied', handleSubtitleCopied as EventListener)

    return () => {
      if (hideToastTimerRef.current) {
        clearTimeout(hideToastTimerRef.current)
        hideToastTimerRef.current = null
      }
      window.removeEventListener('subtitle-copied', handleSubtitleCopied as EventListener)
    }
  }, [showToast])

  // === 遮罩模式引导提示 ===
  useEffect(() => {
    if (isMaskMode && !maskOnboardingComplete) {
      if (hideToastTimerRef.current) {
        clearTimeout(hideToastTimerRef.current)
        hideToastTimerRef.current = null
      }
      setToastMessage(t('player.controls.subtitle.mask-mode.onboarding'))
      setToastType('mask-onboarding')
      setToastVisible(true)
    } else if (!isMaskMode && toastVisible && toastType === 'mask-onboarding') {
      // 只有在遮罩模式引导类型的 toast 时才隐藏
      setToastVisible(false)
      setToastType(null)
    }
  }, [isMaskMode, maskOnboardingComplete, t, toastVisible, toastType])

  // === 交互事件处理 ===
  const handleMouseEnter = useCallback(() => {
    setHovered(true)
  }, [setHovered])

  const handleMouseLeave = useCallback(() => {
    if (!isDragging && !isResizing) {
      setHovered(false)
    }
  }, [setHovered, isDragging, isResizing])

  const handleClick = useCallback((event: React.MouseEvent) => {
    // 阻止所有点击事件冒泡到VideoSurface，防止触发播放/暂停
    event.stopPropagation()
  }, [])

  // === 条件渲染：配置未加载或隐藏模式不显示 ===
  const shouldRender = useMemo(
    () => displayMode !== SubtitleDisplayMode.NONE && integration.shouldShow,
    [displayMode, integration.shouldShow]
  )

  if (!shouldRender) {
    return null
  }

  const effectiveBackgroundType = isMaskMode ? SubtitleBackgroundType.BLUR : backgroundStyle.type

  return (
    <>
      <OverlayContainer
        ref={overlayRef}
        $position={overlayPosition}
        $size={overlaySize}
        $showBoundaries={showBoundaries}
        $isDragging={isDragging}
        $isResizing={isResizing}
        $isHovered={isHovered}
        $isMaskMode={isMaskMode}
        $backgroundType={effectiveBackgroundType}
        $opacity={backgroundStyle.opacity}
        $width={isMaskMode ? 'none' : widthStyle}
        $maxWidth={isMaskMode ? 'none' : maxWidthStyle}
        onMouseDown={handleDragMouseDown}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        data-testid="subtitle-overlay"
        aria-label="字幕覆盖层"
        tabIndex={0}
      >
        <ContentContainer
          $backgroundType={effectiveBackgroundType}
          $opacity={backgroundStyle.opacity}
        >
          <SubtitleContent
            displayMode={displayMode}
            originalText={integration.currentSubtitle?.originalText || ''}
            translatedText={integration.currentSubtitle?.translatedText}
            containerHeight={containerBounds.height}
          />
        </ContentContainer>

        {/* 只在遮罩模式下且悬停时显示调整大小句柄 */}
        <SubtitleResizeHandle
          visible={isMaskMode && isHovered}
          onMouseDown={handleResizeMouseDown}
          onDoubleClick={handleResizeDoubleClick}
        />

        <SubtitleToast visible={toastVisible} message={toastMessage} />
      </OverlayContainer>
    </>
  )
})

export default SubtitleOverlay

// === 样式组件 ===
const OverlayContainer = styled.section<{
  $position: Position
  $size: Size
  $showBoundaries: boolean
  $isDragging: boolean
  $isResizing: boolean
  $isHovered: boolean
  $isMaskMode: boolean
  $backgroundType: SubtitleBackgroundType
  $opacity: number
  $width: string
  $maxWidth: string
}>`
  /* 基础定位和尺寸 */
  position: absolute;
  /* 非遮罩模式下，使用水平居中定位，忽略 position.x */
  left: ${(props) => (props.$isMaskMode ? `${props.$position.x}%` : '50%')};
  transform: ${(props) => (props.$isMaskMode ? 'none' : 'translateX(-50%)')};
  top: ${(props) => props.$position.y}%;
  /* 非遮罩模式下使用 fit-content 让内容自然决定宽度 */
  width: ${(props) => (props.$isMaskMode ? `${props.$size.width}%` : props.$width)};
  max-width: ${(props) => (props.$isMaskMode ? 'none' : props.$maxWidth)};
  height: ${(props) => (props.$isMaskMode ? `${Math.max(props.$size.height, 1)}%` : 'auto')};
  min-height: ${(props) => (props.$isMaskMode ? '0' : '60px')};
  max-height: ${(props) => (props.$isMaskMode ? 'none' : '160px')};

  /* 基础样式 */
  pointer-events: auto;
  user-select: none;
  border-radius: 8px;

  /* 交互状态样式 */
  cursor: ${(props) => {
    if (props.$isDragging) return 'grabbing'
    if (props.$isResizing) return 'nw-resize'
    // 非遮罩模式下使用 ns-resize（垂直拖动）光标
    return props.$isMaskMode ? 'grab' : 'ns-resize'
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
      transform: ${props.$isMaskMode ? 'rotate(1deg)' : 'translateX(-50%) rotate(1deg)'};
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
  border-radius: 8px;
  box-sizing: border-box;
  position: relative;
  overflow: visible;

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
