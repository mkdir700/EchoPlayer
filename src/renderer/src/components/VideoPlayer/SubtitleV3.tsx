import React, { useState, useCallback, useMemo, useRef, useEffect, memo } from 'react'
import { WordCard } from '@renderer/components/WordCard/WordCard'
import { usePlayingVideoContext } from '@renderer/hooks/usePlayingVideoContext'
import {
  useSubtitleState,
  createDefaultSubtitleState,
  type SubtitleMarginsState,
  type BackgroundType
} from '@renderer/hooks/useSubtitleState'
import { useSubtitleDragAndResize } from '@renderer/hooks/useSubtitleDragAndResize'
import { useSubtitleStyles } from '@renderer/hooks/useSubtitleStyles'
import { useTheme } from '@renderer/hooks/useTheme'
import { SubtitleControls } from './SubtitleControls'
import { SubtitleContent } from './SubtitleContent'
import { MaskFrame } from './MaskFrame'
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

// Split subcomponent: Control buttons
const SubtitleControlsWrapper = memo(
  ({
    visible,
    currentLayout,
    subtitleState,
    buttonSize,
    iconSize,
    onToggleMaskMode,
    onToggleBackgroundType,
    onReset,
    onExpandHorizontally,
    onMouseEnter,
    onMouseLeave
  }: {
    visible: boolean
    currentLayout: { left: number; top: number; width: number; height: number }
    subtitleState: { isMaskMode: boolean; backgroundType: BackgroundType }
    buttonSize: number
    iconSize: number
    onToggleMaskMode: () => void
    onToggleBackgroundType: () => void
    onReset: () => void
    onExpandHorizontally: () => void
    onMouseEnter: () => void
    onMouseLeave: () => void
  }): React.JSX.Element | null => {
    const controlsStyle = useMemo(
      (): React.CSSProperties => ({
        position: 'absolute',
        left: `${Math.min(95, currentLayout.left + currentLayout.width)}%`,
        top: `${Math.max(5, currentLayout.top - 2)}%`,
        transform: 'translate(-100%, -100%)',
        zIndex: 150
      }),
      [currentLayout.left, currentLayout.top, currentLayout.width]
    )

    if (!visible) return null

    return (
      <div style={controlsStyle} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
        <SubtitleControls
          isMaskMode={subtitleState.isMaskMode}
          backgroundType={subtitleState.backgroundType}
          buttonSize={buttonSize}
          iconSize={iconSize}
          onToggleMaskMode={onToggleMaskMode}
          onToggleBackgroundType={onToggleBackgroundType}
          onReset={onReset}
          onExpandHorizontally={onExpandHorizontally}
        />
      </div>
    )
  }
)
SubtitleControlsWrapper.displayName = 'SubtitleControlsWrapper'

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

