import React, { useCallback } from 'react'
import { useVideoConfig } from '@renderer/hooks/useVideoConfig'
import type { ResizeEventHandlers, UseResizeEventsProps } from '../types'

/**
 * Custom hook for handling resize events
 * 处理调整大小事件的自定义 hook
 */
export const useResizeEvents = ({
  dragAndResizeProps
}: UseResizeEventsProps): ResizeEventHandlers => {
  // Get subtitle layout lock state / 获取字幕布局锁定状态
  const { isSubtitleLayoutLocked } = useVideoConfig()

  /**
   * Handle resize mouse down event
   * 处理调整大小鼠标按下事件
   */
  const handleResizeMouseDown = useCallback(
    (e: React.MouseEvent): void => {
      // When subtitle layout is locked, don't allow resizing / 锁定布局时不允许调整大小
      if (isSubtitleLayoutLocked) {
        e.stopPropagation()
        return
      }

      dragAndResizeProps.handleResizeMouseDown(e, 'se')
    },
    [dragAndResizeProps, isSubtitleLayoutLocked]
  )

  return {
    handleResizeMouseDown
  }
}
