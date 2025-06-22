/* eslint-disable @typescript-eslint/explicit-function-return-type */
/**
 * V2 字幕状态选择器 / V2 Subtitle State Selectors
 *
 * 使用自动生成选择器模式提供高性能的字幕状态访问
 * Uses auto-generated selector pattern for high-performance subtitle state access
 */

import { useSubtitleStore, type SubtitleState } from '../stores/subtitle.store'
import { createSelectors, createSelector } from '../infrastructure'
import { SubtitleItem, SubtitleDisplayMode } from '../../infrastructure/types/domain/subtitle.types'

/**
 * 带有自动生成选择器的字幕 Store / Subtitle Store with auto-generated selectors
 *
 * 使用方式 / Usage:
 * - 基础属性: subtitleStore.use.subtitles()
 * - 嵌套属性: subtitleStore.use.navigation() 然后访问 .currentIndex
 * - 复杂计算: 使用下面的计算属性选择器
 */
export const subtitleStore = createSelectors(useSubtitleStore)

/**
 * 计算属性选择器 / Computed property selectors
 * 这些选择器提供复杂的计算逻辑，无法通过自动生成获得
 * These selectors provide complex computation logic that cannot be auto-generated
 */
export const subtitleSelectors = {
  // 计算属性选择器 / Computed property selectors
  hasSubtitles: createSelector((state: SubtitleState) => state.subtitles.length > 0),

  subtitleCount: createSelector((state: SubtitleState) => state.subtitles.length),

  currentSubtitle: createSelector((state: SubtitleState) => {
    const { subtitles, navigation } = state
    const index = navigation.currentIndex
    return index >= 0 && index < subtitles.length ? subtitles[index] : null
  }),

  hasNextSubtitle: createSelector((state: SubtitleState) => {
    return state.navigation.currentIndex < state.subtitles.length - 1
  }),

  hasPreviousSubtitle: createSelector((state: SubtitleState) => {
    return state.navigation.currentIndex > 0
  }),

  nextSubtitle: createSelector((state: SubtitleState) => {
    const { subtitles, navigation } = state
    const nextIndex = navigation.currentIndex + 1
    return nextIndex < subtitles.length ? subtitles[nextIndex] : null
  }),

  previousSubtitle: createSelector((state: SubtitleState) => {
    const { subtitles, navigation } = state
    const prevIndex = navigation.currentIndex - 1
    return prevIndex >= 0 ? subtitles[prevIndex] : null
  }),

  // 搜索和过滤选择器 / Search and filtering selectors
  hasSearchQuery: createSelector((state: SubtitleState) => state.searchQuery.trim().length > 0),

  hasFilteredResults: createSelector((state: SubtitleState) => state.filteredIndices.length > 0),

  filteredSubtitles: createSelector((state: SubtitleState) => {
    const { subtitles, filteredIndices } = state
    return filteredIndices.map((index) => subtitles[index])
  }),

  searchResultCount: createSelector((state: SubtitleState) => state.filteredIndices.length),

  // 显示文本选择器 / Display text selectors
  getDisplayText: (subtitle: SubtitleItem, mode: SubtitleDisplayMode): string => {
    switch (mode) {
      case SubtitleDisplayMode.ORIGINAL:
        return subtitle.originalText || ''
      case SubtitleDisplayMode.TRANSLATED:
        return subtitle.translatedText || ''
      case SubtitleDisplayMode.BILINGUAL: {
        const original = subtitle.originalText || ''
        const translated = subtitle.translatedText || ''
        return original && translated ? `${original}\n${translated}` : original || translated
      }
      case SubtitleDisplayMode.NONE:
      default:
        return ''
    }
  },

  visibleSubtitles: createSelector((state: SubtitleState) => {
    const { subtitles, navigation, displayConfig, filteredIndices } = state
    const { mode } = displayConfig

    // 如果有过滤结果，显示过滤后的字幕 / If there are filtered results, show filtered subtitles
    const targetSubtitles =
      filteredIndices.length > 0 ? filteredIndices.map((index) => subtitles[index]) : subtitles

    return targetSubtitles.map((subtitle, originalIndex) => {
      const actualIndex =
        filteredIndices.length > 0 ? filteredIndices[originalIndex] : originalIndex

      return {
        ...subtitle,
        index: actualIndex,
        isActive: actualIndex === navigation.currentIndex,
        displayText: subtitleSelectors.getDisplayText(subtitle, mode),
        isVisible: mode !== SubtitleDisplayMode.NONE
      }
    })
  }),

  currentSubtitleDisplayText: createSelector((state: SubtitleState) => {
    const current = subtitleSelectors.currentSubtitle(state)
    if (!current) return ''
    return subtitleSelectors.getDisplayText(current, state.displayConfig.mode)
  }),

  // 时间相关选择器 / Time related selectors
  getSubtitleAtTime: (time: number) => (state: SubtitleState) => {
    return (
      state.subtitles.find((subtitle) => time >= subtitle.startTime && time <= subtitle.endTime) ||
      null
    )
  },

  getSubtitleIndexAtTime: (time: number) => (state: SubtitleState) => {
    const index = state.subtitles.findIndex(
      (subtitle) => time >= subtitle.startTime && time <= subtitle.endTime
    )
    return index >= 0 ? index : null
  },

  subtitleDuration: createSelector((state: SubtitleState) => {
    if (state.subtitles.length === 0) return 0
    const lastSubtitle = state.subtitles[state.subtitles.length - 1]
    return lastSubtitle.endTime
  }),

  // 缓存相关选择器 / Cache related selectors
  cacheSize: createSelector((state: SubtitleState) => Object.keys(state.subtitleCache).length),

  getCachedSubtitles: (filePath: string) => (state: SubtitleState) => {
    return state.subtitleCache[filePath] || null
  },

  hasCachedSubtitles: (filePath: string) => (state: SubtitleState) => {
    return filePath in state.subtitleCache
  },

  cacheStats: createSelector((state: SubtitleState) => {
    const cache = state.subtitleCache
    const totalItems = Object.values(cache).reduce((sum, subtitles) => sum + subtitles.length, 0)

    return {
      fileCount: Object.keys(cache).length,
      totalSubtitleItems: totalItems,
      averageItemsPerFile:
        Object.keys(cache).length > 0 ? totalItems / Object.keys(cache).length : 0
    }
  }),

  // 组合选择器 / Composite selectors
  subtitleNavigationInfo: createSelector((state: SubtitleState) => {
    const { navigation, subtitles } = state
    return {
      currentIndex: navigation.currentIndex,
      totalCount: subtitles.length,
      hasNext: subtitleSelectors.hasNextSubtitle(state),
      hasPrevious: subtitleSelectors.hasPreviousSubtitle(state),
      isFirst: navigation.currentIndex === 0,
      isLast: navigation.currentIndex === subtitles.length - 1,
      progress: subtitles.length > 0 ? ((navigation.currentIndex + 1) / subtitles.length) * 100 : 0
    }
  }),

  subtitleFileInfo: createSelector((state: SubtitleState) => {
    const file = state.currentSubtitleFile
    if (!file) return null

    return {
      fileName: file.fileName,
      format: file.format,
      language: file.language,
      itemCount: file.itemCount,
      duration: file.duration,
      encoding: file.encoding
    }
  }),

  searchInfo: createSelector((state: SubtitleState) => {
    return {
      query: state.searchQuery,
      hasQuery: subtitleSelectors.hasSearchQuery(state),
      resultCount: state.filteredIndices.length,
      hasResults: state.filteredIndices.length > 0,
      totalCount: state.subtitles.length
    }
  })
}

