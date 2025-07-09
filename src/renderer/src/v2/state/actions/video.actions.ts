/**
 * V2 视频状态操作 / V2 Video State Actions
 *
 * 实现复杂的视频相关状态变更逻辑，包括跨 Store 操作和异步业务流程
 * Implements complex video-related state change logic, including cross-store operations and async business flows
 */

import { CurrentVideoState, useVideoStore } from '../stores/video.store'
import { useSubtitleStore } from '../stores/subtitle.store'
import { usePlaybackControlStore } from '../stores/playback.store'
import { useUIStore } from '../stores/ui.store'
import { StateDebug, StatePerformance } from '../infrastructure'
import { logger } from '@renderer/utils/logger'
import { RecentPlayItem } from '@types_/shared'
import { SubtitleDisplayMode } from '@types_/domain'

/**
 * 视频操作类 / Video Actions Class
 *
 * 封装复杂的视频相关状态操作
 * Encapsulates complex video-related state operations
 */
export class VideoActions {
  /**
   * 打开视频文件 / Open video file
   *
   * 这是一个复杂的跨 Store 操作，涉及视频加载、字幕加载、播放状态初始化等
   * This is a complex cross-store operation involving video loading, subtitle loading, playback state initialization, etc.
   *
   * @param filePath 视频文件路径 / Video file path
   * @param options 加载选项 / Loading options
   */
  static async openVideo(
    filePath: string,
    options: {
      generateThumbnail?: boolean
      autoLoadSubtitle?: boolean
      restorePlaybackPosition?: boolean
      addToRecentPlays?: boolean
    } = {}
  ): Promise<void> {
    const {
      generateThumbnail = true,
      autoLoadSubtitle = true,
      restorePlaybackPosition = true,
      addToRecentPlays = true
    } = options

    return StatePerformance.measureOperation(async () => {
      const videoStore = useVideoStore.getState()
      const subtitleStore = useSubtitleStore.getState()
      const playbackStore = usePlaybackControlStore.getState()
      const uiStore = useUIStore.getState()

      try {
        logger.info(`🎬 开始打开视频: ${filePath}`)

        // 1. 重置相关状态 / Reset related states
        playbackStore.stop()
        subtitleStore.clearSubtitles()

        // 2. 加载视频 / Load video
        await videoStore.loadVideo(filePath, generateThumbnail)

        const currentVideo = videoStore.currentVideo
        if (!currentVideo) {
          throw new Error('视频加载失败')
        }

        // 3. 自动加载字幕 / Auto load subtitles
        if (autoLoadSubtitle) {
          await this.autoLoadSubtitle(filePath)
        }

        // 4. 恢复播放位置 / Restore playback position
        if (restorePlaybackPosition) {
          await this.restorePlaybackPosition(currentVideo.fileId)
        }

        // 5. 添加到最近播放 / Add to recent plays
        if (addToRecentPlays) {
          await this.addToRecentPlays(currentVideo)
        }

        // 6. 更新 UI 状态 / Update UI state
        if (uiStore.fullscreen.isFullscreen) {
          // 在全屏模式下隐藏不必要的 UI 元素 / Hide unnecessary UI elements in fullscreen mode
          uiStore.setShowPlayPageHeader(false)
          uiStore.setControlBarAutoHide(true)
        }

        // 7. 初始化播放控制状态 / Initialize playback control state
        playbackStore.setProgress({
          currentTime: currentVideo.currentTime,
          duration: currentVideo.duration,
          seekableStart: 0,
          seekableEnd: currentVideo.duration
        })

        logger.info(`✅ 视频打开成功: ${currentVideo.fileName}`)

        // 发送成功通知 / Send success notification
        uiStore.addNotification({
          type: 'success',
          title: '视频加载成功',
          message: `已成功加载 ${currentVideo.fileName}`,
          duration: 3000
        })
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '未知错误'

        logger.error(`❌ 视频打开失败: ${filePath}`, error)

        // 设置错误状态 / Set error state
        videoStore.setLoadingError(errorMessage)
        playbackStore.setError(errorMessage)

        // 发送错误通知 / Send error notification
        uiStore.addNotification({
          type: 'error',
          title: '视频加载失败',
          message: errorMessage,
          duration: 5000
        })

        throw error
      }
    }, 'VideoActions.openVideo')
  }

