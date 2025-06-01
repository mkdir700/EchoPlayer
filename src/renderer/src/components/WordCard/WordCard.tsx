import React, { useState, useEffect, useRef } from 'react'
import { Card, Typography, Button, Space, Spin, Alert, Divider } from 'antd'
import { SoundOutlined, CloseOutlined, LoadingOutlined } from '@ant-design/icons'
import { DictionaryServiceFactory } from '@renderer/utils/dictionaryServices'
import type { DictionaryResult } from '@renderer/utils/dictionaryServices'
import type { ThirdPartyServicesSettings } from '@renderer/types'

// 导入样式
import styles from './WordCard.module.css'
import RendererLogger from '@renderer/utils/logger'

const { Text, Title } = Typography

interface WordCardProps {
  word: string
  targetElement: HTMLElement
  onClose: () => void
}

export function WordCard({ word, targetElement, onClose }: WordCardProps): React.JSX.Element {
  const [dictionaryResult, setDictionaryResult] = useState<DictionaryResult | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isPlayingAudio, setIsPlayingAudio] = useState(false)
  RendererLogger.componentRender({
    component: 'WordCard',
    props: { word, targetElement, onClose, dictionaryResult, isLoading, isPlayingAudio }
  })
  const cardRef = useRef<HTMLDivElement>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // 从本地存储获取设置
  const getSettings = (): ThirdPartyServicesSettings => {
    try {
      const savedSettings = localStorage.getItem('thirdPartyServicesSettings')
      if (savedSettings) {
        return JSON.parse(savedSettings)
      }
    } catch (error) {
      console.error('Failed to parse settings:', error)
    }

    return {
      openai: {
        apiKey: '',
        selectedModel: null,
        baseUrl: 'https://api.openai.com/v1',
        maxTokens: 1000,
        temperature: 0.2
      },
      dictionary: {
        selectedEngine: null,
        eudicApiToken: '',
        youdaoApiKey: '',
        youdaoApiSecret: ''
      }
    }
  }

  // 查询单词含义
  useEffect(() => {
    const lookupWord = async (): Promise<void> => {
      const settings = getSettings()

      if (!settings.dictionary.selectedEngine) {
        setDictionaryResult({
          word,
          definitions: [],
          success: false,
          error: '请先在设置中配置词典服务'
        })
        setIsLoading(false)
        return
      }

      try {
        const service = DictionaryServiceFactory.createService(
          settings.dictionary.selectedEngine,
          settings.dictionary
        )

        if (!service) {
          setDictionaryResult({
            word,
            definitions: [],
            success: false,
            error: '词典服务配置不完整'
          })
          setIsLoading(false)
          return
        }

        const result = await service.lookupWord(word.toLowerCase().trim())
        // 如果查询结果为空，则认为查询失败
        if (!result.success) {
          setDictionaryResult({
            word,
            definitions: [],
            success: false,
            error: '未找到该单词'
          })
          return
        }
        setDictionaryResult(result)
      } catch (error) {
        setDictionaryResult({
          word,
          definitions: [],
          success: false,
          error: error instanceof Error ? error.message : '查询失败'
        })
      } finally {
        setIsLoading(false)
      }
    }

    lookupWord()
  }, [word])

  // 播放单词发音
  const playPronunciation = async (): Promise<void> => {
    if (isPlayingAudio) return

    setIsPlayingAudio(true)
    try {
      // 使用 Web Speech API 进行发音
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(word)
        utterance.lang = 'en-US'
        utterance.rate = 0.8
        utterance.pitch = 1

        utterance.onend = () => {
          setIsPlayingAudio(false)
        }

        utterance.onerror = () => {
          setIsPlayingAudio(false)
          // 如果 Speech API 失败，尝试使用在线发音服务
          playOnlinePronunciation()
        }

        window.speechSynthesis.speak(utterance)
      } else {
        // 备用方案：使用在线发音服务
        await playOnlinePronunciation()
      }
    } catch (error) {
      console.error('发音播放失败:', error)
      setIsPlayingAudio(false)
    }
  }

  // 使用在线发音服务
  const playOnlinePronunciation = async (): Promise<void> => {
    try {
      // 使用免费的在线发音服务
      const audioUrl = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(word)}&type=1`

      if (audioRef.current) {
        audioRef.current.pause()
      }

      audioRef.current = new Audio(audioUrl)
      audioRef.current.onended = () => {
        setIsPlayingAudio(false)
      }
      audioRef.current.onerror = () => {
        setIsPlayingAudio(false)
      }

      await audioRef.current.play()
    } catch (error) {
      console.error('在线发音播放失败:', error)
      setIsPlayingAudio(false)
    }
  }

  // 点击外部关闭卡片
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      if (cardRef.current && !cardRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return (): void => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [onClose])

  // 清理音频资源
  useEffect(() => {
    return (): void => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  // 监听窗口大小变化，强制重新渲染以更新位置
  const [, forceUpdate] = useState({})
  useEffect(() => {
    const handleResize = (): void => {
      forceUpdate({})
    }

    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  // 计算卡片和小三角的位置
  const getPositionStyles = (): {
    cardStyle: React.CSSProperties
    arrowStyle: React.CSSProperties
  } => {
    // 实时获取目标元素的位置
    const targetRect = targetElement.getBoundingClientRect()
    const targetCenterX = targetRect.left + targetRect.width / 2
    const targetTopY = targetRect.top

    const cardWidth = 280
    const cardHeight = 200
    const arrowHeight = 8
    const gap = 12

    // 计算卡片的理想位置（以单词中心为基准）
    let cardLeft = targetCenterX - cardWidth / 2
    let cardTop = (targetTopY - cardHeight / 2 - arrowHeight - gap) * 0.95

    // 边界检测和调整
    const minLeft = 10
    const maxLeft = window.innerWidth - cardWidth - 10
    const minTop = 10
    const maxTop = window.innerHeight - cardHeight - 10

    // 调整水平位置
    if (cardLeft < minLeft) {
      cardLeft = minLeft
    } else if (cardLeft > maxLeft) {
      cardLeft = maxLeft
    }

    // 调整垂直位置
    if (cardTop < minTop) {
      // 如果上方空间不足，显示在单词下方
      cardTop = targetTopY + 30
    } else if (cardTop > maxTop) {
      cardTop = maxTop
    }

    // 计算小三角相对于卡片的位置
    const arrowLeft = targetCenterX - cardLeft
    const arrowLeftPercent = Math.max(8, Math.min(92, (arrowLeft / cardWidth) * 100))

    return {
      cardStyle: {
        position: 'fixed' as const,
        left: `${cardLeft}px`,
        top: `${cardTop}px`,
        zIndex: 9999 /* 确保单词卡片在最顶层 */,
        width: `${cardWidth}px`,
        maxHeight: `${cardHeight}px`
      },
      arrowStyle: {
        left: `${arrowLeftPercent}%`
      }
    }
  }

  const { cardStyle, arrowStyle } = getPositionStyles()

  return (
    <div ref={cardRef} style={cardStyle} className={styles.wordCard}>
      <div className={styles.arrow} style={arrowStyle} />
      <Card
        size="small"
        className={styles.cardContent}
        title={
          <div className={styles.cardHeader}>
            <Space>
              <Title level={5} className={styles.wordTitle}>
                {word}
              </Title>
              {dictionaryResult?.phonetic && (
                <Text className={styles.phonetic}>/{dictionaryResult.phonetic}/</Text>
              )}
            </Space>
            <Space>
              <Button
                type="text"
                size="small"
                icon={isPlayingAudio ? <LoadingOutlined /> : <SoundOutlined />}
                onClick={playPronunciation}
                disabled={isPlayingAudio}
                className={styles.playButton}
                title="播放发音"
              />
              <Button
                type="text"
                size="small"
                icon={<CloseOutlined />}
                onClick={onClose}
                className={styles.closeButton}
                title="关闭"
              />
            </Space>
          </div>
        }
      >
        <div className={styles.cardBody}>
          {isLoading ? (
            <div className={styles.loadingContainer}>
              <Spin size="small" />
              <Text className={styles.loadingText}>查询中...</Text>
            </div>
          ) : dictionaryResult?.success ? (
            <div className={styles.definitionsContainer}>
              {dictionaryResult.translations && dictionaryResult.translations.length > 0 && (
                <div className={styles.translationsSection}>
                  <Text strong className={styles.sectionTitle}>
                    翻译:
                  </Text>
                  <Text className={styles.translationText}>
                    {dictionaryResult.translations.join('; ')}
                  </Text>
                </div>
              )}

              {dictionaryResult.definitions && dictionaryResult.definitions.length > 0 && (
                <>
                  {dictionaryResult.translations && dictionaryResult.translations.length > 0 && (
                    <Divider className={styles.divider} />
                  )}
                  <div className={styles.definitionsSection}>
                    <Text strong className={styles.sectionTitle}>
                      释义:
                    </Text>
                    <div className={styles.definitionsList}>
                      {dictionaryResult.definitions.slice(0, 3).map((def, index) => (
                        <div key={index} className={styles.definitionItem}>
                          {def.partOfSpeech && (
                            <Text className={styles.partOfSpeech}>{def.partOfSpeech}</Text>
                          )}
                          <Text className={styles.meaning}>{def.meaning}</Text>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <Alert
              message="查询失败"
              description={dictionaryResult?.error || '无法获取单词信息'}
              type="warning"
              showIcon
            />
          )}
        </div>
      </Card>
    </div>
  )
}
