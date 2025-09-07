import { Draft } from 'immer'
import { create, StateCreator } from 'zustand'

import { MiddlewarePresets } from '../infrastructure'

export interface VideoListState {
  /** 刷新触发器，递增数值触发重新加载 */
  refreshTrigger: number
  /** 当前是否正在加载视频列表 */
  isLoading: boolean
}

export interface VideoListActions {
  /** 触发视频列表刷新 */
  refreshVideoList: () => void
  /** 设置加载状态 */
  setLoading: (loading: boolean) => void
}

export type VideoListStore = VideoListState & VideoListActions

const initialState: VideoListState = {
  refreshTrigger: 0,
  isLoading: false
}

const createVideoListStore: StateCreator<
  VideoListStore,
  [['zustand/immer', never]],
  [],
  VideoListStore
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
> = (set, _get) => ({
  ...initialState,

  refreshVideoList: () => {
    set((state: Draft<VideoListStore>) => {
      state.refreshTrigger += 1
    })
  },

  setLoading: (loading: boolean) => {
    set((state: Draft<VideoListStore>) => {
      state.isLoading = loading
    })
  }
})

export const useVideoListStore = create<VideoListStore>()(
  MiddlewarePresets.basic<VideoListStore>('video-list')(createVideoListStore)
)

export default useVideoListStore
