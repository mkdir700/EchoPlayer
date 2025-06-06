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
  className?: string
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

  // 尝试按句子分段（中文句号、英文句号、问号、感叹号等）
  const sentenceSegments = text.split(/(?<=[。.!?！？])\s*/)
  if (sentenceSegments.length > 1) {
    return sentenceSegments.filter((segment) => segment.trim().length > 0)
  }

  // 如果没有句子分隔符，尝试按逗号、分号等分段
  const phraseSegments = text.split(/(?<=[,，;；])\s*/)
  if (phraseSegments.length > 1) {
    return phraseSegments.filter((segment) => segment.trim().length > 0)
  }

  // 如果没有标点符号，按固定长度分段
  const segments: string[] = []
  const maxSegmentLength = 30

  for (let i = 0; i < text.length; i += maxSegmentLength) {
    segments.push(text.substring(i, Math.min(i + maxSegmentLength, text.length)))
  }

  return segments
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

  useEffect(() => {
    if (containerRef.current && textRef.current) {
      // 检查文本是否超出容器
      const isOverflowing =
        textRef.current.scrollWidth > containerRef.current.clientWidth ||
        textRef.current.scrollHeight > containerRef.current.clientHeight

      // 如果文本长度超过阈值或者溢出，则需要分段
      setNeedsSegmentation(isOverflowing || text.length > 50)
    }
  }, [text])

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

// 自定义比较函数，只比较文本内容和样式
const areSubtitlePropsEqual = (
  prevProps: SubtitleTextProps,
  nextProps: SubtitleTextProps
): boolean => {
  return (
    prevProps.text === nextProps.text &&
    JSON.stringify(prevProps.style) === JSON.stringify(nextProps.style) &&
    prevProps.className === nextProps.className
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

// 双语字幕行自定义比较函数
const areBilingualPropsEqual = (
  prevProps: BilingualLineProps,
  nextProps: BilingualLineProps
): boolean => {
  return (
    prevProps.text === nextProps.text &&
    JSON.stringify(prevProps.style) === JSON.stringify(nextProps.style) &&
    prevProps.language === nextProps.language
  )
}

// 占位符接口
interface SubtitlePlaceholderProps {
  message: string
}

// 占位符比较函数
const arePlaceholderPropsEqual = (
  prevProps: SubtitlePlaceholderProps,
  nextProps: SubtitlePlaceholderProps
): boolean => {
  return prevProps.message === nextProps.message
}

// 原始字幕文本组件
export const OriginalSubtitleText = React.memo<SubtitleTextProps>(
  ({ text, style, onWordHover, onWordClick }) => {
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
  },
  areSubtitlePropsEqual
)

// 中文字幕文本组件
export const ChineseSubtitleText = React.memo<SubtitleTextProps>(
  ({ text, style, onWordHover, onWordClick }) => {
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
  },
  areSubtitlePropsEqual
)

// 英文字幕文本组件
export const EnglishSubtitleText = React.memo<SubtitleTextProps>(
  ({ text, style, onWordHover, onWordClick }) => {
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
  },
  areSubtitlePropsEqual
)

// 双语字幕行组件
export const BilingualSubtitleLine = React.memo<BilingualLineProps>(
  ({ text, style, onWordHover, onWordClick, language }) => {
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
  },
  areBilingualPropsEqual
)

// 占位符组件
export const SubtitlePlaceholder = React.memo<SubtitlePlaceholderProps>(({ message }) => {
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
}, arePlaceholderPropsEqual)

OriginalSubtitleText.displayName = 'OriginalSubtitleText'
ChineseSubtitleText.displayName = 'ChineseSubtitleText'
EnglishSubtitleText.displayName = 'EnglishSubtitleText'
BilingualSubtitleLine.displayName = 'BilingualSubtitleLine'
SubtitlePlaceholder.displayName = 'SubtitlePlaceholder'
