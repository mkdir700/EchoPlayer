/**
 * 类型工厂函数
 * Type Factory Functions
 *
 * 提供类型安全的对象创建和默认值生成
 * Provides type-safe object creation and default value generation
 */

import {
  VideoInfo,
  VideoFileState,
  VideoPlaybackSettings,
  VideoUIConfig,
  RecentPlayItem,
  VideoFormat,
  VideoResolution
} from '../types/domain/video.types'
import {
  SubtitleItem,
  SubtitleDisplaySettings,
  SubtitleState,
  SubtitleLoadingState,
  SubtitleDisplayMode,
  BackgroundType,
  SubtitleMargins,
  MaskFrame
} from '../types/domain/subtitle.types'
import {
  LoopSettings,
  PlaybackControlSettings,
  PlayerState,
  PlaybackMode,
  SkipSettings
} from '../types/domain/playback.types'
import { UIState, FullscreenState, PageType, ThemeMode } from '../types/domain/ui.types'
import type { OperationResult, LoadingState, ValidationResult } from '../types/shared/common.types'

// 生成唯一ID / Generate Unique ID
const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
}

// 视频相关工厂函数 / Video Related Factory Functions
export const createVideoResolution = (
  width: number = 1920,
  height: number = 1080
): VideoResolution => ({
  width,
  height,
  aspectRatio: width / height
})

export const createVideoInfo = (
  filePath: string,
  fileName: string,
  overrides: Partial<VideoInfo> = {}
): VideoInfo => ({
  id: generateId(),
  filePath,
  fileName,
  fileSize: 0,
  duration: 0,
  format: VideoFormat.MP4,
  resolution: createVideoResolution(),
  frameRate: 30,
  bitRate: 2000,
  createdAt: new Date(),
  modifiedAt: new Date(),
  ...overrides
})

export const createVideoFileState = (
  fileId: string,
  videoFileName: string,
  overrides: Partial<VideoFileState> = {}
): VideoFileState => ({
  fileId,
  videoFile: null,
  videoFileName,
  displayAspectRatio: 16 / 9,
  isLocalFile: true,
  ...overrides
})

export const createLoopSettings = (
  count: number = 0,
  overrides: Partial<LoopSettings> = {}
): LoopSettings => ({
  count,
  ...overrides
})

export const createVideoPlaybackSettings = (
  overrides: Partial<VideoPlaybackSettings> = {}
): VideoPlaybackSettings => ({
  displayMode: SubtitleDisplayMode.BILINGUAL,
  volume: 0.8,
  playbackRate: 1.0,
  isSingleLoop: false,
  loopSettings: createLoopSettings(),
  isAutoPause: false,
  ...overrides
})

export const createVideoUIConfig = (overrides: Partial<VideoUIConfig> = {}): VideoUIConfig => ({
  isSubtitleLayoutLocked: false,
  ...overrides
})

export const createRecentPlayItem = (
  videoInfo: VideoInfo,
  overrides: Partial<RecentPlayItem> = {}
): RecentPlayItem => ({
  videoInfo,
  lastPlayedAt: new Date(),
  lastPosition: 0,
  playCount: 1,
  videoPlaybackSettings: createVideoPlaybackSettings(),
  ...overrides
})

// 字幕相关工厂函数 / Subtitle Related Factory Functions
export const createSubtitleItem = (
  startTime: number,
  endTime: number,
  originalText: string,
  overrides: Partial<SubtitleItem> = {}
): SubtitleItem => ({
  id: generateId(),
  startTime,
  endTime,
  originalText,
  ...overrides
})

export const createSubtitleMargins = (
  overrides: Partial<SubtitleMargins> = {}
): SubtitleMargins => ({
  left: 10,
  top: 10,
  right: 10,
  bottom: 10,
  ...overrides
})

export const createMaskFrame = (overrides: Partial<MaskFrame> = {}): MaskFrame => ({
  left: 0,
  top: 0,
  width: 100,
  height: 100,
  ...overrides
})

export const createSubtitleDisplaySettings = (
  overrides: Partial<SubtitleDisplaySettings> = {}
): SubtitleDisplaySettings => ({
  margins: createSubtitleMargins(),
  backgroundType: BackgroundType.TRANSPARENT,
  isMaskMode: false,
  maskFrame: createMaskFrame(),
  fontSize: 16,
  fontFamily: 'Arial',
  fontColor: '#ffffff',
  backgroundColor: '#000000',
  opacity: 0.8,
  isAutoScrollEnabled: true,
  ...overrides
})

export const createSubtitleLoadingState = (
  overrides: Partial<SubtitleLoadingState> = {}
): SubtitleLoadingState => ({
  isLoading: false,
  error: null,
  progress: 0,
  ...overrides
})

export const createSubtitleState = (
  subtitles: SubtitleItem[] = [],
  overrides: Partial<SubtitleState> = {}
): SubtitleState => ({
  subtitles,
  currentIndex: -1,
  displaySettings: createSubtitleDisplaySettings(),
  loadingState: createSubtitleLoadingState(),
  ...overrides
})

// 播放控制相关工厂函数 / Playback Control Related Factory Functions
export const createSkipSettings = (overrides: Partial<SkipSettings> = {}): SkipSettings => ({
  isEnabled: false,
  skipIntroSeconds: 0,
  skipOutroSeconds: 0,
  skipSilenceEnabled: false,
  silenceThreshold: 0.1,
  ...overrides
})

