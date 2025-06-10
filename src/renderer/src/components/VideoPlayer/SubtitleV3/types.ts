// SubtitleV3 模块的类型定义 / Type definitions for SubtitleV3 module
import React from 'react'
import { SubtitleDisplaySettings } from '@types_/shared'

// ===== 主要组件接口 / Main Component Interfaces =====

export interface SubtitleV3Props {
  // 保留必要的外部回调 / Keep necessary external callbacks
  onWordHover?: (isHovering: boolean) => void // 用于控制栏显示 / For controls display
  // 新增划词选中相关属性 / New text selection related props
  enableTextSelection?: boolean
  onSelectionChange?: (selectedText: string) => void
}

// ===== 尺寸和布局接口 / Dimensions and Layout Interfaces =====

// 窗口尺寸接口 / Window dimensions interface
export interface WindowDimensions {
  width: number
  height: number
}

// 父容器尺寸接口 / Parent container dimensions interface
export interface ParentDimensions {
  width: number
  height: number
}

// 布局信息接口 / Layout information interface
export interface LayoutInfo {
  left: number
  top: number
  width: number
  height: number
}

// 扩展的布局信息（包含窗口尺寸） / Extended layout info with window dimensions
export interface LayoutInfoWithWindowDimensions extends LayoutInfo {
  _windowWidth: number
  _windowHeight: number
}

// ===== 组件属性接口 / Component Props Interfaces =====

// ResizeHandle 组件属性接口 / ResizeHandle component props interface
export interface ResizeHandleProps {
  visible: boolean
  buttonSize: number
  onMouseDown: (e: React.MouseEvent) => void
}

// ===== 事件处理器接口 / Event Handler Interfaces =====

// 单词交互状态接口 / Word interaction state interface
export interface WordInteractionState {
  selectedWord: { word: string; element: HTMLElement } | null
  isPausedByWordCard: boolean
}

// 单词交互事件处理器接口 / Word interaction event handlers interface
export interface WordInteractionHandlers {
  handleWordHover: (isHovering: boolean) => void
  handleWordClick: (word: string, event: React.MouseEvent) => void
  handleCloseWordCard: () => void
  isWordElement: (element: HTMLElement) => boolean
}

// 鼠标交互状态接口 / Mouse interaction state interface
export interface MouseInteractionState {
  isHovering: boolean
  isControlsHovering: boolean
  isMaskFrameActive: boolean
}

// 鼠标交互事件处理器接口 / Mouse interaction event handlers interface
export interface MouseInteractionHandlers {
  handleMouseEnter: () => void
  handleMouseLeave: () => void
  handleControlsMouseEnter: () => void
  handleControlsMouseLeave: () => void
  handleMaskFrameMouseEnter: () => void
  handleMaskFrameMouseLeave: () => void
}

// 右键菜单状态接口 / Context menu state interface
export interface ContextMenuState {
  contextMenuVisible: boolean
  contextMenuPosition: { x: number; y: number }
}

// 右键菜单事件处理器接口 / Context menu event handlers interface
export interface ContextMenuHandlers {
  handleContextMenu: (e: React.MouseEvent) => void
  handleMaskModeClick: () => void
  handleBackgroundTypeClick: () => void
  handleResetClick: () => void
  handleExpandClick: () => void
  handleContextMenuClose: () => void
}

// 拖拽事件处理器接口 / Drag events handlers interface
export interface DragEventHandlers {
  handleContainerMouseDown: (e: React.MouseEvent) => void
}

// 调整大小事件处理器接口 / Resize events handlers interface
export interface ResizeEventHandlers {
  handleResizeMouseDown: (e: React.MouseEvent) => void
}

// ===== Hook 属性接口 / Hook Props Interfaces =====

// 单词交互事件 hook 属性接口 / Props for the word interaction events hook
export interface UseWordInteractionEventsProps {
  onWordHover?: (isHovering: boolean) => void // External callback for controls display / 用于控制栏显示的外部回调
}

// 鼠标交互事件 hook 属性接口 / Props for the mouse interaction events hook
export interface UseMouseInteractionEventsProps {
  subtitleState: SubtitleDisplaySettings
  containerRef: React.RefObject<HTMLDivElement | null>
}

// 右键菜单事件 hook 属性接口 / Props for the context menu events hook
export interface UseContextMenuEventsProps {
  subtitleState: SubtitleDisplaySettings
  updateSubtitleState: (state: SubtitleDisplaySettings) => void
  toggleMaskMode: () => void
  toggleBackgroundType: () => void
  displayAspectRatio: number
  containerRef: React.RefObject<HTMLDivElement | null>
  isWordElement: (element: HTMLElement) => boolean
}

// 拖拽事件 hook 属性接口 / Props for the drag events hook
export interface UseDragEventsProps {
  isWordElement: (element: HTMLElement) => boolean
  dragAndResizeProps: {
    handleMouseDown: (
      e: React.MouseEvent,
      containerRef: React.RefObject<HTMLDivElement | null>
    ) => void
  }
  containerRef: React.RefObject<HTMLDivElement | null>
}

// 调整大小事件 hook 属性接口 / Props for the resize events hook
export interface UseResizeEventsProps {
  dragAndResizeProps: {
    handleResizeMouseDown: (e: React.MouseEvent, direction: 'se' | 'sw' | 'ne' | 'nw') => void
  }
}

// 全局事件监听器 hook 属性接口 / Props for the global event listeners hook
export interface UseGlobalEventListenersProps {
  // Drag and resize event management / 拖拽和调整大小事件管理
  isDragging: boolean
  isResizing: boolean
  dragAndResizeProps: {
    handleMouseMove: (e: MouseEvent, containerRef: React.RefObject<HTMLDivElement | null>) => void
    handleMouseUp: () => void
  }
  containerRef: React.RefObject<HTMLDivElement | null>

  // Context menu event management / 右键菜单事件管理
  contextMenuVisible: boolean
  handleContextMenuClose: () => void
}
