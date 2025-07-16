// 词典查询结果类型定义
export interface DictionaryDefinition {
  partOfSpeech?: string
  meaning: string
  examples?: string[]
}

export interface DictionaryResult {
  word: string
  phonetic?: string
  definitions: DictionaryDefinition[]
  examples?: string[]
  translations?: string[]
}

export interface DictionaryResponse {
  success: boolean
  data?: DictionaryResult
  error?: string
}
