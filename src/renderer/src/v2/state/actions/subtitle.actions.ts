/**
 * V2 字幕状态操作 / V2 Subtitle State Actions
 *
 * 实现复杂的字幕相关状态变更逻辑，包括跨 Store 操作和异步业务流程
 * Implements complex subtitle-related state change logic, including cross-store operations and async business flows
 */

import { useSubtitleStore } from '../stores/subtitle.store'
import { useVideoStore } from '../stores/video.store'
import { usePlaybackControlStore } from '../stores/playback.store'
import { useUIStore } from '../stores/ui.store'
import { StateDebug, StatePerformance } from '../infrastructure'
import { logger } from '@renderer/utils/logger'

// 导入类型定义 / Import type definitions
import type {
  SubtitleItem,
  SubtitleDisplayMode
} from '../../infrastructure/types/domain/subtitle.types'

/**
 * 字幕操作类 / Subtitle Actions Class
 *
 * 封装复杂的字幕相关状态操作
 * Encapsulates complex subtitle-related state operations
 */
export class SubtitleActions {
  /**
   * 智能导航到下一个字幕 / Smart navigate to next subtitle
   *
   * 包含自动播放、循环检查等逻辑
   * Includes auto-play, loop checking and other logic
   */
  static async navigateToNext(): Promise<boolean> {
    return StatePerformance.measureOperation(async () => {
      const subtitleStore = useSubtitleStore.getState()
      const videoStore = useVideoStore.getState()
      const playbackStore = usePlaybackControlStore.getState()
      const uiStore = useUIStore.getState()

      try {
        const { navigation, subtitles } = subtitleStore
        const currentIndex = navigation.currentIndex
        const nextIndex = currentIndex + 1

        // 检查是否有下一个字幕 / Check if there's a next subtitle
        if (nextIndex >= subtitles.length) {
          logger.info('📝 已到达字幕列表末尾')

          // 检查是否需要循环播放 / Check if loop playback is needed
          if (playbackStore.loopConfig.isActive) {
            return this.handleLoopNavigation()
          }

          return false
        }

        const nextSubtitle = subtitles[nextIndex]

        // 更新字幕索引 / Update subtitle index
        subtitleStore.setCurrentIndex(nextIndex)

        // 同步视频时间 / Sync video time
        if (videoStore.currentVideo) {
          videoStore.setCurrentTime(nextSubtitle.startTime)
          playbackStore.seek(nextSubtitle.startTime)
        }

        // 自动滚动到当前字幕 / Auto scroll to current subtitle
        if (subtitleStore.displayConfig.isAutoScrollEnabled) {
          await this.scrollToSubtitle(nextIndex)
        }

        // 如果启用了自动暂停，在字幕结束时暂停 / If auto-pause is enabled, pause at subtitle end
        if (playbackStore.controlConfig.isAutoPause) {
          this.scheduleAutoPause(nextSubtitle)
        }

        logger.info(`➡️ 导航到下一个字幕: ${nextIndex}`)
        return true
      } catch (error) {
        logger.error('❌ 导航到下一个字幕失败', error)

        uiStore.addNotification({
          type: 'error',
          title: '导航失败',
          message: '无法导航到下一个字幕',
          duration: 3000
        })

        return false
      }
    }, 'SubtitleActions.navigateToNext')
  }

