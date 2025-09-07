import fs from 'node:fs'
import path from 'node:path'

import type { Kysely, MigrationInfo, MigrationResultSet } from 'kysely'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  createMigration,
  downgradeDatabase,
  getMigrationStatus,
  runMigrations,
  upgradeDatabase,
  validateMigrations
} from '../migrate'

// Mock dependencies
vi.mock('@main/services/LoggerService', () => {
  const mockLogger = {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn()
  }

  return {
    loggerService: {
      withContext: vi.fn(() => mockLogger)
    },
    __mockLogger: mockLogger // 导出 mock logger 供测试使用
  }
})

vi.mock('../index', () => ({
  openDatabase: vi.fn(),
  getKysely: vi.fn()
}))

// Mock electron
vi.mock('electron', () => ({
  app: {
    isPackaged: false,
    getPath: vi.fn((name: string) => {
      if (name === 'userData') {
        return '/tmp/test-userData'
      }
      return '/tmp'
    }),
    getAppPath: vi.fn(() => '/tmp/app-path')
  }
}))

// Mock kysely - 需要在mock内部定义mockMigrator
vi.mock('kysely', async () => {
  const actual = await vi.importActual('kysely')
  const mockMigrator = {
    migrateToLatest: vi.fn(),
    migrateTo: vi.fn(),
    getMigrations: vi.fn()
  }
  return {
    ...actual,
    Migrator: vi.fn(() => mockMigrator),
    FileMigrationProvider: vi.fn(),
    __mockMigrator: mockMigrator // 导出mock实例供测试使用
  }
})

// Mock node:fs (包括 promises)
vi.mock('node:fs', () => {
  const mockPromises = {
    writeFile: vi.fn().mockResolvedValue(undefined),
    readFile: vi.fn()
  }
  return {
    default: {
      existsSync: vi.fn(),
      mkdirSync: vi.fn(),
      writeFileSync: vi.fn(),
      readdirSync: vi.fn(),
      promises: mockPromises
    },
    promises: mockPromises
  }
})

