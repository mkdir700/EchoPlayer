import { loggerService } from '@logger'
import type { VideoLibraryRecordQueryParams } from '@types'
import type { VideoLibraryRecord } from 'packages/shared/types/database'

const logger = loggerService.withContext('PlaybackRecordService')

export class VideoLibraryServiceError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly originalError?: Error
  ) {
    super(message)
    this.name = 'PlaybackRecordServiceError'
  }
}

/**
 * 视频库服务类
 * 负责管理视频，包括添加、查询、更新、删除等操作
 */
export class VideoLibraryService {
  /**
   * 添加或更新播放记录
   * @param record 播放记录数据
   * @returns 添加或更新后的播放记录
   */
  async addRecord(record: Omit<VideoLibraryRecord, 'id'>): Promise<{ id: number }> {
    try {
      logger.info('📝 开始添加或更新播放记录:', { fileId: record.fileId })

      // 添加新记录
      const newRecord = {
        ...record,
        playCount: 1,
        firstPlayedAt: Date.now(),
        playedAt: Date.now()
      }

      logger.info('➕ 添加新播放记录:', newRecord)
      return await window.api.db.videoLibrary.add(newRecord)
    } catch (error) {
      const errorMessage = `添加或更新播放记录失败: ${error instanceof Error ? error.message : 'Unknown error'}`
      logger.error('❌ 添加或更新播放记录失败:', { error })
      throw new VideoLibraryServiceError(errorMessage, 'ADD_OR_UPDATE_FAILED', error as Error)
    }
  }

  /**
   * 获取播放记录列表
   * @param params 查询参数
   * @returns 播放记录列表
   */
  async getRecords(params: VideoLibraryRecordQueryParams = {}): Promise<VideoLibraryRecord[]> {
    try {
      logger.info('📋 获取播放记录列表:', params)

      const records = await window.api.db.videoLibrary.getRecords(params)

      logger.info(`✅ 成功获取 ${records.length} 条播放记录`)
      return records as VideoLibraryRecord[]
    } catch (error) {
      const errorMessage = `获取播放记录列表失败: ${error instanceof Error ? error.message : 'Unknown error'}`
      logger.error('❌ 获取播放记录列表失败:', { error })
      throw new VideoLibraryServiceError(errorMessage, 'GET_RECORDS_FAILED', error as Error)
    }
  }

  /**
   * 根据ID获取播放记录
   * @param id 记录ID
   * @returns 播放记录或null
   */
  async getRecordById(id: number): Promise<VideoLibraryRecord | null> {
    try {
      logger.info('🔍 根据ID获取播放记录:', { id })

      const record = await window.api.db.videoLibrary.findById(id)

      if (record) {
        logger.info('✅ 播放记录获取成功')
      } else {
        logger.warn('⚠️ 未找到指定的播放记录')
      }

      return record as VideoLibraryRecord | null
    } catch (error) {
      const errorMessage = `根据ID获取播放记录失败: ${error instanceof Error ? error.message : 'Unknown error'}`
      logger.error('❌ 根据ID获取播放记录失败:', { error })
      throw new VideoLibraryServiceError(errorMessage, 'GET_RECORD_BY_ID_FAILED', error as Error)
    }
  }

  /**
   * 更新播放记录
   * @param id 记录ID
   * @param updates 更新数据
   * @returns 更新后的播放记录
   */
  async updateRecord(
    id: number,
    updates: Partial<VideoLibraryRecord>
  ): Promise<VideoLibraryRecord> {
    try {
      logger.info('📝 更新播放记录:', { id, updates })

      const existingRecord = await window.api.db.videoLibrary.findById(id)
      if (!existingRecord) {
        throw new VideoLibraryServiceError('播放记录不存在', 'RECORD_NOT_FOUND')
      }

      await window.api.db.videoLibrary.updateRecord(id, updates)
      const updatedRecord = await window.api.db.videoLibrary.findById(id)

      logger.info('✅ 播放记录更新成功')
      return updatedRecord!
    } catch (error) {
      const errorMessage = `更新播放记录失败: ${error instanceof Error ? error.message : 'Unknown error'}`
      logger.error('❌ 更新播放记录失败:', { error })
      throw new VideoLibraryServiceError(errorMessage, 'UPDATE_RECORD_FAILED', error as Error)
    }
  }