/**
 * 便捷 Hook 选择器 / Convenient Hook selectors
 * 使用自动生成的选择器和计算属性选择器
 * Uses auto-generated selectors and computed property selectors
 */

// 基础字幕数据 Hooks / Basic subtitle data hooks
export const useSubtitles = () => subtitleStore.use.subtitles()
export const useCurrentSubtitleFile = () => subtitleStore.use.currentSubtitleFile()
export const useSubtitleLoadingState = () => subtitleStore.use.loadingState()
export const useSubtitleDisplayConfig = () => subtitleStore.use.displayConfig()

// 导航 Hooks / Navigation hooks
export const useCurrentSubtitleIndex = () => subtitleStore((state) => state.navigation.currentIndex)
export const useSubtitleNavigation = () => subtitleStore.use.navigation()
export const useIsAutoNavigationEnabled = () =>
  subtitleStore((state) => state.navigation.isAutoNavigationEnabled)

// 当前字幕 Hooks / Current subtitle hooks
export const useCurrentSubtitle = () => subtitleStore(subtitleSelectors.currentSubtitle)
export const useCurrentSubtitleDisplayText = () =>
  subtitleStore(subtitleSelectors.currentSubtitleDisplayText)
export const useHasNextSubtitle = () => subtitleStore(subtitleSelectors.hasNextSubtitle)
export const useHasPreviousSubtitle = () => subtitleStore(subtitleSelectors.hasPreviousSubtitle)
export const useNextSubtitle = () => subtitleStore(subtitleSelectors.nextSubtitle)
export const usePreviousSubtitle = () => subtitleStore(subtitleSelectors.previousSubtitle)

