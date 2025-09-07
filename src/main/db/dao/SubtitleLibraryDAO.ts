import type { SubtitleLibraryInsert, SubtitleLibraryUpdate } from '@shared/types/database'
import type { Kysely } from 'kysely'
import type { DB } from 'packages/shared/schema'

import {
  SubtitleLibraryInsertSchema,
  type SubtitleLibraryQuery,
  SubtitleLibraryQuerySchema,
  type SubtitleLibrarySelect,
  SubtitleLibrarySelectSchema,
  SubtitleLibraryUpdateSchema
} from '../schemas'
import { BaseDAO } from './BaseDAO'

/**
 * 字幕库数据访问对象
 * 提供类型安全的数据转换和验证
 */
export class SubtitleLibraryDAO extends BaseDAO<
  'subtitleLibrary',
  typeof SubtitleLibrarySelectSchema,
  typeof SubtitleLibraryInsertSchema,
  typeof SubtitleLibraryUpdateSchema
> {
  constructor(db?: Kysely<DB>) {
    super('subtitleLibrary', db)
  }

  protected getSelectSchema() {
    return SubtitleLibrarySelectSchema
  }

  protected getInsertSchema() {
    return SubtitleLibraryInsertSchema
  }

  protected getUpdateSchema() {
    return SubtitleLibraryUpdateSchema
  }

  /**
   * 添加字幕记录
   */
  async addSubtitle(subtitle: SubtitleLibraryInsert) {
    const validatedSubtitle = this.parseInsertData<SubtitleLibraryInsert>(subtitle)

    const result = await this.db
      .insertInto('subtitleLibrary')
      .values(validatedSubtitle as any)
      .returning('id')
      .executeTakeFirstOrThrow()

    return this.parseSelectResult<{ id: number }>(result)
  }

  /**
   * 根据视频ID获取字幕列表
   */
  async findByVideoId(videoId: number): Promise<SubtitleLibrarySelect[]> {
    const results = await this.db
      .selectFrom('subtitleLibrary')
      .selectAll()
      .where('videoId', '=', videoId)
      .orderBy('created_at', 'desc')
      .execute()

    return this.parseSelectResults<SubtitleLibrarySelect>(results)
  }

  /**
   * 根据视频ID和文件路径查找字幕
   */
  async findByVideoIdAndPath(
    videoId: number,
    filePath: string
  ): Promise<SubtitleLibrarySelect | undefined> {
    const result = await this.db
      .selectFrom('subtitleLibrary')
      .selectAll()
      .where('videoId', '=', videoId)
      .where('filePath', '=', filePath)
      .executeTakeFirst()

    return result ? this.parseSelectResult<SubtitleLibrarySelect>(result) : undefined
  }

  /**
   * 根据ID获取字幕记录
   */
  async findById(id: number): Promise<SubtitleLibrarySelect | undefined> {
    const result = await this.db
      .selectFrom('subtitleLibrary')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst()

    return result ? this.parseSelectResult<SubtitleLibrarySelect>(result) : undefined
  }

  /**
   * 更新字幕记录
   */
  async updateSubtitle(id: number, updates: SubtitleLibraryUpdate) {
    const validatedUpdates = this.parseUpdateData<SubtitleLibraryUpdate>(updates)

    return await this.db
      .updateTable('subtitleLibrary')
      .set(validatedUpdates as any)
      .where('id', '=', id)
      .executeTakeFirstOrThrow()
  }

  /**
   * 获取所有字幕记录
   */
  async findAll(): Promise<SubtitleLibrarySelect[]> {
    const results = await this.db.selectFrom('subtitleLibrary').selectAll().execute()
    return this.parseSelectResults<SubtitleLibrarySelect>(results)
  }

  /**
   * 清空所有字幕记录
   */
  async clearAll() {
    return await this.db.deleteFrom('subtitleLibrary').executeTakeFirstOrThrow()
  }

  /**
   * 按创建时间排序获取字幕记录
   */
  async findAllOrderedByCreatedAt(
    order: 'asc' | 'desc' = 'desc',
    limit?: number
  ): Promise<SubtitleLibrarySelect[]> {
    let query = this.db.selectFrom('subtitleLibrary').selectAll().orderBy('created_at', order)

    if (limit) {
      query = query.limit(limit)
    }

    const results = await query.execute()
    return this.parseSelectResults<SubtitleLibrarySelect>(results)
  }

  /**
   * 删除字幕记录
   */
  async deleteSubtitle(id: number) {
    return await this.db
      .deleteFrom('subtitleLibrary')
      .where('id', '=', id)
      .executeTakeFirstOrThrow()
  }

  /**
   * 获取字幕记录列表（支持查询参数）
   */
  async getSubtitles(params: unknown = {}): Promise<SubtitleLibrarySelect[]> {
    const validatedParams = SubtitleLibraryQuerySchema.parse(params) as SubtitleLibraryQuery

    let query = this.db.selectFrom('subtitleLibrary').selectAll()

    // 应用视频ID过滤
    if (validatedParams.videoId) {
      query = query.where('videoId', '=', validatedParams.videoId)
    }

    // 应用排序
    query = query.orderBy(validatedParams.sortBy, validatedParams.sortOrder)

    // 应用分页
    const results = await query
      .limit(validatedParams.limit)
      .offset(validatedParams.offset)
      .execute()

    return this.parseSelectResults<SubtitleLibrarySelect>(results)
  }

  /**
   * 批量添加字幕记录
   */
  async addSubtitles(subtitles: SubtitleLibraryInsert[]): Promise<void> {
    return await this.safeBatchInsert<SubtitleLibraryInsert>(subtitles)
  }

  /**
   * 根据视频ID删除所有字幕
   */
  async deleteByVideoId(videoId: number) {
    return await this.db.deleteFrom('subtitleLibrary').where('videoId', '=', videoId).execute()
  }

  /**
   * 获取字幕总数
   */
  async getTotalCount(videoId?: number): Promise<number> {
    const whereCondition = videoId ? { field: 'videoId', value: videoId } : undefined
    return await this.getRecordCount(whereCondition)
  }
}
