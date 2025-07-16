export interface Shortcut {
  key: string
  shortcut: string[]
  enabled: boolean
  editable: boolean
  system: boolean
  description?: string
}

export interface ShortcutMap {
  [key: string]: Shortcut
}

export interface ShortcutActions {
  updateShortcut: (id: string, value: string) => void
  resetShortcut: (id: string) => void
}
