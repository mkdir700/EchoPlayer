import { loggerService } from '@main/services/LoggerService'
import type { Kysely } from 'kysely'
import type { DB } from 'packages/shared/schema'
import { z } from 'zod'

import { getKysely } from '../index'

const logger = loggerService.withContext('BaseDAO')

/**
 * DAO基类，提供统一的数据转换和验证功能
 */
export abstract class BaseDAO<
  TTable extends keyof DB,
  TSelect extends z.ZodSchema = z.ZodSchema,
  TInsert extends z.ZodSchema = z.ZodSchema,
  TUpdate extends z.ZodSchema = z.ZodSchema
> {
  protected db: Kysely<DB>
  protected tableName: TTable

  constructor(tableName: TTable, db?: Kysely<DB>) {
    this.db = db || getKysely()
    this.tableName = tableName
  }

  /**
   * 获取用于验证和转换查询结果的Schema
   */
  protected abstract getSelectSchema(): TSelect

  /**
   * 获取用于验证和转换插入数据的Schema
   */
  protected abstract getInsertSchema(): TInsert

  /**
   * 获取用于验证和转换更新数据的Schema
   */
  protected abstract getUpdateSchema(): TUpdate

  /**
   * 安全地解析和转换从数据库查询的数据
   */
  protected parseSelectResult<T>(data: unknown): T {
    try {
      return this.getSelectSchema().parse(data) as T
    } catch (error) {
      logger.error(`Failed to parse select result for table ${String(this.tableName)}:`, { error })
      throw new Error(`数据格式验证失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  /**
   * 安全地解析和转换用于插入的数据
   */
  protected parseInsertData<T>(data: unknown): T {
    try {
      return this.getInsertSchema().parse(data) as T
    } catch (error) {
      logger.error(`Failed to parse insert data for table ${String(this.tableName)}:`, { error })
      throw new Error(`插入数据验证失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  /**
   * 安全地解析和转换用于更新的数据
   */
  protected parseUpdateData<T>(data: unknown): T {
    try {
      return this.getUpdateSchema().parse(data) as T
    } catch (error) {
      logger.error(`Failed to parse update data for table ${String(this.tableName)}:`, { error })
      throw new Error(`更新数据验证失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  /**
   * 批量解析查询结果
   */
  protected parseSelectResults<T>(data: unknown[]): T[] {
    return data.map((item) => this.parseSelectResult<T>(item))
  }

  /**
   * 处理数据库操作错误
   */
  protected handleDatabaseError(error: unknown, operation: string): never {
    logger.error(`Database ${operation} error on table ${String(this.tableName)}:`, { error })

    if (error instanceof Error) {
      // 检查是否是约束违反错误
      if (error.message.includes('UNIQUE constraint')) {
        throw new Error(`数据已存在，无法${operation}`)
      }
      if (error.message.includes('FOREIGN KEY constraint')) {
        throw new Error(`关联数据不存在，无法${operation}`)
      }
      if (error.message.includes('NOT NULL constraint')) {
        throw new Error(`必填字段缺失，无法${operation}`)
      }

      throw new Error(`${operation}操作失败: ${error.message}`)
    }

    throw new Error(`${operation}操作失败: 未知错误`)
  }

  /**
   * 检查记录是否存在
   */
  protected async recordExists(whereClause: { field: string; value: any }): Promise<boolean> {
    try {
      const result = await this.db
        .selectFrom(this.tableName)
        .select(['1 as exists'])
        .where(whereClause.field as any, '=', whereClause.value)
        .limit(1)
        .executeTakeFirst()

      return !!result
    } catch (error) {
      logger.error(`Failed to check record existence in table ${String(this.tableName)}:`, {
        error
      })
      return false
    }
  }

  /**
   * 获取记录总数
   */
  protected async getRecordCount(
    whereConditions?: Array<{ field: string; op: string; value: any }>
  ): Promise<number> {
    try {
      let query = this.db.selectFrom(this.tableName).select((eb) => eb.fn.count('id').as('count'))

      // 应用where条件
      if (whereConditions) {
        whereConditions.forEach((condition) => {
          query = query.where(condition.field as any, condition.op as any, condition.value)
        })
      }

      const result = await query.executeTakeFirst()
      return Number(result?.count || 0)
    } catch (error) {
      logger.error(`Failed to get record count for table ${String(this.tableName)}:`, { error })
      return 0
    }
  }

  /**
   * 批量插入数据（带验证）
   */
  protected async safeBatchInsert<TInsertType>(records: unknown[], batchSize = 100): Promise<void> {
    if (records.length === 0) return

    // 验证所有记录
    const validatedRecords = records.map((record) => this.parseInsertData<TInsertType>(record))

    // 分批处理
    for (let i = 0; i < validatedRecords.length; i += batchSize) {
      const batch = validatedRecords.slice(i, i + batchSize)

      await this.safeExecute(async () => {
        await this.db
          .insertInto(this.tableName)
          .values(batch as any[])
          .execute()
      }, '批量插入')
    }
  }

  /**
   * 获取数据库连接状态
   */
  protected async isDatabaseConnected(): Promise<boolean> {
    try {
      // 使用一个通用的查询来测试数据库连接
      await this.db.selectFrom('files').select('id').limit(1).execute()
      return true
    } catch {
      return false
    }
  }
}
