import React, { useCallback, useMemo } from 'react'
import type {
  SubtitleDisplaySettings,
  BackgroundType,
  SubtitleMargins,
  MaskFrame
} from '@types_/shared'
import {
  useVideoPlaybackSettings,
  BACKGROUND_TYPES,
  MARGIN_LIMITS,
  createDefaultSubtitleDisplay
} from './useVideoPlaybackSettings'

// 重新导出类型和常量以保持向后兼容
export type { BackgroundType }
export { BACKGROUND_TYPES, MARGIN_LIMITS, createDefaultSubtitleDisplay }

// 字幕边距状态接口 - 保持向后兼容
export interface SubtitleMarginsState {
  margins: SubtitleMargins
  backgroundType: BackgroundType
  isMaskMode: boolean
  maskFrame: MaskFrame
}

/**
 * 字幕状态管理 Hook - 兼容性层
 *
 * 这个 Hook 现在作为 useVideoPlaybackSettings 的兼容性层，
 * 将字幕状态管理委托给集成的播放设置管理。
 *
 * @deprecated 建议直接使用 useVideoPlaybackSettings 中的字幕相关方法
 */
export const useSubtitleState = (
  containerWidth: number,
  containerHeight: number,
  displayAspectRatio: number
): {
  subtitleState: SubtitleMarginsState
  setSubtitleState: React.Dispatch<React.SetStateAction<SubtitleMarginsState>>
  updateSubtitleState: (newState: SubtitleMarginsState) => void
  toggleBackgroundType: () => void
  toggleMaskMode: () => void
  saveSubtitleState: (state: SubtitleMarginsState) => void
} => {
  const playbackSettings = useVideoPlaybackSettings()

  // 将 SubtitleDisplaySettings 转换为 SubtitleMarginsState 格式
  const subtitleState = useMemo((): SubtitleMarginsState => {
    const display = playbackSettings.getSubtitleDisplay()
    return {
      margins: display.margins,
      backgroundType: display.backgroundType,
      isMaskMode: display.isMaskMode,
      maskFrame: display.maskFrame
    }
  }, [playbackSettings])

  // 更新字幕状态
  const updateSubtitleState = useCallback(
    (newState: SubtitleMarginsState) => {
      const subtitleDisplay: SubtitleDisplaySettings = {
        margins: newState.margins,
        backgroundType: newState.backgroundType,
        isMaskMode: newState.isMaskMode,
        maskFrame: newState.maskFrame
      }
      playbackSettings.setSubtitleDisplay(subtitleDisplay)
    },
    [playbackSettings]
  )

  // setSubtitleState - 兼容性方法
  const setSubtitleState = useCallback(
    (newState: SubtitleMarginsState | ((prev: SubtitleMarginsState) => SubtitleMarginsState)) => {
      if (typeof newState === 'function') {
        const currentState = subtitleState
        const nextState = newState(currentState)
        updateSubtitleState(nextState)
      } else {
        updateSubtitleState(newState)
      }
    },
    [subtitleState, updateSubtitleState]
  )

  // 切换背景类型
  const toggleBackgroundType = useCallback(() => {
    playbackSettings.toggleBackgroundType()
  }, [playbackSettings])

  // 切换遮罩模式
  const toggleMaskMode = useCallback(() => {
    playbackSettings.toggleMaskMode(containerWidth, containerHeight, displayAspectRatio)
  }, [playbackSettings, containerWidth, containerHeight, displayAspectRatio])

  // 保存字幕状态 - 兼容性方法
  const saveSubtitleState = useCallback(
    (state: SubtitleMarginsState) => {
      updateSubtitleState(state)
    },
    [updateSubtitleState]
  )

  return {
    subtitleState,
    setSubtitleState,
    updateSubtitleState,
    toggleBackgroundType,
    toggleMaskMode,
    saveSubtitleState
  }
}

/**
 * 现代化的字幕状态管理 Hook
 *
 * 直接使用 useVideoPlaybackSettings 的字幕功能，
 * 提供更清晰的 API。
 */
export const useSubtitleDisplaySettings = (
  containerWidth: number,
  containerHeight: number,
  displayAspectRatio: number
): {
  subtitleDisplay: SubtitleDisplaySettings
  margins: SubtitleMargins
  backgroundType: BackgroundType
  isMaskMode: boolean
  maskFrame: MaskFrame
  updateMargins: (margins: SubtitleMargins) => void
  updateBackgroundType: (backgroundType: BackgroundType) => void
  updateMaskMode: (isMaskMode: boolean) => void
  updateMaskFrame: (maskFrame: MaskFrame) => void
  toggleBackgroundType: () => void
  toggleMaskMode: () => void
  setSubtitleDisplay: (settings: SubtitleDisplaySettings) => void
} => {
  const playbackSettings = useVideoPlaybackSettings()

  const subtitleDisplay = useMemo(() => {
    return playbackSettings.getSubtitleDisplay()
  }, [playbackSettings])

  return {
    // 状态
    subtitleDisplay,
    margins: playbackSettings.getSubtitleMargins(),
    backgroundType: playbackSettings.getSubtitleBackgroundType(),
    isMaskMode: playbackSettings.getSubtitleMaskMode(),
    maskFrame: playbackSettings.getSubtitleMaskFrame(),

    // 更新方法
    updateMargins: playbackSettings.updateSubtitleMargins,
    updateBackgroundType: playbackSettings.updateSubtitleBackgroundType,
    updateMaskMode: playbackSettings.updateSubtitleMaskMode,
    updateMaskFrame: playbackSettings.updateSubtitleMaskFrame,

    // 便捷方法
    toggleBackgroundType: playbackSettings.toggleBackgroundType,
    toggleMaskMode: () =>
      playbackSettings.toggleMaskMode(containerWidth, containerHeight, displayAspectRatio),

    // 完整设置
    setSubtitleDisplay: playbackSettings.setSubtitleDisplay
  }
}
