import { Draft } from 'immer'
import { create, StateCreator } from 'zustand'

import { MiddlewarePresets } from '../infrastructure'

export interface PlayerVideoMeta {
  id: number
  title: string
  src: string
  duration: number
}

export interface PlayerSessionState {
  /** 当前页面正在播放的视频元数据（null 表示未就绪） */
  video: PlayerVideoMeta | null
}

export interface PlayerSessionActions {
  setVideo: (video: PlayerVideoMeta | null) => void
  clear: () => void
}

export type PlayerSessionStore = PlayerSessionState & PlayerSessionActions

const initialState: PlayerSessionState = {
  video: null
}

const createPlayerSessionStore: StateCreator<
  PlayerSessionStore,
  [['zustand/immer', never]],
  [],
  PlayerSessionStore
> = (set) => ({
  ...initialState,

  setVideo: (video: PlayerVideoMeta | null) => {
    set((s: Draft<PlayerSessionStore>) => {
      s.video = video
    })
  },

  clear: () => {
    set((s: Draft<PlayerSessionStore>) => {
      s.video = null
    })
  }
})

// 这是临时会话态，不需要持久化；开启 subscribeWithSelector 以便精确订阅
export const usePlayerSessionStore = create<PlayerSessionStore>()(
  MiddlewarePresets.temporary<PlayerSessionStore>('player-session')(createPlayerSessionStore)
)

export default usePlayerSessionStore
