import React from 'react'
import type { SubtitleDisplaySettings } from '@types_/shared'
import type { LayoutInfo } from '../types'

/**
 * 计算字幕容器的定位样式 / Calculate subtitle container positioning styles
 * @param subtitleState - 字幕状态对象 / Subtitle state object
 * @param currentLayout - 当前布局信息 / Current layout information
 * @returns 包含位置和尺寸的样式对象 / Style object containing position and dimensions
 */
export function calculateContainerPositioning(
  subtitleState: SubtitleDisplaySettings,
  currentLayout: LayoutInfo
): {
  left: string
  top: string
  width: string
  height: string
} {
  const { isMaskMode, maskFrame } = subtitleState

  if (isMaskMode) {
    return {
      left: `${maskFrame.left + (currentLayout.left * maskFrame.width) / 100}%`,
      top: `${maskFrame.top + (currentLayout.top * maskFrame.height) / 100}%`,
      width: `${(currentLayout.width * maskFrame.width) / 100}%`,
      height: `${(currentLayout.height * maskFrame.height) / 100}%`
    }
  }

  return {
    left: `${currentLayout.left}%`,
    top: `${currentLayout.top}%`,
    width: `${currentLayout.width}%`,
    height: `${currentLayout.height}%`
  }
}

/**
 * 计算字幕容器的鼠标指针样式 / Calculate subtitle container cursor style
 * @param isSubtitleLayoutLocked - 是否锁定字幕布局 / Whether subtitle layout is locked
 * @param isDragging - 是否正在拖拽 / Whether currently dragging
 * @param isResizing - 是否正在调整大小 / Whether currently resizing
 * @returns CSS 鼠标指针样式 / CSS cursor style
 */
export function calculateCursorStyle(
  isSubtitleLayoutLocked: boolean,
  isDragging: boolean,
  isResizing: boolean
): React.CSSProperties['cursor'] {
  if (isSubtitleLayoutLocked) {
    return 'default'
  }

  if (isDragging) {
    return 'grabbing'
  }

  if (isResizing) {
    return 'se-resize'
  }

  return 'grab'
}

/**
 * 计算字幕容器的完整样式 / Calculate complete subtitle container style
 * @param params - 样式计算参数 / Style calculation parameters
 * @returns 完整的容器样式对象 / Complete container style object
 */
export function calculateContainerStyle(params: {
  subtitleState: SubtitleDisplaySettings
  currentLayout: LayoutInfo
  isDragging: boolean
  isResizing: boolean
  isHovering: boolean
  isSubtitleLayoutLocked: boolean
  styles: {
    subtitleContainer: React.CSSProperties
    subtitleContainerHover: React.CSSProperties
    subtitleContainerDragging: React.CSSProperties
  }
}): React.CSSProperties {
  const {
    subtitleState,
    currentLayout,
    isDragging,
    isResizing,
    isHovering,
    isSubtitleLayoutLocked,
    styles
  } = params

  const isDraggingOrResizing = isDragging || isResizing

  // 计算定位样式 / Calculate positioning styles
  const positioning = calculateContainerPositioning(subtitleState, currentLayout)

  // 计算鼠标指针样式 / Calculate cursor style
  const cursor = calculateCursorStyle(isSubtitleLayoutLocked, isDragging, isResizing)

  // 合并主题样式 / Merge theme styles
  const baseStyle = styles.subtitleContainer

  // 锁定模式下即使悬停也不显示悬停样式 / Don't show hover style in locked mode even if hovering
  const hoverStyle = isHovering && !isSubtitleLayoutLocked ? styles.subtitleContainerHover : {}

  const draggingStyle = isDraggingOrResizing ? styles.subtitleContainerDragging : {}

  return {
    ...baseStyle,
    ...hoverStyle,
    ...draggingStyle,
    ...positioning,
    cursor,
    zIndex: isDraggingOrResizing ? 100 : 10,
    userSelect: isDraggingOrResizing ? 'none' : 'auto'
  }
}

/**
 * 计算字幕内容区域的样式 / Calculate subtitle content area style
 * @param styles - 主题样式对象 / Theme styles object
 * @param backgroundType - 背景类型 / Background type
 * @returns 字幕内容样式对象 / Subtitle content style object
 */
export function calculateSubtitleContentStyle(
  styles: {
    subtitleContent: React.CSSProperties
    subtitleContentTransparent: React.CSSProperties
    subtitleContentBlur: React.CSSProperties
    subtitleContentSolidBlack: React.CSSProperties
    subtitleContentSolidGray: React.CSSProperties
  },
  backgroundType: string
): React.CSSProperties {
  const baseStyle = styles.subtitleContent

  let backgroundStyle: React.CSSProperties = {}

  switch (backgroundType) {
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
}

/**
 * 计算实际的背景类型（拖拽时强制透明）/ Calculate actual background type (force transparent when dragging)
 * @param isDragging - 是否正在拖拽 / Whether currently dragging
 * @param isResizing - 是否正在调整大小 / Whether currently resizing
 * @param backgroundType - 原始背景类型 / Original background type
 * @returns 实际应用的背景类型 / Actual background type to apply
 */
export function calculateActualBackgroundType(
  isDragging: boolean,
  isResizing: boolean,
  backgroundType: string
): string {
  const isDraggingOrResizing = isDragging || isResizing
  return isDraggingOrResizing ? 'transparent' : backgroundType
}
