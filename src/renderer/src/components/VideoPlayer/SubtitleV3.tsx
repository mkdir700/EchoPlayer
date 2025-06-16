import React, { useMemo, useRef, memo, Suspense } from 'react'
// 懒加载 WordCard 组件 / Lazy load WordCard component
const WordCard = React.lazy(() =>
  import('@renderer/components/WordCard/WordCard').then((module) => ({ default: module.WordCard }))
)
import { usePlayingVideoContext } from '@renderer/hooks/core/usePlayingVideoContext'
import { useSubtitleDragAndResize } from '@renderer/hooks/features/subtitle/useSubtitleDragAndResize'
import { useVideoSubtitleState } from '@renderer/hooks/features/video/useVideoSubtitleState'
import { useSubtitleStyles } from '@renderer/hooks/features/subtitle/useSubtitleStyles'
import { useTheme } from '@renderer/hooks/features/ui/useTheme'
import { SubtitleContent } from './SubtitleContent'
import { MaskFrame } from './MaskFrame'
import { SubtitleContextMenu } from './SubtitleContextMenu'
import RendererLogger from '@renderer/utils/logger'
import { useVideoConfig } from '@renderer/hooks/features/video/useVideoConfig'

import { MaskOverlay, ResizeHandle } from './SubtitleV3/subcomponents'
import { useWindowDimensions, useSubtitleEventHandlers } from './SubtitleV3/hooks'
import {
  calculateActualBackgroundType,
  calculateContainerStyle,
  calculateSubtitleContentStyle
} from './SubtitleV3/utils/styleCalculations'
import type { SubtitleV3Props } from './SubtitleV3/types'

/**
 * Renders an interactive subtitle component with draggable, resizable, and mask overlay features.
 *
 * Provides word-level hover and click interactions, subtitle area drag and resize, mask mode with adjustable frame, and dynamic background styling. Integrates with video context for aspect ratio-aware layout and exposes callbacks for word hover and video pause events.
 *
 * @param onWordHover - Callback invoked when a word in the subtitle is hovered.
 * @param enableTextSelection - Whether to enable text selection
 * @param onSelectionChange - Callback invoked when text selection changes
 * @returns The rendered subtitle UI with controls, mask overlay, and word card popup.
 */