function SubtitleV3({ onWordHover, onPauseOnHover }: SubtitleV3Props): React.JSX.Element {
  RendererLogger.componentRender({
    component: 'SubtitleV3',
    props: { onWordHover, onPauseOnHover }
  })

  // Get video context
  const { displayAspectRatio } = usePlayingVideoContext()

  // Get theme
  const { styles } = useTheme()

  // Local state
  const [selectedWord, setSelectedWord] = useState<{
    word: string
    element: HTMLElement
  } | null>(null)
  const [isHovering, setIsHovering] = useState(false)
  const [isControlsHovering, setIsControlsHovering] = useState(false)
  const [isMaskFrameActive, setIsMaskFrameActive] = useState(false)

  // References
  const containerRef = useRef<HTMLDivElement>(null)
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const maskFrameCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const parentDimensionsRef = useRef({ width: 0, height: 0 })
  const renderCount = useRef(0)

  // Stable callback functions - store latest values using useRef to keep function reference stable
  const callbacksRef = useRef({
    onWordHover,
    onPauseOnHover
  })

  // Update callback references
  useEffect(() => {
    callbacksRef.current = {
      onWordHover,
      onPauseOnHover
    }
  }, [onWordHover, onPauseOnHover])

  // Get parent container dimensions - calculate only once
  const parentDimensions = useMemo(() => {
    const parent = containerRef.current?.parentElement
    const dimensions = {
      width: parent?.clientWidth || 0,
      height: parent?.clientHeight || 0
    }
    parentDimensionsRef.current = dimensions
    return dimensions
  }, [])

  // Get stable function for parent container bounds
  const getParentBounds = useCallback(() => {
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

  // Use styles hook
  const {
    dynamicTextStyle,
    dynamicEnglishTextStyle,
    dynamicChineseTextStyle,
    buttonSize,
    iconSize
  } = useSubtitleStyles(currentLayout)

  // Stable event handlers
  const stableHandlers = useMemo(
    () => ({
      // Handle word hover events
      handleWordHover: (isHovering: boolean): void => {
        callbacksRef.current.onWordHover(isHovering)
        if (isHovering) {
          console.log('Trigger video pause')
          callbacksRef.current.onPauseOnHover()
        }
      },

      // Handle word click events
      handleWordClick: (word: string, event: React.MouseEvent): void => {
        event.stopPropagation()
        event.preventDefault()

        const trimmedWord = word.trim()
        if (trimmedWord === '') {
          return
        }

        const wordElement = event.target as HTMLElement
        setSelectedWord({
          word: trimmedWord,
          element: wordElement
        })
      },

      // Check if element is a word element
      isWordElement: (element: HTMLElement): boolean => {
        if (
          element.classList.contains('subtitleWord') ||
          element.classList.contains('clickableWord')
        ) {
          return true
        }

        let parent = element.parentElement
        let depth = 0
        while (parent && depth < 3) {
          if (
            parent.classList.contains('subtitleWord') ||
            parent.classList.contains('clickableWord')
          ) {
            return true
          }
          parent = parent.parentElement
          depth++
        }
        return false
      },

      // Close word card
      handleCloseWordCard: (): void => {
        setSelectedWord(null)
      },

      // Update mask frame
      updateMaskFrame: (maskFrame: SubtitleMarginsState['maskFrame']): void => {
        updateSubtitleState({
          ...subtitleState,
          maskFrame
        })
      },

      // Reset subtitle state
      resetSubtitleState: (): void => {
        const cleanState = createDefaultSubtitleState()
        updateSubtitleState(cleanState)
        if (process.env.NODE_ENV === 'development') {
          console.log('🔄 Reset subtitle state to:', cleanState)
        }
      },

      // One-click expand horizontally
      expandHorizontally: (): void => {
        const parent = containerRef.current?.parentElement
        if (!parent) {
          console.warn('⚠️ Cannot get parent container, using default margins')
          updateSubtitleState({
            ...subtitleState,
            margins: {
              ...subtitleState.margins,
              left: 5,
              right: 5
            }
          })
          return
        }

        // Calculate actual display area of video in container
        const containerWidth = parent.clientWidth
        const containerHeight = parent.clientHeight
        const containerAspectRatio = containerWidth / containerHeight

        let videoDisplayWidth: number, videoLeft: number

        if (displayAspectRatio > containerAspectRatio) {
          // Video is wider than container, scale based on container width
          videoDisplayWidth = containerWidth
          videoLeft = 0
        } else {
          // Video is taller (or equal), scale based on container height
          videoDisplayWidth = containerHeight * displayAspectRatio
          videoLeft = (containerWidth - videoDisplayWidth) / 2
        }

        // Convert to percentages
        const videoLeftPercent = (videoLeft / containerWidth) * 100
        const videoRightPercent =
          ((containerWidth - (videoLeft + videoDisplayWidth)) / containerWidth) * 100

        // Set subtitle area margins to video display area boundaries, plus appropriate padding
        const horizontalPadding = 2 // 2% padding to ensure subtitles don't stick to video edges
        const leftMargin = Math.max(0, videoLeftPercent + horizontalPadding)
        const rightMargin = Math.max(0, videoRightPercent + horizontalPadding)

        updateSubtitleState({
          ...subtitleState,
          margins: {
            ...subtitleState.margins,
            left: leftMargin,
            right: rightMargin
          }
        })

        if (process.env.NODE_ENV === 'development') {
          console.log('↔ One-click expand horizontally - based on video display area:', {
            displayAspectRatio,
            containerAspectRatio,
            videoDisplayArea: {
              left: videoLeftPercent,
              width: (videoDisplayWidth / containerWidth) * 100
            },
            calculatedMargins: {
              left: leftMargin,
              right: rightMargin
            }
          })
        }
      },

      // Container mouse down event handler
      handleContainerMouseDown: (e: React.MouseEvent): void => {
        const target = e.target as HTMLElement
        if (stableHandlers.isWordElement(target)) {
          e.stopPropagation()
          return
        }
        dragAndResizeProps.handleMouseDown(e, containerRef)
      },

      // Hover control
      handleMouseEnter: (): void => {
        if (hideTimeoutRef.current) {
          clearTimeout(hideTimeoutRef.current)
          hideTimeoutRef.current = null
        }
        setIsHovering(true)
        // In mask mode, activate mask border when entering subtitle area
        if (subtitleState.isMaskMode) {
          setIsMaskFrameActive(true)
        }
      },

      handleMouseLeave: (): void => {
        hideTimeoutRef.current = setTimeout(() => {
          if (!isControlsHovering) {
            setIsHovering(false)
          }
          hideTimeoutRef.current = null
        }, 100)

        // Separate delayed check for mask border state
        if (maskFrameCheckTimeoutRef.current) {
          clearTimeout(maskFrameCheckTimeoutRef.current)
        }
        maskFrameCheckTimeoutRef.current = setTimeout(() => {
          // Use DOM query to get real-time hover state
          const subtitleHovering = containerRef.current?.matches(':hover') || false
          const controlsHovering =
            document.querySelector('.subtitle-controls-external:hover') !== null
          const maskFrameHovering = document.querySelector('.mask-frame:hover') !== null

          if (!subtitleHovering && !controlsHovering && !maskFrameHovering) {
            setIsMaskFrameActive(false)
          }
        }, 150)
      },

      // Control button hover
      handleControlsMouseEnter: (): void => {
        setIsControlsHovering(true)
        // In mask mode, activate mask border when entering control area
        if (subtitleState.isMaskMode) {
          setIsMaskFrameActive(true)
        }
      },

      handleControlsMouseLeave: (): void => {
        setIsControlsHovering(false)

        // Delayed check for mask border state
        if (maskFrameCheckTimeoutRef.current) {
          clearTimeout(maskFrameCheckTimeoutRef.current)
        }
        maskFrameCheckTimeoutRef.current = setTimeout(() => {
          const subtitleHovering = containerRef.current?.matches(':hover') || false
          const controlsHovering =
            document.querySelector('.subtitle-controls-external:hover') !== null
          const maskFrameHovering = document.querySelector('.mask-frame:hover') !== null

          if (!subtitleHovering && !controlsHovering && !maskFrameHovering) {
            setIsMaskFrameActive(false)
          }
        }, 150)
      },

      // Mask frame hover handling
      handleMaskFrameMouseEnter: (): void => {
        setIsMaskFrameActive(true)
      },

      handleMaskFrameMouseLeave: (): void => {
        // Delayed check for mask border state
        if (maskFrameCheckTimeoutRef.current) {
          clearTimeout(maskFrameCheckTimeoutRef.current)
        }
        maskFrameCheckTimeoutRef.current = setTimeout(() => {
          const subtitleHovering = containerRef.current?.matches(':hover') || false
          const controlsHovering =
            document.querySelector('.subtitle-controls-external:hover') !== null
          const maskFrameHovering = document.querySelector('.mask-frame:hover') !== null

          if (!subtitleHovering && !controlsHovering && !maskFrameHovering) {
            setIsMaskFrameActive(false)
          }
        }, 150)
      },

      // Resize handle
      handleResizeMouseDown: (e: React.MouseEvent): void => {
        dragAndResizeProps.handleResizeMouseDown(e, 'se')
      }
    }),
    [updateSubtitleState, subtitleState, displayAspectRatio, dragAndResizeProps, isControlsHovering]
  )

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

  // Clean up timers
  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current)
      }
      if (maskFrameCheckTimeoutRef.current) {
        clearTimeout(maskFrameCheckTimeoutRef.current)
      }
    }
  }, [])

  // Listen for mask mode changes, reset related state when exiting
  useEffect(() => {
    if (!subtitleState.isMaskMode) {
      setIsMaskFrameActive(false)
    }
  }, [subtitleState.isMaskMode])

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
    const hoverStyle = isHovering ? styles.subtitleContainerHover : {}
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
    isHovering,
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
            updateMaskFrame={stableHandlers.updateMaskFrame}
            containerRef={containerRef}
            isMaskFrameActive={isMaskFrameActive}
            onMaskFrameMouseEnter={stableHandlers.handleMaskFrameMouseEnter}
            onMaskFrameMouseLeave={stableHandlers.handleMaskFrameMouseLeave}
          />
        </>
      )}

      {/* Control buttons */}
      <SubtitleControlsWrapper
        visible={!dragAndResizeProps.isDragging && (isHovering || isControlsHovering)}
        currentLayout={currentLayout}
        subtitleState={subtitleState}
        buttonSize={buttonSize}
        iconSize={iconSize}
        onToggleMaskMode={toggleMaskMode}
        onToggleBackgroundType={toggleBackgroundType}
        onReset={stableHandlers.resetSubtitleState}
        onExpandHorizontally={stableHandlers.expandHorizontally}
        onMouseEnter={stableHandlers.handleControlsMouseEnter}
        onMouseLeave={stableHandlers.handleControlsMouseLeave}
      />

      {/* Subtitle container */}
      <div
        ref={containerRef}
        style={containerStyle}
        onMouseDown={stableHandlers.handleContainerMouseDown}
        onMouseEnter={stableHandlers.handleMouseEnter}
        onMouseLeave={stableHandlers.handleMouseLeave}
      >
        {/* Subtitle content area */}
        <div style={subtitleContentStyle}>
          <SubtitleContent
            dynamicTextStyle={dynamicTextStyle}
            dynamicEnglishTextStyle={dynamicEnglishTextStyle}
            dynamicChineseTextStyle={dynamicChineseTextStyle}
            onWordHover={stableHandlers.handleWordHover}
            onWordClick={stableHandlers.handleWordClick}
          />
        </div>

        {/* Resize handle */}
        <ResizeHandle
          visible={isHovering}
          buttonSize={buttonSize}
          onMouseDown={stableHandlers.handleResizeMouseDown}
        />
      </div>

      {/* Word card */}
      {selectedWord && (
        <WordCard
          word={selectedWord.word}
          targetElement={selectedWord.element}
          onClose={stableHandlers.handleCloseWordCard}
        />
      )}
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
