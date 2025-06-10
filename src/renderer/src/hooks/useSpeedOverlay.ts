import { useState, useEffect, useCallback, useRef } from 'react'

interface UseSpeedOverlayReturn {
  isVisible: boolean // 是否显示覆盖层 / Whether the overlay is visible
  currentSpeed: number // 当前显示的速度 / Current displayed speed
  showSpeedOverlay: (speed: number) => void // 显示速度覆盖层 / Show speed overlay
  hideSpeedOverlay: () => void // 隐藏速度覆盖层 / Hide speed overlay
}

/**
 * Hook for managing speed overlay display logic
 * 管理速度覆盖层显示逻辑的Hook
 *
 * Features:
 * - Automatic hide after 2 seconds
 * - Debounced speed changes to prevent flickering
 * - Cleanup on unmount
 *
 * 特性：
 * - 2秒后自动隐藏
 * - 防抖速度变化以防止闪烁
 * - 组件卸载时清理
 */
export function useSpeedOverlay(): UseSpeedOverlayReturn {
  const [isVisible, setIsVisible] = useState(false)
  const [currentSpeed, setCurrentSpeed] = useState(1)
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // 清理定时器 / Clear timeout
  const clearHideTimeout = useCallback(() => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current)
      hideTimeoutRef.current = null
    }
  }, [])

  // 显示速度覆盖层 / Show speed overlay
  const showSpeedOverlay = useCallback(
    (speed: number) => {
      // 清除之前的定时器 / Clear previous timeout
      clearHideTimeout()

      // 更新速度和显示状态 / Update speed and visibility
      setCurrentSpeed(speed)
      setIsVisible(true)

      // 设置2秒后自动隐藏 / Set auto-hide after 2 seconds
      hideTimeoutRef.current = setTimeout(() => {
        setIsVisible(false)
        hideTimeoutRef.current = null
      }, 2000)
    },
    [clearHideTimeout]
  )

  // 手动隐藏速度覆盖层 / Manually hide speed overlay
  const hideSpeedOverlay = useCallback(() => {
    clearHideTimeout()
    setIsVisible(false)
  }, [clearHideTimeout])

  // 组件卸载时清理 / Cleanup on unmount
  useEffect(() => {
    return () => {
      clearHideTimeout()
    }
  }, [clearHideTimeout])

  return {
    isVisible,
    currentSpeed,
    showSpeedOverlay,
    hideSpeedOverlay
  }
}
