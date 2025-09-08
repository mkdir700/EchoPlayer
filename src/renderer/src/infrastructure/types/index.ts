export * from './dictionary'
export * from './ffmpeg'
export * from './notification'
export * from './shortcuts'
export * from './subtitle'
export * from './ui'
export * from './update'
export * from './video'
export * from './video-library'
export * from './video-settings'
export * from '@shared/types/mediainfo'

/**
 * 可序列化数据类型 / Serializable data types
 * 表示可以安全地转换为JSON字符串的数据类型
 * Represents data types that can be safely converted to JSON strings
 */
export type Serializable =
  | string
  | number
  | boolean
  | null
  | undefined
  | Serializable[]
  | { [key: string]: Serializable }

export type LanguageVarious =
  | 'zh-CN'
  | 'zh-TW'
  | 'el-GR'
  | 'en-US'
  | 'es-ES'
  | 'fr-FR'
  | 'ja-JP'
  | 'pt-PT'
  | 'ru-RU'
