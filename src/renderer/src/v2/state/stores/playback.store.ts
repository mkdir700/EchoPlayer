/**
 * V2 播放控制状态存储 / V2 Playback Control State Store
 *
 * 管理播放控制相关的状态，包括播放状态、循环设置、播放速度、音量等播放控制参数
 * Manages playback control related state including play state, loop settings, playback rate, volume, etc.
 */

import { create } from 'zustand'
import type { Draft } from 'immer'
import { V2MiddlewarePresets, StateDebug, StateValidation } from '../infrastructure'
import { logger } from '@renderer/utils/logger'

/**
 * 播放状态枚举 / Playback State Enum
 */
export enum PlaybackState {
  IDLE = 'idle',
  LOADING = 'loading',
  PLAYING = 'playing',
  PAUSED = 'paused',
  ENDED = 'ended',
  ERROR = 'error'
}

/**
 * 循环模式枚举 / Loop Mode Enum
 */
export enum LoopMode {
  NONE = 'none', // 不循环 / No loop
  SINGLE = 'single', // 单句循环 / Single subtitle loop
  VIDEO = 'video', // 整个视频循环 / Whole video loop
  PLAYLIST = 'playlist' // 播放列表循环 / Playlist loop
}

/**
 * 播放控制配置接口 / Playback Control Configuration Interface
 */
export interface PlaybackControlConfig {
  volume: number // 音量 (0-1) / Volume (0-1)
  playbackRate: number // 播放速度 (0.25-4) / Playback rate (0.25-4)
  isMuted: boolean // 是否静音 / Is muted
  isAutoPause: boolean // 自动暂停 / Auto pause
  skipSilence: boolean // 跳过静音 / Skip silence
  enableKeyboardShortcuts: boolean // 启用键盘快捷键 / Enable keyboard shortcuts
}

/**
 * 循环控制配置接口 / Loop Control Configuration Interface
 */
export interface LoopControlConfig {
  mode: LoopMode // 循环模式 / Loop mode
  count: number // 循环次数 (-1=无限, 0=关闭, >0=指定次数) / Loop count (-1=infinite, 0=off, >0=specific)
  remainingCount: number // 剩余循环次数 / Remaining loop count
  startTime?: number // 循环开始时间 / Loop start time
  endTime?: number // 循环结束时间 / Loop end time
  isActive: boolean // 循环是否激活 / Is loop active
}

/**
 * 播放进度接口 / Playback Progress Interface
 */
export interface PlaybackProgress {
  currentTime: number // 当前时间 (秒) / Current time (seconds)
  duration: number // 总时长 (秒) / Total duration (seconds)
  buffered: { start: number; end: number }[] // 缓冲区间 / Buffered ranges
  seekableStart: number // 可跳转开始时间 / Seekable start time
  seekableEnd: number // 可跳转结束时间 / Seekable end time
}

/**
 * 播放统计信息接口 / Playback Statistics Interface
 */
export interface PlaybackStatistics {
  totalPlayTime: number // 总播放时间 / Total play time
  sessionPlayTime: number // 本次会话播放时间 / Session play time
  playCount: number // 播放次数 / Play count
  pauseCount: number // 暂停次数 / Pause count
  seekCount: number // 跳转次数 / Seek count
  loopCount: number // 循环次数 / Loop count
  lastPlayedAt: Date // 最后播放时间 / Last played at
}

/**
 * 播放控制状态接口 / Playback Control State Interface
 */
export interface PlaybackControlState {
  // 基础播放状态 / Basic playback state
  state: PlaybackState
  isPlaying: boolean
  isPaused: boolean
  isLoading: boolean
  hasError: boolean
  errorMessage: string | null

  // 播放进度 / Playback progress
  progress: PlaybackProgress

  // 播放控制配置 / Playback control configuration
  controlConfig: PlaybackControlConfig

  // 循环控制配置 / Loop control configuration
  loopConfig: LoopControlConfig

  // 播放统计 / Playback statistics
  statistics: PlaybackStatistics

  // 播放历史 / Playback history
  playbackHistory: { timestamp: Date; action: string; data?: unknown }[]
}

/**
 * 播放控制操作接口 / Playback Control Actions Interface
 */
export interface PlaybackControlActions {
  // 基础播放控制 / Basic playback control
  play: () => void
  pause: () => void
  stop: () => void
  togglePlayPause: () => void
  seek: (time: number) => void
  seekRelative: (offset: number) => void

