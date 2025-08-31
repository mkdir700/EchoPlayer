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

describe('Database Migrate', () => {
  const mockKysely = {} as Kysely<any>
  let mockMigrator: any
  let mockLogger: any

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

    // Mock fs
    vi.spyOn(fs, 'existsSync').mockReturnValue(true)
    vi.spyOn(fs, 'mkdirSync').mockImplementation(() => {})
    vi.spyOn(fs, 'writeFileSync').mockImplementation(() => {})
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
      expect(mockLogger.info).toHaveBeenCalledWith('[migrate] Starting database upgrade...')
      expect(mockLogger.info).toHaveBeenCalledWith('[migrate] upgrade successful: 20240101_init')
      expect(result).toEqual(mockResult)
    })

    it('应该处理升级失败', async () => {
      const error = new Error('Migration failed')
      mockMigrator.migrateToLatest.mockRejectedValue(error)

      await expect(upgradeDatabase()).rejects.toThrow('Migration failed')
      expect(mockLogger.error).toHaveBeenCalledWith('[migrate] Database upgrade failed:', { error })
    })

    it('应该处理没有迁移的情况', async () => {
      const mockResult: MigrationResultSet = {
        error: undefined,
        results: []
      }
      mockMigrator.migrateToLatest.mockResolvedValue(mockResult)

      const result = await upgradeDatabase()

      expect(mockLogger.info).toHaveBeenCalledWith('[migrate] No migrations to upgrade')
      expect(result).toEqual(mockResult)
    })

    it('应该记录迁移错误', async () => {
      const mockResult: MigrationResultSet = {
        error: undefined,
        results: [
          {
            status: 'Error',
            migrationName: '20240101_init',
            direction: 'Up',
            error: new Error('SQL Error')
          }
        ]
      }
      mockMigrator.migrateToLatest.mockResolvedValue(mockResult)

      const result = await upgradeDatabase()

      expect(mockLogger.error).toHaveBeenCalledWith('[migrate] upgrade failed: 20240101_init', {
        error: expect.any(Error)
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
      expect(mockLogger.info).toHaveBeenCalledWith('[migrate] Starting database downgrade...')
      expect(result).toEqual(mockResult)
    })

    it('应该回退一个版本', async () => {
      const mockMigrations: MigrationInfo[] = [
        { name: '20240101_init', executedAt: new Date('2024-01-01') },
        { name: '20240102_update', executedAt: new Date('2024-01-02') }
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

      expect(mockLogger.warn).toHaveBeenCalledWith('[migrate] No migrations to rollback')
      expect(mockMigrator.migrateTo).not.toHaveBeenCalled()
      expect(result).toEqual(mockResult)
    })

    it('应该回退到NO_MIGRATIONS如果只有一个迁移', async () => {
      const mockMigrations: MigrationInfo[] = [
        { name: '20240101_init', executedAt: new Date('2024-01-01') }
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
        { name: '20240101_init', executedAt: new Date('2024-01-01') },
        { name: '20240102_update', executedAt: null }
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
      const mockMigrations: MigrationInfo[] = [
        { name: '20240101_init', executedAt: new Date('2024-01-01') },
        { name: '20240102_update', executedAt: null }
      ]
      mockMigrator.getMigrations.mockResolvedValue(mockMigrations)

      const isValid = await validateMigrations()

      expect(isValid).toBe(true)
      expect(mockLogger.info).toHaveBeenCalledWith('[migrate] All migrations are valid')
    })

    it('应该检测无效的迁移名称', async () => {
      const mockMigrations: MigrationInfo[] = [
        { name: '', executedAt: null },
        { name: '20240102_update', executedAt: null }
      ]
      mockMigrator.getMigrations.mockResolvedValue(mockMigrations)

      const isValid = await validateMigrations()

      expect(isValid).toBe(false)
      expect(mockLogger.error).toHaveBeenCalledWith('[migrate] Invalid migration name: ')
    })

    it('应该处理验证异常', async () => {
      const error = new Error('Validation error')
      mockMigrator.getMigrations.mockRejectedValue(error)

      const isValid = await validateMigrations()

      expect(isValid).toBe(false)
      expect(mockLogger.error).toHaveBeenCalledWith('[migrate] Migration validation failed:', {
        error
      })
    })
  })

  describe('createMigration', () => {
    beforeEach(() => {
      vi.spyOn(Date.prototype, 'toISOString').mockReturnValue('2024-01-01T12:00:00.000Z')
    })

    it('应该创建新的迁移文件', () => {
      const migrationsDir = path.join(__dirname, '..', 'migrations')
      const expectedFilename = '2024-01-01T12-00-00-000Z_test_migration.ts'
      const expectedPath = path.join(migrationsDir, expectedFilename)

      const result = createMigration('test migration')

      expect(fs.writeFileSync).toHaveBeenCalledWith(
        expectedPath,
        expect.stringContaining('Migration: test migration'),
        'utf-8'
      )
      expect(mockLogger.info).toHaveBeenCalledWith(
        `[migrate] Created migration file: ${expectedFilename}`
      )
      expect(result).toBe(expectedPath)
    })

    it('应该处理名称中的空格', () => {
      const migrationsDir = path.join(__dirname, '..', 'migrations')
      const expectedFilename = '2024-01-01T12-00-00-000Z_multiple_words_migration.ts'
      const expectedPath = path.join(migrationsDir, expectedFilename)

      const result = createMigration('multiple words migration')

      expect(fs.writeFileSync).toHaveBeenCalledWith(expectedPath, expect.any(String), 'utf-8')
      expect(result).toBe(expectedPath)
    })

    it('应该生成正确的模板内容', () => {
      createMigration('test migration')

      const [[, template]] = vi.mocked(fs.writeFileSync).mock.calls
      expect(template).toContain('Migration: test migration')
      expect(template).toContain('export async function up(db: Kysely<any>)')
      expect(template).toContain('export async function down(db: Kysely<any>)')
      expect(template).toContain('Created: 2024-01-01T12:00:00.000Z')
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
