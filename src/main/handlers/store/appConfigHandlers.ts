import { ipcMain, app } from 'electron'
import * as path from 'path'
import type { AppConfig, ApiResponse } from '../../../types/shared'
import { appConfigStore, defaultAppConfig, getDefaultDataDirectory } from './storeInstances'

/**
 * 设置应用配置相关的 IPC 处理器 / Setup app config related IPC handlers
 */
export function setupAppConfigHandlers(): void {
  // 获取应用配置 / Get app config
  ipcMain.handle('app:get-config', (): AppConfig => {
    try {
      const config = appConfigStore.store as AppConfig
      return { ...defaultAppConfig, ...config }
    } catch (error) {
      console.error('获取应用配置失败:', error)
      return defaultAppConfig
    }
  })

  // 更新应用配置 / Update app config
  ipcMain.handle('app:update-config', (_, updates: Partial<AppConfig>): ApiResponse => {
    try {
      const currentConfig = appConfigStore.store as AppConfig
      const newConfig = { ...currentConfig, ...updates }

      console.log('🔄 更新应用配置:', { updates, newConfig })
      appConfigStore.store = newConfig

      return { success: true }
    } catch (error) {
      console.error('更新应用配置失败:', error)
      return { success: false, error: error instanceof Error ? error.message : '未知错误' }
    }
  })

  // 重置应用配置为默认值 / Reset app config to default values
  ipcMain.handle('app:reset-config', (): ApiResponse => {
    try {
      console.log('🔄 重置应用配置为默认值')
      appConfigStore.store = defaultAppConfig
      return { success: true }
    } catch (error) {
      console.error('重置应用配置失败:', error)
      return { success: false, error: error instanceof Error ? error.message : '未知错误' }
    }
  })

  // 获取默认数据目录 / Get default data directory
  ipcMain.handle('app:get-default-data-directory', (): string => {
    try {
      return getDefaultDataDirectory()
    } catch (error) {
      console.error('获取默认数据目录失败:', error)
      return getDefaultDataDirectory()
    }
  })

  // 获取测试视频文件路径 / Get test video file path
  ipcMain.handle('app:get-test-video-path', (): string => {
    try {
      // 获取应用根目录，然后拼接测试文件路径 / Get app root directory, then join test file path
      const appPath = app.getAppPath()
      return path.join(appPath, 'e2e', 'assets', 'test-video.mp4')
    } catch (error) {
      console.error('获取测试视频文件路径失败:', error)
      // 返回默认的相对路径 / Return default relative path
      return path.join(process.cwd(), 'e2e', 'assets', 'test-video.mp4')
    }
  })
}

/**
 * 获取应用配置的同步方法 / Synchronous method to get application configuration
 * 这个方法可以在窗口创建时使用 / This method can be used during window creation
 */
export function getAppConfig(): AppConfig {
  try {
    const config = appConfigStore.store as AppConfig
    return { ...defaultAppConfig, ...config }
  } catch (error) {
    console.error('获取应用配置失败:', error)
    return defaultAppConfig
  }
}
