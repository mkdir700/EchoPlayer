/**
 * DictionaryPopover Component
 *
 * 独立的词典弹窗组件，提供：
 * - 单词查询结果的展示
 * - 音标、词性、释义的结构化布局
 * - 发音功能
 * - 加载和错误状态处理
 * - 响应式设计和动画效果
 */

import { loggerService } from '@logger'
import {
  BORDER_RADIUS,
  FONT_SIZES,
  FONT_WEIGHTS,
  GLASS_EFFECT,
  SHADOWS,
  SPACING,
  Z_INDEX
} from '@renderer/infrastructure/styles/theme'
import { DictionaryResult } from '@types'
import { Button, Spin } from 'antd'
import { Volume2 } from 'lucide-react'
import { memo, useCallback, useEffect, useRef, useState } from 'react'
import styled from 'styled-components'

const logger = loggerService.withContext('DictionaryPopover')

export interface DictionaryPopoverProps {
  /** 是否显示弹窗 */
  visible: boolean
  /** 弹窗位置 */
  position: { x: number; y: number } | null
  /** 词典数据 */
  data: DictionaryResult | null
  /** 是否正在加载 */
  loading: boolean
  /** 错误信息 */
  error: string | null
  /** 点击外部区域回调 */
  onClickOutside?: () => void
}

export const DictionaryPopover = memo(function DictionaryPopover({
  visible,
  position,
  data,
  loading,
  error
}: DictionaryPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null)
  const [adjustedPosition, setAdjustedPosition] = useState<{ x: number; y: number } | null>(null)
  const [placement, setPlacement] = useState<
    'top' | 'bottom' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  >('top')

  // 智能位置计算
  useEffect(() => {
    if (!visible || !position || !popoverRef.current) {
      setAdjustedPosition(null)
      return
    }

    const popover = popoverRef.current
    const popoverRect = popover.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    // 弹窗尺寸（考虑默认的 min-width 和可能的内容）
    const popoverWidth = Math.max(280, popoverRect.width || 280)
    const popoverHeight = Math.max(200, popoverRect.height || 200)

    let newX = position.x
    const newY = position.y
    let newPlacement: typeof placement = 'top'

    // 水平位置调整
    const halfWidth = popoverWidth / 2
    const rightOverflow = newX + halfWidth - viewportWidth
    const leftOverflow = newX - halfWidth

    if (rightOverflow > 0) {
      // 右侧溢出，向左调整
      newX = viewportWidth - halfWidth - 10 // 留10px边距
      newPlacement = newY < popoverHeight + 20 ? 'bottom-right' : 'top-right'
    } else if (leftOverflow < 0) {
      // 左侧溢出，向右调整
      newX = halfWidth + 10 // 留10px边距
      newPlacement = newY < popoverHeight + 20 ? 'bottom-left' : 'top-left'
    } else {
      // 水平居中
      newPlacement = newY < popoverHeight + 20 ? 'bottom' : 'top'
    }

    // 垂直位置调整
    if (newPlacement.startsWith('top') && newY < popoverHeight + 20) {
      // 上方空间不足，改为下方显示
      newPlacement = newPlacement.replace('top', 'bottom') as typeof placement
    } else if (newPlacement.startsWith('bottom') && newY > viewportHeight - popoverHeight - 20) {
      // 下方空间不足，改为上方显示
      newPlacement = newPlacement.replace('bottom', 'top') as typeof placement
    }

    setAdjustedPosition({ x: newX, y: newY })
    setPlacement(newPlacement)
  }, [visible, position, data, loading, error])

  // 发音处理
  const handlePronunciation = useCallback(async (word: string) => {
    try {
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(word)
        utterance.lang = 'en-US'
        utterance.rate = 0.8
        window.speechSynthesis.speak(utterance)
      }
    } catch (error) {
      logger.error('发音失败', { word, error })
    }
  }, [])

  if (!visible || !position) {
    return null
  }

  const finalPosition = adjustedPosition || position

  return (
    <PopoverContainer
      ref={popoverRef}
      style={{ left: finalPosition.x, top: finalPosition.y }}
      data-testid="dictionary-popover"
      onClick={(e) => e.stopPropagation()}
      $placement={placement}
    >
      {loading ? (
        <LoadingContent>
          <Spin size="small" />
          <span>查询中...</span>
        </LoadingContent>
      ) : error ? (
        <ErrorContent>
          <span>查询失败</span>
          <div>{error}</div>
        </ErrorContent>
      ) : data ? (
        <>
          <WordHeader>
            <WordTitle>{data.word}</WordTitle>
            <PronunciationButton
              type="text"
              size="small"
              icon={<Volume2 size={14} />}
              onClick={() => handlePronunciation(data.word)}
              title="点击发音"
            />
          </WordHeader>

          {data.phonetic && <PhoneticText>{data.phonetic}</PhoneticText>}

          {data.definitions.length > 0 && (
            <>
              <Divider $margin={SPACING.XS} />
              <DefinitionsList>
                {data.definitions.slice(0, 6).map((def, idx) => (
                  <DefinitionItem key={idx}>
                    {def.partOfSpeech && <PartOfSpeech>{def.partOfSpeech}</PartOfSpeech>}
                    <MeaningText>{def.meaning}</MeaningText>
                  </DefinitionItem>
                ))}
                {data.definitions.length > 6 && (
                  <MoreIndicator>... 还有 {data.definitions.length - 6} 个释义</MoreIndicator>
                )}
              </DefinitionsList>
            </>
          )}

          {data.translations && data.translations.length > 0 && (
            <>
              <Divider $margin={SPACING.XS} />
              <TranslationSection>
                <SectionTitle>常用翻译</SectionTitle>
                <TranslationList>
                  {data.translations.slice(0, 3).map((translation, idx) => (
                    <TranslationItem key={idx}>{translation}</TranslationItem>
                  ))}
                </TranslationList>
              </TranslationSection>
            </>
          )}
        </>
      ) : null}
    </PopoverContainer>
  )
})

