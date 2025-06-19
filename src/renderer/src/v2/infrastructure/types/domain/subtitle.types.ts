/**
 * 字幕领域类型定义
 * Subtitle Domain Type Definitions
 *
 * 基于现有 EchoLab 项目的字幕处理功能设计
 * Based on existing EchoLab project's subtitle processing features
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
  readonly language: SubtitleLanguage
  readonly itemCount: number
  readonly duration: number
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

// 遮罩框接口 / Mask Frame Interface
export interface MaskFrame {
  readonly left: number
  readonly top: number
  readonly width: number
  readonly height: number
}

// 背景类型枚举 / Background Type Enum
export enum BackgroundType {
  TRANSPARENT = 'transparent',
  BLUR = 'blur',
  SOLID_BLACK = 'solid-black',
  SOLID_GRAY = 'solid-gray'
}

// 字幕显示设置接口 / Subtitle Display Settings Interface
export interface SubtitleDisplaySettings {
  readonly margins: SubtitleMargins
  readonly backgroundType: BackgroundType
  readonly isMaskMode: boolean
  readonly maskFrame: MaskFrame
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

// 字幕处理结果接口 / Subtitle Processing Result Interface
export interface SubtitleProcessingResult {
  readonly text: string
  readonly englishText?: string
  readonly chineseText?: string
  readonly isProcessed: boolean
}
