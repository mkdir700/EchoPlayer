import { createContext } from 'react'

export interface ShortcutContextType {
  shortcuts: Record<string, string>
  getCurrentShortcut: (key: string) => string
  updateShortcut: (key: string, newKey: string) => void
  resetShortcuts: () => void
  matchesShortcut: (event: KeyboardEvent, shortcutKey: string) => boolean
}

export const ShortcutContext = createContext<ShortcutContextType | null>(null)
