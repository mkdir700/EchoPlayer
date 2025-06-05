import React, { useState } from 'react'
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
      overflow: 'hidden'
    }

    return (
      <div style={containerStyle}>
        <Text style={{ ...styles.subtitleText, ...style }}>
          {splitTextWithTheme(text, onWordHover, onWordClick)}
        </Text>
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
      overflow: 'hidden'
    }

    return (
      <div style={containerStyle}>
        <Text style={{ ...styles.subtitleText, ...styles.subtitleTextChinese, ...style }}>
          {splitTextWithTheme(text, onWordHover, onWordClick)}
        </Text>
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
      overflow: 'hidden'
    }

    return (
      <div style={containerStyle}>
        <Text style={{ ...styles.subtitleText, ...styles.subtitleTextEnglish, ...style }}>
          {splitTextWithTheme(text, onWordHover, onWordClick)}
        </Text>
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
      justifyContent: 'center'
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
        <Text style={getTextStyle()}>{splitTextWithTheme(text, onWordHover, onWordClick)}</Text>
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