  /**
   * 智能导航到上一个字幕 / Smart navigate to previous subtitle
   */
  static async navigateToPrevious(): Promise<boolean> {
    return StatePerformance.measureOperation(async () => {
      const subtitleStore = useSubtitleStore.getState()
      const videoStore = useVideoStore.getState()
      const playbackStore = usePlaybackControlStore.getState()
      const uiStore = useUIStore.getState()

      try {
        const { navigation } = subtitleStore
        const currentIndex = navigation.currentIndex
        const prevIndex = currentIndex - 1

        // 检查是否有上一个字幕 / Check if there's a previous subtitle
        if (prevIndex < 0) {
          logger.info('📝 已到达字幕列表开头')
          return false
        }

        const prevSubtitle = subtitleStore.subtitles[prevIndex]

        // 更新字幕索引 / Update subtitle index
        subtitleStore.setCurrentIndex(prevIndex)

        // 同步视频时间 / Sync video time
        if (videoStore.currentVideo) {
          videoStore.setCurrentTime(prevSubtitle.startTime)
          playbackStore.seek(prevSubtitle.startTime)
        }

        // 自动滚动到当前字幕 / Auto scroll to current subtitle
        if (subtitleStore.displayConfig.isAutoScrollEnabled) {
          await this.scrollToSubtitle(prevIndex)
        }

        logger.info(`⬅️ 导航到上一个字幕: ${prevIndex}`)
        return true
      } catch (error) {
        logger.error('❌ 导航到上一个字幕失败', error)

        uiStore.addNotification({
          type: 'error',
          title: '导航失败',
          message: '无法导航到上一个字幕',
          duration: 3000
        })

        return false
      }
    }, 'SubtitleActions.navigateToPrevious')
  }

  /**
   * 处理循环导航 / Handle loop navigation
   */
  private static async handleLoopNavigation(): Promise<boolean> {
    const playbackStore = usePlaybackControlStore.getState()
    const subtitleStore = useSubtitleStore.getState()

    const { loopConfig } = playbackStore

    if (loopConfig.count === -1) {
      // 无限循环 / Infinite loop
      subtitleStore.setCurrentIndex(0)
      return true
    } else if (loopConfig.remainingCount > 0) {
      // 有限循环 / Finite loop
      playbackStore.setLoopCount(loopConfig.remainingCount - 1)
      subtitleStore.setCurrentIndex(0)
      return true
    }

    return false
  }

  /**
   * 滚动到指定字幕 / Scroll to specified subtitle
   *
   * @param index 字幕索引 / Subtitle index
   */
  private static async scrollToSubtitle(index: number): Promise<void> {
    // 这里应该实现实际的滚动逻辑 / Actual scroll logic should be implemented here
    // 可能需要通过事件系统或回调来处理 UI 滚动 / Might need to handle UI scrolling through event system or callbacks
    logger.debug(`🔄 滚动到字幕: ${index}`)
  }

  /**
   * 安排自动暂停 / Schedule auto pause
   *
   * @param subtitle 字幕项 / Subtitle item
   */
  private static scheduleAutoPause(subtitle: SubtitleItem): void {
    const duration = (subtitle.endTime - subtitle.startTime) * 1000 // 转换为毫秒 / Convert to milliseconds

    setTimeout(() => {
      const playbackStore = usePlaybackControlStore.getState()
      if (playbackStore.isPlaying && playbackStore.controlConfig.isAutoPause) {
        playbackStore.pause()
        logger.info('⏸️ 自动暂停播放')
      }
    }, duration)
  }

  /**
   * 智能搜索字幕 / Smart search subtitles
   *
   * @param query 搜索查询 / Search query
   * @param options 搜索选项 / Search options
   */
  static async searchSubtitles(
    query: string,
    options: {
      caseSensitive?: boolean
      wholeWord?: boolean
      useRegex?: boolean
      searchInOriginal?: boolean
      searchInTranslated?: boolean
    } = {}
  ): Promise<number[]> {
    return StatePerformance.measureOperation(async () => {
      const subtitleStore = useSubtitleStore.getState()
      const {
        caseSensitive = false,
        wholeWord = false,
        useRegex = false,
        searchInOriginal = true,
        searchInTranslated = true
      } = options

      try {
        if (!query.trim()) {
          subtitleStore.clearSearch()
          return []
        }

        const { subtitles } = subtitleStore
        const results: number[] = []

        let searchPattern: RegExp

        if (useRegex) {
          try {
            searchPattern = new RegExp(query, caseSensitive ? 'g' : 'gi')
          } catch {
            throw new Error('无效的正则表达式')
          }
        } else {
          const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
          const pattern = wholeWord ? `\\b${escapedQuery}\\b` : escapedQuery
          searchPattern = new RegExp(pattern, caseSensitive ? 'g' : 'gi')
        }

        subtitles.forEach((subtitle, index) => {
          let found = false

          if (searchInOriginal && subtitle.originalText) {
            if (searchPattern.test(subtitle.originalText)) {
              found = true
            }
          }

          if (!found && searchInTranslated && subtitle.translatedText) {
            if (searchPattern.test(subtitle.translatedText)) {
              found = true
            }
          }

          if (found) {
            results.push(index)
          }
        })

        // 更新搜索状态 / Update search state
        subtitleStore.searchSubtitles(query)

        logger.info(`🔍 搜索完成: 找到 ${results.length} 个结果`)
        return results
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '搜索失败'
        logger.error(`❌ 搜索字幕失败: ${errorMessage}`, error)

        const uiStore = useUIStore.getState()
        uiStore.addNotification({
          type: 'error',
          title: '搜索失败',
          message: errorMessage,
          duration: 3000
        })

        return []
      }
    }, 'SubtitleActions.searchSubtitles')
  }

