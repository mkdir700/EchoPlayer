import { StateStorage } from 'zustand/middleware'

/**
 * 自定义存储引擎 - 通过 Electron IPC 与主进程通信
 * Custom storage engine - communicates with main process via Electron IPC
 *
 * 实现 StateStorage 接口以与 Zustand persist 中间件兼容
 * Implements StateStorage interface for compatibility with Zustand persist middleware
 */
export const electronStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      console.log(`📖 从主进程读取存储: ${name}`)
      const result = await window.api.store.getRawData(name)
      console.log(`✅ 读取成功:`, result ? `${result.length} characters` : 'null')
      return result
    } catch (error) {
      console.error('从主进程读取存储失败:', error)
      return null
    }
  },

  setItem: async (name: string, value: string): Promise<void> => {
    try {
      console.log(`💾 保存到主进程存储: ${name}`, value.length, 'characters')
      const result = await window.api.store.setRawData(name, value)
      if (!result.success) {
        throw new Error(result.error || '保存失败')
      }
      console.log(`✅ 保存成功`)
    } catch (error) {
      console.error('保存到主进程存储失败:', error)
      throw error
    }
  },

  removeItem: async (name: string): Promise<void> => {
    try {
      console.log(`🗑️ 从主进程删除存储: ${name}`)
      const result = await window.api.store.removeRawData(name)
      if (!result.success) {
        throw new Error(result.error || '删除失败')
      }
      console.log(`✅ 删除成功`)
    } catch (error) {
      console.error('从主进程删除存储失败:', error)
      throw error
    }
  }
}
