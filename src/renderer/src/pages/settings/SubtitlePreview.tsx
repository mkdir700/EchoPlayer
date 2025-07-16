import {
  SubtitleBackgroundType,
  SubtitleDisplayMode,
  ThemeMode
} from '@renderer/infrastructure/types'
import React from 'react'
import styled, { css } from 'styled-components'

export interface SubtitlePreviewProps {
  displayMode: SubtitleDisplayMode
  backgroundType: SubtitleBackgroundType
  theme: ThemeMode
}

const SubtitlePreview: React.FC<SubtitlePreviewProps> = ({
  displayMode,
  backgroundType,
  theme
}) => {
  const sampleText = {
    original: 'The quick brown fox jumps over the lazy dog in the beautiful garden.',
    translated: '敏捷的棕色狐狸在美丽的花园里跳过了懒惰的狗。'
  }

  const renderSubtitleContent = () => {
    switch (displayMode) {
      case SubtitleDisplayMode.NONE:
        return null
      case SubtitleDisplayMode.ORIGINAL:
        return <SubtitleText>{sampleText.original}</SubtitleText>
      case SubtitleDisplayMode.TRANSLATED:
        return <SubtitleText>{sampleText.translated}</SubtitleText>
      case SubtitleDisplayMode.BILINGUAL:
        return (
          <BilingualContainer>
            <SubtitleText>{sampleText.original}</SubtitleText>
            <SubtitleText>{sampleText.translated}</SubtitleText>
          </BilingualContainer>
        )
      default:
        return null
    }
  }

  return (
    <PreviewContainer>
      <PreviewArea>
        <SubtitleContainer
          $backgroundType={backgroundType}
          $theme={theme}
          $displayMode={displayMode}
        >
          {renderSubtitleContent()}
        </SubtitleContainer>
      </PreviewArea>
    </PreviewContainer>
  )
}

const PreviewContainer = styled.div`
  position: relative;
  width: 100%;
  height: 100px;
  border: 1px solid var(--color-border-2);
  border-radius: 8px;
  overflow: hidden;
  background:
    linear-gradient(45deg, #f0f0f0 25%, transparent 25%),
    linear-gradient(-45deg, #f0f0f0 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #f0f0f0 75%),
    linear-gradient(-45deg, transparent 75%, #f0f0f0 75%);
  background-size: 20px 20px;
  background-position:
    0 0,
    0 10px,
    10px -10px,
    -10px 0px;
`

const PreviewArea = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
`

const SubtitleContainer = styled.div<{
  $backgroundType: SubtitleBackgroundType
  $theme: ThemeMode
  $displayMode: SubtitleDisplayMode
}>`
  position: relative;
  padding: ${({ $displayMode }) =>
    $displayMode === SubtitleDisplayMode.BILINGUAL ? '6px 12px' : '8px 16px'};
  border-radius: 4px;
  max-width: 100%;
  text-align: center;

  ${({ $backgroundType }) => {
    switch ($backgroundType) {
      case SubtitleBackgroundType.TRANSPARENT:
        return css`
          background: transparent;
        `
      case SubtitleBackgroundType.BLUR:
        return css`
          background: rgba(0, 0, 0, 0.3);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        `
      case SubtitleBackgroundType.SOLID_BLACK:
        return css`
          background: rgba(0, 0, 0, 0.8);
        `
      case SubtitleBackgroundType.SOLID_GRAY:
        return css`
          background: rgba(128, 128, 128, 0.8);
        `
      default:
        return css`
          background: transparent;
        `
    }
  }}

  ${({ $displayMode }) =>
    $displayMode === SubtitleDisplayMode.NONE &&
    css`
      display: none;
    `}
`

const SubtitleText = styled.div`
  color: white;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.3;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
  margin: 1px 0;

  &:first-child {
    margin-top: 0;
  }

  &:last-child {
    margin-bottom: 0;
  }
`

const BilingualContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`

export default SubtitlePreview
