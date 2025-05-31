import { ipcMain } from 'electron'
import { Logger } from '../utils/logger'

export function setupLogHandlers(): void {
  // 处理来自渲染进程的日志请求
  ipcMain.handle('log', async (event, level: string, message: string, data?: unknown) => {
    try {
      switch (level) {
        case 'debug':
          Logger.debug(message, data)
          break
        case 'info':
          Logger.info(message, data)
          break
        case 'warn':
          Logger.warn(message, data)
          break
        case 'error':
          Logger.error(message, data instanceof Error ? data : undefined, data)
          break
        default:
          Logger.info(message, data)
      }
    } catch (error) {
      Logger.error(
        '处理渲染进程日志时出错',
        error instanceof Error ? error : new Error(String(error))
      )
    }
  })

  Logger.info('日志处理器已初始化')
}
