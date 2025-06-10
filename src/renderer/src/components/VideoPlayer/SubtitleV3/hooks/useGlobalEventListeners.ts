import { useEffect } from 'react'
import type { UseGlobalEventListenersProps } from '../types'

/**
 * Custom hook for managing global event listeners
 * 管理全局事件监听器的自定义 hook
 */
export const useGlobalEventListeners = ({
  isDragging,
  isResizing,
  dragAndResizeProps,
  containerRef,
  contextMenuVisible,
  handleContextMenuClose
}: UseGlobalEventListenersProps): void => {
  /**
   * Global mouse event management for drag and resize operations
   * 用于拖拽和调整大小操作的全局鼠标事件管理
   */
  useEffect(() => {
    const isDraggingOrResizing = isDragging || isResizing

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
    isDragging,
    isResizing,
    dragAndResizeProps.handleMouseMove,
    dragAndResizeProps.handleMouseUp,
    dragAndResizeProps,
    containerRef
  ])

  /**
   * Global click event management for context menu outside click handling
   * 用于右键菜单外部点击处理的全局点击事件管理
   */
  useEffect(() => {
    if (!contextMenuVisible) return

    const handleClickOutside = (): void => {
      handleContextMenuClose()
    }

    document.addEventListener('click', handleClickOutside)

    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [contextMenuVisible, handleContextMenuClose])
}
