/**
 * V2 字幕状态存储 / V2 Subtitle State Store
 *
 * 管理字幕相关的状态，包括字幕数据、当前索引、显示设置、字幕加载状态等
 * Manages subtitle-related state including subtitle data, current index, display settings, loading state, etc.
 */

import { create } from 'zustand'
import { V2MiddlewarePresets, StateDebug, StateValidation } from '../infrastructure'
import { logger } from '@renderer/utils/logger'

// 导入类型定义 / Import type definitions
import type {
  SubtitleItem,
  SubtitleFileInfo
} from '../../infrastructure/types/domain/subtitle.types'
import {
  SubtitleDisplayMode,
  SubtitleFormat,
  SubtitleLanguage
} from '../../infrastructure/types/domain/subtitle.types'

/**
 * 字幕显示配置接口 / Subtitle Display Configuration Interface
 */
export interface SubtitleDisplayConfig {
  readonly mode: SubtitleDisplayMode
  readonly fontSize: number
  readonly fontFamily: string
  readonly fontColor: string
  readonly backgroundColor: string
  readonly backgroundOpacity: number
  readonly isAutoScrollEnabled: boolean
  readonly scrollOffset: number
  readonly lineHeight: number
  readonly letterSpacing: number
}

/**
 * 字幕加载状态接口 / Subtitle Loading State Interface
 */
export interface SubtitleLoadingState {
  readonly isLoading: boolean
  readonly progress: number
  readonly error: string | null
  readonly loadingStartTime?: number
}

/**
 * 字幕导航状态接口 / Subtitle Navigation State Interface
 */
export interface SubtitleNavigationState {
  readonly currentIndex: number
  readonly previousIndex: number
  readonly isAutoNavigationEnabled: boolean
  readonly navigationHistory: readonly number[]
}

/**
 * 字幕状态接口 / Subtitle State Interface
 */
export interface SubtitleState {
  // 字幕数据 / Subtitle data
  readonly subtitles: readonly SubtitleItem[]
  readonly currentSubtitleFile: SubtitleFileInfo | null

  // 导航状态 / Navigation state
  readonly navigation: SubtitleNavigationState

  // 显示配置 / Display configuration
  readonly displayConfig: SubtitleDisplayConfig

  // 字幕加载状态 / Subtitle loading state
  readonly loadingState: SubtitleLoadingState

  // 搜索和过滤 / Search and filtering
  readonly searchQuery: string
  readonly filteredIndices: readonly number[]

  // 字幕文件缓存 / Subtitle file cache
  readonly subtitleCache: Record<string, readonly SubtitleItem[]>
}

/**
 * 字幕操作接口 / Subtitle Actions Interface
 */
export interface SubtitleActions {
  // 字幕加载操作 / Subtitle loading operations
  loadSubtitles: (filePath: string, encoding?: string) => Promise<void>
  setSubtitles: (subtitles: readonly SubtitleItem[]) => void
  clearSubtitles: () => void
  addSubtitle: (subtitle: SubtitleItem, index?: number) => void
  updateSubtitle: (index: number, updates: Partial<SubtitleItem>) => void
  removeSubtitle: (index: number) => void

  // 导航操作 / Navigation operations
  setCurrentIndex: (index: number) => void
  goToNext: () => boolean
  goToPrevious: () => boolean
  goToFirst: () => void
  goToLast: () => void
  jumpToTime: (time: number) => number | null

  // 显示配置操作 / Display configuration operations
  updateDisplayConfig: (config: Partial<SubtitleDisplayConfig>) => void
  setDisplayMode: (mode: SubtitleDisplayMode) => void
  setFontSize: (size: number) => void
  setAutoScrollEnabled: (enabled: boolean) => void

  // 搜索和过滤操作 / Search and filtering operations
  searchSubtitles: (query: string) => void
  clearSearch: () => void
  filterByTimeRange: (startTime: number, endTime: number) => void
  clearFilter: () => void

  // 加载状态操作 / Loading state operations
  setLoadingState: (state: Partial<SubtitleLoadingState>) => void
  setLoadingError: (error: string | null) => void

  // 缓存操作 / Cache operations
  cacheSubtitles: (filePath: string, subtitles: readonly SubtitleItem[]) => void
  getCachedSubtitles: (filePath: string) => readonly SubtitleItem[] | null
  clearCache: () => void

