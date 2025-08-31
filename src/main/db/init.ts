import { loggerService } from '@main/services/LoggerService'

import { openDatabase } from './index'
import { runMigrations } from './migrate'

const logger = loggerService.withContext('Database')

/**
 * Initialize the database by opening the connection and running migrations.
 *
 * Called during main-process startup. If any step fails, the error is logged and rethrown so callers can handle shutdown or retry.
 *
 * @throws Any error encountered while opening the database or running migrations.
 */
export async function initDatabase() {
  try {
    logger.info('Initializing database...')

    // 打开数据库连接
    openDatabase()
    logger.info('Database connection established')

    // 运行迁移
    await runMigrations()
    logger.info('Migrations completed')

    logger.info('Database initialization completed successfully')
  } catch (error) {
    logger.error('Failed to initialize database:', { error })
    throw error
  }
}
