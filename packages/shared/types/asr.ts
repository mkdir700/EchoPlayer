/**
 * ASR 字幕生成相关类型定义
 */

/**
 * ASR 生成的字幕条目（简化版，后续需要转换为 SubtitleItem）
 */
export interface ASRSubtitleItem {
  /** 索引 */
  index: number
  /** 开始时间（秒） */
  startTime: number
  /** 结束时间（秒） */
  endTime: number
  /** 文本 */
  text: string
  /** 单词级时间戳（可选） */
  words?: DeepgramWord[]
}

/**
 * ASR 生成选项
 */
export interface ASRGenerateOptions {
  /** 视频文件路径 */
  videoPath: string
  /** 视频 ID（用于保存字幕记录） */
  videoId: number
  /** 目标语言（ISO 639-1 代码，如 'en', 'zh', 'ja'，或 'auto' 进行自动语言检测） */
  language?: string | 'auto'
  /** Deepgram 模型选择 */
  model?: 'nova-2' | 'nova-3'
  /** 输出格式 */
  outputFormat?: 'srt' | 'vtt'
}

/**
 * ASR 进度阶段
 */
export enum ASRProgressStage {
  /** 初始化 */
  Initializing = 'initializing',
  /** 音频提取 */
  ExtractingAudio = 'extracting_audio',
  /** 转写中 */
  Transcribing = 'transcribing',
  /** 格式化 */
  Formatting = 'formatting',
  /** 保存 */
  Saving = 'saving',
  /** 完成 */
  Complete = 'complete',
  /** 失败 */
  Failed = 'failed'
}

/**
 * ASR 进度信息
 */
export interface ASRProgress {
  /** 任务 ID */
  taskId: string
  /** 当前阶段 */
  stage: ASRProgressStage
  /** 进度百分比 (0-100) */
  percent: number
  /** 当前处理的段索引（转写阶段） */
  current?: number
  /** 总段数（转写阶段） */
  total?: number
  /** 阶段消息 */
  message?: string
  /** 预计剩余时间（秒） */
  eta?: number
}

/**
 * ASR 生成结果
 */
export interface ASRResult {
  /** 是否成功 */
  success: boolean
  /** 生成的字幕数据 */
  subtitles?: ASRSubtitleItem[]
  /** 输出文件路径（SRT/VTT） */
  outputPath?: string
  /** 字幕库记录 ID */
  subtitleLibraryId?: number
  /** 错误信息 */
  error?: string
  /** 错误代码 */
  errorCode?: string
  /** 统计信息 */
  stats?: {
    /** 音频时长（秒） */
    duration: number
    /** 处理时长（秒） */
    processingTime: number
    /** 段数 */
    segmentCount: number
    /** 字幕条数 */
    subtitleCount: number
  }
}

/**
 * 音频段信息
 */
export interface AudioSegment {
  /** 段索引 */
  index: number
  /** 开始时间（秒） */
  start: number
  /** 结束时间（秒） */
  end: number
  /** 时长（秒） */
  duration: number
  /** 音频文件路径 */
  filePath: string
}

/**
 * Deepgram 词级时间戳
 */
export interface DeepgramWord {
  /** 词文本 */
  word: string
  /** 开始时间（秒） */
  start: number
  /** 结束时间（秒） */
  end: number
  /** 置信度 (0-1) */
  confidence: number
  /** 带标点的词形 */
  punctuated_word?: string
}

/**
 * Deepgram 句段信息
 */
export interface DeepgramUtterance {
  /** 开始时间（秒） */
  start: number
  /** 结束时间（秒） */
  end: number
  /** 句段文本 */
  transcript: string
  /** 置信度 (0-1) */
  confidence: number
  /** 词数组 */
  words: DeepgramWord[]
}

/**
 * Deepgram API 响应（简化）
 */
export interface DeepgramResponse {
  /** 结果数组 */
  results: {
    /** 通道数组 */
    channels: Array<{
      /** 备选结果 */
      alternatives: Array<{
        /** 完整转录文本 */
        transcript: string
        /** 置信度 */
        confidence: number
        /** 词数组 */
        words: DeepgramWord[]
      }>
      /** 句段数组（utterances=true 时） */
      utterances?: DeepgramUtterance[]
    }>
  }
  /** 元数据 */
  metadata: {
    /** 请求 ID */
    request_id: string
    /** 音频时长 */
    duration: number
    /** 通道数 */
    channels: number
  }
}

/**
 * 转录段结果
 */
export interface TranscriptSegment {
  /** 原始音频段信息 */
  audioSegment: AudioSegment
  /** Deepgram 响应 */
  response?: DeepgramResponse
  /** 是否成功 */
  success: boolean
  /** 错误信息 */
  error?: string
}

/**
 * API 密钥验证结果
 */
export interface ApiKeyValidationResult {
  /** 是否有效 */
  valid: boolean
  /** 错误消息 */
  error?: string
  /** 账户信息（可选） */
  account?: {
    /** 剩余配额 */
    remainingBalance?: number
  }
}
