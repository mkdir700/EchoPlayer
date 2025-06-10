/**
 * 向后兼容的字幕文本组件导出
 * Backward compatible subtitle text components exports
 *
 * @deprecated 请使用新的分离组件：
 * - SubtitleText.tsx 用于基础字幕文本组件
 * - BilingualSubtitle.tsx 用于双语字幕
 * - SubtitlePlaceholder.tsx 用于占位符
 * - WordWrapper.tsx 用于单词包装
 * - SmartTextContent.tsx 用于智能文本内容
 *
 * Please use the new separated components:
 * - SubtitleText.tsx for basic subtitle text components
 * - BilingualSubtitle.tsx for bilingual subtitles
 * - SubtitlePlaceholder.tsx for placeholders
 * - WordWrapper.tsx for word wrapping
 * - SmartTextContent.tsx for smart text content
 */

// 重新导出新的组件以保持向后兼容性 / Re-export new components for backward compatibility
export {
  OriginalSubtitleText,
  ChineseSubtitleText,
  EnglishSubtitleText,
  type SubtitleTextProps
} from './SubtitleText'

export { BilingualSubtitleLine, type BilingualSubtitleLineProps } from './BilingualSubtitle'

export { SubtitlePlaceholder, type SubtitlePlaceholderProps } from './SubtitlePlaceholder'

/**
 * 注意：此文件已被重构为多个专门的组件文件
 * Note: This file has been refactored into multiple specialized component files
 *
 * 新的文件结构：
 * New file structure:
 * - WordWrapper.tsx - 单词包装器组件
 * - TextRenderer.tsx - 文本渲染器组件
 * - SmartTextContent.tsx - 智能文本内容组件
 * - SubtitleText.tsx - 基础字幕文本组件
 * - BilingualSubtitle.tsx - 双语字幕组件
 * - SubtitlePlaceholder.tsx - 字幕占位符组件
 * - utils/subtitleTextSegmentation.ts - 文本分段工具
 * - utils/subtitleTextProcessing.ts - 文本处理工具
 * - utils/subtitleTextRendering.ts - 文本渲染工具
 */
