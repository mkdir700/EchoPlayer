import { LoopMode, SubtitleDisplayMode } from '@types'
import { Draft } from 'immer'
import { create, StateCreator } from 'zustand'

import { MiddlewarePresets } from '../infrastructure'

export interface VideoProjectConfig {
  videoId: number
  version: 1
  progress: {
    currentTime: number
    duration?: number
  }
  loop: {
    enabled: boolean
    mode: LoopMode
    count: number // -1 = 无限
  }
  autoPause: {
    enabled: boolean
    pauseOnSubtitleEnd: boolean
    resumeDelay: number // ms
  }
  subtitle: {
    displayMode: SubtitleDisplayMode
    follow: boolean
    activeCueIndex: number
  }
  meta: {
    lastPlayedAt: number
  }
}

export interface VideoProjectStoreState {
  configs: Record<number, VideoProjectConfig>
}

export interface VideoProjectStoreActions {
  getConfig: (videoId: number) => VideoProjectConfig
  upsertConfig: (videoId: number, patch: Partial<VideoProjectConfig>) => void
  updateProgress: (videoId: number, currentTime: number, duration?: number) => void
  removeConfig: (videoId: number) => void
  prune: (maxItems?: number) => void
}

export type VideoProjectStore = VideoProjectStoreState & VideoProjectStoreActions

const DEFAULT_RESUME_DELAY = 700
const DEFAULT_LOOP_COUNT = -1

function createDefaultConfig(videoId: number): VideoProjectConfig {
  return {
    videoId,
    version: 1,
    progress: { currentTime: 0, duration: undefined },
    loop: { enabled: false, mode: LoopMode.SINGLE, count: DEFAULT_LOOP_COUNT },
    autoPause: { enabled: false, pauseOnSubtitleEnd: false, resumeDelay: DEFAULT_RESUME_DELAY },
    subtitle: { displayMode: SubtitleDisplayMode.BILINGUAL, follow: true, activeCueIndex: -1 },
    meta: { lastPlayedAt: Date.now() }
  }
}

const initialState: VideoProjectStoreState = {
  configs: {}
}

const createVideoProjectStore: StateCreator<
  VideoProjectStore,
  [['zustand/immer', never]],
  [],
  VideoProjectStore
> = (set, get) => ({
  ...initialState,

  getConfig: (videoId) => {
    const cfg = get().configs[videoId]
    if (!cfg) return createDefaultConfig(videoId)
    return cfg
  },

  upsertConfig: (videoId, patch) => {
    set((s: Draft<VideoProjectStore>) => {
      const prev = s.configs[videoId] ?? createDefaultConfig(videoId)
      const merged: VideoProjectConfig = {
        ...prev,
        ...patch,
        // 深层合并关键域
        progress: { ...prev.progress, ...(patch.progress ?? {}) },
        loop: { ...prev.loop, ...(patch.loop ?? {}) },
        autoPause: { ...prev.autoPause, ...(patch.autoPause ?? {}) },
        subtitle: { ...prev.subtitle, ...(patch.subtitle ?? {}) },
        meta: { ...prev.meta, lastPlayedAt: Date.now(), ...(patch.meta ?? {}) }
      }
      s.configs[videoId] = merged
    })
  },

  updateProgress: (videoId, currentTime, duration) => {
    set((s: Draft<VideoProjectStore>) => {
      const prev = s.configs[videoId] ?? createDefaultConfig(videoId)
      prev.progress.currentTime = Math.max(0, currentTime)
      if (typeof duration === 'number' && duration > 0) prev.progress.duration = duration
      prev.meta.lastPlayedAt = Date.now()
      s.configs[videoId] = prev
    })
  },

  removeConfig: (fileId) => {
    set((s: Draft<VideoProjectStore>) => {
      delete s.configs[fileId]
    })
  },

  prune: (maxItems = 500) => {
    const state = get()
    const entries = Object.values(state.configs)
    if (entries.length <= maxItems) return
    const sorted = entries.sort((a, b) => a.meta.lastPlayedAt - b.meta.lastPlayedAt)
    const toRemove = sorted.slice(0, Math.max(0, entries.length - maxItems))
    set((s: Draft<VideoProjectStore>) => {
      toRemove.forEach((cfg) => delete s.configs[cfg.videoId])
    })
  }
})

export const useVideoProjectStore = create<VideoProjectStore>()(
  MiddlewarePresets.persistent<VideoProjectStore>('video-projects', {
    partialize: (state) => ({ configs: state.configs }),
    version: 1
  })(createVideoProjectStore)
)

export default useVideoProjectStore
