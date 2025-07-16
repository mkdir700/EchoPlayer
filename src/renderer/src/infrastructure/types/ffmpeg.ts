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

// FFmpeg 视频信息接口 / FFmpeg video info interface
export interface FFmpegVideoInfo {
  duration: number
  videoCodec: string
  audioCodec: string
  resolution: string
  bitrate: string
}
