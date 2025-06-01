import React, { useMemo } from 'react'
import { Typography } from 'antd'
import type { SubtitleItem } from '@types_/shared'
import type { DisplayMode } from '@renderer/types'
import { splitTextIntoWords } from '@renderer/utils/subtitleTextUtils'
import styles from './Subtitle.module.css'

const { Text } = Typography

interface SubtitleContentProps {
  currentSubtitle: SubtitleItem | null
  displayMode: DisplayMode
  dynamicTextStyle: React.CSSProperties
  dynamicEnglishTextStyle: React.CSSProperties
  dynamicChineseTextStyle: React.CSSProperties
  onWordHover: (isHovering: boolean) => void
  onWordClick: (word: string, event: React.MouseEvent) => void
}

export const SubtitleContent: React.FC<SubtitleContentProps> = ({
  currentSubtitle,
  displayMode,
  dynamicTextStyle,
  dynamicEnglishTextStyle,
  dynamicChineseTextStyle,
  onWordHover,
  onWordClick
}) => {
  // 根据显示模式渲染字幕内容
  const renderSubtitleContent = useMemo(() => {
    if (!currentSubtitle || displayMode === 'none') {
      return (
        <div className={styles.subtitlePlaceholder}>
          <Text className={styles.subtitleHidden}>
            {displayMode === 'none' ? '字幕已隐藏 - 悬停显示控制' : '等待字幕 - 悬停显示控制'}
          </Text>
        </div>
      )
    }

    const { text, englishText, chineseText } = currentSubtitle

    switch (displayMode) {
      case 'original':
        return (
          <div className={styles.subtitleContentOriginal}>
            <Text className={styles.subtitleText} style={dynamicTextStyle}>
              {splitTextIntoWords(text, onWordHover, onWordClick)}
            </Text>
          </div>
        )

      case 'chinese':
        if (chineseText) {
          return (
            <div className={styles.subtitleContentChinese}>
              <Text className={styles.subtitleText} style={dynamicChineseTextStyle}>
                {splitTextIntoWords(chineseText, onWordHover, onWordClick)}
              </Text>
            </div>
          )
        }
        return (
          <div className={styles.subtitlePlaceholder}>
            <Text className={styles.subtitleHidden}>没有中文字幕</Text>
          </div>
        )

      case 'english':
        if (englishText) {
          return (
            <div className={styles.subtitleContentEnglish}>
              <Text className={styles.subtitleText} style={dynamicEnglishTextStyle}>
                {splitTextIntoWords(englishText, onWordHover, onWordClick)}
              </Text>
            </div>
          )
        }
        return (
          <div className={styles.subtitlePlaceholder}>
            <Text className={styles.subtitleHidden}>没有英文字幕</Text>
          </div>
        )

      case 'bilingual':
        return (
          <div className={styles.subtitleContentBilingual}>
            {englishText && (
              <div className={`${styles.subtitleLine} english`}>
                <Text className={`${styles.subtitleText} english`} style={dynamicEnglishTextStyle}>
                  {splitTextIntoWords(englishText, onWordHover, onWordClick)}
                </Text>
              </div>
            )}
            {chineseText && (
              <div className={`${styles.subtitleLine} chinese`}>
                <Text className={`${styles.subtitleText} chinese`} style={dynamicChineseTextStyle}>
                  {splitTextIntoWords(chineseText, onWordHover, onWordClick)}
                </Text>
              </div>
            )}
            {!englishText && !chineseText && (
              <div className={`${styles.subtitleLine} original`}>
                <Text className={styles.subtitleText} style={dynamicTextStyle}>
                  {splitTextIntoWords(text, onWordHover, onWordClick)}
                </Text>
              </div>
            )}
          </div>
        )

      default:
        return null
    }
  }, [
    currentSubtitle,
    displayMode,
    dynamicTextStyle,
    dynamicEnglishTextStyle,
    dynamicChineseTextStyle,
    onWordHover,
    onWordClick
  ])

  return <>{renderSubtitleContent}</>
}
