/**
 * API响应类型定义
 * API Response Type Definitions
 *
 * 定义各种API响应的数据类型
 * Defines data types for various API responses
 */

import type { VideoInfo } from '../domain/video.types'
import type { SubtitleItem } from '../domain/subtitle.types'
import type { SystemInfo, WindowState, UpdateStatus, FFmpegProbeResult } from './ipc.types'
import type { LogEntry } from '../shared/common.types'

// 基础API响应接口 / Base API Response Interface
export interface BaseApiResponse<T = unknown> {
  readonly success: boolean
  readonly data?: T
  readonly error?: string
  readonly code?: string
  readonly timestamp: Date
  readonly requestId?: string
}

// 视频加载响应 / Video Load Response
export interface VideoLoadResponse extends BaseApiResponse<VideoInfo> {
  readonly thumbnail?: string
}

// 视频信息响应 / Video Info Response
export interface VideoInfoResponse extends BaseApiResponse<VideoInfo> {}

// 缩略图生成响应 / Thumbnail Generation Response
export interface ThumbnailGenerationResponse extends BaseApiResponse<string> {
  readonly outputPath: string
  readonly size: number
}

// 字幕加载响应 / Subtitle Load Response
export interface SubtitleLoadResponse extends BaseApiResponse<readonly SubtitleItem[]> {
  readonly encoding: string
  readonly itemCount: number
}

// 字幕解析响应 / Subtitle Parse Response
export interface SubtitleParseResponse extends BaseApiResponse<readonly SubtitleItem[]> {
  readonly format: string
  readonly itemCount: number
}

// 字幕保存响应 / Subtitle Save Response
export interface SubtitleSaveResponse extends BaseApiResponse<void> {
  readonly filePath: string
  readonly itemCount: number
}

// 字幕导出响应 / Subtitle Export Response
export interface SubtitleExportResponse extends BaseApiResponse<void> {
  readonly outputPath: string
  readonly format: string
  readonly itemCount: number
}

// 字幕搜索响应 / Subtitle Search Response
export interface SubtitleSearchResponse extends BaseApiResponse<readonly SubtitleSearchResult[]> {
  readonly query: string
  readonly totalMatches: number
}

// 字幕搜索结果 / Subtitle Search Result
export interface SubtitleSearchResult {
  readonly index: number
  readonly subtitle: SubtitleItem
  readonly matches: readonly {
    readonly field: 'originalText' | 'translatedText' | 'englishText' | 'chineseText'
    readonly text: string
    readonly start: number
    readonly end: number
  }[]
}

// 文件选择响应 / File Select Response
export interface FileSelectResponse extends BaseApiResponse<readonly string[]> {
  readonly canceled: boolean
}

// 文件打开响应 / File Open Response
export interface FileOpenResponse extends BaseApiResponse<string | Buffer> {
  readonly encoding?: string
  readonly size: number
}

// 文件保存响应 / File Save Response
export interface FileSaveResponse extends BaseApiResponse<void> {
  readonly filePath: string
  readonly size: number
}

// 文件删除响应 / File Delete Response
export interface FileDeleteResponse extends BaseApiResponse<void> {
  readonly filePath: string
}

// 文件存在检查响应 / File Exists Response
export interface FileExistsResponse extends BaseApiResponse<boolean> {
  readonly filePath: string
}

// 文件监听响应 / File Watch Response
export interface FileWatchResponse extends BaseApiResponse<string> {
  readonly watcherId: string
}

// 存储获取响应 / Storage Get Response
export interface StorageGetResponse<T = unknown> extends BaseApiResponse<T> {
  readonly key: string
}

// 存储设置响应 / Storage Set Response
export interface StorageSetResponse extends BaseApiResponse<void> {
  readonly key: string
}

// 存储删除响应 / Storage Delete Response
export interface StorageDeleteResponse extends BaseApiResponse<boolean> {
  readonly key: string
}

// 存储清空响应 / Storage Clear Response
export interface StorageClearResponse extends BaseApiResponse<void> {
  readonly clearedCount: number
}

// 存储键列表响应 / Storage Keys Response
export interface StorageKeysResponse extends BaseApiResponse<readonly string[]> {
  readonly count: number
}

// 存储大小响应 / Storage Size Response
export interface StorageSizeResponse extends BaseApiResponse<number> {}

// 存储备份响应 / Storage Backup Response
export interface StorageBackupResponse extends BaseApiResponse<string> {
  readonly backupPath: string
  readonly size: number
  readonly itemCount: number
}

// 存储恢复响应 / Storage Restore Response
export interface StorageRestoreResponse extends BaseApiResponse<void> {
  readonly restoredCount: number
}

// 系统信息响应 / System Info Response
export interface SystemInfoResponse extends BaseApiResponse<SystemInfo> {}

// 消息框响应 / Message Box Response
export interface MessageBoxResponse extends BaseApiResponse<number> {
  readonly checkboxChecked?: boolean
}

// 通知响应 / Notification Response
export interface NotificationResponse extends BaseApiResponse<void> {
  readonly notificationId: string
}

// 系统路径响应 / System Path Response
export interface SystemPathResponse extends BaseApiResponse<string> {
  readonly path: string
}

