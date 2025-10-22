import type { SubtitleItem } from '@types'
import { Draft } from 'immer'
import { create, StateCreator } from 'zustand'

import { MiddlewarePresets } from '../infrastructure'

export interface PlayerSubtitlesState {
  subtitles: SubtitleItem[]
  isLoading: boolean
  error?: string
  source?: {
    type: 'file' | 'embedded' | 'remote'
    language?: string
    name?: string
  }
  // 交互状态管理
  interactionState: {
    hoveredSubtitleId?: string
    editingSubtitleId?: string
  }
  // 右键菜单状态
  contextMenuState: {
    isOpen: boolean
    subtitleId?: string
    subtitleIndex?: number
    position?: { x: number; y: number }
  }
}

export interface PlayerSubtitlesActions {
  setSubtitles: (list: SubtitleItem[]) => void
  clearSubtitles: () => void
  addSubtitle: (item: SubtitleItem) => void
  removeSubtitle: (index: number) => void
  updateSubtitle: (index: number, patch: Partial<SubtitleItem>) => void
  setLoading: (loading: boolean) => void
  setError: (message?: string) => void
  setSource: (info?: PlayerSubtitlesState['source']) => void
  // 交互状态 actions
  setHoveredSubtitleId: (subtitleId?: string) => void
  setEditingSubtitleId: (subtitleId?: string) => void
  // 右键菜单 actions
  openContextMenu: (
    subtitleId: string,
    subtitleIndex: number,
    position: { x: number; y: number }
  ) => void
  closeContextMenu: () => void
}

export type PlayerSubtitlesStore = PlayerSubtitlesState & PlayerSubtitlesActions

const initialState: PlayerSubtitlesState = {
  subtitles: [],
  isLoading: false,
  error: undefined,
  source: undefined,
  interactionState: {
    hoveredSubtitleId: undefined,
    editingSubtitleId: undefined
  },
  contextMenuState: {
    isOpen: false,
    subtitleId: undefined,
    subtitleIndex: undefined,
    position: undefined
  }
}

const createPlayerSubtitlesStore: StateCreator<
  PlayerSubtitlesStore,
  [['zustand/immer', never]],
  [],
  PlayerSubtitlesStore
> = (set) => ({
  ...initialState,

  setSubtitles: (list: SubtitleItem[]) => {
    set((state: Draft<PlayerSubtitlesStore>) => {
      state.subtitles = Array.isArray(list) ? list : []
      state.isLoading = false
      state.error = undefined
    })
  },

  clearSubtitles: () => {
    set((state: Draft<PlayerSubtitlesStore>) => {
      state.subtitles = []
      state.error = undefined
    })
  },

  addSubtitle: (item: SubtitleItem) => {
    set((state: Draft<PlayerSubtitlesStore>) => {
      state.subtitles.push(item)
    })
  },

  removeSubtitle: (index: number) => {
    set((state: Draft<PlayerSubtitlesStore>) => {
      if (index >= 0 && index < state.subtitles.length) {
        state.subtitles.splice(index, 1)
      }
    })
  },

  updateSubtitle: (index: number, patch: Partial<SubtitleItem>) => {
    set((state: Draft<PlayerSubtitlesStore>) => {
      const existing = state.subtitles[index]
      if (existing) {
        state.subtitles[index] = { ...existing, ...patch }
      }
    })
  },

  setLoading: (loading: boolean) => {
    set((state: Draft<PlayerSubtitlesStore>) => {
      state.isLoading = loading
    })
  },

  setError: (message?: string) => {
    set((state: Draft<PlayerSubtitlesStore>) => {
      state.error = message
    })
  },

  setSource: (info?: PlayerSubtitlesState['source']) => {
    set((state: Draft<PlayerSubtitlesStore>) => {
      state.source = info
    })
  },

  // 交互状态 actions
  setHoveredSubtitleId: (subtitleId?: string) => {
    set((state: Draft<PlayerSubtitlesStore>) => {
      state.interactionState.hoveredSubtitleId = subtitleId
    })
  },

  setEditingSubtitleId: (subtitleId?: string) => {
    set((state: Draft<PlayerSubtitlesStore>) => {
      state.interactionState.editingSubtitleId = subtitleId
    })
  },

  // 右键菜单 actions
  openContextMenu: (
    subtitleId: string,
    subtitleIndex: number,
    position: { x: number; y: number }
  ) => {
    set((state: Draft<PlayerSubtitlesStore>) => {
      state.contextMenuState = {
        isOpen: true,
        subtitleId,
        subtitleIndex,
        position
      }
    })
  },

  closeContextMenu: () => {
    set((state: Draft<PlayerSubtitlesStore>) => {
      state.contextMenuState.isOpen = false
      state.contextMenuState.subtitleId = undefined
      state.contextMenuState.subtitleIndex = undefined
      state.contextMenuState.position = undefined
    })
  }
})

export const usePlayerSubtitlesStore = create<PlayerSubtitlesStore>()(
  MiddlewarePresets.basic<PlayerSubtitlesStore>('player-subtitles')(createPlayerSubtitlesStore)
)

export default usePlayerSubtitlesStore
