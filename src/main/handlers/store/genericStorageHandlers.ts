import { ipcMain } from 'electron'
import type { ApiResponse } from '../../../types/shared'
import { mainStore } from './storeInstances'

/**
 * 通用存储方法 - 支持 Zustand persist 中间件 / Generic storage methods - support Zustand persist middleware
 */
export function setupGenericStorageHandlers(): void {
  // 获取通用存储数据 / Get generic storage data
  ipcMain.handle('store:get-raw-data', (_, key: string): string | null => {
    try {
      console.log(`📖 获取通用存储数据: ${key}`)
      return mainStore.get(key, null) as string | null
    } catch (error) {
      console.error('获取通用存储数据失败:', error)
      return null
    }
  })

  // 设置通用存储数据 / Set generic storage data
  ipcMain.handle('store:set-raw-data', (_, key: string, value: string): ApiResponse => {
    try {
      console.log(`💾 设置通用存储数据: ${key}`, value.length, 'characters')
      mainStore.set(key, value)
      return { success: true }
    } catch (error) {
      console.error('设置通用存储数据失败:', error)
      return { success: false, error: error instanceof Error ? error.message : '未知错误' }
    }
  })

  // 删除通用存储数据 / Remove generic storage data
  ipcMain.handle('store:remove-raw-data', (_, key: string): ApiResponse => {
    try {
      console.log(`🗑️ 删除通用存储数据: ${key}`)
      mainStore.delete(key)
      return { success: true }
    } catch (error) {
      console.error('删除通用存储数据失败:', error)
      return { success: false, error: error instanceof Error ? error.message : '未知错误' }
    }
  })
}
