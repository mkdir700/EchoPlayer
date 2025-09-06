import { LoopMode, SubtitleBackgroundType, SubtitleDisplayMode } from '@types'
import { Draft } from 'immer'
import { create, StateCreator } from 'zustand'

import { MiddlewarePresets } from '../infrastructure'

/**
 * 字幕覆盖层配置接口
 */
export interface SubtitleOverlayConfig {
  /** 显示模式 */
  displayMode: SubtitleDisplayMode
  /** 背景样式配置 */
  backgroundStyle: {
    type: SubtitleBackgroundType
    opacity: number
    customValue?: string
  }
  /** 位置（百分比） */
  position: {
    x: number // 0-100%
    y: number // 0-100%
  }
  /** 尺寸（百分比） */
  size: {
    width: number // 10-100%
    height: number // 5-50%
  }
  /** 是否启用自动定位 */
  autoPositioning: boolean
  /** 是否已初始化 */
  isInitialized: boolean
}

export interface PlayerState {
  // 播放核心状态
  currentTime: number
  duration: number
  paused: boolean
  volume: number // 0–1
  muted: boolean

  /** 播放速度 */
  playbackRate: number

  // === 循环设置 / Loop Settings ===
  /** 循环播放 */
  loopEnabled: boolean

  /** 循环模式 */
  loopMode: LoopMode

  /** 循环次数 (-1=无限循环，0=关闭，>0=指定次数) */
  loopCount: number

  /** 当前句的剩余循环次数（-1=无限；0=不再循环）用于 UI 显示与逻辑判断 */
  loopRemainingCount: number

  // === 自动暂停设置 / Auto Pause Settings ===
  /** 是否自动暂停 */
  autoPauseEnabled: boolean

  /** 是否在单句字幕结束时暂停 */
  pauseOnSubtitleEnd: boolean

  /** 是否启用自动恢复播放 */
  resumeEnabled: boolean

  /** 恢复播放延迟（毫秒） */
  resumeDelay: number

  subtitleOverlay: SubtitleOverlayConfig

  // UI 短时态（与字幕设置面板联动）
  isFullscreen?: boolean
  isSettingsOpen?: boolean
  wasPlayingBeforeOpen?: boolean
  /** 自动恢复倒计时 */
  isAutoResumeCountdownOpen?: boolean
}

export interface PlayerActions {
  // === 播放控制 - 引擎专用 ===
  // ⚠️ 注意：以下播放控制方法应该只由 PlayerOrchestrator 引擎调用
  // 组件应该使用 usePlayerCommandsOrchestrated() 发送命令，而不是直接调用这些方法
  play: () => void // 引擎专用：通过 orchestrator.requestPlay() 调用
  pause: () => void // 引擎专用：通过 orchestrator.requestPause() 调用
  togglePlay: () => void // 引擎专用：通过 orchestrator.requestTogglePlay() 调用
  setCurrentTime: (t: number) => void // 引擎专用：通过 orchestrator.requestSeek() 调用
  setDuration: (d: number) => void // 引擎专用：由媒体事件自动设置
  setVolume: (v: number) => void // 引擎专用：通过 orchestrator.requestSetVolume() 调用
  setMuted: (m: boolean) => void // 引擎专用：通过 orchestrator.requestToggleMute() 调用
  setPlaybackRate: (r: number) => void // 引擎专用：通过 orchestrator.requestSetPlaybackRate() 调用

  // === 循环控制 ===
  // 组件可调用：用户设置
  toggleLoopEnabled: () => void
  setLoopEnabled: (enabled: boolean) => void
  setLoopMode: (mode: LoopMode) => void
  setLoopCount: (count: number) => void // -1=∞，1-99
  // 引擎专用：循环状态管理
  resetLoopRemaining: () => void // 引擎专用：用户手动跳转时重置循环计数
  decrementLoopRemaining: () => void // 引擎专用：策略决策时递减循环计数

  // === 自动暂停/恢复设置 ===
  // 组件可调用：用户设置
  setAutoPauseEnabled: (enabled: boolean) => void
  setPauseOnSubtitleEnd: (enabled: boolean) => void
  setResumeEnabled: (enabled: boolean) => void
  setResumeDelay: (delay: number) => void
  setSubtitleOverlay: (overlayConfig: Partial<SubtitleOverlayConfig>) => void

  loadSettings: (settings: Partial<PlayerState> | null) => void

  // 面板联动
  openSettingsPanel: () => void
  closeSettingsPanel: (autoResume?: boolean) => void
  openAutoResumeCountdown: () => void
  closeAutoResumeCountdown: () => void
  setFullscreen: (f: boolean) => void // 可以由组件调用（全屏与浏览器 API 相关）
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
  loopCount: -1, // -1 表示无限循环
  loopRemainingCount: -1,

  // === 自动暂停设置 / Auto Pause Settings ===
  autoPauseEnabled: false,
  pauseOnSubtitleEnd: true,
  resumeEnabled: false, // 是否启用自动恢复播放
  resumeDelay: 5000, // 5秒

  subtitleOverlay: {
    displayMode: SubtitleDisplayMode.BILINGUAL,
    backgroundStyle: {
      type: SubtitleBackgroundType.BLUR,
      opacity: 0.8
    },
    position: { x: 10, y: 75 },
    size: { width: 80, height: 20 },
    autoPositioning: true,
    isInitialized: false
  },

  isSettingsOpen: false,
  wasPlayingBeforeOpen: false,
  isAutoResumeCountdownOpen: false
}

