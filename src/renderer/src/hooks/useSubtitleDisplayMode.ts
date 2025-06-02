import { useCallback } from 'react'
import { DisplayMode } from '@renderer/types'
import { ReactCallback } from '@renderer/types/shared'
import { useVideoPlaybackSettingsContext } from './useVideoPlaybackSettingsContext'

interface UseSubtitleDisplayModeReturn {
  displayMode: DisplayMode
  getCurrentDisplayMode: () => DisplayMode
  setDisplayMode: ReactCallback<(mode: DisplayMode) => void>
  toggleDisplayMode: ReactCallback<() => void>
  restoreDisplayMode: ReactCallback<(mode: DisplayMode) => void>
}

// 需要响应字幕显示模式变化的组件使用这个 hook
export const useSubtitleDisplayMode = (): DisplayMode => {
  const { settings } = useVideoPlaybackSettingsContext()
  return settings.displayMode
}

// 只需要读取字幕显示模式但不需要响应变化的组件使用这个
export const useSubtitleDisplayModeRef = (): DisplayMode => {
  const { settings } = useVideoPlaybackSettingsContext()
  return settings.displayMode
}

// 需要控制字幕显示模式的组件使用这个
export const useSubtitleDisplayModeControls = (): {
  setDisplayMode: (mode: DisplayMode) => void
  toggleDisplayMode: () => void
  getCurrentDisplayMode: () => DisplayMode
  restoreDisplayMode: (mode: DisplayMode) => void
  displayMode: DisplayMode
} => {
  const { settings, setDisplayMode } = useVideoPlaybackSettingsContext()

  const toggleDisplayMode = useCallback((): void => {
    const modes: DisplayMode[] = ['bilingual', 'english', 'chinese', 'none']
    const currentIndex = modes.indexOf(settings.displayMode)
    const nextIndex = (currentIndex + 1) % modes.length
    setDisplayMode(modes[nextIndex])
  }, [settings.displayMode, setDisplayMode])

  const restoreDisplayMode = useCallback(
    (mode: DisplayMode): void => {
      console.log('🔄 恢复字幕显示模式:', mode)
      setDisplayMode(mode)
    },
    [setDisplayMode]
  )

  const getCurrentDisplayMode = useCallback((): DisplayMode => {
    return settings.displayMode
  }, [settings.displayMode])

  return {
    setDisplayMode,
    toggleDisplayMode,
    getCurrentDisplayMode,
    restoreDisplayMode,
    displayMode: settings.displayMode
  }
}

// 兼容旧版本的接口 - 逐步迁移用
export function useSubtitleDisplayModeOld(): UseSubtitleDisplayModeReturn {
  const { settings, setDisplayMode } = useVideoPlaybackSettingsContext()

  const toggleDisplayMode = useCallback(() => {
    const modes: DisplayMode[] = ['bilingual', 'english', 'chinese', 'none']
    const currentIndex = modes.indexOf(settings.displayMode)
    const nextIndex = (currentIndex + 1) % modes.length
    setDisplayMode(modes[nextIndex])
  }, [settings.displayMode, setDisplayMode])

  const restoreDisplayMode = useCallback(
    (mode: DisplayMode) => {
      setDisplayMode(mode)
      console.log('🔄 恢复字幕显示模式:', mode)
    },
    [setDisplayMode]
  )

  const getCurrentDisplayMode = useCallback((): DisplayMode => {
    return settings.displayMode
  }, [settings.displayMode])

  return {
    displayMode: settings.displayMode,
    setDisplayMode,
    toggleDisplayMode,
    restoreDisplayMode,
    getCurrentDisplayMode
  }
}
