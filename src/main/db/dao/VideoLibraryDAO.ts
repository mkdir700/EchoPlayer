import type { VideoLibraryInsert, VideoLibraryUpdate } from '@shared/types/database'
import type { Kysely } from 'kysely'
import type { DB } from 'packages/shared/schema'

import {
  DataTransforms,
  VideoLibraryInsertSchema,
  type VideoLibraryQuery,
  VideoLibraryQuerySchema,
  type VideoLibrarySelect,
  VideoLibrarySelectSchema,
  VideoLibraryUpdateSchema
} from '../schemas'
import { BaseDAO } from './BaseDAO'

/**
 * 视频库数据访问对象
 * 提供类型安全的数据转换和验证
 */
export class VideoLibraryDAO extends BaseDAO<
  'videoLibrary',
  typeof VideoLibrarySelectSchema,
  typeof VideoLibraryInsertSchema,
  typeof VideoLibraryUpdateSchema
> {
  constructor(db?: Kysely<DB>) {
    super('videoLibrary', db)
  }

  protected getSelectSchema() {
    return VideoLibrarySelectSchema
  }

  protected getInsertSchema() {
    return VideoLibraryInsertSchema
  }

  protected getUpdateSchema() {
    return VideoLibraryUpdateSchema
  }

  /**
   * 添加视频记录
   */
  async addVideoRecord(record: VideoLibraryInsert): Promise<{ id: number }> {
    // 验证输入数据
    const validatedRecord = VideoLibraryInsertSchema.parse(record)

    const result = await this.db
      .insertInto('videoLibrary')
      .values(validatedRecord as any)
      .returning('id')
      .executeTakeFirstOrThrow()

    return { id: result.id }
  }

  /**
   * 根据文件ID查找视频记录
   */
  async findByFileId(fileId: string): Promise<VideoLibrarySelect | undefined> {
    const result = await this.db
      .selectFrom('videoLibrary')
      .selectAll()
      .where('fileId', '=', fileId)
      .executeTakeFirst()

    return result ? this.parseSelectResult<VideoLibrarySelect>(result) : undefined
  }

  /**
   * 获取最近播放的视频
   */
  async getRecentlyPlayed(limit = 10): Promise<VideoLibrarySelect[]> {
    const results = await this.db
      .selectFrom('videoLibrary')
      .selectAll()
      .orderBy('playedAt', 'desc')
      .limit(limit)
      .execute()

    return this.parseSelectResults<VideoLibrarySelect>(results)
  }

  /**
   * 获取收藏的视频
   */
  async getFavorites(): Promise<VideoLibrarySelect[]> {
    const results = await this.db
      .selectFrom('videoLibrary')
      .selectAll()
      .where('isFavorite', '=', 1) // 使用SQLite兼容的数值
      .orderBy('playedAt', 'desc')
      .execute()

    return this.parseSelectResults<VideoLibrarySelect>(results)
  }

  /**
   * 更新播放进度
   */
  async updatePlayProgress(videoId: number, currentTime: number, isFinished?: boolean) {
    const now = Date.now()

    const updateData: Partial<VideoLibraryUpdate> = {
      currentTime,
      playedAt: now,
      ...(isFinished !== undefined && { isFinished })
    }

    // 转换 boolean 字段为 SQLite 兼容格式
    const sqlUpdateData = DataTransforms.prepareForInsert(updateData, ['isFinished'])

    return await this.db
      .updateTable('videoLibrary')
      .set({
        ...sqlUpdateData
      } as any)
      .where('id', '=', videoId)
      .execute()
  }

  /**
   * 切换收藏状态
   */
  async toggleFavorite(videoId: number) {
    return await this.db
      .updateTable('videoLibrary')
      .set((eb) => ({
        isFavorite: eb.case().when('isFavorite', '=', 1).then(0).else(1).end() as any
      }))
      .where('id', '=', videoId)
      .execute()
  }

  /**
   * 获取视频记录列表（支持分页、排序、过滤）
   */
  async getRecords(params: unknown = {}): Promise<VideoLibrarySelect[]> {
    const validatedParams = VideoLibraryQuerySchema.parse(params) as VideoLibraryQuery

    let query = this.db.selectFrom('videoLibrary').selectAll()

    // 应用收藏过滤
    if (validatedParams.favoritesOnly) {
      query = query.where('isFavorite', '=', 1) // 使用SQLite兼容的数值
    }

    // 应用排序
    query = query.orderBy(validatedParams.sortBy, validatedParams.sortOrder)

    // 应用分页
    const results = await query
      .limit(validatedParams.limit)
      .offset(validatedParams.offset)
      .execute()

    return this.parseSelectResults<VideoLibrarySelect>(results)
  }

  /**
   * 根据 ID 获取视频记录
   */
  async findById(id: number): Promise<VideoLibrarySelect | undefined> {
    const result = await this.db
      .selectFrom('videoLibrary')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst()

    return result ? this.parseSelectResult<VideoLibrarySelect>(result) : undefined
  }

  /**
   * 更新视频记录（通用）
   */
  async updateRecord(id: number, updates: VideoLibraryUpdate) {
    // 验证更新数据
    const validatedUpdates = VideoLibraryUpdateSchema.parse(updates)

    // 转换 boolean 字段为 SQLite 兼容格式
    const sqlUpdates = DataTransforms.prepareForInsert(validatedUpdates, [
      'isFinished',
      'isFavorite'
    ])

    const result = await this.db
      .updateTable('videoLibrary')
      .set(sqlUpdates as any)
      .where('id', '=', id)
      .returning('id')
      .executeTakeFirstOrThrow()

    return this.parseSelectResult<{ id: number }>(result)
  }

  /**
   * 删除视频记录
   */
  async deleteRecord(id: number) {
    return await this.db.deleteFrom('videoLibrary').where('id', '=', id).execute()
  }

  /**
   * 批量删除视频记录
   */
  async deleteRecords(ids: number[]) {
    if (ids.length === 0) return []

    return await this.db.deleteFrom('videoLibrary').where('id', 'in', ids).execute()
  }

  /**
   * 清空所有视频记录
   */
  async clearAll() {
    return await this.db.deleteFrom('videoLibrary').execute()
  }

  /**
   * 搜索视频记录
   */
  async searchRecords(query: string, limit: number = 20): Promise<VideoLibrarySelect[]> {
    if (!query.trim()) {
      return []
    }

    const results = await this.db
      .selectFrom('videoLibrary')
      .selectAll()
      .orderBy('playedAt', 'desc')
      .limit(limit)
      .execute()

    return this.parseSelectResults<VideoLibrarySelect>(results)
  }

  /**
   * 获取最多播放次数的视频记录
   */
  async getMostPlayed(limit: number = 10): Promise<VideoLibrarySelect[]> {
    const results = await this.db
      .selectFrom('videoLibrary')
      .selectAll()
      .orderBy('playCount', 'desc')
      .limit(limit)
      .execute()

    return this.parseSelectResults<VideoLibrarySelect>(results)
  }
}
