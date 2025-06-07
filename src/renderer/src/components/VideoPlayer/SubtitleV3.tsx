import React, { useState, useMemo, useRef, useEffect, memo } from 'react'
import { Dropdown, Button, Tooltip, Slider, Switch } from 'antd'
import { EyeInvisibleOutlined, EyeOutlined, CloseOutlined } from '@ant-design/icons'
import { WordCard } from '@renderer/components/WordCard/WordCard'
import { usePlayingVideoContext } from '@renderer/hooks/usePlayingVideoContext'
import {
  useSubtitleState,
  createDefaultSubtitleState,
  type SubtitleMarginsState,
  BACKGROUND_TYPES
} from '@renderer/hooks/useSubtitleState'
import { useSubtitleDragAndResize } from '@renderer/hooks/useSubtitleDragAndResize'
import { useSubtitleStyles } from '@renderer/hooks/useSubtitleStyles'
import { useTheme } from '@renderer/hooks/useTheme'
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

  // Local state
  const [selectedWord, setSelectedWord] = useState<{
    word: string
    element: HTMLElement
  } | null>(null)
  const [isHovering, setIsHovering] = useState(false)
  const [isControlsHovering, setIsControlsHovering] = useState(false)
  const [isMaskFrameActive, setIsMaskFrameActive] = useState(false)

  // Context menu state - 右键菜单状态
  const [contextMenuVisible, setContextMenuVisible] = useState(false)
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 })

  // Mock settings state for context menu - 右键菜单的模拟设置状态
  const [mockFontScale, setMockFontScale] = useState(1.0)
  const [mockAutoHide, setMockAutoHide] = useState(true)

  // Add window dimensions state to trigger re-renders when window size changes
  const [windowDimensions, setWindowDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  })

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
  }, []) // Add windowDimensions as dependency

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

  // Get current background config for context menu - 获取当前背景配置用于右键菜单
  const currentBackgroundConfig = useMemo(() => {
    return (
      BACKGROUND_TYPES.find((bg) => bg.type === subtitleState.backgroundType) || BACKGROUND_TYPES[0]
    )
  }, [subtitleState.backgroundType])

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
      },

      // Context menu handlers - 右键菜单处理函数
      handleContextMenu: (e: React.MouseEvent): void => {
        const target = e.target as HTMLElement
        // Only show context menu on non-word elements - 只在非单词元素上显示右键菜单
        if (stableHandlers.isWordElement(target)) {
          return
        }

        e.preventDefault()
        e.stopPropagation()

        setContextMenuPosition({ x: e.clientX, y: e.clientY })
        setContextMenuVisible(true)
      },

      // Context menu action handlers - 右键菜单动作处理函数
      handleMaskModeClick: (): void => {
        toggleMaskMode()
        setContextMenuVisible(false)
      },

      handleBackgroundTypeClick: (): void => {
        toggleBackgroundType()
        // Don't close menu to allow multiple background type switches - 不关闭菜单以允许多次切换背景类型
      },

      handleResetClick: (): void => {
        stableHandlers.resetSubtitleState()
        setContextMenuVisible(false)
      },

      handleExpandClick: (): void => {
        stableHandlers.expandHorizontally()
        setContextMenuVisible(false)
      },

      handleContextMenuClose: (): void => {
        setContextMenuVisible(false)
      }
    }),
    [
      updateSubtitleState,
      subtitleState,
      displayAspectRatio,
      dragAndResizeProps,
      isControlsHovering,
      toggleMaskMode,
      toggleBackgroundType
    ]
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

  // Handle clicks outside context menu to close it - 处理右键菜单外部点击关闭
  useEffect(() => {
    if (!contextMenuVisible) return

    const handleClickOutside = (): void => {
      setContextMenuVisible(false)
    }

    document.addEventListener('click', handleClickOutside)

    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [contextMenuVisible])

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

      {/* Subtitle container */}
      <div
        ref={containerRef}
        style={containerStyle}
        onMouseDown={stableHandlers.handleContainerMouseDown}
        onMouseEnter={stableHandlers.handleMouseEnter}
        onMouseLeave={stableHandlers.handleMouseLeave}
        onContextMenu={stableHandlers.handleContextMenu}
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

      {/* Context menu - 右键菜单 */}
      <Dropdown
        open={contextMenuVisible}
        onOpenChange={(open) => {
          if (!open) {
            stableHandlers.handleContextMenuClose()
          }
        }}
        dropdownRender={() => (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {/* Main menu container - 主菜单容器 */}
            <div
              style={{
                backgroundColor: 'rgba(20, 20, 20, 0.95)',
                borderRadius: '8px',
                padding: '12px',
                minWidth: '200px',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(8px)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Settings section - 设置区域 */}
              <div style={{ marginBottom: '12px' }}>
                <div
                  style={{
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontSize: '12px',
                    marginBottom: '8px',
                    fontWeight: 500
                  }}
                >
                  字幕设置
                </div>

                {/* Font scale slider - 字体大小滑块 */}
                <div style={{ marginBottom: '8px' }} onClick={(e) => e.stopPropagation()}>
                  <div
                    style={{
                      color: 'rgba(255, 255, 255, 0.9)',
                      fontSize: '12px',
                      marginBottom: '4px'
                    }}
                  >
                    字体大小: {Math.round(mockFontScale * 100)}%
                  </div>
                  <Slider
                    min={0.5}
                    max={2.0}
                    step={0.1}
                    value={mockFontScale}
                    onChange={setMockFontScale}
                    trackStyle={{ backgroundColor: '#1890ff' }}
                    handleStyle={{ borderColor: '#1890ff' }}
                    railStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
                  />
                </div>

                {/* Auto hide switch - 自动隐藏开关 */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '8px'
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <span
                    style={{
                      color: 'rgba(255, 255, 255, 0.9)',
                      fontSize: '12px'
                    }}
                  >
                    自动隐藏控件
                  </span>
                  <Switch size="small" checked={mockAutoHide} onChange={setMockAutoHide} />
                </div>
              </div>

              {/* Divider - 分隔线 */}
              <div
                style={{
                  height: '1px',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  margin: '8px 0'
                }}
              />

              {/* Action buttons - 操作按钮 */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '8px'
                }}
              >
                <Tooltip title={`遮罩模式: ${subtitleState.isMaskMode ? '开启' : '关闭'}`}>
                  <Button
                    type={subtitleState.isMaskMode ? 'primary' : 'text'}
                    size="small"
                    onClick={stableHandlers.handleMaskModeClick}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '32px',
                      color: subtitleState.isMaskMode ? undefined : 'rgba(255, 255, 255, 0.9)',
                      borderColor: subtitleState.isMaskMode ? undefined : 'rgba(255, 255, 255, 0.2)'
                    }}
                  >
                    {subtitleState.isMaskMode ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                  </Button>
                </Tooltip>

                <Tooltip title={`背景类型: ${currentBackgroundConfig.label}`}>
                  <Button
                    type="text"
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation()
                      stableHandlers.handleBackgroundTypeClick()
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '32px',
                      color: 'rgba(255, 255, 255, 0.9)',
                      borderColor: 'rgba(255, 255, 255, 0.2)'
                    }}
                  >
                    <span>{currentBackgroundConfig.icon}</span>
                  </Button>
                </Tooltip>

                <Tooltip title="重置位置和大小">
                  <Button
                    type="text"
                    size="small"
                    onClick={stableHandlers.handleResetClick}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '32px',
                      color: 'rgba(255, 255, 255, 0.9)',
                      borderColor: 'rgba(255, 255, 255, 0.2)'
                    }}
                  >
                    <span>↺</span>
                  </Button>
                </Tooltip>

                <Tooltip title="铺满左右区域">
                  <Button
                    type="text"
                    size="small"
                    onClick={stableHandlers.handleExpandClick}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '32px',
                      color: 'rgba(255, 255, 255, 0.9)',
                      borderColor: 'rgba(255, 255, 255, 0.2)'
                    }}
                  >
                    <span>↔</span>
                  </Button>
                </Tooltip>
              </div>
            </div>

            {/* Close button outside menu - 菜单外部的关闭按钮 */}
            <div style={{ marginTop: '8px' }}>
              <Tooltip>
                <Button
                  type="text"
                  size="small"
                  onClick={stableHandlers.handleContextMenuClose}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '28px',
                    height: '28px',
                    backgroundColor: 'rgba(20, 20, 20, 0.9)',
                    color: 'rgba(255, 255, 255, 0.8)',
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                    borderRadius: '50%',
                    fontSize: '12px',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
                  }}
                >
                  <CloseOutlined />
                </Button>
              </Tooltip>
            </div>
          </div>
        )}
        trigger={[]}
      >
        <div
          style={{
            position: 'fixed',
            // Center the close button at the cursor position - 让关闭按钮居中对齐到光标位置
            // Menu width is ~200px, close button is 28px, so offset by ~100px to center horizontally
            // Menu height is ~180px, close button is 28px and 8px margin, so offset by ~180px to center vertically
            left: contextMenuPosition.x - 100, // Offset to center horizontally - 水平居中偏移
            top: contextMenuPosition.y - 194, // Offset to position close button at cursor - 垂直偏移让关闭按钮对齐光标
            width: 1,
            height: 1,
            pointerEvents: 'none',
            zIndex: 9999
          }}
        />
      </Dropdown>
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
