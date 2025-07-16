import { Draft } from 'immer'
import { create, StateCreator } from 'zustand'

import { MiddlewarePresets } from '../infrastructure'

export interface SearchState {
  isSearchVisible: boolean
  searchQuery: string
}

export interface SearchActions {
  showSearch: () => void
  hideSearch: () => void
  toggleSearch: () => void
  setSearchQuery: (query: string) => void
  clearSearch: () => void
}

export type SearchStore = SearchState & SearchActions

const initialState: SearchState = {
  isSearchVisible: false,
  searchQuery: ''
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
    })
  }
})

export const useSearchStore = create<SearchStore>()(
  MiddlewarePresets.basic<SearchStore>('search')(createSearchStore)
)

export default useSearchStore
