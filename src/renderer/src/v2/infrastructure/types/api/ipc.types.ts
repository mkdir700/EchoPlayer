/**
 * IPC通信类型定义
 * IPC Communication Type Definitions
 *
 * 基于现有 EchoLab 项目的 Electron IPC 通信设计
 * Based on existing EchoLab project's Electron IPC communication design
 */

// IPC频道枚举 / IPC Channel Enum
export enum IpcChannel {
  // 视频相关 / Video Related
  VIDEO_LOAD = 'video:load',
  VIDEO_GET_INFO = 'video:get-info',
  VIDEO_GET_THUMBNAIL = 'video:get-thumbnail',
  VIDEO_GET_METADATA = 'video:get-metadata',
  VIDEO_PROCESS = 'video:process',

  // 字幕相关 / Subtitle Related
  SUBTITLE_LOAD = 'subtitle:load',
  SUBTITLE_PARSE = 'subtitle:parse',
  SUBTITLE_SAVE = 'subtitle:save',
  SUBTITLE_EXPORT = 'subtitle:export',
  SUBTITLE_SEARCH = 'subtitle:search',

  // 文件系统相关 / File System Related
  FILE_SELECT = 'file:select',
  FILE_OPEN = 'file:open',
  FILE_SAVE = 'file:save',
  FILE_DELETE = 'file:delete',
  FILE_EXISTS = 'file:exists',
  FILE_WATCH = 'file:watch',

  // 存储相关 / Storage Related
  STORE_GET = 'store:get',
  STORE_SET = 'store:set',
  STORE_DELETE = 'store:delete',
  STORE_CLEAR = 'store:clear',
  STORE_KEYS = 'store:keys',
  STORE_BACKUP = 'store:backup',
  STORE_RESTORE = 'store:restore',

  // 系统相关 / System Related
  SYSTEM_GET_INFO = 'system:get-info',
  SYSTEM_OPEN_FILE_DIALOG = 'system:open-file-dialog',
  SYSTEM_SHOW_MESSAGE_BOX = 'system:show-message-box',
  SYSTEM_SHOW_NOTIFICATION = 'system:show-notification',
  SYSTEM_GET_PATH = 'system:get-path',

  // 窗口相关 / Window Related
  WINDOW_MINIMIZE = 'window:minimize',
  WINDOW_MAXIMIZE = 'window:maximize',
  WINDOW_CLOSE = 'window:close',
  WINDOW_TOGGLE_FULLSCREEN = 'window:toggle-fullscreen',
  WINDOW_SET_SIZE = 'window:set-size',
  WINDOW_SET_POSITION = 'window:set-position',

  // 应用配置相关 / App Config Related
  APP_CONFIG_GET = 'app-config:get',
  APP_CONFIG_SET = 'app-config:set',
  APP_CONFIG_RESET = 'app-config:reset',

  // 更新相关 / Update Related
  UPDATE_CHECK = 'update:check',
  UPDATE_DOWNLOAD = 'update:download',
  UPDATE_INSTALL = 'update:install',
  UPDATE_GET_STATUS = 'update:get-status',

  // 日志相关 / Logging Related
  LOG_WRITE = 'log:write',
  LOG_GET = 'log:get',
  LOG_CLEAR = 'log:clear',

  // FFmpeg相关 / FFmpeg Related
  FFMPEG_PROBE = 'ffmpeg:probe',
  FFMPEG_TRANSCODE = 'ffmpeg:transcode',
  FFMPEG_EXTRACT_AUDIO = 'ffmpeg:extract-audio',
  FFMPEG_GENERATE_THUMBNAIL = 'ffmpeg:generate-thumbnail'
}

// IPC请求接口 / IPC Request Interface
export interface IpcRequest<T = unknown> {
  readonly channel: IpcChannel
  readonly data?: T
  readonly requestId: string
  readonly timestamp: Date
  readonly timeout?: number
}