  // 音量控制 / Volume control
  setVolume: (volume: number) => void
  toggleMute: () => void
  volumeUp: (step?: number) => void
  volumeDown: (step?: number) => void

  // 播放速度控制 / Playback rate control
  setPlaybackRate: (rate: number) => void
  increasePlaybackRate: (step?: number) => void
  decreasePlaybackRate: (step?: number) => void
  resetPlaybackRate: () => void

  // 循环控制 / Loop control
  setLoopMode: (mode: LoopMode) => void
  setLoopCount: (count: number) => void
  setLoopRange: (startTime: number, endTime: number) => void
  clearLoopRange: () => void
  toggleLoop: () => void
  resetLoop: () => void

  // 播放状态管理 / Playback state management
  setPlaybackState: (state: PlaybackState) => void
  setProgress: (progress: Partial<PlaybackProgress>) => void
  setError: (error: string | null) => void
  clearError: () => void

  // 配置管理 / Configuration management
  updateControlConfig: (config: Partial<PlaybackControlConfig>) => void
  setAutoPause: (enabled: boolean) => void
  setSkipSilence: (enabled: boolean) => void
  setKeyboardShortcuts: (enabled: boolean) => void

  // 统计和历史 / Statistics and history
  recordAction: (action: string, data?: unknown) => void
  incrementPlayCount: () => void
  incrementPauseCount: () => void
  incrementSeekCount: () => void
  updatePlayTime: (duration: number) => void
  clearHistory: () => void
  clearStatistics: () => void

  // 工具方法 / Utility methods
  getFormattedTime: (time?: number) => string
  getProgressPercentage: () => number
  isInLoopRange: (time: number) => boolean
  validateState: () => { isValid: boolean; errors: string[] }
  resetToDefaults: () => void
}

/**
 * 播放控制存储类型 / Playback Control Store Type
 */
export type PlaybackControlStore = PlaybackControlState & PlaybackControlActions

/**
 * 默认播放控制配置 / Default playback control configuration
 */
const defaultControlConfig: PlaybackControlConfig = {
  volume: 1.0,
  playbackRate: 1.0,
  isMuted: false,
  isAutoPause: false,
  skipSilence: false,
  enableKeyboardShortcuts: true
}

/**
 * 默认循环控制配置 / Default loop control configuration
 */
const defaultLoopConfig: LoopControlConfig = {
  mode: LoopMode.NONE,
  count: 0,
  remainingCount: 0,
  isActive: false
}

/**
 * 默认播放进度 / Default playback progress
 */
const defaultProgress: PlaybackProgress = {
  currentTime: 0,
  duration: 0,
  buffered: [],
  seekableStart: 0,
  seekableEnd: 0
}

/**
 * 默认播放统计 / Default playback statistics
 */
const defaultStatistics: PlaybackStatistics = {
  totalPlayTime: 0,
  sessionPlayTime: 0,
  playCount: 0,
  pauseCount: 0,
  seekCount: 0,
  loopCount: 0,
  lastPlayedAt: new Date()
}

/**
 * 初始状态 / Initial state
 */
const initialState: PlaybackControlState = {
  state: PlaybackState.IDLE,
  isPlaying: false,
  isPaused: false,
  isLoading: false,
  hasError: false,
  errorMessage: null,
  progress: defaultProgress,
  controlConfig: defaultControlConfig,
  loopConfig: defaultLoopConfig,
  statistics: defaultStatistics,
  playbackHistory: []
}

/**
 * 状态验证规则 / State validation rules
 */
const stateValidationRules: Record<string, (value: unknown) => boolean> = {
  state: (value: unknown) => Object.values(PlaybackState).includes(value as PlaybackState),
  isPlaying: (value: unknown) => typeof value === 'boolean',
  isPaused: (value: unknown) => typeof value === 'boolean'
}

/**
 * 格式化时间工具函数 / Format time utility function
 */
const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

/**
 * V2 播放控制状态存储 / V2 Playback Control State Store
 *
 * 使用 Zustand + Immer + 持久化中间件管理播放控制状态
 * Uses Zustand + Immer + persistence middleware to manage playback control state
 */
