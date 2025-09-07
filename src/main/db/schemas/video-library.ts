import { z } from 'zod'

import {
  BooleanToSqlSchema,
  CleanStringSchema,
  NonNegativeNumberSchema,
  PositiveIntegerSchema,
  SqlBooleanSchema,
  SqlTimestampSchema
} from './transforms'

/**
 * VideoLibrary 表的 Zod Schema 定义
 */

/**
 * 用于插入数据库的 VideoLibrary Schema
 * 将 JavaScript 类型转换为 SQLite 兼容类型
 */
export const VideoLibraryInsertSchema = z.object({
  fileId: CleanStringSchema,
  currentTime: NonNegativeNumberSchema.default(0),
  duration: NonNegativeNumberSchema.default(0),
  playedAt: SqlTimestampSchema,
  firstPlayedAt: SqlTimestampSchema,
  playCount: PositiveIntegerSchema.default(0),
  isFinished: BooleanToSqlSchema.default(false),
  isFavorite: BooleanToSqlSchema.default(false),
  thumbnailPath: z.string().nullable().optional()
})

/**
 * 用于更新数据库的 VideoLibrary Schema
 */
export const VideoLibraryUpdateSchema = z.object({
  fileId: CleanStringSchema.optional(),
  currentTime: NonNegativeNumberSchema.optional(),
  duration: NonNegativeNumberSchema.optional(),
  playedAt: SqlTimestampSchema.optional(),
  firstPlayedAt: SqlTimestampSchema.optional(),
  playCount: PositiveIntegerSchema.optional(),
  isFinished: BooleanToSqlSchema.optional(),
  isFavorite: BooleanToSqlSchema.optional(),
  thumbnailPath: z.string().nullable().optional()
})

/**
 * 从数据库查询的 VideoLibrary Schema
 * 将 SQLite 类型转换为 JavaScript 类型
 */
export const VideoLibrarySelectSchema = z.object({
  id: PositiveIntegerSchema,
  fileId: z.string(),
  currentTime: NonNegativeNumberSchema,
  duration: NonNegativeNumberSchema,
  playedAt: z.number(),
  firstPlayedAt: z.number(),
  playCount: PositiveIntegerSchema,
  isFinished: SqlBooleanSchema,
  isFavorite: SqlBooleanSchema,
  thumbnailPath: z.string().nullable()
})

/**
 * 播放进度更新 Schema
 */
export const PlayProgressUpdateSchema = z.object({
  currentTime: NonNegativeNumberSchema,
  isFinished: z
    .boolean()
    .optional()
    .transform((val) => (val !== undefined ? (val ? 1 : 0) : undefined))
})

/**
 * 查询参数 Schema
 */
export const VideoLibraryQuerySchema = z.object({
  limit: PositiveIntegerSchema.default(20),
  offset: PositiveIntegerSchema.default(0),
  sortBy: z.enum(['playedAt', 'playCount', 'firstPlayedAt', 'duration']).default('playedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  favoritesOnly: z.boolean().default(false),
  searchQuery: z.string().optional()
})

// 类型导出
export type VideoLibraryInsert = z.infer<typeof VideoLibraryInsertSchema>
export type VideoLibraryUpdate = z.infer<typeof VideoLibraryUpdateSchema>
export type VideoLibrarySelect = z.infer<typeof VideoLibrarySelectSchema>
export type PlayProgressUpdate = z.infer<typeof PlayProgressUpdateSchema>
export type VideoLibraryQuery = z.infer<typeof VideoLibraryQuerySchema>
