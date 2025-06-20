/**
 * 类型守卫工具函数
 * Type Guard Utility Functions
 *
 * 提供运行时类型检查和验证功能
 * Provides runtime type checking and validation functionality
 */

import type {
  VideoInfo,
  VideoFileState,
  VideoPlaybackSettings,
  RecentPlayItem
} from '../types/domain/video.types'
import type {
  SubtitleItem,
  SubtitleDisplaySettings,
  SubtitleState
} from '../types/domain/subtitle.types'
import type {
  LoopSettings,
  PlaybackControlSettings,
  PlayerState
} from '../types/domain/playback.types'
import type { UIState, FullscreenState } from '../types/domain/ui.types'

// 基础类型守卫 / Basic Type Guards
export const isString = (value: unknown): value is string => typeof value === 'string'
export const isNumber = (value: unknown): value is number =>
  typeof value === 'number' && !isNaN(value)
export const isBoolean = (value: unknown): value is boolean => typeof value === 'boolean'
export const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
export const isArray = (value: unknown): value is unknown[] => Array.isArray(value)
export const isDate = (value: unknown): value is Date =>
  value instanceof Date && !isNaN(value.getTime())

// 视频相关类型守卫 / Video Related Type Guards
export const isVideoInfo = (value: unknown): value is VideoInfo => {
  if (!isObject(value)) return false

  const obj = value as Record<string, unknown>
  return (
    isString(obj.id) &&
    isString(obj.filePath) &&
    isString(obj.fileName) &&
    isNumber(obj.fileSize) &&
    isNumber(obj.duration) &&
    isString(obj.format) &&
    isObject(obj.resolution) &&
    isNumber(obj.frameRate) &&
    isNumber(obj.bitRate) &&
    isDate(obj.createdAt) &&
    isDate(obj.modifiedAt)
  )
}

export const isVideoFileState = (value: unknown): value is VideoFileState => {
  if (!isObject(value)) return false

  const obj = value as Record<string, unknown>
  return (
    isString(obj.fileId) &&
    (obj.videoFile === null || isString(obj.videoFile)) &&
    isString(obj.videoFileName) &&
    isNumber(obj.displayAspectRatio) &&
    isBoolean(obj.isLocalFile)
  )
}

export const isVideoPlaybackSettings = (value: unknown): value is VideoPlaybackSettings => {
  if (!isObject(value)) return false

  const obj = value as Record<string, unknown>
  return (
    isString(obj.displayMode) &&
    isNumber(obj.volume) &&
    isNumber(obj.playbackRate) &&
    isBoolean(obj.isSingleLoop) &&
    isObject(obj.loopSettings) &&
    isBoolean(obj.isAutoPause)
  )
}

export const isRecentPlayItem = (value: unknown): value is RecentPlayItem => {
  if (!isObject(value)) return false

  const obj = value as Record<string, unknown>
  return (
    isVideoInfo(obj.videoInfo) &&
    isDate(obj.lastPlayedAt) &&
    isNumber(obj.lastPosition) &&
    isNumber(obj.playCount) &&
    isVideoPlaybackSettings(obj.videoPlaybackSettings)
  )
}

// 字幕相关类型守卫 / Subtitle Related Type Guards
export const isSubtitleItem = (value: unknown): value is SubtitleItem => {
  if (!isObject(value)) return false

  const obj = value as Record<string, unknown>
  return (
    isString(obj.id) &&
    isNumber(obj.startTime) &&
    isNumber(obj.endTime) &&
    isString(obj.originalText) &&
    obj.startTime <= obj.endTime
  )
}

export const isSubtitleDisplaySettings = (value: unknown): value is SubtitleDisplaySettings => {
  if (!isObject(value)) return false

  const obj = value as Record<string, unknown>
  return (
    isObject(obj.margins) &&
    isString(obj.backgroundType) &&
    isBoolean(obj.isMaskMode) &&
    isObject(obj.maskFrame)
  )
}

export const isSubtitleState = (value: unknown): value is SubtitleState => {
  if (!isObject(value)) return false

  const obj = value as Record<string, unknown>
  return (
    isArray(obj.subtitles) &&
    (obj.subtitles as unknown[]).every(isSubtitleItem) &&
    isNumber(obj.currentIndex) &&
    isSubtitleDisplaySettings(obj.displaySettings) &&
    isObject(obj.loadingState)
  )
}

