import fs from 'node:fs'
import path from 'node:path'

import { loggerService } from '@main/services/LoggerService'
import {
  FileMigrationProvider,
  type MigrationInfo,
  type MigrationResultSet,
  Migrator
} from 'kysely'

import { getKysely, openDatabase } from './index'

const logger = loggerService.withContext('migrate')

/**
 * 数据库迁移管理器
 * 基于 Kysely 官方 Migration API 实现的健壮迁移系统
 */
class DatabaseMigrator {
  private migrator: Migrator
  private migrationsDir: string

  constructor() {
    this.migrationsDir = path.join(__dirname, 'migrations')

    // 确保迁移目录存在
    if (!fs.existsSync(this.migrationsDir)) {
      fs.mkdirSync(this.migrationsDir, { recursive: true })
    }

    // 初始化数据库连接
    openDatabase()
    const db = getKysely()

    // 创建 Kysely Migrator 实例
    this.migrator = new Migrator({
      db,
      provider: new FileMigrationProvider({
        fs: {
          readdir: (path: string) => Promise.resolve(fs.readdirSync(path))
        } as any,
        path,
        migrationFolder: this.migrationsDir
      }),
      allowUnorderedMigrations: false // 严格按顺序执行迁移
    })
  }

  /**
   * 升级数据库到最新版本
   */
  async migrateUp(): Promise<MigrationResultSet> {
    try {
      logger.info('[migrate] Starting database upgrade...')
      const results = await this.migrator.migrateToLatest()

      this.logMigrationResults(results, 'upgrade')
      return results
    } catch (error) {
      logger.error('[migrate] Database upgrade failed:', { error })
      throw error
    }
  }

  /**
   * 回退数据库到指定版本或上一个版本
   */
  async migrateDown(targetMigration?: string): Promise<MigrationResultSet> {
    try {
      logger.info('[migrate] Starting database downgrade...')

      const results = targetMigration
        ? await this.migrator.migrateTo(targetMigration)
        : await this.migrateDownOne()

      this.logMigrationResults(results, 'downgrade')
      return results
    } catch (error) {
      logger.error('[migrate] Database downgrade failed:', { error })
      throw error
    }
  }

  /**
   * 回退一个迁移版本
   */
  private async migrateDownOne(): Promise<MigrationResultSet> {
    const executedMigrations = await this.migrator.getMigrations()
    const executed = executedMigrations.filter((m) => m.executedAt)

    if (executed.length === 0) {
      logger.warn('[migrate] No migrations to rollback')
      const emptyResult: MigrationResultSet = {
        error: undefined,
        results: []
      }
      return emptyResult
    }

    // 获取倒数第二个迁移（回退到上一个状态）
    const targetMigration =
      executed.length > 1 ? executed[executed.length - 2].name : 'NO_MIGRATIONS'
    return await this.migrator.migrateTo(targetMigration)
  }

  /**
   * 获取迁移状态信息
   */
  async getMigrationStatus(): Promise<{
    executed: MigrationInfo[]
    pending: MigrationInfo[]
    all: readonly MigrationInfo[]
  }> {
    const migrations = await this.migrator.getMigrations()

    return {
      executed: migrations.filter((m) => m.executedAt),
      pending: migrations.filter((m) => !m.executedAt),
      all: migrations
    }
  }

  /**
   * 验证所有迁移文件的完整性
   */
  async validateMigrations(): Promise<boolean> {
    try {
      const status = await this.getMigrationStatus()

      // 检查是否所有迁移都有对应的 up/down 函数
      for (const migration of status.all) {
        if (!migration.name || migration.name.trim() === '') {
          logger.error(`[migrate] Invalid migration name: ${migration.name}`)
          return false
        }
      }

      logger.info('[migrate] All migrations are valid')
      return true
    } catch (error) {
      logger.error('[migrate] Migration validation failed:', { error })
      return false
    }
  }

  /**
   * 创建新的迁移文件
   */
  createMigration(name: string): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `${timestamp}_${name.replace(/\s+/g, '_')}.ts`
    const filepath = path.join(this.migrationsDir, filename)

    const template = this.getMigrationTemplate(name)
    fs.writeFileSync(filepath, template, 'utf-8')

    logger.info(`[migrate] Created migration file: ${filename}`)
    return filepath
  }

  /**
   * 记录迁移结果
   */
  private logMigrationResults(resultSet: MigrationResultSet, operation: string) {
    if (!resultSet.results || resultSet.results.length === 0) {
      logger.info(`[migrate] No migrations to ${operation}`)
      return
    }

    for (const result of resultSet.results) {
      if (result.status === 'Success') {
        logger.info(`[migrate] ${operation} successful: ${result.migrationName}`)
      } else if (result.status === 'Error') {
        logger.error(`[migrate] ${operation} failed: ${result.migrationName}`, {
          error: (result as any).error
        })
      } else {
        logger.warn(`[migrate] ${operation} not executed: ${result.migrationName}`)
      }
    }
  }

  /**
   * 获取迁移文件模板
   */
  private getMigrationTemplate(name: string): string {
    return `import type { Kysely } from 'kysely'

/**
 * Migration: ${name}
 * Created: ${new Date().toISOString()}
 */
export async function up(db: Kysely<any>): Promise<void> {
  // 在此处添加升级逻辑
  // 例如：
  // await db.schema
  //   .createTable('example_table')
  //   .addColumn('id', 'integer', col => col.primaryKey().autoIncrement())
  //   .addColumn('name', 'varchar(255)', col => col.notNull())
  //   .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  // 在此处添加回退逻辑（撤销 up 函数的操作）
  // 例如：
  // await db.schema.dropTable('example_table').execute()
}
`
  }
}

// 创建全局迁移管理器实例
const migrator = new DatabaseMigrator()

/**
 * 运行数据库升级迁移
 * 替代原有的 runMigrations 函数
 */
export async function runMigrations(): Promise<void> {
  await migrator.migrateUp()
}

/**
 * 升级数据库到最新版本
 */
export async function upgradeDatabase(): Promise<MigrationResultSet> {
  return await migrator.migrateUp()
}

/**
 * 回退数据库到指定版本
 */
export async function downgradeDatabase(targetMigration?: string): Promise<MigrationResultSet> {
  return await migrator.migrateDown(targetMigration)
}

/**
 * 获取数据库迁移状态
 */
export async function getMigrationStatus() {
  return await migrator.getMigrationStatus()
}

/**
 * 创建新的迁移文件
 */
export function createMigration(name: string): string {
  return migrator.createMigration(name)
}

/**
 * 验证迁移文件完整性
 */
export async function validateMigrations(): Promise<boolean> {
  return await migrator.validateMigrations()
}
