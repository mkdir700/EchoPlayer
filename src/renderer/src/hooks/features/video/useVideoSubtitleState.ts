import { useCallback } from 'react'
import { useVideoConfig } from './useVideoConfig'
import { SubtitleDisplaySettings } from '@types_/shared'
import { BACKGROUND_TYPES } from '@renderer/hooks/features/subtitle/useSubtitleState'

/**
 * Hook for managing video-specific subtitle display state
 * 管理基于视频文件的字幕显示状态的 Hook
 *
 * This hook replaces the global useSubtitleState and provides per-video subtitle settings.
 * 这个 hook 替代全局的 useSubtitleState，为每个视频提供独立的字幕设置。
 */
export const useVideoSubtitleState = (
  containerWidth: number,
  containerHeight: number,
  displayAspectRatio: number
): {
  subtitleState: SubtitleDisplaySettings
  updateSubtitleState: (newState: SubtitleDisplaySettings) => void
  toggleBackgroundType: () => void
  toggleMaskMode: () => void
} => {
  const { subtitleDisplay, setSubtitleDisplay } = useVideoConfig()

  // 更新字幕状态 / Update subtitle state
  const updateSubtitleState = useCallback(
    (newState: SubtitleDisplaySettings) => {
      setSubtitleDisplay(newState)
    },
    [setSubtitleDisplay]
  )

  // 切换背景类型 / Toggle background type
  const toggleBackgroundType = useCallback(() => {
    const currentIndex = BACKGROUND_TYPES.findIndex(
      (bg) => bg.type === subtitleDisplay.backgroundType
    )
    const nextIndex = (currentIndex + 1) % BACKGROUND_TYPES.length
    const newState: SubtitleDisplaySettings = {
      ...subtitleDisplay,
      backgroundType: BACKGROUND_TYPES[nextIndex].type
    }
    setSubtitleDisplay(newState)
  }, [subtitleDisplay, setSubtitleDisplay])

  // 切换蒙版模式 / Toggle mask mode
  const toggleMaskMode = useCallback(() => {
    // 计算默认定位框 / Calculate default mask frame
    const calculateDefaultMaskFrame = (
      displayAspectRatio: number,
      containerWidth: number,
      containerHeight: number
    ): { left: number; top: number; width: number; height: number } => {
      // 参数验证，防止 NaN / Parameter validation to prevent NaN
      if (
        !containerWidth ||
        !containerHeight ||
        !displayAspectRatio ||
        containerWidth <= 0 ||
        containerHeight <= 0 ||
        displayAspectRatio <= 0 ||
        !isFinite(containerWidth) ||
        !isFinite(containerHeight) ||
        !isFinite(displayAspectRatio)
      ) {
        console.warn('🔧 calculateDefaultMaskFrame 参数无效，使用默认值:', {
          containerWidth,
          containerHeight,
          displayAspectRatio
        })
        return {
          left: 0,
          top: 25,
          width: 100,
          height: 50
        }
      }

      const containerAspectRatio = containerWidth / containerHeight
      let videoDisplayWidth: number, videoDisplayHeight: number, videoLeft: number, videoTop: number

      if (displayAspectRatio > containerAspectRatio) {
        videoDisplayWidth = containerWidth
        videoDisplayHeight = containerWidth / displayAspectRatio
        videoLeft = 0
        videoTop = (containerHeight - videoDisplayHeight) / 2
      } else {
        videoDisplayHeight = containerHeight
        videoDisplayWidth = containerHeight * displayAspectRatio
        videoTop = 0
        videoLeft = (containerWidth - videoDisplayWidth) / 2
      }

      const videoLeftPercent = (videoLeft / containerWidth) * 100
      const videoTopPercent = (videoTop / containerHeight) * 100
      const videoWidthPercent = (videoDisplayWidth / containerWidth) * 100
      const videoHeightPercent = (videoDisplayHeight / containerHeight) * 100

      return {
        left: Math.max(0, Math.min(100, videoLeftPercent)),
        top: Math.max(0, Math.min(100, videoTopPercent)),
        width: Math.max(10, Math.min(100, videoWidthPercent)),
        height: Math.max(10, Math.min(100, videoHeightPercent))
      }
    }

    if (!subtitleDisplay.isMaskMode) {
      // 启用蒙版模式时，计算默认蒙版框 / When enabling mask mode, calculate default mask frame
      const defaultMaskFrame = calculateDefaultMaskFrame(
        displayAspectRatio,
        containerWidth,
        containerHeight
      )

      const newState: SubtitleDisplaySettings = {
        ...subtitleDisplay,
        isMaskMode: true,
        maskFrame: defaultMaskFrame
      }
      setSubtitleDisplay(newState)
    } else {
      // 禁用蒙版模式 / Disable mask mode
      const newState: SubtitleDisplaySettings = {
        ...subtitleDisplay,
        isMaskMode: false
      }
      setSubtitleDisplay(newState)
    }
  }, [subtitleDisplay, setSubtitleDisplay, displayAspectRatio, containerWidth, containerHeight])

  return {
    subtitleState: subtitleDisplay,
    updateSubtitleState,
    toggleBackgroundType,
    toggleMaskMode
  }
}
