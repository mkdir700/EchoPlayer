/**
 * 字幕领域类型定义
 * Subtitle Domain Type Definitions
 *
 * 基于现有 EchoPlayer 项目的字幕处理功能设计
 * Based on existing EchoPlayer project's subtitle processing features
 */

// 字幕项接口 / Subtitle Item Interface
export interface SubtitleItem {
  readonly id: string
  readonly startTime: number
  readonly endTime: number
  readonly originalText: string
  readonly translatedText?: string
}

// 字幕格式枚举 / Subtitle Format Enum
export enum SubtitleFormat {
  SRT = 'srt',
  VTT = 'vtt',
  ASS = 'ass',
  SSA = 'ssa',
  JSON = 'json'
}

// 字幕语言枚举 / Subtitle Language Enum
export enum SubtitleLanguage {
  CHINESE = 'zh',
  ENGLISH = 'en',
  JAPANESE = 'ja',
  KOREAN = 'ko',
  FRENCH = 'fr',
  GERMAN = 'de',
  SPANISH = 'es'
}

// 字幕显示模式枚举 / Subtitle Display Mode Enum
export enum SubtitleDisplayMode {
  NONE = 'none',
  ORIGINAL = 'original',
  TRANSLATED = 'translated',
  BILINGUAL = 'bilingual'
}

// 字幕文件信息接口 / Subtitle File Info Interface
export interface SubtitleFileInfo {
  readonly filePath: string
  readonly fileName: string
  readonly format: SubtitleFormat
  readonly encoding: string
  readonly language?: SubtitleLanguage
  readonly itemCount?: number
}

// 字幕位置接口 / Subtitle Position Interface
export interface SubtitlePosition {
  readonly x: number
  readonly y: number
  readonly width: number
  readonly height: number
}

// 字幕边距接口 / Subtitle Margins Interface
export interface SubtitleMargins {
  readonly left: number
  readonly top: number
  readonly right: number
  readonly bottom: number
}

// 背景类型枚举 / Background Type Enum
export enum SubtitleBackgroundType {
  TRANSPARENT = 'transparent',
  BLUR = 'blur',
  SOLID_BLACK = 'solid-black',
  SOLID_GRAY = 'solid-gray'
}

// 字幕显示设置接口 / Subtitle Display Settings Interface
export interface SubtitleDisplaySettings {
  readonly margins: SubtitleMargins
  readonly backgroundType: SubtitleBackgroundType
  readonly isMaskMode: boolean
  readonly fontSize?: number
  readonly fontFamily?: string
  readonly fontColor?: string
  readonly backgroundColor?: string
  readonly opacity?: number
  readonly position?: SubtitlePosition
  readonly isAutoScrollEnabled?: boolean
}

// 字幕状态接口 / Subtitle State Interface
export interface SubtitleState {
  readonly subtitles: SubtitleItem[]
  readonly currentIndex: number
  readonly displaySettings: SubtitleDisplaySettings
  readonly loadingState: SubtitleLoadingState
}

// 字幕加载状态接口 / Subtitle Loading State Interface
export interface SubtitleLoadingState {
  readonly isLoading: boolean
  readonly error: string | null
  readonly progress?: number
}

// 字幕导航状态接口 / Subtitle Navigation State Interface
export interface SubtitleNavigationState {
  readonly hasNext: boolean
  readonly hasPrev: boolean
  readonly canJumpToNext: boolean
  readonly canJumpToPrev: boolean
}

// 字幕轨道编码类型 / Subtitle Stream Codec Type
export type SubtitleCodecType =
  | 'subrip'
  | 'ass'
  | 'ssa'
  | 'pgs'
  | 'dvb_subtitle'
  | 'webvtt'
  | 'mov_text'
  | string

// 字幕轨道信息接口 / Subtitle Stream Info Interface
export interface SubtitleStream {
  readonly index: number // 流索引 (0, 1, 2...)
  readonly streamId: string // 流标识 (0:6, 0:7...)
  readonly codec: SubtitleCodecType // 编码格式
  readonly language?: string // 语言代码 (zh, en, ja...)
  readonly title?: string // 轨道标题
  readonly isDefault?: boolean // 是否为默认轨道
  readonly isForced?: boolean // 是否为强制字幕
  readonly isPGS?: boolean // 是否为 PGS 图像字幕
}

// 字幕轨道列表响应 / Subtitle Streams Response
export interface SubtitleStreamsResponse {
  readonly videoPath: string
  readonly streams: SubtitleStream[]
  readonly textStreams: SubtitleStream[] // 文本字幕轨
  readonly imageStreams: SubtitleStream[] // 图像字幕轨 (PGS)
}