  /**
   * 删除播放记录
   * @param id 记录ID
   * @returns 是否删除成功
   */
  async deleteRecord(id: number): Promise<boolean> {
    try {
      logger.info('🗑️ 删除播放记录:', { id })

      const existingRecord = await window.api.db.videoLibrary.findById(id)
      if (!existingRecord) {
        logger.warn('⚠️ 要删除的播放记录不存在')
        return false
      }

      await window.api.db.videoLibrary.deleteRecord(id)
      logger.info('✅ 播放记录删除成功')
      return true
    } catch (error) {
      const errorMessage = `删除播放记录失败: ${error instanceof Error ? error.message : 'Unknown error'}`
      logger.error('❌ 删除播放记录失败:', { error })
      throw new VideoLibraryServiceError(errorMessage, 'DELETE_RECORD_FAILED', error as Error)
    }
  }

  /**
   * 批量删除播放记录
   * @param ids 记录ID数组
   * @returns 删除的记录数量
   */
  async deleteRecords(ids: number[]): Promise<number> {
    try {
      logger.info('🗑️ 批量删除播放记录:', { count: ids.length })

      await window.api.db.videoLibrary.deleteRecords(ids)

      logger.info(`✅ 批量删除完成，成功删除 ${ids.length} 条记录`)
      return ids.length
    } catch (error) {
      const errorMessage = `批量删除播放记录失败: ${error instanceof Error ? error.message : 'Unknown error'}`
      logger.error('❌ 批量删除播放记录失败:', { error })
      throw new VideoLibraryServiceError(errorMessage, 'DELETE_RECORDS_FAILED', error as Error)
    }
  }

  /**
   * 清空所有播放记录
   * @returns 清空的记录数量
   */
  async clearAllRecords(): Promise<number> {
    try {
      logger.info('🧹 清空所有播放记录')

      // 先获取记录数量
      const allRecords = await window.api.db.videoLibrary.getRecords({
        limit: Number.MAX_SAFE_INTEGER
      })
      const count = allRecords.length

      await window.api.db.videoLibrary.clearAll()

      logger.info(`✅ 成功清空 ${count} 条播放记录`)
      return count
    } catch (error) {
      const errorMessage = `清空播放记录失败: ${error instanceof Error ? error.message : 'Unknown error'}`
      logger.error('❌ 清空播放记录失败:', { error })
      throw new VideoLibraryServiceError(errorMessage, 'CLEAR_RECORDS_FAILED', error as Error)
    }
  }

  /**
   * 搜索播放记录（仅返回基础记录，不包含文件信息）
   * @param query 搜索关键词
   * @param limit 限制返回数量
   * @returns 搜索结果
   * @deprecated 建议使用 searchRecordsWithFileInfo 方法获取完整信息
   */
  async searchRecords(query: string, limit: number = 20): Promise<VideoLibraryRecord[]> {
    try {
      logger.info('🔍 搜索播放记录 (基础版本):', { query, limit })
      logger.warn('⚠️ 建议使用 searchRecordsWithFileInfo 方法获取包含文件信息的搜索结果')

      if (!query.trim()) {
        return []
      }

      const records = await window.api.db.videoLibrary.searchRecords(query, limit)

      logger.info(`✅ 搜索完成，找到 ${records.length} 条记录`)
      return records as VideoLibraryRecord[]
    } catch (error) {
      const errorMessage = `搜索播放记录失败: ${error instanceof Error ? error.message : 'Unknown error'}`
      logger.error('❌ 搜索播放记录失败:', { error })
      throw new VideoLibraryServiceError(errorMessage, 'SEARCH_RECORDS_FAILED', error as Error)
    }
  }

  /**
   * 获取最近播放的记录
   * @param limit 限制返回数量
   * @returns 最近播放记录列表
   */
  async getRecentRecords(limit: number = 10): Promise<VideoLibraryRecord[]> {
    try {
      logger.info('📋 获取最近播放记录:', { limit })

      const records = await window.api.db.videoLibrary.getRecentlyPlayed(limit)

      logger.info(`✅ 成功获取 ${records.length} 条最近播放记录`)
      return records as VideoLibraryRecord[]
    } catch (error) {
      const errorMessage = `获取最近播放记录失败: ${error instanceof Error ? error.message : 'Unknown error'}`
      logger.error('❌ 获取最近播放记录失败:', { error })
      throw new VideoLibraryServiceError(errorMessage, 'GET_RECENT_RECORDS_FAILED', error as Error)
    }
  }

