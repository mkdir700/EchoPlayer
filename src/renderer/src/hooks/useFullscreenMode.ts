import { useCallback, useEffect } from 'react'
import { useUIStore } from '@renderer/stores'
import { useShortcutCommand } from './useCommandShortcuts'

interface UseFullscreenModeReturn {
  // State
  isFullscreen: boolean
  isInFullscreenMode: boolean

  // Actions
  toggleFullscreen: () => void
  enterFullscreen: () => void
  exitFullscreen: () => void

  // Direct UI actions (for advanced use cases)
  enterFullscreenMode: () => void
  exitFullscreenMode: () => void
}

/**
 * Custom hook for managing in-app fullscreen mode.
 *
 * Manages UI state to hide/show interface elements for a fullscreen-like experience
 * within the current window. Does not control browser/OS level fullscreen.
 *
 * 自动管理全屏模式下的快捷键：
 * - 进入全屏时：注册 ESC 键退出全屏
 * - 退出全屏时：注销 ESC 键快捷键
 *
 * @returns Fullscreen state and control functions
 */
export function useFullscreenMode(): UseFullscreenModeReturn {
  // Get fullscreen state and actions from UI store
  const fullscreen = useUIStore((state) => state.fullscreen)
  const toggleFullscreenState = useUIStore((state) => state.toggleFullscreen)
  const enterFullscreenMode = useUIStore((state) => state.enterFullscreenMode)
  const exitFullscreenMode = useUIStore((state) => state.exitFullscreenMode)

  // Simple toggle fullscreen UI state
  const handleToggleFullscreen = useCallback(() => {
    toggleFullscreenState()
  }, [toggleFullscreenState])

  // Enter fullscreen mode (UI only)
  const handleEnterFullscreen = useCallback(() => {
    enterFullscreenMode()
  }, [enterFullscreenMode])

  // Exit fullscreen mode (UI only)
  const handleExitFullscreen = useCallback(() => {
    exitFullscreenMode()
  }, [exitFullscreenMode])

  // 🎯 动态注册 ESC 键快捷键 - 仅在全屏模式下有效
  // Dynamic ESC key registration - only active in fullscreen mode
  useShortcutCommand(
    'escapeFullscreen', // 快捷键标识符 / Shortcut identifier
    toggleFullscreenState, // 退出全屏函数 / Exit fullscreen function
    {
      enabled: fullscreen.isInFullscreenMode, // 仅在全屏模式下启用 / Only enabled in fullscreen mode
      description: '退出全屏模式 (ESC)', // 描述 / Description
      canExecute: () => fullscreen.isInFullscreenMode // 额外检查：确保在全屏模式下 / Additional check: ensure in fullscreen mode
    }
  )

  // 🚀 调试信息：显示当前全屏状态和 ESC 快捷键状态
  // Debug info: show current fullscreen state and ESC shortcut status
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`🖥️ 全屏状态变化:`, {
        isFullscreen: fullscreen.isFullscreen,
        isInFullscreenMode: fullscreen.isInFullscreenMode,
        escShortcutEnabled: fullscreen.isInFullscreenMode
      })
    }
  }, [fullscreen.isFullscreen, fullscreen.isInFullscreenMode])

  return {
    // State
    isFullscreen: fullscreen.isFullscreen,
    isInFullscreenMode: fullscreen.isInFullscreenMode,

    // Actions
    toggleFullscreen: handleToggleFullscreen,
    enterFullscreen: handleEnterFullscreen,
    exitFullscreen: handleExitFullscreen,

    // Direct UI actions (for advanced use cases)
    enterFullscreenMode,
    exitFullscreenMode
  }
}
