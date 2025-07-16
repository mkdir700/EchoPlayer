/**
 * 快捷键管理 Store
 *
 * 管理快捷键的状态，包括快捷键列表、当前选中的快捷键、快捷键是否可用等
 * Manages the state of shortcuts, including the list of shortcuts, the currently selected shortcut, and whether the shortcut is available.
 */

import { loggerService } from '@logger'
import { DEFAULT_SHORTCUTS } from '@renderer/infrastructure/constants/shortcuts.const'
import { Shortcut } from '@types'
import type { Draft } from 'immer'
import type { StateCreator } from 'zustand'
import { create } from 'zustand'

import { MiddlewarePresets } from '../infrastructure'

const logger = loggerService.withContext('State-ShortcutsStore')

/**
 * 快捷键状态接口
 */
export interface ShortcutsState {
  // 快捷键列表
  shortcuts: Shortcut[]
  // 当前选中的快捷键
  currentShortcut: string | null
  // 快捷键是否可用
  isEnabled: boolean
}

/**
 * 快捷键操作接口
 */
export interface ShortcutsActions {
  // Actions
  setShortcuts: (shortcuts: Shortcut[]) => void
  updateShortcut: (updates: Partial<Shortcut>) => void
  resetShortcuts: () => void
  setCurrentShortcut: (key: string | null) => void
  setEnabled: (enabled: boolean) => void
  toggleShortcut: (key: string) => void

  // Selectors
  getShortcut: (key: string) => Shortcut | undefined
  getEnabledShortcuts: () => Shortcut[]
}

/**
 * 快捷键存储类型
 */
export type ShortcutsStore = ShortcutsState & ShortcutsActions

/**
 * 初始状态
 */
export const initialState: ShortcutsState = {
  shortcuts: DEFAULT_SHORTCUTS,
  currentShortcut: null,
  isEnabled: true
}

/**
 * Store creator implementation
 */
const createShortcutsStore: StateCreator<
  ShortcutsStore,
  [['zustand/immer', never]],
  [],
  ShortcutsStore
> = (set, get) => ({
  ...initialState,

  // Actions
  setShortcuts: (shortcuts) => {
    logger.info('Setting shortcuts', { shortcuts })
    set((state: Draft<ShortcutsStore>) => {
      state.shortcuts = shortcuts
    })
  },

  updateShortcut: (updates) => {
    const key = updates.key
    if (!key) {
      logger.warn('No key provided for shortcut update')
      return
    }
    logger.info('Updating shortcut', { key, updates })
    set((state: Draft<ShortcutsStore>) => {
      const shortcut = get().getShortcut(key)
      if (!shortcut) {
        logger.warn(`Shortcut with key "${key}" not found`)
        return
      }
      state.shortcuts = state.shortcuts.map((s) => (s.key === key ? { ...s, ...updates } : s))
    })
  },

  resetShortcuts: () => {
    logger.info('Resetting shortcuts to defaults')
    set((state: Draft<ShortcutsStore>) => {
      state.shortcuts = DEFAULT_SHORTCUTS
      state.currentShortcut = null // Reset current shortcut when resetting shortcuts
    })
  },

  setCurrentShortcut: (key) => {
    set((state: Draft<ShortcutsStore>) => {
      state.currentShortcut = key
    })
  },

  setEnabled: (enabled) => {
    set((state: Draft<ShortcutsStore>) => {
      state.isEnabled = enabled
    })
  },

  toggleShortcut: (key) => {
    logger.info('Toggling shortcut', { key })
    set((state: Draft<ShortcutsStore>) => {
      const shortcut = get().getShortcut(key)
      if (!shortcut) {
        logger.warn(`Shortcut with key "${key}" not found`)
        return
      }
      state.shortcuts = state.shortcuts.map((s) =>
        s.key === key ? { ...s, enabled: !s.enabled } : s
      )
    })
  },

  // Selectors
  getShortcut: (key): Shortcut | undefined => {
    return get().shortcuts.find((s) => s.key === key)
  },

  getEnabledShortcuts: () => Object.values(get().shortcuts).filter((s) => s.enabled)
})

export const useShortcutsStore = create<ShortcutsStore>()(
  MiddlewarePresets.persistent<ShortcutsStore>('shortcuts', {
    partialize: (state: ShortcutsStore) => ({
      shortcuts: state.shortcuts,
      isEnabled: state.isEnabled
    }),
    version: 1
  })(createShortcutsStore)
)

export default useShortcutsStore
