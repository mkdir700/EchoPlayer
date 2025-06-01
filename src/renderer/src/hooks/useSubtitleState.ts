import React, { useState, useCallback } from 'react'

// 背景颜色类型
export type BackgroundType = 'transparent' | 'blur' | 'solid-black' | 'solid-gray'

// 字幕边距状态接口
export interface SubtitleMarginsState {
  margins: {
    left: number
    top: number
    right: number
    bottom: number
  }
  backgroundType: BackgroundType
  isMaskMode: boolean
  maskFrame: {
    left: number
    top: number
    width: number
    height: number
  }
}

// 背景类型配置
export const BACKGROUND_TYPES: Array<{ type: BackgroundType; label: string; icon: string }> = [
  { type: 'transparent', label: '完全透明', icon: '○' },
  { type: 'blur', label: '模糊背景', icon: '◐' },
  { type: 'solid-black', label: '黑色背景', icon: '●' },
  { type: 'solid-gray', label: '灰色背景', icon: '◉' }
]

// 边距限制常量
export const MARGIN_LIMITS = {
  MIN_TOTAL_WIDTH: 20,
  MIN_TOTAL_HEIGHT: 10,
  MAX_SINGLE_MARGIN: 80
}

// 本地存储键名
const SUBTITLE_STATE_KEY = 'echolab_subtitle_state_v3'

// 创建默认状态
export const createDefaultSubtitleState = (dynamicMaskFrame?: {
  left: number
  top: number
  width: number
  height: number
}): SubtitleMarginsState => ({
  margins: {
    left: 20,
    top: 75,
    right: 20,
    bottom: 5
  },
  backgroundType: 'transparent',
  isMaskMode: false,
  maskFrame: dynamicMaskFrame || {
    left: 0,
    top: 25,
    width: 100,
    height: 50
  }
})

// 默认状态
const DEFAULT_SUBTITLE_STATE: SubtitleMarginsState = createDefaultSubtitleState()

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
  // 初始化状态
  const [subtitleState, setSubtitleState] = useState<SubtitleMarginsState>(() => {
    try {
      const saved = localStorage.getItem(SUBTITLE_STATE_KEY)
      if (saved) {
        const parsedState = JSON.parse(saved)

        // 验证配置有效性
        const isValidMargins =
          parsedState.margins &&
          typeof parsedState.margins.left === 'number' &&
          typeof parsedState.margins.top === 'number' &&
          typeof parsedState.margins.right === 'number' &&
          typeof parsedState.margins.bottom === 'number' &&
          parsedState.margins.left >= 0 &&
          parsedState.margins.top >= 0 &&
          parsedState.margins.right >= 0 &&
          parsedState.margins.bottom >= 0 &&
          parsedState.margins.left <= MARGIN_LIMITS.MAX_SINGLE_MARGIN &&
          parsedState.margins.top <= MARGIN_LIMITS.MAX_SINGLE_MARGIN &&
          parsedState.margins.right <= MARGIN_LIMITS.MAX_SINGLE_MARGIN &&
          parsedState.margins.bottom <= MARGIN_LIMITS.MAX_SINGLE_MARGIN &&
          100 - parsedState.margins.left - parsedState.margins.right >=
            MARGIN_LIMITS.MIN_TOTAL_WIDTH &&
          100 - parsedState.margins.top - parsedState.margins.bottom >=
            MARGIN_LIMITS.MIN_TOTAL_HEIGHT

        const isValidBackgroundType =
          parsedState.backgroundType &&
          ['transparent', 'blur', 'solid-black', 'solid-gray'].includes(parsedState.backgroundType)

        const isValidMaskMode = typeof parsedState.isMaskMode === 'boolean'

        const isValidMaskFrame =
          parsedState.maskFrame &&
          typeof parsedState.maskFrame.left === 'number' &&
          typeof parsedState.maskFrame.top === 'number' &&
          typeof parsedState.maskFrame.width === 'number' &&
          typeof parsedState.maskFrame.height === 'number' &&
          parsedState.maskFrame.left >= 0 &&
          parsedState.maskFrame.top >= 0 &&
          parsedState.maskFrame.width > 0 &&
          parsedState.maskFrame.height > 0 &&
          parsedState.maskFrame.left + parsedState.maskFrame.width <= 100 &&
          parsedState.maskFrame.top + parsedState.maskFrame.height <= 100

        if (!isValidMargins || !isValidBackgroundType) {
          console.warn('🔧 检测到无效的字幕配置，已重置为默认配置')
          localStorage.removeItem(SUBTITLE_STATE_KEY)
          return DEFAULT_SUBTITLE_STATE
        }

        const maskFrame = isValidMaskFrame
          ? parsedState.maskFrame
          : DEFAULT_SUBTITLE_STATE.maskFrame

        return {
          ...DEFAULT_SUBTITLE_STATE,
          ...parsedState,
          isMaskMode: isValidMaskMode ? parsedState.isMaskMode : false,
          maskFrame: maskFrame
        }
      }
      return DEFAULT_SUBTITLE_STATE
    } catch (error) {
      console.warn('🔧 解析字幕配置失败，已重置为默认配置:', error)
      localStorage.removeItem(SUBTITLE_STATE_KEY)
      return DEFAULT_SUBTITLE_STATE
    }
  })

  // 保存状态到本地存储
  const saveSubtitleState = useCallback((state: SubtitleMarginsState) => {
    try {
      localStorage.setItem(SUBTITLE_STATE_KEY, JSON.stringify(state))
    } catch (error) {
      console.warn('无法保存字幕状态:', error)
    }
  }, [])

  // 更新状态并保存
  const updateSubtitleState = useCallback(
    (newState: SubtitleMarginsState) => {
      setSubtitleState(newState)
      saveSubtitleState(newState)
    },
    [saveSubtitleState]
  )

  // 切换背景类型
  const toggleBackgroundType = useCallback(() => {
    setSubtitleState((prev) => {
      const currentIndex = BACKGROUND_TYPES.findIndex((bg) => bg.type === prev.backgroundType)
      const nextIndex = (currentIndex + 1) % BACKGROUND_TYPES.length
      const newState = {
        ...prev,
        backgroundType: BACKGROUND_TYPES[nextIndex].type
      }
      saveSubtitleState(newState)
      return newState
    })
  }, [saveSubtitleState])

  // 计算默认定位框
  const calculateDefaultMaskFrame = useCallback(
    (displayAspectRatio: number, containerWidth: number, containerHeight: number) => {
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
    },
    []
  )

  // 切换遮罩模式
  const toggleMaskMode = useCallback(() => {
    const defaultMaskFrame = calculateDefaultMaskFrame(
      displayAspectRatio,
      containerWidth,
      containerHeight
    )
    setSubtitleState((prev) => {
      const newState = {
        ...prev,
        isMaskMode: !prev.isMaskMode,
        maskFrame: defaultMaskFrame
      }
      saveSubtitleState(newState)
      return newState
    })
  }, [
    calculateDefaultMaskFrame,
    displayAspectRatio,
    containerWidth,
    containerHeight,
    saveSubtitleState
  ])

  return {
    subtitleState,
    setSubtitleState,
    updateSubtitleState,
    toggleBackgroundType,
    toggleMaskMode,
    saveSubtitleState
  }
}
