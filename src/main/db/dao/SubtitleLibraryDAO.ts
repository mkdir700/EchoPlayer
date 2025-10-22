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

    // 对于仅返回 id 的结果，直接返回不需要 schema 验证
    return result as { id: number }
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

  /**
   * 获取视频的所有字幕项（解析 JSON 后返回）
   */
  async getSubtitlesByVideoId(videoId: number): Promise<
    Array<{
      id: string
      text: string
      startTime: number
      endTime: number
      translatedText?: string
    }>
  > {
    const subtitleRecords = await this.findByVideoId(videoId)
    const allSubtitles: Array<{
      id: string
      text: string
      startTime: number
      endTime: number
      translatedText?: string
    }> = []

    for (const record of subtitleRecords) {
      if (record.subtitles) {
        try {
          const subtitles = JSON.parse(record.subtitles) as Array<{
            id: string
            text: string
            startTime: number
            endTime: number
            translatedText?: string
          }>
          allSubtitles.push(...subtitles)
        } catch (error) {
          // JSON 解析失败，跳过此记录
        }
      }
    }

    return allSubtitles
  }

  /**
   * 更新单个字幕的翻译文本
   */
  async updateSubtitleTranslation(subtitleId: string, translatedText: string): Promise<boolean> {
    try {
      // 查找包含该字幕的记录
      const allRecords = await this.findAll()

      for (const record of allRecords) {
        if (record.subtitles) {
          try {
            const subtitles = JSON.parse(record.subtitles) as Array<{
              id: string
              text: string
              startTime: number
              endTime: number
              translatedText?: string
            }>

            // 查找并更新对应的字幕
            const subtitleIndex = subtitles.findIndex((sub) => sub.id === subtitleId)
            if (subtitleIndex !== -1) {
              subtitles[subtitleIndex].translatedText = translatedText

              // 更新数据库记录
              await this.updateSubtitle(record.id, {
                subtitles: JSON.stringify(subtitles)
              })

              return true
            }
          } catch (error) {
            // JSON 解析失败，跳过此记录
          }
        }
      }

      return false
    } catch (error) {
      return false
    }
  }

  /**
   * 批量更新字幕翻译文本
   */
  async updateSubtitleTranslations(
    translations: Array<{
      subtitleId: string
      translatedText: string
    }>
  ): Promise<{
    successCount: number
    failureCount: number
    errors: string[]
  }> {
    const result = {
      successCount: 0,
      failureCount: 0,
      errors: [] as string[]
    }

    // 跟踪每个 subtitleId 的处理状态
    const processedSubtitleIds = new Set<string>()
    const failedSubtitleIds = new Set<string>()

    try {
      // 获取所有字幕记录
      const allRecords = await this.findAll()

      // 按 subtitleId 对翻译进行分组，以提高效率
      const translationsByRecord = new Map<
        number,
        Array<{
          subtitleId: string
          translatedText: string
        }>
      >()

      // 将翻译分配到对应的记录
      for (const record of allRecords) {
        if (record.subtitles) {
          try {
            const subtitles = JSON.parse(record.subtitles) as Array<{
              id: string
              text: string
              startTime: number
              endTime: number
              translatedText?: string
            }>

            const matchingTranslations = translations.filter((translation) =>
              subtitles.some((subtitle) => subtitle.id === translation.subtitleId)
            )

            if (matchingTranslations.length > 0) {
              translationsByRecord.set(record.id, matchingTranslations)
              // 标记这些翻译项为已处理（无论成功失败）
              matchingTranslations.forEach((translation) => {
                processedSubtitleIds.add(translation.subtitleId)
              })
            }
          } catch (error) {
            result.errors.push(`Failed to parse subtitles JSON for record ${record.id}: ${error}`)
            // 计算该记录中受影响的翻译项数量
            const affectedTranslations = translations.filter((translation) => {
              try {
                const subtitles = JSON.parse(record.subtitles!)
                return subtitles.some((subtitle: any) => subtitle.id === translation.subtitleId)
              } catch {
                return false // 如果无法解析，无法确定具体哪些翻译项受影响
              }
            })
            affectedTranslations.forEach((translation) => {
              failedSubtitleIds.add(translation.subtitleId)
              processedSubtitleIds.add(translation.subtitleId)
            })
          }
        }
      }

      // 批量更新每个记录
      for (const [recordId, recordTranslations] of translationsByRecord) {
        try {
          const record = allRecords.find((r) => r.id === recordId)
          if (record && record.subtitles) {
            const subtitles = JSON.parse(record.subtitles) as Array<{
              id: string
              text: string
              startTime: number
              endTime: number
              translatedText?: string
            }>

            // 更新匹配的字幕翻译
            let updatedCount = 0
            const recordFailedTranslations: string[] = []

            for (const translation of recordTranslations) {
              const subtitleIndex = subtitles.findIndex((sub) => sub.id === translation.subtitleId)
              if (subtitleIndex !== -1) {
                subtitles[subtitleIndex].translatedText = translation.translatedText
                updatedCount++
                // 从失败列表中移除（如果之前因为JSON解析失败而被标记为失败）
                failedSubtitleIds.delete(translation.subtitleId)
              } else {
                // 如果在记录中找不到对应的字幕，标记为失败
                recordFailedTranslations.push(translation.subtitleId)
                failedSubtitleIds.add(translation.subtitleId)
              }
            }

            // 如果有更新，保存到数据库
            if (updatedCount > 0) {
              await this.updateSubtitle(recordId, {
                subtitles: JSON.stringify(subtitles)
              })
              result.successCount += updatedCount
            }

            // 记录找不到对应字幕的错误
            if (recordFailedTranslations.length > 0) {
              result.errors.push(
                `Subtitle IDs not found in record ${recordId}: ${recordFailedTranslations.join(', ')}`
              )
            }
          }
        } catch (error) {
          result.errors.push(`Failed to update record ${recordId}: ${error}`)
          // 将该记录的所有翻译项标记为失败
          recordTranslations.forEach((translation) => {
            failedSubtitleIds.add(translation.subtitleId)
          })
        }
      }

      // 计算最终失败数量（基于失败的字幕ID而非记录数）
      result.failureCount = failedSubtitleIds.size

      // 检查是否有未被处理的翻译项（这些翻译对应的subtitleId在所有记录中都找不到）
      const unprocessedTranslations = translations.filter(
        (translation) => !processedSubtitleIds.has(translation.subtitleId)
      )
      if (unprocessedTranslations.length > 0) {
        result.failureCount += unprocessedTranslations.length
        result.errors.push(
          `Subtitle IDs not found in any record: ${unprocessedTranslations.map((t) => t.subtitleId).join(', ')}`
        )
      }

      return result
    } catch (error) {
      result.errors.push(`Batch update failed: ${error}`)
      // 只有在完全没有处理任何翻译时才将全部计入失败
      if (processedSubtitleIds.size === 0) {
        result.failureCount = translations.length
      } else {
        // 否则保持当前的失败计数
        result.failureCount =
          failedSubtitleIds.size +
          translations.filter((t) => !processedSubtitleIds.has(t.subtitleId)).length
      }
      return result
    }
  }
}
