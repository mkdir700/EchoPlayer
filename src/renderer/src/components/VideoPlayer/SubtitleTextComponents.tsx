import React, { useState, useEffect, useRef } from 'react'
import { Typography } from 'antd'
import { useTheme } from '@renderer/hooks/useTheme'
import RendererLogger from '@renderer/utils/logger'

const { Text } = Typography

interface SubtitleTextProps {
  text: string
  style: React.CSSProperties
  onWordHover: (isHovering: boolean) => void
  onWordClick: (word: string, event: React.MouseEvent) => void
}

// Word wrapper component to handle hover states with theme system
const WordWrapper: React.FC<{
  children: React.ReactNode
  isClickable: boolean
  onWordHover: (isHovering: boolean) => void
  onWordClick?: (event: React.MouseEvent) => void
}> = ({ children, isClickable, onWordHover, onWordClick }) => {
  const { styles } = useTheme()
  const [isHovered, setIsHovered] = useState(false)

  const handleMouseEnter = (): void => {
    setIsHovered(true)
    onWordHover(true)
  }

  const handleMouseLeave = (): void => {
    setIsHovered(false)
    onWordHover(false)
  }

  const baseStyle = {
    ...styles.subtitleWord,
    ...(isClickable ? styles.subtitleWordClickable : {})
  }

  const hoverStyle = isHovered
    ? isClickable
      ? styles.subtitleWordClickableHover
      : styles.subtitleWordHover
    : {}

  return (
    <span
      style={{ ...baseStyle, ...hoverStyle }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onWordClick}
    >
      {children}
    </span>
  )
}

// 智能分段函数
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

// Enhanced text splitting function with theme integration
const splitTextWithTheme = (
  text: string,
  onWordHover: (isHovering: boolean) => void,
  onWordClick: (word: string, event: React.MouseEvent) => void
): React.ReactNode[] => {
  const isChineseText = /[\u4e00-\u9fff]/.test(text)

  if (isChineseText) {
    return text.split('').map((char, index) => {
      const isClickableChar = char.trim() !== '' && /[\u4e00-\u9fff]/.test(char)

      return (
        <WordWrapper
          key={index}
          isClickable={isClickableChar}
          onWordHover={onWordHover}
          onWordClick={
            isClickableChar
              ? (e: React.MouseEvent) => {
                  e.stopPropagation()
                  e.preventDefault()
                  onWordClick(char, e)
                }
              : undefined
          }
        >
          {char}
        </WordWrapper>
      )
    })
  } else {
    return text.split(/(\s+)/).map((word, index) => {
      if (word.trim() === '') {
        return <span key={index}>{word}</span>
      }

      const trimWord = word.replace(/^[^\w\s]+|[^\w\s]+$/g, '')
      const isClickableWord = trimWord.trim() !== ''

      return (
        <WordWrapper
          key={index}
          isClickable={isClickableWord}
          onWordHover={onWordHover}
          onWordClick={
            isClickableWord
              ? (e: React.MouseEvent) => {
                  e.stopPropagation()
                  e.preventDefault()
                  onWordClick(trimWord, e)
                }
              : undefined
          }
        >
          {word}
        </WordWrapper>
      )
    })
  }
}

// 智能文本组件
const SmartTextContent: React.FC<{
  text: string
  style: React.CSSProperties
  onWordHover: (isHovering: boolean) => void
  onWordClick: (word: string, event: React.MouseEvent) => void
}> = ({ text, style, onWordHover, onWordClick }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLDivElement>(null)
  const [needsSegmentation, setNeedsSegmentation] = useState(false)
  const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 })

  // Use ResizeObserver to monitor container size changes
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        setContainerDimensions((prev) => {
          // Only update if dimensions actually changed to avoid unnecessary re-renders
          if (prev.width !== width || prev.height !== height) {
            return { width, height }
          }
          return prev
        })
      }
    })

    resizeObserver.observe(container)

    return () => {
      resizeObserver.disconnect()
    }
  }, [])

  useEffect(() => {
    if (containerRef.current && textRef.current) {
      // 检查文本是否超出容器
      const isOverflowing =
        textRef.current.scrollWidth > containerRef.current.clientWidth ||
        textRef.current.scrollHeight > containerRef.current.clientHeight

      // 如果文本长度超过阈值或者溢出，则需要分段
      setNeedsSegmentation(isOverflowing || text.length > 50)
    }
  }, [text, containerDimensions, style.fontSize]) // Add containerDimensions and fontSize as dependencies

  if (!needsSegmentation) {
    return (
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Text ref={textRef} style={style}>
          {splitTextWithTheme(text, onWordHover, onWordClick)}
        </Text>
      </div>
    )
  }

  // 如果需要分段，使用智能分段逻辑
  const segments = segmentText(text)

  return (
    <div
      ref={containerRef}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        overflow: 'hidden'
      }}
    >
      {segments.map((segment, index) => (
        <div
          key={index}
          style={{
            ...style,
            fontSize:
              segments.length > 1
                ? `calc(${parseFloat(style.fontSize as string) * (1 - 0.1 * Math.min(segments.length - 1, 2))}rem)`
                : style.fontSize,
            marginBottom: index < segments.length - 1 ? '4px' : 0,
            lineHeight: segments.length > 1 ? 1.3 : style.lineHeight || 'inherit',
            textAlign: 'center',
            width: '100%',
            wordBreak: 'break-word',
            overflowWrap: 'break-word'
          }}
        >
          {splitTextWithTheme(segment, onWordHover, onWordClick)}
        </div>
      ))}
    </div>
  )
}

