import React from 'react'
import styles from '../components/VideoPlayer/Subtitle.module.css'

// 检测文本是否主要包含中文字符
export const isChinese = (text: string): boolean => {
  const chineseRegex = /[\u4e00-\u9fff]/g
  const chineseMatches = text.match(chineseRegex)
  const chineseCount = chineseMatches ? chineseMatches.length : 0
  const totalChars = text.replace(/\s/g, '').length
  return totalChars > 0 && chineseCount / totalChars > 0.5
}

// 将中文文本分割成字符
export const splitChineseText = (
  text: string,
  onWordHover: (isHovering: boolean) => void,
  onWordClick: (word: string, event: React.MouseEvent) => void
): React.ReactNode[] => {
  return text.split('').map((char, index) => {
    const isClickableChar = char.trim() !== '' && /[\u4e00-\u9fff]/.test(char)

    return (
      <span
        key={index}
        className={`${styles.subtitleWord} ${isClickableChar ? styles.clickableWord : ''}`}
        onMouseEnter={() => onWordHover(true)}
        onMouseLeave={() => onWordHover(false)}
        onClick={
          isClickableChar
            ? (e: React.MouseEvent) => {
                e.stopPropagation()
                e.preventDefault()
                onWordClick(char, e)
              }
            : undefined
        }
        style={{ cursor: isClickableChar ? 'pointer' : 'default' }}
      >
        {char}
      </span>
    )
  })
}

// 将英文文本分割成单词
export const splitEnglishText = (
  text: string,
  onWordHover: (isHovering: boolean) => void,
  onWordClick: (word: string, event: React.MouseEvent) => void
): React.ReactNode[] => {
  const words = text.split(/(\s+)/).map((word, index) => {
    if (word.trim() === '') {
      return <span key={index}>{word}</span>
    }

    // 一个单词的首尾不应该有特殊符号
    const trimWord = word.replace(/^[^\w\s]+|[^\w\s]+$/g, '')
    const isClickableWord = trimWord.trim() !== ''

    return (
      <span
        key={index}
        className={`${styles.subtitleWord} ${isClickableWord ? styles.clickableWord : ''}`}
        onMouseEnter={() => onWordHover(true)}
        onMouseLeave={() => onWordHover(false)}
        onClick={
          isClickableWord
            ? (e: React.MouseEvent) => {
                e.stopPropagation()
                e.preventDefault()
                onWordClick(trimWord, e)
              }
            : undefined
        }
        style={{ cursor: isClickableWord ? 'pointer' : 'default' }}
      >
        {word}
      </span>
    )
  })

  return words
}

// 智能分割文本（根据语言类型选择分割方式）
export const splitTextIntoWords = (
  text: string,
  onWordHover: (isHovering: boolean) => void,
  onWordClick: (word: string, event: React.MouseEvent) => void
): React.ReactNode[] => {
  if (isChinese(text)) {
    return splitChineseText(text, onWordHover, onWordClick)
  } else {
    return splitEnglishText(text, onWordHover, onWordClick)
  }
}
