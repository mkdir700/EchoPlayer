// 词典查询结果类型定义
export interface DictionaryDefinition {
  partOfSpeech?: string
  meaning: string
  examples?: string[]
}

// 发音信息
export interface PronunciationInfo {
  type: 'uk' | 'us' | null // 英式、美式发音或未知
  phonetic: string // 音标
  audioUrl?: string // 音频链接
  voiceParams?: string // 原始的语音参数
}

export interface DictionaryResult {
  word: string
  pronunciations?: PronunciationInfo[] // 详细发音信息
  definitions: DictionaryDefinition[]
  examples?: string[]
  translations?: string[]
}

export interface DictionaryResponse {
  success: boolean
  data?: DictionaryResult
  error?: string
}
