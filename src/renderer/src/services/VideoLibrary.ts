import { loggerService } from '@logger'
import db from '@renderer/infrastructure/databases'
import { VideoLibraryRecord, VideoLibraryRecordQueryParams } from '@types'

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
  async addOrUpdateRecord(record: Omit<VideoLibraryRecord, 'id'>): Promise<VideoLibraryRecord> {
    try {
      const startTime = performance.now()
      logger.info('📝 开始添加或更新播放记录:', { fileId: record.fileId })

      // 检查是否已存在该文件的播放记录
      const queryStartTime = performance.now()
      const existingRecord = await db.videoLibrary.where('fileId').equals(record.fileId).first()
      const queryEndTime = performance.now()
      logger.info(`🔍 播放记录查询耗时: ${(queryEndTime - queryStartTime).toFixed(2)}ms`)

      if (existingRecord) {
        // 更新现有记录
        const updateStartTime = performance.now()
        const updatedRecord: Partial<VideoLibraryRecord> = {
          ...record,
          playCount: existingRecord.playCount + 1,
          playedAt: Date.now(),
          // 保持首次播放时间不变
          firstPlayedAt: existingRecord.firstPlayedAt
        }

        await db.videoLibrary.update(existingRecord.id!, updatedRecord)
        const updateEndTime = performance.now()

        const resultQueryStartTime = performance.now()
        const result = await db.videoLibrary.get(existingRecord.id!)
        const resultQueryEndTime = performance.now()

        const totalTime = performance.now() - startTime
        logger.info(`✅ 播放记录更新成功，总耗时: ${totalTime.toFixed(2)}ms`, {
          查询耗时: `${(queryEndTime - queryStartTime).toFixed(2)}ms`,
          更新耗时: `${(updateEndTime - updateStartTime).toFixed(2)}ms`,
          结果查询耗时: `${(resultQueryEndTime - resultQueryStartTime).toFixed(2)}ms`,
          总耗时: `${totalTime.toFixed(2)}ms`
        })
        return result!
      } else {
        // 添加新记录
        const addStartTime = performance.now()
        const newRecord: Omit<VideoLibraryRecord, 'id'> = {
          ...record,
          playCount: 1,
          firstPlayedAt: Date.now(),
          playedAt: Date.now()
        }

        const id = await db.videoLibrary.add(newRecord)
        const addEndTime = performance.now()

        const resultQueryStartTime = performance.now()
        const result = await db.videoLibrary.get(id)
        const resultQueryEndTime = performance.now()

        const totalTime = performance.now() - startTime
        logger.info(`✅ 播放记录添加成功，总耗时: ${totalTime.toFixed(2)}ms`, {
          查询耗时: `${(queryEndTime - queryStartTime).toFixed(2)}ms`,
          添加耗时: `${(addEndTime - addStartTime).toFixed(2)}ms`,
          结果查询耗时: `${(resultQueryEndTime - resultQueryStartTime).toFixed(2)}ms`,
          总耗时: `${totalTime.toFixed(2)}ms`
        })
        return result!
      }
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
      const {
        limit = 20,
        offset = 0,
        sortBy = 'playedAt',
        sortOrder = 'desc',
        favoritesOnly = false,
        searchQuery
      } = params

      logger.info('📋 获取播放记录列表:', params)

      let query = db.videoLibrary.toCollection()

      // 应用收藏过滤
      if (favoritesOnly) {
        query = query.filter((record) => record.isFavorite)
      }

      // 注意：搜索功能现在需要使用 searchRecordsWithFileInfo 方法
      // 这里暂时跳过搜索过滤，因为需要关联文件表才能搜索文件名
      if (searchQuery) {
        logger.warn('⚠️ getRecords 方法不支持搜索，请使用 searchRecordsWithFileInfo 方法')
      }

      // 获取所有匹配的记录
      const records = await query.toArray()

      // 应用排序
      records.sort((a, b) => {
        let aValue: number
        let bValue: number

        switch (sortBy) {
          case 'playCount':
            aValue = a.playCount
            bValue = b.playCount
            break
          case 'firstPlayedAt':
            aValue = a.firstPlayedAt
            bValue = b.firstPlayedAt
            break
          case 'duration':
            aValue = a.duration
            bValue = b.duration
            break
          default: // 'playedAt'
            aValue = a.playedAt
            bValue = b.playedAt
        }

        return sortOrder === 'desc' ? bValue - aValue : aValue - bValue
      })

      // 应用分页
      const result = records.slice(offset, offset + limit)

      logger.info(`✅ 成功获取 ${result.length} 条播放记录`)
      return result
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

      const record = await db.videoLibrary.get(id)

      if (record) {
        logger.info('✅ 播放记录获取成功')
      } else {
        logger.warn('⚠️ 未找到指定的播放记录')
      }

      return record || null
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

      const existingRecord = await db.videoLibrary.get(id)
      if (!existingRecord) {
        throw new VideoLibraryServiceError('播放记录不存在', 'RECORD_NOT_FOUND')
      }

      await db.videoLibrary.update(id, updates)
      const updatedRecord = await db.videoLibrary.get(id)

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

      const existingRecord = await db.videoLibrary.get(id)
      if (!existingRecord) {
        logger.warn('⚠️ 要删除的播放记录不存在')
        return false
      }

      await db.videoLibrary.delete(id)
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

      let deletedCount = 0
      for (const id of ids) {
        const success = await this.deleteRecord(id)
        if (success) {
          deletedCount++
        }
      }

      logger.info(`✅ 批量删除完成，成功删除 ${deletedCount} 条记录`)
      return deletedCount
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

      const allRecords = await db.videoLibrary.toArray()
      const count = allRecords.length

      await db.videoLibrary.clear()

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

      // 由于移除了冗余字段，这里只能通过 fileId 进行基础搜索
      // 实际的文件名搜索需要使用 searchRecordsWithFileInfo 方法
      const searchLower = query.toLowerCase()
      const records = await db.videoLibrary
        .toCollection()
        .filter((record) => record.fileId.toLowerCase().includes(searchLower))
        .limit(limit)
        .toArray()

      // 按播放时间倒序排序
      records.sort((a, b) => b.playedAt - a.playedAt)

      logger.info(`✅ 搜索完成，找到 ${records.length} 条记录`)
      return records
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

      const records = await db.videoLibrary.orderBy('playedAt').reverse().limit(limit).toArray()

      logger.info(`✅ 成功获取 ${records.length} 条最近播放记录`)
      return records
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

      const records = await db.videoLibrary.orderBy('playCount').reverse().limit(limit).toArray()

      logger.info(`✅ 成功获取 ${records.length} 条最常播放记录`)
      return records
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

      let query = db.videoLibrary.where('isFavorite').equals(1).reverse()

      if (limit) {
        query = query.limit(limit)
      }

      const records = await query.toArray()

      logger.info(`✅ 成功获取 ${records.length} 条收藏记录`)
      return records
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

      const record = await db.videoLibrary.get(id)
      if (!record) {
        throw new VideoLibraryServiceError('播放记录不存在', 'RECORD_NOT_FOUND')
      }

      const newFavoriteStatus = !record.isFavorite
      await db.videoLibrary.update(id, { isFavorite: newFavoriteStatus })

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
