import { describe, expect, it } from 'vitest'

import {
  FileMetadataInsertSchema,
  FileMetadataQuerySchema,
  FileMetadataSelectSchema,
  FileMetadataUpdateSchema
} from '../file-metadata'

describe('FileMetadata Schemas', () => {
  describe('FileMetadataInsertSchema', () => {
    it('should validate valid file metadata insert data', () => {
      const validData = {
        id: 'test-file-1',
        name: 'video.mp4',
        origin_name: 'Original Video.mp4',
        path: '/path/to/video.mp4',
        size: 1024000,
        ext: '.mp4',
        type: 'video' as const,
        created_at: Date.now()
      }

      const result = FileMetadataInsertSchema.parse(validData)

      expect(result.id).toBe('test-file-1')
      expect(result.name).toBe('video.mp4')
      expect(result.type).toBe('video')
    })

    it('should validate and clean string fields', () => {
      const data = {
        id: ' test-file-3 ',
        name: ' video.mp4 ',
        origin_name: ' Original Video.mp4 ',
        path: ' /path/to/video.mp4 ',
        size: 1024000,
        ext: ' .mp4 ',
        type: 'video' as const,
        created_at: Date.now()
      }

      const result = FileMetadataInsertSchema.parse(data)

      expect(result.id).toBe('test-file-3')
      expect(result.name).toBe('video.mp4')
      expect(result.origin_name).toBe('Original Video.mp4')
      expect(result.path).toBe('/path/to/video.mp4')
      expect(result.ext).toBe('.mp4')
    })

    it('should reject invalid file types', () => {
      const invalidData = {
        id: 'test-file-invalid',
        name: 'test.mp4',
        origin_name: 'test.mp4',
        path: '/path/to/test.mp4',
        size: 1024,
        ext: '.mp4',
        type: 'invalid_type' as any,
        created_at: Date.now()
      }

      expect(() => FileMetadataInsertSchema.parse(invalidData)).toThrow()
    })

    it('should reject negative file sizes', () => {
      const invalidData = {
        id: 'test-file-negative',
        name: 'test.mp4',
        origin_name: 'test.mp4',
        path: '/path/to/test.mp4',
        size: -100,
        ext: '.mp4',
        type: 'video' as const,
        created_at: Date.now()
      }

      expect(() => FileMetadataInsertSchema.parse(invalidData)).toThrow()
    })

    it('should reject empty required strings', () => {
      expect(() =>
        FileMetadataInsertSchema.parse({
          id: '',
          name: 'test.mp4',
          origin_name: 'test.mp4',
          path: '/path/to/test.mp4',
          size: 1024,
          ext: '.mp4',
          type: 'video',
          created_at: Date.now()
        })
      ).toThrow()

      expect(() =>
        FileMetadataInsertSchema.parse({
          id: 'test-file',
          name: '',
          origin_name: 'test.mp4',
          path: '/path/to/test.mp4',
          size: 1024,
          ext: '.mp4',
          type: 'video',
          created_at: Date.now()
        })
      ).toThrow()
    })
  })

  describe('FileMetadataSelectSchema', () => {
    it('should validate file metadata select data', () => {
      const selectData = {
        id: 'test-file-1',
        name: 'video.mp4',
        origin_name: 'Original Video.mp4',
        path: '/path/to/video.mp4',
        size: 1024000,
        ext: '.mp4',
        type: 'video' as const,
        created_at: 1704067200000
      }

      const result = FileMetadataSelectSchema.parse(selectData)

      expect(result.id).toBe('test-file-1')
      expect(result.name).toBe('video.mp4')
      expect(result.type).toBe('video')
      expect(result.created_at.getTime()).toBe(Date.parse('2024-01-01T00:00:00.000Z'))
    })

    it('should handle all file types', () => {
      const fileTypes = ['video', 'audio', 'subtitle', 'image', 'other'] as const

      fileTypes.forEach((type) => {
        const data = {
          id: `test-${type}`,
          name: `test.${type}`,
          origin_name: `Original.${type}`,
          path: `/path/to/test.${type}`,
          size: 1024,
          ext: `.${type}`,
          type,
          created_at: Date.now()
        }

        const result = FileMetadataSelectSchema.parse(data)
        expect(result.type).toBe(type)
      })
    })
  })

  describe('FileMetadataUpdateSchema', () => {
    it('should validate partial update data', () => {
      const updateData = {
        name: 'new_name.mp4',
        size: 2048000
      }

      const result = FileMetadataUpdateSchema.parse(updateData)

      expect(result.name).toBe('new_name.mp4')
      expect(result.size).toBe(2048000)
    })

    it('should allow empty updates', () => {
      const result = FileMetadataUpdateSchema.parse({})
      expect(result).toEqual({})
    })

    it('should validate individual fields when provided', () => {
      // Valid update
      expect(() =>
        FileMetadataUpdateSchema.parse({
          type: 'audio'
        })
      ).not.toThrow()

      // Invalid update
      expect(() =>
        FileMetadataUpdateSchema.parse({
          type: 'invalid_type'
        })
      ).toThrow()

      expect(() =>
        FileMetadataUpdateSchema.parse({
          size: -100
        })
      ).toThrow()
    })
  })

  describe('FileMetadataQuerySchema', () => {
    it('should validate query parameters with defaults', () => {
      const result = FileMetadataQuerySchema.parse({})

      expect(result.limit).toBe(50)
      expect(result.offset).toBe(0)
      expect(result.sortBy).toBe('created_at')
      expect(result.sortOrder).toBe('desc')
    })

    it('should validate custom query parameters', () => {
      const queryData = {
        type: 'video' as const,
        limit: 100,
        offset: 20,
        sortBy: 'size' as const,
        sortOrder: 'asc' as const,
        searchQuery: 'test'
      }

      const result = FileMetadataQuerySchema.parse(queryData)

      expect(result.type).toBe('video')
      expect(result.limit).toBe(100)
      expect(result.offset).toBe(20)
      expect(result.sortBy).toBe('size')
      expect(result.sortOrder).toBe('asc')
      expect(result.searchQuery).toBe('test')
    })

    it('should reject invalid sort fields', () => {
      expect(() =>
        FileMetadataQuerySchema.parse({
          sortBy: 'invalid_field'
        })
      ).toThrow()
    })

    it('should reject negative limits and offsets', () => {
      expect(() =>
        FileMetadataQuerySchema.parse({
          limit: -1
        })
      ).toThrow()

      expect(() =>
        FileMetadataQuerySchema.parse({
          offset: -1
        })
      ).toThrow()
    })

    it('should validate all sort options', () => {
      const validSortFields = ['name', 'size', 'created_at', 'type']

      validSortFields.forEach((sortBy) => {
        const result = FileMetadataQuerySchema.parse({ sortBy })
        expect(result.sortBy).toBe(sortBy)
      })
    })
  })

  describe('Integration scenarios', () => {
    it('should handle complete file lifecycle', () => {
      // 1. 创建新文件记录
      const newFile = {
        id: 'lifecycle-test',
        name: 'test.mp4',
        origin_name: 'Original Test.mp4',
        path: '/path/to/test.mp4',
        size: 1024000,
        ext: '.mp4',
        type: 'video' as const,
        created_at: Date.now()
      }

      const insertData = FileMetadataInsertSchema.parse(newFile)
      expect(insertData.id).toBe('lifecycle-test')
      expect(insertData.type).toBe('video')

      // 2. 模拟从数据库读取
      const dbRecord = {
        ...insertData,
        created_at: insertData.created_at || Date.now()
      }

      const selectData = FileMetadataSelectSchema.parse(dbRecord)
      expect(selectData.id).toBe('lifecycle-test')
      expect(selectData.type).toBe('video')

      // 3. 更新文件信息
      const updateData = FileMetadataUpdateSchema.parse({
        name: 'updated_test.mp4',
        size: 2048000
      })

      expect(updateData.name).toBe('updated_test.mp4')
      expect(updateData.size).toBe(2048000)
    })

    it('should handle edge cases', () => {
      // 测试边界值
      const boundaryData = {
        id: 'boundary-test',
        name: 'a'.repeat(255), // 长文件名
        origin_name: 'Original',
        path: '/very/long/path/to/file.mp4',
        size: Number.MAX_SAFE_INTEGER,
        ext: '.mp4',
        type: 'video' as const,
        created_at: Date.now()
      }

      expect(() => FileMetadataInsertSchema.parse(boundaryData)).not.toThrow()

      // 测试最小值
      const minimalData = {
        id: '1',
        name: 'a',
        origin_name: 'b',
        path: '/',
        size: 0,
        ext: '.',
        type: 'other' as const,
        created_at: 0
      }

      expect(() => FileMetadataInsertSchema.parse(minimalData)).not.toThrow()
    })
  })
})
