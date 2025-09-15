/**
 * DictionaryPopover Component
 *
 * 独立的词典弹窗组件，基于 Ant Design Popover，提供：
 * - 单词查询结果的展示
 * - 音标、词性、释义的结构化布局
 * - 发音功能
 * - 加载和错误状态处理
 * - 智能位置调整和防溢出
 */

import { loggerService } from '@logger'
import {
  BORDER_RADIUS,
  FONT_SIZES,
  FONT_WEIGHTS,
  GLASS_EFFECT,
  SHADOWS,
  SPACING
} from '@renderer/infrastructure/styles/theme'
import { DictionaryResult, PronunciationInfo } from '@types'
import { Button, Popover, Spin } from 'antd'
import { Volume2 } from 'lucide-react'
import { memo, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

const logger = loggerService.withContext('DictionaryPopover')

export interface DictionaryPopoverProps {
  /** 是否显示弹窗 */
  visible: boolean
  /** 词典数据 */
  data: DictionaryResult | null
  /** 是否正在加载 */
  loading: boolean
  /** 错误信息 */
  error: string | null
  /** 子元素（触发元素） */
  children: React.ReactElement
  /** 关闭回调 */
  onClose?: () => void
}

export const DictionaryPopover = memo(function DictionaryPopover({
  visible,
  data,
  loading,
  error,
  children,
  onClose
}: DictionaryPopoverProps) {
  const { t } = useTranslation()
  // 发音处理
  const handlePronunciation = useCallback(
    async (word: string, type: string, pronunciation?: PronunciationInfo) => {
      try {
        // 优先使用真人音频
        if (pronunciation?.audioUrl) {
          logger.debug('使用真人音频播放', { word, type, audioUrl: pronunciation.audioUrl })

          const audio = new Audio(pronunciation.audioUrl)

          // 设置音频属性
          audio.preload = 'metadata'
          audio.volume = 0.8

          // 播放音频
          await audio.play()

          logger.debug('真人音频播放成功', { word, type })
          return // 成功播放真人音频后直接返回，不使用语音合成
        }

        // 回退到浏览器语音合成
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(word)
          utterance.lang = type === 'uk' ? 'en-GB' : 'en-US'
          utterance.rate = 0.8
          window.speechSynthesis.speak(utterance)
          logger.debug('使用语音合成播放', { word, type, lang: utterance.lang })
        }
      } catch (error) {
        logger.error('发音播放失败，尝试语音合成fallback', { word, type, error })

        // 如果真人音频播放失败，尝试语音合成作为fallback
        try {
          if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(word)
            utterance.lang = type === 'uk' ? 'en-GB' : 'en-US'
            utterance.rate = 0.8
            window.speechSynthesis.speak(utterance)
            logger.debug('Fallback语音合成播放', { word, type, lang: utterance.lang })
          }
        } catch (fallbackError) {
          logger.error('Fallback语音合成也失败', { word, type, fallbackError })
        }
      }
    },
    []
  )

  // 阻止弹窗内容事件冒泡的处理函数
  const handleContentMouseDown = useCallback((event: React.MouseEvent) => {
    event.stopPropagation()
  }, [])

  const handleContentClick = useCallback((event: React.MouseEvent) => {
    event.stopPropagation()
  }, [])

  // 弹窗标题
  const title = useMemo(() => {
    if (loading || error || !data) return null

    return (
      <WordHeader onMouseDown={handleContentMouseDown} onClick={handleContentClick}>
        <WordTitle>{data.word}</WordTitle>
      </WordHeader>
    )
  }, [data, loading, error, handleContentMouseDown, handleContentClick])

  // 弹窗内容
  const content = useMemo(() => {
    if (loading) {
      return (
        <LoadingContent onMouseDown={handleContentMouseDown} onClick={handleContentClick}>
          <Spin size="small" />
          <span>{t('player.dictionary.loading')}</span>
        </LoadingContent>
      )
    }

    if (error) {
      return (
        <ErrorContent
          onMouseDown={handleContentMouseDown}
          onClick={handleContentClick}
          data-testid="dictionary-popover-content"
        >
          <span>{t('player.dictionary.error')}</span>
          <div>{error}</div>
        </ErrorContent>
      )
    }

    if (!data) {
      return null
    }

    return (
      <ContentContainer
        onMouseDown={handleContentMouseDown}
        onClick={handleContentClick}
        data-testid="dictionary-popover-content"
      >
        {/* 显示详细发音信息 */}
        {data.pronunciations && data.pronunciations.length > 0 && (
          <PronunciationContainer>
            {data.pronunciations.map((pronunciation, idx) => {
              const getTypeLabel = (type: 'uk' | 'us' | null) => {
                if (type === 'uk') return '英'
                if (type === 'us') return '美'
                return '通用' // 当类型未知时显示"通用"
              }

              const getTypeTitle = (type: 'uk' | 'us' | null) => {
                if (type === 'uk') return '英式'
                if (type === 'us') return '美式'
                return '通用' // 当类型未知时显示"通用"
              }

              return (
                <PronunciationGroup key={idx}>
                  <PronunciationLabel>{getTypeLabel(pronunciation.type)}</PronunciationLabel>
                  <PhoneticText>{pronunciation.phonetic}</PhoneticText>
                  <PronunciationButton
                    type="text"
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation()
                      handlePronunciation(data.word, pronunciation.type || 'unknown', pronunciation)
                    }}
                    title={`${getTypeTitle(pronunciation.type)}发音: ${pronunciation.phonetic}`}
                  >
                    <Volume2 size={12} />
                  </PronunciationButton>
                </PronunciationGroup>
              )
            })}
          </PronunciationContainer>
        )}

        {data.definitions.length > 0 && (
          <>
            <Divider />
            <DefinitionsList>
              {data.definitions.map((def, idx) => (
                <DefinitionItem key={idx}>
                  {def.partOfSpeech && <PartOfSpeech>{def.partOfSpeech}</PartOfSpeech>}
                  <MeaningText>{def.meaning}</MeaningText>
                </DefinitionItem>
              ))}
            </DefinitionsList>
          </>
        )}

        {data.translations && data.translations.length > 0 && (
          <>
            <Divider />
            <TranslationSection>
              <SectionTitle>{t('player.dictionary.translations')}</SectionTitle>
              <TranslationList>
                {data.translations.slice(0, 3).map((translation, idx) => (
                  <TranslationItem key={idx}>{translation}</TranslationItem>
                ))}
              </TranslationList>
            </TranslationSection>
          </>
        )}
      </ContentContainer>
    )
  }, [loading, error, data, handleContentMouseDown, handleContentClick, t, handlePronunciation])

  return (
    <StyledPopover
      content={content}
      title={title}
      open={visible}
      placement="top"
      onOpenChange={(open) => {
        if (!open && onClose) {
          onClose()
        }
      }}
      arrow={false}
      getPopupContainer={() => document.body}
      styles={{
        body: {
          maxWidth: 280,
          minWidth: 200,
          minHeight: 120 // 设置固定最小高度，避免内容变化时的尺寸跳跃
        }
      }}
    >
      <span data-testid="dictionary-popover-trigger">{children}</span>
    </StyledPopover>
  )
})

