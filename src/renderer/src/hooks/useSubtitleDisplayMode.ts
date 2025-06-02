import { useCallback } from 'react'
import { DisplayMode } from '@renderer/types'
import { useVideoPlaybackSettingsContext } from './useVideoPlaybackSettingsContext'

// 需要控制字幕显示模式的组件使用这个
export const useSubtitleDisplayModeControls = (): {
  setDisplayMode: (mode: DisplayMode) => void
  toggleDisplayMode: () => void
  getCurrentDisplayMode: () => DisplayMode
  restoreDisplayMode: (mode: DisplayMode) => void
  displayMode: DisplayMode
} => {
  const { subtitleDisplayModeRef, updateSubtitleDisplayMode } = useVideoPlaybackSettingsContext()

  const toggleDisplayMode = useCallback((): void => {
    const modes: DisplayMode[] = ['bilingual', 'english', 'chinese', 'none']
    const currentIndex = modes.indexOf(subtitleDisplayModeRef.current)
    const nextIndex = (currentIndex + 1) % modes.length
    updateSubtitleDisplayMode(modes[nextIndex])
  }, [subtitleDisplayModeRef, updateSubtitleDisplayMode])

  const restoreDisplayMode = useCallback(
    (mode: DisplayMode): void => {
      console.log('🔄 恢复字幕显示模式:', mode)
      updateSubtitleDisplayMode(mode)
    },
    [updateSubtitleDisplayMode]
  )

  const getCurrentDisplayMode = useCallback((): DisplayMode => {
    return subtitleDisplayModeRef.current
  }, [subtitleDisplayModeRef])

  return {
    setDisplayMode: updateSubtitleDisplayMode,
    toggleDisplayMode,
    getCurrentDisplayMode,
    restoreDisplayMode,
    displayMode: subtitleDisplayModeRef.current
  }
}
