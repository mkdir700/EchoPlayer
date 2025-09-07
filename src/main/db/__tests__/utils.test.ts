import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import type { MigrationInfo, MigrationResultSet } from 'kysely'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  DatabaseBackup,
  DatabaseMigrationManager,
  dbBackup,
  dbMigrationManager,
  performHealthCheck
} from '../utils'

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
    __mockLogger: mockLogger
  }
})

vi.mock('../index', () => ({
  getDbPaths: vi.fn(() => ({
    dbDir: path.join(os.tmpdir(), 'test-echoplayer', 'data'),
    dbFile: path.join(os.tmpdir(), 'test-echoplayer', 'data', 'app.sqlite3'),
    backupDir: path.join(os.tmpdir(), 'test-echoplayer', 'data', 'backup')
  }))
}))

vi.mock('../migrate', () => ({
  upgradeDatabase: vi.fn(),
  downgradeDatabase: vi.fn(),
  getMigrationStatus: vi.fn(),
  validateMigrations: vi.fn()
}))

// Mock fs module
vi.mock('node:fs', () => ({
  default: {
    existsSync: vi.fn(),
    mkdirSync: vi.fn(),
    copyFileSync: vi.fn(),
    readdirSync: vi.fn(),
    unlinkSync: vi.fn()
  }
}))