// 显示配置 Hooks / Display configuration hooks
export const useSubtitleDisplayMode = () => subtitleStore((state) => state.displayConfig.mode)
export const useSubtitleFontSize = () => subtitleStore((state) => state.displayConfig.fontSize)
export const useSubtitleFontFamily = () => subtitleStore((state) => state.displayConfig.fontFamily)
export const useIsAutoScrollEnabled = () =>
  subtitleStore((state) => state.displayConfig.isAutoScrollEnabled)

// 加载状态 Hooks / Loading state hooks
export const useIsSubtitleLoading = () => subtitleStore((state) => state.loadingState.isLoading)
export const useSubtitleLoadingProgress = () =>
  subtitleStore((state) => state.loadingState.progress)
export const useSubtitleLoadingError = () => subtitleStore((state) => state.loadingState.error)

// 计算属性 Hooks / Computed property hooks
export const useHasSubtitles = () => subtitleStore(subtitleSelectors.hasSubtitles)
export const useSubtitleCount = () => subtitleStore(subtitleSelectors.subtitleCount)
export const useSubtitleDuration = () => subtitleStore(subtitleSelectors.subtitleDuration)

// 搜索和过滤 Hooks / Search and filtering hooks
export const useSubtitleSearchQuery = () => subtitleStore.use.searchQuery()
export const useHasSearchQuery = () => subtitleStore(subtitleSelectors.hasSearchQuery)
export const useFilteredSubtitles = () => subtitleStore(subtitleSelectors.filteredSubtitles)
export const useSearchResultCount = () => subtitleStore(subtitleSelectors.searchResultCount)
export const useHasFilteredResults = () => subtitleStore(subtitleSelectors.hasFilteredResults)

// 显示相关 Hooks / Display related hooks
export const useVisibleSubtitles = () => subtitleStore(subtitleSelectors.visibleSubtitles)

// 文件信息 Hooks / File info hooks
export const useCurrentSubtitleFileName = () =>
  subtitleStore((state) => state.currentSubtitleFile?.fileName || null)
export const useCurrentSubtitleFormat = () =>
  subtitleStore((state) => state.currentSubtitleFile?.format || null)
export const useCurrentSubtitleLanguage = () =>
  subtitleStore((state) => state.currentSubtitleFile?.language || null)

// 组合数据 Hooks / Composite data hooks
export const useSubtitleNavigationInfo = () =>
  subtitleStore(subtitleSelectors.subtitleNavigationInfo)
export const useSubtitleFileInfo = () => subtitleStore(subtitleSelectors.subtitleFileInfo)
export const useSubtitleSearchInfo = () => subtitleStore(subtitleSelectors.searchInfo)

// 缓存 Hooks / Cache hooks
export const useSubtitleCacheStats = () => subtitleStore(subtitleSelectors.cacheStats)

// 参数化 Hooks / Parameterized hooks
export const useSubtitleAtTime = (time: number) =>
  subtitleStore(subtitleSelectors.getSubtitleAtTime(time))

export const useSubtitleIndexAtTime = (time: number) =>
  subtitleStore(subtitleSelectors.getSubtitleIndexAtTime(time))

export const useCachedSubtitles = (filePath: string) =>
  subtitleStore(subtitleSelectors.getCachedSubtitles(filePath))

export const useHasCachedSubtitles = (filePath: string) =>
  subtitleStore(subtitleSelectors.hasCachedSubtitles(filePath))
