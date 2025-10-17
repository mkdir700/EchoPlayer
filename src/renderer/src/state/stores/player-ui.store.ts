import { Draft } from 'immer'
import { create, StateCreator } from 'zustand'

import { MiddlewarePresets } from '../infrastructure'

export interface PlayerUIState {
  controlsVisible: boolean
  lastInteractionAt: number
  autoHideMs: number
  isLoading: boolean
  overlays: {
    settingsOpen: boolean
  }
  subtitleSearch: {
    isSearchVisible: boolean
  }
  videoAreaHovered: boolean
  lastVideoAreaInteraction: number
}

export interface PlayerUIActions {
  showControls: () => void
  hideControls: () => void
  pokeInteraction: () => void
  setAutoHideMs: (ms: number) => void
  setLoading: (loading: boolean) => void
  openSettings: () => void
  closeSettings: () => void
  toggleSubtitleSearch: () => void
  showSubtitleSearch: () => void
  hideSubtitleSearch: () => void
  setVideoAreaHovered: (hovered: boolean) => void
  pokeVideoAreaInteraction: () => void
}

export type PlayerUIStore = PlayerUIState & PlayerUIActions

const DEFAULT_AUTO_HIDE_MS = 2500

const initialState: PlayerUIState = {
  controlsVisible: true,
  lastInteractionAt: 0,
  autoHideMs: DEFAULT_AUTO_HIDE_MS,
  isLoading: false,
  overlays: {
    settingsOpen: false
  },
  subtitleSearch: {
    isSearchVisible: false
  },
  videoAreaHovered: false,
  lastVideoAreaInteraction: 0
}

const createPlayerUIStore: StateCreator<
  PlayerUIStore,
  [['zustand/immer', never]],
  [],
  PlayerUIStore
> = (set) => ({
  ...initialState,

  showControls: () => {
    set((s: Draft<PlayerUIStore>) => {
      s.controlsVisible = true
    })
  },

  hideControls: () => {
    set((s: Draft<PlayerUIStore>) => {
      s.controlsVisible = false
    })
  },

  pokeInteraction: () => {
    set((s: Draft<PlayerUIStore>) => {
      s.controlsVisible = true
      s.lastInteractionAt = Date.now()
    })
  },

  setAutoHideMs: (ms: number) => {
    set((s: Draft<PlayerUIStore>) => {
      s.autoHideMs = Math.max(0, ms)
    })
  },

  setLoading: (loading: boolean) => {
    set((s: Draft<PlayerUIStore>) => {
      s.isLoading = loading
    })
  },

  openSettings: () => {
    set((s: Draft<PlayerUIStore>) => {
      s.overlays.settingsOpen = true
    })
  },

  closeSettings: () => {
    set((s: Draft<PlayerUIStore>) => {
      s.overlays.settingsOpen = false
    })
  },

  toggleSubtitleSearch: () => {
    set((s: Draft<PlayerUIStore>) => {
      s.subtitleSearch.isSearchVisible = !s.subtitleSearch.isSearchVisible
    })
  },

  showSubtitleSearch: () => {
    set((s: Draft<PlayerUIStore>) => {
      s.subtitleSearch.isSearchVisible = true
    })
  },

  hideSubtitleSearch: () => {
    set((s: Draft<PlayerUIStore>) => {
      s.subtitleSearch.isSearchVisible = false
    })
  },

  setVideoAreaHovered: (hovered: boolean) => {
    set((s: Draft<PlayerUIStore>) => {
      s.videoAreaHovered = hovered
      if (hovered) {
        s.lastVideoAreaInteraction = Date.now()
      }
    })
  },

  pokeVideoAreaInteraction: () => {
    set((s: Draft<PlayerUIStore>) => {
      s.lastVideoAreaInteraction = Date.now()
    })
  }
})

export const usePlayerUIStore = create<PlayerUIStore>()(
  MiddlewarePresets.basic<PlayerUIStore>('player-ui')(createPlayerUIStore)
)

export default usePlayerUIStore