describe('Database Utils', () => {
  let mockLogger: any

  beforeEach(async () => {
    vi.clearAllMocks()

    // 获取 mock logger 实例
    const loggerServiceMock = await import('@main/services/LoggerService')
    mockLogger = (loggerServiceMock as any).__mockLogger

    // Setup fs mocks
    vi.mocked(fs.existsSync).mockReturnValue(true)
    vi.mocked(fs.mkdirSync).mockImplementation(() => undefined)
    vi.mocked(fs.copyFileSync).mockImplementation(() => {})
    vi.mocked(fs.readdirSync).mockReturnValue([])
    vi.mocked(fs.unlinkSync).mockImplementation(() => {})

    // Reset Date mock
    vi.spyOn(Date.prototype, 'toISOString').mockReturnValue('2024-01-01T12-00-00-000Z')
  })

  // Helper function to get migrate module mocks
  const getMigrateMocks = async () => {
    const migrateModule = await import('../migrate')
    return {
      validateMigrations: vi.mocked(migrateModule.validateMigrations),
      upgradeDatabase: vi.mocked(migrateModule.upgradeDatabase),
      downgradeDatabase: vi.mocked(migrateModule.downgradeDatabase),
      getMigrationStatus: vi.mocked(migrateModule.getMigrationStatus)
    }
  }

  describe('DatabaseBackup', () => {
    let backup: DatabaseBackup

    beforeEach(() => {
      backup = new DatabaseBackup()
    })

    describe('constructor', () => {
      it('应该创建备份目录如果不存在', () => {
        vi.mocked(fs.existsSync).mockReturnValue(false)

        new DatabaseBackup()

        expect(fs.mkdirSync).toHaveBeenCalledWith(expect.stringContaining('backup'), {
          recursive: true
        })
      })

      it('应该不创建目录如果已存在', () => {
        vi.mocked(fs.existsSync).mockReturnValue(true)

        new DatabaseBackup()

        expect(fs.mkdirSync).not.toHaveBeenCalled()
      })
    })

    describe('createBackup', () => {
      it('应该成功创建备份', async () => {
        const backupPath = await backup.createBackup()

        expect(fs.copyFileSync).toHaveBeenCalledWith(
          expect.stringContaining('app.sqlite3'),
          expect.stringContaining('backup_2024-01-01T12-00-00-000Z.sqlite3')
        )
        expect(mockLogger.info).toHaveBeenCalledWith(
          expect.stringContaining('Database backed up to:')
        )
        expect(backupPath).toContain('backup_2024-01-01T12-00-00-000Z.sqlite3')
      })

      it('应该使用标签创建备份', async () => {
        const backupPath = await backup.createBackup('test-label')

        expect(backupPath).toContain('backup_test-label_2024-01-01T12-00-00-000Z.sqlite3')
      })

      it('应该处理数据库文件不存在的情况', async () => {
        vi.mocked(fs.existsSync).mockReturnValue(false)

        await expect(backup.createBackup()).rejects.toThrow('Database file does not exist')
        expect(mockLogger.error).toHaveBeenCalledWith('[backup] Failed to create backup:', {
          error: expect.any(Error)
        })
      })

      it('应该处理文件复制失败', async () => {
        vi.mocked(fs.copyFileSync).mockImplementation(() => {
          throw new Error('Copy failed')
        })

        await expect(backup.createBackup()).rejects.toThrow('Copy failed')
        expect(mockLogger.error).toHaveBeenCalledWith('[backup] Failed to create backup:', {
          error: expect.any(Error)
        })
      })
    })

    describe('restoreBackup', () => {
      beforeEach(() => {
        vi.spyOn(backup, 'createBackup').mockResolvedValue('pre-restore-backup-path')
      })

      it('应该成功恢复备份', async () => {
        await backup.restoreBackup('backup_2024-01-01.sqlite3')

        expect(backup.createBackup).toHaveBeenCalledWith('pre-restore')
        expect(fs.copyFileSync).toHaveBeenCalledWith(
          expect.stringContaining('backup_2024-01-01.sqlite3'),
          expect.stringContaining('app.sqlite3')
        )
        expect(mockLogger.info).toHaveBeenCalledWith(
          expect.stringContaining('Database restored from:')
        )
      })

      it('应该处理备份文件不存在', async () => {
        vi.mocked(fs.existsSync).mockReturnValue(false)

        await expect(backup.restoreBackup('nonexistent.sqlite3')).rejects.toThrow(
          'Backup file not found:'
        )
        expect(mockLogger.error).toHaveBeenCalledWith('[backup] Failed to restore backup:', {
          error: expect.any(Error)
        })
      })
    })

    describe('listBackups', () => {
      it('应该返回排序的备份列表', () => {
        vi.mocked(fs.readdirSync).mockReturnValue([
          'backup_2024-01-01.sqlite3',
          'backup_2024-01-03.sqlite3',
          'backup_2024-01-02.sqlite3',
          'other-file.txt'
        ] as any)

        const backups = backup.listBackups()

        expect(backups).toEqual([
          'backup_2024-01-03.sqlite3',
          'backup_2024-01-02.sqlite3',
          'backup_2024-01-01.sqlite3'
        ])
      })

      it('应该处理读取目录失败', () => {
        vi.mocked(fs.readdirSync).mockImplementation(() => {
          throw new Error('Read failed')
        })

        const backups = backup.listBackups()

        expect(backups).toEqual([])
        expect(mockLogger.error).toHaveBeenCalledWith('[backup] Failed to list backups:', {
          error: expect.any(Error)
        })
      })
    })

    describe('cleanupOldBackups', () => {
      it('应该删除旧备份', () => {
        const backupFiles = Array.from({ length: 15 }, (_, i) => `backup_${i}.sqlite3`)
        vi.spyOn(backup, 'listBackups').mockReturnValue(backupFiles)

        backup.cleanupOldBackups(10)

        expect(fs.unlinkSync).toHaveBeenCalledTimes(5)
        expect(mockLogger.info).toHaveBeenCalledTimes(5)
      })

      it('应该保留指定数量的备份', () => {
        const backupFiles = ['backup_1.sqlite3', 'backup_2.sqlite3']
        vi.spyOn(backup, 'listBackups').mockReturnValue(backupFiles)

        backup.cleanupOldBackups(5)

        expect(fs.unlinkSync).not.toHaveBeenCalled()
      })

      it('应该处理删除失败', () => {
        const backupFiles = Array.from({ length: 15 }, (_, i) => `backup_${i}.sqlite3`)
        vi.spyOn(backup, 'listBackups').mockReturnValue(backupFiles)
        vi.mocked(fs.unlinkSync).mockImplementation(() => {
          throw new Error('Delete failed')
        })

        expect(() => backup.cleanupOldBackups(10)).not.toThrow()
        expect(mockLogger.error).toHaveBeenCalledWith('[backup] Failed to cleanup old backups:', {
          error: expect.any(Error)
        })
      })
    })
  })

  describe('DatabaseMigrationManager', () => {
    let migrationManager: DatabaseMigrationManager

    beforeEach(() => {
      migrationManager = new DatabaseMigrationManager()
    })

    describe('safeUpgrade', () => {
      it('应该成功执行安全升级', async () => {
        const mockResult: MigrationResultSet = {
          error: undefined,
          results: [{ status: 'Success', migrationName: '20240101_init', direction: 'Up' }]
        }

        const { validateMigrations, upgradeDatabase } = await getMigrateMocks()
        validateMigrations.mockResolvedValue({
          valid: true,
          errors: [],
          warnings: [],
          migrations: []
        })
        vi.spyOn(migrationManager['backup'], 'createBackup').mockResolvedValue('backup-path')
        upgradeDatabase.mockResolvedValue(mockResult)

        const result = await migrationManager.safeUpgrade()

        expect(result.success).toBe(true)
        expect(result.backupPath).toBe('backup-path')
        expect(result.result).toEqual(mockResult)
        expect(mockLogger.info).toHaveBeenCalledWith(
          '[migration] Starting safe database upgrade...'
        )
        expect(mockLogger.info).toHaveBeenCalledWith(
          '[migration] Safe database upgrade completed successfully'
        )
      })

      it('应该处理升级失败', async () => {
        const error = new Error('Upgrade failed')

        const { validateMigrations } = await getMigrateMocks()
        validateMigrations.mockResolvedValue({
          valid: true,
          errors: [],
          warnings: [],
          migrations: []
        })
        vi.spyOn(migrationManager['backup'], 'createBackup').mockResolvedValue('backup-path')
        const { upgradeDatabase } = await getMigrateMocks()
        upgradeDatabase.mockRejectedValue(error)

        const result = await migrationManager.safeUpgrade()

        expect(result.success).toBe(false)
        expect(result.error).toBe(error)
        expect(mockLogger.error).toHaveBeenCalledWith('[migration] Safe database upgrade failed:', {
          error
        })
      })
    })

    describe('safeDowngrade', () => {
      it('应该成功执行安全降级', async () => {
        const mockResult: MigrationResultSet = {
          error: undefined,
          results: [{ status: 'Success', migrationName: '20240102_update', direction: 'Down' }]
        }

        vi.spyOn(migrationManager['backup'], 'createBackup').mockResolvedValue('backup-path')
        const { downgradeDatabase } = await getMigrateMocks()
        downgradeDatabase.mockResolvedValue(mockResult)

        const result = await migrationManager.safeDowngrade('20240101_init')

        expect(result.success).toBe(true)
        expect(result.backupPath).toBe('backup-path')
        expect(result.result).toEqual(mockResult)
        expect(downgradeDatabase).toHaveBeenCalledWith('20240101_init')
      })

      it('应该处理降级失败', async () => {
        const error = new Error('Downgrade failed')

        vi.spyOn(migrationManager['backup'], 'createBackup').mockResolvedValue('backup-path')
        const { downgradeDatabase } = await getMigrateMocks()
        downgradeDatabase.mockRejectedValue(error)

        const result = await migrationManager.safeDowngrade()

        expect(result.success).toBe(false)
        expect(result.error).toBe(error)
      })
    })

    describe('getDetailedStatus', () => {
      it('应该返回详细状态信息', async () => {
        const mockMigrations: MigrationInfo[] = [
          { name: '20240101_init', executedAt: new Date('2024-01-01'), migration: {} as any },
          { name: '20240102_update', executedAt: undefined, migration: {} as any }
        ]
        const mockStatus = {
          executed: [mockMigrations[0]],
          pending: [mockMigrations[1]],
          all: mockMigrations
        }
        const mockBackups = ['backup_1.sqlite3', 'backup_2.sqlite3']

        const { getMigrationStatus } = await getMigrateMocks()
        getMigrationStatus.mockResolvedValue(mockStatus)
        vi.spyOn(migrationManager['backup'], 'listBackups').mockReturnValue(mockBackups)

        const status = await migrationManager.getDetailedStatus()

        expect(status.migrations.executed).toBe(1)
        expect(status.migrations.pending).toBe(1)
        expect(status.migrations.total).toBe(2)
        expect(status.backups.count).toBe(2)
        expect(status.backups.latest).toBe('backup_1.sqlite3')
      })
    })

    describe('emergencyRollback', () => {
      it('应该执行紧急回滚', async () => {
        const mockBackups = ['backup_latest.sqlite3', 'backup_old.sqlite3']
        vi.spyOn(migrationManager['backup'], 'listBackups').mockReturnValue(mockBackups)
        vi.spyOn(migrationManager['backup'], 'restoreBackup').mockResolvedValue()

        await migrationManager.emergencyRollback()

        expect(migrationManager['backup'].restoreBackup).toHaveBeenCalledWith(
          'backup_latest.sqlite3'
        )
        expect(mockLogger.warn).toHaveBeenCalledWith(
          '[migration] Performing emergency rollback to latest backup'
        )
      })

      it('应该处理没有备份的情况', async () => {
        vi.spyOn(migrationManager['backup'], 'listBackups').mockReturnValue([])

        await expect(migrationManager.emergencyRollback()).rejects.toThrow(
          'No backups available for emergency rollback'
        )
      })
    })
  })

  describe('performHealthCheck', () => {
    beforeEach(async () => {
      const { getMigrationStatus, validateMigrations } = await getMigrateMocks()
      getMigrationStatus.mockResolvedValue({
        executed: [],
        pending: [],
        all: []
      })
      validateMigrations.mockResolvedValue({
        valid: true,
        errors: [],
        warnings: [],
        migrations: []
      })
      vi.spyOn(dbBackup, 'listBackups').mockReturnValue([])
    })

    it('应该返回健康状态', async () => {
      const health = await performHealthCheck()

      expect(health.healthy).toBe(true)
      expect(health.issues).toHaveLength(0)
      expect(health.recommendations).toContain('Create a database backup for safety')
    })

    it('应该检测数据库文件不存在', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false)

      const health = await performHealthCheck()

      expect(health.healthy).toBe(false)
      expect(health.issues).toContain('Database file does not exist')
      expect(health.recommendations).toContain('Run database migrations to initialize')
    })

    it('应该检测待执行的迁移', async () => {
      const mockMigrations: MigrationInfo[] = [
        { name: '20240101_init', executedAt: undefined, migration: {} as any },
        { name: '20240102_update', executedAt: undefined, migration: {} as any }
      ]
      const { getMigrationStatus } = await getMigrateMocks()
      getMigrationStatus.mockResolvedValue({
        executed: [],
        pending: mockMigrations,
        all: mockMigrations
      })

      const health = await performHealthCheck()

      expect(health.healthy).toBe(false)
      expect(health.issues).toContain('2 pending migrations')
      expect(health.recommendations).toContain(
        'Run "npm run migrate:up" to apply pending migrations'
      )
    })

    it('应该建议清理旧备份', async () => {
      const manyBackups = Array.from({ length: 25 }, (_, i) => `backup_${i}.sqlite3`)
      vi.spyOn(dbBackup, 'listBackups').mockReturnValue(manyBackups)

      const health = await performHealthCheck()

      expect(health.recommendations).toContain('Consider cleaning up old backups')
    })

    it('应该处理健康检查失败', async () => {
      const { getMigrationStatus } = await getMigrateMocks()
      getMigrationStatus.mockRejectedValue(new Error('Check failed'))

      const health = await performHealthCheck()

      expect(health.healthy).toBe(false)
      expect(health.issues).toContain('Health check failed: Check failed')
      expect(health.recommendations).toContain('Check database connection and permissions')
    })
  })

  describe('单例实例', () => {
    it('应该导出单例实例', () => {
      expect(dbBackup).toBeInstanceOf(DatabaseBackup)
      expect(dbMigrationManager).toBeInstanceOf(DatabaseMigrationManager)
    })
  })
})
