import type { DeleteResult, Kysely } from 'kysely'
import type { DB } from 'packages/shared/schema'

import {
  type PlayerSettingsInsert,
  PlayerSettingsInsertSchema,
  type PlayerSettingsQuery,
  PlayerSettingsQuerySchema,
  type PlayerSettingsSelect,
  PlayerSettingsSelectSchema,
  type PlayerSettingsUpdate,
  PlayerSettingsUpdateSchema
} from '../schemas'
import { BaseDAO } from './BaseDAO'

/**
 * 播放器设置数据访问对象
 * 提供类型安全的数据转换和验证
 */
export class PlayerSettingsDAO extends BaseDAO<
  'playerSettings',
  typeof PlayerSettingsSelectSchema,
  typeof PlayerSettingsInsertSchema,
  typeof PlayerSettingsUpdateSchema
> {
  constructor(db?: Kysely<DB>) {
    super('playerSettings', db)
  }

  protected getSelectSchema() {
    return PlayerSettingsSelectSchema
  }

  protected getInsertSchema() {
    return PlayerSettingsInsertSchema
  }

  protected getUpdateSchema() {
    return PlayerSettingsUpdateSchema
  }

  /**
   * 根据视频ID获取播放器设置
   * @param videoId 视频库ID
   * @returns 播放器设置数据或undefined
   */
  async getPlayerSettingsByVideoId(videoId: number): Promise<PlayerSettingsSelect | undefined> {
    const result = await this.db
      .selectFrom('playerSettings')
      .selectAll()
      .where('videoId', '=', videoId)
      .executeTakeFirst()

    return result ? this.parseSelectResult<PlayerSettingsSelect>(result) : undefined
  }

  /**
   * 保存播放器设置（插入或更新）
   * @param videoId 视频库ID
   * @param settings 播放器设置数据
   * @returns 保存后的播放器设置数据
   */
  async savePlayerSettings(
    videoId: number,
    settings: PlayerSettingsInsert | PlayerSettingsUpdate
  ): Promise<PlayerSettingsSelect> {
    // 检查是否已存在设置
    const existing = await this.getPlayerSettingsByVideoId(videoId)

    if (existing) {
      // 更新现有设置
      const updateData = this.parseUpdateData<PlayerSettingsUpdate>({
        ...settings,
        updated_at: Math.floor(Date.now() / 1000) // Unix timestamp
      })

      await this.db
        .updateTable('playerSettings')
        .set(updateData as any)
        .where('videoId', '=', videoId)
        .executeTakeFirstOrThrow()
    } else {
      // 插入新设置
      const insertData = this.parseInsertData<PlayerSettingsInsert>({
        videoId,
        playbackRate: 1.0,
        volume: 1.0,
        muted: false,
        ...settings
      })

      await this.db
        .insertInto('playerSettings')
        .values(insertData as any)
        .executeTakeFirstOrThrow()
    }

    // 返回更新后的数据
    const result = await this.getPlayerSettingsByVideoId(videoId)
    if (!result) {
      throw new Error(`Failed to retrieve saved player settings for video ${videoId}`)
    }

    return result
  }

  /**
   * 删除播放器设置
   * @param videoId 视频库ID
   * @returns 删除结果
   */
  async deletePlayerSettings(videoId: number): Promise<DeleteResult> {
    return await this.db
      .deleteFrom('playerSettings')
      .where('videoId', '=', videoId)
      .executeTakeFirstOrThrow()
  }

  /**
   * 批量获取多个视频的播放器设置
   * @param videoIds 视频库ID数组
   * @returns 播放器设置数据数组
   */
  async getPlayerSettingsByVideoIds(videoIds: number[]): Promise<PlayerSettingsSelect[]> {
    if (videoIds.length === 0) {
      return []
    }

    const results = await this.db
      .selectFrom('playerSettings')
      .selectAll()
      .where('videoId', 'in', videoIds)
      .execute()

    return this.parseSelectResults<PlayerSettingsSelect>(results)
  }

  /**
   * 检查视频是否有播放器设置
   * @param videoId 视频库ID
   * @returns 是否存在设置
   */
  async hasPlayerSettings(videoId: number): Promise<boolean> {
    return await this.recordExists({ field: 'videoId', value: videoId })
  }

  /**
   * 获取播放器设置列表（支持查询参数）
   */
  async getPlayerSettings(params: unknown = {}): Promise<PlayerSettingsSelect[]> {
    const validatedParams = PlayerSettingsQuerySchema.parse(params) as PlayerSettingsQuery

    let query = this.db.selectFrom('playerSettings').selectAll()

    // 应用视频ID过滤
    if (validatedParams.videoIds && validatedParams.videoIds.length > 0) {
      query = query.where('videoId', 'in', validatedParams.videoIds)
    }

    // 应用分页
    const results = await query
      .limit(validatedParams.limit)
      .offset(validatedParams.offset)
      .execute()

    return this.parseSelectResults<PlayerSettingsSelect>(results)
  }

  /**
   * 获取所有播放器设置
   */
  async findAll(): Promise<PlayerSettingsSelect[]> {
    const results = await this.db.selectFrom('playerSettings').selectAll().execute()
    return this.parseSelectResults<PlayerSettingsSelect>(results)
  }

  /**
   * 清空所有播放器设置
   */
  async clearAll(): Promise<DeleteResult> {
    return await this.db.deleteFrom('playerSettings').executeTakeFirstOrThrow()
  }

  /**
   * 获取播放器设置总数
   */
  async getTotalCount(videoIds?: number[]): Promise<number> {
    const whereConditions = videoIds
      ? [{ field: 'videoId', op: 'in' as const, value: videoIds }]
      : undefined
    return await this.getRecordCount(whereConditions)
  }
}
