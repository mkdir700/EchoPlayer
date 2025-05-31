import log from 'electron-log'
import path from 'path'
import { app } from 'electron'

// 配置日志文件路径
const logDir = path.join(app.getPath('userData'), 'logs')

// 主日志配置
log.transports.file.resolvePathFn = () => path.join(logDir, 'main.log')
log.transports.file.level = 'debug'
log.transports.file.maxSize = 5 * 1024 * 1024 // 5MB
log.transports.file.format = '{y}-{m}-{d} {h}:{i}:{s}.{ms} [{level}] {text}'

// 控制台日志配置
log.transports.console.level = 'debug'
log.transports.console.format = '[{level}] {text}'

// 用户操作日志单独文件
const userActionLog = log.create({ logId: 'user-actions' })
userActionLog.transports.file.resolvePathFn = () => path.join(logDir, 'user-actions.log')
userActionLog.transports.file.level = 'info'
userActionLog.transports.file.maxSize = 10 * 1024 * 1024 // 10MB
userActionLog.transports.file.format = '{y}-{m}-{d} {h}:{i}:{s}.{ms} [USER_ACTION] {text}'
userActionLog.transports.console.level = false // 用户操作日志不输出到控制台

// 错误日志单独文件
const errorLog = log.create({ logId: 'errors' })
errorLog.transports.file.resolvePathFn = () => path.join(logDir, 'errors.log')
errorLog.transports.file.level = 'error'
errorLog.transports.file.maxSize = 20 * 1024 * 1024 // 20MB
errorLog.transports.file.format = '{y}-{m}-{d} {h}:{i}:{s}.{ms} [ERROR] {text}'

// 定义用户操作详情类型
interface UserActionDetails {
  [key: string]: unknown
}

// 定义窗口操作详情类型
interface WindowActionDetails {
  [key: string]: unknown
}

// 日志工具类
export class Logger {
  /**
   * 记录调试信息
   */
  static debug(message: string, ...args: unknown[]): void {
    log.debug(message, ...args)
  }

  /**
   * 记录普通信息
   */
  static info(message: string, ...args: unknown[]): void {
    log.info(message, ...args)
  }

  /**
   * 记录警告信息
   */
  static warn(message: string, ...args: unknown[]): void {
    log.warn(message, ...args)
  }

  /**
   * 记录错误信息
   */
  static error(message: string, error?: Error, ...args: unknown[]): void {
    if (error) {
      log.error(message, error.stack || error.message, ...args)
      errorLog.error(message, error.stack || error.message, ...args)
    } else {
      log.error(message, ...args)
      errorLog.error(message, ...args)
    }
  }

  /**
   * 记录用户操作
   */
  static userAction(action: string, details?: UserActionDetails): void {
    const logMessage = details ? `${action} | Details: ${JSON.stringify(details)}` : action

    userActionLog.info(logMessage)
    log.info(`[用户操作] ${logMessage}`)
  }

  /**
   * 记录应用启动信息
   */
  static appStart(): void {
    const startInfo = {
      version: app.getVersion(),
      platform: process.platform,
      arch: process.arch,
      node: process.version,
      electron: process.versions.electron,
      timestamp: new Date().toISOString()
    }

    log.info('🚀 应用启动', startInfo)
    userActionLog.info(`应用启动 | ${JSON.stringify(startInfo)}`)
  }

  /**
   * 记录应用关闭信息
   */
  static appShutdown(): void {
    const shutdownInfo = {
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    }

    log.info('🔻 应用关闭', shutdownInfo)
    userActionLog.info(`应用关闭 | ${JSON.stringify(shutdownInfo)}`)
  }

  /**
   * 记录窗口操作
   */
  static windowAction(action: string, windowId?: number, details?: WindowActionDetails): void {
    const logData = {
      action,
      windowId,
      details,
      timestamp: new Date().toISOString()
    }

    userActionLog.info(`窗口操作: ${action} | ${JSON.stringify(logData)}`)
    log.info(`[窗口] ${action}`, logData)
  }

  /**
   * 记录文件操作
   */
  static fileOperation(operation: string, filePath: string, success: boolean, error?: Error): void {
    const logData = {
      operation,
      filePath: path.basename(filePath), // 只记录文件名，避免泄露完整路径
      success,
      error: error?.message,
      timestamp: new Date().toISOString()
    }

    if (success) {
      userActionLog.info(`文件操作成功: ${operation} | ${JSON.stringify(logData)}`)
      log.info(`[文件] ${operation} 成功`, logData)
    } else {
      userActionLog.error(`文件操作失败: ${operation} | ${JSON.stringify(logData)}`)
      log.error(`[文件] ${operation} 失败`, logData)
    }
  }

  /**
   * 获取日志文件路径
   */
  static getLogPaths(): { main: string; userActions: string; errors: string } {
    return {
      main: path.join(logDir, 'main.log'),
      userActions: path.join(logDir, 'user-actions.log'),
      errors: path.join(logDir, 'errors.log')
    }
  }
}

// 导出默认日志实例
export default log
