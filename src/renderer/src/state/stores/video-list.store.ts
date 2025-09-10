import { Draft } from 'immer'
import { create, StateCreator } from 'zustand'

import { MiddlewarePresets } from '../infrastructure'

// 引入视频数据类型
export interface CachedVideoItem {
  id: number
  title: string
  subtitle?: string
  thumbnail?: string
  duration: number
  durationText: string
  watchProgress: number
  createdAt: Date
  publishedAt: string
}

export interface VideoListState {
  /** 刷新触发器，递增数值触发重新加载 */
  refreshTrigger: number
  /** 当前是否正在加载视频列表 */
  isLoading: boolean
  /** 是否已完成初始化（首次数据加载） */
  isInitialized: boolean
  /** 缓存的视频数据 */
  cachedVideos: CachedVideoItem[]
}

export interface VideoListActions {
  /** 触发视频列表刷新 */
  refreshVideoList: () => void
  /** 设置加载状态 */
  setLoading: (loading: boolean) => void
  /** 标记为已初始化 */
  setInitialized: (initialized: boolean) => void
  /** 缓存视频数据 */
  setCachedVideos: (videos: CachedVideoItem[]) => void
  /** 清空缓存的视频数据 */
  clearCachedVideos: () => void
}

export type VideoListStore = VideoListState & VideoListActions

const initialState: VideoListState = {
  refreshTrigger: 0,
  isLoading: false,
  isInitialized: false,
  cachedVideos: []
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
  },

  setInitialized: (initialized: boolean) => {
    set((state: Draft<VideoListStore>) => {
      state.isInitialized = initialized
    })
  },

  setCachedVideos: (videos: CachedVideoItem[]) => {
    set((state: Draft<VideoListStore>) => {
      state.cachedVideos = videos
    })
  },

  clearCachedVideos: () => {
    set((state: Draft<VideoListStore>) => {
      state.cachedVideos = []
    })
  }
})

export const useVideoListStore = create<VideoListStore>()(
  MiddlewarePresets.basic<VideoListStore>('video-list')(createVideoListStore)
)

export default useVideoListStore
