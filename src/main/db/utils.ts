import fs from 'node:fs'
import path from 'node:path'

import { loggerService } from '@main/services/LoggerService'
import type { MigrationResultSet } from 'kysely'

import { getDbPaths } from './index'
import {
  downgradeDatabase,
  getMigrationStatus,
  upgradeDatabase,
  validateMigrations
} from './migrate'

const logger = loggerService.withContext('db-utils')

/**
 * 数据库备份工具
 */
export class DatabaseBackup {
  private backupDir: string

  constructor() {
    this.backupDir = getDbPaths().backupDir
    this.ensureBackupDir()
  }

  private ensureBackupDir() {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true })
    }
  }

  /**
   * 创建数据库备份
   */
  async createBackup(label?: string): Promise<string> {
    const { dbFile } = getDbPaths()
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const backupName = label
      ? `backup_${label}_${timestamp}.sqlite3`
      : `backup_${timestamp}.sqlite3`
    const backupPath = path.join(this.backupDir, backupName)

    try {
      if (fs.existsSync(dbFile)) {
        fs.copyFileSync(dbFile, backupPath)
        logger.info(`[backup] Database backed up to: ${backupPath}`)
        return backupPath
      } else {
        throw new Error('Database file does not exist')
      }
    } catch (error) {
      logger.error('[backup] Failed to create backup:', { error })
      throw error
    }
  }

  /**
   * 恢复数据库备份
   */
  async restoreBackup(backupName: string): Promise<void> {
    const { dbFile } = getDbPaths()
    const backupPath = path.join(this.backupDir, backupName)

    try {
      if (!fs.existsSync(backupPath)) {
        throw new Error(`Backup file not found: ${backupPath}`)
      }

      // 创建当前数据库的备份
      await this.createBackup('pre-restore')

      fs.copyFileSync(backupPath, dbFile)
      logger.info(`[backup] Database restored from: ${backupPath}`)
    } catch (error) {
      logger.error('[backup] Failed to restore backup:', { error })
      throw error
    }
  }

  /**
   * 列出所有备份
   */
  listBackups(): string[] {
    try {
      return fs
        .readdirSync(this.backupDir)
        .filter((file) => file.endsWith('.sqlite3'))
        .sort()
        .reverse() // 最新的在前面
    } catch (error) {
      logger.error('[backup] Failed to list backups:', { error })
      return []
    }
  }

  /**
   * 删除旧备份（保留最近的 n 个）
   */
  cleanupOldBackups(keepCount = 10): void {
    try {
      const backups = this.listBackups()
      const toDelete = backups.slice(keepCount)

      for (const backup of toDelete) {
        const backupPath = path.join(this.backupDir, backup)
        fs.unlinkSync(backupPath)
        logger.info(`[backup] Deleted old backup: ${backup}`)
      }
    } catch (error) {
      logger.error('[backup] Failed to cleanup old backups:', { error })
    }
  }
}

/**
 * 数据库迁移工具
 */
export class DatabaseMigrationManager {
  private backup: DatabaseBackup

  constructor() {
    this.backup = new DatabaseBackup()
  }

  /**
   * 安全升级数据库（带备份）
   */
  async safeUpgrade(): Promise<{
    success: boolean
    backupPath?: string
    result?: MigrationResultSet
    error?: Error
  }> {
    try {
      logger.info('[migration] Starting safe database upgrade...')

      // 验证迁移文件
      const isValid = await validateMigrations()
      if (!isValid) {
        throw new Error('Migration validation failed')
      }

      // 创建备份
      const backupPath = await this.backup.createBackup('pre-upgrade')

      // 执行升级
      const result = await upgradeDatabase()

      logger.info('[migration] Safe database upgrade completed successfully')
      return {
        success: true,
        backupPath,
        result
      }
    } catch (error) {
      logger.error('[migration] Safe database upgrade failed:', { error })
      return {
        success: false,
        error: error as Error
      }
    }
  }

  /**
   * 安全降级数据库（带备份）
   */
  async safeDowngrade(targetMigration?: string): Promise<{
    success: boolean
    backupPath?: string
    result?: MigrationResultSet
    error?: Error
  }> {
    try {
      logger.info('[migration] Starting safe database downgrade...')

      // 创建备份
      const backupPath = await this.backup.createBackup('pre-downgrade')

      // 执行降级
      const result = await downgradeDatabase(targetMigration)

      logger.info('[migration] Safe database downgrade completed successfully')
      return {
        success: true,
        backupPath,
        result
      }
    } catch (error) {
      logger.error('[migration] Safe database downgrade failed:', { error })
      return {
        success: false,
        error: error as Error
      }
    }
  }

  /**
   * 获取详细的迁移状态信息
   */
  async getDetailedStatus() {
    const status = await getMigrationStatus()
    const backups = this.backup.listBackups()

    return {
      migrations: {
        executed: status.executed.length,
        pending: status.pending.length,
        total: status.all.length,
        details: {
          executed: status.executed.map((m) => ({
            name: m.name,
            executedAt: m.executedAt ? new Date(m.executedAt).toISOString() : null
          })),
          pending: status.pending.map((m) => ({ name: m.name }))
        }
      },
      backups: {
        count: backups.length,
        latest: backups[0] || null,
        list: backups.slice(0, 5) // 最近 5 个备份
      }
    }
  }

  /**
   * 紧急回滚到最近的备份
   */
  async emergencyRollback(): Promise<void> {
    const backups = this.backup.listBackups()
    if (backups.length === 0) {
      throw new Error('No backups available for emergency rollback')
    }

    logger.warn('[migration] Performing emergency rollback to latest backup')
    await this.backup.restoreBackup(backups[0])
  }
}

// 导出单例实例
export const dbBackup = new DatabaseBackup()
export const dbMigrationManager = new DatabaseMigrationManager()

/**
 * Perform a health check of the database subsystem.
 *
 * Runs a set of checks including: presence of the database file, pending migrations,
 * validity of migration files, and basic backup availability. Aggregates any detected
 * issues and returns actionable recommendations.
 *
 * @returns An object describing overall health (`healthy`), a list of detected `issues`,
 * and `recommendations` to remediate them.
 */
export async function performHealthCheck(): Promise<{
  healthy: boolean
  issues: string[]
  recommendations: string[]
}> {
  const issues: string[] = []
  const recommendations: string[] = []

  try {
    // 检查数据库文件是否存在
    const { dbFile } = getDbPaths()
    if (!fs.existsSync(dbFile)) {
      issues.push('Database file does not exist')
      recommendations.push('Run database migrations to initialize')
    }

    // 检查迁移状态
    const status = await getMigrationStatus()
    if (status.pending.length > 0) {
      issues.push(`${status.pending.length} pending migrations`)
      recommendations.push('Run "npm run migrate:up" to apply pending migrations')
    }

    // 验证迁移文件
    const migrationsValid = await validateMigrations()
    if (!migrationsValid) {
      issues.push('Invalid migration files detected')
      recommendations.push('Check migration files for syntax errors')
    }

    // 检查备份状态
    const backups = dbBackup.listBackups()
    if (backups.length === 0) {
      recommendations.push('Create a database backup for safety')
    } else if (backups.length > 20) {
      recommendations.push('Consider cleaning up old backups')
    }

    return {
      healthy: issues.length === 0,
      issues,
      recommendations
    }
  } catch (error) {
    return {
      healthy: false,
      issues: [`Health check failed: ${(error as Error).message}`],
      recommendations: ['Check database connection and permissions']
    }
  }
}