describe('Database Migrate', () => {
  const mockKysely = {} as Kysely<any>
  let mockMigrator: any
  let mockLogger: any
  let mockFsPromises: any

  beforeEach(async () => {
    vi.clearAllMocks()

    // 获取mock migrator实例
    const kyselyMock = await import('kysely')
    mockMigrator = (kyselyMock as any).__mockMigrator

    // 获取 mock logger 实例
    const loggerServiceMock = await import('@main/services/LoggerService')
    mockLogger = (loggerServiceMock as any).__mockLogger

    const indexModule = await import('../index')
    vi.mocked(indexModule.getKysely).mockReturnValue(mockKysely)
    vi.mocked(indexModule.openDatabase).mockReturnValue(mockKysely)

    // 获取mock fs.promises实例
    const { promises } = await import('node:fs')
    mockFsPromises = promises

    // Setup fs mocks
    vi.mocked(fs.existsSync).mockReturnValue(false) // 默认文件不存在
    vi.mocked(fs.mkdirSync).mockImplementation(() => undefined)
    vi.mocked(fs.writeFileSync).mockImplementation(() => {})
    vi.mocked(fs.readdirSync).mockReturnValue([]) // 默认目录为空

    // 重置fs.promises mocks
    vi.mocked(mockFsPromises.writeFile).mockResolvedValue(undefined)
    vi.mocked(mockFsPromises.readFile).mockResolvedValue('')
  })

  describe('upgradeDatabase', () => {
    it('应该成功升级数据库', async () => {
      const mockResult: MigrationResultSet = {
        error: undefined,
        results: [{ status: 'Success', migrationName: '20240101_init', direction: 'Up' }]
      }
      mockMigrator.migrateToLatest.mockResolvedValue(mockResult)

      const result = await upgradeDatabase()

      expect(mockMigrator.migrateToLatest).toHaveBeenCalledTimes(1)
      expect(mockLogger.info).toHaveBeenCalledWith('Starting database upgrade...')
      expect(mockLogger.info).toHaveBeenCalledWith('upgrade successful: 20240101_init')
      expect(result).toEqual(mockResult)
    })

    it('应该处理升级失败', async () => {
      const error = new Error('Migration failed')
      mockMigrator.migrateToLatest.mockRejectedValue(error)

      await expect(upgradeDatabase()).rejects.toThrow('Migration failed')
      // Note: error logging happens in the migrateUp method, not upgradeDatabase wrapper
    })

    it('应该处理没有迁移的情况', async () => {
      const mockResult: MigrationResultSet = {
        error: undefined,
        results: []
      }
      mockMigrator.migrateToLatest.mockResolvedValue(mockResult)

      const result = await upgradeDatabase()

      expect(mockLogger.info).toHaveBeenCalledWith('Starting database upgrade...')
      expect(mockLogger.info).toHaveBeenCalledWith('No migrations to upgrade')
      expect(result).toEqual(mockResult)
    })

    it('应该记录迁移错误', async () => {
      const mockResult: MigrationResultSet = {
        error: undefined,
        results: [
          {
            status: 'Error',
            migrationName: '20240101_init',
            direction: 'Up'
            // error: new Error('SQL Error') // error 不是 MigrationResult 的有效属性
          }
        ]
      }
      mockMigrator.migrateToLatest.mockResolvedValue(mockResult)

      const result = await upgradeDatabase()

      expect(mockLogger.error).toHaveBeenCalledWith('upgrade failed: 20240101_init', {
        error: undefined
      })
      expect(result).toEqual(mockResult)
    })
  })

  describe('downgradeDatabase', () => {
    it('应该回退到指定迁移', async () => {
      const mockResult: MigrationResultSet = {
        error: undefined,
        results: [{ status: 'Success', migrationName: '20240102_update', direction: 'Down' }]
      }
      mockMigrator.migrateTo.mockResolvedValue(mockResult)

      const result = await downgradeDatabase('20240101_init')

      expect(mockMigrator.migrateTo).toHaveBeenCalledWith('20240101_init')
      expect(mockLogger.info).toHaveBeenCalledWith('downgrade successful: 20240102_update')
      expect(result).toEqual(mockResult)
    })

    it('应该回退一个版本', async () => {
      const mockMigrations: MigrationInfo[] = [
        { name: '20240101_init', executedAt: new Date('2024-01-01'), migration: {} as any },
        { name: '20240102_update', executedAt: new Date('2024-01-02'), migration: {} as any }
      ]
      const mockResult: MigrationResultSet = {
        error: undefined,
        results: []
      }

      mockMigrator.getMigrations.mockResolvedValue(mockMigrations)
      mockMigrator.migrateTo.mockResolvedValue(mockResult)

      const result = await downgradeDatabase()

      expect(mockMigrator.getMigrations).toHaveBeenCalledTimes(1)
      expect(mockMigrator.migrateTo).toHaveBeenCalledWith('20240101_init')
      expect(result).toEqual(mockResult)
    })

    it('应该处理没有可回退的迁移', async () => {
      const mockMigrations: MigrationInfo[] = []
      const mockResult: MigrationResultSet = {
        error: undefined,
        results: []
      }

      mockMigrator.getMigrations.mockResolvedValue(mockMigrations)

      const result = await downgradeDatabase()

      expect(mockLogger.warn).toHaveBeenCalledWith('No migrations to rollback')
      expect(mockMigrator.migrateTo).not.toHaveBeenCalled()
      expect(result).toEqual(mockResult)
    })

    it('应该回退到NO_MIGRATIONS如果只有一个迁移', async () => {
      const mockMigrations: MigrationInfo[] = [
        { name: '20240101_init', executedAt: new Date('2024-01-01'), migration: {} as any }
      ]
      const mockResult: MigrationResultSet = {
        error: undefined,
        results: []
      }

      mockMigrator.getMigrations.mockResolvedValue(mockMigrations)
      mockMigrator.migrateTo.mockResolvedValue(mockResult)

      const result = await downgradeDatabase()

      expect(mockMigrator.migrateTo).toHaveBeenCalledWith('NO_MIGRATIONS')
      expect(result).toEqual(mockResult)
    })
  })

  describe('getMigrationStatus', () => {
    it('应该返回迁移状态', async () => {
      const mockMigrations: MigrationInfo[] = [
        { name: '20240101_init', executedAt: new Date('2024-01-01'), migration: {} as any },
        { name: '20240102_update', executedAt: undefined, migration: {} as any }
      ]
      mockMigrator.getMigrations.mockResolvedValue(mockMigrations)

      const status = await getMigrationStatus()

      expect(status.executed).toHaveLength(1)
      expect(status.pending).toHaveLength(1)
      expect(status.all).toHaveLength(2)
      expect(status.executed[0].name).toBe('20240101_init')
      expect(status.pending[0].name).toBe('20240102_update')
    })

    it('应该处理空迁移列表', async () => {
      mockMigrator.getMigrations.mockResolvedValue([])

      const status = await getMigrationStatus()

      expect(status.executed).toHaveLength(0)
      expect(status.pending).toHaveLength(0)
      expect(status.all).toHaveLength(0)
    })
  })

  describe('validateMigrations', () => {
    it('应该验证所有迁移有效', async () => {
      // Mock一个存在的迁移目录 - 使用与 mock getPath 返回值匹配的路径
      const migrationsDir = path.join('/tmp/test-userData', 'db', 'migrations')
      vi.mocked(fs.existsSync).mockImplementation((pathStr) => {
        return pathStr === migrationsDir
      })
      vi.mocked(fs.readdirSync).mockImplementation((pathStr) => {
        if (pathStr === migrationsDir) {
          return ['20240101000000_init.ts', '20240102000000_update.ts'] as any
        }
        return []
      })

      // Mock file content reading - simulate valid migration content
      vi.mocked(mockFsPromises.readFile).mockResolvedValue(
        'export async function up(db) { /* migration logic */ }\nexport async function down(db) { /* rollback logic */ }'
      )

      const result = await validateMigrations()
      expect(result.valid).toBe(true)
    })

    it('应该检测无效的迁移名称', async () => {
      // Mock一个存在的迁移目录但包含无效文件 - 使用与 mock getPath 返回值匹配的路径
      const migrationsDir = path.join('/tmp/test-userData', 'db', 'migrations')
      vi.mocked(fs.existsSync).mockImplementation((pathStr) => {
        return pathStr === migrationsDir
      })
      vi.mocked(fs.readdirSync).mockImplementation((pathStr) => {
        if (pathStr === migrationsDir) {
          return ['invalid_migration.ts', '20240102000000_update.ts'] as any
        }
        return []
      })

      const result = await validateMigrations()
      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.includes('Invalid migration file name format'))).toBe(true)
    })

    it('应该处理验证异常', async () => {
      // Mock directory doesn't exist
      vi.mocked(fs.existsSync).mockReturnValue(false)

      const result = await validateMigrations()
      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors.some((e) => e.includes('Migrations directory does not exist'))).toBe(
        true
      )
    })
  })

  describe('createMigration', () => {
    beforeEach(() => {
      vi.spyOn(Date.prototype, 'toISOString').mockReturnValue('2024-01-01T12:00:00.000Z')
      // 对于 createMigration 测试，确保文件不存在
      vi.mocked(fs.existsSync).mockReturnValue(false)
    })

    it('应该创建新的迁移文件', async () => {
      // 使用fallback路径 - 使用与 mock getPath 返回值匹配的路径
      const migrationsDir = path.join('/tmp/test-userData', 'db', 'migrations')
      const expectedFilename = '20240101120000_test_migration.js'
      const expectedPath = path.join(migrationsDir, expectedFilename)

      await createMigration('test migration')

      expect(vi.mocked(mockFsPromises.writeFile)).toHaveBeenCalledWith(
        expectedPath,
        expect.stringContaining('Migration: test migration'),
        'utf-8'
      )
      expect(mockLogger.info).toHaveBeenCalledWith(
        `Created migration file: ${expectedFilename}`,
        expect.any(Object)
      )
      // createMigration returns void, no result to check
    })

    it('应该处理名称中的空格', async () => {
      // 使用fallback路径 - 使用与 mock getPath 返回值匹配的路径
      const migrationsDir = path.join('/tmp/test-userData', 'db', 'migrations')
      const expectedFilename = '20240101120000_multiple_words_migration.js'
      const expectedPath = path.join(migrationsDir, expectedFilename)

      await createMigration('multiple words migration')

      expect(vi.mocked(mockFsPromises.writeFile)).toHaveBeenCalledWith(
        expectedPath,
        expect.any(String),
        'utf-8'
      )
      // createMigration returns void, no result to check
    })

    it('应该生成正确的模板内容', async () => {
      await createMigration('test migration')

      const [[, template]] = vi.mocked(mockFsPromises.writeFile).mock.calls
      expect(template).toContain('Migration: test migration')
      expect(template).toContain('export async function up(db)')
      expect(template).toContain('export async function down(db)')
    })
  })

  describe('runMigrations', () => {
    it('应该调用upgradeDatabase', async () => {
      const mockResult: MigrationResultSet = {
        error: undefined,
        results: []
      }
      mockMigrator.migrateToLatest.mockResolvedValue(mockResult)

      await runMigrations()

      expect(mockMigrator.migrateToLatest).toHaveBeenCalledTimes(1)
    })

    it('应该传播升级错误', async () => {
      const error = new Error('Migration failed')
      mockMigrator.migrateToLatest.mockRejectedValue(error)

      await expect(runMigrations()).rejects.toThrow('Migration failed')
    })
  })
})
