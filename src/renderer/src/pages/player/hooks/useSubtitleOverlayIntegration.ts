/**
 * SubtitleOverlay 集成 Hook（重构版）
 *
 * 重构后负责连接 SubtitleOverlay 与基于视频项目的配置系统：
 * - 自动加载当前视频的字幕配置
 * - 从 SubtitleEngine 获取当前字幕
 * - 处理视频切换时的配置加载
 * - 提供统一的配置操作接口
 */

import { loggerService } from '@logger'
import { usePlayerSessionStore, useSubtitleOverlayStore } from '@renderer/state'
import { SubtitleBackgroundType, SubtitleDisplayMode } from '@types'
import { useCallback, useEffect, useMemo } from 'react'

import { useSubtitleEngine } from './useSubtitleEngine'

const logger = loggerService.withContext('SubtitleOverlayIntegration')

export interface SubtitleOverlayIntegration {
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

  // 配置状态
  isConfigLoaded: boolean
  currentVideoId: number | null
  currentConfig: any // 从 SubtitleOverlayStore 获取的当前配置

  // 配置操作（基于当前视频项目）
  setDisplayMode: (mode: SubtitleDisplayMode) => void
  setBackgroundType: (type: SubtitleBackgroundType) => void
  setOpacity: (opacity: number) => void
  setPosition: (position: { x: number; y: number }) => void
  setSize: (size: { width: number; height: number }) => void

  // 配置管理
  resetToDefaults: () => void
  saveConfiguration: () => void
}

/**
 * SubtitleOverlay 集成 Hook（重构版）
 */
export function useSubtitleOverlayIntegration(): SubtitleOverlayIntegration {
  // === 基础状态订阅 ===
  const currentVideo = usePlayerSessionStore((s) => s.video) // 当前视频信息

  // 字幕引擎
  const { currentSubtitle, currentIndex } = useSubtitleEngine()

  // === 重构后的覆盖层状态 ===
  const currentConfig = useSubtitleOverlayStore((s) => s.currentConfig)
  const currentVideoId = useSubtitleOverlayStore((s) => s.currentVideoId)
  const loadConfigForVideo = useSubtitleOverlayStore((s) => s.loadConfigForVideo)
  const saveCurrentConfig = useSubtitleOverlayStore((s) => s.saveCurrentConfig)
  const setDisplayMode = useSubtitleOverlayStore((s) => s.setDisplayMode)
  const setBackgroundType = useSubtitleOverlayStore((s) => s.setBackgroundType)
  const setOpacity = useSubtitleOverlayStore((s) => s.setOpacity)
  const setPosition = useSubtitleOverlayStore((s) => s.setPosition)
  const setSize = useSubtitleOverlayStore((s) => s.setSize)
  const resetToDefaults = useSubtitleOverlayStore((s) => s.resetToDefaults)

  // === 视频切换时自动加载配置 ===
  useEffect(() => {
    if (currentVideo?.id && currentVideoId !== currentVideo.id) {
      loadConfigForVideo(currentVideo.id)
      logger.info('视频切换，加载新的字幕配置', {
        videoId: currentVideo.id,
        previousVideoId: currentVideoId
      })
    }
  }, [currentVideo?.id, currentVideoId, loadConfigForVideo])

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
    return currentConfig?.displayMode !== SubtitleDisplayMode.NONE && currentSubtitleData !== null
  }, [currentConfig?.displayMode, currentSubtitleData])

  // === 计算显示文本 ===
  const displayText = useMemo(() => {
    if (!currentSubtitleData || !shouldShow || !currentConfig) return ''

    switch (currentConfig.displayMode) {
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
  }, [currentConfig, currentSubtitleData, shouldShow])

  // === 配置操作的包装器（添加 PlayerStore 同步） ===
  const setDisplayModeWithSync = useCallback(
    (mode: SubtitleDisplayMode) => {
      setDisplayMode(mode)
      logger.info('设置字幕显示模式', { mode })
    },
    [setDisplayMode]
  )

  const setBackgroundTypeHandler = useCallback(
    (type: SubtitleBackgroundType) => {
      setBackgroundType(type)
      logger.info('设置字幕背景类型', { type })
    },
    [setBackgroundType]
  )

  const setOpacityHandler = useCallback(
    (opacity: number) => {
      setOpacity(opacity)
      logger.debug('设置字幕透明度', { opacity })
    },
    [setOpacity]
  )

  const setPositionHandler = useCallback(
    (position: { x: number; y: number }) => {
      setPosition(position)
      logger.debug('设置字幕位置', { position })
    },
    [setPosition]
  )

  const setSizeHandler = useCallback(
    (size: { width: number; height: number }) => {
      setSize(size)
      logger.debug('设置字幕尺寸', { size })
    },
    [setSize]
  )

  const resetToDefaultsHandler = useCallback(() => {
    if (currentVideoId) {
      resetToDefaults(currentVideoId)
      logger.info('重置字幕配置到默认值', { videoId: currentVideoId })
    }
  }, [resetToDefaults, currentVideoId])

  const saveConfigurationHandler = useCallback(() => {
    saveCurrentConfig()
    logger.info('保存字幕配置', { videoId: currentVideoId })
  }, [saveCurrentConfig, currentVideoId])

  return {
    currentSubtitle: currentSubtitleData,
    shouldShow,
    displayText,
    isConfigLoaded: currentConfig !== null,
    currentVideoId,
    currentConfig,
    setDisplayMode: setDisplayModeWithSync,
    setBackgroundType: setBackgroundTypeHandler,
    setOpacity: setOpacityHandler,
    setPosition: setPositionHandler,
    setSize: setSizeHandler,
    resetToDefaults: resetToDefaultsHandler,
    saveConfiguration: saveConfigurationHandler
  }
}

export default useSubtitleOverlayIntegration
