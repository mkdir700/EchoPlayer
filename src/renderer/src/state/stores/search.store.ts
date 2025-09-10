import { HomePageVideoItem } from '@renderer/services/HomePageVideos'
import { Draft } from 'immer'
import { create, StateCreator } from 'zustand'

import { MiddlewarePresets } from '../infrastructure'

export interface SearchState {
  isSearchVisible: boolean
  searchQuery: string
  searchResults: HomePageVideoItem[]
  isSearching: boolean
}

export interface SearchActions {
  showSearch: () => void
  hideSearch: () => void
  toggleSearch: () => void
  setSearchQuery: (query: string) => void
  clearSearch: () => void
  setSearchResults: (results: HomePageVideoItem[]) => void
  setSearching: (isSearching: boolean) => void
}

export type SearchStore = SearchState & SearchActions

const initialState: SearchState = {
  isSearchVisible: false,
  searchQuery: '',
  searchResults: [],
  isSearching: false
}

const createSearchStore: StateCreator<
  SearchStore,
  [['zustand/immer', never]],
  [],
  SearchStore
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
> = (set, _get) => ({
  ...initialState,

  showSearch: () => {
    set((state: Draft<SearchStore>) => {
      state.isSearchVisible = true
    })
  },

  hideSearch: () => {
    set((state: Draft<SearchStore>) => {
      state.isSearchVisible = false
    })
  },

  toggleSearch: () => {
    set((state: Draft<SearchStore>) => {
      state.isSearchVisible = !state.isSearchVisible
    })
  },

  setSearchQuery: (query: string) => {
    set((state: Draft<SearchStore>) => {
      state.searchQuery = query
    })
  },

  clearSearch: () => {
    set((state: Draft<SearchStore>) => {
      state.searchQuery = ''
      state.searchResults = []
      state.isSearching = false
    })
  },

  setSearchResults: (results: HomePageVideoItem[]) => {
    set((state: Draft<SearchStore>) => {
      state.searchResults = results
    })
  },

  setSearching: (isSearching: boolean) => {
    set((state: Draft<SearchStore>) => {
      state.isSearching = isSearching
    })
  }
})

export const useSearchStore = create<SearchStore>()(
  MiddlewarePresets.basic<SearchStore>('search')(createSearchStore)
)

export default useSearchStore