// 窗口状态响应 / Window State Response
export interface WindowStateResponse extends BaseApiResponse<WindowState> {}

// 窗口操作响应 / Window Operation Response
export interface WindowOperationResponse extends BaseApiResponse<void> {}

// 应用配置获取响应 / App Config Get Response
export interface AppConfigGetResponse<T = unknown> extends BaseApiResponse<T> {
  readonly key?: string
}

// 应用配置设置响应 / App Config Set Response
export interface AppConfigSetResponse extends BaseApiResponse<void> {
  readonly key: string
}

// 应用配置重置响应 / App Config Reset Response
export interface AppConfigResetResponse extends BaseApiResponse<void> {
  readonly resetCount: number
}

// 更新检查响应 / Update Check Response
export interface UpdateCheckResponse extends BaseApiResponse<UpdateStatus> {}

// 更新下载响应 / Update Download Response
export interface UpdateDownloadResponse extends BaseApiResponse<void> {
  readonly downloadPath: string
  readonly size: number
}

// 更新安装响应 / Update Install Response
export interface UpdateInstallResponse extends BaseApiResponse<void> {}

// 更新状态响应 / Update Status Response
export interface UpdateStatusResponse extends BaseApiResponse<UpdateStatus> {}

// 日志写入响应 / Log Write Response
export interface LogWriteResponse extends BaseApiResponse<void> {}

// 日志获取响应 / Log Get Response
export interface LogGetResponse extends BaseApiResponse<readonly LogEntry[]> {
  readonly total: number
  readonly limit: number
  readonly offset: number
}

// 日志清空响应 / Log Clear Response
export interface LogClearResponse extends BaseApiResponse<void> {
  readonly clearedCount: number
}

// FFmpeg探测响应 / FFmpeg Probe Response
export interface FFmpegProbeResponse extends BaseApiResponse<FFmpegProbeResult> {}

// FFmpeg转码响应 / FFmpeg Transcode Response
export interface FFmpegTranscodeResponse extends BaseApiResponse<void> {
  readonly outputPath: string
  readonly duration: number
  readonly size: number
}

// FFmpeg音频提取响应 / FFmpeg Extract Audio Response
export interface FFmpegExtractAudioResponse extends BaseApiResponse<void> {
  readonly outputPath: string
  readonly duration: number
  readonly size: number
}

// FFmpeg缩略图生成响应 / FFmpeg Generate Thumbnail Response
export interface FFmpegGenerateThumbnailResponse extends BaseApiResponse<void> {
  readonly outputPath: string
  readonly size: number
}

// 最近播放项列表响应 / Recent Play Items Response
export interface RecentPlayItemsResponse extends BaseApiResponse<readonly RecentPlayItem[]> {
  readonly total: number
}

// 最近播放项添加响应 / Recent Play Item Add Response
export interface RecentPlayItemAddResponse extends BaseApiResponse<void> {
  readonly fileId: string
}

// 最近播放项更新响应 / Recent Play Item Update Response
export interface RecentPlayItemUpdateResponse extends BaseApiResponse<void> {
  readonly fileId: string
}

// 最近播放项删除响应 / Recent Play Item Remove Response
export interface RecentPlayItemRemoveResponse extends BaseApiResponse<void> {
  readonly fileId: string
}

// 最近播放项清空响应 / Recent Play Items Clear Response
export interface RecentPlayItemsClearResponse extends BaseApiResponse<void> {
  readonly removedCount: number
}

// 最近播放项搜索响应 / Recent Play Items Search Response
export interface RecentPlayItemsSearchResponse extends BaseApiResponse<readonly RecentPlayItem[]> {
  readonly query: string
  readonly total: number
}

// 最近播放项批量删除响应 / Recent Play Items Batch Remove Response
export interface RecentPlayItemsBatchRemoveResponse extends BaseApiResponse<void> {
  readonly removedCount: number
  readonly failedIds: readonly string[]
}

// 播放设置更新响应 / Playback Settings Update Response
export interface PlaybackSettingsUpdateResponse extends BaseApiResponse<void> {
  readonly fileId: string
}

// 字幕显示设置更新响应 / Subtitle Display Settings Update Response
export interface SubtitleDisplaySettingsUpdateResponse extends BaseApiResponse<void> {
  readonly fileId: string
}

// 进度事件响应 / Progress Event Response
export interface ProgressEventResponse {
  readonly type: 'progress'
  readonly operation: string
  readonly progress: number // 0-100
  readonly message?: string
  readonly data?: unknown
}

// 错误事件响应 / Error Event Response
export interface ErrorEventResponse {
  readonly type: 'error'
  readonly operation: string
  readonly error: string
  readonly code?: string
  readonly data?: unknown
}

// 完成事件响应 / Complete Event Response
export interface CompleteEventResponse {
  readonly type: 'complete'
  readonly operation: string
  readonly result: unknown
  readonly duration: number
}

// 导入依赖类型 / Import dependent types
import type { RecentPlayItem } from '../domain/video.types'

// 事件响应联合类型 / Event Response Union Type
export type EventResponse = ProgressEventResponse | ErrorEventResponse | CompleteEventResponse
