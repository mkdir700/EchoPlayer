import { ShortcutContext, type ShortcutContextType } from '@renderer/contexts/shortcut-context'

export function useShortcuts(): ShortcutContextType {
  const context = use(ShortcutContext)
  if (!context) {
    throw new Error('useShortcuts 必须在 ShortcutProvider 内部使用')
  }
  return context
}
