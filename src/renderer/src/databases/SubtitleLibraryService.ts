import { loggerService } from '@logger'
import type { SubtitleItem } from '@types'
import type { SubtitleLibraryInsert, SubtitleLibraryRecord } from 'packages/shared/types/database'

const logger = loggerService.withContext('SubtitleLibraryService')

/**
 * 字幕库数据库服务 - 专门处理字幕库相关操作
 */
export class SubtitleLibraryService {
  /**
   * 添加字幕记录
   */
  async addSubtitle(subtitle: SubtitleLibraryInsert): Promise<SubtitleLibraryRecord> {
    try {
      const result = await window.api.db.subtitleLibrary.add(subtitle)
      return {
        ...result,
        created_at: new Date(result.created_at)
      }
    } catch (error) {
      logger.error('Failed to add subtitle:', { error })
      throw error
    }
  }

  /**
   * 根据视频ID获取字幕列表
   */
  async getSubtitlesByVideoId(videoId: number): Promise<SubtitleLibraryRecord[]> {
    try {
      const results = await window.api.db.subtitleLibrary.findByVideoId(videoId)
      return results.map((result) => ({
        ...result,
        created_at: new Date(result.created_at)
      }))
    } catch (error) {
      logger.error('Failed to get subtitles by videoId:', { error })
      return []
    }
  }

  /**
   * 根据视频ID和文件路径获取字幕
   */
  async getSubtitleByVideoIdAndPath(
    videoId: number,
    filePath: string
  ): Promise<SubtitleLibraryRecord | null> {
    try {
      const result = await window.api.db.subtitleLibrary.findByVideoIdAndPath(videoId, filePath)
      if (!result) return null

      return {
        ...result,
        created_at: new Date(result.created_at)
      }
    } catch (error) {
      logger.error('Failed to get subtitle by videoId and path:', { error })
      return null
    }
  }

  /**
   * 根据ID获取字幕记录
   */
  async getSubtitleById(id: number): Promise<SubtitleLibraryRecord | null> {
    try {
      const result = await window.api.db.subtitleLibrary.findById(id)
      if (!result) return null

      return {
        ...result,
        created_at: new Date(result.created_at)
      }
    } catch (error) {
      logger.error('Failed to get subtitle by ID:', { error })
      return null
    }
  }

  /**
   * 更新字幕记录
   */
  async updateSubtitle(
    id: number,
    updates: Partial<Omit<SubtitleLibraryRecord, 'id'>>
  ): Promise<SubtitleLibraryRecord | null> {
    try {
      // 转换 Date 对象为时间戳
      const dbUpdates = {
        ...updates,
        ...(updates.created_at && { created_at: updates.created_at.getTime() })
      }

      await window.api.db.subtitleLibrary.update(id, dbUpdates)

      // 获取更新后的记录
      return await this.getSubtitleById(id)
    } catch (error) {
      logger.error('Failed to update subtitle:', { error })
      throw error
    }
  }

  /**
   * 获取所有字幕记录
   */
  async getAllSubtitles(): Promise<SubtitleLibraryRecord[]> {
    try {
      const results = await window.api.db.subtitleLibrary.findAll()
      return results.map((result) => ({
        ...result,
        created_at: new Date(result.created_at)
      }))
    } catch (error) {
      logger.error('Failed to get all subtitles:', { error })
      return []
    }
  }

  /**
   * 清空所有字幕记录
   */
  async clearAllSubtitles(): Promise<void> {
    try {
      await window.api.db.subtitleLibrary.clear()
    } catch (error) {
      logger.error('Failed to clear all subtitles:', { error })
      throw error
    }
  }

  /**
   * 按创建时间排序获取字幕记录
   */
  async getSubtitlesOrderedByCreatedAt(
    order: 'asc' | 'desc' = 'desc',
    limit?: number
  ): Promise<SubtitleLibraryRecord[]> {
    try {
      const results = await window.api.db.subtitleLibrary.findAllOrderedByCreatedAt(order, limit)
      return results.map((result) => ({
        ...result,
        created_at: new Date(result.created_at)
      }))
    } catch (error) {
      logger.error('Failed to get subtitles ordered by created_at:', { error })
      return []
    }
  }

  /**
   * 删除字幕记录
   */
  async deleteSubtitle(id: number): Promise<void> {
    try {
      await window.api.db.subtitleLibrary.delete(id)
    } catch (error) {
      logger.error('Failed to delete subtitle:', { error })
      throw error
    }
  }

  /**
   * 添加带字幕数据的完整记录
   */
  async addSubtitleWithData(record: {
    videoId: number
    filePath: string
    subtitles: SubtitleItem[]
  }): Promise<SubtitleLibraryRecord> {
    try {
      const subtitleData: SubtitleLibraryInsert = {
        videoId: record.videoId,
        filePath: record.filePath,
        subtitles: JSON.stringify(record.subtitles),
        parsed_at: Date.now()
      }

      return await this.addSubtitle(subtitleData)
    } catch (error) {
      logger.error('Failed to add subtitle with data:', { error })
      throw error
    }
  }

  /**
   * 更新字幕数据
   */
  async updateSubtitlesData(id: number, subtitles: SubtitleItem[]): Promise<void> {
    try {
      await this.updateSubtitle(id, {
        subtitles: JSON.stringify(subtitles),
        parsed_at: new Date()
      })
      logger.info('Updated subtitles data:', { id, count: subtitles.length })
    } catch (error) {
      logger.error('Failed to update subtitles data:', { error })
      throw error
    }
  }

  /**
   * 获取带字幕数据的记录（优先返回有解析数据的记录）
   */
  async getSubtitleWithData(videoId: number): Promise<{
    record: SubtitleLibraryRecord
    subtitles: SubtitleItem[]
  } | null> {
    try {
      const records = await this.getSubtitlesByVideoId(videoId)

      // 优先选择有解析数据的记录
      const recordWithData = records.find((r) => r.subtitles && r.parsed_at)
      const targetRecord = recordWithData || records[0]

      if (!targetRecord) return null

      let subtitles: SubtitleItem[] = []

      // 如果有解析数据，直接使用
      if (targetRecord.subtitles) {
        try {
          subtitles = JSON.parse(targetRecord.subtitles)
        } catch (parseError) {
          logger.warn('Failed to parse stored subtitles, will need to reload from file:', {
            parseError
          })
        }
      }

      return {
        record: targetRecord,
        subtitles
      }
    } catch (error) {
      logger.error('Failed to get subtitle with data:', { error })
      return null
    }
  }
}