function SubtitleV3({
  onWordHover,
  enableTextSelection = false,
  onSelectionChange
}: SubtitleV3Props): React.JSX.Element {
  RendererLogger.componentRender({
    component: 'SubtitleV3',
    props: { onWordHover, enableTextSelection }
  })

  // Get video context
  const { displayAspectRatio } = usePlayingVideoContext()

  // Get theme
  const { styles } = useTheme()

  // Get subtitle layout lock state - 获取字幕布局锁定状态
  const { isSubtitleLayoutLocked } = useVideoConfig()

  // Use window dimensions hook for optimized resize handling
  // 使用窗口尺寸 Hook 进行优化的调整大小处理
  const windowDimensions = useWindowDimensions()

  // References
  const containerRef = useRef<HTMLDivElement>(null)
  const parentDimensionsRef = useRef({ width: 0, height: 0 })
  const renderCount = useRef(0)

  // Get parent container dimensions - recalculate when window dimensions change
  const parentDimensions = useMemo(() => {
    const parent = containerRef.current?.parentElement
    const dimensions = {
      width: parent?.clientWidth || 0,
      height: parent?.clientHeight || 0
    }
    parentDimensionsRef.current = dimensions
    return dimensions
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [windowDimensions]) // Add windowDimensions as dependency to trigger recalculation on resize

  // Get stable function for parent container bounds
  const getParentBounds = useMemo(() => {
    return () => {
      const parent = containerRef.current?.parentElement
      if (parent) {
        const dimensions = {
          width: parent.clientWidth,
          height: parent.clientHeight
        }
        parentDimensionsRef.current = dimensions
        return dimensions
      }
      return parentDimensionsRef.current
    }
  }, [])

  // Use state management hook
  const { subtitleState, updateSubtitleState, toggleBackgroundType, toggleMaskMode } =
    useVideoSubtitleState(parentDimensions.width, parentDimensions.height, displayAspectRatio)

  // Calculate current layout - only depends on necessary state
  const currentLayout = useMemo(() => {
    const { left, top, right, bottom } = subtitleState.margins
    return {
      left,
      top,
      width: 100 - left - right,
      height: 100 - top - bottom
    }
  }, [subtitleState.margins])

  // Use drag and resize hook
  const dragAndResizeProps = useSubtitleDragAndResize(
    subtitleState,
    updateSubtitleState,
    getParentBounds,
    currentLayout
  )

  // Use styles hook - force recalculation when windowDimensions change by creating new layout object
  const currentLayoutWithWindowDimensions = useMemo(() => {
    return {
      left: currentLayout.left,
      top: currentLayout.top,
      width: currentLayout.width,
      height: currentLayout.height,
      // Include window dimensions in the object to force hook recalculation
      _windowWidth: windowDimensions.width,
      _windowHeight: windowDimensions.height
    }
  }, [currentLayout, windowDimensions])

  const { dynamicTextStyle, dynamicEnglishTextStyle, dynamicChineseTextStyle, buttonSize } =
    useSubtitleStyles(currentLayoutWithWindowDimensions)

  // Use refactored event handlers hook - 使用重构后的事件处理器 hook
  const eventHandlers = useSubtitleEventHandlers({
    subtitleState,
    updateSubtitleState,
    toggleMaskMode,
    toggleBackgroundType,
    displayAspectRatio,
    containerRef,
    dragAndResizeProps,
    onWordHover
  })

  // Calculate actual background type
  const actualBackgroundType = useMemo(() => {
    return calculateActualBackgroundType(
      dragAndResizeProps.isDragging,
      dragAndResizeProps.isResizing,
      subtitleState.backgroundType
    )
  }, [dragAndResizeProps.isDragging, dragAndResizeProps.isResizing, subtitleState.backgroundType])

  // Container style
  const containerStyle = useMemo((): React.CSSProperties => {
    return calculateContainerStyle({
      subtitleState,
      currentLayout,
      isDragging: dragAndResizeProps.isDragging,
      isResizing: dragAndResizeProps.isResizing,
      isHovering: eventHandlers.isHovering,
      isSubtitleLayoutLocked,
      styles: {
        subtitleContainer: styles.subtitleContainer,
        subtitleContainerHover: styles.subtitleContainerHover,
        subtitleContainerDragging: styles.subtitleContainerDragging
      }
    })
  }, [
    subtitleState,
    currentLayout,
    dragAndResizeProps.isDragging,
    dragAndResizeProps.isResizing,
    eventHandlers.isHovering,
    isSubtitleLayoutLocked,
    styles
  ])

  // Subtitle content style
  const subtitleContentStyle = useMemo((): React.CSSProperties => {
    return calculateSubtitleContentStyle(
      {
        subtitleContent: styles.subtitleContent,
        subtitleContentTransparent: styles.subtitleContentTransparent,
        subtitleContentBlur: styles.subtitleContentBlur,
        subtitleContentSolidBlack: styles.subtitleContentSolidBlack,
        subtitleContentSolidGray: styles.subtitleContentSolidGray
      },
      actualBackgroundType
    )
  }, [styles, actualBackgroundType])

  // Development environment debugging
  if (process.env.NODE_ENV === 'development') {
    renderCount.current += 1
    if (renderCount.current % 10 === 0) {
      console.log(`🔄 SubtitleV3 render #${renderCount.current}`)
    }
  }

  return (
    <>
      {/* Mask mode effect */}
      {subtitleState.isMaskMode && (
        <>
          <MaskOverlay />
          <MaskFrame
            maskFrame={subtitleState.maskFrame}
            updateMaskFrame={eventHandlers.updateMaskFrame}
            containerRef={containerRef}
            isMaskFrameActive={eventHandlers.isMaskFrameActive}
            onMaskFrameMouseEnter={eventHandlers.handleMaskFrameMouseEnter}
            onMaskFrameMouseLeave={eventHandlers.handleMaskFrameMouseLeave}
          />
        </>
      )}

      {/* Subtitle container */}
      <div
        ref={containerRef}
        data-subtitle-container
        style={containerStyle}
        onMouseDown={eventHandlers.handleContainerMouseDown}
        onMouseEnter={eventHandlers.handleMouseEnter}
        onMouseLeave={eventHandlers.handleMouseLeave}
        onContextMenu={eventHandlers.handleContextMenu}
      >
        {/* Subtitle content area */}
        <div style={subtitleContentStyle}>
          <SubtitleContent
            dynamicTextStyle={dynamicTextStyle}
            dynamicEnglishTextStyle={dynamicEnglishTextStyle}
            dynamicChineseTextStyle={dynamicChineseTextStyle}
            onWordHover={eventHandlers.handleWordHover}
            onWordClick={eventHandlers.handleWordClick}
            enableTextSelection={enableTextSelection}
            onSelectionChange={onSelectionChange}
          />
        </div>

        {/* Resize handle */}
        <ResizeHandle
          visible={eventHandlers.isHovering && !isSubtitleLayoutLocked}
          buttonSize={buttonSize}
          onMouseDown={eventHandlers.handleResizeMouseDown}
        />
      </div>

      {/* Word card */}
      {eventHandlers.selectedWord && (
        <Suspense fallback={<div>Loading word card...</div>}>
          <WordCard
            word={eventHandlers.selectedWord.word}
            targetElement={eventHandlers.selectedWord.element}
            onClose={eventHandlers.handleCloseWordCard}
          />
        </Suspense>
      )}

      {/* Context menu - 右键菜单 */}
      <SubtitleContextMenu
        visible={eventHandlers.contextMenuVisible}
        position={eventHandlers.contextMenuPosition}
        isMaskMode={subtitleState.isMaskMode}
        backgroundType={subtitleState.backgroundType}
        onClose={eventHandlers.handleContextMenuClose}
        onMaskModeToggle={eventHandlers.handleMaskModeClick}
        onBackgroundTypeToggle={eventHandlers.handleBackgroundTypeClick}
        onReset={eventHandlers.handleResetClick}
        onExpand={eventHandlers.handleExpandClick}
      />
    </>
  )
}

// Use stricter comparison function
const MemoizedSubtitleV3 = memo(SubtitleV3, (prevProps, nextProps) => {
  return (
    prevProps.onWordHover === nextProps.onWordHover &&
    prevProps.enableTextSelection === nextProps.enableTextSelection &&
    prevProps.onSelectionChange === nextProps.onSelectionChange
  )
})

export { MemoizedSubtitleV3 as SubtitleV3 }
