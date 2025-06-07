import { ipcMain, BrowserWindow, app } from 'electron'
import type { TitleBarOverlayOptions } from '../../types/shared'

// 存储主窗口引用 / Store main window reference
let mainWindow: BrowserWindow | null = null

/**
 * 设置主窗口引用 / Set main window reference
 */
export function setMainWindow(window: BrowserWindow): void {
  mainWindow = window
}

/**
 * 获取主窗口引用 / Get main window reference
 */
export function getMainWindow(): BrowserWindow | null {
  return mainWindow
}

/**
 * 设置窗口相关的 IPC 处理器 / Setup window-related IPC handlers
 */
export function setupWindowHandlers(): void {
  // 设置标题栏覆盖样式 / Set title bar overlay style
  ipcMain.handle('window:set-title-bar-overlay', (_, overlay: TitleBarOverlayOptions) => {
    try {
      if (mainWindow && typeof mainWindow.setTitleBarOverlay === 'function') {
        mainWindow.setTitleBarOverlay(overlay)
        console.log('🎨 设置标题栏覆盖样式:', overlay)
      }
    } catch (error) {
      console.warn('设置标题栏覆盖样式失败 (可能不支持):', error)
    }
  })

  // 设置窗口置顶 / Set window always on top
  ipcMain.handle('window:set-always-on-top', (_, alwaysOnTop: boolean) => {
    try {
      if (mainWindow) {
        mainWindow.setAlwaysOnTop(alwaysOnTop)
        console.log('📌 设置窗口置顶:', alwaysOnTop)
      }
    } catch (error) {
      console.error('设置窗口置顶失败:', error)
    }
  })

  // 获取窗口置顶状态 / Get window always on top status
  ipcMain.handle('window:is-always-on-top', () => {
    try {
      return mainWindow?.isAlwaysOnTop() || false
    } catch (error) {
      console.error('获取窗口置顶状态失败:', error)
      return false
    }
  })

  // 最小化窗口 / Minimize window
  ipcMain.handle('window:minimize', () => {
    try {
      if (mainWindow) {
        mainWindow.minimize()
        console.log('📦 最小化窗口')
      }
    } catch (error) {
      console.error('最小化窗口失败:', error)
    }
  })

  // 最大化/恢复窗口 / Maximize/restore window
  ipcMain.handle('window:maximize', () => {
    try {
      if (mainWindow) {
        if (mainWindow.isMaximized()) {
          mainWindow.restore()
          console.log('🔄 恢复窗口')
        } else {
          mainWindow.maximize()
          console.log('📏 最大化窗口')
        }
      }
    } catch (error) {
      console.error('最大化/恢复窗口失败:', error)
    }
  })

  // 关闭窗口 / Close window
  ipcMain.handle('window:close', () => {
    try {
      if (mainWindow) {
        mainWindow.close()
        console.log('❌ 关闭窗口')
      }
    } catch (error) {
      console.error('关闭窗口失败:', error)
    }
  })

  // 重启应用 / Restart application
  ipcMain.handle('app:restart', () => {
    try {
      console.log('🔄 重启应用')
      app.relaunch()
      app.exit()
    } catch (error) {
      console.error('重启应用失败:', error)
    }
  })

  // 获取平台信息 / Get platform information
  ipcMain.handle('app:get-platform', () => {
    return process.platform
  })

  // 获取应用版本 / Get application version
  ipcMain.handle('app:get-version', () => {
    return app.getVersion()
  })
}