  /**
   * 批量更新字幕显示模式 / Batch update subtitle display mode
   *
   * @param mode 显示模式 / Display mode
   */
  static updateDisplayMode(mode: SubtitleDisplayMode): void {
    const subtitleStore = useSubtitleStore.getState()
    const uiStore = useUIStore.getState()

    try {
      subtitleStore.setDisplayMode(mode)

      // 根据显示模式调整 UI / Adjust UI based on display mode
      if (mode === 'none') {
        // 隐藏字幕时可能需要调整布局 / Might need to adjust layout when hiding subtitles
        uiStore.setShowSubtitleList(false)
      } else {
        uiStore.setShowSubtitleList(true)
      }

      logger.info(`🎨 已更新字幕显示模式: ${mode}`)

      StateDebug.logStateChange(
        'SubtitleActions',
        'updateDisplayMode',
        subtitleStore.displayConfig.mode,
        mode
      )
    } catch (error) {
      logger.error('❌ 更新字幕显示模式失败', error)
    }
  }

  /**
   * 同步字幕与视频时间 / Sync subtitles with video time
   *
   * @param currentTime 当前播放时间 / Current playback time
   */
  static syncWithVideoTime(currentTime: number): void {
    const subtitleStore = useSubtitleStore.getState()

    try {
      const { subtitles, navigation } = subtitleStore

      // 查找当前时间对应的字幕 / Find subtitle for current time
      const targetIndex = subtitles.findIndex(
        (subtitle) => currentTime >= subtitle.startTime && currentTime <= subtitle.endTime
      )

      // 只有当索引发生变化时才更新 / Only update when index changes
      if (targetIndex !== navigation.currentIndex) {
        if (targetIndex >= 0) {
          subtitleStore.setCurrentIndex(targetIndex)
        } else {
          // 当前时间没有对应的字幕 / No subtitle for current time
          subtitleStore.setCurrentIndex(-1)
        }
      }
    } catch (error) {
      logger.warn('⚠️ 同步字幕与视频时间失败', error)
    }
  }

  /**
   * 导出字幕 / Export subtitles
   *
   * @param format 导出格式 / Export format
   * @param options 导出选项 / Export options
   */
  static async exportSubtitles(
    format: 'srt' | 'vtt' | 'ass',
    options: {
      includeOriginal?: boolean
      includeTranslated?: boolean
      timeOffset?: number
    } = {}
  ): Promise<string> {
    return StatePerformance.measureOperation(async () => {
      const subtitleStore = useSubtitleStore.getState()
      const { includeOriginal = true, includeTranslated = true, timeOffset = 0 } = options

      try {
        const { subtitles } = subtitleStore

        if (subtitles.length === 0) {
          throw new Error('没有可导出的字幕')
        }

        let exportContent = ''

        switch (format) {
          case 'srt':
            exportContent = this.exportToSRT(subtitles, {
              includeOriginal,
              includeTranslated,
              timeOffset
            })
            break
          case 'vtt':
            exportContent = this.exportToVTT(subtitles, {
              includeOriginal,
              includeTranslated,
              timeOffset
            })
            break
          case 'ass':
            exportContent = this.exportToASS(subtitles, {
              includeOriginal,
              includeTranslated,
              timeOffset
            })
            break
          default:
            throw new Error(`不支持的导出格式: ${format}`)
        }

        logger.info(`📤 字幕导出成功: ${format.toUpperCase()} 格式`)
        return exportContent
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '导出失败'
        logger.error(`❌ 字幕导出失败: ${errorMessage}`, error)
        throw error
      }
    }, 'SubtitleActions.exportSubtitles')
  }