// 播放控制相关类型守卫 / Playback Control Related Type Guards
export const isLoopSettings = (value: unknown): value is LoopSettings => {
  if (!isObject(value)) return false

  const obj = value as Record<string, unknown>
  return (
    isNumber(obj.count) &&
    obj.count >= -1 && // -1 表示无限循环
    (obj.startTime === undefined || isNumber(obj.startTime)) &&
    (obj.endTime === undefined || isNumber(obj.endTime))
  )
}

export const isPlaybackControlSettings = (value: unknown): value is PlaybackControlSettings => {
  if (!isObject(value)) return false

  const obj = value as Record<string, unknown>
  return (
    isNumber(obj.volume) &&
    obj.volume >= 0 &&
    obj.volume <= 1 &&
    isNumber(obj.playbackRate) &&
    obj.playbackRate > 0 &&
    isBoolean(obj.isAutoPlay) &&
    isBoolean(obj.isAutoPause) &&
    isBoolean(obj.isSingleLoop) &&
    isLoopSettings(obj.loopSettings) &&
    isObject(obj.skipSettings) &&
    isString(obj.mode)
  )
}

export const isPlayerState = (value: unknown): value is PlayerState => {
  if (!isObject(value)) return false

  const obj = value as Record<string, unknown>
  return (
    isBoolean(obj.isPlaying) &&
    isBoolean(obj.isPaused) &&
    isBoolean(obj.isLoading) &&
    isBoolean(obj.isMuted) &&
    isBoolean(obj.hasError)
  )
}

// UI相关类型守卫 / UI Related Type Guards
export const isFullscreenState = (value: unknown): value is FullscreenState => {
  if (!isObject(value)) return false

  const obj = value as Record<string, unknown>
  return (
    isBoolean(obj.isFullscreen) &&
    isBoolean(obj.isInFullscreenMode) &&
    isBoolean(obj.canToggleFullscreen)
  )
}

export const isUIState = (value: unknown): value is UIState => {
  if (!isObject(value)) return false

  const obj = value as Record<string, unknown>
  return (
    isFullscreenState(obj.fullscreen) &&
    isBoolean(obj.showPlayPageHeader) &&
    isBoolean(obj.showSubtitleList) &&
    isNumber(obj.sidebarWidth) &&
    isBoolean(obj.showControls) &&
    isBoolean(obj.isDragging) &&
    isBoolean(obj.autoResumeAfterWordCard) &&
    isString(obj.currentPage) &&
    isString(obj.theme)
  )
}

// 数组类型守卫 / Array Type Guards
export const isSubtitleItemArray = (value: unknown): value is SubtitleItem[] => {
  return isArray(value) && value.every(isSubtitleItem)
}

export const isRecentPlayItemArray = (value: unknown): value is RecentPlayItem[] => {
  return isArray(value) && value.every(isRecentPlayItem)
}

// 复合类型验证 / Composite Type Validation
export const validateVideoData = (value: unknown): { isValid: boolean; errors: string[] } => {
  const errors: string[] = []

  if (!isObject(value)) {
    errors.push('Value must be an object')
    return { isValid: false, errors }
  }

  const obj = value as Record<string, unknown>

  if (!isVideoInfo(obj.videoInfo)) {
    errors.push('Invalid videoInfo structure')
  }

  if (!isVideoFileState(obj.videoFileState)) {
    errors.push('Invalid videoFileState structure')
  }

  if (!isVideoPlaybackSettings(obj.videoPlaybackSettings)) {
    errors.push('Invalid videoPlaybackSettings structure')
  }

  return { isValid: errors.length === 0, errors }
}

export const validateSubtitleData = (value: unknown): { isValid: boolean; errors: string[] } => {
  const errors: string[] = []

  if (!isObject(value)) {
    errors.push('Value must be an object')
    return { isValid: false, errors }
  }

  const obj = value as Record<string, unknown>

  if (!isSubtitleItemArray(obj.subtitles)) {
    errors.push('Invalid subtitles array')
  }

  if (!isSubtitleDisplaySettings(obj.displaySettings)) {
    errors.push('Invalid displaySettings structure')
  }

  return { isValid: errors.length === 0, errors }
}

// 类型断言助手 / Type Assertion Helpers
export const assertVideoInfo = (value: unknown): VideoInfo => {
  if (!isVideoInfo(value)) {
    throw new Error('Invalid VideoInfo structure')
  }
  return value
}

export const assertSubtitleItem = (value: unknown): SubtitleItem => {
  if (!isSubtitleItem(value)) {
    throw new Error('Invalid SubtitleItem structure')
  }
  return value
}

export const assertLoopSettings = (value: unknown): LoopSettings => {
  if (!isLoopSettings(value)) {
    throw new Error('Invalid LoopSettings structure')
  }
  return value
}