  /**
   * 获取最常播放的记录
   * @param limit 限制返回数量
   * @returns 最常播放记录列表
   */
  async getMostPlayedRecords(limit: number = 10): Promise<VideoLibraryRecord[]> {
    try {
      logger.info('📋 获取最常播放记录:', { limit })

      const records = await window.api.db.videoLibrary.getMostPlayed(limit)

      logger.info(`✅ 成功获取 ${records.length} 条最常播放记录`)
      return records as VideoLibraryRecord[]
    } catch (error) {
      const errorMessage = `获取最常播放记录失败: ${error instanceof Error ? error.message : 'Unknown error'}`
      logger.error('❌ 获取最常播放记录失败:', { error })
      throw new VideoLibraryServiceError(
        errorMessage,
        'GET_MOST_PLAYED_RECORDS_FAILED',
        error as Error
      )
    }
  }

  /**
   * 获取收藏的播放记录
   * @param limit 限制返回数量
   * @returns 收藏记录列表
   */
  async getFavoriteRecords(limit?: number): Promise<VideoLibraryRecord[]> {
    try {
      logger.info('⭐ 获取收藏播放记录:', { limit })

      const records = await window.api.db.videoLibrary.getFavorites()

      // 如果指定了限制，应用限制
      const result = limit ? records.slice(0, limit) : records

      logger.info(`✅ 成功获取 ${result.length} 条收藏记录`)
      return result as VideoLibraryRecord[]
    } catch (error) {
      const errorMessage = `获取收藏记录失败: ${error instanceof Error ? error.message : 'Unknown error'}`
      logger.error('❌ 获取收藏记录失败:', { error })
      throw new VideoLibraryServiceError(
        errorMessage,
        'GET_FAVORITE_RECORDS_FAILED',
        error as Error
      )
    }
  }

  /**
   * 切换收藏状态
   * @param id 记录ID
   * @returns 新的收藏状态
   */
  async toggleFavorite(id: number): Promise<boolean> {
    try {
      logger.info('⭐ 切换收藏状态:', { id })

      const record = await window.api.db.videoLibrary.findById(id)
      if (!record) {
        throw new VideoLibraryServiceError('播放记录不存在', 'RECORD_NOT_FOUND')
      }

      const newFavoriteStatus = !record.isFavorite
      await window.api.db.videoLibrary.updateRecord(id, { isFavorite: newFavoriteStatus })

      logger.info(`✅ 收藏状态已更新为: ${newFavoriteStatus ? '收藏' : '取消收藏'}`)
      return newFavoriteStatus
    } catch (error) {
      const errorMessage = `切换收藏状态失败: ${error instanceof Error ? error.message : 'Unknown error'}`
      logger.error('❌ 切换收藏状态失败:', { error })
      throw new VideoLibraryServiceError(errorMessage, 'TOGGLE_FAVORITE_FAILED', error as Error)
    }
  }

  /**
   * 更新播放进度
   * @param fileId 文件ID
   * @param currentTime 当前播放时间
   * @param duration 总时长
   * @returns 更新后的记录
   */
  async updatePlayProgress(
    videoId: number,
    currentTime: number,
    duration: number
  ): Promise<VideoLibraryRecord | null> {
    try {
      logger.info('⏱️ 更新播放进度:', { videoId, currentTime, duration })

      const record = await this.getRecordById(videoId)
      if (!record) {
        logger.warn('⚠️ 未找到播放记录，无法更新进度')
        return null
      }

      const isFinished = currentTime >= duration * 0.95 // 播放超过95%认为已完成

      const updatedRecord = await this.updateRecord(record.id!, {
        currentTime,
        duration,
        isFinished,
        playedAt: Date.now()
      })

      logger.info('✅ 播放进度更新成功')
      return updatedRecord
    } catch (error) {
      const errorMessage = `更新播放进度失败: ${error instanceof Error ? error.message : 'Unknown error'}`
      logger.error('❌ 更新播放进度失败:', { error })
      throw new VideoLibraryServiceError(
        errorMessage,
        'UPDATE_PLAY_PROGRESS_FAILED',
        error as Error
      )
    }
  }
}
