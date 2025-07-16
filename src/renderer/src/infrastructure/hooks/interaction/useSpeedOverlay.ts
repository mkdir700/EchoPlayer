import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * V2 架构速度覆盖层Hook返回类型
 * V2 Architecture Speed Overlay Hook Return Type
 */
interface UseSpeedOverlayReturn {
  isVisible: boolean // 是否显示覆盖层 / Whether the overlay is visible
  currentSpeed: number // 当前显示的速度 / Current displayed speed
  showSpeedOverlay: (speed: number) => void // 显示速度覆盖层 / Show speed overlay
  hideSpeedOverlay: () => void // 隐藏速度覆盖层 / Hide speed overlay
}

/**
 * V2 架构速度覆盖层管理Hook
 * V2 Architecture Speed Overlay Management Hook
 *
 * 管理速度覆盖层显示逻辑的Hook。
 * Hook for managing speed overlay display logic.
 *
 * 特性：/ Features:
 * - 2秒后自动隐藏 / Automatic hide after 2 seconds
 * - 防抖速度变化以防止闪烁 / Debounced speed changes to prevent flickering
 * - 组件卸载时清理 / Cleanup on unmount
 * - 定时器管理和清理 / Timer management and cleanup
 * - 手动隐藏支持 / Manual hide support
 *
 * @returns 速度覆盖层状态和控制方法 / Speed overlay state and control methods
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
