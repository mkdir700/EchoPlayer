import { useCallback, useRef } from 'react'
import { DisplayMode } from '@renderer/types'
import { ReactCallback } from '@renderer/types/shared'

interface UseSubtitleDisplayModeReturn {
  displayModeRef: React.RefObject<DisplayMode>
  setDisplayMode: ReactCallback<(mode: DisplayMode) => void>
  toggleDisplayMode: ReactCallback<() => void>
  restoreDisplayMode: ReactCallback<(mode: DisplayMode) => void>
}

export function useSubtitleDisplayMode(
  initialMode: DisplayMode = 'bilingual'
): UseSubtitleDisplayModeReturn {
  const displayModeRef = useRef<DisplayMode>(initialMode)

  const setDisplayMode = useCallback((mode: DisplayMode) => {
    displayModeRef.current = mode
  }, [])

  const toggleDisplayMode = useCallback(() => {
    const modes: DisplayMode[] = ['bilingual', 'english', 'chinese', 'none']
    const currentIndex = modes.indexOf(displayModeRef.current)
    const nextIndex = (currentIndex + 1) % modes.length
    displayModeRef.current = modes[nextIndex]
  }, [])

  const restoreDisplayMode = useCallback((mode: DisplayMode) => {
    displayModeRef.current = mode
    console.log('🔄 恢复字幕显示模式:', mode)
  }, [])

  return {
    displayModeRef,
    setDisplayMode,
    toggleDisplayMode,
    restoreDisplayMode
  }
}