  /**
   * 自动加载字幕 / Auto load subtitles
   *
   * @param videoPath 视频文件路径 / Video file path
   */
  static async autoLoadSubtitle(videoPath: string): Promise<void> {
    const subtitleStore = useSubtitleStore.getState()

    try {
      // 尝试查找同名字幕文件 / Try to find subtitle file with same name
      const subtitlePath = this.findSubtitleFile(videoPath)

      if (subtitlePath) {
        await subtitleStore.loadSubtitles(subtitlePath)
        logger.info(`✅ 自动加载字幕成功: ${subtitlePath}`)
      } else {
        logger.info(`ℹ️ 未找到匹配的字幕文件: ${videoPath}`)
      }
    } catch (error) {
      logger.warn(`⚠️ 自动加载字幕失败: ${videoPath}`, error)
      // 字幕加载失败不应该影响视频播放 / Subtitle loading failure should not affect video playback
    }
  }

  /**
   * 查找字幕文件 / Find subtitle file
   *
   * @param videoPath 视频文件路径 / Video file path
   * @returns 字幕文件路径或 null / Subtitle file path or null
   */
  private static findSubtitleFile(videoPath: string): string | null {
    // 这里应该实现实际的字幕文件查找逻辑 / Actual subtitle file finding logic should be implemented here
    // 目前返回模拟路径 / Currently returns mock path
    const basePath = videoPath.replace(/\.[^/.]+$/, '')
    const subtitleExtensions = ['.srt', '.vtt', '.ass', '.ssa']

    // 在实际实现中，这里应该检查文件系统 / In actual implementation, this should check the file system
    for (const ext of subtitleExtensions) {
      const subtitlePath = `${basePath}${ext}`
      // 模拟文件存在检查 / Mock file existence check
      if (Math.random() > 0.7) {
        // 30% 概率找到字幕 / 30% chance to find subtitle
        return subtitlePath
      }
    }

    return null
  }

  /**
   * 恢复播放位置 / Restore playback position
   *
   * @param fileId 文件ID / File ID
   */
  static async restorePlaybackPosition(fileId: string): Promise<void> {
    const videoStore = useVideoStore.getState()
    const playbackStore = usePlaybackControlStore.getState()

    try {
      // 从最近播放记录中获取上次播放位置 / Get last playback position from recent plays
      const recentPlay = videoStore.recentPlays.find((play) => play.videoInfo.id === fileId)

      if (recentPlay && recentPlay.lastPosition > 0) {
        // 如果上次播放位置接近结尾，从头开始 / If last position is near the end, start from beginning
        const duration = videoStore.currentVideo?.duration || 0
        const position = recentPlay.lastPosition

        if (duration > 0 && duration - position < 30) {
          // 距离结尾不到30秒，从头开始 / Less than 30 seconds from end, start from beginning
          videoStore.setCurrentTime(0)
          playbackStore.setProgress({ currentTime: 0 })
        } else {
          // 恢复到上次播放位置 / Restore to last playback position
          videoStore.setCurrentTime(position)
          playbackStore.setProgress({ currentTime: position })

          logger.info(`🔄 已恢复播放位置: ${position}秒`)
        }
      }
    } catch (error) {
      logger.warn('⚠️ 恢复播放位置失败', error)
    }
  }

  /**
   * 添加到最近播放 / Add to recent plays
   *
   * @param currentVideo 当前视频信息 / Current video info
   */
  static async addToRecentPlays(currentVideo: CurrentVideoState): Promise<void> {
    const videoStore = useVideoStore.getState()

    try {
      // 创建最近播放项 / Create recent play item
      const recentPlayItem: RecentPlayItem = {
        videoInfo: {
          id: currentVideo.fileId,
          filePath: currentVideo.filePath,
          fileName: currentVideo.fileName,
          fileSize: 0,
          duration: currentVideo.duration,
          format: currentVideo.format,
          resolution: { width: 1920, height: 1080, aspectRatio: 16 / 9 },
          frameRate: 30,
          bitRate: 2000,
          createdAt: new Date(),
          modifiedAt: new Date()
        },
        lastPlayedAt: new Date(),
        lastPosition: 0,
        playCount: 1,
        videoPlaybackSettings: {
          displayMode: SubtitleDisplayMode.ORIGINAL,
          volume: 1,
          playbackRate: 1,
          isSingleLoop: false,
          loopSettings: { count: 0 },
          isAutoPause: false
        }
      }

      videoStore.addRecentPlay(recentPlayItem)
      logger.info(`📝 已添加到最近播放: ${currentVideo.fileName}`)
    } catch (error) {
      logger.warn('⚠️ 添加到最近播放失败', error)
    }
  }

