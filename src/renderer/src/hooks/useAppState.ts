import { useState, useCallback, useEffect, useRef } from 'react'
import { message } from 'antd'
import { SubtitleItem } from '@types_/shared'

// 应用状态接口
export interface AppStateData {
  // 视频相关
  videoFilePath?: string
  videoFileName?: string
  currentTime: number
  playbackRate: number
  volume: number

  // 字幕相关
  subtitles: SubtitleItem[]
  currentSubtitleIndex: number
  isAutoScrollEnabled: boolean
  displayMode: 'none' | 'original' | 'chinese' | 'english' | 'bilingual'

  // 控制配置
  isSingleLoop: boolean
  isAutoPause: boolean

  // UI状态
  sidebarWidth: number

  // 最近文件列表
  recentFiles: RecentFileItem[]

  // 元数据
  lastSavedAt: number
}

// 最近文件项接口
export interface RecentFileItem {
  filePath: string
  fileName: string
  lastOpenedAt: number
  duration?: number
  thumbnail?: string
}

// 默认状态
const DEFAULT_STATE: AppStateData = {
  currentTime: 0,
  playbackRate: 1,
  volume: 0.8,
  subtitles: [],
  currentSubtitleIndex: -1,
  isAutoScrollEnabled: true,
  displayMode: 'bilingual',
  isSingleLoop: false,
  isAutoPause: false,
  sidebarWidth: 400,
  recentFiles: [],
  lastSavedAt: Date.now()
}

// 存储键名
const STORAGE_KEY = 'echolab_app_state'

interface UseAppStateReturn {
  // 状态数据
  appState: AppStateData

  // 保存和恢复方法
  saveAppState: (partialState: Partial<AppStateData>) => void
  restoreAppState: () => Promise<AppStateData | null>
  clearAppState: () => void

  // 自动保存控制
  enableAutoSave: (enabled: boolean) => void
  isAutoSaveEnabled: boolean
}

export function useAppState(): UseAppStateReturn {
  const [appState, setAppState] = useState<AppStateData>(DEFAULT_STATE)
  const [isAutoSaveEnabled, setIsAutoSaveEnabled] = useState(false) // 默认禁用自动保存

  // 防抖保存的定时器
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // 保存状态到本地存储
  const saveToStorage = useCallback((state: AppStateData) => {
    try {
      const stateToSave = {
        ...state,
        lastSavedAt: Date.now()
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave))
      console.log('✅ 应用状态已保存:', stateToSave)
    } catch (error) {
      console.error('❌ 保存应用状态失败:', error)
      message.error('保存应用状态失败')
    }
  }, [])

  // 从本地存储加载状态
  const loadFromStorage = useCallback((): AppStateData | null => {
    try {
      const savedState = localStorage.getItem(STORAGE_KEY)
      if (!savedState) {
        console.log('📝 未找到保存的应用状态，使用默认状态')
        return null
      }

      const parsedState = JSON.parse(savedState) as AppStateData

      // 验证状态数据的完整性
      const validatedState: AppStateData = {
        ...DEFAULT_STATE,
        ...parsedState,
        // 确保关键字段存在
        subtitles: Array.isArray(parsedState.subtitles) ? parsedState.subtitles : [],
        currentTime: typeof parsedState.currentTime === 'number' ? parsedState.currentTime : 0,
        currentSubtitleIndex:
          typeof parsedState.currentSubtitleIndex === 'number'
            ? parsedState.currentSubtitleIndex
            : -1
      }

      console.log('✅ 成功加载应用状态:', validatedState)
      return validatedState
    } catch (error) {
      console.error('❌ 加载应用状态失败:', error)
      message.error('加载应用状态失败，将使用默认设置')
      return null
    }
  }, [])

  // 保存应用状态（带防抖）
  const saveAppState = useCallback(
    (partialState: Partial<AppStateData>) => {
      setAppState((prevState) => {
        const newState = { ...prevState, ...partialState }

        // 如果启用了自动保存，使用防抖保存
        if (isAutoSaveEnabled) {
          if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current)
          }

          saveTimeoutRef.current = setTimeout(() => {
            saveToStorage(newState)
          }, 1000) // 1秒防抖
        }

        return newState
      })
    },
    [isAutoSaveEnabled, saveToStorage]
  )

  // 恢复应用状态
  const restoreAppState = useCallback(async (): Promise<AppStateData | null> => {
    const savedState = loadFromStorage()
    if (savedState) {
      setAppState(savedState)
      return savedState
    }
    return null
  }, [loadFromStorage])

  // 清除应用状态
  const clearAppState = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY)
      setAppState(DEFAULT_STATE)
      console.log('🗑️ 应用状态已清除')
      message.success('应用状态已重置')
    } catch (error) {
      console.error('❌ 清除应用状态失败:', error)
      message.error('清除应用状态失败')
    }
  }, [])

  // 启用/禁用自动保存
  const enableAutoSave = useCallback((enabled: boolean) => {
    setIsAutoSaveEnabled(enabled)

    if (enabled) {
      console.log('🔄 自动保存已启用')
    } else {
      console.log('⏸️ 自动保存已禁用')
      // 禁用自动保存时，清除待执行的保存任务，但不立即保存
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
        saveTimeoutRef.current = null
      }
    }
  }, [])

  // 组件卸载时保存状态
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
      // 只有在启用自动保存时才在组件卸载时保存
      if (isAutoSaveEnabled) {
        saveToStorage(appState)
      }
    }
  }, [appState, saveToStorage, isAutoSaveEnabled])

  // 页面卸载时保存状态
  useEffect(() => {
    const handleBeforeUnload = (): void => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
      // 只有在启用自动保存时才在页面卸载时保存
      if (isAutoSaveEnabled) {
        saveToStorage(appState)
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return (): void => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [appState, saveToStorage, isAutoSaveEnabled])

  return {
    appState,
    saveAppState,
    restoreAppState,
    clearAppState,
    enableAutoSave,
    isAutoSaveEnabled
  }
}
