import { useCallback, useRef, useState, useMemo } from 'react'
import { useUIStore } from '@renderer/stores/slices/uiStore'
import { useVideoConfig } from './useVideoConfig'
import { SubtitleDisplaySettings } from '@types_/shared'

interface DragAndResizeProps {
  isDragging: boolean
  isResizing: boolean
  dragOffset: { x: number; y: number }
  resizeStartState: {
    margins: SubtitleDisplaySettings['margins']
    mouseX: number
    mouseY: number
    resizeDirection: 'se' | 'sw' | 'ne' | 'nw'
  } | null
  handleMouseDown: (
    e: React.MouseEvent,
    containerRef: React.RefObject<HTMLDivElement | null>
  ) => void
  handleResizeMouseDown: (e: React.MouseEvent, direction: 'se' | 'sw' | 'ne' | 'nw') => void
  handleMouseMove: (e: MouseEvent, containerRef: React.RefObject<HTMLDivElement | null>) => void
  handleMouseUp: () => void
}

interface UseSubtitleEventHandlersProps {
  subtitleState: SubtitleDisplaySettings
  updateSubtitleState: (state: SubtitleDisplaySettings) => void
  toggleMaskMode: () => void
  toggleBackgroundType: () => void
  displayAspectRatio: number
  containerRef: React.RefObject<HTMLDivElement | null>
  dragAndResizeProps: DragAndResizeProps
  onWordHover: (isHovering: boolean) => void
  onPauseOnHover: () => void
  onResumeOnLeave: () => void
}

interface UseSubtitleEventHandlersReturn {
  // Word interaction handlers - 单词交互处理函数
  handleWordHover: (isHovering: boolean) => void
  handleWordClick: (word: string, event: React.MouseEvent) => void
  isWordElement: (element: HTMLElement) => boolean
  handleCloseWordCard: () => void

  // State update handlers - 状态更新处理函数
  updateMaskFrame: (maskFrame: SubtitleDisplaySettings['maskFrame']) => void
  resetSubtitleState: () => void
  expandHorizontally: () => void

  // Mouse interaction handlers - 鼠标交互处理函数
  handleContainerMouseDown: (e: React.MouseEvent) => void
  handleMouseEnter: () => void
  handleMouseLeave: () => void
  handleControlsMouseEnter: () => void
  handleControlsMouseLeave: () => void
  handleMaskFrameMouseEnter: () => void
  handleMaskFrameMouseLeave: () => void
  handleResizeMouseDown: (e: React.MouseEvent) => void

  // Context menu handlers - 右键菜单处理函数
  handleContextMenu: (e: React.MouseEvent) => void
  handleMaskModeClick: () => void
  handleBackgroundTypeClick: () => void
  handleResetClick: () => void
  handleExpandClick: () => void
  handleContextMenuClose: () => void

  // State
  selectedWord: { word: string; element: HTMLElement } | null
  isHovering: boolean
  isControlsHovering: boolean
  isMaskFrameActive: boolean
  contextMenuVisible: boolean
  contextMenuPosition: { x: number; y: number }
}

/**
 * Custom hook for handling subtitle event logic
 * 处理字幕事件逻辑的自定义 hook
 */