export default DictionaryPopover

// === 样式组件 ===
const PopoverContainer = styled.div<{
  $placement: 'top' | 'bottom' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
}>`
  position: absolute;
  background: var(--ant-color-bg-elevated, rgba(0, 0, 0, ${GLASS_EFFECT.BACKGROUND_ALPHA.LIGHT}));
  backdrop-filter: blur(${GLASS_EFFECT.BLUR_STRENGTH.MEDIUM}px);
  border: 1px solid rgba(255, 255, 255, ${GLASS_EFFECT.BORDER_ALPHA.SUBTLE});
  border-radius: ${BORDER_RADIUS.LG}px;
  box-shadow: ${SHADOWS.LG};
  padding: ${SPACING.MD}px;
  color: var(--ant-color-white, #ffffff);
  min-width: 280px;
  max-width: 360px;
  max-height: 400px;
  overflow-y: auto;
  z-index: ${Z_INDEX.TOOLTIP};

  /* 根据placement调整transform */
  transform: ${(props) => {
    switch (props.$placement) {
      case 'top':
        return 'translate(-50%, calc(-100% - ${SPACING.SM}px))'
      case 'bottom':
        return 'translate(-50%, ${SPACING.SM}px)'
      case 'top-left':
        return 'translate(-10px, calc(-100% - ${SPACING.SM}px))'
      case 'top-right':
        return 'translate(calc(-100% + 10px), calc(-100% - ${SPACING.SM}px))'
      case 'bottom-left':
        return 'translate(-10px, ${SPACING.SM}px)'
      case 'bottom-right':
        return 'translate(calc(-100% + 10px), ${SPACING.SM}px)'
      default:
        return 'translate(-50%, calc(-100% - ${SPACING.SM}px))'
    }
  }};

  /* 渐入动画 */
  animation: fadeIn 0.2s ease-out;

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  /* 自定义滚动条 */
  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 2px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.3);
    border-radius: 2px;

    &:hover {
      background: rgba(255, 255, 255, 0.5);
    }
  }

  /* 响应式调整 */
  @media (max-width: 600px) {
    min-width: 240px;
    max-width: 90vw;
    max-height: 300px;
  }
`

