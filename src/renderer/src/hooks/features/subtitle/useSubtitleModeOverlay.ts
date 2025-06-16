import { useState, useEffect, useCallback, useRef } from 'react'
import type { DisplayMode } from '@renderer/types'

interface UseSubtitleModeOverlayReturn {
  isVisible: boolean // 是否显示覆盖层 / Whether the overlay is visible
  currentMode: DisplayMode // 当前显示的模式 / Current displayed mode
  showModeOverlay: (mode: DisplayMode) => void // 显示模式覆盖层 / Show mode overlay
  hideModeOverlay: () => void // 隐藏模式覆盖层 / Hide mode overlay
}

/**
 * Hook for managing subtitle mode overlay display logic
 * 管理字幕模式覆盖层显示逻辑的Hook
 *
 * Features:
 * - Automatic hide after 2 seconds
 * - Debounced mode changes to prevent flickering
 * - Cleanup on unmount
 *
 * 特性：
 * - 2秒后自动隐藏
 * - 防抖模式变化以防止闪烁
 * - 组件卸载时清理
 */
export function useSubtitleModeOverlay(): UseSubtitleModeOverlayReturn {
  const [isVisible, setIsVisible] = useState(false)
  const [currentMode, setCurrentMode] = useState<DisplayMode>('bilingual')
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 清理定时器 / Clear timeout
  const clearHideTimeout = useCallback(() => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current)
      hideTimeoutRef.current = null
    }
  }, [])

  // 显示模式覆盖层 / Show mode overlay
  const showModeOverlay = useCallback(
    (mode: DisplayMode) => {
      // 清除之前的定时器 / Clear previous timeout
      clearHideTimeout()

      // 更新模式和显示状态 / Update mode and visibility
      setCurrentMode(mode)
      setIsVisible(true)

      // 设置2秒后自动隐藏 / Set auto-hide after 2 seconds
      hideTimeoutRef.current = setTimeout(() => {
        setIsVisible(false)
        hideTimeoutRef.current = null
      }, 2000)
    },
    [clearHideTimeout]
  )

  // 手动隐藏模式覆盖层 / Manually hide mode overlay
  const hideModeOverlay = useCallback(() => {
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
    currentMode,
    showModeOverlay,
    hideModeOverlay
  }
}