// IPC响应接口 / IPC Response Interface
export interface IpcResponse<T = unknown> {
  readonly success: boolean
  readonly data?: T
  readonly error?: string
  readonly requestId: string
  readonly timestamp: Date
  readonly duration: number
}

// IPC错误接口 / IPC Error Interface
export interface IpcError {
  readonly code: string
  readonly message: string
  readonly details?: unknown
  readonly stack?: string
}

// 文件对话框选项接口 / File Dialog Options Interface
export interface FileDialogOptions {
  readonly title?: string
  readonly defaultPath?: string
  readonly buttonLabel?: string
  readonly filters?: readonly FileFilter[]
  readonly properties?: readonly FileDialogProperty[]
  readonly message?: string
  readonly securityScopedBookmarks?: boolean
}

// 文件过滤器接口 / File Filter Interface
export interface FileFilter {
  readonly name: string
  readonly extensions: readonly string[]
}

// 文件对话框属性枚举 / File Dialog Property Enum
export enum FileDialogProperty {
  OPEN_FILE = 'openFile',
  OPEN_DIRECTORY = 'openDirectory',
  MULTI_SELECTIONS = 'multiSelections',
  SHOW_HIDDEN_FILES = 'showHiddenFiles',
  CREATE_DIRECTORY = 'createDirectory',
  PROMPT_TO_CREATE = 'promptToCreate',
  NO_RESOLVE_ALIASES = 'noResolveAliases',
  TREAT_PACKAGE_AS_DIRECTORY = 'treatPackageAsDirectory',
  DONT_ADD_TO_RECENT = 'dontAddToRecent'
}

// 消息框选项接口 / Message Box Options Interface
export interface MessageBoxOptions {
  readonly type?: 'none' | 'info' | 'error' | 'question' | 'warning'
  readonly buttons?: readonly string[]
  readonly defaultId?: number
  readonly title?: string
  readonly message: string
  readonly detail?: string
  readonly checkboxLabel?: string
  readonly checkboxChecked?: boolean
  readonly icon?: string
  readonly cancelId?: number
  readonly noLink?: boolean
  readonly normalizeAccessKeys?: boolean
}

// 通知选项接口 / Notification Options Interface
export interface NotificationOptions {
  readonly title: string
  readonly subtitle?: string
  readonly body?: string
  readonly silent?: boolean
  readonly icon?: string
  readonly hasReply?: boolean
  readonly timeoutType?: 'default' | 'never'
  readonly replyPlaceholder?: string
  readonly sound?: string
  readonly urgency?: 'normal' | 'critical' | 'low'
  readonly actions?: readonly NotificationAction[]
  readonly closeButtonText?: string
  readonly toastXml?: string
}

// 通知操作接口 / Notification Action Interface
export interface NotificationAction {
  readonly type: 'button'
  readonly text: string
}

// 系统信息接口 / System Info Interface
export interface SystemInfo {
  readonly platform: string
  readonly arch: string
  readonly version: string
  readonly release: string
  readonly hostname: string
  readonly userInfo: {
    readonly username: string
    readonly homedir: string
    readonly shell?: string
  }
  readonly memory: {
    readonly total: number
    readonly free: number
    readonly used: number
  }
  readonly cpu: {
    readonly model: string
    readonly cores: number
    readonly speed: number
  }
}

// 窗口状态接口 / Window State Interface
export interface WindowState {
  readonly isMaximized: boolean
  readonly isMinimized: boolean
  readonly isFullScreen: boolean
  readonly isFocused: boolean
  readonly isVisible: boolean
  readonly bounds: {
    readonly x: number
    readonly y: number
    readonly width: number
    readonly height: number
  }
}