export const useSubtitleEventHandlers = ({
  subtitleState,
  updateSubtitleState,
  toggleMaskMode,
  toggleBackgroundType,
  displayAspectRatio,
  containerRef,
  dragAndResizeProps,
  onWordHover,
  onPauseOnHover,
  onResumeOnLeave
}: UseSubtitleEventHandlersProps): UseSubtitleEventHandlersReturn => {
  // Get subtitle layout lock state and auto resume setting - 获取字幕布局锁定状态和自动恢复设置
  const { autoResumeAfterWordCard } = useUIStore()
  const { isSubtitleLayoutLocked } = useVideoConfig()

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

  // References for timeouts
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const maskFrameCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Stable callback functions - store latest values using useRef to keep function reference stable
  const callbacksRef = useRef({
    onWordHover,
    onPauseOnHover,
    onResumeOnLeave
  })
  callbacksRef.current = { onWordHover, onPauseOnHover, onResumeOnLeave }

  // Word interaction handlers - 单词交互处理函数
  const handleWordHover = useCallback((isHovering: boolean): void => {
    callbacksRef.current.onWordHover(isHovering)

    // 悬停时不暂停，只更新悬停状态 / Don't pause on hover, only update hover state
    console.log(`Word hover: ${isHovering}`)
  }, [])

  const handleWordClick = useCallback((word: string, event: React.MouseEvent): void => {
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

    // 显示单词卡片时暂停视频 / Pause video when showing word card
    console.log('Trigger video pause - word card shown')
    callbacksRef.current.onPauseOnHover()
  }, [])

  const isWordElement = useCallback((element: HTMLElement): boolean => {
    if (element.classList.contains('subtitleWord') || element.classList.contains('clickableWord')) {
      return true
    }

    let parent = element.parentElement
    let depth = 0
    while (parent && depth < 3) {
      if (parent.classList.contains('subtitleWord') || parent.classList.contains('clickableWord')) {
        return true
      }
      parent = parent.parentElement
      depth++
    }
    return false
  }, [])

  const handleCloseWordCard = useCallback((): void => {
    setSelectedWord(null)

    // 根据设置决定是否在关闭单词卡片时恢复播放 / Resume playback based on setting when word card is closed
    if (autoResumeAfterWordCard) {
      console.log('Trigger video resume - word card closed (auto resume enabled)')
      callbacksRef.current.onResumeOnLeave()
    } else {
      console.log('Skip video resume - auto resume disabled')
    }
  }, [autoResumeAfterWordCard])

  // State update handlers - 状态更新处理函数
  const updateMaskFrame = useCallback(
    (maskFrame: SubtitleDisplaySettings['maskFrame']): void => {
      updateSubtitleState({
        ...subtitleState,
        maskFrame
      })
    },
    [subtitleState, updateSubtitleState]
  )

  const resetSubtitleState = useCallback((): void => {
    const cleanState: SubtitleDisplaySettings = {
      margins: {
        left: 20,
        top: 75,
        right: 20,
        bottom: 5
      },
      backgroundType: 'transparent',
      isMaskMode: false,
      maskFrame: {
        left: 0,
        top: 25,
        width: 100,
        height: 50
      }
    }
    updateSubtitleState(cleanState)
    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 Reset subtitle state to:', cleanState)
    }
  }, [updateSubtitleState])

  const expandHorizontally = useCallback((): void => {
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
  }, [subtitleState, updateSubtitleState, displayAspectRatio, containerRef])

  // Mouse interaction handlers - 鼠标交互处理函数
  const handleContainerMouseDown = useCallback(
    (e: React.MouseEvent): void => {
      const target = e.target as HTMLElement
      if (isWordElement(target)) {
        e.stopPropagation()
        return
      }

      // When subtitle layout is locked, don't allow dragging - 锁定布局时不允许拖拽
      if (isSubtitleLayoutLocked) {
        e.stopPropagation()
        return
      }

      dragAndResizeProps.handleMouseDown(e, containerRef)
    },
    [isWordElement, dragAndResizeProps, containerRef, isSubtitleLayoutLocked]
  )

  const handleMouseEnter = useCallback((): void => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current)
      hideTimeoutRef.current = null
    }

    // When subtitle layout is locked, don't show border - 锁定布局时不显示边框
    if (!isSubtitleLayoutLocked) {
      setIsHovering(true)
    }

    // In mask mode, activate mask border when entering subtitle area (only if not locked)
    // 在遮罩模式下，进入字幕区域时激活遮罩边框（仅在未锁定时）
    if (subtitleState.isMaskMode && !isSubtitleLayoutLocked) {
      setIsMaskFrameActive(true)
    }
  }, [subtitleState.isMaskMode, isSubtitleLayoutLocked])

  const handleMouseLeave = useCallback((): void => {
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
      const controlsHovering = document.querySelector('.subtitle-controls-external:hover') !== null
      const maskFrameHovering = document.querySelector('.mask-frame:hover') !== null

      if (!subtitleHovering && !controlsHovering && !maskFrameHovering) {
        setIsMaskFrameActive(false)
      }
    }, 150)
  }, [isControlsHovering, containerRef])

  const handleControlsMouseEnter = useCallback((): void => {
    setIsControlsHovering(true)
    // In mask mode, activate mask border when entering control area (only if not locked)
    // 在遮罩模式下，进入控制区域时激活遮罩边框（仅在未锁定时）
    if (subtitleState.isMaskMode && !isSubtitleLayoutLocked) {
      setIsMaskFrameActive(true)
    }
  }, [subtitleState.isMaskMode, isSubtitleLayoutLocked])

  const handleControlsMouseLeave = useCallback((): void => {
    setIsControlsHovering(false)

    // Delayed check for mask border state
    if (maskFrameCheckTimeoutRef.current) {
      clearTimeout(maskFrameCheckTimeoutRef.current)
    }
    maskFrameCheckTimeoutRef.current = setTimeout(() => {
      const subtitleHovering = containerRef.current?.matches(':hover') || false
      const controlsHovering = document.querySelector('.subtitle-controls-external:hover') !== null
      const maskFrameHovering = document.querySelector('.mask-frame:hover') !== null

      if (!subtitleHovering && !controlsHovering && !maskFrameHovering) {
        setIsMaskFrameActive(false)
      }
    }, 150)
  }, [containerRef])

  const handleMaskFrameMouseEnter = useCallback((): void => {
    setIsMaskFrameActive(true)
  }, [])

  const handleMaskFrameMouseLeave = useCallback((): void => {
    // Delayed check for mask border state
    if (maskFrameCheckTimeoutRef.current) {
      clearTimeout(maskFrameCheckTimeoutRef.current)
    }
    maskFrameCheckTimeoutRef.current = setTimeout(() => {
      const subtitleHovering = containerRef.current?.matches(':hover') || false
      const controlsHovering = document.querySelector('.subtitle-controls-external:hover') !== null
      const maskFrameHovering = document.querySelector('.mask-frame:hover') !== null

      if (!subtitleHovering && !controlsHovering && !maskFrameHovering) {
        setIsMaskFrameActive(false)
      }
    }, 150)
  }, [containerRef])

  const handleResizeMouseDown = useCallback(
    (e: React.MouseEvent): void => {
      // When subtitle layout is locked, don't allow resizing - 锁定布局时不允许调整大小
      if (isSubtitleLayoutLocked) {
        e.stopPropagation()
        return
      }

      dragAndResizeProps.handleResizeMouseDown(e, 'se')
    },
    [dragAndResizeProps, isSubtitleLayoutLocked]
  )

  // Context menu handlers - 右键菜单处理函数
  const handleContextMenu = useCallback(
    (e: React.MouseEvent): void => {
      const target = e.target as HTMLElement
      // Only show context menu on non-word elements - 只在非单词元素上显示右键菜单
      if (isWordElement(target)) {
        return
      }

      e.preventDefault()
      e.stopPropagation()

      setContextMenuPosition({ x: e.clientX, y: e.clientY })
      setContextMenuVisible(true)
    },
    [isWordElement]
  )

  const handleMaskModeClick = useCallback((): void => {
    toggleMaskMode()
    setContextMenuVisible(false)
  }, [toggleMaskMode])

  const handleBackgroundTypeClick = useCallback((): void => {
    toggleBackgroundType()
    // Don't close menu to allow multiple background type switches - 不关闭菜单以允许多次切换背景类型
  }, [toggleBackgroundType])

  const handleResetClick = useCallback((): void => {
    resetSubtitleState()
    setContextMenuVisible(false)
  }, [resetSubtitleState])

  const handleExpandClick = useCallback((): void => {
    expandHorizontally()
    setContextMenuVisible(false)
  }, [expandHorizontally])

  const handleContextMenuClose = useCallback((): void => {
    setContextMenuVisible(false)
  }, [])

  return useMemo(
    () => ({
      // Word interaction handlers
      handleWordHover,
      handleWordClick,
      isWordElement,
      handleCloseWordCard,

      // State update handlers
      updateMaskFrame,
      resetSubtitleState,
      expandHorizontally,

      // Mouse interaction handlers
      handleContainerMouseDown,
      handleMouseEnter,
      handleMouseLeave,
      handleControlsMouseEnter,
      handleControlsMouseLeave,
      handleMaskFrameMouseEnter,
      handleMaskFrameMouseLeave,
      handleResizeMouseDown,

      // Context menu handlers
      handleContextMenu,
      handleMaskModeClick,
      handleBackgroundTypeClick,
      handleResetClick,
      handleExpandClick,
      handleContextMenuClose,

      // State
      selectedWord,
      isHovering,
      isControlsHovering,
      isMaskFrameActive,
      contextMenuVisible,
      contextMenuPosition
    }),
    [
      handleWordHover,
      handleWordClick,
      isWordElement,
      handleCloseWordCard,
      updateMaskFrame,
      resetSubtitleState,
      expandHorizontally,
      handleContainerMouseDown,
      handleMouseEnter,
      handleMouseLeave,
      handleControlsMouseEnter,
      handleControlsMouseLeave,
      handleMaskFrameMouseEnter,
      handleMaskFrameMouseLeave,
      handleResizeMouseDown,
      handleContextMenu,
      handleMaskModeClick,
      handleBackgroundTypeClick,
      handleResetClick,
      handleExpandClick,
      handleContextMenuClose,
      selectedWord,
      isHovering,
      isControlsHovering,
      isMaskFrameActive,
      contextMenuVisible,
      contextMenuPosition
    ]
  )
}
