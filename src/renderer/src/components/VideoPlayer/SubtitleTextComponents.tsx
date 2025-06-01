import React from 'react'
import { Typography } from 'antd'
import { splitTextIntoWords } from '@renderer/utils/subtitleTextUtils'
import RendererLogger from '@renderer/utils/logger'
import styles from './Subtitle.module.css'

const { Text } = Typography

interface SubtitleTextProps {
  text: string
  style: React.CSSProperties
  onWordHover: (isHovering: boolean) => void
  onWordClick: (word: string, event: React.MouseEvent) => void
  className?: string
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
  ({ text, style, onWordHover, onWordClick, className = styles.subtitleContentOriginal }) => {
    RendererLogger.componentRender({
      component: 'OriginalSubtitleText',
      props: { text: text.substring(0, 20) + '...' }
    })

    return (
      <div className={className}>
        <Text className={styles.subtitleText} style={style}>
          {splitTextIntoWords(text, onWordHover, onWordClick)}
        </Text>
      </div>
    )
  },
  areSubtitlePropsEqual
)

// 中文字幕文本组件
export const ChineseSubtitleText = React.memo<SubtitleTextProps>(
  ({ text, style, onWordHover, onWordClick, className = styles.subtitleContentChinese }) => {
    RendererLogger.componentRender({
      component: 'ChineseSubtitleText',
      props: { text: text.substring(0, 20) + '...' }
    })

    return (
      <div className={className}>
        <Text className={styles.subtitleText} style={style}>
          {splitTextIntoWords(text, onWordHover, onWordClick)}
        </Text>
      </div>
    )
  },
  areSubtitlePropsEqual
)

// 英文字幕文本组件
export const EnglishSubtitleText = React.memo<SubtitleTextProps>(
  ({ text, style, onWordHover, onWordClick, className = styles.subtitleContentEnglish }) => (
    <div className={className}>
      <Text className={styles.subtitleText} style={style}>
        {splitTextIntoWords(text, onWordHover, onWordClick)}
      </Text>
    </div>
  ),
  areSubtitlePropsEqual
)

// 双语字幕行组件
export const BilingualSubtitleLine = React.memo<BilingualLineProps>(
  ({ text, style, onWordHover, onWordClick, language }) => (
    <div className={`${styles.subtitleLine} ${language}`}>
      <Text className={`${styles.subtitleText} ${language}`} style={style}>
        {splitTextIntoWords(text, onWordHover, onWordClick)}
      </Text>
    </div>
  ),
  areBilingualPropsEqual
)

// 占位符组件
export const SubtitlePlaceholder = React.memo<SubtitlePlaceholderProps>(
  ({ message }) => (
    <div className={styles.subtitlePlaceholder}>
      <Text className={styles.subtitleHidden}>{message}</Text>
    </div>
  ),
  arePlaceholderPropsEqual
)

OriginalSubtitleText.displayName = 'OriginalSubtitleText'
ChineseSubtitleText.displayName = 'ChineseSubtitleText'
EnglishSubtitleText.displayName = 'EnglishSubtitleText'
BilingualSubtitleLine.displayName = 'BilingualSubtitleLine'
SubtitlePlaceholder.displayName = 'SubtitlePlaceholder'