// 应用路径类型枚举 / App Path Type Enum
export enum AppPathType {
  HOME = 'home',
  APP_DATA = 'appData',
  USER_DATA = 'userData',
  SESSION_DATA = 'sessionData',
  TEMP = 'temp',
  EXE = 'exe',
  MODULE = 'module',
  DESKTOP = 'desktop',
  DOCUMENTS = 'documents',
  DOWNLOADS = 'downloads',
  MUSIC = 'music',
  PICTURES = 'pictures',
  VIDEOS = 'videos',
  RECENT = 'recent',
  LOGS = 'logs',
  CRASH_DUMPS = 'crashDumps'
}

// 更新状态接口 / Update Status Interface
export interface UpdateStatus {
  readonly status:
    | 'checking'
    | 'available'
    | 'not-available'
    | 'downloading'
    | 'downloaded'
    | 'error'
  readonly version?: string
  readonly releaseNotes?: string
  readonly releaseDate?: Date
  readonly downloadProgress?: {
    readonly bytesPerSecond: number
    readonly percent: number
    readonly total: number
    readonly transferred: number
  }
  readonly error?: string
}

// FFmpeg探测结果接口 / FFmpeg Probe Result Interface
export interface FFmpegProbeResult {
  readonly format: {
    readonly filename: string
    readonly nb_streams: number
    readonly nb_programs: number
    readonly format_name: string
    readonly format_long_name: string
    readonly start_time: number
    readonly duration: number
    readonly size: number
    readonly bit_rate: number
    readonly probe_score: number
    readonly tags?: Record<string, string>
  }
  readonly streams: readonly FFmpegStream[]
}

// FFmpeg流信息接口 / FFmpeg Stream Info Interface
export interface FFmpegStream {
  readonly index: number
  readonly codec_name: string
  readonly codec_long_name: string
  readonly profile?: string
  readonly codec_type: 'video' | 'audio' | 'subtitle' | 'data' | 'attachment'
  readonly codec_tag_string: string
  readonly codec_tag: string
  readonly width?: number
  readonly height?: number
  readonly coded_width?: number
  readonly coded_height?: number
  readonly closed_captions?: number
  readonly film_grain?: number
  readonly has_b_frames?: number
  readonly sample_aspect_ratio?: string
  readonly display_aspect_ratio?: string
  readonly pix_fmt?: string
  readonly level?: number
  readonly color_range?: string
  readonly color_space?: string
  readonly color_transfer?: string
  readonly color_primaries?: string
  readonly chroma_location?: string
  readonly field_order?: string
  readonly refs?: number
  readonly is_avc?: string
  readonly nal_length_size?: string
  readonly r_frame_rate: string
  readonly avg_frame_rate: string
  readonly time_base: string
  readonly start_pts?: number
  readonly start_time?: number
  readonly duration_ts?: number
  readonly duration?: number
  readonly bit_rate?: number
  readonly max_bit_rate?: number
  readonly bits_per_raw_sample?: number
  readonly nb_frames?: number
  readonly nb_read_frames?: number
  readonly nb_read_packets?: number
  readonly extradata_size?: number
  readonly tags?: Record<string, string>
  readonly disposition?: Record<string, number>
}

// FFmpeg转码选项接口 / FFmpeg Transcode Options Interface
export interface FFmpegTranscodeOptions {
  readonly input: string
  readonly output: string
  readonly videoCodec?: string
  readonly audioCodec?: string
  readonly videoBitrate?: string
  readonly audioBitrate?: string
  readonly resolution?: string
  readonly frameRate?: number
  readonly quality?: number
  readonly preset?: string
  readonly format?: string
  readonly startTime?: number
  readonly duration?: number
  readonly filters?: readonly string[]
  readonly metadata?: Record<string, string>
  readonly overwrite?: boolean
}

// FFmpeg进度信息接口 / FFmpeg Progress Info Interface
export interface FFmpegProgressInfo {
  readonly frame: number
  readonly fps: number
  readonly q: number
  readonly size: number
  readonly time: string
  readonly bitrate: string
  readonly speed: string
  readonly progress: number // 0-100
}
