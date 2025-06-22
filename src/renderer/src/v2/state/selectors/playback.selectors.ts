/* eslint-disable @typescript-eslint/explicit-function-return-type */
/**
 * V2 播放控制状态选择器 / V2 Playback Control State Selectors
 *
 * 使用自动生成选择器模式提供高性能的播放控制状态访问
 * Uses auto-generated selector pattern for high-performance playback control state access
 */

import { createSelectors, formatTime } from '../infrastructure'
import {
  usePlaybackControlStore,
  type PlaybackControlState,
  PlaybackState
} from '../stores/playback.store'

/**
 * 带有自动生成选择器的播放控制 Store / Playback Control Store with auto-generated selectors
 *
 * 使用方式 / Usage:
 * - 基础属性: playbackStore.use.isPlaying()
 * - 嵌套属性: playbackStore.use.progress() 然后访问 .currentTime
 * - 复杂计算: 使用下面的计算属性选择器
 */
export const playbackStore = createSelectors(usePlaybackControlStore)

/**
 * 计算属性选择器 / Computed property selectors
 * 这些选择器提供复杂的计算逻辑，无法通过自动生成获得
 * These selectors provide complex computation logic that cannot be auto-generated
 */
export const playbackSelectors = {
  // 计算属性选择器 / Computed property selectors
  progressPercentage: (state: PlaybackControlState) => {
    if (state.progress.duration === 0) return 0
    return (state.progress.currentTime / state.progress.duration) * 100
  },

  timeRemaining: (state: PlaybackControlState) => {
    return Math.max(0, state.progress.duration - state.progress.currentTime)
  },

  isNearEnd: (state: PlaybackControlState) => {
    const remaining = state.progress.duration - state.progress.currentTime
    return remaining <= 30 // 剩余30秒以内 / Within 30 seconds remaining
  },

  canPlay: (state: PlaybackControlState) => {
    return state.state !== PlaybackState.LOADING && state.state !== PlaybackState.ERROR
  },

  canPause: (state: PlaybackControlState) => {
    return state.isPlaying
  },

  canSeek: (state: PlaybackControlState) => {
    return state.progress.duration > 0 && state.state !== PlaybackState.LOADING
  },

  canSeekTo: (state: PlaybackControlState, time: number) => {
    return time >= state.progress.seekableStart && time <= state.progress.seekableEnd
  },

  effectiveVolume: (state: PlaybackControlState) => {
    return state.controlConfig.isMuted ? 0 : state.controlConfig.volume
  },

  isInfiniteLoop: (state: PlaybackControlState) => {
    return state.loopConfig.count === -1
  },

  hasLoopRange: (state: PlaybackControlState) => {
    return state.loopConfig.startTime !== undefined && state.loopConfig.endTime !== undefined
  },

  loopRangeDuration: (state: PlaybackControlState) => {
    const { startTime, endTime } = state.loopConfig
    if (startTime === undefined || endTime === undefined) return 0
    return Math.max(0, endTime - startTime)
  },

  isInLoopRange: (state: PlaybackControlState, time: number) => {
    const { startTime, endTime } = state.loopConfig
    if (startTime === undefined || endTime === undefined) return false
    return time >= startTime && time <= endTime
  },

  // 格式化选择器 / Formatted selectors
  formattedCurrentTime: (state: PlaybackControlState) => {
    return formatTime(state.progress.currentTime)
  },

  formattedDuration: (state: PlaybackControlState) => {
    return formatTime(state.progress.duration)
  },

  formattedTimeRemaining: (state: PlaybackControlState) => {
    const remaining = state.progress.duration - state.progress.currentTime
    return formatTime(Math.max(0, remaining))
  },

  formattedProgressText: (state: PlaybackControlState) => {
    const current = formatTime(state.progress.currentTime)
    const total = formatTime(state.progress.duration)
    return `${current} / ${total}`
  },

  formattedVolume: (state: PlaybackControlState) => {
    return Math.round(state.controlConfig.volume * 100)
  },

  formattedPlaybackRate: (state: PlaybackControlState) => {
    return `${state.controlConfig.playbackRate}x`
  },

  // 状态组合选择器 / State composite selectors
  playbackInfo: (state: PlaybackControlState) => {
    return {
      state: state.state,
      isPlaying: state.isPlaying,
      isPaused: state.isPaused,
      isLoading: state.isLoading,
      hasError: state.hasError,
      currentTime: state.progress.currentTime,
      duration: state.progress.duration,
      progress: playbackSelectors.progressPercentage(state),
      volume: state.controlConfig.volume,
      playbackRate: state.controlConfig.playbackRate,
      isMuted: state.controlConfig.isMuted
    }
  },

  loopInfo: (state: PlaybackControlState) => {
    return {
      mode: state.loopConfig.mode,
      count: state.loopConfig.count,
      remainingCount: state.loopConfig.remainingCount,
      isActive: state.loopConfig.isActive,
      isInfinite: playbackSelectors.isInfiniteLoop(state),
      hasRange: playbackSelectors.hasLoopRange(state),
      startTime: state.loopConfig.startTime,
      endTime: state.loopConfig.endTime,
      rangeDuration: playbackSelectors.loopRangeDuration(state)
    }
  },

  controlInfo: (state: PlaybackControlState) => {
    return {
      volume: state.controlConfig.volume,
      playbackRate: state.controlConfig.playbackRate,
      isMuted: state.controlConfig.isMuted,
      isAutoPause: state.controlConfig.isAutoPause,
      skipSilence: state.controlConfig.skipSilence,
      enableKeyboardShortcuts: state.controlConfig.enableKeyboardShortcuts,
      effectiveVolume: playbackSelectors.effectiveVolume(state),
      formattedVolume: playbackSelectors.formattedVolume(state),
      formattedPlaybackRate: playbackSelectors.formattedPlaybackRate(state)
    }
  },

  statisticsInfo: (state: PlaybackControlState) => {
    return {
      totalPlayTime: state.statistics.totalPlayTime,
      sessionPlayTime: state.statistics.sessionPlayTime,
      playCount: state.statistics.playCount,
      pauseCount: state.statistics.pauseCount,
      seekCount: state.statistics.seekCount,
      loopCount: state.statistics.loopCount,
      lastPlayedAt: state.statistics.lastPlayedAt,
      formattedTotalPlayTime: formatTime(state.statistics.totalPlayTime),
      formattedSessionPlayTime: formatTime(state.statistics.sessionPlayTime)
    }
  }
}

