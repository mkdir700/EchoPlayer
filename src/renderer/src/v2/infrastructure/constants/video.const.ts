import { VideoFormat } from '../types'

// 播放速度预设 / Playback Rate Presets
export const PLAYBACK_RATES = [0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0] as const

// 视频质量预设 / Video Quality Presets
export const VIDEO_QUALITY_PRESETS = {
  LOW: { width: 480, height: 360, bitrate: 500 },
  MEDIUM: { width: 720, height: 480, bitrate: 1000 },
  HIGH: { width: 1280, height: 720, bitrate: 2000 },
  ULTRA: { width: 1920, height: 1080, bitrate: 4000 }
} as const

// 支持的视频格式列表 / Supported Video Formats List
export const SUPPORTED_VIDEO_FORMATS = [
  VideoFormat.MP4,
  VideoFormat.AVI,
  VideoFormat.MKV,
  VideoFormat.MOV,
  VideoFormat.WEBM
] as const

// 视频文件限制 / Video File Limits
export const VIDEO_FILE_LIMITS = {
  MAX_SIZE_MB: 2048, // 2GB
  MIN_DURATION_SECONDS: 1,
  MAX_DURATION_SECONDS: 14400 // 4小时
} as const

// 缩略图配置 / Thumbnail Config
export const THUMBNAIL_CONFIG = {
  WIDTH: 160,
  HEIGHT: 90,
  QUALITY: 0.8,
  FORMAT: 'jpeg'
} as const
