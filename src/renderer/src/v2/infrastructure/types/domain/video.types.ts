/**
 * 视频领域类型定义
 * Video Domain Type Definitions
 *
 * 基于现有 EchoLab 项目的视频管理功能设计
 * Based on existing EchoLab project's video management features
 */

// 视频格式枚举 / Video Format Enum
export enum VideoFormat {
  MP4 = 'mp4',
  AVI = 'avi',
  MKV = 'mkv',
  MOV = 'mov',
  WMV = 'wmv',
  FLV = 'flv',
  WEBM = 'webm'
}

// 视频分辨率接口 / Video Resolution Interface
export interface VideoResolution {
  readonly width: number
  readonly height: number
  readonly aspectRatio: number
}

// 基础视频信息接口 / Basic Video Info Interface
export interface VideoInfo {
  readonly id: string
  readonly filePath: string
  readonly fileName: string
  readonly fileSize: number
  readonly duration: number
  readonly format: VideoFormat
  readonly resolution: VideoResolution
  readonly frameRate: number
  readonly bitRate: number
  readonly createdAt: Date
  readonly modifiedAt: Date
  readonly thumbnail?: string
}

// 视频文件状态接口 / Video File State Interface
export interface VideoFileState {
  readonly fileId: string
  readonly videoFile: string | null
  readonly videoFileName: string
  readonly displayAspectRatio: number
  readonly originalFilePath?: string
  readonly isLocalFile: boolean
}

// 视频播放状态接口 / Video Playback State Interface
export interface VideoPlaybackState {
  readonly currentTime: number
  readonly duration: number
  readonly isPlaying: boolean
  readonly isPaused: boolean
  readonly isLoading: boolean
  readonly volume: number
  readonly playbackRate: number
  readonly isMuted: boolean
  readonly buffered: TimeRanges | null
  readonly seekable: TimeRanges | null
}

// 视频加载状态接口 / Video Loading State Interface
export interface VideoLoadingState {
  readonly isLoading: boolean
  readonly progress: number
  readonly error: string | null
  readonly stage: VideoLoadingStage
}

// 视频加载阶段枚举 / Video Loading Stage Enum
export enum VideoLoadingStage {
  IDLE = 'idle',
  LOADING_METADATA = 'loading_metadata',
  LOADING_VIDEO = 'loading_video',
  PROCESSING_THUMBNAIL = 'processing_thumbnail',
  READY = 'ready',
  ERROR = 'error'
}

// 最近播放项接口 / Recent Play Item Interface
export interface RecentPlayItem {
  readonly videoInfo: VideoInfo
  readonly lastPlayedAt: Date
  readonly lastPosition: number
  readonly playCount: number
  readonly thumbnail?: string
  readonly subtitleFile?: string
  readonly videoPlaybackSettings: VideoPlaybackSettings
  readonly videoUIConfig?: VideoUIConfig
}

// 视频播放设置接口 / Video Playback Settings Interface
export interface VideoPlaybackSettings {
  readonly displayMode: SubtitleDisplayMode
  readonly volume: number
  readonly playbackRate: number
  readonly isSingleLoop: boolean
  readonly loopSettings: LoopSettings
  readonly isAutoPause: boolean
  readonly subtitleDisplay?: SubtitleDisplaySettings
}

// 视频UI配置接口 / Video UI Config Interface
export interface VideoUIConfig {
  readonly isSubtitleLayoutLocked: boolean
}

// 播放速度预设 / Playback Rate Presets
export const PLAYBACK_RATES = [0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0] as const
export type PlaybackRate = (typeof PLAYBACK_RATES)[number]

// 导入依赖类型（避免循环依赖）/ Import dependent types (avoid circular dependency)
import type { SubtitleDisplayMode, SubtitleDisplaySettings } from './subtitle.types'
import type { LoopSettings } from './playback.types'
