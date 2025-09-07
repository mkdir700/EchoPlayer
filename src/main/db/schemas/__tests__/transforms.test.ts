import { describe, expect, it } from 'vitest'

import {
  BooleanToSqlSchema,
  DataTransforms,
  SqlBooleanSchema,
  SqlTimestampSchema
} from '../transforms'

describe('DataTransforms', () => {
  describe('Boolean conversion', () => {
    it('should convert boolean to SQL format', () => {
      expect(DataTransforms.booleanToSql(true)).toBe(1)
      expect(DataTransforms.booleanToSql(false)).toBe(0)
      expect(DataTransforms.booleanToSql(undefined)).toBeUndefined()
    })

    it('should convert SQL format to boolean', () => {
      expect(DataTransforms.sqlToBoolean(1)).toBe(true)
      expect(DataTransforms.sqlToBoolean(0)).toBe(false)
      expect(DataTransforms.sqlToBoolean(undefined)).toBeUndefined()
    })
  })

  describe('Date conversion', () => {
    it('should convert Date to SQL timestamp', () => {
      const date = new Date('2024-01-01T00:00:00.000Z')
      const timestamp = DataTransforms.dateToSql(date)
      expect(timestamp).toBe(date.getTime())
    })

    it('should convert SQL timestamp to Date', () => {
      const timestamp = 1704067200000 // 2024-01-01T00:00:00.000Z
      const date = DataTransforms.sqlToDate(timestamp)
      expect(date).toEqual(new Date(timestamp))
    })

    it('should handle undefined values', () => {
      expect(DataTransforms.dateToSql(undefined)).toBeUndefined()
      expect(DataTransforms.sqlToDate(undefined)).toBeUndefined()
    })
  })

  describe('Object transformation', () => {
    it('should prepare object for insert with boolean fields', () => {
      const input = {
        id: 1,
        name: 'test',
        isActive: true,
        isDeleted: false,
        count: 5
      }

      const result = DataTransforms.prepareForInsert(input, ['isActive', 'isDeleted'])

      expect(result).toEqual({
        id: 1,
        name: 'test',
        isActive: 1,
        isDeleted: 0,
        count: 5
      })
    })

    it('should prepare object from select with boolean and date fields', () => {
      const input = {
        id: 1,
        name: 'test',
        isActive: 1,
        isDeleted: 0,
        createdAt: 1704067200000,
        count: 5
      }

      const result = DataTransforms.prepareFromSelect(
        input,
        ['isActive', 'isDeleted'],
        ['createdAt']
      )

      expect(result).toEqual({
        id: 1,
        name: 'test',
        isActive: true,
        isDeleted: false,
        createdAt: new Date(1704067200000),
        count: 5
      })
    })

    it('should handle missing fields gracefully', () => {
      const input = {
        id: 1,
        name: 'test'
      }

      const result = DataTransforms.prepareForInsert(input, [] as (keyof typeof input)[])

      expect(result).toEqual({
        id: 1,
        name: 'test'
      })
    })
  })
})

describe('Schema validation and transformation', () => {
  describe('BooleanToSqlSchema', () => {
    it('should transform boolean to number', () => {
      expect(BooleanToSqlSchema.parse(true)).toBe(1)
      expect(BooleanToSqlSchema.parse(false)).toBe(0)
    })

    it('should throw on invalid input', () => {
      expect(() => BooleanToSqlSchema.parse('invalid')).toThrow()
      expect(() => BooleanToSqlSchema.parse(2)).toThrow()
    })
  })

  describe('SqlBooleanSchema', () => {
    it('should transform various inputs to boolean', () => {
      expect(SqlBooleanSchema.parse(true)).toBe(true)
      expect(SqlBooleanSchema.parse(false)).toBe(false)
      expect(SqlBooleanSchema.parse(1)).toBe(true)
      expect(SqlBooleanSchema.parse(0)).toBe(false)
    })

    it('should throw on invalid input', () => {
      expect(() => SqlBooleanSchema.parse(2)).toThrow()
      expect(() => SqlBooleanSchema.parse('invalid')).toThrow()
    })
  })

  describe('SqlTimestampSchema', () => {
    it('should transform Date to timestamp', () => {
      const date = new Date('2024-01-01T00:00:00.000Z')
      expect(SqlTimestampSchema.parse(date)).toBe(date.getTime())
    })

    it('should pass through number timestamps', () => {
      const timestamp = 1704067200000
      expect(SqlTimestampSchema.parse(timestamp)).toBe(timestamp)
    })

    it('should transform string to timestamp', () => {
      const dateString = '2024-01-01T00:00:00.000Z'
      const expectedTimestamp = new Date(dateString).getTime()
      expect(SqlTimestampSchema.parse(dateString)).toBe(expectedTimestamp)
    })

    it('should throw on invalid date string', () => {
      expect(() => SqlTimestampSchema.parse('invalid-date')).toThrow()
    })
  })
})

describe('Integration tests', () => {
  it('should handle complex VideoLibrary-like object', () => {
    const videoRecord = {
      fileId: 'test-file-1',
      currentTime: 120.5,
      duration: 3600,
      playedAt: new Date('2024-01-01T12:00:00.000Z'),
      firstPlayedAt: new Date('2024-01-01T10:00:00.000Z'),
      playCount: 1,
      isFinished: false,
      isFavorite: true,
      thumbnailPath: '/path/to/thumbnail.jpg'
    }

    // 模拟插入转换
    const forInsert = DataTransforms.prepareForInsert(videoRecord, ['isFinished', 'isFavorite'])

    expect(forInsert.isFinished).toBe(0)
    expect(forInsert.isFavorite).toBe(1)
    expect(typeof forInsert.playedAt).toBe('object') // Date对象保持不变

    // 模拟从数据库读取的数据（已经是数字格式）
    const fromDb = {
      id: 1,
      fileId: 'test-file-1',
      currentTime: 120.5,
      duration: 3600,
      playedAt: 1704110400000,
      firstPlayedAt: 1704103200000,
      playCount: 1,
      isFinished: 0,
      isFavorite: 1,
      thumbnailPath: '/path/to/thumbnail.jpg'
    }

    // 模拟读取转换
    const fromSelect = DataTransforms.prepareFromSelect(
      fromDb,
      ['isFinished', 'isFavorite'],
      ['playedAt', 'firstPlayedAt']
    )

    expect(fromSelect.isFinished).toBe(false)
    expect(fromSelect.isFavorite).toBe(true)
    expect(fromSelect.playedAt).toBeInstanceOf(Date)
    expect(fromSelect.firstPlayedAt).toBeInstanceOf(Date)
  })

  it('should maintain data integrity in round-trip conversion', () => {
    const originalData = {
      isActive: true,
      isDeleted: false,
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      value: 42
    }

    // 转换为SQL格式
    const sqlFormat = DataTransforms.prepareForInsert(originalData, ['isActive', 'isDeleted'])
    ;(sqlFormat as any).createdAt = DataTransforms.dateToSql(sqlFormat.createdAt as Date)!

    // 从SQL格式转换回来
    const restored = DataTransforms.prepareFromSelect(
      sqlFormat,
      ['isActive', 'isDeleted'],
      ['createdAt']
    )

    expect(restored.isActive).toBe(originalData.isActive)
    expect(restored.isDeleted).toBe(originalData.isDeleted)
    expect(restored.createdAt).toEqual(originalData.createdAt)
    expect(restored.value).toBe(originalData.value)
  })
})