  /**
   * 导出为 SRT 格式 / Export to SRT format
   */
  private static exportToSRT(
    subtitles: readonly SubtitleItem[],
    options: { includeOriginal: boolean; includeTranslated: boolean; timeOffset: number }
  ): string {
    const { includeOriginal, includeTranslated, timeOffset } = options

    return subtitles
      .map((subtitle, index) => {
        const startTime = this.formatSRTTime(subtitle.startTime + timeOffset)
        const endTime = this.formatSRTTime(subtitle.endTime + timeOffset)

        let text = ''
        if (includeOriginal && subtitle.originalText) {
          text += subtitle.originalText
        }
        if (includeTranslated && subtitle.translatedText) {
          if (text) text += '\n'
          text += subtitle.translatedText
        }

        return `${index + 1}\n${startTime} --> ${endTime}\n${text}\n`
      })
      .join('\n')
  }

  /**
   * 导出为 VTT 格式 / Export to VTT format
   */
  private static exportToVTT(
    subtitles: readonly SubtitleItem[],
    options: { includeOriginal: boolean; includeTranslated: boolean; timeOffset: number }
  ): string {
    const { includeOriginal, includeTranslated, timeOffset } = options

    let content = 'WEBVTT\n\n'

    content += subtitles
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      .map((subtitle, _index) => {
        const startTime = this.formatVTTTime(subtitle.startTime + timeOffset)
        const endTime = this.formatVTTTime(subtitle.endTime + timeOffset)

        let text = ''
        if (includeOriginal && subtitle.originalText) {
          text += subtitle.originalText
        }
        if (includeTranslated && subtitle.translatedText) {
          if (text) text += '\n'
          text += subtitle.translatedText
        }

        return `${startTime} --> ${endTime}\n${text}\n`
      })
      .join('\n')

    return content
  }

  /**
   * 导出为 ASS 格式 / Export to ASS format
   */
  private static exportToASS(
    subtitles: readonly SubtitleItem[],
    options: { includeOriginal: boolean; includeTranslated: boolean; timeOffset: number }
  ): string {
    // ASS 格式比较复杂，这里提供简化版本 / ASS format is complex, providing simplified version here
    const { includeOriginal, includeTranslated, timeOffset } = options

    let content =
      '[Script Info]\nTitle: Exported Subtitles\n\n[V4+ Styles]\nFormat: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\nStyle: Default,Arial,20,&H00FFFFFF,&H000000FF,&H00000000,&H80000000,0,0,0,0,100,100,0,0,1,2,0,2,10,10,10,1\n\n[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n'

    content += subtitles
      .map((subtitle) => {
        const startTime = this.formatASSTime(subtitle.startTime + timeOffset)
        const endTime = this.formatASSTime(subtitle.endTime + timeOffset)

        let text = ''
        if (includeOriginal && subtitle.originalText) {
          text += subtitle.originalText
        }
        if (includeTranslated && subtitle.translatedText) {
          if (text) text += '\\N'
          text += subtitle.translatedText
        }

        return `Dialogue: 0,${startTime},${endTime},Default,,0,0,0,,${text}`
      })
      .join('\n')

    return content
  }

  /**
   * 格式化 SRT 时间 / Format SRT time
   */
  private static formatSRTTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    const ms = Math.floor((seconds % 1) * 1000)

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`
  }

  /**
   * 格式化 VTT 时间 / Format VTT time
   */
  private static formatVTTTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    const ms = Math.floor((seconds % 1) * 1000)

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`
  }

  /**
   * 格式化 ASS 时间 / Format ASS time
   */
  private static formatASSTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    const centiseconds = Math.floor((seconds % 1) * 100)

    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`
  }
}
