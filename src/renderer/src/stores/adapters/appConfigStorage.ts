/* eslint-disable @typescript-eslint/no-unused-vars */
import type { StateStorage } from 'zustand/middleware'
import type { AppConfig, UpdateNotificationConfig } from '../../../../types/shared'

/**
 * 自定义存储适配器，用于将更新通知数据保存到 app config 中
 * Custom storage adapter for saving update notification data to app config
 */
export class AppConfigUpdateNotificationStorage implements StateStorage {
  async getItem(_name: string): Promise<string | null> {
    try {
      // 获取当前的 app config / Get current app config
      const config: AppConfig = await window.electron.ipcRenderer.invoke('app:get-config')

      // 返回更新通知配置的 JSON 字符串 / Return update notification config as JSON string
      if (config.updateNotification) {
        return JSON.stringify(config.updateNotification)
      }

      return null
    } catch (error) {
      console.error('Failed to get update notification config from app config:', error)
      return null
    }
  }

  async setItem(_name: string, value: string): Promise<void> {
    try {
      // 解析更新通知配置 / Parse update notification config
      const updateNotificationConfig: UpdateNotificationConfig = JSON.parse(value)

      // 更新 app config 中的更新通知配置 / Update update notification config in app config
      await window.electron.ipcRenderer.invoke('app:update-config', {
        updateNotification: updateNotificationConfig
      })

      console.log('✅ 更新通知配置已保存到 app config:', updateNotificationConfig)
    } catch (error) {
      console.error('Failed to save update notification config to app config:', error)
    }
  }

  async removeItem(_name: string): Promise<void> {
    try {
      // 移除更新通知配置 / Remove update notification config
      await window.electron.ipcRenderer.invoke('app:update-config', {
        updateNotification: undefined
      })

      console.log('✅ 更新通知配置已从 app config 中移除')
    } catch (error) {
      console.error('Failed to remove update notification config from app config:', error)
    }
  }
}

// 创建存储适配器实例 / Create storage adapter instance
export const appConfigUpdateNotificationStorage = new AppConfigUpdateNotificationStorage()
