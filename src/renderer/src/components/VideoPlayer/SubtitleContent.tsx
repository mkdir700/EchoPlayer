import React, { useMemo, memo } from 'react'
import { useCurrentSubtitleDisplayContext } from '@renderer/hooks/core/useCurrentSubtitleDisplayContext'
import {
  OriginalSubtitleText,
  ChineseSubtitleText,
  EnglishSubtitleText,
  BilingualSubtitleLine
} from './'

import { useSubtitleDisplayModeControls } from '@renderer/hooks/features/subtitle/useSubtitleDisplayMode'

interface SubtitleContentProps {
  dynamicTextStyle: React.CSSProperties
  dynamicEnglishTextStyle: React.CSSProperties
  dynamicChineseTextStyle: React.CSSProperties
  onWordHover: (isHovering: boolean) => void
  onWordClick: (word: string, event: React.MouseEvent) => void
  // 新增划词选中相关属性 / New text selection related props
  enableTextSelection?: boolean
  onSelectionChange?: (selectedText: string) => void
}

const SubtitleContentComponent: React.FC<SubtitleContentProps> = ({
  dynamicTextStyle,
  dynamicEnglishTextStyle,
  dynamicChineseTextStyle,
  onWordHover,
  onWordClick,
  enableTextSelection = false,
  onSelectionChange
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
            key={`original-${text.substring(0, 20)}`}
            text={text}
            style={dynamicTextStyle}
            onWordHover={onWordHover}
            onWordClick={onWordClick}
            enableTextSelection={enableTextSelection}
            onSelectionChange={onSelectionChange}
          />
        )

      case 'chinese':
        if (chineseText) {
          return (
            <ChineseSubtitleText
              key={`chinese-${chineseText.substring(0, 20)}`}
              text={chineseText}
              style={dynamicChineseTextStyle}
              onWordHover={onWordHover}
              onWordClick={onWordClick}
              enableTextSelection={false} // 译文不支持选中 / Translation doesn't support selection
              onSelectionChange={undefined}
            />
          )
        }
        return <></>

      case 'english':
        if (englishText) {
          return (
            <EnglishSubtitleText
              key={`english-${englishText.substring(0, 20)}`}
              text={englishText}
              style={dynamicEnglishTextStyle}
              onWordHover={onWordHover}
              onWordClick={onWordClick}
              enableTextSelection={enableTextSelection} // 英文作为原文支持选中 / English as original supports selection
              onSelectionChange={onSelectionChange}
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
                key={`bilingual-english-${englishText.substring(0, 20)}`}
                text={englishText}
                style={dynamicEnglishTextStyle}
                onWordHover={onWordHover}
                onWordClick={onWordClick}
                language="english"
                enableTextSelection={enableTextSelection} // 英文作为原文支持选中 / English as original supports selection
                onSelectionChange={onSelectionChange}
              />
            )}
            {chineseText && (
              <BilingualSubtitleLine
                key={`bilingual-chinese-${chineseText.substring(0, 20)}`}
                text={chineseText}
                style={dynamicChineseTextStyle}
                onWordHover={onWordHover}
                onWordClick={onWordClick}
                language="chinese"
                enableTextSelection={false} // 中文译文不支持选中 / Chinese translation doesn't support selection
                onSelectionChange={undefined}
              />
            )}
            {!englishText && !chineseText && (
              <BilingualSubtitleLine
                key={`bilingual-original-${text.substring(0, 20)}`}
                text={text}
                style={dynamicTextStyle}
                onWordHover={onWordHover}
                onWordClick={onWordClick}
                language="original"
                enableTextSelection={enableTextSelection} // 原文支持选中 / Original text supports selection
                onSelectionChange={onSelectionChange}
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
    onWordClick,
    enableTextSelection,
    onSelectionChange
  ])

  return <>{renderSubtitleContent}</>
}

// Apply React.memo for performance optimization
// 应用 React.memo 进行性能优化
export const SubtitleContent = memo(SubtitleContentComponent, (prevProps, nextProps) => {
  // Compare all props for shallow equality
  // 对所有 props 进行浅比较
  return (
    prevProps.onWordHover === nextProps.onWordHover &&
    prevProps.onWordClick === nextProps.onWordClick &&
    prevProps.enableTextSelection === nextProps.enableTextSelection &&
    prevProps.onSelectionChange === nextProps.onSelectionChange &&
    // Deep comparison for style objects since they might be recreated
    // 对样式对象进行深度比较，因为它们可能被重新创建
    JSON.stringify(prevProps.dynamicTextStyle) === JSON.stringify(nextProps.dynamicTextStyle) &&
    JSON.stringify(prevProps.dynamicEnglishTextStyle) ===
      JSON.stringify(nextProps.dynamicEnglishTextStyle) &&
    JSON.stringify(prevProps.dynamicChineseTextStyle) ===
      JSON.stringify(nextProps.dynamicChineseTextStyle)
  )
})
