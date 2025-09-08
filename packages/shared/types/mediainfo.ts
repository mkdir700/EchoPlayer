// MediaInfo 相关类型定义

/**
 * MediaInfo 服务状态接口
 */
export interface MediaInfoStatus {
  isInitialized: boolean
  version: string | null
  lastError?: string
}

/**
 * MediaInfo 原始结果接口
 * 基于 mediainfo.js 返回的标准格式
 */
export interface MediaInfoRawResult {
  media: {
    '@ref': string
    track: MediaInfoTrack[]
  }
}

/**
 * MediaInfo 轨道信息接口
 */
export interface MediaInfoTrack {
  '@type': 'General' | 'Video' | 'Audio' | 'Text' | 'Other'
  [key: string]: any

  // 通用字段
  ID?: string
  UniqueID?: string

  // General 轨道字段
  CompleteName?: string
  FileName?: string
  FileExtension?: string
  Format?: string
  Duration?: string
  FileSize?: string
  OverallBitRate?: string

  // Video 轨道字段
  Width?: string
  Height?: string
  DisplayAspectRatio?: string
  FrameRate?: string
  BitRate?: string
  CodecID?: string

  // Audio 轨道字段
  Channels?: string
  SamplingRate?: string
  BitDepth?: string
}

/**
 * MediaInfo 扩展视频信息接口
 * 包含比 FFmpegVideoInfo 更详细的信息
 */
export interface MediaInfoVideoDetails {
  // 基本信息（兼容 FFmpegVideoInfo）
  duration: number
  videoCodec: string
  audioCodec: string
  resolution: string
  bitrate: string

  // 扩展信息
  fileSize?: number
  frameRate?: number
  aspectRatio?: string
  audioChannels?: number
  audioSampleRate?: number
  audioBitDepth?: number

  // 元数据
  title?: string
  creationTime?: string

  // 技术细节
  pixelFormat?: string
  colorSpace?: string
  profile?: string
  level?: string
}

/**
 * MediaInfo 分析选项接口
 */
export interface MediaInfoOptions {
  /** 是否包含扩展信息 */
  includeExtendedInfo?: boolean

  /** 超时时间（毫秒） */
  timeout?: number

  /** 是否缓存结果 */
  enableCache?: boolean

  /** 自定义解析器 */
  customParser?: (result: MediaInfoRawResult) => any
}

/**
 * MediaInfo 性能统计接口
 */
export interface MediaInfoPerformanceStats {
  initializationTime: number
  pathConversionTime: number
  fileCheckTime: number
  fileReadTime: number
  analysisTime: number
  parseTime: number
  totalTime: number
  fileSize: number
}

/**
 * MediaInfo 错误类型
 */
export enum MediaInfoErrorType {
  INITIALIZATION_FAILED = 'INITIALIZATION_FAILED',
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  FILE_READ_ERROR = 'FILE_READ_ERROR',
  ANALYSIS_FAILED = 'ANALYSIS_FAILED',
  PARSE_ERROR = 'PARSE_ERROR',
  UNSUPPORTED_FORMAT = 'UNSUPPORTED_FORMAT',
  WASM_LOAD_ERROR = 'WASM_LOAD_ERROR'
}

/**
 * MediaInfo 错误接口
 */
export interface MediaInfoError extends Error {
  type: MediaInfoErrorType
  filePath?: string
  details?: any
}
