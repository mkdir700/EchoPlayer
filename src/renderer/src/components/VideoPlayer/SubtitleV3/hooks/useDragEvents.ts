import React, { useCallback } from 'react'
import { useVideoConfig } from '@renderer/hooks/features/video/useVideoConfig'
import type { DragEventHandlers, UseDragEventsProps } from '../types'

/**
 * Custom hook for handling drag events
 * 处理拖拽事件的自定义 hook
 */
export const useDragEvents = ({
  isWordElement,
  dragAndResizeProps,
  containerRef
}: UseDragEventsProps): DragEventHandlers => {
  // Get subtitle layout lock state / 获取字幕布局锁定状态
  const { isSubtitleLayoutLocked } = useVideoConfig()

  /**
   * Handle container mouse down event for dragging
   * 处理容器鼠标按下事件用于拖拽
   */
  const handleContainerMouseDown = useCallback(
    (e: React.MouseEvent): void => {
      const target = e.target as HTMLElement
      if (isWordElement(target)) {
        e.stopPropagation()
        return
      }

      // When subtitle layout is locked, don't allow dragging / 锁定布局时不允许拖拽
      if (isSubtitleLayoutLocked) {
        e.stopPropagation()
        return
      }

      dragAndResizeProps.handleMouseDown(e, containerRef)
    },
    [isWordElement, dragAndResizeProps, containerRef, isSubtitleLayoutLocked]
  )

  return {
    handleContainerMouseDown
  }
}
