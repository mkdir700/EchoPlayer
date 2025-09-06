/**
 * 文本分词工具
 * Text Tokenizer Utilities
 *
 * 提供智能分词功能，支持中英文混合文本处理
 */

export interface WordToken {
  /** 单词文本内容 */
  text: string
  /** 在原文本中的起始位置 */
  start: number
  /** 在原文本中的结束位置 */
  end: number
  /** 单词索引 */
  index: number
  /** 单词类型 */
  type: 'word' | 'punctuation' | 'space' | 'chinese'
}

/**
 * 智能文本分词
 * @param text 要分词的文本
 * @returns 分词结果数组
 */
export function tokenizeText(text: string): WordToken[] {
  if (!text || text.trim().length === 0) {
    return []
  }

  // 创建一个包含所有匹配项的数组
  const allMatches: Array<{
    text: string
    start: number
    end: number
    type: WordToken['type']
  }> = []

  // 匹配中文字符（每个字符作为一个词）
  const chineseRegex = /[\u4e00-\u9fff]/g
  let chineseMatch: RegExpExecArray | null
  while ((chineseMatch = chineseRegex.exec(text)) !== null) {
    allMatches.push({
      text: chineseMatch[0],
      start: chineseMatch.index,
      end: chineseMatch.index + chineseMatch[0].length,
      type: 'chinese'
    })
  }

  // 匹配英文单词
  const wordRegex = /[a-zA-Z0-9]+(?:'[a-zA-Z]+)?/g
  let wordMatch: RegExpExecArray | null
  while ((wordMatch = wordRegex.exec(text)) !== null) {
    allMatches.push({
      text: wordMatch[0],
      start: wordMatch.index,
      end: wordMatch.index + wordMatch[0].length,
      type: 'word'
    })
  }

  // 匹配标点符号
  const punctRegex = /[.!?;:,\-—""''()[\]{}]/g
  let punctMatch: RegExpExecArray | null
  while ((punctMatch = punctRegex.exec(text)) !== null) {
    allMatches.push({
      text: punctMatch[0],
      start: punctMatch.index,
      end: punctMatch.index + punctMatch[0].length,
      type: 'punctuation'
    })
  }

  // 匹配空格
  const spaceRegex = /\s+/g
  let spaceMatch: RegExpExecArray | null
  while ((spaceMatch = spaceRegex.exec(text)) !== null) {
    allMatches.push({
      text: spaceMatch[0],
      start: spaceMatch.index,
      end: spaceMatch.index + spaceMatch[0].length,
      type: 'space'
    })
  }

  // 按位置排序
  allMatches.sort((a, b) => a.start - b.start)

  // 填补空隙（处理未匹配到的字符）
  const filledMatches: typeof allMatches = []
  let lastEnd = 0

  for (const match of allMatches) {
    // 如果有空隙，添加未匹配的字符
    if (match.start > lastEnd) {
      const gapText = text.slice(lastEnd, match.start)
      filledMatches.push({
        text: gapText,
        start: lastEnd,
        end: match.start,
        type: 'punctuation' // 将未匹配的字符视为标点处理
      })
    }

    filledMatches.push(match)
    lastEnd = match.end
  }

  // 处理末尾剩余字符
  if (lastEnd < text.length) {
    const remainingText = text.slice(lastEnd)
    filledMatches.push({
      text: remainingText,
      start: lastEnd,
      end: text.length,
      type: 'punctuation'
    })
  }

  // 转换为 WordToken 格式
  return filledMatches.map((match, index) => ({
    text: match.text,
    start: match.start,
    end: match.end,
    index,
    type: match.type
  }))
}

/**
 * 检查是否为可点击的单词（非空格、非纯标点）
 */
export function isClickableToken(token: WordToken): boolean {
  return token.type === 'word' || token.type === 'chinese'
}

/**
 * 获取指定范围内的所有词汇
 */
export function getTokensInRange(
  tokens: WordToken[],
  startIndex: number,
  endIndex: number
): WordToken[] {
  return tokens.slice(Math.min(startIndex, endIndex), Math.max(startIndex, endIndex) + 1)
}

/**
 * 将词汇数组转换为文本
 */
export function tokensToText(tokens: WordToken[]): string {
  return tokens.map((token) => token.text).join('')
}