export default DictionaryPopover

// === 样式组件 ===
const StyledPopover = styled(Popover)`
  /* 确保弹窗事件正确处理，不穿透到底层组件 */
  pointer-events: auto;

  .ant-popover-content {
    pointer-events: auto;

    .ant-popover-inner {
      background: var(--ant-color-bg-elevated, rgba(255, 255, 255, 0.95));
      backdrop-filter: blur(${GLASS_EFFECT.BLUR_STRENGTH.MEDIUM}px);
      border: 1px solid var(--ant-color-border-secondary, rgba(0, 0, 0, 0.06));
      border-radius: ${BORDER_RADIUS.LG}px;
      box-shadow: var(--ant-box-shadow-secondary, ${SHADOWS.LG});
      color: var(--ant-color-text, rgba(0, 0, 0, 0.88));
      pointer-events: auto;
    }

    .ant-popover-title {
      background: transparent;
      border-bottom: 1px solid var(--ant-color-border, rgba(0, 0, 0, 0.06));
      color: var(--ant-color-text, rgba(0, 0, 0, 0.88));
      padding: ${SPACING.XS / 2}px ${SPACING.XS}px;
      line-height: 1.2;
    }

    .ant-popover-inner-content {
      padding: 0;
      max-height: 280px;
      overflow-y: auto;

      /* 自定义滚动条 */
      &::-webkit-scrollbar {
        width: 4px;
      }

      &::-webkit-scrollbar-track {
        background: var(--ant-color-fill-quaternary, rgba(0, 0, 0, 0.04));
        border-radius: 2px;
      }

      &::-webkit-scrollbar-thumb {
        background: var(--ant-color-fill-secondary, rgba(0, 0, 0, 0.15));
        border-radius: 2px;

        &:hover {
          background: var(--ant-color-fill, rgba(0, 0, 0, 0.25));
        }
      }
    }
  }
`

const ContentContainer = styled.div`
  padding: 0;
`

const WordHeader = styled.div`
  display: flex;
  align-items: center;
  margin: 0;
`

