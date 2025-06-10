import React, { useMemo, useCallback } from 'react'
import { SubtitleDisplaySettings } from '@types_/shared'
import {
  useWordInteractionEvents,
  useMouseInteractionEvents,
  useContextMenuEvents,
  useDragEvents,
  useResizeEvents,
  useGlobalEventListeners
} from './index'

// Define local type instead of importing / 定义本地类型而不是导入
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
  // Keep external callback for controls display / 保留外部回调用于控制栏显示
  onWordHover?: (isHovering: boolean) => void
}

interface UseSubtitleEventHandlersReturn {
  // Word interaction handlers - 单词交互处理函数
  handleWordHover: (isHovering: boolean) => void
  handleWordClick: (word: string, event: React.MouseEvent) => void
  isWordElement: (element: HTMLElement) => boolean
  handleCloseWordCard: () => void

  // State update handlers - 状态更新处理函数
  updateMaskFrame: (maskFrame: SubtitleDisplaySettings['maskFrame']) => void

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
 * Refactored custom hook for handling subtitle event logic using specialized event hooks
 * 使用专门的事件 hooks 重构的处理字幕事件逻辑的自定义 hook
 */
export const useSubtitleEventHandlers = ({
  subtitleState,
  updateSubtitleState,
  toggleMaskMode,
  toggleBackgroundType,
  displayAspectRatio,
  containerRef,
  dragAndResizeProps,
  onWordHover
}: UseSubtitleEventHandlersProps): UseSubtitleEventHandlersReturn => {
  // Word interaction events / 单词交互事件
  const { selectedWord, handleWordHover, handleWordClick, handleCloseWordCard, isWordElement } =
    useWordInteractionEvents({
      onWordHover
    })

  // Mouse interaction events / 鼠标交互事件
  const {
    isHovering,
    isControlsHovering,
    isMaskFrameActive,
    handleMouseEnter,
    handleMouseLeave,
    handleControlsMouseEnter,
    handleControlsMouseLeave,
    handleMaskFrameMouseEnter,
    handleMaskFrameMouseLeave
  } = useMouseInteractionEvents({
    subtitleState,
    containerRef
  })

  // Context menu events / 右键菜单事件
  const {
    contextMenuVisible,
    contextMenuPosition,
    handleContextMenu,
    handleMaskModeClick,
    handleBackgroundTypeClick,
    handleResetClick,
    handleExpandClick,
    handleContextMenuClose
  } = useContextMenuEvents({
    subtitleState,
    updateSubtitleState,
    toggleMaskMode,
    toggleBackgroundType,
    displayAspectRatio,
    containerRef,
    isWordElement
  })

  // Drag events / 拖拽事件
  const { handleContainerMouseDown } = useDragEvents({
    isWordElement,
    dragAndResizeProps,
    containerRef
  })

  // Resize events / 调整大小事件
  const { handleResizeMouseDown } = useResizeEvents({
    dragAndResizeProps
  })

  // Global event listeners management / 全局事件监听器管理
  useGlobalEventListeners({
    isDragging: dragAndResizeProps.isDragging,
    isResizing: dragAndResizeProps.isResizing,
    dragAndResizeProps,
    containerRef,
    contextMenuVisible,
    handleContextMenuClose
  })

  // State update handlers / 状态更新处理函数
  const updateMaskFrame = useCallback(
    (maskFrame: SubtitleDisplaySettings['maskFrame']): void => {
      updateSubtitleState({
        ...subtitleState,
        maskFrame
      })
    },
    [subtitleState, updateSubtitleState]
  )

  return useMemo(
    () => ({
      // Word interaction handlers
      handleWordHover,
      handleWordClick,
      isWordElement,
      handleCloseWordCard,

      // State update handlers
      updateMaskFrame,

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
