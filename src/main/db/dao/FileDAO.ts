import type { Insertable, Kysely } from 'kysely'
import type { DB, FileMetadataTable, FileTypes } from 'packages/shared/schema'

import { getKysely } from '../index'

/**
 * 文件数据访问对象
 */
export class FileDAO {
  private db: Kysely<DB>

  constructor(db?: Kysely<DB>) {
    this.db = db || getKysely()
  }

  /**
   * 添加文件
   */
  async addFile(file: Insertable<FileMetadataTable>) {
    return await this.db.insertInto('files').values(file).returning('id').executeTakeFirstOrThrow()
  }

  /**
   * 根据路径查找文件
   */
  async findByPath(path: string) {
    return await this.db.selectFrom('files').selectAll().where('path', '=', path).executeTakeFirst()
  }

  /**
   * 根据类型获取文件列表
   */
  async findByType(type: FileTypes) {
    return await this.db
      .selectFrom('files')
      .selectAll()
      .where('type', '=', type)
      .orderBy('created_at', 'desc')
      .execute()
  }

  /**
   * 删除文件
   */
  async deleteFile(id: number) {
    return await this.db.deleteFrom('files').where('id', '=', id).executeTakeFirstOrThrow()
  }
}
