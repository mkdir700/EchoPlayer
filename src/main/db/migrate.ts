import fs from 'node:fs'
import { promises as fsPromises } from 'node:fs'
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
    // 根据环境确定迁移文件目录
    this.migrationsDir = this.getMigrationsDirectory()

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
        fs: fsPromises,
        path,
        migrationFolder: this.migrationsDir
      }),
      allowUnorderedMigrations: false // 严格按顺序执行迁移
    })
  }

  /**
   * 获取迁移文件目录
   * 根据环境和文件存在情况确定正确的迁移文件路径
   */
  private getMigrationsDirectory(): string {
    // 尝试多个可能的路径
    const possiblePaths = [
      // 1. 源码目录（开发环境）
      path.join(process.cwd(), 'src', 'main', 'db', 'migrations'),
      // 2. 相对于项目根目录的源码路径
      path.resolve(__dirname, '..', '..', '..', 'src', 'main', 'db', 'migrations'),
      // 3. 编译后的目录（生产环境）
      path.join(__dirname, 'migrations')
    ]

    for (const migrationPath of possiblePaths) {
      if (fs.existsSync(migrationPath)) {
        // 检查目录中是否有迁移文件
        const files = fs.readdirSync(migrationPath)
        const migrationFiles = files.filter((file) => file.endsWith('.ts') || file.endsWith('.js'))

        if (migrationFiles.length > 0) {
          logger.info(`Using migrations directory: ${migrationPath}`)
          return migrationPath
        }
      }
    }

    // 如果都没找到，使用默认路径（源码目录）
    const defaultPath = path.join(process.cwd(), 'src', 'main', 'db', 'migrations')
    logger.warn(`No migrations found, using default path: ${defaultPath}`)
    return defaultPath
  }

  /**
   * 升级数据库到最新版本
   */
  async migrateUp(): Promise<MigrationResultSet> {
    logger.info('Starting database upgrade...')
    const results = await this.migrator.migrateToLatest()

    this.logMigrationResults(results, 'upgrade')
    return results
  }

  /**
   * 回退数据库到指定版本或上一个版本
   */
  async migrateDown(targetMigration?: string): Promise<MigrationResultSet> {
    const results = targetMigration
      ? await this.migrator.migrateTo(targetMigration)
      : await this.migrateDownOne()

    this.logMigrationResults(results, 'downgrade')
    return results
  }

  /**
   * 回退一个迁移版本
   */
  private async migrateDownOne(): Promise<MigrationResultSet> {
    const executedMigrations = await this.migrator.getMigrations()
    const executed = executedMigrations.filter((m) => m.executedAt)

    if (executed.length === 0) {
      logger.warn('No migrations to rollback')
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
   * 获取迁移目录路径（供外部使用）
   */
  getMigrationsDir(): string {
    return this.migrationsDir
  }

  /**
   * 记录迁移结果
   */
  private logMigrationResults(resultSet: MigrationResultSet, operation: string) {
    if (!resultSet.results || resultSet.results.length === 0) {
      logger.info(`No migrations to ${operation}`)
      return
    }

    if (resultSet.error) {
      logger.error(`${operation} encountered errors:`, { error: resultSet.error })
    } else {
      for (const result of resultSet.results) {
        if (result.status === 'Success') {
          logger.info(`${operation} successful: ${result.migrationName}`)
        } else if (result.status === 'Error') {
          logger.error(`${operation} failed: ${result.migrationName}`, {
            error: (result as any).error
          })
        } else {
          logger.warn(`${operation} not executed: ${result.migrationName}`)
        }
      }
    }
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
export async function createMigration(name: string): Promise<void> {
  try {
    // 生成时间戳
    const timestamp = new Date()
      .toISOString()
      .replace(/[-T:.Z]/g, '')
      .slice(0, 14)

    // 清理迁移名称（移除特殊字符，转为下划线分隔）
    const sanitizedName = name
      .toLowerCase()
      .replace(/[^a-z0-9\s_-]/g, '')
      .replace(/[\s-]+/g, '_')

    // 构建文件名和路径
    const fileName = `${timestamp}_${sanitizedName}.js`
    const migrationsDir = migrator.getMigrationsDir()
    const filePath = path.join(migrationsDir, fileName)

    // 确保迁移目录存在
    if (!fs.existsSync(migrationsDir)) {
      fs.mkdirSync(migrationsDir, { recursive: true })
    }

    // 检查文件是否已存在
    if (fs.existsSync(filePath)) {
      throw new Error(`Migration file already exists: ${fileName}`)
    }

    // 生成迁移文件模板
    const template = `/**
 * Migration: ${name}
 */
export async function up(db) {
  // TODO: 实现升级逻辑
  // 示例:
  // await db.schema
  //   .createTable('example_table')
  //   .addColumn('id', 'integer', (col) => col.primaryKey().autoIncrement())
  //   .addColumn('name', 'text', (col) => col.notNull())
  //   .execute()
}

export async function down(db) {
  // TODO: 实现回退逻辑
  // 示例:
  // await db.schema.dropTable('example_table').ifExists().execute()
}
`

    // 写入文件
    await fsPromises.writeFile(filePath, template, 'utf-8')

    logger.info(`Created migration file: ${fileName}`, {
      path: filePath,
      name: sanitizedName,
      timestamp
    })
  } catch (error) {
    logger.error('Failed to create migration:', { error, name })
    throw error
  }
}

/**
 * 验证所有迁移文件的完整性
 */
export async function validateMigrations(): Promise<{
  valid: boolean
  errors: string[]
  warnings: string[]
  migrations: Array<{
    name: string
    path: string
    hasUp: boolean
    hasDown: boolean
    syntaxValid: boolean
  }>
}> {
  const errors: string[] = []
  const warnings: string[] = []
  const migrations: Array<{
    name: string
    path: string
    hasUp: boolean
    hasDown: boolean
    syntaxValid: boolean
  }> = []

  try {
    // 获取迁移目录
    const migrationsDir = migrator.getMigrationsDir()

    if (!fs.existsSync(migrationsDir)) {
      errors.push(`Migrations directory does not exist: ${migrationsDir}`)
      return { valid: false, errors, warnings, migrations }
    }

    // 读取迁移文件
    const files = fs.readdirSync(migrationsDir)
    const migrationFiles = files
      .filter((file) => file.endsWith('.js') || file.endsWith('.ts'))
      .sort()

    if (migrationFiles.length === 0) {
      warnings.push('No migration files found')
      return { valid: true, errors, warnings, migrations }
    }

    // 验证文件名格式
    const namePattern = /^\d{14}_[a-z0-9_]+\.(js|ts)$/
    for (const fileName of migrationFiles) {
      if (!namePattern.test(fileName)) {
        errors.push(`Invalid migration file name format: ${fileName}`)
      }
    }

    // 验证每个迁移文件
    for (const fileName of migrationFiles) {
      const filePath = path.join(migrationsDir, fileName)
      let hasUp = false
      let hasDown = false
      let syntaxValid = true

      try {
        // 读取文件内容
        const content = await fsPromises.readFile(filePath, 'utf-8')

        // 检查是否包含必需的函数
        hasUp = /export\s+async\s+function\s+up\s*\(/m.test(content)
        hasDown = /export\s+async\s+function\s+down\s*\(/m.test(content)

        if (!hasUp) {
          errors.push(`Missing 'up' function in migration: ${fileName}`)
        }

        if (!hasDown) {
          warnings.push(`Missing 'down' function in migration: ${fileName}`)
        }

        // 尝试动态导入验证语法（仅对 JS 文件）
        if (fileName.endsWith('.js')) {
          try {
            const migration = await import(filePath)
            if (typeof migration.up !== 'function') {
              errors.push(`Invalid 'up' function export in migration: ${fileName}`)
              syntaxValid = false
            }
            if (migration.down && typeof migration.down !== 'function') {
              errors.push(`Invalid 'down' function export in migration: ${fileName}`)
              syntaxValid = false
            }
          } catch (importError) {
            const error = importError as Error
            errors.push(`Syntax error in migration ${fileName}: ${error.message}`)
            syntaxValid = false
          }
        }

        migrations.push({
          name: fileName,
          path: filePath,
          hasUp,
          hasDown,
          syntaxValid
        })
      } catch (fileError) {
        const error = fileError as Error
        errors.push(`Cannot read migration file ${fileName}: ${error.message}`)
        migrations.push({
          name: fileName,
          path: filePath,
          hasUp: false,
          hasDown: false,
          syntaxValid: false
        })
      }
    }

    // 验证时间戳的唯一性和顺序
    const timestamps = migrationFiles
      .map((file) => file.substring(0, 14))
      .filter((ts) => /^\d{14}$/.test(ts))

    const uniqueTimestamps = new Set(timestamps)
    if (timestamps.length !== uniqueTimestamps.size) {
      errors.push('Duplicate timestamps found in migration files')
    }

    // 检查时间戳是否按顺序排列
    const sortedTimestamps = [...timestamps].sort()
    if (JSON.stringify(timestamps) !== JSON.stringify(sortedTimestamps)) {
      warnings.push('Migration timestamps are not in chronological order')
    }

    const valid = errors.length === 0

    logger.info(`Migration validation completed`, {
      valid,
      totalFiles: migrationFiles.length,
      errors: errors.length,
      warnings: warnings.length
    })

    return { valid, errors, warnings, migrations }
  } catch (error) {
    logger.error('Migration validation failed:', { error })
    const err = error as Error
    errors.push(`Validation error: ${err.message}`)
    return { valid: false, errors, warnings, migrations }
  }
}
