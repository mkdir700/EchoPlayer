/**
 * VideoPlayer组件导出索引
 * VideoPlayer components export index
 */

// 字幕文本组件 / Subtitle text components
export {
  ChineseSubtitleText,
  EnglishSubtitleText,
  OriginalSubtitleText,
  type SubtitleTextProps
} from './SubtitleText'

// 双语字幕组件 / Bilingual subtitle components
export { BilingualSubtitleLine, type BilingualSubtitleLineProps } from './BilingualSubtitle'

// 字幕占位符组件 / Subtitle placeholder component
export { SubtitlePlaceholder, type SubtitlePlaceholderProps } from './SubtitlePlaceholder'

// 覆盖层组件 / Overlay components
export { SpeedOverlay } from './SpeedOverlay'
export { SubtitleModeOverlay } from './SubtitleModeOverlay'

// 基础组件 / Base components
export { SmartTextContent, type SmartTextContentProps } from './SmartTextContent'
export { TextRenderer, type TextRendererProps } from './TextRenderer'
export { WordWrapper, type WordWrapperProps } from './WordWrapper'
