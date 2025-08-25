// 共享类型定义文件 - 供主进程和渲染进程共同使用

// 导入electron-updater的UpdateInfo类型
import { UpdateInfo } from 'electron-updater'
import { RecentPlayItem } from './domain'

// 标题栏覆盖选项 / Title bar overlay options
export interface TitleBarOverlayOptions {
  color?: string
  symbolColor?: string
  height?: number
}

// 主题自定义配置接口 / Theme customization configuration interface
export interface ThemeCustomization {
  // 基础颜色 / Basic colors
  colorPrimary: string
  colorSuccess: string
  colorWarning: string
  colorError: string
  // 布局设置 / Layout settings
  borderRadius: number
  fontSize: number
  // 主题模式 / Theme mode
  algorithm: 'default' | 'dark' | 'compact' | 'darkCompact'
}

// 更新通知配置接口 / Update notification configuration interface
export interface UpdateNotificationConfig {
  currentVersion?: string // 当前版本 / Current version
  latestVersion?: string | null // 最新版本 / Latest version
  lastChecked?: number | null // 上次检查时间 / Last checked time
  lastSeenVersion?: string | null // 上次查看的版本 / Last seen version
  skippedVersions?: string[] // 跳过的版本列表 / List of skipped versions
  autoCheckEnabled?: boolean // 是否启用自动检查 / Whether auto check is enabled
  checkInterval?: number // 检查间隔(毫秒) / Check interval in milliseconds
}

// 应用配置接口 / Application configuration interface
export interface AppConfig {
  useWindowFrame?: boolean // 是否使用系统窗口框架 / Whether to use system window frame
  appTheme?: 'system' | 'light' | 'dark' // 应用主题 / Application theme
  autoCheckUpdates?: boolean // 是否自动检查更新 / Whether to auto check updates
  language?: 'zh-CN' | 'en-US' // 应用语言 / Application language
  dataDirectory: string // 数据存储目录 / Data storage directory (required)
  themeCustomization: ThemeCustomization // 主题自定义配置 / Theme customization configuration
  updateNotification?: UpdateNotificationConfig // 更新通知配置 / Update notification configuration
}

// 字幕项接口
export interface SubtitleItem {
  startTime: number
  endTime: number
  text: string
  englishText?: string
  chineseText?: string
}

// 背景颜色类型
export type BackgroundType = 'transparent' | 'blur' | 'solid-black' | 'solid-gray'

// 字幕边距配置
export interface SubtitleMargins {
  left: number
  top: number
  right: number
  bottom: number
}

// 掩码框配置
export interface MaskFrame {
  left: number
  top: number
  width: number
  height: number
}

// 字幕显示配置
export interface SubtitleDisplaySettings {
  margins: SubtitleMargins
  backgroundType: BackgroundType
  isMaskMode: boolean
  maskFrame: MaskFrame
}

// 循环设置接口 / Loop settings interface
export interface LoopSettings {
  count: number // 循环次数：-1=无限循环，2-50=指定次数循环 / Loop count: -1=infinite loop, 2-50=specific count loop
}

// 视频级别的播放设置接口
export interface VideoPlaybackSettings {
  displayMode: 'none' | 'original' | 'chinese' | 'english' | 'bilingual' // 字幕显示模式
  volume: number // 音量设置
  playbackRate: number // 播放速度
  isSingleLoop: boolean // 单句循环（保持向后兼容）
  loopSettings: LoopSettings // 新的循环设置
  isAutoPause: boolean // 自动暂停
  subtitleDisplay?: SubtitleDisplaySettings // 字幕显示配置
}

// 视频级别的UI配置接口 - Video-level UI configuration interface
export interface VideoUIConfig {
  isSubtitleLayoutLocked: boolean // 字幕布局锁定状态 / Subtitle layout lock state
}

// 全局播放设置接口（保持向后兼容）， 和单视频的配置区分开的
// 如果单视频的配置不存在则使用全局配置
export interface GlobalPlaybackSettings {
  displayMode: 'none' | 'original' | 'chinese' | 'english' | 'bilingual' // 字幕显示模式
  volume: number // 音量
  playbackRate: number // 播放速度
  isSingleLoop: boolean // 单句循环（保持向后兼容）
  loopSettings: LoopSettings // 新的循环设置
  isAutoPause: boolean // 自动暂停
}

// 更新状态接口
export interface UpdateStatus {
  status: 'checking' | 'available' | 'not-available' | 'downloading' | 'downloaded' | 'error'
  info?: UpdateInfo
  error?: string
  progress?: {
    bytesPerSecond?: number
    percent?: number
    total?: number
    transferred?: number
  }
}

// 更新设置接口
export interface UpdateSettings {
  autoUpdate: boolean // 是否自动检查更新
  lastChecked?: number // 上次检查时间
  updateChannel?: 'stable' | 'beta' | 'alpha' // 更新渠道
}

// 存储设置接口
export interface StoreSettings {
  maxRecentItems: number
  playback: GlobalPlaybackSettings // 播放设置
  update: UpdateSettings // 更新设置
  app?: AppConfig // 应用配置 / Application configuration
}

// 存储结构接口
export interface StoreSchema {
  recentPlays: RecentPlayItem[]
  settings: StoreSettings
  appConfig?: AppConfig // 单独的应用配置存储 / Separate application configuration storage
}

// API 响应类型
export interface ApiResponse {
  success: boolean
  error?: string
  fileId?: string
}

export interface ApiResponseWithCount extends ApiResponse {
  removedCount: number
}

// Store API 接口定义
export interface StoreAPI {
  getRecentPlays: () => Promise<RecentPlayItem[]>
  addRecentPlay: (item: Omit<RecentPlayItem, 'id' | 'lastOpenedAt'>) => Promise<ApiResponse>
  updateRecentPlay: (
    id: string,
    updates: Partial<Omit<RecentPlayItem, 'id'>>
  ) => Promise<ApiResponse>
  removeRecentPlay: (id: string) => Promise<ApiResponse>
  clearRecentPlays: () => Promise<ApiResponse>
  getRecentPlayByPath: (filePath: string) => Promise<RecentPlayItem | null>
  getSettings: () => Promise<StoreSettings>
  updateSettings: (settings: Partial<StoreSettings>) => Promise<ApiResponse>
  removeMultipleRecentPlays: (ids: string[]) => Promise<ApiResponseWithCount>
  searchRecentPlays: (query: string) => Promise<RecentPlayItem[]>
}

export interface UpdateInfoResponse {
  status: 'available' | 'not-available' | 'error'
  info?: UpdateInfo
  error?: string
}

// FFmpeg 相关接口 / FFmpeg related interfaces

// 转码进度接口 / Transcoding progress interface
export interface TranscodeProgress {
  progress: number // 0-100
  time: string
  speed: string
  fps: string
  bitrate: string
  eta?: string
}

// 转码选项接口 / Transcoding options interface
export interface TranscodeOptions {
  videoCodec?: 'libx264' | 'libx265' | 'copy'
  audioCodec?: 'aac' | 'ac3' | 'copy'
  videoBitrate?: string
  audioBitrate?: string
  crf?: number
  preset?:
    | 'ultrafast'
    | 'superfast'
    | 'veryfast'
    | 'faster'
    | 'fast'
    | 'medium'
    | 'slow'
    | 'slower'
    | 'veryslow'
  outputFormat?: 'mp4' | 'mkv' | 'webm'
}

// 视频信息接口 / Video info interface
export interface VideoInfo {
  duration: number
  videoCodec: string
  audioCodec: string
  resolution: string
  bitrate: string
}
