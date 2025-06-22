/* eslint-disable @typescript-eslint/explicit-function-return-type */
/**
 * V2 视频状态选择器 / V2 Video State Selectors
 *
 * 使用自动生成选择器模式提供高性能的视频状态访问
 * Uses auto-generated selector pattern for high-performance video state access
 */

import { createSelectors, formatTime } from '../infrastructure'
import { useVideoStore, type VideoState } from '../stores/video.store'

/**
 * 带有自动生成选择器的视频 Store / Video Store with auto-generated selectors
 *
 * 使用方式 / Usage:
 * - 基础属性: videoStore.use.currentVideo()
 * - 嵌套属性: videoStore.use.loadingState() 然后访问 .isLoading
 * - 复杂计算: 使用下面的计算属性选择器
 */
export const videoStore = createSelectors(useVideoStore)

/**
 * 计算属性选择器 / Computed property selectors
 * 这些选择器提供复杂的计算逻辑，无法通过自动生成获得
 * These selectors provide complex computation logic that cannot be auto-generated
 */
export const videoSelectors = {
  // 基础计算属性选择器 / Basic computed property selectors
  hasCurrentVideo: (state: VideoState) => {
    return state.currentVideo !== null
  },

  currentVideoProgress: (state: VideoState) => {
    const video = state.currentVideo
    if (!video || video.duration === 0) return 0
    return (video.currentTime / video.duration) * 100
  },

  timeRemaining: (state: VideoState) => {
    const video = state.currentVideo
    if (!video) return 0
    return Math.max(0, video.duration - video.currentTime)
  },

  isVideoNearEnd: (state: VideoState) => {
    const video = state.currentVideo
    if (!video || video.duration === 0) return false
    const remaining = video.duration - video.currentTime
    return remaining <= 30 // 剩余30秒以内 / Within 30 seconds remaining
  },

  canSeekForward: (state: VideoState) => {
    const video = state.currentVideo
    if (!video) return false
    return video.currentTime < video.duration - 1
  },

  canSeekBackward: (state: VideoState) => {
    const video = state.currentVideo
    if (!video) return false
    return video.currentTime > 1
  },

  canSeekTo: (state: VideoState, time: number) => {
    const video = state.currentVideo
    if (!video) return false
    return time >= 0 && time <= video.duration
  },

  // 加载状态计算属性 / Loading state computed properties
  hasLoadingError: (state: VideoState) => {
    return !!state.loadingState.error
  },

  loadingDuration: (state: VideoState) => {
    const loading = state.loadingState
    if (!loading.loadingStartTime) return 0
    return Date.now() - loading.loadingStartTime
  },

  // 最近播放计算属性 / Recent plays computed properties
  hasRecentPlays: (state: VideoState) => {
    return state.recentPlays.length > 0
  },

  recentPlaysCount: (state: VideoState) => {
    return state.recentPlays.length
  },

  latestRecentPlay: (state: VideoState) => {
    return state.recentPlays.length > 0 ? state.recentPlays[0] : null
  },

  recentPlaysByDate: (state: VideoState) => {
    return [...state.recentPlays].sort(
      (a, b) => new Date(b.lastPlayedAt).getTime() - new Date(a.lastPlayedAt).getTime()
    )
  },

  // 缓存相关计算属性 / Cache related computed properties
  getCachedPlaybackSettings: (state: VideoState, fileId: string) => {
    return state.playbackSettingsCache[fileId] || null
  },

  getCachedUIConfig: (state: VideoState, fileId: string) => {
    return state.uiConfigCache[fileId] || null
  },

  hasCachedSettings: (state: VideoState, fileId: string) => {
    return fileId in state.playbackSettingsCache
  },

  cacheSize: (state: VideoState) => {
    return {
      playbackSettingsCount: Object.keys(state.playbackSettingsCache).length,
      uiConfigCount: Object.keys(state.uiConfigCache).length,
      totalCacheSize:
        Object.keys(state.playbackSettingsCache).length + Object.keys(state.uiConfigCache).length
    }
  },

  // 格式化选择器 / Formatted selectors
  formattedCurrentTime: (state: VideoState) => {
    const video = state.currentVideo
    if (!video) return '00:00'
    return formatTime(video.currentTime)
  },

  formattedDuration: (state: VideoState) => {
    const video = state.currentVideo
    if (!video) return '00:00'
    return formatTime(video.duration)
  },

  formattedTimeRemaining: (state: VideoState) => {
    const video = state.currentVideo
    if (!video) return '00:00'
    const remaining = Math.max(0, video.duration - video.currentTime)
    return formatTime(remaining)
  },

  formattedProgressText: (state: VideoState) => {
    const video = state.currentVideo
    if (!video) return '00:00 / 00:00'
    return `${formatTime(video.currentTime)} / ${formatTime(video.duration)}`
  },

  formattedVolume: (state: VideoState) => {
    const video = state.currentVideo
    if (!video) return 0
    return Math.round(video.volume * 100)
  },

  formattedPlaybackRate: (state: VideoState) => {
    const video = state.currentVideo
    if (!video) return '1x'
    return `${video.playbackRate}x`
  },

  // 状态组合选择器 / State composite selectors
  videoInfo: (state: VideoState) => {
    const video = state.currentVideo
    if (!video) return null

    return {
      fileId: video.fileId,
      fileName: video.fileName,
      filePath: video.filePath,
      isPlaying: video.isPlaying,
      currentTime: video.currentTime,
      duration: video.duration,
      volume: video.volume,
      playbackRate: video.playbackRate,
      progress: videoSelectors.currentVideoProgress(state),
      timeRemaining: videoSelectors.timeRemaining(state),
      isNearEnd: videoSelectors.isVideoNearEnd(state)
    }
  },

  videoWithProgress: (state: VideoState) => {
    const video = state.currentVideo
    if (!video) return null

    return {
      ...video,
      progress: videoSelectors.currentVideoProgress(state),
      progressText: videoSelectors.formattedProgressText(state),
      formattedTime: videoSelectors.formattedCurrentTime(state),
      formattedDuration: videoSelectors.formattedDuration(state),
      timeRemaining: videoSelectors.formattedTimeRemaining(state),
      isNearEnd: videoSelectors.isVideoNearEnd(state),
      canSeekForward: videoSelectors.canSeekForward(state),
      canSeekBackward: videoSelectors.canSeekBackward(state)
    }
  },

  loadingInfo: (state: VideoState) => {
    const loading = state.loadingState
    return {
      isLoading: loading.isLoading,
      stage: loading.stage,
      progress: loading.progress,
      error: loading.error,
      hasError: videoSelectors.hasLoadingError(state),
      duration: videoSelectors.loadingDuration(state)
    }
  },

  playbackInfo: (state: VideoState) => {
    const video = state.currentVideo
    if (!video) return null

    return {
      fileId: video.fileId,
      fileName: video.fileName,
      isPlaying: video.isPlaying,
      currentTime: video.currentTime,
      duration: video.duration,
      volume: video.volume,
      playbackRate: video.playbackRate,
      progress: videoSelectors.currentVideoProgress(state),
      formattedVolume: videoSelectors.formattedVolume(state),
      formattedPlaybackRate: videoSelectors.formattedPlaybackRate(state)
    }
  },

  recentPlaysInfo: (state: VideoState) => {
    return {
      plays: state.recentPlays,
      count: videoSelectors.recentPlaysCount(state),
      hasPlays: videoSelectors.hasRecentPlays(state),
      latest: videoSelectors.latestRecentPlay(state),
      sortedByDate: videoSelectors.recentPlaysByDate(state)
    }
  },

  cacheInfo: (state: VideoState) => {
    return {
      ...videoSelectors.cacheSize(state),
      playbackSettingsCache: state.playbackSettingsCache,
      uiConfigCache: state.uiConfigCache
    }
  }
}

