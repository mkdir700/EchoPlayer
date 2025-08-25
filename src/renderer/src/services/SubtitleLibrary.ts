import { loggerService } from '@logger'
import db from '@renderer/infrastructure/databases'
import { SubtitleLibraryRecord } from '@types'

const logger = loggerService.withContext('SubtitleLibraryService')

export class SubtitleLibraryServiceError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly originalError?: Error
  ) {
    super(message)
    this.name = 'SubtitleLibraryServiceError'
  }
}

// 查询参数定义（本地，仅服务内使用）
interface SubtitleLibraryRecordQueryParams {
  videoId?: number
  limit?: number
  offset?: number
  sortOrder?: 'asc' | 'desc'
  searchQuery?: string
}

/**
 * 字幕库服务类
 * 负责管理字幕记录（视频与字幕文件的关联）
 */
export class SubtitleLibraryService {
  /**
   * 添加或返回已存在的字幕记录（唯一键：videoId + filePath）
   */
  async addOrUpdateRecord(
    record: Omit<SubtitleLibraryRecord, 'id' | 'created_at'>
  ): Promise<SubtitleLibraryRecord> {
    try {
      const startTime = performance.now()
      logger.info('📝 开始添加或获取字幕记录:', {
        videoId: record.videoId,
        filePath: record.filePath
      })

      const queryStart = performance.now()
      const existing = await db.subtitleLibrary
        .where('[videoId+filePath]' as any)
        .equals([record.videoId, record.filePath] as any)
        .first()
      const queryEnd = performance.now()
      logger.info(`🔍 字幕记录查询耗时: ${(queryEnd - queryStart).toFixed(2)}ms`)

      if (existing) {
        logger.info('✅ 字幕记录已存在，直接返回')
        return existing
      }

      const addStart = performance.now()
      const newRecord: Omit<SubtitleLibraryRecord, 'id'> = {
        videoId: record.videoId,
        filePath: record.filePath,
        created_at: Date.now()
      }
      const id = await db.subtitleLibrary.add(newRecord)
      const addEnd = performance.now()

      const resultQueryStart = performance.now()
      const result = await db.subtitleLibrary.get(id)
      const resultQueryEnd = performance.now()

      const totalTime = performance.now() - startTime
      logger.info(`✅ 字幕记录添加成功，总耗时: ${totalTime.toFixed(2)}ms`, {
        查询耗时: `${(queryEnd - queryStart).toFixed(2)}ms`,
        添加耗时: `${(addEnd - addStart).toFixed(2)}ms`,
        结果查询耗时: `${(resultQueryEnd - resultQueryStart).toFixed(2)}ms`,
        总耗时: `${totalTime.toFixed(2)}ms`
      })
      return result!
    } catch (error) {
      const errorMessage = `添加或更新字幕记录失败: ${error instanceof Error ? error.message : 'Unknown error'}`
      logger.error('❌ 添加或更新字幕记录失败:', { error })
      throw new SubtitleLibraryServiceError(errorMessage, 'ADD_OR_UPDATE_FAILED', error as Error)
    }
  }

  /** 获取字幕记录列表（支持按视频过滤、搜索、分页） */
  async getRecords(
    params: SubtitleLibraryRecordQueryParams = {}
  ): Promise<SubtitleLibraryRecord[]> {
    try {
      const { videoId, limit = 20, offset = 0, sortOrder = 'desc', searchQuery } = params
      logger.info('📋 获取字幕记录列表:', params)

      let collection = videoId
        ? db.subtitleLibrary.where('videoId').equals(videoId)
        : db.subtitleLibrary.toCollection()

      // 搜索（按 filePath 模糊匹配）
      if (searchQuery && searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        collection = collection.filter((r) => r.filePath.toLowerCase().includes(q))
      }

      const records = await collection.toArray()

      // 按创建时间排序
      records.sort((a, b) =>
        sortOrder === 'desc' ? b.created_at - a.created_at : a.created_at - b.created_at
      )

      const result = records.slice(offset, offset + limit)
      logger.info(`✅ 成功获取 ${result.length} 条字幕记录`)
      return result
    } catch (error) {
      const errorMessage = `获取字幕记录列表失败: ${error instanceof Error ? error.message : 'Unknown error'}`
      logger.error('❌ 获取字幕记录列表失败:', { error })
      throw new SubtitleLibraryServiceError(errorMessage, 'GET_RECORDS_FAILED', error as Error)
    }
  }

  /** 根据ID获取字幕记录 */
  async getRecordById(id: number): Promise<SubtitleLibraryRecord | null> {
    try {
      logger.info('🔍 根据ID获取字幕记录:', { id })
      const record = await db.subtitleLibrary.get(id)
      if (!record) {
        logger.warn('⚠️ 未找到指定的字幕记录')
      } else {
        logger.info('✅ 字幕记录获取成功')
      }
      return record || null
    } catch (error) {
      const errorMessage = `根据ID获取字幕记录失败: ${error instanceof Error ? error.message : 'Unknown error'}`
      logger.error('❌ 根据ID获取字幕记录失败:', { error })
      throw new SubtitleLibraryServiceError(errorMessage, 'GET_RECORD_BY_ID_FAILED', error as Error)
    }
  }