/**
 * 便捷 Hook 选择器 / Convenient Hook selectors
 * 使用自动生成的选择器和计算属性选择器
 * Uses auto-generated selectors and computed property selectors
 */

// 基础播放状态 Hooks / Basic playback state hooks
export const usePlaybackState = () => playbackStore.use.state()
export const useIsPlaying = () => playbackStore.use.isPlaying()
export const useIsPaused = () => playbackStore.use.isPaused()
export const useIsLoading = () => playbackStore.use.isLoading()
export const useHasError = () => playbackStore.use.hasError()
export const useErrorMessage = () => playbackStore.use.errorMessage()

// 播放进度 Hooks / Playback progress hooks
export const useProgress = () => playbackStore.use.progress()
export const useCurrentTime = () => playbackStore((state) => state.progress.currentTime)
export const useDuration = () => playbackStore((state) => state.progress.duration)
export const useProgressPercentage = () => playbackStore(playbackSelectors.progressPercentage)
export const useTimeRemaining = () => playbackStore(playbackSelectors.timeRemaining)
export const useIsNearEnd = () => playbackStore(playbackSelectors.isNearEnd)

// 控制配置 Hooks / Control configuration hooks
export const useControlConfig = () => playbackStore.use.controlConfig()
export const useVolume = () => playbackStore((state) => state.controlConfig.volume)
export const usePlaybackRate = () => playbackStore((state) => state.controlConfig.playbackRate)
export const useIsMuted = () => playbackStore((state) => state.controlConfig.isMuted)
export const useIsAutoPause = () => playbackStore((state) => state.controlConfig.isAutoPause)
export const useEffectiveVolume = () => playbackStore(playbackSelectors.effectiveVolume)

// 循环配置 Hooks / Loop configuration hooks
export const useLoopConfig = () => playbackStore.use.loopConfig()
export const useLoopMode = () => playbackStore((state) => state.loopConfig.mode)
export const useLoopCount = () => playbackStore((state) => state.loopConfig.count)
export const useRemainingCount = () => playbackStore((state) => state.loopConfig.remainingCount)
export const useIsLoopActive = () => playbackStore((state) => state.loopConfig.isActive)
export const useIsInfiniteLoop = () => playbackStore(playbackSelectors.isInfiniteLoop)
export const useHasLoopRange = () => playbackStore(playbackSelectors.hasLoopRange)

// 能力检查 Hooks / Capability check hooks
export const useCanPlay = () => playbackStore(playbackSelectors.canPlay)
export const useCanPause = () => playbackStore(playbackSelectors.canPause)
export const useCanSeek = () => playbackStore(playbackSelectors.canSeek)

// 格式化数据 Hooks / Formatted data hooks
export const useFormattedCurrentTime = () => playbackStore(playbackSelectors.formattedCurrentTime)
export const useFormattedDuration = () => playbackStore(playbackSelectors.formattedDuration)
export const useFormattedProgressText = () => playbackStore(playbackSelectors.formattedProgressText)
export const useFormattedVolume = () => playbackStore(playbackSelectors.formattedVolume)

// 组合数据 Hooks / Composite data hooks
export const usePlaybackInfo = () => playbackStore(playbackSelectors.playbackInfo)
export const useLoopInfo = () => playbackStore(playbackSelectors.loopInfo)
export const useControlInfo = () => playbackStore(playbackSelectors.controlInfo)
export const useStatisticsInfo = () => playbackStore(playbackSelectors.statisticsInfo)

// 统计信息 Hooks / Statistics hooks
export const useStatistics = () => playbackStore.use.statistics()
export const usePlayCount = () => playbackStore((state) => state.statistics.playCount)
export const useTotalPlayTime = () => playbackStore((state) => state.statistics.totalPlayTime)
export const useSessionPlayTime = () => playbackStore((state) => state.statistics.sessionPlayTime)

// 参数化 Hooks / Parameterized hooks
export const useCanSeekTo = (time: number) =>
  playbackStore((state) => playbackSelectors.canSeekTo(state, time))
export const useIsInLoopRange = (time: number) =>
  playbackStore((state) => playbackSelectors.isInLoopRange(state, time))