const LoadingContent = styled.div`
  display: flex;
  align-items: center;
  gap: ${SPACING.SM}px;
  padding: ${SPACING.SM}px 0;
  color: rgba(255, 255, 255, 0.8);
  font-size: ${FONT_SIZES.SM}px;

  .ant-spin {
    .ant-spin-dot {
      i {
        background-color: rgba(255, 255, 255, 0.8);
      }
    }
  }
`

const ErrorContent = styled.div`
  color: #ff7875;
  text-align: center;
  padding: ${SPACING.SM}px 0;

  span {
    font-weight: ${FONT_WEIGHTS.MEDIUM};
    margin-bottom: ${SPACING.XS}px;
    display: block;
  }

  div {
    font-size: ${FONT_SIZES.SM}px;
    opacity: 0.8;
  }
`

const WordHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${SPACING.XS}px;
`

const WordTitle = styled.h3`
  margin: 0;
  font-size: ${FONT_SIZES.LG}px;
  font-weight: ${FONT_WEIGHTS.SEMIBOLD};
  color: var(--ant-color-white, #ffffff);
  flex: 1;
`

const PronunciationButton = styled(Button)`
  &&& {
    color: rgba(255, 255, 255, 0.8);
    border: none;
    padding: 0 ${SPACING.XS}px;
    height: 24px;
    min-width: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;

    &:hover {
      color: #ffffff;
      background: rgba(255, 255, 255, 0.1);
    }

    &:active {
      background: rgba(255, 255, 255, 0.2);
    }
  }
`

const PhoneticText = styled.div`
  color: rgba(255, 255, 255, 0.7);
  font-size: ${FONT_SIZES.SM}px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  margin-bottom: ${SPACING.SM}px;
`

const DefinitionsList = styled.div`
  margin: 0;
`

const DefinitionItem = styled.div`
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: ${SPACING.XS}px;
  margin-bottom: ${SPACING.SM}px;
  padding-bottom: ${SPACING.SM}px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);

  &:last-child {
    margin-bottom: 0;
    padding-bottom: 0;
    border-bottom: none;
  }
`

const PartOfSpeech = styled.span`
  font-size: ${FONT_SIZES.XS}px;
  font-weight: ${FONT_WEIGHTS.MEDIUM};
  color: #52c41a;
  background: rgba(82, 196, 26, 0.15);
  padding: 1px ${SPACING.XS / 1.5}px;
  border-radius: ${BORDER_RADIUS.SM}px;
  display: inline-block;
  flex-shrink: 0;
  min-width: 32px;
  text-align: center;
  line-height: 1.3;
  margin-top: 1px; /* 微调垂直对齐 */
`

const MeaningText = styled.div`
  color: rgba(255, 255, 255, 0.9);
  font-size: ${FONT_SIZES.SM}px;
  line-height: 1.5;
  flex: 1;
`

const MoreIndicator = styled.div`
  color: rgba(255, 255, 255, 0.6);
  font-size: ${FONT_SIZES.XS}px;
  text-align: center;
  padding: ${SPACING.XS}px 0;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
`

const TranslationSection = styled.div`
  margin-top: ${SPACING.SM}px;
`

const SectionTitle = styled.div`
  color: rgba(255, 255, 255, 0.8);
  font-size: ${FONT_SIZES.SM}px;
  font-weight: ${FONT_WEIGHTS.MEDIUM};
  margin-bottom: ${SPACING.XS}px;
`

const TranslationList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${SPACING.XS}px;
`

const TranslationItem = styled.span`
  background: rgba(22, 119, 255, 0.15);
  color: #40a9ff;
  padding: 2px ${SPACING.XS}px;
  border-radius: ${BORDER_RADIUS.SM}px;
  font-size: ${FONT_SIZES.SM}px;
  border: 1px solid rgba(64, 169, 255, 0.3);
`

// 自定义 Divider 组件
const Divider = styled.div<{ $margin: number }>`
  height: 1px;
  background: rgba(255, 255, 255, 0.08);
  margin: ${(props) => props.$margin}px 0;
`
