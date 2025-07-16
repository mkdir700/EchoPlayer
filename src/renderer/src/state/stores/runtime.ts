import type { UpdateInfo } from 'builder-util-runtime'
import { Draft } from 'immer'
import { create, StateCreator } from 'zustand'

import { MiddlewarePresets } from '../infrastructure'

export interface UpdateState {
  info: UpdateInfo | null
  checking: boolean
  downloading: boolean
  downloaded: boolean
  downloadProgress: number
  available: boolean
}

export interface RuntimeState {
  update: UpdateState
  filePath: string
}

export interface RuntimeActions {
  setUpdateInfo: (info: UpdateInfo | null) => void
  setFilePath: (path: string) => void
}

export type RuntimeStore = RuntimeState & RuntimeActions

const initialState: RuntimeState = {
  update: {
    info: null,
    checking: false,
    downloading: false,
    downloaded: false,
    downloadProgress: 0,
    available: false
  },
  filePath: ''
}

const createRuntimeStore: StateCreator<
  RuntimeStore,
  [['zustand/immer', never]],
  [],
  RuntimeStore
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
> = (set, _get) => ({
  ...initialState,
  setUpdateInfo: (info: UpdateInfo | null) => {
    set((state: Draft<RuntimeStore>) => {
      state.update.info = info
    })
  },
  setFilePath: (path: string) => {
    set((state: Draft<RuntimeStore>) => {
      state.filePath = path
    })
  }
})

export const useRuntimeStore = create<RuntimeStore>()(
  MiddlewarePresets.basic<RuntimeStore>('runtime')(createRuntimeStore)
)

export default useRuntimeStore
