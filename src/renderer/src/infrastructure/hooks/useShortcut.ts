import { Shortcut } from '@renderer/infrastructure'
import { isMac, isWin } from '@renderer/infrastructure/constants'
import { useShortcutsStore } from '@renderer/state'
import { orderBy } from 'lodash'
import { useCallback } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'

interface UseShortcutOptions {
  preventDefault?: boolean
  enableOnFormTags?: boolean
  enabled?: boolean
  description?: string
}

const defaultOptions: UseShortcutOptions = {
  preventDefault: true,
  enableOnFormTags: true,
  enabled: true
}

export const useShortcut = (
  shortcutKey: string,
  callback: (e: KeyboardEvent) => void,
  options: UseShortcutOptions = defaultOptions
) => {
  const formatShortcut = useCallback((shortcut: string[]) => {
    return shortcut
      .map((key) => {
        switch (key.toLowerCase()) {
          case 'command':
            return 'meta'
          case 'commandorcontrol':
            return isMac ? 'meta' : 'ctrl'
          default:
            return key.toLowerCase()
        }
      })
      .join('+')
  }, [])

  const shortcutConfig = useShortcutsStore((state) => state.getShortcut(shortcutKey))

  useHotkeys(
    shortcutConfig?.enabled ? formatShortcut(shortcutConfig.shortcut) : 'none',
    (e) => {
      if (options.preventDefault) {
        e.preventDefault()
      }
      if (options.enabled !== false) {
        callback(e)
      }
    },
    {
      enableOnFormTags: options.enableOnFormTags,
      description: options.description || shortcutConfig?.key,
      enabled: !!shortcutConfig?.enabled
    }
  )
}

export function useShortcuts(): { shortcuts: Shortcut[] } {
  const shortcuts = useShortcutsStore((state) => state.shortcuts)
  return { shortcuts: orderBy(shortcuts, 'system', 'desc') }
}

export function useShortcutDisplay(key: string): string {
  const formatShortcut = useCallback((shortcut: string[]) => {
    return shortcut
      .map((key) => {
        switch (key.toLowerCase()) {
          case 'control':
            return isMac ? '⌃' : 'Ctrl'
          case 'ctrl':
            return isMac ? '⌃' : 'Ctrl'
          case 'command':
            return isMac ? '⌘' : isWin ? 'Win' : 'Super'
          case 'alt':
            return isMac ? '⌥' : 'Alt'
          case 'shift':
            return isMac ? '⇧' : 'Shift'
          case 'commandorcontrol':
            return isMac ? '⌘' : 'Ctrl'
          default:
            return key.charAt(0).toUpperCase() + key.slice(1).toLowerCase()
        }
      })
      .join('+')
  }, [])
  const shortcutConfig = useShortcutsStore((state) => state.getShortcut(key))
  return shortcutConfig?.enabled ? formatShortcut(shortcutConfig.shortcut) : ''
}
