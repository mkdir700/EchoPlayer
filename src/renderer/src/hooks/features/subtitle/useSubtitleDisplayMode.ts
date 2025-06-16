import { useCallback } from 'react'
import { DisplayMode } from '@renderer/types'
import { useVideoConfig } from '@renderer/hooks/features/video/useVideoConfig'

// 需要控制字幕显示模式的组件使用这个
export const useSubtitleDisplayModeControls = (): {
  setDisplayMode: (mode: DisplayMode) => void
  toggleDisplayMode: () => void
  getCurrentDisplayMode: () => DisplayMode
  restoreDisplayMode: (mode: DisplayMode) => void
  displayMode: DisplayMode
} => {
  const { displayMode, setDisplayMode } = useVideoConfig()

  const toggleDisplayMode = useCallback((): void => {
    const modes: DisplayMode[] = ['bilingual', 'english', 'chinese', 'none']
    const currentIndex = modes.indexOf(displayMode)
    const nextIndex = (currentIndex + 1) % modes.length
    setDisplayMode(modes[nextIndex])
  }, [displayMode, setDisplayMode])

  const restoreDisplayMode = useCallback(
    (mode: DisplayMode): void => {
      console.log('🔄 恢复字幕显示模式:', mode)
      setDisplayMode(mode)
    },
    [setDisplayMode]
  )

  const getCurrentDisplayMode = useCallback((): DisplayMode => {
    return displayMode
  }, [displayMode])

  return {
    setDisplayMode,
    toggleDisplayMode,
    getCurrentDisplayMode,
    restoreDisplayMode,
    displayMode
  }
}