// 双语字幕行接口
interface BilingualLineProps {
  text: string
  style: React.CSSProperties
  onWordHover: (isHovering: boolean) => void
  onWordClick: (word: string, event: React.MouseEvent) => void
  language: 'english' | 'chinese' | 'original'
}

// 原始字幕文本组件
export const OriginalSubtitleText: React.FC<SubtitleTextProps> = ({
  text,
  style,
  onWordHover,
  onWordClick
}) => {
  const { styles } = useTheme()

  RendererLogger.componentRender({
    component: 'OriginalSubtitleText',
    props: { text: text.substring(0, 20) + '...' }
  })

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
    textAlign: 'center',
    overflow: 'hidden',
    boxSizing: 'border-box'
  }

  return (
    <div style={containerStyle}>
      <SmartTextContent
        text={text}
        style={{ ...styles.subtitleText, ...style }}
        onWordHover={onWordHover}
        onWordClick={onWordClick}
      />
    </div>
  )
}

// 中文字幕文本组件
export const ChineseSubtitleText: React.FC<SubtitleTextProps> = ({
  text,
  style,
  onWordHover,
  onWordClick
}) => {
  const { styles } = useTheme()

  RendererLogger.componentRender({
    component: 'ChineseSubtitleText',
    props: { text: text.substring(0, 20) + '...' }
  })

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
    textAlign: 'center',
    overflow: 'hidden',
    boxSizing: 'border-box'
  }

  return (
    <div style={containerStyle}>
      <SmartTextContent
        text={text}
        style={{ ...styles.subtitleText, ...styles.subtitleTextChinese, ...style }}
        onWordHover={onWordHover}
        onWordClick={onWordClick}
      />
    </div>
  )
}

// 英文字幕文本组件
export const EnglishSubtitleText: React.FC<SubtitleTextProps> = ({
  text,
  style,
  onWordHover,
  onWordClick
}) => {
  const { styles } = useTheme()

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
    textAlign: 'center',
    overflow: 'hidden',
    boxSizing: 'border-box'
  }

  return (
    <div style={containerStyle}>
      <SmartTextContent
        text={text}
        style={{ ...styles.subtitleText, ...styles.subtitleTextEnglish, ...style }}
        onWordHover={onWordHover}
        onWordClick={onWordClick}
      />
    </div>
  )
}

// 双语字幕行组件
export const BilingualSubtitleLine: React.FC<BilingualLineProps> = ({
  text,
  style,
  onWordHover,
  onWordClick,
  language
}) => {
  const { styles } = useTheme()

  const lineStyle: React.CSSProperties = {
    width: '100%',
    textAlign: 'center',
    margin: 0,
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2px',
    boxSizing: 'border-box'
  }

  const getTextStyle = (): React.CSSProperties => {
    const baseStyle = { ...styles.subtitleText, ...style }
    switch (language) {
      case 'english':
        return { ...baseStyle, ...styles.subtitleTextEnglish }
      case 'chinese':
        return { ...baseStyle, ...styles.subtitleTextChinese }
      default:
        return baseStyle
    }
  }

  return (
    <div style={lineStyle}>
      <SmartTextContent
        text={text}
        style={getTextStyle()}
        onWordHover={onWordHover}
        onWordClick={onWordClick}
      />
    </div>
  )
}

// 占位符接口
interface SubtitlePlaceholderProps {
  message: string
}

// 占位符组件
export const SubtitlePlaceholder: React.FC<SubtitlePlaceholderProps> = ({ message }) => {
  const { styles } = useTheme()

  const placeholderStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
    color: 'rgba(255, 255, 255, 0.4)',
    fontStyle: 'italic',
    textShadow: '0 1px 2px rgba(0, 0, 0, 0.6)'
  }

  return (
    <div style={placeholderStyle}>
      <Text style={styles.subtitleTextHidden}>{message}</Text>
    </div>
  )
}

OriginalSubtitleText.displayName = 'OriginalSubtitleText'
ChineseSubtitleText.displayName = 'ChineseSubtitleText'
EnglishSubtitleText.displayName = 'EnglishSubtitleText'
BilingualSubtitleLine.displayName = 'BilingualSubtitleLine'
SubtitlePlaceholder.displayName = 'SubtitlePlaceholder'
