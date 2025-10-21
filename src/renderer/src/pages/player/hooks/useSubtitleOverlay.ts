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

  /** 选中的文本（来自 PlayerStore） */
  selectedText: string
  /** 设置选中文本（来自 PlayerStore） */
  setSelectedText: (text: string) => void

  // 配置操作（基于当前视频项目）
  isMaskMode: boolean
  maskOnboardingComplete?: boolean
  setDisplayMode: (mode: SubtitleDisplayMode) => void
  setBackgroundType: (type: SubtitleBackgroundType) => void
  setOpacity: (opacity: number) => void
  setPosition: (position: { x: number; y: number }) => void
  setSize: (size: { width: number; height: number }) => void
  setMaskMode: (enabled: boolean) => void
  toggleMaskMode: () => void
  setMaskOnboardingComplete: (completed: boolean) => void
}

/**
 * SubtitleOverlay 集成 Hook（重构版）
 */
export function useSubtitleOverlay(): SubtitleOverlay {
  // 字幕引擎
  const { currentSubtitle, currentIndex } = useSubtitleEngine()

  // 当前播放时间
  const currentTime = usePlayerStore((s) => s.currentTime)
  const selectedText = usePlayerStore((s) => s.selectedText)
  const setSelectedText = usePlayerStore((s) => s.setSelectedText)
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
    // 基础条件：显示模式不为 NONE 且有字幕数据
    if (subtitleOverlayConfig.displayMode === SubtitleDisplayMode.NONE || !currentSubtitleData) {
      return false
    }

    // 优先检查：如果当前字幕索引与 engine 提供的索引一致，说明这是权威数据，直接显示
    // 这可以避免用户跳转时因时间不同步导致的闪烁
    if (currentIndex >= 0 && currentSubtitleData.index === currentIndex) {
      return true
    }

    // 正常的时间边界检查：确保当前播放时间在字幕的时间范围内
    const isInTimeRange =
      currentTime >= currentSubtitleData.startTime && currentTime <= currentSubtitleData.endTime

    // 如果在时间范围内，直接显示
    if (isInTimeRange) {
      return true
    }

    // 智能容差机制：处理播放时的短暂时间不同步问题
    // 如果当前时间接近字幕开始时间，也应该显示（防止跳转闪烁）
    const timeDiffToStart = Math.abs(currentTime - currentSubtitleData.startTime)
    const isNearStart = timeDiffToStart <= 2.0 // 2秒容差，处理跳转延迟

    return isNearStart
  }, [subtitleOverlayConfig.displayMode, currentSubtitleData, currentTime, currentIndex])

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
      if (subtitleOverlayConfig.isMaskMode) {
        logger.debug('遮罩模式下忽略背景类型切换', { type })
        return
      }
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

  const setMaskMode = useCallback(
    (enabled: boolean) => {
      setSubtitleOverlay({
        isMaskMode: enabled
      })
      logger.info('设置遮罩模式', { enabled })
    },
    [setSubtitleOverlay]
  )

  const toggleMaskMode = useCallback(() => {
    setMaskMode(!subtitleOverlayConfig.isMaskMode)
  }, [setMaskMode, subtitleOverlayConfig.isMaskMode])

  const setMaskOnboardingComplete = useCallback(
    (completed: boolean) => {
      setSubtitleOverlay({ maskOnboardingComplete: completed })
      logger.debug('更新遮罩模式引导状态', { completed })
    },
    [setSubtitleOverlay]
  )

  return {
    currentSubtitle: currentSubtitleData,
    shouldShow,
    displayText,
    isMaskMode: subtitleOverlayConfig.isMaskMode,
    maskOnboardingComplete: subtitleOverlayConfig.maskOnboardingComplete,
    selectedText,
    setSelectedText,
    setDisplayMode: setDisplayModeWithSync,
    setBackgroundType: setBackgroundTypeHandler,
    setOpacity: setOpacityHandler,
    setPosition: setPositionHandler,
    setSize: setSizeHandler,
    setMaskMode,
    toggleMaskMode,
    setMaskOnboardingComplete
  }
}

export default useSubtitleOverlay
