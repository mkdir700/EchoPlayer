import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import Database from 'better-sqlite3'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { closeDatabase, getDbPaths, getKysely, openDatabase } from '../index'

// Mock electron app.getPath
vi.mock('electron', () => ({
  app: {
    getPath: vi.fn((type: string) => {
      if (type === 'userData') {
        return path.join(os.tmpdir(), 'test-echoplayer')
      }
      return os.tmpdir()
    })
  }
}))

// Mock better-sqlite3
vi.mock('better-sqlite3')

describe('Database Index', () => {
  const mockSqlite = {
    pragma: vi.fn(),
    close: vi.fn()
  }

  beforeAll(() => {
    // Setup mock for Database constructor
    vi.mocked(Database).mockImplementation(() => mockSqlite as any)
  })

  beforeEach(() => {
    // Reset environment
    delete process.env.NODE_ENV

    // Clear mocks
    vi.clearAllMocks()

    // Reset database instances
    closeDatabase()

    // 重新设置 Database mock 在每个测试之前
    vi.mocked(Database).mockImplementation(() => mockSqlite as any)
  })

  afterEach(() => {
    closeDatabase()
  })

  describe('getDbPaths', () => {
    it('应该返回开发环境的数据库路径', () => {
      process.env.NODE_ENV = 'development'

      const paths = getDbPaths()

      expect(paths.dbFile).toContain('app-dev.sqlite3')
      expect(paths.dbDir).toContain(path.join('test-echoplayer', 'data'))
      expect(paths.backupDir).toContain(path.join('test-echoplayer', 'data', 'backup'))
    })

    it('应该返回生产环境的数据库路径', () => {
      process.env.NODE_ENV = 'production'

      const paths = getDbPaths()

      expect(paths.dbFile).toContain('app.sqlite3')
      expect(paths.dbDir).toContain(path.join('test-echoplayer', 'data'))
      expect(paths.backupDir).toContain(path.join('test-echoplayer', 'data', 'backup'))
    })

    it('应该在未设置NODE_ENV时使用生产环境路径', () => {
      const paths = getDbPaths()

      expect(paths.dbFile).toContain('app.sqlite3')
    })
  })

  describe('openDatabase', () => {
    let mkdirSyncSpy: any
    let existsSyncSpy: any

    beforeEach(() => {
      mkdirSyncSpy = vi.spyOn(fs, 'mkdirSync').mockImplementation(() => undefined)
      existsSyncSpy = vi.spyOn(fs, 'existsSync').mockReturnValue(false)

      // 确保 Database constructor 返回正确的 mock
      vi.mocked(Database).mockImplementation(() => mockSqlite as any)
    })

    it('应该创建数据库目录如果不存在', () => {
      openDatabase()

      expect(mkdirSyncSpy).toHaveBeenCalledWith(expect.stringContaining('data'), {
        recursive: true
      })
      expect(mkdirSyncSpy).toHaveBeenCalledWith(expect.stringContaining('backup'), {
        recursive: true
      })
    })

    it('应该不创建目录如果已存在', () => {
      existsSyncSpy.mockReturnValue(true)

      openDatabase()

      expect(mkdirSyncSpy).not.toHaveBeenCalled()
    })

    it('应该配置SQLite PRAGMA设置', () => {
      openDatabase()

      expect(Database).toHaveBeenCalledTimes(1)
      expect(mockSqlite.pragma).toHaveBeenCalledWith('journal_mode = WAL')
      expect(mockSqlite.pragma).toHaveBeenCalledWith('synchronous = normal')
      expect(mockSqlite.pragma).toHaveBeenCalledWith('foreign_keys = ON')
      expect(mockSqlite.pragma).toHaveBeenCalledWith('busy_timeout = 5000')
      expect(mockSqlite.pragma).toHaveBeenCalledWith('temp_store = memory')
      expect(mockSqlite.pragma).toHaveBeenCalledWith('cache_size = -16000')
    })

    it('应该返回Kysely实例', () => {
      const kysely = openDatabase()

      expect(kysely).toBeDefined()
      expect(typeof kysely.selectFrom).toBe('function')
    })

    it('应该复用已存在的连接', () => {
      const kysely1 = openDatabase()
      const kysely2 = openDatabase()

      expect(kysely1).toBe(kysely2)
      expect(Database).toHaveBeenCalledTimes(1)
    })
  })

  describe('getKysely', () => {
    it('应该打开数据库如果未初始化', () => {
      const kysely = getKysely()

      expect(kysely).toBeDefined()
      expect(Database).toHaveBeenCalledTimes(1)
    })

    it('应该返回已存在的连接', () => {
      const kysely1 = getKysely()
      const kysely2 = getKysely()

      expect(kysely1).toBe(kysely2)
      expect(Database).toHaveBeenCalledTimes(1)
    })
  })

  describe('closeDatabase', () => {
    it('应该关闭数据库连接', () => {
      const kysely = openDatabase()
      const destroySpy = vi.spyOn(kysely, 'destroy').mockResolvedValue()

      closeDatabase()

      expect(destroySpy).toHaveBeenCalled()
      expect(mockSqlite.close).toHaveBeenCalled()
    })

    it('应该处理未初始化的数据库', () => {
      expect(() => closeDatabase()).not.toThrow()
    })

    it('应该在关闭后重新初始化数据库', () => {
      const kysely1 = openDatabase()
      closeDatabase()
      const kysely2 = openDatabase()

      expect(kysely1).not.toBe(kysely2)
      expect(Database).toHaveBeenCalledTimes(2)
    })
  })
})
