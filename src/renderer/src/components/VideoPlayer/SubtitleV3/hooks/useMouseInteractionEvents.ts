import { useState, useCallback, useRef } from 'react'
import { useVideoConfig } from '@renderer/hooks/features/video/useVideoConfig'
import type {
  MouseInteractionState,
  MouseInteractionHandlers,
  UseMouseInteractionEventsProps
} from '../types'

/**
 * Custom hook for handling mouse interaction events
 * 处理鼠标交互事件的自定义 hook
 */
export const useMouseInteractionEvents = ({
  subtitleState,
  containerRef
}: UseMouseInteractionEventsProps): MouseInteractionState & MouseInteractionHandlers => {
  // Get subtitle layout lock state / 获取字幕布局锁定状态
  const { isSubtitleLayoutLocked } = useVideoConfig()

  // Local state / 本地状态
  const [isHovering, setIsHovering] = useState(false)
  const [isControlsHovering, setIsControlsHovering] = useState(false)
  const [isMaskFrameActive, setIsMaskFrameActive] = useState(false)

  // References for timeouts / 超时引用
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const maskFrameCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  /**
   * Handle mouse enter on subtitle container
   * 处理字幕容器的鼠标进入事件
   */
  const handleMouseEnter = useCallback((): void => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current)
      hideTimeoutRef.current = null
    }

    // When subtitle layout is locked, don't show border / 锁定布局时不显示边框
    if (!isSubtitleLayoutLocked) {
      setIsHovering(true)
    }

    // In mask mode, activate mask border when entering subtitle area (only if not locked)
    // 在遮罩模式下，进入字幕区域时激活遮罩边框（仅在未锁定时）
    if (subtitleState.isMaskMode && !isSubtitleLayoutLocked) {
      setIsMaskFrameActive(true)
    }
  }, [subtitleState.isMaskMode, isSubtitleLayoutLocked])

  /**
   * Handle mouse leave on subtitle container
   * 处理字幕容器的鼠标离开事件
   */
  const handleMouseLeave = useCallback((): void => {
    hideTimeoutRef.current = setTimeout(() => {
      if (!isControlsHovering) {
        setIsHovering(false)
      }
      hideTimeoutRef.current = null
    }, 100)

    // Separate delayed check for mask border state / 单独的延迟检查遮罩边框状态
    if (maskFrameCheckTimeoutRef.current) {
      clearTimeout(maskFrameCheckTimeoutRef.current)
    }
    maskFrameCheckTimeoutRef.current = setTimeout(() => {
      // Use DOM query to get real-time hover state / 使用DOM查询获取实时悬停状态
      const subtitleHovering = containerRef.current?.matches(':hover') || false
      const controlsHovering = document.querySelector('.subtitle-controls-external:hover') !== null
      const maskFrameHovering = document.querySelector('.mask-frame:hover') !== null

      if (!subtitleHovering && !controlsHovering && !maskFrameHovering) {
        setIsMaskFrameActive(false)
      }
    }, 150)
  }, [isControlsHovering, containerRef])

  /**
   * Handle mouse enter on controls area
   * 处理控制区域的鼠标进入事件
   */
  const handleControlsMouseEnter = useCallback((): void => {
    setIsControlsHovering(true)
    // In mask mode, activate mask border when entering control area (only if not locked)
    // 在遮罩模式下，进入控制区域时激活遮罩边框（仅在未锁定时）
    if (subtitleState.isMaskMode && !isSubtitleLayoutLocked) {
      setIsMaskFrameActive(true)
    }
  }, [subtitleState.isMaskMode, isSubtitleLayoutLocked])

  /**
   * Handle mouse leave on controls area
   * 处理控制区域的鼠标离开事件
   */
  const handleControlsMouseLeave = useCallback((): void => {
    setIsControlsHovering(false)

    // Delayed check for mask border state / 延迟检查遮罩边框状态
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

  /**
   * Handle mouse enter on mask frame
   * 处理遮罩框的鼠标进入事件
   */
  const handleMaskFrameMouseEnter = useCallback((): void => {
    setIsMaskFrameActive(true)
  }, [])

  /**
   * Handle mouse leave on mask frame
   * 处理遮罩框的鼠标离开事件
   */
  const handleMaskFrameMouseLeave = useCallback((): void => {
    // Delayed check for mask border state / 延迟检查遮罩边框状态
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

  return {
    // State / 状态
    isHovering,
    isControlsHovering,
    isMaskFrameActive,

    // Handlers / 处理器
    handleMouseEnter,
    handleMouseLeave,
    handleControlsMouseEnter,
    handleControlsMouseLeave,
    handleMaskFrameMouseEnter,
    handleMaskFrameMouseLeave
  }
}
