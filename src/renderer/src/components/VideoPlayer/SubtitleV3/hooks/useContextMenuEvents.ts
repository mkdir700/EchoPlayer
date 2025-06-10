import React, { useState, useCallback } from 'react'
import type { ContextMenuState, ContextMenuHandlers, UseContextMenuEventsProps } from '../types'

/**
 * Custom hook for handling context menu events
 * 处理右键菜单事件的自定义 hook
 */
export const useContextMenuEvents = ({
  subtitleState,
  updateSubtitleState,
  toggleMaskMode,
  toggleBackgroundType,
  displayAspectRatio,
  containerRef,
  isWordElement
}: UseContextMenuEventsProps): ContextMenuState & ContextMenuHandlers => {
  // Local state / 本地状态
  const [contextMenuVisible, setContextMenuVisible] = useState(false)
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 })

  /**
   * Handle context menu (right-click) event
   * 处理右键菜单事件
   */
  const handleContextMenu = useCallback(
    (e: React.MouseEvent): void => {
      const target = e.target as HTMLElement
      // Only show context menu on non-word elements / 只在非单词元素上显示右键菜单
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

  /**
   * Handle mask mode toggle from context menu
   * 处理从右键菜单切换遮罩模式
   */
  const handleMaskModeClick = useCallback((): void => {
    toggleMaskMode()
    setContextMenuVisible(false)
  }, [toggleMaskMode])

  /**
   * Handle background type toggle from context menu
   * 处理从右键菜单切换背景类型
   */
  const handleBackgroundTypeClick = useCallback((): void => {
    toggleBackgroundType()
    // Don't close menu to allow multiple background type switches / 不关闭菜单以允许多次切换背景类型
  }, [toggleBackgroundType])

  /**
   * Reset subtitle state to default from context menu
   * 从右键菜单重置字幕状态到默认值
   */
  const resetSubtitleState = useCallback((): void => {
    updateSubtitleState({
      ...subtitleState,
      margins: {
        left: 10,
        top: 10,
        right: 10,
        bottom: 10
      },
      backgroundType: 'blur',
      isMaskMode: false,
      maskFrame: {
        left: 20,
        top: 20,
        width: 60,
        height: 60
      }
    })

    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 Reset subtitle state to default')
    }
  }, [subtitleState, updateSubtitleState])

  /**
   * Expand subtitle area horizontally based on video display area
   * 根据视频显示区域水平展开字幕区域
   */
  const expandHorizontally = useCallback((): void => {
    const containerElement = containerRef.current?.parentElement
    if (!containerElement) return

    const containerWidth = containerElement.clientWidth
    const containerHeight = containerElement.clientHeight
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

  /**
   * Handle reset click from context menu
   * 处理从右键菜单点击重置
   */
  const handleResetClick = useCallback((): void => {
    resetSubtitleState()
    setContextMenuVisible(false)
  }, [resetSubtitleState])

  /**
   * Handle expand click from context menu
   * 处理从右键菜单点击展开
   */
  const handleExpandClick = useCallback((): void => {
    expandHorizontally()
    setContextMenuVisible(false)
  }, [expandHorizontally])

  /**
   * Close context menu
   * 关闭右键菜单
   */
  const handleContextMenuClose = useCallback((): void => {
    setContextMenuVisible(false)
  }, [])

  return {
    // State / 状态
    contextMenuVisible,
    contextMenuPosition,

    // Handlers / 处理器
    handleContextMenu,
    handleMaskModeClick,
    handleBackgroundTypeClick,
    handleResetClick,
    handleExpandClick,
    handleContextMenuClose
  }
}
