import type { Kysely } from 'kysely'
import type { DB, VideoLibraryTable } from 'packages/shared/schema'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { VideoLibraryDAO } from '../VideoLibraryDAO'

// Mock getKysely
vi.mock('../../index', () => ({
  getKysely: vi.fn()
}))

describe('VideoLibraryDAO', () => {
  let dao: VideoLibraryDAO
  let mockKysely: any

  const mockVideoRecord: Omit<VideoLibraryTable, 'id'> = {
    fileId: 'test-file-id',
    currentTime: 120.5,
    duration: 3600,
    playedAt: Date.now(),
    firstPlayedAt: Date.now() - 86400000, // 1 day ago
    playCount: 3,
    isFinished: false,
    isFavorite: true,
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

    vi.mocked(require('../../index').getKysely).mockReturnValue(mockKysely)
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

      expect(require('../../index').getKysely).toHaveBeenCalledTimes(1)
      expect(defaultDao).toBeInstanceOf(VideoLibraryDAO)
    })
  })

  describe('upsertVideoRecord', () => {
    it('应该插入新记录如果不存在', async () => {
      const mockResult = { id: 1 }
      mockKysely.executeTakeFirst.mockResolvedValue(undefined) // findByFileId returns undefined
      mockKysely.executeTakeFirstOrThrow.mockResolvedValue(mockResult)

      const result = await dao.upsertVideoRecord(mockVideoRecord)

      expect(mockKysely.selectFrom).toHaveBeenCalledWith('videoLibrary')
      expect(mockKysely.insertInto).toHaveBeenCalledWith('videoLibrary')
      expect(mockKysely.values).toHaveBeenCalledWith(mockVideoRecord)
      expect(mockKysely.returning).toHaveBeenCalledWith('id')
      expect(result).toEqual(mockResult)
    })

    it('应该更新已存在的记录', async () => {
      const existingRecord = { id: 1, ...mockVideoRecord }
      const mockResult = { id: 1 }
      mockKysely.executeTakeFirst.mockResolvedValue(existingRecord) // findByFileId returns existing
      mockKysely.executeTakeFirstOrThrow.mockResolvedValue(mockResult)

      const result = await dao.upsertVideoRecord(mockVideoRecord)

      expect(mockKysely.updateTable).toHaveBeenCalledWith('videoLibrary')
      expect(mockKysely.set).toHaveBeenCalledWith(mockVideoRecord)
      expect(mockKysely.where).toHaveBeenCalledWith('fileId', '=', mockVideoRecord.fileId)
      expect(mockKysely.returning).toHaveBeenCalledWith('id')
      expect(result).toEqual(mockResult)
    })

    it('应该处理插入失败', async () => {
      const error = new Error('Insert failed')
      mockKysely.executeTakeFirst.mockResolvedValue(undefined)
      mockKysely.executeTakeFirstOrThrow.mockRejectedValue(error)

      await expect(dao.upsertVideoRecord(mockVideoRecord)).rejects.toThrow('Insert failed')
    })

    it('应该处理更新失败', async () => {
      const existingRecord = { id: 1, ...mockVideoRecord }
      const error = new Error('Update failed')
      mockKysely.executeTakeFirst.mockResolvedValue(existingRecord)
      mockKysely.executeTakeFirstOrThrow.mockRejectedValue(error)

      await expect(dao.upsertVideoRecord(mockVideoRecord)).rejects.toThrow('Update failed')
    })
  })

  describe('findByFileId', () => {
    it('应该根据文件ID查找视频记录', async () => {
      const mockResult = { id: 1, ...mockVideoRecord }
      mockKysely.executeTakeFirst.mockResolvedValue(mockResult)

      const result = await dao.findByFileId('test-file-id')

      expect(mockKysely.selectFrom).toHaveBeenCalledWith('videoLibrary')
      expect(mockKysely.selectAll).toHaveBeenCalledTimes(1)
      expect(mockKysely.where).toHaveBeenCalledWith('fileId', '=', 'test-file-id')
      expect(mockKysely.executeTakeFirst).toHaveBeenCalledTimes(1)
      expect(result).toEqual(mockResult)
    })

    it('应该返回undefined如果记录不存在', async () => {
      mockKysely.executeTakeFirst.mockResolvedValue(undefined)

      const result = await dao.findByFileId('nonexistent-id')

      expect(result).toBeUndefined()
    })

    it('应该处理查询错误', async () => {
      const error = new Error('Query failed')
      mockKysely.executeTakeFirst.mockRejectedValue(error)

      await expect(dao.findByFileId('test-file-id')).rejects.toThrow('Query failed')
    })
  })

  describe('getRecentlyPlayed', () => {
    it('应该获取最近播放的视频（默认限制）', async () => {
      const mockResults = [
        { id: 1, ...mockVideoRecord, playedAt: Date.now() },
        { id: 2, ...mockVideoRecord, fileId: 'file-2', playedAt: Date.now() - 3600000 }
      ]
      mockKysely.execute.mockResolvedValue(mockResults)

      const result = await dao.getRecentlyPlayed()

      expect(mockKysely.selectFrom).toHaveBeenCalledWith('videoLibrary')
      expect(mockKysely.selectAll).toHaveBeenCalledTimes(1)
      expect(mockKysely.orderBy).toHaveBeenCalledWith('playedAt', 'desc')
      expect(mockKysely.limit).toHaveBeenCalledWith(10)
      expect(result).toEqual(mockResults)
    })

    it('应该使用自定义限制', async () => {
      const mockResults = [{ id: 1, ...mockVideoRecord }]
      mockKysely.execute.mockResolvedValue(mockResults)

      const result = await dao.getRecentlyPlayed(5)

      expect(mockKysely.limit).toHaveBeenCalledWith(5)
      expect(result).toEqual(mockResults)
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
      const mockResults = [
        { id: 1, ...mockVideoRecord, isFavorite: true },
        { id: 2, ...mockVideoRecord, fileId: 'file-2', isFavorite: true }
      ]
      mockKysely.execute.mockResolvedValue(mockResults)

      const result = await dao.getFavorites()

      expect(mockKysely.selectFrom).toHaveBeenCalledWith('videoLibrary')
      expect(mockKysely.selectAll).toHaveBeenCalledTimes(1)
      expect(mockKysely.where).toHaveBeenCalledWith('isFavorite', '=', true)
      expect(mockKysely.orderBy).toHaveBeenCalledWith('playedAt', 'desc')
      expect(result).toEqual(mockResults)
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
    beforeEach(() => {
      // Mock the complex select expression for playCount increment
      const mockSelectExpression = 'mock-select-expression'
      mockKysely.selectFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue(mockSelectExpression)
          })
        })
      })
    })

    it('应该更新播放进度', async () => {
      const mockResult = { numUpdatedRows: 1 }
      mockKysely.execute.mockResolvedValue(mockResult)
      const now = Date.now()
      vi.spyOn(Date, 'now').mockReturnValue(now)

      const result = await dao.updatePlayProgress('test-file-id', 150.5)

      expect(mockKysely.updateTable).toHaveBeenCalledWith('videoLibrary')
      expect(mockKysely.set).toHaveBeenCalledWith({
        currentTime: 150.5,
        playedAt: now,
        playCount: expect.any(String) // The complex select expression
      })
      expect(mockKysely.where).toHaveBeenCalledWith('fileId', '=', 'test-file-id')
      expect(result).toEqual(mockResult)
    })

    it('应该更新播放进度并设置完成状态', async () => {
      const mockResult = { numUpdatedRows: 1 }
      mockKysely.execute.mockResolvedValue(mockResult)
      const now = Date.now()
      vi.spyOn(Date, 'now').mockReturnValue(now)

      const result = await dao.updatePlayProgress('test-file-id', 3600, true)

      expect(mockKysely.set).toHaveBeenCalledWith({
        currentTime: 3600,
        playedAt: now,
        isFinished: true,
        playCount: expect.any(String)
      })
      expect(result).toEqual(mockResult)
    })

    it('应该更新播放进度但不改变完成状态', async () => {
      const mockResult = { numUpdatedRows: 1 }
      mockKysely.execute.mockResolvedValue(mockResult)
      const now = Date.now()
      vi.spyOn(Date, 'now').mockReturnValue(now)

      const result = await dao.updatePlayProgress('test-file-id', 150.5, undefined)

      expect(mockKysely.set).toHaveBeenCalledWith({
        currentTime: 150.5,
        playedAt: now,
        playCount: expect.any(String)
      })
      expect(result).toEqual(mockResult)
    })

    it('应该处理更新失败', async () => {
      const error = new Error('Update failed')
      mockKysely.execute.mockRejectedValue(error)

      await expect(dao.updatePlayProgress('test-file-id', 150.5)).rejects.toThrow('Update failed')
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

      const result = await dao.toggleFavorite('test-file-id')

      expect(mockKysely.updateTable).toHaveBeenCalledWith('videoLibrary')
      expect(mockKysely.set).toHaveBeenCalledWith(expect.any(Function))
      expect(mockKysely.where).toHaveBeenCalledWith('fileId', '=', 'test-file-id')
      expect(result).toEqual(mockResult)
    })

    it('应该构建正确的CASE表达式', async () => {
      const mockResult = { numUpdatedRows: 1 }
      mockKysely.execute.mockResolvedValue(mockResult)

      await dao.toggleFavorite('test-file-id')

      // Verify the case expression chain
      expect(mockKysely.case).toHaveBeenCalledTimes(1)

      // Get the function passed to set() and call it with a mock expression builder
      const setCall = mockKysely.set.mock.calls[0][0]
      const mockEB = { case: vi.fn().mockReturnValue(mockKysely) }
      const result = setCall(mockEB)

      expect(result).toEqual({ isFavorite: mockKysely })
    })

    it('应该处理切换失败', async () => {
      const error = new Error('Toggle failed')
      mockKysely.execute.mockRejectedValue(error)

      await expect(dao.toggleFavorite('test-file-id')).rejects.toThrow('Toggle failed')
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

      await dao.updatePlayProgress('test-file-id', -10)

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
        ...mockVideoRecord,
        playCount: Number.MAX_SAFE_INTEGER
      }
      const mockResult = { id: 1 }
      mockKysely.executeTakeFirst.mockResolvedValue(undefined)
      mockKysely.executeTakeFirstOrThrow.mockResolvedValue(mockResult)

      const result = await dao.upsertVideoRecord(recordWithLargeCount)

      expect(mockKysely.values).toHaveBeenCalledWith(recordWithLargeCount)
      expect(result).toEqual(mockResult)
    })
  })
})
