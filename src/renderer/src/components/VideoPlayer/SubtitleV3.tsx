import React, { useState, useMemo, useRef, useEffect, memo } from 'react'
import { WordCard } from '@renderer/components/WordCard/WordCard'
import { usePlayingVideoContext } from '@renderer/hooks/usePlayingVideoContext'
import { useSubtitleState } from '@renderer/hooks/useSubtitleState'
import { useSubtitleDragAndResize } from '@renderer/hooks/useSubtitleDragAndResize'
import { useSubtitleStyles } from '@renderer/hooks/useSubtitleStyles'
import { useTheme } from '@renderer/hooks/useTheme'
import { useSubtitleEventHandlers } from '@renderer/hooks/useSubtitleEventHandlers'
import { useUIStore } from '@renderer/stores/slices/uiStore'
import { SubtitleContent } from './SubtitleContent'
import { MaskFrame } from './MaskFrame'
import { SubtitleContextMenu } from './SubtitleContextMenu'
import RendererLogger from '@renderer/utils/logger'

interface SubtitleV3Props {
  onWordHover: (isHovering: boolean) => void
  onPauseOnHover: () => void
}

// Split subcomponent: Mask overlay
const MaskOverlay = memo((): React.JSX.Element => {
  const { styles } = useTheme()

  const style = useMemo(
    (): React.CSSProperties => ({
      ...styles.subtitleMaskOverlay,
      position: 'absolute',
      left: '0%',
      top: '0%',
      width: '100%',
      height: '100%',
      zIndex: 5,
      pointerEvents: 'none'
    }),
    [styles]
  )

  return <div style={style} />
})
MaskOverlay.displayName = 'MaskOverlay'

// Split subcomponent: Resize handle
const ResizeHandle = memo(
  ({
    visible,
    buttonSize,
    onMouseDown
  }: {
    visible: boolean
    buttonSize: number
    onMouseDown: (e: React.MouseEvent) => void
  }): React.JSX.Element | null => {
    const { styles } = useTheme()

    const handleStyle = useMemo(
      (): React.CSSProperties => ({
        ...styles.subtitleResizeHandle,
        bottom: 0,
        right: 0,
        width: `${Math.max(12, Math.min(24, buttonSize * 0.5))}px`,
        height: `${Math.max(12, Math.min(24, buttonSize * 0.5))}px`,
        cursor: 'se-resize',
        borderRadius: '3px 0 8px 0'
      }),
      [styles, buttonSize]
    )

    if (!visible) return null

    return <div onMouseDown={onMouseDown} style={handleStyle} />
  }
)
ResizeHandle.displayName = 'ResizeHandle'

/**
 * Renders an interactive subtitle component with draggable, resizable, and mask overlay features.
 *
 * Provides word-level hover and click interactions, subtitle area drag and resize, mask mode with adjustable frame, and dynamic background styling. Integrates with video context for aspect ratio-aware layout and exposes callbacks for word hover and video pause events.
 *
 * @param onWordHover - Callback invoked when a word in the subtitle is hovered.
 * @param onPauseOnHover - Callback invoked to pause the video when a word is hovered.
 * @returns The rendered subtitle UI with controls, mask overlay, and word card popup.
 */
