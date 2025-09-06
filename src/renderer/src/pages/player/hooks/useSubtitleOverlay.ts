import { loggerService } from '@logger'
import { usePlayerStore } from '@renderer/state'
import { SubtitleBackgroundType, SubtitleDisplayMode } from '@types'
import { useCallback, useMemo } from 'react'

import { useSubtitleEngine } from './useSubtitleEngine'

const logger = loggerService.withContext('SubtitleOverlayIntegration')

export interface SubtitleOverlay {
  // 当前字幕数据
  currentSubtitle: {
    originalText: string
    translatedText?: string
    startTime: number
    endTime: number
    index: number
  } | null

  // 显示状态
  shouldShow: boolean
  displayText: string

  // 配置操作（基于当前视频项目）
  setDisplayMode: (mode: SubtitleDisplayMode) => void
  setBackgroundType: (type: SubtitleBackgroundType) => void
  setOpacity: (opacity: number) => void
  setPosition: (position: { x: number; y: number }) => void
  setSize: (size: { width: number; height: number }) => void
}

/**
 * SubtitleOverlay 集成 Hook（重构版）
 */
export function useSubtitleOverlay(): SubtitleOverlay {
  // 字幕引擎
  const { currentSubtitle, currentIndex } = useSubtitleEngine()

  const subtitleOverlayConfig = usePlayerStore((s) => s.subtitleOverlay)
  const setSubtitleOverlay = usePlayerStore((s) => s.setSubtitleOverlay)

  // === 计算当前字幕数据 ===
  const currentSubtitleData = useMemo(() => {
    if (!currentSubtitle) return null

    return {
      originalText: currentSubtitle.originalText,
      translatedText: currentSubtitle.translatedText,
      startTime: currentSubtitle.startTime,
      endTime: currentSubtitle.endTime,
      index: currentIndex
    }
  }, [currentSubtitle, currentIndex])

  // === 计算是否应该显示 ===
  const shouldShow = useMemo(() => {
    return (
      subtitleOverlayConfig.displayMode !== SubtitleDisplayMode.NONE && currentSubtitleData !== null
    )
  }, [subtitleOverlayConfig.displayMode, currentSubtitleData])

  // === 计算显示文本 ===
  const displayText = useMemo(() => {
    if (!currentSubtitleData || !shouldShow || !subtitleOverlayConfig) return ''

    switch (subtitleOverlayConfig.displayMode) {
      case SubtitleDisplayMode.ORIGINAL:
        return currentSubtitleData.originalText

      case SubtitleDisplayMode.TRANSLATED:
        return currentSubtitleData.translatedText || currentSubtitleData.originalText

      case SubtitleDisplayMode.BILINGUAL:
        if (currentSubtitleData.translatedText) {
          return `${currentSubtitleData.originalText}\n${currentSubtitleData.translatedText}`
        }
        return currentSubtitleData.originalText

      default:
        return ''
    }
  }, [subtitleOverlayConfig, currentSubtitleData, shouldShow])

  // === 配置操作的包装器（添加 PlayerStore 同步） ===
  const setDisplayModeWithSync = useCallback(
    (mode: SubtitleDisplayMode) => {
      setSubtitleOverlay({ displayMode: mode })
      logger.debug('设置字幕显示模式', { mode })
    },
    [setSubtitleOverlay]
  )

  const setBackgroundTypeHandler = useCallback(
    (type: SubtitleBackgroundType) => {
      const newBackgroundStyle = {
        ...subtitleOverlayConfig.backgroundStyle,
        type
      }
      setSubtitleOverlay({ backgroundStyle: newBackgroundStyle })
      logger.info('设置字幕背景类型', { type })
    },
    [setSubtitleOverlay, subtitleOverlayConfig]
  )

  const setOpacityHandler = useCallback(
    (opacity: number) => {
      const newBackgroundStyle = {
        ...subtitleOverlayConfig.backgroundStyle,
        opacity
      }
      setSubtitleOverlay({ backgroundStyle: newBackgroundStyle })
      logger.debug('设置字幕透明度', { opacity })
    },
    [setSubtitleOverlay, subtitleOverlayConfig]
  )

  const setPositionHandler = useCallback(
    (position: { x: number; y: number }) => {
      setSubtitleOverlay({ position })
      logger.debug('设置字幕位置', { position })
    },
    [setSubtitleOverlay]
  )

  const setSizeHandler = useCallback(
    (size: { width: number; height: number }) => {
      setSubtitleOverlay({ size })
      logger.debug('设置字幕尺寸', { size })
    },
    [setSubtitleOverlay]
  )

  return {
    currentSubtitle: currentSubtitleData,
    shouldShow,
    displayText,
    setDisplayMode: setDisplayModeWithSync,
    setBackgroundType: setBackgroundTypeHandler,
    setOpacity: setOpacityHandler,
    setPosition: setPositionHandler,
    setSize: setSizeHandler
  }
}

export default useSubtitleOverlay
