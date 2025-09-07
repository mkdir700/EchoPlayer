import type { Kysely } from 'kysely'
import type { DB } from 'packages/shared/schema'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import * as dbIndex from '../../index'
import { VideoLibraryDAO } from '../VideoLibraryDAO'

// Mock getKysely
vi.mock('../../index')

describe('VideoLibraryDAO', () => {
  let dao: VideoLibraryDAO
  let mockKysely: any

  // Mock data for insertion (uses boolean, will be converted to number by schema)
  const mockVideoRecordFromDBForInsert = {
    fileId: 'test-file-id-1',
    currentTime: 120.5,
    duration: 3600,
    playedAt: Date.now(),
    firstPlayedAt: Date.now() - 86400000, // 1 day ago
    playCount: 3,
    isFinished: false, // Boolean for insert
    isFavorite: true, // Boolean for insert
    thumbnailPath: '/path/to/thumbnail.jpg'
  }

  // Mock data for query results (uses number, will be converted to boolean by schema)
  const mockVideoRecordFromDBFromDB = {
    fileId: 'test-file-id-1',
    currentTime: 120.5,
    duration: 3600,
    playedAt: Date.now(),
    firstPlayedAt: Date.now() - 86400000, // 1 day ago
    playCount: 3,
    isFinished: 0, // Number from DB (0 for false)
    isFavorite: 1, // Number from DB (1 for true)
    thumbnailPath: '/path/to/thumbnail.jpg'
  }

  // Expected data after schema transformation (numbers converted to booleans)
  const mockVideoRecordExpected = {
    fileId: 'test-file-id-1',
    currentTime: 120.5,
    duration: 3600,
    playedAt: Date.now(),
    firstPlayedAt: Date.now() - 86400000, // 1 day ago
    playCount: 3,
    isFinished: false, // Converted to boolean
    isFavorite: true, // Converted to boolean
    thumbnailPath: '/path/to/thumbnail.jpg'
  }

  beforeEach(() => {
    // Create mock query builder
    mockKysely = {
      insertInto: vi.fn().mockReturnThis(),
      selectFrom: vi.fn().mockReturnThis(),
      updateTable: vi.fn().mockReturnThis(),
      values: vi.fn().mockReturnThis(),
      selectAll: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      returning: vi.fn().mockReturnThis(),
      execute: vi.fn(),
      executeTakeFirst: vi.fn(),
      executeTakeFirstOrThrow: vi.fn(),
      case: vi.fn().mockReturnThis(),
      when: vi.fn().mockReturnThis(),
      then: vi.fn().mockReturnThis(),
      else: vi.fn().mockReturnThis(),
      end: vi.fn()
    }

    vi.mocked(dbIndex.getKysely).mockReturnValue(mockKysely)
    dao = new VideoLibraryDAO()
    vi.clearAllMocks()
  })

  describe('constructor', () => {
    it('应该使用提供的数据库实例', () => {
      const customKysely = {} as Kysely<DB>
      const customDao = new VideoLibraryDAO(customKysely)

      expect(customDao).toBeInstanceOf(VideoLibraryDAO)
    })

    it('应该使用默认数据库实例', () => {
      const defaultDao = new VideoLibraryDAO()

      expect(dbIndex.getKysely).toHaveBeenCalledTimes(1)
      expect(defaultDao).toBeInstanceOf(VideoLibraryDAO)
    })
  })

  describe('addVideoRecord', () => {
    it('应该处理插入失败', async () => {
      const error = new Error('Insert failed')
      mockKysely.executeTakeFirst.mockResolvedValue(undefined)
      mockKysely.executeTakeFirstOrThrow.mockRejectedValue(error)

      await expect(dao.addVideoRecord(mockVideoRecordFromDBForInsert as any)).rejects.toThrow(
        'Insert failed'
      )
    })
  })

  describe('updateRecord', () => {
    it('应该处理更新失败', async () => {
      const existingRecord = { id: 1, ...mockVideoRecordFromDBFromDB }
      const error = new Error('Update failed')
      mockKysely.executeTakeFirst.mockResolvedValue(existingRecord)
      mockKysely.executeTakeFirstOrThrow.mockRejectedValue(error)

      await expect(dao.updateRecord(1, { currentTime: 100 })).rejects.toThrow('Update failed')
    })
  })

  describe('findByFileId', () => {
    it('应该根据文件ID查找视频记录', async () => {
      // Mock database returns number format
      const mockDBResult = { id: 1, ...mockVideoRecordFromDBFromDB }
      mockKysely.executeTakeFirst.mockResolvedValue(mockDBResult)

      // Expected result after schema transformation
      const expectedResult = { id: 1, ...mockVideoRecordExpected }

      const result = await dao.findByFileId('test-file-id-1')

      expect(mockKysely.selectFrom).toHaveBeenCalledWith('videoLibrary')
      expect(mockKysely.selectAll).toHaveBeenCalledTimes(1)
      expect(mockKysely.where).toHaveBeenCalledWith('fileId', '=', 'test-file-id-1')
      expect(mockKysely.executeTakeFirst).toHaveBeenCalledTimes(1)
      expect(result).toEqual(expectedResult)
    })

    it('应该返回undefined如果记录不存在', async () => {
      mockKysely.executeTakeFirst.mockResolvedValue(undefined)

      const result = await dao.findByFileId('non-existent-file-id')

      expect(result).toBeUndefined()
    })

    it('应该处理查询错误', async () => {
      const error = new Error('Query failed')
      mockKysely.executeTakeFirst.mockRejectedValue(error)

      await expect(dao.findByFileId('test-file-id-1')).rejects.toThrow('Query failed')
    })
  })

  describe('getRecentlyPlayed', () => {
    it('应该获取最近播放的视频（默认限制）', async () => {
      const now = Date.now()
      // Mock database returns number format
      const mockDBResults = [
        { id: 1, ...mockVideoRecordFromDBFromDB, playedAt: now },
        {
          id: 2,
          ...mockVideoRecordFromDBFromDB,
          fileId: 'test-file-id-2',
          playedAt: now - 3600000
        }
      ]
      mockKysely.execute.mockResolvedValue(mockDBResults)

      // Expected results after schema transformation
      const expectedResults = [
        { id: 1, ...mockVideoRecordExpected, playedAt: now },
        {
          id: 2,
          ...mockVideoRecordExpected,
          fileId: 'test-file-id-2',
          playedAt: now - 3600000
        }
      ]

      const result = await dao.getRecentlyPlayed()

      expect(mockKysely.selectFrom).toHaveBeenCalledWith('videoLibrary')
      expect(mockKysely.selectAll).toHaveBeenCalledTimes(1)
      expect(mockKysely.orderBy).toHaveBeenCalledWith('playedAt', 'desc')
      expect(mockKysely.limit).toHaveBeenCalledWith(10)
      expect(result).toEqual(expectedResults)
    })

    it('应该使用自定义限制', async () => {
      // Mock database returns number format
      const mockDBResults = [{ id: 1, ...mockVideoRecordFromDBFromDB }]
      mockKysely.execute.mockResolvedValue(mockDBResults)

      // Expected results after schema transformation
      const expectedResults = [{ id: 1, ...mockVideoRecordExpected }]

      const result = await dao.getRecentlyPlayed(5)

      expect(mockKysely.limit).toHaveBeenCalledWith(5)
      expect(result).toEqual(expectedResults)
    })

    it('应该返回空数组如果没有记录', async () => {
      mockKysely.execute.mockResolvedValue([])

      const result = await dao.getRecentlyPlayed()

      expect(result).toEqual([])
    })

    it('应该处理查询错误', async () => {
      const error = new Error('Query failed')
      mockKysely.execute.mockRejectedValue(error)

      await expect(dao.getRecentlyPlayed()).rejects.toThrow('Query failed')
    })
  })

  describe('getFavorites', () => {
    it('应该获取收藏的视频', async () => {
      // Mock database returns number format
      const mockDBResults = [
        { id: 1, ...mockVideoRecordFromDBFromDB },
        { id: 2, ...mockVideoRecordFromDBFromDB, fileId: 'test-file-id-2' }
      ]
      mockKysely.execute.mockResolvedValue(mockDBResults)

      // Expected results after schema transformation
      const expectedResults = [
        { id: 1, ...mockVideoRecordExpected },
        { id: 2, ...mockVideoRecordExpected, fileId: 'test-file-id-2' }
      ]

      const result = await dao.getFavorites()

      expect(mockKysely.selectFrom).toHaveBeenCalledWith('videoLibrary')
      expect(mockKysely.selectAll).toHaveBeenCalledTimes(1)
      expect(mockKysely.where).toHaveBeenCalledWith('isFavorite', '=', 1)
      expect(mockKysely.orderBy).toHaveBeenCalledWith('playedAt', 'desc')
      expect(result).toEqual(expectedResults)
    })

    it('应该返回空数组如果没有收藏', async () => {
      mockKysely.execute.mockResolvedValue([])

      const result = await dao.getFavorites()

      expect(result).toEqual([])
    })

    it('应该处理查询错误', async () => {
      const error = new Error('Query failed')
      mockKysely.execute.mockRejectedValue(error)

      await expect(dao.getFavorites()).rejects.toThrow('Query failed')
    })
  })

  describe('updatePlayProgress', () => {
    it('应该更新播放进度', async () => {
      const mockResult = { numUpdatedRows: 1 }
      mockKysely.execute.mockResolvedValue(mockResult)
      const now = Date.now()
      vi.spyOn(Date, 'now').mockReturnValue(now)

      const result = await dao.updatePlayProgress(1, 150.5)

      expect(mockKysely.updateTable).toHaveBeenCalledWith('videoLibrary')
      expect(mockKysely.set).toHaveBeenCalledWith({
        currentTime: 150.5,
        playedAt: now
      })
      expect(mockKysely.where).toHaveBeenCalledWith('id', '=', 1)
      expect(result).toEqual(mockResult)
    })

    it('应该更新播放进度并设置完成状态', async () => {
      const mockResult = { numUpdatedRows: 1 }
      mockKysely.execute.mockResolvedValue(mockResult)
      const now = Date.now()
      vi.spyOn(Date, 'now').mockReturnValue(now)

      const result = await dao.updatePlayProgress(1, 3600, true)

      expect(mockKysely.set).toHaveBeenCalledWith({
        currentTime: 3600,
        playedAt: now,
        isFinished: 1 // Boolean true converted to number by DataTransforms
      })
      expect(result).toEqual(mockResult)
    })

    it('应该更新播放进度但不改变完成状态', async () => {
      const mockResult = { numUpdatedRows: 1 }
      mockKysely.execute.mockResolvedValue(mockResult)
      const now = Date.now()
      vi.spyOn(Date, 'now').mockReturnValue(now)

      const result = await dao.updatePlayProgress(1, 150.5, undefined)

      expect(mockKysely.set).toHaveBeenCalledWith({
        currentTime: 150.5,
        playedAt: now
      })
      expect(result).toEqual(mockResult)
    })

    it('应该处理更新失败', async () => {
      const error = new Error('Update failed')
      mockKysely.execute.mockRejectedValue(error)

      await expect(dao.updatePlayProgress(1, 150.5)).rejects.toThrow('Update failed')
    })
  })

  describe('toggleFavorite', () => {
    beforeEach(() => {
      // Mock the case expression for toggling favorite
      mockKysely.case.mockReturnValue({
        when: vi.fn().mockReturnValue({
          then: vi.fn().mockReturnValue({
            else: vi.fn().mockReturnValue({
              end: vi.fn().mockReturnValue('case-expression')
            })
          })
        })
      })
    })

    it('应该切换收藏状态', async () => {
      const mockResult = { numUpdatedRows: 1 }
      mockKysely.execute.mockResolvedValue(mockResult)

      const result = await dao.toggleFavorite(1)

      expect(mockKysely.updateTable).toHaveBeenCalledWith('videoLibrary')
      expect(mockKysely.set).toHaveBeenCalledWith(expect.any(Function))
      expect(mockKysely.where).toHaveBeenCalledWith('id', '=', 1)
      expect(result).toEqual(mockResult)
    })

    it('应该构建正确的CASE表达式', async () => {
      const mockResult = { numUpdatedRows: 1 }
      mockKysely.execute.mockResolvedValue(mockResult)

      await dao.toggleFavorite(1)

      // Verify that set was called with a function
      expect(mockKysely.set).toHaveBeenCalledWith(expect.any(Function))

      // Get the function passed to set() and call it with a mock expression builder
      const setCall = mockKysely.set.mock.calls[0][0]
      const mockEB = {
        case: vi.fn().mockReturnValue({
          when: vi.fn().mockReturnValue({
            then: vi.fn().mockReturnValue({
              else: vi.fn().mockReturnValue({
                end: vi.fn().mockReturnValue('mock-case-result')
              })
            })
          })
        })
      }
      const result = setCall(mockEB)

      expect(result).toEqual({ isFavorite: 'mock-case-result' })
      expect(mockEB.case).toHaveBeenCalledTimes(1)
    })

    it('应该处理切换失败', async () => {
      const error = new Error('Toggle failed')
      mockKysely.execute.mockRejectedValue(error)

      await expect(dao.toggleFavorite(1)).rejects.toThrow('Toggle failed')
    })
  })

  describe('边界情况', () => {
    it('应该处理空文件ID', async () => {
      mockKysely.executeTakeFirst.mockResolvedValue(undefined)

      const result = await dao.findByFileId('')

      expect(mockKysely.where).toHaveBeenCalledWith('fileId', '=', '')
      expect(result).toBeUndefined()
    })

    it('应该处理负数播放时间', async () => {
      const mockResult = { numUpdatedRows: 1 }
      mockKysely.execute.mockResolvedValue(mockResult)

      await dao.updatePlayProgress(1, -10)

      expect(mockKysely.set).toHaveBeenCalledWith(
        expect.objectContaining({
          currentTime: -10
        })
      )
    })

    it('应该处理零限制的最近播放', async () => {
      const mockResults: any[] = []
      mockKysely.execute.mockResolvedValue(mockResults)

      const result = await dao.getRecentlyPlayed(0)

      expect(mockKysely.limit).toHaveBeenCalledWith(0)
      expect(result).toEqual([])
    })

    it('应该处理大数值的播放次数', async () => {
      const recordWithLargeCount = {
        ...mockVideoRecordFromDBForInsert,
        playCount: Number.MAX_SAFE_INTEGER
      }

      // Expected data after schema transformation (boolean -> number)
      const expectedInsertData = {
        ...recordWithLargeCount,
        isFinished: 0, // false -> 0
        isFavorite: 1 // true -> 1
      }

      const mockResult = { id: 1 }
      mockKysely.executeTakeFirst.mockResolvedValue(undefined)
      mockKysely.executeTakeFirstOrThrow.mockResolvedValue(mockResult)

      const result = await dao.addVideoRecord(recordWithLargeCount as any)

      expect(mockKysely.values).toHaveBeenCalledWith(expectedInsertData)
      expect(result).toEqual(mockResult)
    })
  })
})
