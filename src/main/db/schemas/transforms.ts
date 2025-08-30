import { z } from 'zod'

/**
 * SQLite数据转换工具
 * 处理JavaScript类型与SQLite类型之间的转换
 */

/**
 * SQLite Boolean 转换器
 * SQLite 中 boolean 以 INTEGER(0/1) 形式存储
 */
export const SqlBooleanSchema = z
  .union([z.boolean(), z.number().int().min(0).max(1), z.literal(0), z.literal(1)])
  .transform((value): boolean => {
    if (typeof value === 'boolean') {
      return value
    }
    return Boolean(value)
  })

/**
 * 用于插入数据库的 Boolean 转换器
 * 将 JavaScript boolean 转换为 SQLite INTEGER
 */
export const BooleanToSqlSchema = z.boolean().transform((value): number => {
  return value ? 1 : 0
})

/**
 * SQLite Timestamp 转换器
 * 处理 JavaScript Date 与 SQLite INTEGER(timestamp) 的转换
 */
export const SqlTimestampSchema = z
  .union([
    z.number(),
    z.date(),
    z
      .string()
      .refine((str) => !isNaN(Date.parse(str)), {
        message: 'Invalid date string'
      })
      .transform((str) => new Date(str).getTime())
  ])
  .transform((value): number => {
    if (value instanceof Date) {
      return value.getTime()
    }
    if (typeof value === 'string') {
      return new Date(value).getTime()
    }
    return Number(value)
  })

/**
 * '2025-04-28T13:27:17.126Z' -> 1745846837126
 */
export const TimestampSchema = z.coerce.date().transform((d) => d.getTime())

/**
 * 用于从数据库读取的 Timestamp 转换器
 * 将 SQLite timestamp 转换为 JavaScript Date
 */
export const TimestampToDateSchema = z.preprocess(
  (val) => {
    // 已经是 Date 直接返回
    if (val instanceof Date) return val

    // 字符串：尝试转 number
    if (typeof val === 'string') {
      const n = Number(val)
      if (!Number.isNaN(n)) return n
    }

    // number 直接用
    if (typeof val === 'number') {
      return val
    }

    return val
  },
  z.number().transform((timestamp) => new Date(timestamp))
)

/**
 * 字符串长度验证和清理
 */
export const CleanStringSchema = z
  .string()
  .min(1, '字符串不能为空')
  .transform((str) => str.trim())

/**
 * 文件路径验证
 */
export const FilePathSchema = z
  .string()
  .min(1, '文件路径不能为空')
  .transform((path) => path.trim())

/**
 * 正整数验证
 */
export const PositiveIntegerSchema = z.number().int().min(0)

/**
 * 非负数验证
 */
export const NonNegativeNumberSchema = z.number().min(0)

/**
 * 通用数据转换工具类
 */
export class DataTransforms {
  /**
   * 将 JavaScript boolean 转换为 SQLite 兼容的 number
   */
  static booleanToSql(value: boolean | undefined): number | undefined {
    if (value === undefined) return undefined
    return value ? 1 : 0
  }

  /**
   * 将 SQLite number 转换为 JavaScript boolean
   */
  static sqlToBoolean(value: number | undefined): boolean | undefined {
    if (value === undefined) return undefined
    return Boolean(value)
  }

  /**
   * 将 JavaScript Date 转换为 SQLite timestamp
   */
  static dateToSql(value: Date | undefined): number | undefined {
    if (value === undefined) return undefined
    return value.getTime()
  }

  /**
   * 将 SQLite timestamp 转换为 JavaScript Date
   */
  static sqlToDate(value: number | undefined): Date | undefined {
    if (value === undefined) return undefined
    return new Date(value)
  }

  /**
   * 批量转换对象中的 boolean 字段为 SQLite 兼容格式
   */
  static prepareForInsert<T extends Record<string, any>>(data: T, booleanFields: (keyof T)[]): T {
    const result = { ...data }

    booleanFields.forEach((field) => {
      if (field in result && typeof result[field] === 'boolean') {
        result[field] = this.booleanToSql(result[field] as boolean) as T[keyof T]
      }
    })

    return result
  }

  /**
   * 批量转换对象中的数据从 SQLite 格式为 JavaScript 格式
   */
  static prepareFromSelect<T extends Record<string, any>>(
    data: T,
    booleanFields: (keyof T)[],
    dateFields: (keyof T)[] = []
  ): T {
    const result = { ...data }

    booleanFields.forEach((field) => {
      if (field in result && typeof result[field] === 'number') {
        result[field] = this.sqlToBoolean(result[field] as number) as T[keyof T]
      }
    })

    dateFields.forEach((field) => {
      if (field in result && typeof result[field] === 'number') {
        result[field] = this.sqlToDate(result[field] as number) as T[keyof T]
      }
    })

    return result
  }
}

/**
 * 类型安全的数据转换装饰器
 */
export function withDataTransforms<T extends Record<string, any>>(schema: z.ZodSchema<T>) {
  return {
    /**
     * 验证并转换用于插入数据库的数据
     */
    forInsert: (data: unknown) => schema.parse(data),

    /**
     * 验证并转换从数据库查询的数据
     */
    fromSelect: (data: unknown) => schema.parse(data)
  }
}
