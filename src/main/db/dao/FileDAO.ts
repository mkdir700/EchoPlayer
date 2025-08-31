import type { FileMetadataInsert, FileMetadataUpdate } from '@shared/types/database'
import type { DeleteResult, Kysely } from 'kysely'
import type { DB, FileTypes } from 'packages/shared/schema'

import {
  FileMetadataInsertSchema,
  type FileMetadataQuery,
  FileMetadataQuerySchema,
  type FileMetadataSelect,
  FileMetadataSelectSchema,
  FileMetadataUpdateSchema
} from '../schemas'
import { BaseDAO } from './BaseDAO'

/**
 * 文件数据访问对象
 * 提供类型安全的数据转换和验证
 */
export class FileDAO extends BaseDAO<
  'files',
  typeof FileMetadataSelectSchema,
  typeof FileMetadataInsertSchema,
  typeof FileMetadataUpdateSchema
> {
  constructor(db?: Kysely<DB>) {
    super('files', db)
  }

  protected getSelectSchema() {
    return FileMetadataSelectSchema
  }

  protected getInsertSchema() {
    return FileMetadataInsertSchema
  }

  protected getUpdateSchema() {
    return FileMetadataUpdateSchema
  }

  /**
   * 添加文件
   */
  async addFile(file: FileMetadataInsert): Promise<{ id: string }> {
    const validatedFile = this.parseInsertData<FileMetadataInsert>(file)

    return await this.db
      .insertInto('files')
      .values(validatedFile as any)
      .returning('id')
      .executeTakeFirstOrThrow()
  }

  /**
   * 根据路径查找文件
   */
  async findByPath(path: string): Promise<FileMetadataSelect | undefined> {
    const result = await this.db
      .selectFrom('files')
      .selectAll()
      .where('path', '=', path)
      .executeTakeFirst()

    return result ? this.parseSelectResult<FileMetadataSelect>(result) : undefined
  }

  /**
   * 根据类型获取文件列表
   */
  async findByType(type: FileTypes): Promise<FileMetadataSelect[]> {
    const results = await this.db
      .selectFrom('files')
      .selectAll()
      .where('type', '=', type)
      .orderBy('created_at', 'desc')
      .execute()

    return this.parseSelectResults<FileMetadataSelect>(results)
  }

  /**
   * 根据 ID 查找文件
   */
  async findById(id: string): Promise<FileMetadataSelect | undefined> {
    const result = await this.db
      .selectFrom('files')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst()

    return result ? this.parseSelectResult<FileMetadataSelect>(result) : undefined
  }

  /**
   * 更新文件
   */
  async updateFile(id: string, data: FileMetadataUpdate): Promise<FileMetadataSelect> {
    const validatedData = this.parseUpdateData<FileMetadataUpdate>(data)

    await this.db
      .updateTable('files')
      .set(validatedData as any)
      .where('id', '=', id)
      .executeTakeFirstOrThrow()

    const updatedRecord = await this.findById(id)
    if (!updatedRecord) {
      throw new Error('File not found')
    }
    return updatedRecord
  }

  /**
   * 删除文件
   */
  async deleteFile(id: string): Promise<DeleteResult> {
    return await this.db.deleteFrom('files').where('id', '=', id).executeTakeFirstOrThrow()
  }

  /**
   * 获取文件列表（支持查询参数）
   */
  async getFiles(params: unknown = {}): Promise<FileMetadataSelect[]> {
    const validatedParams = FileMetadataQuerySchema.parse(params) as FileMetadataQuery

    let query = this.db.selectFrom('files').selectAll()

    // 应用类型过滤
    if (validatedParams.type) {
      query = query.where('type', '=', validatedParams.type)
    }

    // 应用搜索查询
    if (validatedParams.searchQuery) {
      const searchTerm = `%${validatedParams.searchQuery}%`
      query = query.where((eb) =>
        eb.or([
          eb('name', 'like', searchTerm),
          eb('origin_name', 'like', searchTerm),
          eb('path', 'like', searchTerm)
        ])
      )
    }

    // 应用排序
    query = query.orderBy(validatedParams.sortBy, validatedParams.sortOrder)

    // 应用分页
    const results = await query
      .limit(validatedParams.limit)
      .offset(validatedParams.offset)
      .execute()

    return this.parseSelectResults<FileMetadataSelect>(results)
  }

  /**
   * 获取所有文件列表
   */
  async findAll(): Promise<FileMetadataSelect[]> {
    const results = await this.db.selectFrom('files').selectAll().execute()
    return this.parseSelectResults<FileMetadataSelect>(results)
  }

  /**
   * 清空所有文件记录
   */
  async clearAll(): Promise<DeleteResult> {
    return await this.db.deleteFrom('files').executeTakeFirstOrThrow()
  }

  /**
   * 按创建时间排序获取文件列表
   */
  async findAllOrderedByCreatedAt(
    order: 'asc' | 'desc' = 'desc',
    limit?: number
  ): Promise<FileMetadataSelect[]> {
    let query = this.db.selectFrom('files').selectAll().orderBy('created_at', order)

    if (limit) {
      query = query.limit(limit)
    }

    const results = await query.execute()
    return this.parseSelectResults<FileMetadataSelect>(results)
  }

  /**
   * 批量添加文件
   */
  async addFiles(files: FileMetadataInsert[]): Promise<void> {
    return await this.safeBatchInsert<FileMetadataInsert>(files)
  }

  /**
   * 检查文件是否存在
   */
  async fileExists(path: string): Promise<boolean> {
    return await this.recordExists({ field: 'path', value: path })
  }

  /**
   * 获取文件总数
   */
  async getTotalCount(type?: FileTypes): Promise<number> {
    const whereConditions = type ? [{ field: 'type', op: '=', value: type }] : undefined
    return await this.getRecordCount(whereConditions)
  }
}