export const createPlaybackControlSettings = (
  overrides: Partial<PlaybackControlSettings> = {}
): PlaybackControlSettings => ({
  volume: 0.8,
  playbackRate: 1.0,
  isAutoPlay: false,
  isAutoPause: false,
  isSingleLoop: false,
  loopSettings: createLoopSettings(),
  skipSettings: createSkipSettings(),
  mode: PlaybackMode.NORMAL,
  ...overrides
})

export const createPlayerState = (overrides: Partial<PlayerState> = {}): PlayerState => ({
  isPlaying: false,
  isPaused: false,
  isLoading: false,
  isMuted: false,
  hasError: false,
  ...overrides
})

// UI相关工厂函数 / UI Related Factory Functions
export const createFullscreenState = (
  overrides: Partial<FullscreenState> = {}
): FullscreenState => ({
  isFullscreen: false,
  isInFullscreenMode: false,
  canToggleFullscreen: true,
  ...overrides
})

export const createUIState = (overrides: Partial<UIState> = {}): UIState => ({
  fullscreen: createFullscreenState(),
  showPlayPageHeader: true,
  showSubtitleList: true,
  sidebarWidth: 300,
  showControls: true,
  isDragging: false,
  autoResumeAfterWordCard: false,
  currentPage: PageType.HOME,
  theme: ThemeMode.SYSTEM,
  ...overrides
})

// 共享类型工厂函数 / Shared Type Factory Functions
export const createOperationResult = <T>(
  success: boolean,
  data?: T,
  error?: string,
  overrides: Partial<OperationResult<T>> = {}
): OperationResult<T> => ({
  success,
  data,
  error,
  timestamp: new Date(),
  ...overrides
})

export const createSuccessResult = <T>(
  data: T,
  overrides: Partial<OperationResult<T>> = {}
): OperationResult<T> => createOperationResult(true, data, undefined, overrides)

export const createErrorResult = <T>(
  error: string,
  overrides: Partial<OperationResult<T>> = {}
): OperationResult<T> => createOperationResult(false, undefined, error, overrides)

export const createLoadingState = (overrides: Partial<LoadingState> = {}): LoadingState => ({
  isLoading: false,
  progress: 0,
  error: undefined,
  stage: undefined,
  ...overrides
})

export const createValidationResult = (
  isValid: boolean,
  errors: string[] = [],
  warnings: string[] = [],
  overrides: Partial<ValidationResult> = {}
): ValidationResult => ({
  isValid,
  errors,
  warnings,
  ...overrides
})

// 批量创建函数 / Batch Creation Functions
export const createSubtitleItems = (
  items: Array<{
    startTime: number
    endTime: number
    originalText: string
    overrides?: Partial<SubtitleItem>
  }>
): SubtitleItem[] => {
  return items.map(({ startTime, endTime, originalText, overrides }) =>
    createSubtitleItem(startTime, endTime, originalText, overrides)
  )
}

export const createRecentPlayItems = (
  videoInfos: VideoInfo[],
  overrides: Partial<RecentPlayItem> = {}
): RecentPlayItem[] => {
  return videoInfos.map((videoInfo) => createRecentPlayItem(videoInfo, overrides))
}

// 默认值常量 / Default Value Constants
export const DEFAULT_VIDEO_PLAYBACK_SETTINGS = createVideoPlaybackSettings()
export const DEFAULT_SUBTITLE_DISPLAY_SETTINGS = createSubtitleDisplaySettings()
export const DEFAULT_SUBTITLE_LOADING_STATE = createSubtitleLoadingState()
export const DEFAULT_PLAYBACK_CONTROL_SETTINGS = createPlaybackControlSettings()
export const DEFAULT_UI_STATE = createUIState()
export const DEFAULT_PLAYER_STATE = createPlayerState()
export const DEFAULT_LOADING_STATE = createLoadingState()

// 类型克隆函数 / Type Cloning Functions
export const cloneVideoInfo = (videoInfo: VideoInfo): VideoInfo => ({
  ...videoInfo,
  resolution: { ...videoInfo.resolution },
  createdAt: new Date(videoInfo.createdAt),
  modifiedAt: new Date(videoInfo.modifiedAt)
})

export const cloneSubtitleItem = (item: SubtitleItem): SubtitleItem => ({
  ...item
})

export const cloneSubtitleDisplaySettings = (
  settings: SubtitleDisplaySettings
): SubtitleDisplaySettings => ({
  ...settings,
  margins: { ...settings.margins },
  maskFrame: { ...settings.maskFrame }
})

export const cloneVideoPlaybackSettings = (
  settings: VideoPlaybackSettings
): VideoPlaybackSettings => ({
  ...settings,
  loopSettings: { ...settings.loopSettings }
})

// 类型合并函数 / Type Merging Functions
export const mergeVideoPlaybackSettings = (
  base: VideoPlaybackSettings,
  updates: Partial<VideoPlaybackSettings>
): VideoPlaybackSettings => ({
  ...base,
  ...updates,
  loopSettings: updates.loopSettings
    ? { ...base.loopSettings, ...updates.loopSettings }
    : base.loopSettings
})

export const mergeSubtitleDisplaySettings = (
  base: SubtitleDisplaySettings,
  updates: Partial<SubtitleDisplaySettings>
): SubtitleDisplaySettings => ({
  ...base,
  ...updates,
  margins: updates.margins ? { ...base.margins, ...updates.margins } : base.margins,
  maskFrame: updates.maskFrame ? { ...base.maskFrame, ...updates.maskFrame } : base.maskFrame
})
