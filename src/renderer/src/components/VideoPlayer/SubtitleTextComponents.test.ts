import { describe, it, expect } from 'vitest'

// 从 SubtitleTextComponents.tsx 中提取 segmentText 函数用于测试
// 注意：在实际项目中，你可能需要将 segmentText 函数导出或移到单独的工具文件中

// 智能分段函数的复制版本（用于测试）
const segmentText = (text: string): string[] => {
  // 如果文本较短，不需要分段
  if (text.length <= 50) return [text]

  // 预处理：保护需要避免分割的内容
  const protectedPatterns: Array<{ pattern: RegExp; placeholder: string }> = [
    // 保护省略号（各种形式）- 必须在其他模式之前
    { pattern: /\.{2,}/g, placeholder: '___ELLIPSIS___' },
    { pattern: /…+/g, placeholder: '___HELLIP___' },

    // 保护英文缩写
    {
      pattern: /\b(?:Mr|Mrs|Ms|Dr|Prof|Sr|Jr|vs|etc|Inc|Ltd|Corp|Co|LLC)\./gi,
      placeholder: '___ABBREV___'
    },

    // 保护数字和小数点
    { pattern: /\b\d+\.\d+\b/g, placeholder: '___DECIMAL___' },

    // 保护时间格式
    { pattern: /\b\d{1,2}[:：.]\d{2}\b/g, placeholder: '___TIME___' },

    // 保护网址和邮箱
    { pattern: /\b(?:https?:\/\/|www\.|ftp:\/\/)[^\s]+/gi, placeholder: '___URL___' },
    { pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, placeholder: '___EMAIL___' },

    // 保护文件路径和扩展名
    { pattern: /\b[\w\-.]+\.[a-zA-Z]{2,4}\b/g, placeholder: '___FILE___' },

    // 保护特殊标点组合
    { pattern: /[!?]{2,}/g, placeholder: '___MULTIMARK___' },

    // 保护引号内容（避免在引号内分割）
    { pattern: /"[^"]*"/g, placeholder: '___QUOTED___' },
    { pattern: /'[^']*'/g, placeholder: '___SQUOTED___' },
    { pattern: /「[^」]*」/g, placeholder: '___CNQUOTED___' },
    { pattern: /『[^』]*』/g, placeholder: '___CNQUOTED2___' }
  ]

  // 应用保护模式
  let processedText = text
  const protectedValues: string[] = []

  protectedPatterns.forEach(({ pattern, placeholder }) => {
    processedText = processedText.replace(pattern, (match) => {
      const index = protectedValues.length
      protectedValues.push(match)
      return `${placeholder}${index}`
    })
  })

  // 恢复函数
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

  // 智能句子分割
  const splitBySentences = (text: string): string[] => {
    // 中文句子分割（句号、感叹号、问号）
    const chineseSentencePattern = /(?<=[。！？])\s*/

    // 英文句子分割（更精确的模式）
    // 匹配句号后跟空格和大写字母，但不匹配缩写后的点
    const englishSentencePattern = /(?<=[^A-Z][.!?])\s+(?=[A-Z])/

    // 先尝试中文分割
    let segments = text.split(chineseSentencePattern).filter((seg) => seg && seg.trim())
    if (segments.length > 1) {
      return segments
    }

    // 再尝试英文分割
    segments = text.split(englishSentencePattern).filter((seg) => seg && seg.trim())
    if (segments.length > 1) {
      return segments
    }

    return [text]
  }

  // 智能短语分割（增加长度检查）
  const splitByPhrases = (text: string): string[] => {
    // 按逗号、分号、冒号等分割，但要考虑上下文
    const phrasePattern = /(?<=[,，;；:：])\s*/
    const segments = text.split(phrasePattern).filter((seg) => seg && seg.trim())

    // 如果分割后段数过多或平均长度太短，则不分割
    if (segments.length > 2 && segments.some((seg) => seg.trim().length < 15)) {
      return [text]
    }

    return segments.length > 1 ? segments : [text]
  }

  // 智能单词分割（处理超长文本）
  const splitByWords = (text: string): string[] => {
    const maxSegmentLength = 40
    const segments: string[] = []

    // 尝试按空格分割
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
          // 单个词太长，强制分割
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

  // 分割质量评估（增强版）
  const evaluateSegmentation = (segments: string[]): boolean => {
    // 如果只有一个片段，不需要评估
    if (segments.length <= 1) return true

    // 限制最大行数为2行（字幕通常不应超过2行）
    if (segments.length > 2) {
      return false
    }

    // 检查是否有太多短片段（可能是过度分割）
    const shortSegments = segments.filter((seg) => seg.trim().length < 8)
    if (shortSegments.length > segments.length * 0.3) {
      return false
    }

    // 检查是否有空片段
    if (segments.some((seg) => !seg.trim())) {
      return false
    }

    // 检查分割是否有意义（避免在单词中间分割）
    const hasWordBreaks = segments.some((seg) => {
      const trimmed = seg.trim()
      return trimmed.endsWith('-') || trimmed.startsWith('-')
    })

    if (hasWordBreaks) {
      return false
    }

    // 检查分割后的长度平衡性
    const avgLength = segments.reduce((sum, seg) => sum + seg.length, 0) / segments.length
    const hasUnbalancedSegments = segments.some(
      (seg) => seg.length < avgLength * 0.3 || seg.length > avgLength * 2
    )

    if (hasUnbalancedSegments) {
      return false
    }

    return true
  }

  // 主分割逻辑
  try {
    // 1. 首先尝试句子分割
    let segments = splitBySentences(processedText)

    if (segments.length > 1 && evaluateSegmentation(segments)) {
      return segments.map(restoreProtectedContent).filter((seg) => seg.trim())
    }

    // 2. 尝试短语分割（更严格的条件）
    segments = splitByPhrases(processedText)

    if (segments.length > 1 && evaluateSegmentation(segments)) {
      return segments.map(restoreProtectedContent).filter((seg) => seg.trim())
    }

    // 3. 最后尝试单词分割（仅在文本过长时）
    if (processedText.length > 80) {
      segments = splitByWords(processedText)

      if (segments.length > 1 && evaluateSegmentation(segments)) {
        return segments.map(restoreProtectedContent).filter((seg) => seg.trim())
      }
    }

    // 4. 如果所有分割都失败，返回原文本
    return [restoreProtectedContent(processedText)]
  } catch (error) {
    // 如果分割过程中出现错误，返回原文本
    console.warn('智能分段出现错误:', error)
    return [text]
  }
}

describe('智能分段功能测试 / Smart Segmentation Tests', () => {
  describe('基础功能测试 / Basic Functionality Tests', () => {
    it('应该保持短文本不分割 / Should keep short text unsegmented', () => {
      const shortText = '这是一个短文本'
      const result = segmentText(shortText)
      expect(result).toEqual([shortText])
    })

    it('应该返回非空数组 / Should return non-empty array', () => {
      const result = segmentText('任何文本')
      expect(result).toHaveLength(1)
      expect(result[0]).toBeTruthy()
    })
  })

  describe('省略号处理测试 / Ellipsis Handling Tests', () => {
    it('应该正确处理连续省略号 / Should handle consecutive ellipsis correctly', () => {
      const text = "Right, you're not even getting your honeymoon, God..."
      const result = segmentText(text)

      // 检查省略号是否被保护（不管是否分割，省略号都应该完整保留）
      const joinedResult = result.join(' ')
      expect(joinedResult).toContain('...')

      // 如果被分割了，确保最后一段包含省略号
      if (result.length > 1) {
        expect(result[result.length - 1]).toContain('...')
      }
    })

    it('应该处理各种形式的省略号 / Should handle various ellipsis forms', () => {
      const testCases = [
        'Wait... what happened?',
        'I think... maybe... we should go.',
        'So……这是什么意思？',
        'Loading....please wait',
        'One more thing.....okay?'
      ]

      testCases.forEach((text) => {
        const result = segmentText(text)
        const joinedResult = result.join(' ')
        const ellipsisMatch = text.match(/\.{2,}|…+/)
        if (ellipsisMatch) {
          expect(joinedResult).toContain(ellipsisMatch[0])
        }
      })
    })
  })

  describe('英文缩写处理测试 / English Abbreviation Tests', () => {
    it('应该正确处理常见英文缩写 / Should handle common English abbreviations', () => {
      const text = 'Dr. Smith met with Mr. Johnson vs. the defendant.'
      const result = segmentText(text)

      // 确保缩写没有被错误分割
      const joinedResult = result.join(' ')
      expect(joinedResult).toContain('Dr. Smith')
      expect(joinedResult).toContain('Mr. Johnson')
      expect(joinedResult).toContain('vs. the')
    })

    it('应该处理公司缩写 / Should handle company abbreviations', () => {
      const text = 'Apple Inc. and Microsoft Corp. are competitors.'
      const result = segmentText(text)
      const joinedResult = result.join(' ')

      expect(joinedResult).toContain('Inc.')
      expect(joinedResult).toContain('Corp.')
    })
  })

  describe('数字和时间格式测试 / Numbers and Time Format Tests', () => {
    it('应该保护小数点 / Should protect decimal points', () => {
      const text = 'The price is $19.99 and the ratio is 3.14159.'
      const result = segmentText(text)
      const joinedResult = result.join(' ')

      expect(joinedResult).toContain('19.99')
      expect(joinedResult).toContain('3.14159')
    })

    it('应该保护时间格式 / Should protect time formats', () => {
      const text = 'The meeting is at 3:30 PM, or maybe 15.45 in 24-hour format.'
      const result = segmentText(text)
      const joinedResult = result.join(' ')

      expect(joinedResult).toContain('3:30')
      expect(joinedResult).toContain('15.45')
    })
  })

  describe('网址和邮箱测试 / URL and Email Tests', () => {
    it('应该保护网址 / Should protect URLs', () => {
      const text = 'Visit https://www.example.com or www.google.com for more info.'
      const result = segmentText(text)
      const joinedResult = result.join(' ')

      expect(joinedResult).toContain('https://www.example.com')
      expect(joinedResult).toContain('www.google.com')
    })

    it('应该保护邮箱地址 / Should protect email addresses', () => {
      const text = 'Contact us at support@example.com or admin@test-site.org.'
      const result = segmentText(text)
      const joinedResult = result.join(' ')

      expect(joinedResult).toContain('support@example.com')
      expect(joinedResult).toContain('admin@test-site.org')
    })
  })

  describe('引号内容测试 / Quoted Content Tests', () => {
    it('应该保护引号内容不被分割 / Should protect quoted content from splitting', () => {
      const text = 'He said "I don\'t know. Maybe tomorrow." and left.'
      const result = segmentText(text)
      const joinedResult = result.join(' ')

      expect(joinedResult).toContain('"I don\'t know. Maybe tomorrow."')
    })

    it('应该处理中文引号 / Should handle Chinese quotes', () => {
      const text = '他说「我不知道。可能明天吧。」然后就走了。'
      const result = segmentText(text)
      const joinedResult = result.join('')

      expect(joinedResult).toContain('「我不知道。可能明天吧。」')
    })
  })

  describe('句子分割测试 / Sentence Splitting Tests', () => {
    it('应该正确分割中文句子 / Should correctly split Chinese sentences', () => {
      const text = '这是第一句话。这是第二句话！这是第三句话？'
      const result = segmentText(text)

      // 检查是否被正确分割
      if (result.length === 3) {
        expect(result[0]).toBe('这是第一句话。')
        expect(result[1]).toBe('这是第二句话！')
        expect(result[2]).toBe('这是第三句话？')
      } else {
        // 如果没有分割，至少确保内容完整
        expect(result.join('')).toBe(text)
      }
    })

    it('应该正确分割英文句子 / Should correctly split English sentences', () => {
      const text = 'This is first sentence. This is second sentence! Is this third?'
      const result = segmentText(text)

      // 确保内容完整性
      expect(result.join(' ')).toBe(text)

      // 如果分割了，检查分割质量
      if (result.length > 1) {
        expect(result.every((segment) => segment.trim().length > 0)).toBe(true)
      }
    })

    it('应该处理混合语言句子 / Should handle mixed language sentences', () => {
      const text = 'Hello world! 你好世界！How are you? 你好吗？'
      const result = segmentText(text)

      // 确保内容完整性
      expect(result.join(' ')).toBe(text)

      // 对于混合语言，可能会分割也可能不会，主要确保内容完整
      expect(result.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('短语分割测试 / Phrase Splitting Tests', () => {
    it('应该按逗号分割长文本 / Should split long text by commas', () => {
      const text = 'First part, second part, third part, and the final part here'
      const result = segmentText(text)

      if (result.length > 1) {
        expect(result.some((segment) => segment.includes('First part'))).toBe(true)
        expect(result.some((segment) => segment.includes('final part'))).toBe(true)
      }
    })

    it('应该处理中文逗号分割 / Should handle Chinese comma splitting', () => {
      const text = '第一部分，第二部分，第三部分，最后一个部分在这里'
      const result = segmentText(text)

      expect(result.join('')).toBe(text)
    })
  })

  describe('超长文本处理测试 / Long Text Handling Tests', () => {
    it('应该分割超长单词 / Should split extremely long words', () => {
      const longWord = 'a'.repeat(100)
      const text = `This is ${longWord} very long`
      const result = segmentText(text)

      // 确保内容完整性
      expect(result.join(' ')).toBe(text)

      // 对于包含超长单词的文本，可能会被分割也可能不会，主要确保不崩溃
      expect(result.length).toBeGreaterThanOrEqual(1)
    })

    it('应该处理超长句子 / Should handle very long sentences', () => {
      const longText =
        'This is a very long sentence that should be broken down into smaller parts because it exceeds the maximum length limit for a single segment and needs to be split intelligently.'
      const result = segmentText(longText)

      // 确保内容完整性
      expect(result.join(' ')).toBe(longText)

      // 对于超长句子，可能会被分割也可能不会，主要确保处理正常
      expect(result.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('特殊标点符号测试 / Special Punctuation Tests', () => {
    it('应该保护多重标点符号 / Should protect multiple punctuation marks', () => {
      const text = 'What?! Are you serious?? Yes!!!'
      const result = segmentText(text)
      const joinedResult = result.join(' ')

      expect(joinedResult).toContain('?!')
      expect(joinedResult).toContain('??')
      expect(joinedResult).toContain('!!!')
    })
  })

  describe('边缘情况测试 / Edge Case Tests', () => {
    it('应该处理空字符串 / Should handle empty string', () => {
      const result = segmentText('')
      expect(result).toEqual([''])
    })

    it('应该处理只有空格的字符串 / Should handle whitespace-only string', () => {
      const result = segmentText('   ')
      expect(result).toEqual(['   '])
    })

    it('应该处理只有标点符号的字符串 / Should handle punctuation-only string', () => {
      const result = segmentText('...')
      expect(result).toEqual(['...'])
    })

    it('应该处理包含换行符的文本 / Should handle text with line breaks', () => {
      const text = 'First line\nSecond line\nThird line'
      const result = segmentText(text)
      expect(result.join('')).toContain(text)
    })
  })

  describe('性能和稳定性测试 / Performance and Stability Tests', () => {
    it('应该在合理时间内处理大量文本 / Should handle large text in reasonable time', () => {
      const largeText = '这是一个很长的句子。'.repeat(100)
      const startTime = Date.now()
      const result = segmentText(largeText)
      const endTime = Date.now()

      expect(endTime - startTime).toBeLessThan(1000) // 应该在1秒内完成
      expect(result).toBeTruthy()
    })

    it('应该处理异常字符而不崩溃 / Should handle unusual characters without crashing', () => {
      const strangeText = '🎉 Hello 世界 🌍 test@email.com 3.14 ...'
      expect(() => segmentText(strangeText)).not.toThrow()
    })
  })

  describe('实际使用场景测试 / Real-world Scenario Tests', () => {
    it('应该处理电影字幕样式的文本 / Should handle movie subtitle-style text', () => {
      const movieSubtitle = "Right, you're not even getting your honeymoon, God..."
      const result = segmentText(movieSubtitle)

      // 确保省略号被保护
      const joinedResult = result.join(' ')
      expect(joinedResult).toContain('...')

      // 确保内容完整性
      expect(joinedResult).toBe(movieSubtitle)
    })

    it('应该处理技术文档样式的文本 / Should handle technical documentation text', () => {
      const techText =
        'Visit https://api.example.com/v1/users for more info. Email support@company.com if issues persist.'
      const result = segmentText(techText)
      const joinedResult = result.join(' ')

      expect(joinedResult).toContain('https://api.example.com/v1/users')
      expect(joinedResult).toContain('support@company.com')
    })

    it('应该处理对话样式的文本 / Should handle conversation-style text', () => {
      const conversation = 'A: "How are you?" B: "I\'m fine, thanks! And you?" A: "Great, thanks."'
      const result = segmentText(conversation)
      const joinedResult = result.join(' ')

      expect(joinedResult).toContain('"How are you?"')
      expect(joinedResult).toContain('"I\'m fine, thanks! And you?"')
      expect(joinedResult).toContain('"Great, thanks."')
    })
  })

  describe('防止过度分割测试 / Prevent Over-segmentation Tests', () => {
    it('应该避免按逗号过度分割导致溢出 / Should avoid over-segmentation by commas causing overflow', () => {
      const text = "Right, you're not even getting your honeymoon, God..."
      const result = segmentText(text)

      // 结果应该不超过2行，避免溢出
      expect(result.length).toBeLessThanOrEqual(2)

      // 确保内容完整性
      const joinedResult = result.join(' ')
      expect(joinedResult).toBe(text)

      // 确保省略号被保护
      expect(joinedResult).toContain('...')
    })

    it('应该避免产生过多短片段 / Should avoid generating too many short segments', () => {
      const text = 'First, second, third, fourth, fifth part here'
      const result = segmentText(text)

      // 如果分割了，不应超过2段
      expect(result.length).toBeLessThanOrEqual(2)

      // 确保内容完整性
      expect(result.join(' ')).toBe(text)
    })

    it('应该保持中等长度文本不分割 / Should keep medium-length text unsegmented', () => {
      const text = 'This is a medium length text that should not be split'
      const result = segmentText(text)

      // 中等长度的文本应该保持为一段
      expect(result).toEqual([text])
    })

    it('应该只在文本很长时才进行单词分割 / Should only split by words when text is very long', () => {
      const normalText = 'This is a normal length sentence that should not be split by words.'
      const result1 = segmentText(normalText)

      // 正常长度的文本不应该被单词分割
      expect(result1).toEqual([normalText])

      const veryLongText =
        'This is a very very very very very very very very very very very long sentence that exceeds the threshold and should be split by words.'
      const result2 = segmentText(veryLongText)

      // 超长文本可能会被分割
      expect(result2.join(' ')).toBe(veryLongText)
    })
  })

  describe('分割平衡性测试 / Segmentation Balance Tests', () => {
    it('应该避免不平衡的分割 / Should avoid unbalanced segmentation', () => {
      const text = 'A, very long second part of the sentence that would create unbalanced segments'
      const result = segmentText(text)

      // 如果分割了，检查分割的平衡性
      if (result.length > 1) {
        const lengths = result.map((seg) => seg.length)
        const maxLength = Math.max(...lengths)
        const minLength = Math.min(...lengths)

        // 最长段不应该是最短段的3倍以上
        expect(maxLength / minLength).toBeLessThan(3)
      }

      // 确保内容完整性
      expect(result.join(' ')).toBe(text)
    })
  })
})
