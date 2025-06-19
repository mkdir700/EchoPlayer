import { BackgroundType, SubtitleDisplayMode, SubtitleFormat } from '../types'

// 支持的字幕格式列表 / Supported Subtitle Formats List
export const SUPPORTED_SUBTITLE_FORMATS = [
  SubtitleFormat.SRT,
  SubtitleFormat.VTT,
  SubtitleFormat.ASS,
  SubtitleFormat.SSA,
  SubtitleFormat.JSON
] as const

// 字幕显示模式选项 / Subtitle Display Mode Options
export const SUBTITLE_DISPLAY_MODE_OPTIONS = [
  { value: SubtitleDisplayMode.NONE, label: '隐藏字幕' },
  { value: SubtitleDisplayMode.ORIGINAL, label: '原文' },
  { value: SubtitleDisplayMode.TRANSLATED, label: '译文' },
  { value: SubtitleDisplayMode.BILINGUAL, label: '双语' }
] as const

// 字体大小选项 / Font Size Options
export const FONT_SIZE_OPTIONS = [
  { value: 12, label: '小' },
  { value: 14, label: '较小' },
  { value: 16, label: '正常' },
  { value: 18, label: '较大' },
  { value: 20, label: '大' },
  { value: 24, label: '特大' }
] as const

// 背景类型选项 / Background Type Options
export const BACKGROUND_TYPE_OPTIONS = [
  { type: BackgroundType.TRANSPARENT, label: '完全透明', icon: '○' },
  { type: BackgroundType.BLUR, label: '模糊背景', icon: '◐' },
  { type: BackgroundType.SOLID_BLACK, label: '黑色背景', icon: '●' },
  { type: BackgroundType.SOLID_GRAY, label: '灰色背景', icon: '◉' }
] as const

// 字幕位置预设 / Subtitle Position Presets
export const SUBTITLE_POSITION_PRESETS = {
  BOTTOM_CENTER: { x: 50, y: 85, anchor: 'center' },
  BOTTOM_LEFT: { x: 10, y: 85, anchor: 'left' },
  BOTTOM_RIGHT: { x: 90, y: 85, anchor: 'right' },
  TOP_CENTER: { x: 50, y: 15, anchor: 'center' },
  CENTER: { x: 50, y: 50, anchor: 'center' }
} as const

// 边距限制常量 / Margin Limits Constants
export const MARGIN_LIMITS = {
  MIN_TOTAL_WIDTH: 20,
  MIN_TOTAL_HEIGHT: 10,
  MAX_SINGLE_MARGIN: 80
} as const