function SubtitleV3({ onWordHover, onPauseOnHover }: SubtitleV3Props): React.JSX.Element {
  RendererLogger.componentRender({
    component: 'SubtitleV3',
    props: { onWordHover, onPauseOnHover }
  })

  // Get video context
  const { displayAspectRatio } = usePlayingVideoContext()

  // Get theme
  const { styles } = useTheme()

  // Get subtitle layout lock state - 获取字幕布局锁定状态
  const { isSubtitleLayoutLocked } = useUIStore()

  // Add window dimensions state to trigger re-renders when window size changes
  const [windowDimensions, setWindowDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  })

  // References
  const containerRef = useRef<HTMLDivElement>(null)
  const parentDimensionsRef = useRef({ width: 0, height: 0 })
  const renderCount = useRef(0)

  // Add window resize listener to update dimensions and trigger re-renders
  useEffect(() => {
    const handleResize = (): void => {
      const newDimensions = {
        width: window.innerWidth,
        height: window.innerHeight
      }

      // Only update if dimensions actually changed to avoid unnecessary re-renders
      setWindowDimensions((prev) => {
        if (prev.width !== newDimensions.width || prev.height !== newDimensions.height) {
          if (process.env.NODE_ENV === 'development') {
            console.log('🔄 Window resized, updating subtitle font sizes:', {
              from: prev,
              to: newDimensions
            })
          }
          return newDimensions
        }
        return prev
      })
    }

    // Use throttled resize handler to improve performance
    const throttledResize = (() => {
      let timeoutId: NodeJS.Timeout | null = null
      return () => {
        if (timeoutId) clearTimeout(timeoutId)
        timeoutId = setTimeout(handleResize, 100) // 100ms throttle
      }
    })()

    window.addEventListener('resize', throttledResize)

    return () => {
      window.removeEventListener('resize', throttledResize)
    }
  }, [])

  // Get parent container dimensions - recalculate when window dimensions change
  const parentDimensions = useMemo(() => {
    const parent = containerRef.current?.parentElement
    const dimensions = {
      width: parent?.clientWidth || 0,
      height: parent?.clientHeight || 0
    }
    parentDimensionsRef.current = dimensions
    return dimensions
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
    useSubtitleState(parentDimensions.width, parentDimensions.height, displayAspectRatio)

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

  // Use event handlers hook
  const eventHandlers = useSubtitleEventHandlers({
    subtitleState,
    updateSubtitleState,
    toggleMaskMode,
    toggleBackgroundType,
    displayAspectRatio,
    containerRef,
    dragAndResizeProps,
    onWordHover,
    onPauseOnHover
  })

  // Global event listener management
  useEffect(() => {
    const isDraggingOrResizing = dragAndResizeProps.isDragging || dragAndResizeProps.isResizing

    if (!isDraggingOrResizing) {
      return
    }

    const handleMouseMove = (e: MouseEvent): void => {
      dragAndResizeProps.handleMouseMove(e, containerRef)
    }
    const handleMouseUp = (): void => {
      dragAndResizeProps.handleMouseUp()
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [
    dragAndResizeProps.isDragging,
    dragAndResizeProps.isResizing,
    dragAndResizeProps.handleMouseMove,
    dragAndResizeProps.handleMouseUp,
    dragAndResizeProps
  ])

  // Note: Mask mode state changes are now handled in the event handlers hook

  // Handle clicks outside context menu to close it - 处理右键菜单外部点击关闭
  useEffect(() => {
    if (!eventHandlers.contextMenuVisible) return

    const handleClickOutside = (): void => {
      eventHandlers.handleContextMenuClose()
    }

    document.addEventListener('click', handleClickOutside)

    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [eventHandlers.contextMenuVisible, eventHandlers.handleContextMenuClose])

  // Calculate actual background type
  const actualBackgroundType = useMemo(() => {
    const isDraggingOrResizing = dragAndResizeProps.isDragging || dragAndResizeProps.isResizing
    return isDraggingOrResizing ? 'transparent' : subtitleState.backgroundType
  }, [dragAndResizeProps.isDragging, dragAndResizeProps.isResizing, subtitleState.backgroundType])

  // Container style
  const containerStyle = useMemo((): React.CSSProperties => {
    const isDraggingOrResizing = dragAndResizeProps.isDragging || dragAndResizeProps.isResizing
    const cursor = dragAndResizeProps.isDragging
      ? 'grabbing'
      : dragAndResizeProps.isResizing
        ? 'se-resize'
        : 'grab'

    const left = subtitleState.isMaskMode
      ? `${subtitleState.maskFrame.left + (currentLayout.left * subtitleState.maskFrame.width) / 100}%`
      : `${currentLayout.left}%`

    const top = subtitleState.isMaskMode
      ? `${subtitleState.maskFrame.top + (currentLayout.top * subtitleState.maskFrame.height) / 100}%`
      : `${currentLayout.top}%`

    const width = subtitleState.isMaskMode
      ? `${(currentLayout.width * subtitleState.maskFrame.width) / 100}%`
      : `${currentLayout.width}%`

    const height = subtitleState.isMaskMode
      ? `${(currentLayout.height * subtitleState.maskFrame.height) / 100}%`
      : `${currentLayout.height}%`

    // Merge with theme styles
    const baseStyle = styles.subtitleContainer
    const hoverStyle = eventHandlers.isHovering ? styles.subtitleContainerHover : {}
    const draggingStyle = isDraggingOrResizing ? styles.subtitleContainerDragging : {}

    return {
      ...baseStyle,
      ...hoverStyle,
      ...draggingStyle,
      left,
      top,
      width,
      height,
      cursor,
      zIndex: isDraggingOrResizing ? 100 : 10,
      userSelect: isDraggingOrResizing ? 'none' : 'auto'
    }
  }, [
    subtitleState.isMaskMode,
    subtitleState.maskFrame,
    currentLayout,
    dragAndResizeProps.isDragging,
    dragAndResizeProps.isResizing,
    eventHandlers.isHovering,
    styles
  ])

  // Subtitle content style
  const subtitleContentStyle = useMemo((): React.CSSProperties => {
    const baseStyle = styles.subtitleContent

    let backgroundStyle: React.CSSProperties = {}
    switch (actualBackgroundType) {
      case 'transparent':
        backgroundStyle = styles.subtitleContentTransparent
        break
      case 'blur':
        backgroundStyle = styles.subtitleContentBlur
        break
      case 'solid-black':
        backgroundStyle = styles.subtitleContentSolidBlack
        break
      case 'solid-gray':
        backgroundStyle = styles.subtitleContentSolidGray
        break
      default:
        backgroundStyle = styles.subtitleContentTransparent
    }

    return {
      ...baseStyle,
      ...backgroundStyle
    }
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
        <WordCard
          word={eventHandlers.selectedWord.word}
          targetElement={eventHandlers.selectedWord.element}
          onClose={eventHandlers.handleCloseWordCard}
        />
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
    prevProps.onPauseOnHover === nextProps.onPauseOnHover
  )
})

export { MemoizedSubtitleV3 as SubtitleV3 }
