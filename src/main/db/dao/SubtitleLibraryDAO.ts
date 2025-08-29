import type { Kysely } from 'kysely'
import type { DB, SubtitleLibraryTable } from 'packages/shared/schema'

import { getKysely } from '../index'

/**
 * 字幕库数据访问对象
 */
export class SubtitleLibraryDAO {
  private db: Kysely<DB>

  constructor(db?: Kysely<DB>) {
    this.db = db || getKysely()
  }

  /**
   * 添加字幕记录
   */
  async addSubtitle(subtitle: Omit<SubtitleLibraryTable, 'id'>) {
    return await this.db
      .insertInto('subtitleLibrary')
      .values(subtitle)
      .returning('id')
      .executeTakeFirstOrThrow()
  }

  /**
   * 根据视频ID获取字幕列表
   */
  async findByVideoId(videoId: number) {
    return await this.db
      .selectFrom('subtitleLibrary')
      .selectAll()
      .where('videoId', '=', videoId)
      .orderBy('created_at', 'desc')
      .execute()
  }

  /**
   * 根据视频ID和文件路径查找字幕
   */
  async findByVideoIdAndPath(videoId: number, filePath: string) {
    return await this.db
      .selectFrom('subtitleLibrary')
      .selectAll()
      .where('videoId', '=', videoId)
      .where('filePath', '=', filePath)
      .executeTakeFirst()
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
}
