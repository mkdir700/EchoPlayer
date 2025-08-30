import { describe, expect, it } from 'vitest'

import {
  PlayProgressUpdateSchema,
  VideoLibraryInsertSchema,
  VideoLibraryQuerySchema,
  VideoLibrarySelectSchema,
  VideoLibraryUpdateSchema
} from '../video-library'

describe('VideoLibrary Schemas', () => {
  describe('VideoLibraryInsertSchema', () => {
    it('should validate valid video library insert data', () => {
      const validData = {
        fileId: 'test-file-1',
        currentTime: 120,
        duration: 3600,
        playedAt: Date.now(),
        firstPlayedAt: Date.now(),
        playCount: 1,
        isFinished: false,
        isFavorite: true,
        thumbnailPath: '/path/to/thumbnail.jpg'
      }

      const result = VideoLibraryInsertSchema.parse(validData)

      expect(result.fileId).toBe('test-file-1')
      expect(result.currentTime).toBe(120)
      expect(result.isFinished).toBe(0) // 转换为数字
      expect(result.isFavorite).toBe(1) // 转换为数字
    })

    it('should apply default values', () => {
      const minimalData = {
        fileId: 'test-file-1',
        playedAt: Date.now(),
        firstPlayedAt: Date.now()
      }

      const result = VideoLibraryInsertSchema.parse(minimalData)

      expect(result.currentTime).toBe(0)
      expect(result.duration).toBe(0)
      expect(result.playCount).toBe(0)
      expect(result.isFinished).toBe(0)
      expect(result.isFavorite).toBe(0)
    })

    it('should validate and transform timestamps', () => {
      const now = new Date()
      const data = {
        fileId: 'test-file-1',
        playedAt: now,
        firstPlayedAt: now.toISOString()
      }

      const result = VideoLibraryInsertSchema.parse(data)

      expect(typeof result.playedAt).toBe('number')
      expect(typeof result.firstPlayedAt).toBe('number')
    })

    it('should reject invalid data', () => {
      expect(() => VideoLibraryInsertSchema.parse({})).toThrow()

      // 测试通过验证但值被清理的情况
      const result = VideoLibraryInsertSchema.parse({
        fileId: ' test ', // 空白字符串会被trim
        playedAt: Date.now(),
        firstPlayedAt: Date.now()
      })
      expect(result.fileId).toBe('test')

      expect(() =>
        VideoLibraryInsertSchema.parse({
          fileId: 'test',
          currentTime: -1, // 负数应该失败
          playedAt: Date.now(),
          firstPlayedAt: Date.now()
        })
      ).toThrow()
    })
  })

  describe('VideoLibrarySelectSchema', () => {
    it('should validate video library select data', () => {
      const selectData = {
        id: 1,
        fileId: 'test-file-1',
        currentTime: 120,
        duration: 3600,
        playedAt: 1704067200000,
        firstPlayedAt: 1704063600000,
        playCount: 5,
        isFinished: 1,
        isFavorite: 0,
        thumbnailPath: null
      }

      const result = VideoLibrarySelectSchema.parse(selectData)

      expect(result.id).toBe(1)
      expect(result.isFinished).toBe(true) // 转换为boolean
      expect(result.isFavorite).toBe(false) // 转换为boolean
      expect(result.thumbnailPath).toBeNull()
    })

    it('should handle boolean conversion from SQLite values', () => {
      const data = {
        id: 1,
        fileId: 'test',
        currentTime: 0,
        duration: 0,
        playedAt: 0,
        firstPlayedAt: 0,
        playCount: 0,
        isFinished: 0,
        isFavorite: 1,
        thumbnailPath: null
      }

      const result = VideoLibrarySelectSchema.parse(data)

      expect(result.isFinished).toBe(false)
      expect(result.isFavorite).toBe(true)
    })
  })

  describe('VideoLibraryUpdateSchema', () => {
    it('should validate partial update data', () => {
      const updateData = {
        currentTime: 200,
        isFinished: true
      }

      const result = VideoLibraryUpdateSchema.parse(updateData)

      expect(result.currentTime).toBe(200)
      expect(result.isFinished).toBe(1) // 转换为数字
    })

    it('should allow empty updates', () => {
      const result = VideoLibraryUpdateSchema.parse({})
      expect(result).toEqual({})
    })
  })

  describe('PlayProgressUpdateSchema', () => {
    it('should validate play progress update', () => {
      const progressData = {
        currentTime: 150.5,
        isFinished: true
      }

      const result = PlayProgressUpdateSchema.parse(progressData)

      expect(result.currentTime).toBe(150.5)
      expect(result.isFinished).toBe(1)
    })

    it('should handle optional isFinished field', () => {
      const progressData = {
        currentTime: 150.5
      }

      const result = PlayProgressUpdateSchema.parse(progressData)

      expect(result.currentTime).toBe(150.5)
      expect(result.isFinished).toBeUndefined()
    })

    it('should reject invalid progress data', () => {
      expect(() =>
        PlayProgressUpdateSchema.parse({
          currentTime: -10 // 负数应该失败
        })
      ).toThrow()
    })
  })

  describe('VideoLibraryQuerySchema', () => {
    it('should validate query parameters with defaults', () => {
      const result = VideoLibraryQuerySchema.parse({})

      expect(result.limit).toBe(20)
      expect(result.offset).toBe(0)
      expect(result.sortBy).toBe('playedAt')
      expect(result.sortOrder).toBe('desc')
      expect(result.favoritesOnly).toBe(false)
    })

    it('should validate custom query parameters', () => {
      const queryData = {
        limit: 50,
        offset: 20,
        sortBy: 'playCount' as const,
        sortOrder: 'asc' as const,
        favoritesOnly: true,
        searchQuery: 'test video'
      }

      const result = VideoLibraryQuerySchema.parse(queryData)

      expect(result.limit).toBe(50)
      expect(result.offset).toBe(20)
      expect(result.sortBy).toBe('playCount')
      expect(result.sortOrder).toBe('asc')
      expect(result.favoritesOnly).toBe(true)
      expect(result.searchQuery).toBe('test video')
    })

    it('should reject invalid sort fields', () => {
      expect(() =>
        VideoLibraryQuerySchema.parse({
          sortBy: 'invalidField'
        })
      ).toThrow()
    })

    it('should reject negative limits and offsets', () => {
      expect(() =>
        VideoLibraryQuerySchema.parse({
          limit: -1
        })
      ).toThrow()

      expect(() =>
        VideoLibraryQuerySchema.parse({
          offset: -1
        })
      ).toThrow()
    })
  })

  describe('Integration with real-world scenarios', () => {
    it('should handle video record lifecycle', () => {
      // 1. 创建新视频记录
      const newVideo = {
        fileId: 'video-123',
        playedAt: Date.now(),
        firstPlayedAt: Date.now()
      }

      const insertData = VideoLibraryInsertSchema.parse(newVideo)
      expect(insertData.currentTime).toBe(0)
      expect(insertData.isFinished).toBe(0)
      expect(insertData.isFavorite).toBe(0)

      // 2. 模拟从数据库读取
      const dbRecord = {
        id: 1,
        ...insertData,
        currentTime: 0,
        duration: 0,
        playCount: 0,
        isFinished: 0,
        isFavorite: 0,
        thumbnailPath: null
      }

      const selectData = VideoLibrarySelectSchema.parse(dbRecord)
      expect(selectData.isFinished).toBe(false)
      expect(selectData.isFavorite).toBe(false)

      // 3. 更新播放进度
      const progressUpdate = PlayProgressUpdateSchema.parse({
        currentTime: 1200,
        isFinished: false
      })

      expect(progressUpdate.currentTime).toBe(1200)
      expect(progressUpdate.isFinished).toBe(0)

      // 4. 标记为收藏
      const favoriteUpdate = VideoLibraryUpdateSchema.parse({
        isFavorite: true
      })

      expect(favoriteUpdate.isFavorite).toBe(1)
    })

    it('should handle edge cases', () => {
      // 测试空字符串处理
      const dataWithWhitespace = {
        fileId: '  test-file  ',
        playedAt: Date.now(),
        firstPlayedAt: Date.now()
      }

      const result = VideoLibraryInsertSchema.parse(dataWithWhitespace)
      expect(result.fileId).toBe('test-file') // 应该被trim

      // 测试边界值
      const boundaryData = {
        fileId: 'test',
        currentTime: 0,
        duration: Number.MAX_SAFE_INTEGER,
        playCount: 0,
        playedAt: Date.now(),
        firstPlayedAt: Date.now()
      }

      expect(() => VideoLibraryInsertSchema.parse(boundaryData)).not.toThrow()
    })
  })
})