/**
 * 便捷 Hook 选择器 / Convenient Hook selectors
 * 使用自动生成的选择器和计算属性选择器
 * Uses auto-generated selectors and computed property selectors
 */

// 基础视频状态 Hooks / Basic video state hooks
export const useCurrentVideo = () => videoStore.use.currentVideo()
export const useVideoLoadingState = () => videoStore.use.loadingState()
export const useRecentPlays = () => videoStore.use.recentPlays()
export const usePlaybackSettingsCache = () => videoStore.use.playbackSettingsCache()
export const useUIConfigCache = () => videoStore.use.uiConfigCache()

// 加载状态 Hooks / Loading state hooks
export const useIsVideoLoading = () => videoStore((state) => state.loadingState.isLoading)
export const useVideoLoadingProgress = () => videoStore((state) => state.loadingState.progress)
export const useVideoLoadingError = () => videoStore((state) => state.loadingState.error)
export const useVideoLoadingStage = () => videoStore((state) => state.loadingState.stage)
export const useHasLoadingError = () => videoStore(videoSelectors.hasLoadingError)
export const useLoadingDuration = () => videoStore(videoSelectors.loadingDuration)

// 当前视频属性 Hooks / Current video property hooks
export const useCurrentVideoId = () => videoStore((state) => state.currentVideo?.fileId || null)
export const useCurrentVideoPath = () => videoStore((state) => state.currentVideo?.filePath || null)
export const useCurrentVideoName = () => videoStore((state) => state.currentVideo?.fileName || null)
export const useCurrentVideoDuration = () =>
  videoStore((state) => state.currentVideo?.duration || 0)