// 仅包含需要持久化到数据库的设置切片类型
export type PlayerSettings = Pick<
  PlayerState,
  | 'volume'
  | 'muted'
  | 'playbackRate'
  | 'loopEnabled'
  | 'loopMode'
  | 'loopCount'
  | 'loopRemainingCount'
  | 'autoPauseEnabled'
  | 'pauseOnSubtitleEnd'
  | 'resumeEnabled'
  | 'resumeDelay'
  | 'subtitleOverlay'
>

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

  // 循环控制
  toggleLoopEnabled: () =>
    set((s: Draft<PlayerStore>) => {
      s.loopEnabled = !s.loopEnabled
      if (s.loopEnabled && s.loopMode === LoopMode.SINGLE) {
        s.loopRemainingCount = s.loopCount
      } else if (!s.loopEnabled) {
        s.loopRemainingCount = 0
      }
    }),
  setLoopEnabled: (enabled) =>
    set((s: Draft<PlayerStore>) => {
      s.loopEnabled = !!enabled
      if (s.loopEnabled && s.loopMode === LoopMode.SINGLE) {
        s.loopRemainingCount = s.loopCount
      } else if (!s.loopEnabled) {
        s.loopRemainingCount = 0
      }
    }),
  setLoopMode: (mode) =>
    set((s: Draft<PlayerStore>) => {
      s.loopMode = mode
      if (s.loopEnabled) {
        s.loopRemainingCount = mode === LoopMode.SINGLE ? s.loopCount : 0
      }
    }),
  setLoopCount: (count) =>
    set((s: Draft<PlayerStore>) => {
      // 规范：-1 表示无限；1-99 表示有限次数；0 视为关闭（但保留开关由 loopEnabled 控制）
      const clamped = count === -1 ? -1 : Math.max(0, Math.min(99, Math.floor(count)))
      s.loopCount = clamped
      if (s.loopEnabled && s.loopMode === LoopMode.SINGLE) {
        s.loopRemainingCount = clamped
      }
    }),
  resetLoopRemaining: () =>
    set((s: Draft<PlayerStore>) => {
      s.loopRemainingCount = s.loopEnabled && s.loopMode === LoopMode.SINGLE ? s.loopCount : 0
    }),
  decrementLoopRemaining: () =>
    set((s: Draft<PlayerStore>) => {
      if (s.loopEnabled && s.loopMode === LoopMode.SINGLE) {
        if (s.loopRemainingCount > 0) s.loopRemainingCount -= 1
        // -1（∞）与 0（不循环）均不变动
      }
    }),

  // 自动恢复播放
  setResumeEnabled: (enabled: boolean) =>
    set((s: Draft<PlayerStore>) => {
      s.resumeEnabled = enabled
    }),
  setAutoPauseEnabled: (enabled: boolean) =>
    set((s: Draft<PlayerStore>) => {
      s.autoPauseEnabled = enabled
    }),
  setPauseOnSubtitleEnd: (enabled: boolean) =>
    set((s: Draft<PlayerStore>) => {
      s.pauseOnSubtitleEnd = enabled
    }),
  setResumeDelay: (delay: number) =>
    set((s: Draft<PlayerStore>) => {
      s.resumeDelay = delay
    }),

  setSubtitleOverlay: (overlayConfig: Partial<SubtitleOverlayConfig>) =>
    set((s: Draft<PlayerStore>) => {
      const overlay = { ...s.subtitleOverlay, ...overlayConfig }
      s.subtitleOverlay = overlay
    }),

  /** 批量应用持久化设置（一次性 set，避免多次触发保存） */
  loadSettings: (settings: Partial<PlayerState> | null) =>
    set((s: Draft<PlayerStore>) => {
      if (!settings) {
        settings = initialState
      }
      if (settings.currentTime !== undefined) {
        s.currentTime = settings.currentTime
      }
      if (settings.duration !== undefined) {
        s.duration = settings.duration
      }
      if (settings.volume !== undefined) {
        s.volume = settings.volume
      }
      if (settings.muted !== undefined) {
        s.muted = settings.muted
      }
      if (settings.playbackRate !== undefined) {
        s.playbackRate = settings.playbackRate
      }
      if (settings.loopEnabled !== undefined) {
        s.loopEnabled = settings.loopEnabled
      }
      if (settings.loopMode !== undefined) {
        s.loopMode = settings.loopMode
      }
      if (settings.loopCount !== undefined) {
        s.loopCount = settings.loopCount
      }
      if (settings.loopRemainingCount !== undefined) {
        s.loopRemainingCount = settings.loopRemainingCount
      }
      if (settings.autoPauseEnabled !== undefined) {
        s.autoPauseEnabled = settings.autoPauseEnabled
      }
      if (settings.pauseOnSubtitleEnd !== undefined) {
        s.pauseOnSubtitleEnd = settings.pauseOnSubtitleEnd
      }
      if (settings.resumeEnabled !== undefined) {
        s.resumeEnabled = settings.resumeEnabled
      }
      if (settings.resumeDelay !== undefined) {
        s.resumeDelay = settings.resumeDelay
      }
      if (settings.subtitleOverlay !== undefined) {
        s.subtitleOverlay = settings.subtitleOverlay
      }
    }),

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
    }),
  openAutoResumeCountdown: () =>
    set((s: Draft<PlayerStore>) => {
      s.isAutoResumeCountdownOpen = true
    }),
  closeAutoResumeCountdown: () =>
    set((s: Draft<PlayerStore>) => {
      s.isAutoResumeCountdownOpen = false
    })
})

export const usePlayerStore = create<PlayerStore>()(
  MiddlewarePresets.temporary<PlayerStore>('player-settings')(createPlayerStore)
)

export default usePlayerStore