export const usePlaybackControlStore = create<PlaybackControlStore>()(
  V2MiddlewarePresets.persistent('playback-control-store', {
    // 选择性持久化：只持久化配置和统计信息 / Selective persistence: only persist config and statistics
    partialize: (state: unknown) => {
      const typedState = state as PlaybackControlState
      return {
        controlConfig: typedState.controlConfig,
        loopConfig: {
          ...typedState.loopConfig,
          remainingCount: 0, // 不持久化剩余次数 / Don't persist remaining count
          isActive: false // 不持久化激活状态 / Don't persist active state
        },
        statistics: typedState.statistics
      }
    },
    version: 1
  })(
    (
      set: (fn: (state: Draft<PlaybackControlState>) => void) => void,
      get: () => PlaybackControlStore
    ) => ({
      ...initialState,

      // 基础播放控制 / Basic playback control
      play: () => {
        set((state) => {
          state.state = PlaybackState.PLAYING
          state.isPlaying = true
          state.isPaused = false
          state.hasError = false
          state.errorMessage = null
        })

        get().recordAction('play')
        get().incrementPlayCount()
        StateDebug.logStateChange('PlaybackControlStore', 'play', false, true)
      },

      pause: () => {
        set((state) => {
          state.state = PlaybackState.PAUSED
          state.isPlaying = false
          state.isPaused = true
        })

        get().recordAction('pause')
        get().incrementPauseCount()
        StateDebug.logStateChange('PlaybackControlStore', 'pause', true, false)
      },

      stop: () => {
        set((state) => {
          state.state = PlaybackState.IDLE
          state.isPlaying = false
          state.isPaused = false
          state.progress.currentTime = 0
        })

        get().recordAction('stop')
      },

      togglePlayPause: () => {
        const state = get()
        if (state.isPlaying) {
          get().pause()
        } else {
          get().play()
        }
      },

      seek: (time: number) => {
        set((state) => {
          const clampedTime = Math.max(0, Math.min(time, state.progress.duration))
          state.progress.currentTime = clampedTime
        })

        get().recordAction('seek', { time })
        get().incrementSeekCount()
      },

      seekRelative: (offset: number) => {
        const state = get()
        const newTime = state.progress.currentTime + offset
        get().seek(newTime)
      },

      // 音量控制 / Volume control
      setVolume: (volume: number) => {
        set((state) => {
          state.controlConfig.volume = Math.max(0, Math.min(1, volume))
          if (volume > 0) {
            state.controlConfig.isMuted = false
          }
        })

        get().recordAction('setVolume', { volume })
      },

      toggleMute: () => {
        set((state) => {
          state.controlConfig.isMuted = !state.controlConfig.isMuted
        })

        get().recordAction('toggleMute')
      },

      volumeUp: (step = 0.1) => {
        const state = get()
        get().setVolume(state.controlConfig.volume + step)
      },

      volumeDown: (step = 0.1) => {
        const state = get()
        get().setVolume(state.controlConfig.volume - step)
      },

      // 播放速度控制 / Playback rate control
      setPlaybackRate: (rate: number) => {
        set((state) => {
          state.controlConfig.playbackRate = Math.max(0.25, Math.min(4, rate))
        })

        get().recordAction('setPlaybackRate', { rate })
      },

      increasePlaybackRate: (step = 0.25) => {
        const state = get()
        get().setPlaybackRate(state.controlConfig.playbackRate + step)
      },

      decreasePlaybackRate: (step = 0.25) => {
        const state = get()
        get().setPlaybackRate(state.controlConfig.playbackRate - step)
      },

      resetPlaybackRate: () => {
        get().setPlaybackRate(1.0)
      },

      // 循环控制 / Loop control
      setLoopMode: (mode: LoopMode) => {
        set((state) => {
          state.loopConfig.mode = mode
          state.loopConfig.isActive = mode !== LoopMode.NONE

          if (mode === LoopMode.NONE) {
            state.loopConfig.count = 0
            state.loopConfig.remainingCount = 0
          }
        })

        get().recordAction('setLoopMode', { mode })
      },

      setLoopCount: (count: number) => {
        set((state) => {
          state.loopConfig.count = count
          state.loopConfig.remainingCount = count > 0 ? count : 0
          state.loopConfig.isActive = count !== 0

          if (count === 0) {
            state.loopConfig.mode = LoopMode.NONE
          } else if (state.loopConfig.mode === LoopMode.NONE) {
            state.loopConfig.mode = LoopMode.SINGLE
          }
        })

        get().recordAction('setLoopCount', { count })
      },

      setLoopRange: (startTime: number, endTime: number) => {
        set((state) => {
          state.loopConfig.startTime = Math.max(0, startTime)
          state.loopConfig.endTime = Math.min(endTime, state.progress.duration)
        })

        get().recordAction('setLoopRange', { startTime, endTime })
      },

      clearLoopRange: () => {
        set((state) => {
          state.loopConfig.startTime = undefined
          state.loopConfig.endTime = undefined
        })

        get().recordAction('clearLoopRange')
      },

      toggleLoop: () => {
        const state = get()
        if (state.loopConfig.isActive) {
          get().setLoopMode(LoopMode.NONE)
        } else {
          get().setLoopMode(LoopMode.SINGLE)
          get().setLoopCount(-1) // 无限循环 / Infinite loop
        }
      },

      resetLoop: () => {
        set((state) => {
          state.loopConfig = { ...defaultLoopConfig }
        })

        get().recordAction('resetLoop')
      },

      // 播放状态管理 / Playback state management
      setPlaybackState: (newState: PlaybackState) => {
        set((state) => {
          state.state = newState
          state.isPlaying = newState === PlaybackState.PLAYING
          state.isPaused = newState === PlaybackState.PAUSED
          state.isLoading = newState === PlaybackState.LOADING
          state.hasError = newState === PlaybackState.ERROR
        })
      },

      setProgress: (progress: Partial<PlaybackProgress>) => {
        set((state) => {
          Object.assign(state.progress, progress)
        })
      },

      setError: (error: string | null) => {
        set((state) => {
          state.errorMessage = error
          state.hasError = !!error
          if (error) {
            state.state = PlaybackState.ERROR
            state.isPlaying = false
          }
        })
      },

      clearError: () => {
        get().setError(null)
      },

      // 配置管理 / Configuration management
      updateControlConfig: (config: Partial<PlaybackControlConfig>) => {
        set((state) => {
          Object.assign(state.controlConfig, config)
        })
      },

      setAutoPause: (enabled: boolean) => {
        set((state) => {
          state.controlConfig.isAutoPause = enabled
        })
      },

      setSkipSilence: (enabled: boolean) => {
        set((state) => {
          state.controlConfig.skipSilence = enabled
        })
      },

      setKeyboardShortcuts: (enabled: boolean) => {
        set((state) => {
          state.controlConfig.enableKeyboardShortcuts = enabled
        })
      },

      // 统计和历史 / Statistics and history
      recordAction: (action: string, data?: unknown) => {
        set((state) => {
          const record = {
            timestamp: new Date(),
            action,
            data
          }

          state.playbackHistory.unshift(record)

          // 限制历史记录长度 / Limit history length
          if (state.playbackHistory.length > 100) {
            state.playbackHistory.splice(100)
          }
        })
      },

      incrementPlayCount: () => {
        set((state) => {
          state.statistics.playCount++
          state.statistics.lastPlayedAt = new Date()
        })
      },

      incrementPauseCount: () => {
        set((state) => {
          state.statistics.pauseCount++
        })
      },

      incrementSeekCount: () => {
        set((state) => {
          state.statistics.seekCount++
        })
      },

      updatePlayTime: (duration: number) => {
        set((state) => {
          state.statistics.totalPlayTime += duration
          state.statistics.sessionPlayTime += duration
        })
      },

      clearHistory: () => {
        set((state) => {
          state.playbackHistory = []
        })
      },

      clearStatistics: () => {
        set((state) => {
          state.statistics = { ...defaultStatistics }
        })
      },

      // 工具方法 / Utility methods
      getFormattedTime: (time?: number) => {
        const state = get()
        return formatTime(time ?? state.progress.currentTime)
      },

      getProgressPercentage: () => {
        const state = get()
        if (state.progress.duration === 0) return 0
        return (state.progress.currentTime / state.progress.duration) * 100
      },

      isInLoopRange: (time: number) => {
        const state = get()
        const { startTime, endTime } = state.loopConfig

        if (startTime === undefined || endTime === undefined) {
          return false
        }

        return time >= startTime && time <= endTime
      },

      validateState: () => {
        const state = get()
        const { isValid, invalidKeys } = StateValidation.validateStateTypes(
          state as unknown as Record<string, unknown>,
          stateValidationRules
        )

        return {
          isValid,
          errors: invalidKeys.map((key) => `Invalid state for key: ${key}`)
        }
      },

      resetToDefaults: () => {
        set(() => ({ ...initialState }))
        logger.info('🔄 播放控制状态已重置为默认值')
      }
    })
  )
)
