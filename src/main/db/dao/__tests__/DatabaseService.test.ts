import type { Kysely } from 'kysely'
import type { DB } from 'packages/shared/schema'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import * as dbIndex from '../../index'
import { DatabaseService, db } from '../DatabaseService'
import { FileDAO } from '../FileDAO'
import { SubtitleLibraryDAO } from '../SubtitleLibraryDAO'
import { VideoLibraryDAO } from '../VideoLibraryDAO'

// Mock dependencies
vi.mock('../FileDAO')
vi.mock('../VideoLibraryDAO')
vi.mock('../SubtitleLibraryDAO')

// Mock the database index module
vi.mock('../../index')

describe('DatabaseService', () => {
  const mockKysely = {
    transaction: vi.fn(() => ({
      execute: vi.fn()
    }))
  } as unknown as Kysely<DB>

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(dbIndex.getKysely).mockReturnValue(mockKysely)
  })

  describe('constructor', () => {
    it('应该使用提供的数据库实例', () => {
      const customKysely = {} as Kysely<DB>
      const service = new DatabaseService(customKysely)

      expect(FileDAO).toHaveBeenCalledWith(customKysely)
      expect(VideoLibraryDAO).toHaveBeenCalledWith(customKysely)
      expect(SubtitleLibraryDAO).toHaveBeenCalledWith(customKysely)
      expect(service.files).toBeInstanceOf(FileDAO)
      expect(service.videoLibrary).toBeInstanceOf(VideoLibraryDAO)
      expect(service.subtitleLibrary).toBeInstanceOf(SubtitleLibraryDAO)
    })

    it('应该使用默认数据库实例', () => {
      const service = new DatabaseService()

      expect(dbIndex.getKysely).toHaveBeenCalledTimes(1)
      expect(FileDAO).toHaveBeenCalledWith(mockKysely)
      expect(VideoLibraryDAO).toHaveBeenCalledWith(mockKysely)
      expect(SubtitleLibraryDAO).toHaveBeenCalledWith(mockKysely)
      expect(service.files).toBeInstanceOf(FileDAO)
      expect(service.videoLibrary).toBeInstanceOf(VideoLibraryDAO)
      expect(service.subtitleLibrary).toBeInstanceOf(SubtitleLibraryDAO)
    })
  })

  describe('transaction', () => {
    it('应该执行事务', async () => {
      const service = new DatabaseService(mockKysely)
      const callback = vi.fn().mockResolvedValue('result')
      const mockTransaction = {
        execute: vi.fn().mockImplementation(async (cb) => await cb('transaction-db'))
      }

      // Mock getKysely to return a kysely instance with transaction method
      const mockTransactionKysely = {
        transaction: vi.fn().mockReturnValue(mockTransaction)
      } as unknown as Kysely<DB>
      vi.mocked(dbIndex.getKysely).mockReturnValue(mockTransactionKysely)

      const result = await service.transaction(callback)

      expect(mockTransactionKysely.transaction).toHaveBeenCalledTimes(1)
      expect(mockTransaction.execute).toHaveBeenCalledWith(callback)
      expect(callback).toHaveBeenCalledWith('transaction-db')
      expect(result).toBe('result')
    })

    it('应该传播事务错误', async () => {
      const service = new DatabaseService(mockKysely)
      const error = new Error('Transaction failed')
      const callback = vi.fn().mockRejectedValue(error)
      const mockTransaction = {
        execute: vi.fn().mockImplementation(async (cb) => await cb('transaction-db'))
      }

      // Mock getKysely to return a kysely instance with transaction method
      const mockTransactionKysely = {
        transaction: vi.fn().mockReturnValue(mockTransaction)
      } as unknown as Kysely<DB>
      vi.mocked(dbIndex.getKysely).mockReturnValue(mockTransactionKysely)

      await expect(service.transaction(callback)).rejects.toThrow('Transaction failed')
      expect(mockTransaction.execute).toHaveBeenCalledWith(callback)
    })

    it('应该使用默认数据库实例进行事务', async () => {
      const service = new DatabaseService()
      const callback = vi.fn().mockResolvedValue('result')
      const mockTransaction = {
        execute: vi.fn().mockImplementation(async (cb) => await cb('transaction-db'))
      }

      // Mock getKysely to return a kysely instance with transaction method
      const mockTransactionKysely = {
        transaction: vi.fn().mockReturnValue(mockTransaction)
      } as unknown as Kysely<DB>
      vi.mocked(dbIndex.getKysely).mockReturnValue(mockTransactionKysely)

      await service.transaction(callback)

      expect(mockTransactionKysely.transaction).toHaveBeenCalledTimes(1)
    })
  })

  describe('单例实例', () => {
    it('应该导出单例数据库服务实例', () => {
      expect(db).toBeInstanceOf(DatabaseService)
      expect(db.files).toBeInstanceOf(FileDAO)
      expect(db.videoLibrary).toBeInstanceOf(VideoLibraryDAO)
      expect(db.subtitleLibrary).toBeInstanceOf(SubtitleLibraryDAO)
    })

    it('应该复用单例实例', async () => {
      // Import the module dynamically to test singleton behavior
      const module1 = await import('../DatabaseService')
      const module2 = await import('../DatabaseService')

      expect(module1.db).toBe(module2.db)
    })
  })

  describe('DAO实例访问', () => {
    it('应该提供文件DAO访问', () => {
      const service = new DatabaseService()
      expect(service.files).toBeDefined()
      expect(service.files).toBeInstanceOf(FileDAO)
    })

    it('应该提供视频库DAO访问', () => {
      const service = new DatabaseService()
      expect(service.videoLibrary).toBeDefined()
      expect(service.videoLibrary).toBeInstanceOf(VideoLibraryDAO)
    })

    it('应该提供字幕库DAO访问', () => {
      const service = new DatabaseService()
      expect(service.subtitleLibrary).toBeDefined()
      expect(service.subtitleLibrary).toBeInstanceOf(SubtitleLibraryDAO)
    })
  })
})
