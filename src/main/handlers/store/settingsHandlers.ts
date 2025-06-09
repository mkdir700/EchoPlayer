import { ipcMain } from 'electron'
import type { StoreSchema, ApiResponse, RecentPlayItem } from '../../../types/shared'
import { mainStore } from './storeInstances'

/**
 * 设置相关的 IPC 处理器 / Setup settings related IPC handlers
 */
export function setupSettingsHandlers(): void {
  // 获取设置 / Get settings
  ipcMain.handle('store:get-settings', () => {
    try {
      return mainStore.get('settings', {
        maxRecentItems: 20,
        playback: {
          isAutoScrollEnabled: true,
          displayMode: 'bilingual',
          volume: 0.8,
          playbackRate: 1.0,
          isSingleLoop: false,
          isAutoPause: false
        }
      })
    } catch (error) {
      console.error('获取设置失败:', error)
      return {
        maxRecentItems: 20,
        playback: {
          isAutoScrollEnabled: true,
          displayMode: 'bilingual',
          volume: 0.8,
          playbackRate: 1.0,
          isSingleLoop: false,
          isAutoPause: false
        }
      }
    }
  })

  // 更新设置 / Update settings
  ipcMain.handle(
    'store:update-settings',
    (_, settings: Partial<StoreSchema['settings']>): ApiResponse => {
      try {
        const currentSettings = mainStore.get('settings', {
          maxRecentItems: 20,
          playback: {
            isAutoScrollEnabled: true,
            displayMode: 'bilingual',
            volume: 0.8,
            playbackRate: 1.0,
            isSingleLoop: false,
            isAutoPause: false
          },
          update: {
            autoUpdate: true,
            lastChecked: 0,
            updateChannel: 'stable'
          }
        }) as StoreSchema['settings']

        // 深度合并设置，特别处理 playback 和 update 对象 / Deep merge settings, specially handle playback and update objects
        const newSettings = {
          ...currentSettings,
          ...settings,
          playback: {
            ...currentSettings.playback,
            ...(settings.playback || {})
          },
          update: {
            ...currentSettings.update,
            ...(settings.update || {})
          }
        }

        mainStore.set('settings', newSettings)

        // 如果更新了最大项目数，需要裁剪现有列表 / If max items updated, need to trim existing list
        if (settings.maxRecentItems !== undefined) {
          const recentPlays = mainStore.get('recentPlays', []) as RecentPlayItem[]
          if (recentPlays.length > settings.maxRecentItems) {
            const trimmedPlays = recentPlays.slice(0, settings.maxRecentItems)
            mainStore.set('recentPlays', trimmedPlays)
          }
        }

        return { success: true }
      } catch (error) {
        console.error('更新设置失败:', error)
        return { success: false, error: error instanceof Error ? error.message : '未知错误' }
      }
    }
  )
}
