import { loggerService } from '@main/services/LoggerService'

import { openDatabase } from './index'
import { runMigrations } from './migrate'

const logger = loggerService.withContext('Database')

/**
 * 初始化数据库
 * 在主进程启动时调用
 */
export async function initDatabase() {
  try {
    logger.info('[Database] Initializing database...')

    // 打开数据库连接
    openDatabase()
    logger.info('[Database] Database connection established')

    // 运行迁移
    await runMigrations()
    logger.info('[Database] Migrations completed')

    logger.info('[Database] Database initialization completed successfully')
  } catch (error) {
    logger.error('[Database] Failed to initialize database:', { error })
    throw error
  }
}
