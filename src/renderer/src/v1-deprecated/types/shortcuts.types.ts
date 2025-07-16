export interface Shortcut {
  id: string
  label: string
  value: string
  description?: string
}

export interface ShortcutMap {
  [key: string]: Shortcut
}

export interface ShortcutActions {
  updateShortcut: (id: string, value: string) => void
  resetShortcut: (id: string) => void
}

export interface UseShortcutsResult {
  shortcuts: ShortcutMap
  updateShortcut: (id: string, value: string) => void
  resetShortcut: (id: string) => void
}
