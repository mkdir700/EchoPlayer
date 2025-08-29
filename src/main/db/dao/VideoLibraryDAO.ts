import type { Kysely } from 'kysely'
import type { DB, VideoLibraryTable } from 'packages/shared/schema'

import { getKysely } from '../index'

/**
 * 视频库数据访问对象
 */
export class VideoLibraryDAO {
  private db: Kysely<DB>

  constructor(db?: Kysely<DB>) {
    this.db = db || getKysely()
  }

  /**
   * 添加或更新视频记录
   */
  async upsertVideoRecord(record: Omit<VideoLibraryTable, 'id'>) {
    const existing = await this.findByFileId(record.fileId)

    if (existing) {
      return await this.db
        .updateTable('videoLibrary')
        .set(record)
        .where('fileId', '=', record.fileId)
        .returning('id')
        .executeTakeFirstOrThrow()
    } else {
      return await this.db
        .insertInto('videoLibrary')
        .values(record)
        .returning('id')
        .executeTakeFirstOrThrow()
    }
  }

  /**
   * 根据文件ID查找视频记录
   */
  async findByFileId(fileId: string) {
    return await this.db
      .selectFrom('videoLibrary')
      .selectAll()
      .where('fileId', '=', fileId)
      .executeTakeFirst()
  }

  /**
   * 获取最近播放的视频
   */
  async getRecentlyPlayed(limit = 10) {
    return await this.db
      .selectFrom('videoLibrary')
      .selectAll()
      .orderBy('playedAt', 'desc')
      .limit(limit)
      .execute()
  }

  /**
   * 获取收藏的视频
   */
  async getFavorites() {
    return await this.db
      .selectFrom('videoLibrary')
      .selectAll()
      .where('isFavorite', '=', true)
      .orderBy('playedAt', 'desc')
      .execute()
  }

  /**
   * 更新播放进度
   */
  async updatePlayProgress(fileId: string, currentTime: number, isFinished?: boolean) {
    const now = Date.now()

    return await this.db
      .updateTable('videoLibrary')
      .set({
        currentTime,
        playedAt: now,
        ...(isFinished !== undefined && { isFinished }),
        playCount: this.db
          .selectFrom('videoLibrary')
          .select((eb) => eb('playCount', '+', 1).as('newCount'))
          .where('fileId', '=', fileId)
          .limit(1) as any
      })
      .where('fileId', '=', fileId)
      .execute()
  }

  /**
   * 切换收藏状态
   */
  async toggleFavorite(fileId: string) {
    return await this.db
      .updateTable('videoLibrary')
      .set((eb) => ({
        isFavorite: eb.case().when('isFavorite', '=', true).then(false).else(true).end()
      }))
      .where('fileId', '=', fileId)
      .execute()
  }
}
