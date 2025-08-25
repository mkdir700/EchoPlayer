/**
 * 播放器状态管理 Store
 *
 * ⚠️ 重要架构说明：
 *
 * 本 Store 分为两类 actions：
 * 1. 【引擎专用】- 标记为 "引擎专用" 的方法应该只由 PlayerOrchestrator 引擎调用
 *    用于引擎将决策结果写回到状态，组件不应直接调用
 *
 * 2. 【组件可调用】- 用户设置类的方法，组件可以直接调用来更新用户配置
 *
 * 对于播放控制（播放/暂停/跳转/音量等），组件应该：
 * ✅ 使用：usePlayerCommandsOrchestrated() 发送命令
 * ❌ 避免：直接调用 store 的播放控制 actions
 *
 * 这样可以确保所有播放控制都通过引擎统一调度，避免多入口控制的问题。
 */

import { LoopMode, SubtitleDisplayMode } from '@types'
import { Draft } from 'immer'
import { create, StateCreator } from 'zustand'

import { MiddlewarePresets } from '../infrastructure'

export interface PlayerState {
  // 播放核心状态
  currentTime: number // 仅用于 UI
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
  setFullscreen: (f: boolean) => void // 可以由组件调用（全屏与浏览器 API 相关）

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

  // === 字幕联动 ===
  setSubtitleFollow: (follow: boolean) => void // 组件可调用：用户设置
  setActiveCueIndex: (idx: number) => void // 引擎专用：由策略系统更新当前字幕索引
  setSubtitleDisplayMode: (mode: SubtitleDisplayMode) => void // 组件可调用：用户设置

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
  loopCount: -1, // -1 表示无限循环
  loopRemainingCount: -1,

  // === 自动暂停设置 / Auto Pause Settings ===
  autoPauseEnabled: false,
  pauseOnSubtitleEnd: true,
  resumeEnabled: false, // 是否启用自动恢复播放
  resumeDelay: 5000, // 5秒

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
  setActiveCueIndex: (idx) =>
    set((s: Draft<PlayerStore>) => {
      if (s.activeCueIndex !== idx) {
        s.activeCueIndex = idx
      }
    }),
  setSubtitleDisplayMode: (mode) =>
    set((s: Draft<PlayerStore>) => void (s.subtitleDisplayMode = mode)),

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

// 仅持久化与"偏好"相关的少量字段：playbackRate / volume / muted / subtitleFollow
export const usePlayerStore = create<PlayerStore>()(
  MiddlewarePresets.full<PlayerStore>('player', {
    partialize: (state) => ({
      playbackRate: state.playbackRate,
      volume: state.volume,
      muted: state.muted,
      subtitleFollow: state.subtitleFollow,
      loopEnabled: state.loopEnabled,
      loopCount: state.loopCount,
      loopMode: state.loopMode,
      loopRemainingCount: state.loopRemainingCount,
      // 自动暂停设置持久化
      autoPauseEnabled: state.autoPauseEnabled,
      pauseOnSubtitleEnd: state.pauseOnSubtitleEnd,
      resumeEnabled: state.resumeEnabled,
      resumeDelay: state.resumeDelay
    })
  })(createPlayerStore)
)

export default usePlayerStore
