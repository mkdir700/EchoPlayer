import { useEffect } from 'react'
import { VOLUME_SETTINGS } from '@renderer/constants'
import { useShortcuts } from './useShortcuts'
import { matchesShortcut as matchesShortcutUtil } from '@renderer/utils/shortcutMatcher'
import { ReactCallback } from '@renderer/types/shared'

interface UseKeyboardShortcutsProps {
  onPlayPause: ReactCallback<() => void>
  onStepBackward: ReactCallback<() => void>
  onStepForward: ReactCallback<() => void>
  onToggleSubtitleMode?: ReactCallback<() => void>
  onVolumeChange: ReactCallback<(volume: number) => void>
  currentVolume: number
  onToggleSingleLoop?: ReactCallback<() => void>
  onToggleAutoPause?: ReactCallback<() => void>
  onGoToPreviousSubtitle?: ReactCallback<() => void>
  onGoToNextSubtitle?: ReactCallback<() => void>
}

export function useKeyboardShortcuts({
  onPlayPause,
  onStepBackward,
  onStepForward,
  onToggleSubtitleMode,
  onVolumeChange,
  currentVolume,
  onToggleSingleLoop,
  onToggleAutoPause,
  onGoToPreviousSubtitle,
  onGoToNextSubtitle
}: UseKeyboardShortcutsProps): void {
  const { shortcuts } = useShortcuts()

  useEffect(() => {
    // 创建快捷键匹配函数，直接使用当前的 shortcuts 状态
    const matchesShortcut = (event: KeyboardEvent, shortcutKey: string): boolean => {
      return matchesShortcutUtil(event, shortcutKey, shortcuts)
    }

    const handleKeyPress = (e: KeyboardEvent): void => {
      // 避免在文本输入框中触发快捷键
      if (e.target && (e.target as HTMLElement).tagName === 'TEXTAREA') return

      // 使用新的快捷键匹配系统
      if (matchesShortcut(e, 'playPause')) {
        e.preventDefault()
        onPlayPause()
      } else if (matchesShortcut(e, 'stepBackward')) {
        e.preventDefault()
        onStepBackward()
      } else if (matchesShortcut(e, 'stepForward')) {
        e.preventDefault()
        onStepForward()
      } else if (matchesShortcut(e, 'toggleSubtitleMode')) {
        e.preventDefault()
        onToggleSubtitleMode?.()
      } else if (matchesShortcut(e, 'volumeUp')) {
        e.preventDefault()
        onVolumeChange(Math.min(VOLUME_SETTINGS.MAX, currentVolume + VOLUME_SETTINGS.KEYBOARD_STEP))
      } else if (matchesShortcut(e, 'volumeDown')) {
        e.preventDefault()
        onVolumeChange(Math.max(VOLUME_SETTINGS.MIN, currentVolume - VOLUME_SETTINGS.KEYBOARD_STEP))
      } else if (matchesShortcut(e, 'singleLoop')) {
        e.preventDefault()
        onToggleSingleLoop?.()
      } else if (matchesShortcut(e, 'autoPause')) {
        e.preventDefault()
        onToggleAutoPause?.()
      } else if (matchesShortcut(e, 'previousSubtitle')) {
        e.preventDefault()
        onGoToPreviousSubtitle?.()
      } else if (matchesShortcut(e, 'nextSubtitle')) {
        e.preventDefault()
        onGoToNextSubtitle?.()
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return (): void => window.removeEventListener('keydown', handleKeyPress)
  }, [
    shortcuts, // 直接依赖 shortcuts 状态
    onPlayPause,
    onStepBackward,
    onStepForward,
    onToggleSubtitleMode,
    onVolumeChange,
    currentVolume,
    onToggleSingleLoop,
    onToggleAutoPause,
    onGoToPreviousSubtitle,
    onGoToNextSubtitle
  ])
}
