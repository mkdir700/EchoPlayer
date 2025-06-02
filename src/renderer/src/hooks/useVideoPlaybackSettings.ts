import { useState, useEffect, useCallback, useRef } from 'react'
import type {
  VideoPlaybackSettings,
  SubtitleDisplaySettings,
  BackgroundType,
  SubtitleMargins,
  MaskFrame
} from '@types_/shared'
import { usePlaybackSettingsContext } from './usePlaybackSettingsContext'
import { usePlayingVideoContext } from './usePlayingVideoContext'
import { useRecentPlayList } from './useRecentPlayList'
// import { DisplayMode } from '@renderer/types'

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

// 创建默认字幕显示设置
export const createDefaultSubtitleDisplay = (
  dynamicMaskFrame?: MaskFrame
): SubtitleDisplaySettings => ({
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

export interface UseVideoPlaybackSettingsReturn {
  // 当前设置状态
  settings: VideoPlaybackSettings
  hasCustomSettings: boolean
  isLoading: boolean

  // 操作方法
  updateSetting: <K extends keyof VideoPlaybackSettings>(
    key: K,
    value: VideoPlaybackSettings[K]
  ) => void
  resetToGlobal: () => Promise<boolean>

  // 便捷方法 - 基础播放设置
  setDisplayMode: (mode: VideoPlaybackSettings['displayMode']) => void
  setVolume: (volume: number) => void
  setPlaybackRate: (rate: number) => void
  setSingleLoop: (enabled: boolean) => void
  setAutoPause: (enabled: boolean) => void

  // 便捷方法 - 字幕显示设置
  setSubtitleDisplay: (settings: SubtitleDisplaySettings) => void
  updateSubtitleMargins: (margins: SubtitleMargins) => void
  updateSubtitleBackgroundType: (backgroundType: BackgroundType) => void
  updateSubtitleMaskMode: (isMaskMode: boolean) => void
  updateSubtitleMaskFrame: (maskFrame: MaskFrame) => void
  toggleBackgroundType: () => void
  toggleMaskMode: (
    containerWidth: number,
    containerHeight: number,
    displayAspectRatio: number
  ) => void

  // 字幕状态获取方法
  getSubtitleDisplay: () => SubtitleDisplaySettings
  getSubtitleMargins: () => SubtitleMargins
  getSubtitleBackgroundType: () => BackgroundType
  getSubtitleMaskMode: () => boolean
  getSubtitleMaskFrame: () => MaskFrame
}

/**
 * 视频播放设置管理 Hook - 集成字幕状态管理
 *
 * 设计原则：
 * 1. 简单的状态管理，避免复杂的订阅机制
 * 2. 清晰的数据流：全局设置 -> 视频特定设置 -> UI
 * 3. 最少的重新渲染和副作用
 * 4. 容错性和边界情况处理
 * 5. 集成字幕显示设置管理
 */
export function useVideoPlaybackSettings(): UseVideoPlaybackSettingsReturn {
  const globalPlaybackSettings = usePlaybackSettingsContext()
  const playingVideoContext = usePlayingVideoContext()
  const { getRecentPlayByPath, updateRecentPlaySilent } = useRecentPlayList()

  // 核心状态
  const [settings, setSettings] = useState<VideoPlaybackSettings>(() => {
    // 初始化为全局设置，提供默认值以防全局设置未加载
    const global = globalPlaybackSettings.playbackSettings
    return {
      displayMode: global?.displayMode ?? 'bilingual',
      volume: global?.volume ?? 1,
      playbackRate: global?.playbackRate ?? 1,
      isSingleLoop: global?.isSingleLoop ?? false,
      isAutoPause: global?.isAutoPause ?? false,
      subtitleDisplay: createDefaultSubtitleDisplay()
    }
  })

  const [hasCustomSettings, setHasCustomSettings] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // 用于避免重复保存的防抖
  const saveTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const recentPlayIdRef = useRef<string | null>(null)

  /**
   * 从数据库加载视频特定设置
   */
  const loadVideoSettings = useCallback(async () => {
    const filePath = playingVideoContext.originalFilePath
    if (!filePath) {
      // 没有视频文件时，重置为全局设置
      const global = globalPlaybackSettings.playbackSettings
      setSettings({
        displayMode: global?.displayMode ?? 'bilingual',
        volume: global?.volume ?? 1,
        playbackRate: global?.playbackRate ?? 1,
        isSingleLoop: global?.isSingleLoop ?? false,
        isAutoPause: global?.isAutoPause ?? true,
        subtitleDisplay: createDefaultSubtitleDisplay()
      })
      setHasCustomSettings(false)
      recentPlayIdRef.current = null
      return
    }

    setIsLoading(true)
    try {
      const recentPlay = await getRecentPlayByPath(filePath)

      if (recentPlay?.id) {
        recentPlayIdRef.current = recentPlay.id

        if (recentPlay.videoPlaybackSettings) {
          // 有视频特定设置
          console.log('📺 加载视频特定设置:', recentPlay.videoPlaybackSettings)

          // 确保字幕显示设置存在，如果不存在则使用默认值
          const subtitleDisplay =
            recentPlay.videoPlaybackSettings.subtitleDisplay || createDefaultSubtitleDisplay()

          setSettings({
            ...recentPlay.videoPlaybackSettings,
            subtitleDisplay
          })
          setHasCustomSettings(true)
        } else {
          // 使用全局设置作为默认值
          console.log('🌐 使用全局设置作为默认值')
          const global = globalPlaybackSettings.playbackSettings
          setSettings({
            displayMode: global?.displayMode ?? 'bilingual',
            volume: global?.volume ?? 1,
            playbackRate: global?.playbackRate ?? 1,
            isSingleLoop: global?.isSingleLoop ?? false,
            isAutoPause: global?.isAutoPause ?? false,
            subtitleDisplay: createDefaultSubtitleDisplay()
          })
          setHasCustomSettings(false)
        }
      } else {
        console.warn('未找到对应的播放记录')
        recentPlayIdRef.current = null
        setHasCustomSettings(false)
      }
    } catch (error) {
      console.error('加载视频设置失败:', error)
      setHasCustomSettings(false)
    } finally {
      setIsLoading(false)
    }
  }, [
    playingVideoContext.originalFilePath,
    getRecentPlayByPath,
    globalPlaybackSettings.playbackSettings
  ])

  /**
   * 保存设置到数据库（带防抖）
   */
  const saveSettings = useCallback(
    (newSettings: VideoPlaybackSettings) => {
      if (!recentPlayIdRef.current) {
        console.warn('无法保存：没有有效的播放记录ID')
        return
      }

      // 清除之前的定时器
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }

      // 300ms 防抖
      saveTimeoutRef.current = setTimeout(async () => {
        try {
          console.log('💾 保存视频播放设置:', newSettings)
          const success = await updateRecentPlaySilent(recentPlayIdRef.current!, {
            videoPlaybackSettings: newSettings
          })

          if (success) {
            console.log('✅ 保存成功')
          } else {
            console.error('❌ 保存失败')
          }
        } catch (error) {
          console.error('💥 保存时发生错误:', error)
        }
      }, 300)
    },
    [updateRecentPlaySilent]
  )

  /**
   * 更新单个设置字段
   */
  const updateSetting = useCallback(
    <K extends keyof VideoPlaybackSettings>(key: K, value: VideoPlaybackSettings[K]) => {
      console.log(`🔧 更新设置: ${key} =`, value)

      setSettings((prev) => {
        const newSettings = { ...prev, [key]: value }

        // 异步保存到数据库
        saveSettings(newSettings)

        return newSettings
      })

      setHasCustomSettings(true)
    },
    [saveSettings]
  )

  /**
   * 重置为全局设置
   */
  const resetToGlobal = useCallback(async (): Promise<boolean> => {
    if (!recentPlayIdRef.current) {
      return false
    }

    try {
      console.log('🔄 重置为全局设置')

      // 删除视频特定设置
      const success = await updateRecentPlaySilent(recentPlayIdRef.current, {
        videoPlaybackSettings: undefined
      })

      if (success) {
        // 重置为全局设置
        const global = globalPlaybackSettings.playbackSettings
        setSettings({
          displayMode: global?.displayMode ?? 'bilingual',
          volume: global?.volume ?? 1,
          playbackRate: global?.playbackRate ?? 1,
          isSingleLoop: global?.isSingleLoop ?? false,
          isAutoPause: global?.isAutoPause ?? false,
          subtitleDisplay: createDefaultSubtitleDisplay()
        })
        setHasCustomSettings(false)
        console.log('✅ 重置成功')
        return true
      } else {
        console.error('❌ 重置失败')
        return false
      }
    } catch (error) {
      console.error('💥 重置时发生错误:', error)
      return false
    }
  }, [updateRecentPlaySilent, globalPlaybackSettings.playbackSettings])

  // 便捷的基础设置方法
  const setDisplayMode = useCallback(
    (mode: VideoPlaybackSettings['displayMode']) => updateSetting('displayMode', mode),
    [updateSetting]
  )

  const setVolume = useCallback(
    (volume: number) => updateSetting('volume', volume),
    [updateSetting]
  )

  const setPlaybackRate = useCallback(
    (rate: number) => updateSetting('playbackRate', rate),
    [updateSetting]
  )

  const setSingleLoop = useCallback(
    (enabled: boolean) => {
      console.log('🔄 setSingleLoop 被调用:', enabled)
      updateSetting('isSingleLoop', enabled)
    },
    [updateSetting]
  )

  const setAutoPause = useCallback(
    (enabled: boolean) => updateSetting('isAutoPause', enabled),
    [updateSetting]
  )

  // 字幕显示设置方法
  const setSubtitleDisplay = useCallback(
    (subtitleDisplay: SubtitleDisplaySettings) => updateSetting('subtitleDisplay', subtitleDisplay),
    [updateSetting]
  )

  const updateSubtitleMargins = useCallback(
    (margins: SubtitleMargins) => {
      setSettings((prev) => {
        const newSubtitleDisplay = {
          ...prev.subtitleDisplay!,
          margins
        }
        const newSettings = {
          ...prev,
          subtitleDisplay: newSubtitleDisplay
        }
        saveSettings(newSettings)
        return newSettings
      })
      setHasCustomSettings(true)
    },
    [saveSettings]
  )

  const updateSubtitleBackgroundType = useCallback(
    (backgroundType: BackgroundType) => {
      setSettings((prev) => {
        const newSubtitleDisplay = {
          ...prev.subtitleDisplay!,
          backgroundType
        }
        const newSettings = {
          ...prev,
          subtitleDisplay: newSubtitleDisplay
        }
        saveSettings(newSettings)
        return newSettings
      })
      setHasCustomSettings(true)
    },
    [saveSettings]
  )

  const updateSubtitleMaskMode = useCallback(
    (isMaskMode: boolean) => {
      setSettings((prev) => {
        const newSubtitleDisplay = {
          ...prev.subtitleDisplay!,
          isMaskMode
        }
        const newSettings = {
          ...prev,
          subtitleDisplay: newSubtitleDisplay
        }
        saveSettings(newSettings)
        return newSettings
      })
      setHasCustomSettings(true)
    },
    [saveSettings]
  )

  const updateSubtitleMaskFrame = useCallback(
    (maskFrame: MaskFrame) => {
      setSettings((prev) => {
        const newSubtitleDisplay = {
          ...prev.subtitleDisplay!,
          maskFrame
        }
        const newSettings = {
          ...prev,
          subtitleDisplay: newSubtitleDisplay
        }
        saveSettings(newSettings)
        return newSettings
      })
      setHasCustomSettings(true)
    },
    [saveSettings]
  )

  // 切换背景类型
  const toggleBackgroundType = useCallback(() => {
    setSettings((prev) => {
      const currentIndex = BACKGROUND_TYPES.findIndex(
        (bg) => bg.type === prev.subtitleDisplay!.backgroundType
      )
      const nextIndex = (currentIndex + 1) % BACKGROUND_TYPES.length
      const newSubtitleDisplay = {
        ...prev.subtitleDisplay!,
        backgroundType: BACKGROUND_TYPES[nextIndex].type
      }
      const newSettings = {
        ...prev,
        subtitleDisplay: newSubtitleDisplay
      }
      saveSettings(newSettings)
      return newSettings
    })
    setHasCustomSettings(true)
  }, [saveSettings])

  // 计算默认定位框
  const calculateDefaultMaskFrame = useCallback(
    (displayAspectRatio: number, containerWidth: number, containerHeight: number): MaskFrame => {
      // 参数验证，防止 NaN
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
        // 返回安全的默认值
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

      // 确保所有计算结果都是有效数字
      const result = {
        left: Math.max(0, Math.min(100, isFinite(videoLeftPercent) ? videoLeftPercent : 0)),
        top: Math.max(0, Math.min(100, isFinite(videoTopPercent) ? videoTopPercent : 25)),
        width: Math.max(10, Math.min(100, isFinite(videoWidthPercent) ? videoWidthPercent : 100)),
        height: Math.max(10, Math.min(100, isFinite(videoHeightPercent) ? videoHeightPercent : 50))
      }

      return result
    },
    []
  )

  // 切换遮罩模式
  const toggleMaskMode = useCallback(
    (containerWidth: number, containerHeight: number, displayAspectRatio: number) => {
      const defaultMaskFrame = calculateDefaultMaskFrame(
        displayAspectRatio,
        containerWidth,
        containerHeight
      )
      console.log('🔄 toggleMaskMode', {
        displayAspectRatio,
        containerWidth,
        containerHeight,
        defaultMaskFrame
      })

      setSettings((prev) => {
        const newSubtitleDisplay = {
          ...prev.subtitleDisplay!,
          isMaskMode: !prev.subtitleDisplay!.isMaskMode,
          maskFrame: defaultMaskFrame
        }
        const newSettings = {
          ...prev,
          subtitleDisplay: newSubtitleDisplay
        }
        saveSettings(newSettings)
        return newSettings
      })
      setHasCustomSettings(true)
    },
    [calculateDefaultMaskFrame, saveSettings]
  )

  // 字幕状态获取方法
  const getSubtitleDisplay = useCallback((): SubtitleDisplaySettings => {
    return settings.subtitleDisplay || createDefaultSubtitleDisplay()
  }, [settings.subtitleDisplay])

  const getSubtitleMargins = useCallback((): SubtitleMargins => {
    return settings.subtitleDisplay?.margins || createDefaultSubtitleDisplay().margins
  }, [settings.subtitleDisplay])

  const getSubtitleBackgroundType = useCallback((): BackgroundType => {
    return settings.subtitleDisplay?.backgroundType || 'transparent'
  }, [settings.subtitleDisplay])

  const getSubtitleMaskMode = useCallback((): boolean => {
    return settings.subtitleDisplay?.isMaskMode || false
  }, [settings.subtitleDisplay])

  const getSubtitleMaskFrame = useCallback((): MaskFrame => {
    return settings.subtitleDisplay?.maskFrame || createDefaultSubtitleDisplay().maskFrame
  }, [settings.subtitleDisplay])

  // 当全局设置变化时，如果没有视频特定设置，则更新设置
  useEffect(() => {
    console.log('🔄 全局设置变化检查:', {
      hasCustomSettings,
      hasVideoFile: !!playingVideoContext.originalFilePath,
      globalSettings: globalPlaybackSettings.playbackSettings
    })

    if (!hasCustomSettings && !playingVideoContext.originalFilePath) {
      const global = globalPlaybackSettings.playbackSettings
      if (global) {
        console.log('🔄 应用全局设置到播放设置:', global)
        setSettings((prev) => ({
          ...prev,
          displayMode: global.displayMode ?? prev.displayMode,
          volume: global.volume ?? prev.volume,
          playbackRate: global.playbackRate ?? prev.playbackRate,
          isSingleLoop: global.isSingleLoop ?? prev.isSingleLoop,
          isAutoPause: global.isAutoPause ?? prev.isAutoPause
        }))
      }
    }
  }, [
    globalPlaybackSettings.playbackSettings,
    hasCustomSettings,
    playingVideoContext.originalFilePath
  ])

  // 当视频文件变化时，重新加载设置
  useEffect(() => {
    loadVideoSettings()
  }, [loadVideoSettings])

  // 清理定时器
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  return {
    // 状态
    settings,
    hasCustomSettings,
    isLoading,

    // 操作方法
    updateSetting,
    resetToGlobal,

    // 便捷方法 - 基础播放设置
    setDisplayMode,
    setVolume,
    setPlaybackRate,
    setSingleLoop,
    setAutoPause,

    // 便捷方法 - 字幕显示设置
    setSubtitleDisplay,
    updateSubtitleMargins,
    updateSubtitleBackgroundType,
    updateSubtitleMaskMode,
    updateSubtitleMaskFrame,
    toggleBackgroundType,
    toggleMaskMode,

    // 字幕状态获取方法
    getSubtitleDisplay,
    getSubtitleMargins,
    getSubtitleBackgroundType,
    getSubtitleMaskMode,
    getSubtitleMaskFrame
  }
}