  /** 更新字幕记录（通常用于修改 filePath） */
  async updateRecord(
    id: number,
    updates: Partial<SubtitleLibraryRecord>
  ): Promise<SubtitleLibraryRecord> {
    try {
      logger.info('📝 更新字幕记录:', { id, updates })
      const existing = await db.subtitleLibrary.get(id)
      if (!existing) {
        throw new SubtitleLibraryServiceError('字幕记录不存在', 'RECORD_NOT_FOUND')
      }
      await db.subtitleLibrary.update(id, updates)
      const updated = await db.subtitleLibrary.get(id)
      logger.info('✅ 字幕记录更新成功')
      return updated!
    } catch (error) {
      const errorMessage = `更新字幕记录失败: ${error instanceof Error ? error.message : 'Unknown error'}`
      logger.error('❌ 更新字幕记录失败:', { error })
      throw new SubtitleLibraryServiceError(errorMessage, 'UPDATE_RECORD_FAILED', error as Error)
    }
  }

  /** 删除字幕记录 */
  async deleteRecord(id: number): Promise<boolean> {
    try {
      logger.info('🗑️ 删除字幕记录:', { id })
      const existing = await db.subtitleLibrary.get(id)
      if (!existing) {
        logger.warn('⚠️ 要删除的字幕记录不存在')
        return false
      }
      await db.subtitleLibrary.delete(id)
      logger.info('✅ 字幕记录删除成功')
      return true
    } catch (error) {
      const errorMessage = `删除字幕记录失败: ${error instanceof Error ? error.message : 'Unknown error'}`
      logger.error('❌ 删除字幕记录失败:', { error })
      throw new SubtitleLibraryServiceError(errorMessage, 'DELETE_RECORD_FAILED', error as Error)
    }
  }

  /** 批量删除字幕记录 */
  async deleteRecords(ids: number[]): Promise<number> {
    try {
      logger.info('🗑️ 批量删除字幕记录:', { count: ids.length })
      let deleted = 0
      for (const id of ids) {
        const ok = await this.deleteRecord(id)
        if (ok) deleted++
      }
      logger.info(`✅ 批量删除完成，成功删除 ${deleted} 条字幕记录`)
      return deleted
    } catch (error) {
      const errorMessage = `批量删除字幕记录失败: ${error instanceof Error ? error.message : 'Unknown error'}`
      logger.error('❌ 批量删除字幕记录失败:', { error })
      throw new SubtitleLibraryServiceError(errorMessage, 'DELETE_RECORDS_FAILED', error as Error)
    }
  }

  /** 清空所有字幕记录 */
  async clearAllRecords(): Promise<number> {
    try {
      logger.info('🧹 清空所有字幕记录')
      const all = await db.subtitleLibrary.toArray()
      const count = all.length
      await db.subtitleLibrary.clear()
      logger.info(`✅ 成功清空 ${count} 条字幕记录`)
      return count
    } catch (error) {
      const errorMessage = `清空字幕记录失败: ${error instanceof Error ? error.message : 'Unknown error'}`
      logger.error('❌ 清空字幕记录失败:', { error })
      throw new SubtitleLibraryServiceError(errorMessage, 'CLEAR_RECORDS_FAILED', error as Error)
    }
  }

  /** 获取最近的字幕记录 */
  async getRecentRecords(limit: number = 10): Promise<SubtitleLibraryRecord[]> {
    try {
      logger.info('📋 获取最近字幕记录:', { limit })
      const records = await db.subtitleLibrary
        .orderBy('created_at')
        .reverse()
        .limit(limit)
        .toArray()
      logger.info(`✅ 成功获取 ${records.length} 条最近字幕记录`)
      return records
    } catch (error) {
      const errorMessage = `获取最近字幕记录失败: ${error instanceof Error ? error.message : 'Unknown error'}`
      logger.error('❌ 获取最近字幕记录失败:', { error })
      throw new SubtitleLibraryServiceError(
        errorMessage,
        'GET_RECENT_RECORDS_FAILED',
        error as Error
      )
    }
  }

  /** 按视频ID获取字幕记录 */
  async getRecordsByVideoId(videoId: number): Promise<SubtitleLibraryRecord[]> {
    try {
      logger.info('📋 按视频ID获取字幕记录:', { videoId })
      const records = await db.subtitleLibrary.where('videoId').equals(videoId).toArray()
      // 倒序按时间
      records.sort((a, b) => b.created_at - a.created_at)
      logger.info(`✅ 成功获取 ${records.length} 条字幕记录`)
      return records
    } catch (error) {
      const errorMessage = `按视频ID获取字幕记录失败: ${error instanceof Error ? error.message : 'Unknown error'}`
      logger.error('❌ 按视频ID获取字幕记录失败:', { error })
      throw new SubtitleLibraryServiceError(errorMessage, 'GET_BY_VIDEO_ID_FAILED', error as Error)
    }
  }

  /** 按文件路径关键字搜索字幕记录（基础版） */
  async searchRecords(query: string, limit: number = 20): Promise<SubtitleLibraryRecord[]> {
    try {
      logger.info('🔍 搜索字幕记录 (基础版本):', { query, limit })
      if (!query.trim()) return []
      const q = query.toLowerCase()
      const records = await db.subtitleLibrary
        .toCollection()
        .filter((r) => r.filePath.toLowerCase().includes(q))
        .limit(limit)
        .toArray()
      // 按创建时间倒序
      records.sort((a, b) => b.created_at - a.created_at)
      logger.info(`✅ 搜索完成，找到 ${records.length} 条字幕记录`)
      return records
    } catch (error) {
      const errorMessage = `搜索字幕记录失败: ${error instanceof Error ? error.message : 'Unknown error'}`
      logger.error('❌ 搜索字幕记录失败:', { error })
      throw new SubtitleLibraryServiceError(errorMessage, 'SEARCH_RECORDS_FAILED', error as Error)
    }
  }
}