export const useCurrentVideoTime = () => videoStore((state) => state.currentVideo?.currentTime || 0)
export const useIsVideoPlaying = () => videoStore((state) => state.currentVideo?.isPlaying || false)
export const useVideoVolume = () => videoStore((state) => state.currentVideo?.volume || 1)
export const useVideoPlaybackRate = () =>
  videoStore((state) => state.currentVideo?.playbackRate || 1)

// 计算属性 Hooks / Computed property hooks
export const useHasCurrentVideo = () => videoStore(videoSelectors.hasCurrentVideo)
export const useVideoProgress = () => videoStore(videoSelectors.currentVideoProgress)
export const useVideoTimeRemaining = () => videoStore(videoSelectors.timeRemaining)
export const useIsVideoNearEnd = () => videoStore(videoSelectors.isVideoNearEnd)
export const useCanSeekForward = () => videoStore(videoSelectors.canSeekForward)
export const useCanSeekBackward = () => videoStore(videoSelectors.canSeekBackward)

// 格式化数据 Hooks / Formatted data hooks
export const useFormattedCurrentTime = () => videoStore(videoSelectors.formattedCurrentTime)
export const useFormattedDuration = () => videoStore(videoSelectors.formattedDuration)
export const useFormattedTimeRemaining = () => videoStore(videoSelectors.formattedTimeRemaining)
export const useVideoProgressText = () => videoStore(videoSelectors.formattedProgressText)
export const useFormattedVideoVolume = () => videoStore(videoSelectors.formattedVolume)
export const useFormattedVideoPlaybackRate = () => videoStore(videoSelectors.formattedPlaybackRate)

// 最近播放 Hooks / Recent plays hooks
export const useRecentPlaysCount = () => videoStore(videoSelectors.recentPlaysCount)
export const useHasRecentPlays = () => videoStore(videoSelectors.hasRecentPlays)
export const useLatestRecentPlay = () => videoStore(videoSelectors.latestRecentPlay)
export const useRecentPlaysByDate = () => videoStore(videoSelectors.recentPlaysByDate)

// 缓存 Hooks / Cache hooks
export const useCacheSize = () => videoStore(videoSelectors.cacheSize)

// 组合数据 Hooks / Composite data hooks
export const useVideoInfo = () => videoStore(videoSelectors.videoInfo)
export const useVideoWithProgress = () => videoStore(videoSelectors.videoWithProgress)
export const useVideoLoadingInfo = () => videoStore(videoSelectors.loadingInfo)
export const useVideoPlaybackInfo = () => videoStore(videoSelectors.playbackInfo)
export const useRecentPlaysInfo = () => videoStore(videoSelectors.recentPlaysInfo)
export const useCacheInfo = () => videoStore(videoSelectors.cacheInfo)

// 参数化 Hooks / Parameterized hooks
export const useCanSeekTo = (time: number) =>
  videoStore((state) => videoSelectors.canSeekTo(state, time))
export const useCachedPlaybackSettings = (fileId: string) =>
  videoStore((state) => videoSelectors.getCachedPlaybackSettings(state, fileId))
export const useCachedUIConfig = (fileId: string) =>
  videoStore((state) => videoSelectors.getCachedUIConfig(state, fileId))
export const useHasCachedSettings = (fileId: string) =>
  videoStore((state) => videoSelectors.hasCachedSettings(state, fileId))
