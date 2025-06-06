import { useCallback } from 'react'
import { useUIStore } from '@renderer/stores'

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
