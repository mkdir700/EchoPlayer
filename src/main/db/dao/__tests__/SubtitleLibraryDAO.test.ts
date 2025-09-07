import type { Kysely } from 'kysely'
import type { DB, SubtitleLibraryTable } from 'packages/shared/schema'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import * as dbIndex from '../../index'
import { SubtitleLibraryDAO } from '../SubtitleLibraryDAO'

// Mock getKysely
vi.mock('../../index')

describe('SubtitleLibraryDAO', () => {
  let dao: SubtitleLibraryDAO
  let mockKysely: any

  // Mock data for database insertion (uses number timestamp)
  const mockSubtitleRecordFromDB: Omit<SubtitleLibraryTable, 'id' | 'created_at'> & {
    created_at: number
  } = {
    videoId: 1,
    filePath: '/path/to/subtitle.srt',
    created_at: 1704110400000 // Fixed timestamp: 2024-01-01T12:00:00.000Z
  }

  // Mock data for insertion (will be converted to number by schema)
  const mockSubtitleRecordForInsert: Omit<SubtitleLibraryTable, 'id' | 'created_at'> & {
    created_at: number
  } = {
    videoId: 1,
    filePath: '/path/to/subtitle.srt',
    created_at: 1704110400000 // Number timestamp for insertion
  }

  // Expected data after schema transformation (number converted to Date)
  const mockSubtitleRecordExpected: Omit<SubtitleLibraryTable, 'id' | 'created_at'> & {
    created_at: Date
  } = {
    videoId: 1,
    filePath: '/path/to/subtitle.srt',
    created_at: new Date('2024-01-01T12:00:00.000Z')
  }

  beforeEach(() => {
    // Create mock query builder
    mockKysely = {
      insertInto: vi.fn().mockReturnThis(),
      selectFrom: vi.fn().mockReturnThis(),
      deleteFrom: vi.fn().mockReturnThis(),
      values: vi.fn().mockReturnThis(),
      selectAll: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      returning: vi.fn().mockReturnThis(),
      execute: vi.fn(),
      executeTakeFirst: vi.fn(),
      executeTakeFirstOrThrow: vi.fn()
    }

    vi.mocked(dbIndex.getKysely).mockReturnValue(mockKysely)
    dao = new SubtitleLibraryDAO()
    vi.clearAllMocks()
  })

  describe('constructor', () => {
    it('应该使用提供的数据库实例', () => {
      const customKysely = {} as Kysely<DB>
      const customDao = new SubtitleLibraryDAO(customKysely)

      expect(customDao).toBeInstanceOf(SubtitleLibraryDAO)
    })

    it('应该使用默认数据库实例', () => {
      const defaultDao = new SubtitleLibraryDAO()

      expect(dbIndex.getKysely).toHaveBeenCalledTimes(1)
      expect(defaultDao).toBeInstanceOf(SubtitleLibraryDAO)
    })
  })

  describe('addSubtitle', () => {
    it('应该成功添加字幕记录', async () => {
      const mockResult = { id: 1 }
      mockKysely.executeTakeFirstOrThrow.mockResolvedValue(mockResult)

      const result = await dao.addSubtitle(mockSubtitleRecordForInsert as any)

      expect(mockKysely.insertInto).toHaveBeenCalledWith('subtitleLibrary')
      expect(mockKysely.values).toHaveBeenCalledWith(mockSubtitleRecordForInsert)
      expect(mockKysely.returning).toHaveBeenCalledWith('id')
      expect(mockKysely.executeTakeFirstOrThrow).toHaveBeenCalledTimes(1)
      expect(result).toEqual(mockResult)
    })

    it('应该处理添加失败', async () => {
      const error = new Error('Insert failed')
      mockKysely.executeTakeFirstOrThrow.mockRejectedValue(error)

      await expect(dao.addSubtitle(mockSubtitleRecordForInsert as any)).rejects.toThrow(
        'Insert failed'
      )
    })

    it('应该验证链式调用顺序', async () => {
      const calls: string[] = []
      mockKysely.insertInto.mockImplementation(() => {
        calls.push('insertInto')
        return mockKysely
      })
      mockKysely.values.mockImplementation(() => {
        calls.push('values')
        return mockKysely
      })
      mockKysely.returning.mockImplementation(() => {
        calls.push('returning')
        return mockKysely
      })
      mockKysely.executeTakeFirstOrThrow.mockImplementation(() => {
        calls.push('executeTakeFirstOrThrow')
        return Promise.resolve({ id: 1 })
      })

      await dao.addSubtitle(mockSubtitleRecordForInsert as any)

      expect(calls).toEqual(['insertInto', 'values', 'returning', 'executeTakeFirstOrThrow'])
    })
  })

  describe('findByVideoId', () => {
    it('应该根据视频ID查找字幕列表', async () => {
      // Mock database returns number format
      const mockDBResults = [
        { id: 1, ...mockSubtitleRecordFromDB },
        { id: 2, ...mockSubtitleRecordFromDB, filePath: '/path/to/subtitle2.srt' }
      ]
      mockKysely.execute.mockResolvedValue(mockDBResults)

      // Expected results after schema transformation
      const expectedResults = [
        { id: 1, ...mockSubtitleRecordExpected },
        { id: 2, ...mockSubtitleRecordExpected, filePath: '/path/to/subtitle2.srt' }
      ]

      const result = await dao.findByVideoId(1)

      expect(mockKysely.selectFrom).toHaveBeenCalledWith('subtitleLibrary')
      expect(mockKysely.selectAll).toHaveBeenCalledTimes(1)
      expect(mockKysely.where).toHaveBeenCalledWith('videoId', '=', 1)
      expect(mockKysely.orderBy).toHaveBeenCalledWith('created_at', 'desc')
      expect(mockKysely.execute).toHaveBeenCalledTimes(1)
      expect(result).toEqual(expectedResults)
    })

    it('应该返回空数组如果没有字幕', async () => {
      mockKysely.execute.mockResolvedValue([])

      const result = await dao.findByVideoId(999)

      expect(result).toEqual([])
    })

    it('应该处理不同的视频ID', async () => {
      mockKysely.execute.mockResolvedValue([])

      await dao.findByVideoId(5)
      expect(mockKysely.where).toHaveBeenCalledWith('videoId', '=', 5)

      await dao.findByVideoId(100)
      expect(mockKysely.where).toHaveBeenCalledWith('videoId', '=', 100)
    })

    it('应该按创建时间降序排序', async () => {
      mockKysely.execute.mockResolvedValue([])

      await dao.findByVideoId(1)

      expect(mockKysely.orderBy).toHaveBeenCalledWith('created_at', 'desc')
    })

    it('应该处理查询错误', async () => {
      const error = new Error('Query failed')
      mockKysely.execute.mockRejectedValue(error)

      await expect(dao.findByVideoId(1)).rejects.toThrow('Query failed')
    })
  })

  describe('findByVideoIdAndPath', () => {
    it('应该根据视频ID和文件路径查找字幕', async () => {
      // Mock database returns number format
      const mockDBResult = { id: 1, ...mockSubtitleRecordFromDB }
      mockKysely.executeTakeFirst.mockResolvedValue(mockDBResult)

      // Expected result after schema transformation
      const expectedResult = { id: 1, ...mockSubtitleRecordExpected }

      const result = await dao.findByVideoIdAndPath(1, '/path/to/subtitle.srt')

      expect(mockKysely.selectFrom).toHaveBeenCalledWith('subtitleLibrary')
      expect(mockKysely.selectAll).toHaveBeenCalledTimes(1)
      expect(mockKysely.where).toHaveBeenCalledWith('videoId', '=', 1)
      expect(mockKysely.where).toHaveBeenCalledWith('filePath', '=', '/path/to/subtitle.srt')
      expect(mockKysely.executeTakeFirst).toHaveBeenCalledTimes(1)
      expect(result).toEqual(expectedResult)
    })

    it('应该返回undefined如果字幕不存在', async () => {
      mockKysely.executeTakeFirst.mockResolvedValue(undefined)

      const result = await dao.findByVideoIdAndPath(1, '/nonexistent/path.srt')

      expect(result).toBeUndefined()
    })

    it('应该验证WHERE条件的调用顺序', async () => {
      const whereCalls: Array<[string, string, any]> = []
      mockKysely.where.mockImplementation((column, op, value) => {
        whereCalls.push([column, op, value])
        return mockKysely
      })
      mockKysely.executeTakeFirst.mockResolvedValue(undefined)

      await dao.findByVideoIdAndPath(1, '/path/to/subtitle.srt')

      expect(whereCalls).toEqual([
        ['videoId', '=', 1],
        ['filePath', '=', '/path/to/subtitle.srt']
      ])
    })

    it('应该处理查询错误', async () => {
      const error = new Error('Query failed')
      mockKysely.executeTakeFirst.mockRejectedValue(error)

      await expect(dao.findByVideoIdAndPath(1, '/path/to/subtitle.srt')).rejects.toThrow(
        'Query failed'
      )
    })
  })

  describe('deleteSubtitle', () => {
    it('应该成功删除字幕记录', async () => {
      const mockResult = { numDeletedRows: 1 }
      mockKysely.executeTakeFirstOrThrow.mockResolvedValue(mockResult)

      const result = await dao.deleteSubtitle(1)

      expect(mockKysely.deleteFrom).toHaveBeenCalledWith('subtitleLibrary')
      expect(mockKysely.where).toHaveBeenCalledWith('id', '=', 1)
      expect(mockKysely.executeTakeFirstOrThrow).toHaveBeenCalledTimes(1)
      expect(result).toEqual(mockResult)
    })

    it('应该处理删除不存在的字幕', async () => {
      const error = new Error('Subtitle not found')
      mockKysely.executeTakeFirstOrThrow.mockRejectedValue(error)

      await expect(dao.deleteSubtitle(999)).rejects.toThrow('Subtitle not found')
    })

    it('应该处理删除错误', async () => {
      const error = new Error('Delete failed')
      mockKysely.executeTakeFirstOrThrow.mockRejectedValue(error)

      await expect(dao.deleteSubtitle(1)).rejects.toThrow('Delete failed')
    })

    it('应该验证删除操作的链式调用', async () => {
      const calls: string[] = []
      mockKysely.deleteFrom.mockImplementation(() => {
        calls.push('deleteFrom')
        return mockKysely
      })
      mockKysely.where.mockImplementation(() => {
        calls.push('where')
        return mockKysely
      })
      mockKysely.executeTakeFirstOrThrow.mockImplementation(() => {
        calls.push('executeTakeFirstOrThrow')
        return Promise.resolve({ numDeletedRows: 1 })
      })

      await dao.deleteSubtitle(1)

      expect(calls).toEqual(['deleteFrom', 'where', 'executeTakeFirstOrThrow'])
    })
  })

  describe('边界情况', () => {
    it('应该处理负数视频ID', async () => {
      mockKysely.execute.mockResolvedValue([])

      const result = await dao.findByVideoId(-1)

      expect(mockKysely.where).toHaveBeenCalledWith('videoId', '=', -1)
      expect(result).toEqual([])
    })

    it('应该处理零视频ID', async () => {
      mockKysely.execute.mockResolvedValue([])

      const result = await dao.findByVideoId(0)

      expect(mockKysely.where).toHaveBeenCalledWith('videoId', '=', 0)
      expect(result).toEqual([])
    })

    it('应该处理空字符串路径', async () => {
      mockKysely.executeTakeFirst.mockResolvedValue(undefined)

      const result = await dao.findByVideoIdAndPath(1, '')

      expect(mockKysely.where).toHaveBeenCalledWith('filePath', '=', '')
      expect(result).toBeUndefined()
    })

    it('应该处理负数ID删除', async () => {
      const error = new Error('Invalid ID')
      mockKysely.executeTakeFirstOrThrow.mockRejectedValue(error)

      await expect(dao.deleteSubtitle(-1)).rejects.toThrow('Invalid ID')
    })

    it('应该处理零ID删除', async () => {
      const error = new Error('Invalid ID')
      mockKysely.executeTakeFirstOrThrow.mockRejectedValue(error)

      await expect(dao.deleteSubtitle(0)).rejects.toThrow('Invalid ID')
    })

    it('应该处理大数值视频ID', async () => {
      const largeId = Number.MAX_SAFE_INTEGER
      mockKysely.execute.mockResolvedValue([])

      const result = await dao.findByVideoId(largeId)

      expect(mockKysely.where).toHaveBeenCalledWith('videoId', '=', largeId)
      expect(result).toEqual([])
    })

    it('应该处理特殊字符的文件路径', async () => {
      const specialPath = '/path/with spaces/字幕.srt'
      mockKysely.executeTakeFirst.mockResolvedValue(undefined)

      const result = await dao.findByVideoIdAndPath(1, specialPath)

      expect(mockKysely.where).toHaveBeenCalledWith('filePath', '=', specialPath)
      expect(result).toBeUndefined()
    })

    it('应该处理非常长的文件路径', async () => {
      const longPath = '/very/long/path/'.repeat(50) + 'subtitle.srt'
      mockKysely.executeTakeFirst.mockResolvedValue(undefined)

      const result = await dao.findByVideoIdAndPath(1, longPath)

      expect(mockKysely.where).toHaveBeenCalledWith('filePath', '=', longPath)
      expect(result).toBeUndefined()
    })
  })

  describe('数据完整性', () => {
    it('应该正确处理字幕记录的所有字段', async () => {
      const completeRecord = {
        videoId: 42,
        filePath: '/complete/path/to/subtitle.srt',
        created_at: 1704110400000 // Number timestamp
      }
      const mockResult = { id: 1 }
      mockKysely.executeTakeFirstOrThrow.mockResolvedValue(mockResult)

      const result = await dao.addSubtitle(completeRecord as any)

      expect(mockKysely.values).toHaveBeenCalledWith(completeRecord)
      expect(result).toEqual(mockResult)
    })

    it('应该处理包含特殊字符的字幕记录', async () => {
      const recordWithSpecialChars = {
        videoId: 1,
        filePath: '/path/with/特殊字符/and spaces/subtitle.srt',
        created_at: 1704110400000 // Number timestamp
      }
      const mockResult = { id: 1 }
      mockKysely.executeTakeFirstOrThrow.mockResolvedValue(mockResult)

      const result = await dao.addSubtitle(recordWithSpecialChars as any)

      expect(mockKysely.values).toHaveBeenCalledWith(recordWithSpecialChars)
      expect(result).toEqual(mockResult)
    })

    it('应该验证查询结果的数据结构', async () => {
      // Mock database returns number format
      const mockDBResults = [
        {
          id: 1,
          videoId: 1,
          filePath: '/path/to/subtitle1.srt',
          created_at: 1704110400000 // Number timestamp
        },
        {
          id: 2,
          videoId: 1,
          filePath: '/path/to/subtitle2.srt',
          created_at: 1704114000000 // Number timestamp: 2024-01-01T13:00:00.000Z
        }
      ]
      mockKysely.execute.mockResolvedValue(mockDBResults)

      // Expected results after schema transformation
      const expectedResults = [
        {
          id: 1,
          videoId: 1,
          filePath: '/path/to/subtitle1.srt',
          created_at: new Date('2024-01-01T12:00:00.000Z')
        },
        {
          id: 2,
          videoId: 1,
          filePath: '/path/to/subtitle2.srt',
          created_at: new Date('2024-01-01T13:00:00.000Z')
        }
      ]

      const result = await dao.findByVideoId(1)

      expect(result).toEqual(expectedResults)
      expect(result[0]).toHaveProperty('id')
      expect(result[0]).toHaveProperty('videoId')
      expect(result[0]).toHaveProperty('filePath')
      expect(result[0]).toHaveProperty('created_at')
    })
  })
})
