/**
 * API请求类型定义
 * API Request Type Definitions
 *
 * 定义各种API请求的参数类型
 * Defines parameter types for various API requests
 */

import type { VideoPlaybackSettings, VideoUIConfig } from '../domain/video.types'
import type { SubtitleItem, SubtitleDisplaySettings } from '../domain/subtitle.types'
import type {
  FileDialogOptions,
  MessageBoxOptions,
  NotificationOptions,
  FFmpegTranscodeOptions,
  AppPathType
} from './ipc.types'

// 视频加载请求参数 / Video Load Request Parameters
export interface VideoLoadRequest {
  readonly filePath: string
  readonly generateThumbnail?: boolean
  readonly extractMetadata?: boolean
}

// 视频信息获取请求参数 / Video Info Request Parameters
export interface VideoInfoRequest {
  readonly filePath: string
  readonly includeStreams?: boolean
  readonly includeMetadata?: boolean
}

// 缩略图生成请求参数 / Thumbnail Generation Request Parameters
export interface ThumbnailGenerationRequest {
  readonly videoPath: string
  readonly outputPath?: string
  readonly timestamp?: number // 截图时间点（秒）
  readonly width?: number
  readonly height?: number
  readonly quality?: number
}

// 字幕加载请求参数 / Subtitle Load Request Parameters
export interface SubtitleLoadRequest {
  readonly filePath: string
  readonly encoding?: string
  readonly language?: string
}

// 字幕解析请求参数 / Subtitle Parse Request Parameters
export interface SubtitleParseRequest {
  readonly content: string
  readonly format: string
  readonly encoding?: string
}

// 字幕保存请求参数 / Subtitle Save Request Parameters
export interface SubtitleSaveRequest {
  readonly filePath: string
  readonly subtitles: readonly SubtitleItem[]
  readonly format: string
  readonly encoding?: string
}

// 字幕导出请求参数 / Subtitle Export Request Parameters
export interface SubtitleExportRequest {
  readonly subtitles: readonly SubtitleItem[]
  readonly format: string
  readonly outputPath: string
  readonly options?: {
    readonly includeTimestamps?: boolean
    readonly includeOriginalText?: boolean
    readonly includeTranslation?: boolean
    readonly encoding?: string
  }
}

// 字幕搜索请求参数 / Subtitle Search Request Parameters
export interface SubtitleSearchRequest {
  readonly subtitles: readonly SubtitleItem[]
  readonly query: string
  readonly options?: {
    readonly caseSensitive?: boolean
    readonly wholeWord?: boolean
    readonly useRegex?: boolean
    readonly searchInOriginal?: boolean
    readonly searchInTranslation?: boolean
  }
}

// 文件选择请求参数 / File Select Request Parameters
export interface FileSelectRequest {
  readonly options: FileDialogOptions
  readonly multiple?: boolean
}

// 文件打开请求参数 / File Open Request Parameters
export interface FileOpenRequest {
  readonly filePath: string
  readonly encoding?: string
  readonly mode?: 'read' | 'write' | 'append'
}

// 文件保存请求参数 / File Save Request Parameters
export interface FileSaveRequest {
  readonly filePath: string
  readonly content: string | Buffer
  readonly encoding?: string
  readonly createDirectories?: boolean
}

// 文件删除请求参数 / File Delete Request Parameters
export interface FileDeleteRequest {
  readonly filePath: string
  readonly moveToTrash?: boolean
}

// 文件监听请求参数 / File Watch Request Parameters
export interface FileWatchRequest {
  readonly filePath: string
  readonly options?: {
    readonly recursive?: boolean
    readonly ignoreInitial?: boolean
    readonly followSymlinks?: boolean
    readonly ignored?: string | RegExp | readonly (string | RegExp)[]
  }
}

// 存储获取请求参数 / Storage Get Request Parameters
export interface StorageGetRequest {
  readonly key: string
  readonly defaultValue?: unknown
}

// 存储设置请求参数 / Storage Set Request Parameters
export interface StorageSetRequest {
  readonly key: string
  readonly value: unknown
  readonly ttl?: number
}

// 存储删除请求参数 / Storage Delete Request Parameters
export interface StorageDeleteRequest {
  readonly key: string
}

// 存储键列表请求参数 / Storage Keys Request Parameters
export interface StorageKeysRequest {
  readonly pattern?: string | RegExp
}

// 存储备份请求参数 / Storage Backup Request Parameters
export interface StorageBackupRequest {
  readonly outputPath?: string
  readonly compression?: boolean
  readonly encryption?: boolean
}