  /**
   * 跳转到字幕位置 / Seek to subtitle position
   *
   * @param subtitleIndex 字幕索引 / Subtitle index
   */
  static async seekToSubtitle(subtitleIndex: number): Promise<void> {
    const videoStore = useVideoStore.getState()
    const subtitleStore = useSubtitleStore.getState()
    const playbackStore = usePlaybackControlStore.getState()
    const uiStore = useUIStore.getState()

    try {
      const subtitle = subtitleStore.subtitles[subtitleIndex]
      if (!subtitle) {
        throw new Error(`字幕索引 ${subtitleIndex} 不存在`)
      }

      // 更新视频播放时间 / Update video playback time
      videoStore.setCurrentTime(subtitle.startTime)
      playbackStore.seek(subtitle.startTime)

      // 更新字幕当前索引 / Update subtitle current index
      subtitleStore.setCurrentIndex(subtitleIndex)

      // 如果开启自动滚动，滚动到当前字幕 / If auto scroll is enabled, scroll to current subtitle
      if (subtitleStore.displayConfig.isAutoScrollEnabled) {
        // 这里应该触发 UI 滚动事件 / This should trigger UI scroll event
        // 在实际实现中可能需要通过事件系统或回调来处理 / In actual implementation, might need to handle through event system or callbacks
      }

      logger.info(`🎯 已跳转到字幕 ${subtitleIndex}: ${subtitle.startTime}秒`)

      StateDebug.logStateChange(
        'VideoActions',
        'seekToSubtitle',
        {
          videoTime: videoStore.currentVideo?.currentTime,
          subtitleIndex: subtitleStore.navigation.currentIndex
        },
        { videoTime: subtitle.startTime, subtitleIndex }
      )
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '跳转失败'
      logger.error(`❌ 跳转到字幕失败: ${errorMessage}`, error)

      uiStore.addNotification({
        type: 'error',
        title: '跳转失败',
        message: errorMessage,
        duration: 3000
      })
    }
  }

  /**
   * 同步视频时间和字幕 / Sync video time and subtitles
   *
   * @param currentTime 当前播放时间 / Current playback time
   */
  static syncVideoTimeAndSubtitle(currentTime: number): void {
    const videoStore = useVideoStore.getState()
    const subtitleStore = useSubtitleStore.getState()

    // 更新视频时间 / Update video time
    videoStore.setCurrentTime(currentTime)

    // 查找当前时间对应的字幕 / Find subtitle for current time
    const subtitleIndex = subtitleStore.subtitles.findIndex(
      (subtitle) => currentTime >= subtitle.startTime && currentTime <= subtitle.endTime
    )

    // 如果找到对应字幕且与当前索引不同，更新字幕索引 / If found corresponding subtitle and different from current index, update subtitle index
    if (subtitleIndex >= 0 && subtitleIndex !== subtitleStore.navigation.currentIndex) {
      subtitleStore.setCurrentIndex(subtitleIndex)
    } else if (subtitleIndex < 0 && subtitleStore.navigation.currentIndex >= 0) {
      // 如果没有找到对应字幕，清除当前字幕索引 / If no corresponding subtitle found, clear current subtitle index
      subtitleStore.setCurrentIndex(-1)
    }
  }

  /**
   * 保存播放进度 / Save playback progress
   *
   * @param force 是否强制保存 / Whether to force save
   */
  static async savePlaybackProgress(force = false): Promise<void> {
    const videoStore = useVideoStore.getState()
    const currentVideo = videoStore.currentVideo

    if (!currentVideo) return

    try {
      // 更新最近播放记录中的播放位置 / Update playback position in recent plays
      videoStore.updateRecentPlay(currentVideo.fileId, {
        lastPosition: currentVideo.currentTime,
        lastPlayedAt: new Date()
      })

      if (force) {
        logger.info(`💾 已保存播放进度: ${currentVideo.currentTime}秒`)
      }
    } catch (error) {
      logger.warn('⚠️ 保存播放进度失败', error)
    }
  }

  /**
   * 清理视频相关状态 / Clean up video related states
   */
  static cleanupVideoStates(): void {
    const videoStore = useVideoStore.getState()
    const subtitleStore = useSubtitleStore.getState()
    const playbackStore = usePlaybackControlStore.getState()

    // 清理视频状态 / Clean up video state
    videoStore.clearVideo()

    // 清理字幕状态 / Clean up subtitle state
    subtitleStore.clearSubtitles()

    // 重置播放控制状态 / Reset playback control state
    playbackStore.stop()
    playbackStore.clearError()

    logger.info('🧹 已清理视频相关状态')
  }
}