const WordTitle = styled.span`
  font-size: ${FONT_SIZES.BASE}px;
  font-weight: ${FONT_WEIGHTS.SEMIBOLD};
  color: var(--ant-color-text, rgba(0, 0, 0, 0.88));
  line-height: 1.3;
`

const PronunciationButton = styled(Button)`
  &&& {
    color: var(--ant-color-text-tertiary, rgba(0, 0, 0, 0.45));
    border: none;
    padding: 2px 4px;
    height: 20px;
    min-width: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    flex-shrink: 0;

    &:hover {
      color: var(--ant-color-text-secondary, rgba(0, 0, 0, 0.65));
      background: var(--ant-color-fill-tertiary, rgba(0, 0, 0, 0.04));
    }

    &:active {
      background: var(--ant-color-fill-secondary, rgba(0, 0, 0, 0.06));
    }

    &:focus {
      background: var(--ant-color-fill-tertiary, rgba(0, 0, 0, 0.04));
    }
  }
`

const LoadingContent = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${SPACING.SM}px;
  padding: ${SPACING.MD}px;
  color: var(--ant-color-text-secondary, rgba(0, 0, 0, 0.65));
  font-size: ${FONT_SIZES.SM}px;
  min-height: 80px; // 确保与实际内容高度相近，避免尺寸跳跃
  min-width: 160px; // 确保与实际内容宽度相近

  .ant-spin {
    .ant-spin-dot {
      i {
        background-color: var(--ant-color-primary, #1677ff);
      }
    }
  }
`

const ErrorContent = styled.div`
  color: #ff7875;
  text-align: center;
  padding: ${SPACING.MD}px;
  min-height: 80px; // 与 LoadingContent 保持一致的最小高度
  min-width: 160px; // 与 LoadingContent 保持一致的最小宽度
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

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

const PhoneticText = styled.span`
  color: var(--ant-color-text-tertiary, rgba(0, 0, 0, 0.45));
  font-size: ${FONT_SIZES.XS}px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  line-height: 1.2;
`

const DefinitionsList = styled.div`
  margin: 0;
`

const DefinitionItem = styled.div`
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: ${SPACING.XS / 2}px;
  margin-bottom: ${SPACING.XS / 2}px;
  padding-bottom: ${SPACING.XS / 2}px;
  border-bottom: 1px solid var(--ant-color-border, rgba(0, 0, 0, 0.06));

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
  margin-top: 1px;
`

const MeaningText = styled.div`
  color: var(--ant-color-text, rgba(0, 0, 0, 0.88));
  font-size: ${FONT_SIZES.XS}px;
  line-height: 1.3;
  flex: 1;
`

const TranslationSection = styled.div`
  margin-top: ${SPACING.XS / 2}px;
`

const SectionTitle = styled.div`
  color: var(--ant-color-text-secondary, rgba(0, 0, 0, 0.65));
  font-size: ${FONT_SIZES.XS}px;
  font-weight: ${FONT_WEIGHTS.MEDIUM};
  margin-bottom: ${SPACING.XS / 2}px;
  line-height: 1.2;
`

const TranslationList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${SPACING.XS / 2}px;
`

const TranslationItem = styled.span`
  background: rgba(22, 119, 255, 0.15);
  color: #40a9ff;
  padding: 1px ${SPACING.XS / 2}px;
  border-radius: ${BORDER_RADIUS.SM}px;
  font-size: ${FONT_SIZES.XS}px;
  border: 1px solid rgba(64, 169, 255, 0.3);
  line-height: 1.2;
`

const Divider = styled.div`
  height: 1px;
  background: var(--ant-color-border, rgba(0, 0, 0, 0.06));
  margin: ${SPACING.XS / 2}px 0;
`

const PronunciationContainer = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: ${SPACING.SM}px;
  padding: ${SPACING.XS / 2}px;
  background: var(--ant-color-fill-quaternary, rgba(0, 0, 0, 0.02));
  border-radius: ${BORDER_RADIUS.SM}px;
  margin-bottom: ${SPACING.XS / 2}px;
  transition: background-color 0.2s ease;
`

const PronunciationGroup = styled.div`
  display: flex;
  align-items: center;
  gap: ${SPACING.XS / 2}px;
`

const PronunciationLabel = styled.span`
  font-size: ${FONT_SIZES.XS}px;
  font-weight: ${FONT_WEIGHTS.MEDIUM};
  color: var(--ant-color-text-secondary, rgba(0, 0, 0, 0.65));
  background: var(--ant-color-fill-quaternary, rgba(0, 0, 0, 0.04));
  padding: 1px ${SPACING.XS / 2}px;
  border-radius: ${BORDER_RADIUS.SM}px;
  min-width: 20px;
  text-align: center;
  line-height: 1.2;
  flex-shrink: 0;
`