// 存储恢复请求参数 / Storage Restore Request Parameters
export interface StorageRestoreRequest {
  readonly backupPath: string
  readonly overwrite?: boolean
}

// 消息框显示请求参数 / Message Box Show Request Parameters
export interface MessageBoxShowRequest {
  readonly options: MessageBoxOptions
}

// 通知显示请求参数 / Notification Show Request Parameters
export interface NotificationShowRequest {
  readonly options: NotificationOptions
}

// 系统路径获取请求参数 / System Path Get Request Parameters
export interface SystemPathGetRequest {
  readonly type: AppPathType
}

// 窗口大小设置请求参数 / Window Size Set Request Parameters
export interface WindowSizeSetRequest {
  readonly width: number
  readonly height: number
  readonly animate?: boolean
}

// 窗口位置设置请求参数 / Window Position Set Request Parameters
export interface WindowPositionSetRequest {
  readonly x: number
  readonly y: number
  readonly animate?: boolean
}

// 应用配置获取请求参数 / App Config Get Request Parameters
export interface AppConfigGetRequest {
  readonly key?: string
  readonly defaultValue?: unknown
}

// 应用配置设置请求参数 / App Config Set Request Parameters
export interface AppConfigSetRequest {
  readonly key: string
  readonly value: unknown
}

// 更新检查请求参数 / Update Check Request Parameters
export interface UpdateCheckRequest {
  readonly force?: boolean
  readonly silent?: boolean
}

// 日志写入请求参数 / Log Write Request Parameters
export interface LogWriteRequest {
  readonly level: 'debug' | 'info' | 'warn' | 'error'
  readonly message: string
  readonly data?: unknown
  readonly source?: string
}

// 日志获取请求参数 / Log Get Request Parameters
export interface LogGetRequest {
  readonly level?: 'debug' | 'info' | 'warn' | 'error'
  readonly limit?: number
  readonly offset?: number
  readonly startDate?: Date
  readonly endDate?: Date
  readonly source?: string
}

// FFmpeg探测请求参数 / FFmpeg Probe Request Parameters
export interface FFmpegProbeRequest {
  readonly filePath: string
  readonly options?: {
    readonly showStreams?: boolean
    readonly showFormat?: boolean
    readonly showChapters?: boolean
    readonly showPrograms?: boolean
  }
}

// FFmpeg转码请求参数 / FFmpeg Transcode Request Parameters
export interface FFmpegTranscodeRequest {
  readonly options: FFmpegTranscodeOptions
  readonly onProgress?: (progress: number) => void
}

// FFmpeg音频提取请求参数 / FFmpeg Extract Audio Request Parameters
export interface FFmpegExtractAudioRequest {
  readonly inputPath: string
  readonly outputPath: string
  readonly format?: 'mp3' | 'wav' | 'aac' | 'flac'
  readonly quality?: number
  readonly startTime?: number
  readonly duration?: number
}

// 最近播放项添加请求参数 / Recent Play Item Add Request Parameters
export interface RecentPlayItemAddRequest {
  readonly filePath: string
  readonly fileName: string
  readonly duration?: number
  readonly currentTime?: number
  readonly subtitleFile?: string
  readonly subtitleItems?: readonly SubtitleItem[]
  readonly videoPlaybackSettings: VideoPlaybackSettings
  readonly videoUIConfig?: VideoUIConfig
}

// 最近播放项更新请求参数 / Recent Play Item Update Request Parameters
export interface RecentPlayItemUpdateRequest {
  readonly fileId: string
  readonly updates: {
    readonly currentTime?: number
    readonly duration?: number
    readonly subtitleFile?: string
    readonly subtitleItems?: readonly SubtitleItem[]
    readonly videoPlaybackSettings?: Partial<VideoPlaybackSettings>
    readonly videoUIConfig?: Partial<VideoUIConfig>
  }
}

// 最近播放项搜索请求参数 / Recent Play Item Search Request Parameters
export interface RecentPlayItemSearchRequest {
  readonly query: string
  readonly limit?: number
  readonly offset?: number
}

// 播放设置更新请求参数 / Playback Settings Update Request Parameters
export interface PlaybackSettingsUpdateRequest {
  readonly fileId: string
  readonly settings: Partial<VideoPlaybackSettings>
}

// 字幕显示设置更新请求参数 / Subtitle Display Settings Update Request Parameters
export interface SubtitleDisplaySettingsUpdateRequest {
  readonly fileId: string
  readonly settings: Partial<SubtitleDisplaySettings>
}
