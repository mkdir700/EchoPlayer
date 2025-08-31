import { z } from 'zod'

import { FilePathSchema, PositiveIntegerSchema, SqlTimestampSchema } from './transforms'

/**
 * SubtitleLibrary 表的 Zod Schema 定义
 */

/**
 * 用于插入数据库的 SubtitleLibrary Schema
 */
export const SubtitleLibraryInsertSchema = z.object({
  videoId: PositiveIntegerSchema,
  filePath: FilePathSchema,
  created_at: SqlTimestampSchema.optional()
})

/**
 * 用于更新数据库的 SubtitleLibrary Schema
 */
export const SubtitleLibraryUpdateSchema = SubtitleLibraryInsertSchema.partial()

/**
 * 从数据库查询的 SubtitleLibrary Schema
 */
export const SubtitleLibrarySelectSchema = z.object({
  id: PositiveIntegerSchema,
  videoId: PositiveIntegerSchema,
  filePath: z.string(),
  created_at: z.coerce.date()
})

/**
 * 字幕查询参数 Schema
 */
export const SubtitleLibraryQuerySchema = z.object({
  videoId: PositiveIntegerSchema.optional(),
  limit: PositiveIntegerSchema.default(50),
  offset: PositiveIntegerSchema.default(0),
  sortBy: z.enum(['created_at', 'videoId']).default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
})

// 类型导出
export type SubtitleLibraryInsert = z.infer<typeof SubtitleLibraryInsertSchema>
export type SubtitleLibraryUpdate = z.infer<typeof SubtitleLibraryUpdateSchema>
export type SubtitleLibrarySelect = z.infer<typeof SubtitleLibrarySelectSchema>
export type SubtitleLibraryQuery = z.infer<typeof SubtitleLibraryQuerySchema>
