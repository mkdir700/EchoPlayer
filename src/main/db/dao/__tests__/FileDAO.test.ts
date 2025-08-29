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

  const mockFile: Omit<FileMetadataTable, 'id' | 'created_at'> & { created_at?: string } = {
    name: 'test.mp4',
    origin_name: 'Original Test Video.mp4',
    path: '/path/to/test.mp4',
    size: 1024000,
    ext: '.mp4',
    type: 'video' as FileTypes,
    created_at: '2024-01-01T12:00:00.000Z'
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
      const mockResult = { id: 1 }
      mockKysely.executeTakeFirstOrThrow.mockResolvedValue(mockResult)

      const result = await dao.addFile(mockFile as any)

      expect(mockKysely.insertInto).toHaveBeenCalledWith('files')
      expect(mockKysely.values).toHaveBeenCalledWith(mockFile)
      expect(mockKysely.returning).toHaveBeenCalledWith('id')
      expect(mockKysely.executeTakeFirstOrThrow).toHaveBeenCalledTimes(1)
      expect(result).toEqual(mockResult)
    })

    it('应该处理添加失败', async () => {
      const error = new Error('Insert failed')
      mockKysely.executeTakeFirstOrThrow.mockRejectedValue(error)

      await expect(dao.addFile(mockFile as any)).rejects.toThrow('Insert failed')
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

      await dao.addFile(mockFile as any)

      expect(calls).toEqual(['insertInto', 'values', 'returning', 'executeTakeFirstOrThrow'])
    })
  })

  describe('findByPath', () => {
    it('应该根据路径查找文件', async () => {
      const mockResult = { id: 1, ...mockFile }
      mockKysely.executeTakeFirst.mockResolvedValue(mockResult)

      const result = await dao.findByPath('/path/to/test.mp4')

      expect(mockKysely.selectFrom).toHaveBeenCalledWith('files')
      expect(mockKysely.selectAll).toHaveBeenCalledTimes(1)
      expect(mockKysely.where).toHaveBeenCalledWith('path', '=', '/path/to/test.mp4')
      expect(mockKysely.executeTakeFirst).toHaveBeenCalledTimes(1)
      expect(result).toEqual(mockResult)
    })

    it('应该返回undefined如果文件不存在', async () => {
      mockKysely.executeTakeFirst.mockResolvedValue(undefined)

      const result = await dao.findByPath('/nonexistent/path.mp4')

      expect(result).toBeUndefined()
    })

    it('应该处理查询错误', async () => {
      const error = new Error('Query failed')
      mockKysely.executeTakeFirst.mockRejectedValue(error)

      await expect(dao.findByPath('/path/to/test.mp4')).rejects.toThrow('Query failed')
    })
  })

  describe('findByType', () => {
    it('应该根据类型查找文件列表', async () => {
      const mockResults = [
        { id: 1, ...mockFile },
        { id: 2, ...mockFile, name: 'test2.mp4' }
      ]
      mockKysely.execute.mockResolvedValue(mockResults)

      const result = await dao.findByType('video')

      expect(mockKysely.selectFrom).toHaveBeenCalledWith('files')
      expect(mockKysely.selectAll).toHaveBeenCalledTimes(1)
      expect(mockKysely.where).toHaveBeenCalledWith('type', '=', 'video')
      expect(mockKysely.orderBy).toHaveBeenCalledWith('created_at', 'desc')
      expect(mockKysely.execute).toHaveBeenCalledTimes(1)
      expect(result).toEqual(mockResults)
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

    it('应该处理查询错误', async () => {
      const error = new Error('Query failed')
      mockKysely.execute.mockRejectedValue(error)

      await expect(dao.findByType('video')).rejects.toThrow('Query failed')
    })
  })

  describe('deleteFile', () => {
    it('应该成功删除文件', async () => {
      const mockResult = { numDeletedRows: 1 }
      mockKysely.executeTakeFirstOrThrow.mockResolvedValue(mockResult)

      const result = await dao.deleteFile(1)

      expect(mockKysely.deleteFrom).toHaveBeenCalledWith('files')
      expect(mockKysely.where).toHaveBeenCalledWith('id', '=', 1)
      expect(mockKysely.executeTakeFirstOrThrow).toHaveBeenCalledTimes(1)
      expect(result).toEqual(mockResult)
    })

    it('应该处理删除不存在的文件', async () => {
      const error = new Error('File not found')
      mockKysely.executeTakeFirstOrThrow.mockRejectedValue(error)

      await expect(dao.deleteFile(999)).rejects.toThrow('File not found')
    })

    it('应该处理删除错误', async () => {
      const error = new Error('Delete failed')
      mockKysely.executeTakeFirstOrThrow.mockRejectedValue(error)

      await expect(dao.deleteFile(1)).rejects.toThrow('Delete failed')
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

      await dao.deleteFile(1)

      expect(calls).toEqual(['deleteFrom', 'where', 'executeTakeFirstOrThrow'])
    })
  })

  describe('边界情况', () => {
    it('应该处理空字符串路径', async () => {
      mockKysely.executeTakeFirst.mockResolvedValue(undefined)

      const result = await dao.findByPath('')

      expect(mockKysely.where).toHaveBeenCalledWith('path', '=', '')
      expect(result).toBeUndefined()
    })

    it('应该处理负数ID删除', async () => {
      const error = new Error('Invalid ID')
      mockKysely.executeTakeFirstOrThrow.mockRejectedValue(error)

      await expect(dao.deleteFile(-1)).rejects.toThrow('Invalid ID')
    })

    it('应该处理零ID删除', async () => {
      const error = new Error('Invalid ID')
      mockKysely.executeTakeFirstOrThrow.mockRejectedValue(error)

      await expect(dao.deleteFile(0)).rejects.toThrow('Invalid ID')
    })
  })
})
