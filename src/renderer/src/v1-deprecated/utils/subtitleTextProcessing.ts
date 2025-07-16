/**
 * 字幕文本处理工具模块
 * Subtitle text processing utility module
 */

/**
 * 检测文本是否为中文 / Detect if text is Chinese
 */
export const isChineseText = (text: string): boolean => {
  return /[\u4e00-\u9fff]/.test(text)
}

/**
 * 清理单词文本（移除首尾标点符号）/ Clean word text (remove leading/trailing punctuation)
 */
export const cleanWordText = (word: string): string => {
  return word.replace(/^[^\w\s]+|[^\w\s]+$/g, '')
}

/**
 * 检查字符是否为可点击的中文字符 / Check if character is clickable Chinese character
 */
export const isClickableChineseChar = (char: string): boolean => {
  return char.trim() !== '' && /[\u4e00-\u9fff]/.test(char)
}

/**
 * 检查单词是否可点击 / Check if word is clickable
 */
export const isClickableWord = (word: string): boolean => {
  const trimWord = cleanWordText(word)
  return trimWord.trim() !== ''
}

/**
 * 分割中文文本为字符数组 / Split Chinese text into character array
 */
export const splitChineseText = (text: string): string[] => {
  return text.split('')
}

/**
 * 分割英文文本为单词数组（包含空格）/ Split English text into word array (including spaces)
 */
export const splitEnglishText = (text: string): string[] => {
  return text.split(/(\s+)/)
}

/**
 * 过滤出非空单词 / Filter out non-empty words
 */
export const filterNonEmptyWords = (words: string[]): string[] => {
  return words.filter((word) => word.trim() !== '')
}

/**
 * 基础文本分割函数 / Basic text splitting function
 * 根据语言类型进行适当的分割 / Split appropriately based on language type
 */
export const splitTextByLanguage = (
  text: string
): {
  words: string[]
  isChineseText: boolean
} => {
  const isChinese = isChineseText(text)

  if (isChinese) {
    return {
      words: splitChineseText(text),
      isChineseText: true
    }
  } else {
    return {
      words: filterNonEmptyWords(splitEnglishText(text)),
      isChineseText: false
    }
  }
}

/**
 * 创建文本分割结果（用于渲染）/ Create text split result (for rendering)
 * 包含原始分割和渲染用分割 / Include original split and render split
 */
export interface TextSplitResult {
  /** 原始分割结果（用于选择逻辑）/ Original split result (for selection logic) */
  originalWords: string[]
  /** 渲染用分割结果（包含空格等）/ Render split result (including spaces etc.) */
  renderTokens: string[]
  /** 是否为中文文本 / Whether it's Chinese text */
  isChineseText: boolean
}

/**
 * 完整的文本分割函数 / Complete text splitting function
 * 同时提供选择逻辑用的分割和渲染用的分割 / Provide both selection logic split and render split
 */
export const createTextSplitResult = (text: string): TextSplitResult => {
  const isChinese = isChineseText(text)

  if (isChinese) {
    const chars = splitChineseText(text)
    return {
      originalWords: chars,
      renderTokens: chars,
      isChineseText: true
    }
  } else {
    const allTokens = splitEnglishText(text)
    const words = filterNonEmptyWords(allTokens)

    return {
      originalWords: words,
      renderTokens: allTokens,
      isChineseText: false
    }
  }
}
