import React, { useMemo } from 'react'
import { useCurrentSubtitleDisplayContext } from '@renderer/hooks/useCurrentSubtitleDisplayContext'
import {
  OriginalSubtitleText,
  ChineseSubtitleText,
  EnglishSubtitleText,
  BilingualSubtitleLine
} from './SubtitleTextComponents'

import { useSubtitleDisplayModeControls } from '@renderer/hooks/useSubtitleDisplayMode'

interface SubtitleContentProps {
  dynamicTextStyle: React.CSSProperties
  dynamicEnglishTextStyle: React.CSSProperties
  dynamicChineseTextStyle: React.CSSProperties
  onWordHover: (isHovering: boolean) => void
  onWordClick: (word: string, event: React.MouseEvent) => void
}

export const SubtitleContent: React.FC<SubtitleContentProps> = ({
  dynamicTextStyle,
  dynamicEnglishTextStyle,
  dynamicChineseTextStyle,
  onWordHover,
  onWordClick
}) => {
  const { displayMode } = useSubtitleDisplayModeControls()
  // 使用新的当前字幕显示hook
  const { currentDisplaySubtitle: currentSubtitle } = useCurrentSubtitleDisplayContext()

  // 根据显示模式渲染字幕内容
  const renderSubtitleContent = useMemo(() => {
    if (!currentSubtitle || displayMode === 'none') {
      return <></>
    }

    const { text, englishText, chineseText } = currentSubtitle

    switch (displayMode) {
      case 'original':
        return (
          <OriginalSubtitleText
            text={text}
            style={dynamicTextStyle}
            onWordHover={onWordHover}
            onWordClick={onWordClick}
          />
        )

      case 'chinese':
        if (chineseText) {
          return (
            <ChineseSubtitleText
              text={chineseText}
              style={dynamicChineseTextStyle}
              onWordHover={onWordHover}
              onWordClick={onWordClick}
            />
          )
        }
        return <></>

      case 'english':
        if (englishText) {
          return (
            <EnglishSubtitleText
              text={englishText}
              style={dynamicEnglishTextStyle}
              onWordHover={onWordHover}
              onWordClick={onWordClick}
            />
          )
        }
        return <></>

      case 'bilingual':
        return (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              height: '100%',
              gap: '8px',
              overflow: 'hidden'
            }}
          >
            {englishText && (
              <BilingualSubtitleLine
                text={englishText}
                style={dynamicEnglishTextStyle}
                onWordHover={onWordHover}
                onWordClick={onWordClick}
                language="english"
              />
            )}
            {chineseText && (
              <BilingualSubtitleLine
                text={chineseText}
                style={dynamicChineseTextStyle}
                onWordHover={onWordHover}
                onWordClick={onWordClick}
                language="chinese"
              />
            )}
            {!englishText && !chineseText && (
              <BilingualSubtitleLine
                text={text}
                style={dynamicTextStyle}
                onWordHover={onWordHover}
                onWordClick={onWordClick}
                language="original"
              />
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
