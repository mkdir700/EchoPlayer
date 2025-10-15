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
  allowWhenTyping?: boolean
}

const defaultOptions: UseShortcutOptions = {
  preventDefault: true,
  enableOnFormTags: true,
  enabled: true,
  allowWhenTyping: false
}

const NON_TYPABLE_INPUT_TYPES = new Set([
  'button',
  'checkbox',
  'color',
  'date',
  'datetime-local',
  'file',
  'hidden',
  'image',
  'month',
  'radio',
  'range',
  'reset',
  'submit',
  'time',
  'week'
])

function isTypingInput(element: Element | null): boolean {
  if (!element || !(element instanceof HTMLElement)) {
    return false
  }

  if (element.isContentEditable) {
    return true
  }

  const tagName = element.tagName.toLowerCase()

  if (tagName === 'textarea') {
    return true
  }

  if (tagName === 'input') {
    const el = element as HTMLInputElement
    return !NON_TYPABLE_INPUT_TYPES.has((el.type || '').toLowerCase())
  }

  if (tagName === 'select') {
    return true
  }

  return false
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
      const activeElement = document.activeElement
      const typingActive =
        !options.allowWhenTyping && isTypingInput(activeElement) && e.key !== 'Escape'

      if (options.enabled === false || typingActive) {
        return
      }

      if (options.preventDefault) {
        e.preventDefault()
      }

      callback(e)
    },
    {
      enableOnFormTags: options.enableOnFormTags,
      description: options.description || shortcutConfig?.key,
      enabled: options.enabled !== false && !!shortcutConfig?.enabled
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
