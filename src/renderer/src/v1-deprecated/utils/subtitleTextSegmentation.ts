/**
 * 字幕文本智能分段工具模块
 * Subtitle text intelligent segmentation utility module
 */

/**
 * 智能分段函数 - 将长文本分割为多行字幕
 * Smart segmentation function - Split long text into multiple subtitle lines
 */
export const segmentText = (text: string): string[] => {
  // 如果文本较短，不需要分段 / If text is short, no segmentation needed
  if (text.length <= 50) return [text]

  // 预处理：保护需要避免分割的内容 / Preprocessing: protect content that should not be split
  const protectedPatterns: Array<{ pattern: RegExp; placeholder: string }> = [
    // 保护省略号（各种形式）- 必须在其他模式之前 / Protect ellipsis (various forms) - must be before other patterns
    { pattern: /\.{2,}/g, placeholder: '___ELLIPSIS___' },
    { pattern: /…+/g, placeholder: '___HELLIP___' },

    // 保护英文缩写 / Protect English abbreviations
    {
      pattern: /\b(?:Mr|Mrs|Ms|Dr|Prof|Sr|Jr|vs|etc|Inc|Ltd|Corp|Co|LLC)\./gi,
      placeholder: '___ABBREV___'
    },

    // 保护数字和小数点 / Protect numbers and decimals
    { pattern: /\b\d+\.\d+\b/g, placeholder: '___DECIMAL___' },

    // 保护时间格式 / Protect time formats
    { pattern: /\b\d{1,2}[:：.]\d{2}\b/g, placeholder: '___TIME___' },

    // 保护特殊标点组合 / Protect special punctuation combinations
    { pattern: /[!?]{2,}/g, placeholder: '___MULTIMARK___' },

    // 保护引号内容（避免在引号内分割）/ Protect quoted content (avoid splitting inside quotes)
    { pattern: /"[^"]*"/g, placeholder: '___QUOTED___' },
    { pattern: /'[^']*'/g, placeholder: '___SQUOTED___' },
    { pattern: /「[^」]*」/g, placeholder: '___CNQUOTED___' },
    { pattern: /『[^』]*』/g, placeholder: '___CNQUOTED2___' }
  ]

  // 应用保护模式 / Apply protection patterns
  let processedText = text
  const protectedValues: string[] = []

  protectedPatterns.forEach(({ pattern, placeholder }) => {
    processedText = processedText.replace(pattern, (match) => {
      const index = protectedValues.length
      protectedValues.push(match)
      return `${placeholder}${index}`
    })
  })

  // 恢复函数 / Restore function
  const restoreProtectedContent = (segment: string): string => {
    let restored = segment
    protectedPatterns.forEach(({ placeholder }) => {
      const regex = new RegExp(`${placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\d+)`, 'g')
      restored = restored.replace(regex, (match, index) => {
        return protectedValues[parseInt(index)] || match
      })
    })
    return restored
  }

  // 智能句子分割 / Smart sentence splitting
  const splitBySentences = (text: string): string[] => {
    // 中文句子分割（句号、感叹号、问号）/ Chinese sentence splitting
    const chineseSentencePattern = /(?<=[。！？])\s*/

    // 英文句子分割（更精确的模式）/ English sentence splitting (more precise pattern)
    // 匹配句号后跟空格和大写字母，但不匹配缩写后的点 / Match period followed by space and capital letter, but not abbreviations
    const englishSentencePattern = /(?<=[^A-Z][.!?])\s+(?=[A-Z])/

    // 先尝试中文分割 / Try Chinese splitting first
    let segments = text.split(chineseSentencePattern).filter((seg) => seg && seg.trim())
    if (segments.length > 1) {
      return segments
    }

    // 再尝试英文分割 / Try English splitting
    segments = text.split(englishSentencePattern).filter((seg) => seg && seg.trim())
    if (segments.length > 1) {
      return segments
    }

    return [text]
  }

  // 智能短语分割（增加长度检查）/ Smart phrase splitting (with length check)
  const splitByPhrases = (text: string): string[] => {
    // 按逗号、分号、冒号等分割，但要考虑上下文 / Split by comma, semicolon, colon etc., considering context
    const phrasePattern = /(?<=[,，;；:：])\s*/
    const segments = text.split(phrasePattern).filter((seg) => seg && seg.trim())

    // 如果分割后段数过多或平均长度太短，则不分割 / Don't split if too many segments or average length too short
    if (segments.length > 2 && segments.some((seg) => seg.trim().length < 15)) {
      return [text]
    }

    return segments.length > 1 ? segments : [text]
  }

  // 智能单词分割（处理超长文本）/ Smart word splitting (handle very long text)
  const splitByWords = (text: string): string[] => {
    const maxSegmentLength = 40
    const segments: string[] = []

    // 尝试按空格分割 / Try splitting by spaces
    const words = text.split(/\s+/)
    let currentSegment = ''

    for (const word of words) {
      const testSegment = currentSegment ? `${currentSegment} ${word}` : word

      if (testSegment.length <= maxSegmentLength) {
        currentSegment = testSegment
      } else {
        if (currentSegment) {
          segments.push(currentSegment)
          currentSegment = word
        } else {
          // 单个词太长，强制分割 / Single word too long, force split
          for (let i = 0; i < word.length; i += maxSegmentLength) {
            segments.push(word.substring(i, Math.min(i + maxSegmentLength, word.length)))
          }
          currentSegment = ''
        }
      }
    }

    if (currentSegment) {
      segments.push(currentSegment)
    }

    return segments.length > 1 ? segments : [text]
  }

  // 分割质量评估（增强版）/ Segmentation quality evaluation (enhanced)
  const evaluateSegmentation = (segments: string[]): boolean => {
    // 如果只有一个片段，不需要评估 / No evaluation needed for single segment
    if (segments.length <= 1) return true

    // 限制最大行数为2行（字幕通常不应超过2行）/ Limit to 2 lines max (subtitles should not exceed 2 lines)
    if (segments.length > 2) {
      return false
    }

    // 检查是否有太多短片段（可能是过度分割）/ Check for too many short segments (possible over-segmentation)
    const shortSegments = segments.filter((seg) => seg.trim().length < 8)
    if (shortSegments.length > segments.length * 0.3) {
      return false
    }

    // 检查是否有空片段 / Check for empty segments
    if (segments.some((seg) => !seg.trim())) {
      return false
    }

    // 检查分割是否有意义（避免在单词中间分割）/ Check if splitting makes sense (avoid mid-word splits)
    const hasWordBreaks = segments.some((seg) => {
      const trimmed = seg.trim()
      return trimmed.endsWith('-') || trimmed.startsWith('-')
    })

    if (hasWordBreaks) {
      return false
    }

    // 检查分割后的长度平衡性 / Check length balance after splitting
    const avgLength = segments.reduce((sum, seg) => sum + seg.length, 0) / segments.length
    const hasUnbalancedSegments = segments.some(
      (seg) => seg.length < avgLength * 0.3 || seg.length > avgLength * 2
    )

    if (hasUnbalancedSegments) {
      return false
    }

    return true
  }

  // 主分割逻辑 / Main splitting logic
  try {
    // 1. 首先尝试句子分割 / First try sentence splitting
    let segments = splitBySentences(processedText)

    if (segments.length > 1 && evaluateSegmentation(segments)) {
      return segments.map(restoreProtectedContent).filter((seg) => seg.trim())
    }

    // 2. 尝试短语分割（更严格的条件）/ Try phrase splitting (stricter conditions)
    segments = splitByPhrases(processedText)

    if (segments.length > 1 && evaluateSegmentation(segments)) {
      return segments.map(restoreProtectedContent).filter((seg) => seg.trim())
    }

    // 3. 最后尝试单词分割（仅在文本过长时）/ Finally try word splitting (only for very long text)
    if (processedText.length > 80) {
      segments = splitByWords(processedText)

      if (segments.length > 1 && evaluateSegmentation(segments)) {
        return segments.map(restoreProtectedContent).filter((seg) => seg.trim())
      }
    }

    // 4. 如果所有分割都失败，返回原文本 / If all splitting fails, return original text
    return [restoreProtectedContent(processedText)]
  } catch (error) {
    // 如果分割过程中出现错误，返回原文本 / If error occurs during splitting, return original text
    console.warn('智能分段出现错误:', error)
    return [text]
  }
}
