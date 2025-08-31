import { z } from 'zod'

import {
  CleanStringSchema,
  FilePathSchema,
  PositiveIntegerSchema,
  TimestampSchema,
  TimestampToDateSchema
} from './transforms'

/**
 * FileMetadata 表的 Zod Schema 定义
 */

/**
 * 文件类型枚举
 */
export const FileTypesSchema = z.enum(['video', 'audio', 'subtitle', 'image', 'other'])

/**
 * 用于插入数据库的 FileMetadata Schema
 */
export const FileMetadataInsertSchema = z.object({
  id: CleanStringSchema,
  name: CleanStringSchema,
  origin_name: CleanStringSchema,
  path: FilePathSchema,
  size: PositiveIntegerSchema,
  ext: CleanStringSchema,
  type: FileTypesSchema,
  created_at: TimestampSchema
})

/**
 * 用于更新数据库的 FileMetadata Schema
 */
export const FileMetadataUpdateSchema = FileMetadataInsertSchema.partial()

/**
 * 从数据库查询的 FileMetadata Schema
 */
export const FileMetadataSelectSchema = z.object({
  id: z.string(),
  name: z.string(),
  origin_name: z.string(),
  path: z.string(),
  size: PositiveIntegerSchema,
  ext: z.string(),
  type: FileTypesSchema,
  created_at: TimestampToDateSchema
})

/**
 * 文件查询参数 Schema
 */
export const FileMetadataQuerySchema = z.object({
  type: FileTypesSchema.optional(),
  limit: PositiveIntegerSchema.default(50),
  offset: PositiveIntegerSchema.default(0),
  sortBy: z.enum(['name', 'size', 'created_at', 'type']).default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  searchQuery: z.string().optional()
})

// 类型导出
export type FileTypes = z.infer<typeof FileTypesSchema>
export type FileMetadataInsert = z.infer<typeof FileMetadataInsertSchema>
export type FileMetadataUpdate = z.infer<typeof FileMetadataUpdateSchema>
export type FileMetadataSelect = z.infer<typeof FileMetadataSelectSchema>
export type FileMetadataQuery = z.infer<typeof FileMetadataQuerySchema>
