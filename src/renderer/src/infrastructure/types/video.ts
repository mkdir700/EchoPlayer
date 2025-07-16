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
  readonly id: number
  readonly fileId: string
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
