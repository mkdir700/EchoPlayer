import { loggerService } from '@logger'
import type { VideoLibraryRecord } from 'packages/shared/types/database'

const logger = loggerService.withContext('VideoLibraryService')

/**
 * 视频库数据库服务 - 专门处理视频库相关操作
 */
export class VideoLibraryService {
  /**
   * 根据文件ID获取视频记录
   */
  async getVideoRecordByFileId(fileId: string): Promise<VideoLibraryRecord | null> {
    try {
      const result = await window.api.db.videoLibrary.findByFileId(fileId)
      return result as VideoLibraryRecord | null
    } catch (error) {
      logger.error('Failed to get video record by fileId:', { error })
      return null
    }
  }

  /**
   * 获取最近播放的视频列表
   */
  async getRecentlyPlayedVideos(limit: number = 10): Promise<VideoLibraryRecord[]> {
    try {
      const results = await window.api.db.videoLibrary.getRecentlyPlayed(limit)
      return results as VideoLibraryRecord[]
    } catch (error) {
      logger.error('Failed to get recently played videos:', { error })
      return []
    }
  }

  /**
   * 获取收藏的视频列表
   */
  async getFavoriteVideos(): Promise<VideoLibraryRecord[]> {
    try {
      const results = await window.api.db.videoLibrary.getFavorites()
      return results as VideoLibraryRecord[]
    } catch (error) {
      logger.error('Failed to get favorite videos:', { error })
      return []
    }
  }

  /**
   * 更新视频播放进度
   */
  async updateVideoPlayProgress(
    fileId: string,
    currentTime: number,
    isFinished?: boolean
  ): Promise<void> {
    try {
      await window.api.db.videoLibrary.updatePlayProgress(fileId, currentTime, isFinished)
    } catch (error) {
      logger.error('Failed to update video play progress:', { error })
      throw error
    }
  }

  /**
   * 切换视频收藏状态
   */
  async toggleVideoFavorite(fileId: string): Promise<void> {
    try {
      await window.api.db.videoLibrary.toggleFavorite(fileId)
    } catch (error) {
      logger.error('Failed to toggle video favorite:', { error })
      throw error
    }
  }
}
