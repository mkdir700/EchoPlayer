import { loggerService } from '@logger'
import { Shortcut } from '@types'
import { BrowserWindow, globalShortcut } from 'electron'

import { configManager } from './ConfigManager'
import { windowService } from './WindowService'

const logger = loggerService.withContext('ShortcutService')

//indicate if the shortcuts are registered on app boot time
let isRegisterOnBoot = true

// store the focus and blur handlers for each window to unregister them later
const windowOnHandlers = new Map<
  BrowserWindow,
  { onFocusHandler: () => void; onBlurHandler: () => void }
>()

function getShortcutHandler(shortcut: Shortcut): ((window: BrowserWindow) => void) | null {
  switch (shortcut.key) {
    case 'show_app':
      return () => {
        windowService.toggleMainWindow()
      }
    case 'mini_window':
      return () => {
        windowService.toggleMiniWindow()
      }
    default:
      return null
  }
}

// convert the shortcut recorded by JS keyboard event key value to electron global shortcut format
// see: https://www.electronjs.org/zh/docs/latest/api/accelerator
const convertShortcutFormat = (shortcut: string | string[]): string => {
  const accelerator = (() => {
    if (Array.isArray(shortcut)) {
      return shortcut
    } else {
      return shortcut.split('+').map((key) => key.trim())
    }
  })()

  return accelerator
    .map((key) => {
      switch (key) {
        // you can see all the modifier keys in the same
        case 'CommandOrControl':
          return 'CommandOrControl'
        case 'Ctrl':
          return 'Ctrl'
        case 'Alt':
          return 'Alt' // Use `Alt` instead of `Option`. The `Option` key only exists on macOS, whereas the `Alt` key is available on all platforms.
        case 'Meta':
          return 'Meta' // `Meta` key is mapped to the Windows key on Windows and Linux, `Cmd` on macOS.
        case 'Shift':
          return 'Shift'

        // For backward compatibility with old data
        case 'Command':
        case 'Cmd':
          return 'CommandOrControl'
        case 'Control':
          return 'Ctrl'

        case 'ArrowUp':
          return 'Up'
        case 'ArrowDown':
          return 'Down'
        case 'ArrowLeft':
          return 'Left'
        case 'ArrowRight':
          return 'Right'
        case 'AltGraph':
          return 'AltGr'
        case 'Slash':
          return '/'
        case 'Semicolon':
          return ';'
        case 'BracketLeft':
          return '['
        case 'BracketRight':
          return ']'
        case 'Backslash':
          return '\\'
        case 'Quote':
          return "'"
        case 'Comma':
          return ','
        case 'Minus':
          return '-'
        case 'Equal':
          return '='
        default:
          return key
      }
    })
    .join('+')
}

export function registerShortcuts(window: BrowserWindow) {
  if (isRegisterOnBoot) {
    window.once('ready-to-show', () => {
      if (configManager.getLaunchToTray()) {
        register()
      }
    })
    isRegisterOnBoot = false
  }

  const register = () => {
    if (window.isDestroyed()) return

    const shortcuts = configManager.getShortcuts()
    if (!shortcuts) return

    shortcuts.forEach((shortcut) => {
      try {
        if (shortcut.shortcut.length === 0) {
          return
        }

        //if not enabled, exit early from the process.
        if (!shortcut.enabled) {
          return
        }

        const handler = getShortcutHandler(shortcut)
        if (!handler) {
          return
        }

        const accelerator = convertShortcutFormat(shortcut.shortcut)

        globalShortcut.register(accelerator, () => handler(window))
      } catch (error) {
        logger.warn(`Failed to register shortcut ${shortcut.key}`)
      }
    })
  }

  const unregister = () => {
    if (window.isDestroyed()) return

    try {
      globalShortcut.unregisterAll()
    } catch (error) {
      logger.warn('Failed to unregister shortcuts')
    }
  }

  // only register the event handlers once
  if (undefined === windowOnHandlers.get(window)) {
    // pass register() directly to listener, the func will receive Event as argument, it's not expected
    const registerHandler = () => {
      register()
    }
    window.on('focus', registerHandler)
    window.on('blur', unregister)
    windowOnHandlers.set(window, { onFocusHandler: registerHandler, onBlurHandler: unregister })
  }

  if (!window.isDestroyed() && window.isFocused()) {
    register()
  }
}

export function unregisterAllShortcuts() {
  try {
    windowOnHandlers.forEach((handlers, window) => {
      window.off('focus', handlers.onFocusHandler)
      window.off('blur', handlers.onBlurHandler)
    })
    windowOnHandlers.clear()
    globalShortcut.unregisterAll()
  } catch (error) {
    logger.warn('Failed to unregister all shortcuts')
  }
}
