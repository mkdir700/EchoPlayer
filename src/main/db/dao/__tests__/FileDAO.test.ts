import type { Kysely } from 'kysely'
import type { DB, FileMetadataTable, FileTypes } from 'packages/shared/schema'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import * as dbIndex from '../../index'
import { FileDAO } from '../FileDAO'

// Mock getKysely
vi.mock('../../index')

describe('FileDAO', () => {
  let dao: FileDAO
  let mockKysely: any

  // Mock数据（数字时间戳，模拟数据库返回）
  const mockFileFromDB: Omit<FileMetadataTable, 'id' | 'created_at'> & { created_at: number } = {
    name: 'test.mp4',
    origin_name: 'Original Test Video.mp4',
    path: '/path/to/test.mp4',
    size: 1024000,
    ext: '.mp4',
    type: 'video' as FileTypes,
    created_at: 1704110400000 // Fixed timestamp: 2024-01-01T12:00:00.000Z
  }

  // 期望的输出数据（Date对象，经过schema转换后）
  const mockFileExpected: Omit<FileMetadataTable, 'id' | 'created_at'> & { created_at: Date } = {
    name: 'test.mp4',
    origin_name: 'Original Test Video.mp4',
    path: '/path/to/test.mp4',
    size: 1024000,
    ext: '.mp4',
    type: 'video' as FileTypes,
    created_at: new Date('2024-01-01T12:00:00.000Z')
  }

  beforeEach(() => {
    // Create mock query builder
    mockKysely = {
      insertInto: vi.fn().mockReturnThis(),
      selectFrom: vi.fn().mockReturnThis(),
      deleteFrom: vi.fn().mockReturnThis(),
      updateTable: vi.fn().mockReturnThis(),
      values: vi.fn().mockReturnThis(),
      selectAll: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      returning: vi.fn().mockReturnThis(),
      returningAll: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      offset: vi.fn().mockReturnThis(),
      execute: vi.fn(),
      executeTakeFirst: vi.fn(),
      executeTakeFirstOrThrow: vi.fn()
    }

    vi.mocked(dbIndex.getKysely).mockReturnValue(mockKysely)
    dao = new FileDAO()
    vi.clearAllMocks()
  })

  describe('constructor', () => {
    it('应该使用提供的数据库实例', () => {
      const customKysely = {} as Kysely<DB>
      const customDao = new FileDAO(customKysely)

      expect(customDao).toBeInstanceOf(FileDAO)
    })

    it('应该使用默认数据库实例', () => {
      const defaultDao = new FileDAO()

      expect(dbIndex.getKysely).toHaveBeenCalledTimes(1)
      expect(defaultDao).toBeInstanceOf(FileDAO)
    })
  })

  describe('addFile', () => {
    it('应该成功添加文件', async () => {
      const mockResult = { id: 'test-file-1' }
      mockKysely.executeTakeFirstOrThrow.mockResolvedValue(mockResult)

      const result = await dao.addFile({
        id: 'test-file-1',
        name: 'test.mp4',
        origin_name: 'original_test.mp4',
        path: '/path/to/test.mp4',
        size: 1024,
        ext: 'mp4',
        type: 'video',
        created_at: Date.now()
      })

      expect(mockKysely.insertInto).toHaveBeenCalledWith('files')
      expect(mockKysely.returning).toHaveBeenCalledWith('id')
      expect(mockKysely.executeTakeFirstOrThrow).toHaveBeenCalledTimes(1)
      expect(result).toEqual(mockResult)
    })

    it('应该处理添加失败', async () => {
      const error = new Error('Insert failed')
      mockKysely.executeTakeFirstOrThrow.mockRejectedValue(error)

      await expect(
        dao.addFile({
          id: 'test-file-1',
          name: 'test.mp4',
          origin_name: 'original_test.mp4',
          path: '/path/to/test.mp4',
          size: 1024,
          ext: 'mp4',
          type: 'video',
          created_at: Date.now()
        })
      ).rejects.toThrow()
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
        return Promise.resolve({ id: 'test-file-1' })
      })

      await dao.addFile({
        id: 'test-file-1',
        name: 'test.mp4',
        origin_name: 'original_test.mp4',
        path: '/path/to/test.mp4',
        size: 1024,
        ext: 'mp4',
        type: 'video',
        created_at: Date.now()
      })

      expect(calls).toEqual(['insertInto', 'values', 'returning', 'executeTakeFirstOrThrow'])
    })
  })

  describe('findByPath', () => {
    it('应该根据路径查找文件', async () => {
      const mockResult = { id: 'test-file-1', ...mockFileFromDB }
      mockKysely.executeTakeFirst.mockResolvedValue(mockResult)

      const result = await dao.findByPath('/path/to/test.mp4')

      expect(mockKysely.selectFrom).toHaveBeenCalledWith('files')
      expect(mockKysely.selectAll).toHaveBeenCalledTimes(1)
      expect(mockKysely.where).toHaveBeenCalledWith('path', '=', '/path/to/test.mp4')
      expect(mockKysely.executeTakeFirst).toHaveBeenCalledTimes(1)
      expect(result).toEqual({ id: 'test-file-1', ...mockFileExpected })
    })

    it('应该返回undefined如果文件不存在', async () => {
      mockKysely.executeTakeFirst.mockResolvedValue(undefined)

      const result = await dao.findByPath('/nonexistent/path.mp4')

      expect(result).toBeUndefined()
    })

    it('应该处理查询错误', async () => {
      const error = new Error('Query failed')
      mockKysely.executeTakeFirst.mockRejectedValue(error)

      await expect(dao.findByPath('/path/to/test.mp4')).rejects.toThrow()
    })
  })

  describe('findByType', () => {
    it('应该根据类型查找文件列表', async () => {
      const mockResults = [
        { id: 'file-1', ...mockFileFromDB },
        { id: 'file-2', ...mockFileFromDB, name: 'test2.mp4' }
      ]
      mockKysely.execute.mockResolvedValue(mockResults)

      const result = await dao.findByType('video')

      expect(mockKysely.selectFrom).toHaveBeenCalledWith('files')
      expect(mockKysely.selectAll).toHaveBeenCalledTimes(1)
      expect(mockKysely.where).toHaveBeenCalledWith('type', '=', 'video')
      expect(mockKysely.orderBy).toHaveBeenCalledWith('created_at', 'desc')
      expect(mockKysely.execute).toHaveBeenCalledTimes(1)
      expect(result).toEqual([
        { id: 'file-1', ...mockFileExpected },
        { id: 'file-2', ...mockFileExpected, name: 'test2.mp4' }
      ])
    })

    it('应该处理不同文件类型', async () => {
      mockKysely.execute.mockResolvedValue([])

      await dao.findByType('audio')
      expect(mockKysely.where).toHaveBeenCalledWith('type', '=', 'audio')

      await dao.findByType('subtitle')
      expect(mockKysely.where).toHaveBeenCalledWith('type', '=', 'subtitle')

      await dao.findByType('image')
      expect(mockKysely.where).toHaveBeenCalledWith('type', '=', 'image')
    })

    it('应该返回空数组如果没有文件', async () => {
      mockKysely.execute.mockResolvedValue([])

      const result = await dao.findByType('video')

      expect(result).toEqual([])
    })

    it('应该按创建时间降序排序', async () => {
      mockKysely.execute.mockResolvedValue([])

      await dao.findByType('video')

      expect(mockKysely.orderBy).toHaveBeenCalledWith('created_at', 'desc')
    })
  })

  describe('findById', () => {
    it('应该根据ID查找文件', async () => {
      const mockResult = { id: 'test-file-1', ...mockFileFromDB }
      mockKysely.executeTakeFirst.mockResolvedValue(mockResult)

      const result = await dao.findById('test-file-1')

      expect(mockKysely.selectFrom).toHaveBeenCalledWith('files')
      expect(mockKysely.selectAll).toHaveBeenCalledTimes(1)
      expect(mockKysely.where).toHaveBeenCalledWith('id', '=', 'test-file-1')
      expect(mockKysely.executeTakeFirst).toHaveBeenCalledTimes(1)
      expect(result).toEqual({ id: 'test-file-1', ...mockFileExpected })
    })

    it('应该返回undefined如果文件不存在', async () => {
      mockKysely.executeTakeFirst.mockResolvedValue(undefined)

      const result = await dao.findById('non-existent-id')

      expect(result).toBeUndefined()
    })
  })

  describe('updateFile', () => {
    it('应该成功更新文件', async () => {
      // Mock update operation
      mockKysely.executeTakeFirstOrThrow.mockResolvedValueOnce({ numUpdatedRows: 1 })

      // Mock findById call for updated record
      const updatedRecord = {
        id: 'test-file-1',
        ...mockFileFromDB,
        name: 'updated_test.mp4',
        size: 2048
      }
      mockKysely.executeTakeFirst.mockResolvedValueOnce(updatedRecord)

      const result = await dao.updateFile('test-file-1', {
        name: 'updated_test.mp4',
        size: 2048
      })

      expect(mockKysely.updateTable).toHaveBeenCalledWith('files')
      expect(mockKysely.where).toHaveBeenCalledWith('id', '=', 'test-file-1')
      expect(mockKysely.executeTakeFirstOrThrow).toHaveBeenCalledTimes(1)
      expect(result).toEqual({
        id: 'test-file-1',
        ...mockFileExpected,
        name: 'updated_test.mp4',
        size: 2048
      })
    })

    it('应该处理更新失败', async () => {
      const error = new Error('Update failed')
      mockKysely.executeTakeFirstOrThrow.mockRejectedValue(error)

      await expect(dao.updateFile('test-file-1', { name: 'new_name.mp4' })).rejects.toThrow()
    })
  })

  describe('deleteFile', () => {
    it('应该成功删除文件', async () => {
      const mockResult = { numDeletedRows: 1 }
      mockKysely.executeTakeFirstOrThrow.mockResolvedValue(mockResult)

      const result = await dao.deleteFile('test-file-1')

      expect(mockKysely.deleteFrom).toHaveBeenCalledWith('files')
      expect(mockKysely.where).toHaveBeenCalledWith('id', '=', 'test-file-1')
      expect(mockKysely.executeTakeFirstOrThrow).toHaveBeenCalledTimes(1)
      expect(result).toEqual(mockResult)
    })

    it('应该处理删除不存在的文件', async () => {
      const error = new Error('File not found')
      mockKysely.executeTakeFirstOrThrow.mockRejectedValue(error)

      await expect(dao.deleteFile('non-existent')).rejects.toThrow()
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

      await dao.deleteFile('test-file-1')

      expect(calls).toEqual(['deleteFrom', 'where', 'executeTakeFirstOrThrow'])
    })
  })

  describe('getFiles', () => {
    it('应该获取文件列表', async () => {
      const mockResults = [
        { id: 'file-1', ...mockFileFromDB },
        { id: 'file-2', ...mockFileFromDB, name: 'test2.mp4' }
      ]
      mockKysely.execute.mockResolvedValue(mockResults)

      const result = await dao.getFiles()

      expect(mockKysely.selectFrom).toHaveBeenCalledWith('files')
      expect(mockKysely.selectAll).toHaveBeenCalledTimes(1)
      expect(result).toEqual([
        { id: 'file-1', ...mockFileExpected },
        { id: 'file-2', ...mockFileExpected, name: 'test2.mp4' }
      ])
    })

    it('应该支持查询参数过滤', async () => {
      mockKysely.execute.mockResolvedValue([])

      // Add mock implementation for chaining
      mockKysely.where.mockImplementation(() => mockKysely)
      mockKysely.orderBy.mockImplementation(() => mockKysely)
      mockKysely.limit.mockImplementation(() => mockKysely)
      mockKysely.offset.mockImplementation(() => mockKysely)

      await dao.getFiles({
        type: 'video',
        limit: 10,
        offset: 0,
        sortBy: 'created_at',
        sortOrder: 'desc'
      })

      expect(mockKysely.where).toHaveBeenCalledWith('type', '=', 'video')
      expect(mockKysely.orderBy).toHaveBeenCalledWith('created_at', 'desc')
      expect(mockKysely.limit).toHaveBeenCalledWith(10)
      expect(mockKysely.offset).toHaveBeenCalledWith(0)
    })
  })

  describe('utility methods', () => {
    it('应该检查文件是否存在', async () => {
      // Spy on the recordExists method
      vi.spyOn(dao as any, 'recordExists').mockResolvedValue(true)

      const result = await dao.fileExists('/path/to/test.mp4')

      expect(result).toBe(true)
    })

    it('应该获取文件总数', async () => {
      // Spy on the getRecordCount method
      vi.spyOn(dao as any, 'getRecordCount').mockResolvedValue(5)

      const result = await dao.getTotalCount()

      expect(result).toBe(5)
    })

    it('应该获取指定类型文件数量', async () => {
      // Spy on the getRecordCount method
      vi.spyOn(dao as any, 'getRecordCount').mockResolvedValue(3)

      const result = await dao.getTotalCount('video')

      expect(result).toBe(3)
    })
  })

  describe('additional methods', () => {
    it('应该查找所有文件', async () => {
      const mockResults = [
        { id: 'file-1', ...mockFileFromDB },
        { id: 'file-2', ...mockFileFromDB, name: 'test2.mp4' }
      ]
      mockKysely.execute.mockResolvedValue(mockResults)

      const result = await dao.findAll()

      expect(mockKysely.selectFrom).toHaveBeenCalledWith('files')
      expect(mockKysely.selectAll).toHaveBeenCalledTimes(1)
      expect(result).toEqual([
        { id: 'file-1', ...mockFileExpected },
        { id: 'file-2', ...mockFileExpected, name: 'test2.mp4' }
      ])
    })

    it('应该清空所有文件', async () => {
      const mockResult = { numDeletedRows: 5 }
      mockKysely.executeTakeFirstOrThrow.mockResolvedValue(mockResult)

      const result = await dao.clearAll()

      expect(mockKysely.deleteFrom).toHaveBeenCalledWith('files')
      expect(result).toEqual(mockResult)
    })

    it('应该按创建时间排序查找文件', async () => {
      const mockResults = [{ id: 'file-1', ...mockFileFromDB }]
      mockKysely.execute.mockResolvedValue(mockResults)
      mockKysely.orderBy.mockImplementation(() => mockKysely)
      mockKysely.limit.mockImplementation(() => mockKysely)

      const result = await dao.findAllOrderedByCreatedAt('asc', 1)

      expect(mockKysely.orderBy).toHaveBeenCalledWith('created_at', 'asc')
      expect(mockKysely.limit).toHaveBeenCalledWith(1)
      expect(result).toEqual([{ id: 'file-1', ...mockFileExpected }])
    })
  })
})
