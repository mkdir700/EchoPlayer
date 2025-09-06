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
  setUpdateState: (updates: Partial<UpdateState>) => void
  setChecking: (checking: boolean) => void
  setDownloading: (downloading: boolean) => void
  setDownloaded: (downloaded: boolean) => void
  setDownloadProgress: (progress: number) => void
  setAvailable: (available: boolean) => void
  clearUpdateState: () => void
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
  },
  setUpdateState: (updates: Partial<UpdateState>) => {
    set((state: Draft<RuntimeStore>) => {
      Object.assign(state.update, updates)
    })
  },
  setChecking: (checking: boolean) => {
    set((state: Draft<RuntimeStore>) => {
      state.update.checking = checking
    })
  },
  setDownloading: (downloading: boolean) => {
    set((state: Draft<RuntimeStore>) => {
      state.update.downloading = downloading
    })
  },
  setDownloaded: (downloaded: boolean) => {
    set((state: Draft<RuntimeStore>) => {
      state.update.downloaded = downloaded
    })
  },
  setDownloadProgress: (progress: number) => {
    set((state: Draft<RuntimeStore>) => {
      state.update.downloadProgress = progress
    })
  },
  setAvailable: (available: boolean) => {
    set((state: Draft<RuntimeStore>) => {
      state.update.available = available
    })
  },
  clearUpdateState: () => {
    set((state: Draft<RuntimeStore>) => {
      state.update = {
        info: null,
        checking: false,
        downloading: false,
        downloaded: false,
        downloadProgress: 0,
        available: false
      }
    })
  }
})

export const useRuntimeStore = create<RuntimeStore>()(
  MiddlewarePresets.basic<RuntimeStore>('runtime')(createRuntimeStore)
)

export default useRuntimeStore