  // 工具方法 / Utility methods
  getCurrentSubtitle: () => SubtitleItem | null
  getSubtitleAtTime: (time: number) => SubtitleItem | null
  hasNextSubtitle: () => boolean
  hasPreviousSubtitle: () => boolean
  getVisibleSubtitles: () => readonly SubtitleItem[]
  validateState: () => { isValid: boolean; errors: string[] }
  resetToDefaults: () => void
}

/**
 * 字幕存储类型 / Subtitle Store Type
 */
export type SubtitleStore = SubtitleState & SubtitleActions

/**
 * 默认显示配置 / Default display configuration
 */
const defaultDisplayConfig: SubtitleDisplayConfig = {
  mode: SubtitleDisplayMode.BILINGUAL,
  fontSize: 16,
  fontFamily: 'Arial, sans-serif',
  fontColor: '#ffffff',
  backgroundColor: '#000000',
  backgroundOpacity: 0.7,
  isAutoScrollEnabled: true,
  scrollOffset: 3,
  lineHeight: 1.5,
  letterSpacing: 0
}

/**
 * 默认导航状态 / Default navigation state
 */
const defaultNavigationState: SubtitleNavigationState = {
  currentIndex: -1,
  previousIndex: -1,
  isAutoNavigationEnabled: true,
  navigationHistory: []
}

/**
 * 默认加载状态 / Default loading state
 */
const defaultLoadingState: SubtitleLoadingState = {
  isLoading: false,
  progress: 0,
  error: null
}

/**
 * 初始状态 / Initial state
 */
const initialState: SubtitleState = {
  subtitles: [],
  currentSubtitleFile: null,
  navigation: defaultNavigationState,
  displayConfig: defaultDisplayConfig,
  loadingState: defaultLoadingState,
  searchQuery: '',
  filteredIndices: [],
  subtitleCache: {}
}

/**
 * 状态验证规则 / State validation rules
 */
const stateValidationRules = {
  subtitles: (value: unknown): value is readonly SubtitleItem[] => Array.isArray(value),
  navigation: (value: unknown): value is SubtitleNavigationState =>
    typeof value === 'object' && value !== null && 'currentIndex' in value,
  displayConfig: (value: unknown): value is SubtitleDisplayConfig =>
    typeof value === 'object' && value !== null && 'mode' in value,
  loadingState: (value: unknown): value is SubtitleLoadingState =>
    typeof value === 'object' && value !== null && 'isLoading' in value,
  searchQuery: (value: unknown): value is string => typeof value === 'string',
  filteredIndices: (value: unknown): value is readonly number[] => Array.isArray(value),
  subtitleCache: (value: unknown): value is Record<string, readonly SubtitleItem[]> =>
    typeof value === 'object' && value !== null
}

/**
 * V2 字幕状态存储 / V2 Subtitle State Store
 *
 * 使用 Zustand + Immer + 持久化中间件管理字幕状态
 * Uses Zustand + Immer + persistence middleware to manage subtitle state
 */
