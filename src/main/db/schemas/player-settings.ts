import { z } from 'zod'

import {
  BooleanToSqlSchema,
  PositiveIntegerSchema,
  SqlBooleanSchema,
  SqlTimestampSchema,
  TimestampToDateSchema
} from './transforms'

/**
 * PlayerSettings 表的 Zod Schema 定义
 */

/**
 * JSON 字符串验证器
 * 验证 JSON 字符串格式并允许 null
 */
const JsonStringSchema = z
  .string()
  .refine(
    (str) => {
      try {
        JSON.parse(str)
        return true
      } catch {
        return false
      }
    },
    { message: 'Invalid JSON string' }
  )
  .nullable()

/**
 * 播放速度验证器 (0.25 - 3.0)
 */
const PlaybackRateSchema = z.number().min(0.25).max(3.0)

/**
 * 音量验证器 (0.0 - 1.0)
 */
const VolumeSchema = z.number().min(0).max(1)

/**
 * 用于插入数据库的 PlayerSettings Schema
 * 将 JavaScript 类型转换为 SQLite 兼容类型
 */
export const PlayerSettingsInsertSchema = z.object({
  videoId: PositiveIntegerSchema,
  playbackRate: PlaybackRateSchema.default(1.0),
  volume: VolumeSchema.default(1.0),
  muted: BooleanToSqlSchema.default(false),
  loopSettings: JsonStringSchema.optional(),
  autoPauseSettings: JsonStringSchema.optional(),
  subtitleOverlaySettings: JsonStringSchema.optional()
})

/**
 * 用于更新数据库的 PlayerSettings Schema
 */
export const PlayerSettingsUpdateSchema = z.object({
  playbackRate: PlaybackRateSchema.optional(),
  volume: VolumeSchema.optional(),
  muted: BooleanToSqlSchema.optional(),
  loopSettings: JsonStringSchema.optional(),
  autoPauseSettings: JsonStringSchema.optional(),
  subtitleOverlaySettings: JsonStringSchema.optional(),
  updated_at: SqlTimestampSchema.optional()
})

/**
 * 从数据库查询的 PlayerSettings Schema
 * 将 SQLite 类型转换为 JavaScript 类型
 */
export const PlayerSettingsSelectSchema = z.object({
  id: PositiveIntegerSchema,
  videoId: PositiveIntegerSchema,
  playbackRate: PlaybackRateSchema,
  volume: VolumeSchema,
  muted: SqlBooleanSchema,
  loopSettings: z.string().nullable(),
  autoPauseSettings: z.string().nullable(),
  subtitleOverlaySettings: z.string().nullable(),
  created_at: TimestampToDateSchema,
  updated_at: TimestampToDateSchema
})

/**
 * 查询参数 Schema
 */
export const PlayerSettingsQuerySchema = z.object({
  videoIds: z.array(PositiveIntegerSchema).optional(),
  limit: PositiveIntegerSchema.default(20),
  offset: PositiveIntegerSchema.default(0)
})

// 类型导出
export type PlayerSettingsInsert = z.infer<typeof PlayerSettingsInsertSchema>
export type PlayerSettingsUpdate = z.infer<typeof PlayerSettingsUpdateSchema>
export type PlayerSettingsSelect = z.infer<typeof PlayerSettingsSelectSchema>
export type PlayerSettingsQuery = z.infer<typeof PlayerSettingsQuerySchema>
