import { LoopMode, SubtitleDisplayMode } from '@types'
import { Draft } from 'immer'
import { create, StateCreator } from 'zustand'

import { MiddlewarePresets } from '../infrastructure'

export interface PlayerState {
  // 播放核心状态
  currentTime: number
  duration: number
  paused: boolean
  volume: number // 0–1
  muted: boolean
  isFullscreen: boolean

  /** 播放速度 */
  playbackRate: number

  // === 循环设置 / Loop Settings ===
  /** 循环播放 */
  loopEnabled: boolean

  /** 循环模式 */
  loopMode: LoopMode

  /** 循环次数 (-1=无限循环，0=关闭，>0=指定次数) */
  loopCount: number

  // === 自动暂停设置 / Auto Pause Settings ===
  /** 是否自动暂停 */
  autoPauseEnabled: boolean

  /** 是否在单句字幕结束时暂停 */
  pauseOnSubtitleEnd: boolean

  /** 恢复播放延迟（毫秒） */
  resumeDelay: number

  // === 字幕设置 / Subtitle Settings ===
  /** 字幕显示模式 */
  subtitleDisplayMode: SubtitleDisplayMode

  // 字幕联动
  subtitleFollow: boolean // 字幕列表是否自动跟随
  activeCueIndex: number // 当前字幕行索引（无则 -1）

  // UI 短时态（与字幕设置面板联动）
  isSettingsOpen: boolean
  wasPlayingBeforeOpen: boolean
}

export interface PlayerActions {
  // 播放控制
  play: () => void
  pause: () => void
  togglePlay: () => void
  setCurrentTime: (t: number) => void
  setDuration: (d: number) => void
  setVolume: (v: number) => void
  setMuted: (m: boolean) => void
  setPlaybackRate: (r: number) => void
  setFullscreen: (f: boolean) => void

  // 字幕联动
  setSubtitleFollow: (follow: boolean) => void
  setActiveCueIndex: (idx: number) => void
  setSubtitleDisplayMode: (mode: SubtitleDisplayMode) => void

  // 面板联动
  openSettingsPanel: () => void
  closeSettingsPanel: (autoResume?: boolean) => void
}

export type PlayerStore = PlayerState & PlayerActions

const initialState: PlayerState = {
  currentTime: 0,
  duration: 0,
  paused: true,
  volume: 1,
  muted: false,
  playbackRate: 1,
  isFullscreen: false,

  // === 循环设置 / Loop Settings ===
  loopEnabled: false,
  loopMode: LoopMode.SINGLE,
  loopCount: -1,

  // === 自动暂停设置 / Auto Pause Settings ===
  autoPauseEnabled: false,
  pauseOnSubtitleEnd: false,
  resumeDelay: 700,

  // === 字幕设置 / Subtitle Settings ===
  subtitleDisplayMode: SubtitleDisplayMode.BILINGUAL,

  subtitleFollow: true,
  activeCueIndex: -1,

  isSettingsOpen: false,
  wasPlayingBeforeOpen: false
}

const createPlayerStore: StateCreator<PlayerStore, [['zustand/immer', never]], [], PlayerStore> = (
  set
) => ({
  ...initialState,

  // 播放控制
  play: () => set((s: Draft<PlayerStore>) => void (s.paused = false)),
  pause: () => set((s: Draft<PlayerStore>) => void (s.paused = true)),
  togglePlay: () => set((s: Draft<PlayerStore>) => void (s.paused = !s.paused)),
  setCurrentTime: (t) => set((s: Draft<PlayerStore>) => void (s.currentTime = Math.max(0, t))),
  setDuration: (d) => set((s: Draft<PlayerStore>) => void (s.duration = Math.max(0, d))),
  setVolume: (v) => set((s: Draft<PlayerStore>) => void (s.volume = Math.max(0, Math.min(1, v)))),
  setMuted: (m) => set((s: Draft<PlayerStore>) => void (s.muted = !!m)),
  setPlaybackRate: (r) =>
    set((s: Draft<PlayerStore>) => void (s.playbackRate = Math.max(0.25, Math.min(3, r)))),
  setFullscreen: (f) => set((s: Draft<PlayerStore>) => void (s.isFullscreen = !!f)),

  // 字幕联动
  setSubtitleFollow: (follow) => set((s: Draft<PlayerStore>) => void (s.subtitleFollow = follow)),
  setActiveCueIndex: (idx) => set((s: Draft<PlayerStore>) => void (s.activeCueIndex = idx)),
  setSubtitleDisplayMode: (mode) =>
    set((s: Draft<PlayerStore>) => void (s.subtitleDisplayMode = mode)),

  // 面板联动
  openSettingsPanel: () =>
    set((s: Draft<PlayerStore>) => {
      s.wasPlayingBeforeOpen = !s.paused
      s.isSettingsOpen = true
      s.paused = true // 打开设置面板时暂停播放（按 PRD 建议）
    }),
  closeSettingsPanel: (autoResume = true) =>
    set((s: Draft<PlayerStore>) => {
      const shouldResume = autoResume && s.wasPlayingBeforeOpen
      s.isSettingsOpen = false
      if (shouldResume) s.paused = false
      s.wasPlayingBeforeOpen = false
    })
})

// 仅持久化与“偏好”相关的少量字段：playbackRate / volume / muted / subtitleFollow
export const usePlayerStore = create<PlayerStore>()(
  MiddlewarePresets.full<PlayerStore>('player', {
    partialize: (state) => ({
      playbackRate: state.playbackRate,
      volume: state.volume,
      muted: state.muted,
      subtitleFollow: state.subtitleFollow
    })
  })(createPlayerStore)
)

export default usePlayerStore