export const useSubtitleStore = create<SubtitleStore>()(
  V2MiddlewarePresets.persistent('subtitle-store', {
    // 选择性持久化：只持久化显示配置和缓存 / Selective persistence: only persist display config and cache
    partialize: (state) => ({
      displayConfig: state.displayConfig,
      subtitleCache: state.subtitleCache
    }),
    version: 1
  })((set, get) => ({
    ...initialState,

    // 字幕加载操作 / Subtitle loading operations
    loadSubtitles: async (filePath: string, encoding = 'utf-8') => {
      const startTime = Date.now()

      try {
        // 检查缓存 / Check cache
        const cached = get().getCachedSubtitles(filePath)
        if (cached) {
          set((state) => {
            state.subtitles = cached
            state.navigation.currentIndex = -1
            state.navigation.previousIndex = -1
            state.navigation.navigationHistory = []
          })

          logger.info(`✅ 从缓存加载字幕: ${filePath}`)
          return
        }

        // 开始加载 / Start loading
        set((state) => {
          state.loadingState = {
            isLoading: true,
            progress: 0,
            error: null,
            loadingStartTime: startTime
          }
        })

        StateDebug.logStateChange('SubtitleStore', 'loadSubtitles:start', get().loadingState, {
          isLoading: true,
          progress: 0
        })

        // 模拟加载过程（实际实现中会调用 API）
        // Simulate loading process (actual implementation would call API)

        set((state) => {
          state.loadingState.progress = 50
        })

        // 模拟解析字幕文件 / Simulate parsing subtitle file
        const mockSubtitles: SubtitleItem[] = [
          {
            id: '1',
            startTime: 0,
            endTime: 2,
            originalText: 'Hello, world!',
            translatedText: '你好，世界！'
          },
          {
            id: '2',
            startTime: 3,
            endTime: 5,
            originalText: 'This is a test subtitle.',
            translatedText: '这是一个测试字幕。'
          }
        ]

        set((state) => {
          state.subtitles = mockSubtitles
          state.currentSubtitleFile = {
            filePath,
            fileName: filePath.split('/').pop() || 'Unknown',
            format: SubtitleFormat.SRT,
            encoding,
            language: SubtitleLanguage.ENGLISH,
            itemCount: mockSubtitles.length,
            duration: Math.max(...mockSubtitles.map((s) => s.endTime))
          }
          state.navigation = {
            ...defaultNavigationState,
            currentIndex: -1
          }
          state.loadingState = {
            isLoading: false,
            progress: 100,
            error: null
          }
        })

        // 缓存字幕 / Cache subtitles
        get().cacheSubtitles(filePath, mockSubtitles)

        logger.info(`✅ 字幕加载成功: ${filePath}`, {
          itemCount: mockSubtitles.length,
          duration: Date.now() - startTime
        })
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '未知错误'

        set((state) => {
          state.loadingState = {
            isLoading: false,
            progress: 0,
            error: errorMessage
          }
        })

        logger.error(`❌ 字幕加载失败: ${filePath}`, error)
        throw error
      }
    },

    setSubtitles: (subtitles: readonly SubtitleItem[]) => {
      set((state) => {
        state.subtitles = subtitles
        state.navigation = {
          ...defaultNavigationState,
          currentIndex: -1
        }
        state.searchQuery = ''
        state.filteredIndices = []
      })

      StateDebug.logStateChange('SubtitleStore', 'setSubtitles', [], subtitles)
    },

    clearSubtitles: () => {
      set((state) => {
        state.subtitles = []
        state.currentSubtitleFile = null
        state.navigation = defaultNavigationState
        state.searchQuery = ''
        state.filteredIndices = []
      })

      StateDebug.logStateChange('SubtitleStore', 'clearSubtitles', get().subtitles, [])
    },

    addSubtitle: (subtitle: SubtitleItem, index?: number) => {
      set((state) => {
        const insertIndex = index ?? state.subtitles.length
        state.subtitles.splice(insertIndex, 0, subtitle)
      })
    },

    updateSubtitle: (index: number, updates: Partial<SubtitleItem>) => {
      set((state) => {
        if (index >= 0 && index < state.subtitles.length) {
          Object.assign(state.subtitles[index], updates)
        }
      })
    },

    removeSubtitle: (index: number) => {
      set((state) => {
        if (index >= 0 && index < state.subtitles.length) {
          state.subtitles.splice(index, 1)

          // 调整当前索引 / Adjust current index
          if (state.navigation.currentIndex >= index) {
            state.navigation.currentIndex = Math.max(-1, state.navigation.currentIndex - 1)
          }
        }
      })
    },

    // 导航操作 / Navigation operations
    setCurrentIndex: (index: number) => {
      set((state) => {
        const validIndex = Math.max(-1, Math.min(index, state.subtitles.length - 1))

        if (validIndex !== state.navigation.currentIndex) {
          state.navigation.previousIndex = state.navigation.currentIndex
          state.navigation.currentIndex = validIndex

          // 更新导航历史 / Update navigation history
          if (validIndex >= 0) {
            const history = [...state.navigation.navigationHistory]
            history.push(validIndex)

            // 限制历史长度 / Limit history length
            if (history.length > 20) {
              history.shift()
            }

            state.navigation.navigationHistory = history
          }
        }
      })
    },

    goToNext: () => {
      const state = get()
      const nextIndex = state.navigation.currentIndex + 1

      if (nextIndex < state.subtitles.length) {
        get().setCurrentIndex(nextIndex)
        return true
      }

      return false
    },

    goToPrevious: () => {
      const state = get()
      const prevIndex = state.navigation.currentIndex - 1

      if (prevIndex >= 0) {
        get().setCurrentIndex(prevIndex)
        return true
      }

      return false
    },

    goToFirst: () => {
      const state = get()
      if (state.subtitles.length > 0) {
        get().setCurrentIndex(0)
      }
    },

    goToLast: () => {
      const state = get()
      if (state.subtitles.length > 0) {
        get().setCurrentIndex(state.subtitles.length - 1)
      }
    },

    jumpToTime: (time: number) => {
      const state = get()

      for (let i = 0; i < state.subtitles.length; i++) {
        const subtitle = state.subtitles[i]
        if (time >= subtitle.startTime && time <= subtitle.endTime) {
          get().setCurrentIndex(i)
          return i
        }
      }

      return null
    },

    // 显示配置操作 / Display configuration operations
    updateDisplayConfig: (config: Partial<SubtitleDisplayConfig>) => {
      set((state) => {
        Object.assign(state.displayConfig, config)
      })
    },

    setDisplayMode: (mode: SubtitleDisplayMode) => {
      set((state) => {
        state.displayConfig.mode = mode
      })
    },

    setFontSize: (size: number) => {
      set((state) => {
        state.displayConfig.fontSize = Math.max(8, Math.min(72, size))
      })
    },

    setAutoScrollEnabled: (enabled: boolean) => {
      set((state) => {
        state.displayConfig.isAutoScrollEnabled = enabled
      })
    },

    // 搜索和过滤操作 / Search and filtering operations
    searchSubtitles: (query: string) => {
      set((state) => {
        state.searchQuery = query

        if (query.trim()) {
          const lowerQuery = query.toLowerCase()
          state.filteredIndices = state.subtitles
            .map((subtitle, index) => ({
              index,
              matches:
                subtitle.originalText?.toLowerCase().includes(lowerQuery) ||
                subtitle.translatedText?.toLowerCase().includes(lowerQuery)
            }))
            .filter((item) => item.matches)
            .map((item) => item.index)
        } else {
          state.filteredIndices = []
        }
      })
    },

    clearSearch: () => {
      set((state) => {
        state.searchQuery = ''
        state.filteredIndices = []
      })
    },

    filterByTimeRange: (startTime: number, endTime: number) => {
      set((state) => {
        state.filteredIndices = state.subtitles
          .map((subtitle, index) => ({
            index,
            inRange: subtitle.startTime >= startTime && subtitle.endTime <= endTime
          }))
          .filter((item) => item.inRange)
          .map((item) => item.index)
      })
    },

    clearFilter: () => {
      set((state) => {
        state.filteredIndices = []
      })
    },

    // 加载状态操作 / Loading state operations
    setLoadingState: (newState: Partial<SubtitleLoadingState>) => {
      set((state) => {
        Object.assign(state.loadingState, newState)
      })
    },

    setLoadingError: (error: string | null) => {
      set((state) => {
        state.loadingState.error = error
        if (error) {
          state.loadingState.isLoading = false
        }
      })
    },

    // 缓存操作 / Cache operations
    cacheSubtitles: (filePath: string, subtitles: readonly SubtitleItem[]) => {
      set((state) => {
        state.subtitleCache[filePath] = subtitles
      })
    },

    getCachedSubtitles: (filePath: string) => {
      const state = get()
      return state.subtitleCache[filePath] || null
    },

    clearCache: () => {
      set((state) => {
        state.subtitleCache = {}
      })
    },

    // 工具方法 / Utility methods
    getCurrentSubtitle: () => {
      const state = get()
      const index = state.navigation.currentIndex
      return index >= 0 && index < state.subtitles.length ? state.subtitles[index] : null
    },

    getSubtitleAtTime: (time: number) => {
      const state = get()
      return (
        state.subtitles.find(
          (subtitle) => time >= subtitle.startTime && time <= subtitle.endTime
        ) || null
      )
    },

    hasNextSubtitle: () => {
      const state = get()
      return state.navigation.currentIndex < state.subtitles.length - 1
    },

    hasPreviousSubtitle: () => {
      const state = get()
      return state.navigation.currentIndex > 0
    },

    getVisibleSubtitles: () => {
      const state = get()

      if (state.filteredIndices.length > 0) {
        return state.filteredIndices.map((index) => state.subtitles[index])
      }

      return state.subtitles
    },

    validateState: () => {
      const state = get()
      const { isValid, invalidKeys } = StateValidation.validateStateTypes(
        state,
        stateValidationRules
      )

      return {
        isValid,
        errors: invalidKeys.map((key) => `Invalid state for key: ${key}`)
      }
    },

    resetToDefaults: () => {
      set(() => ({ ...initialState }))
      logger.info('🔄 字幕状态已重置为默认值')
    }
  }))
)
