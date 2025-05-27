import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import type { PlayItem, StoreSettings, ApiResponse, ApiResponseWithCount } from '../types/shared'

// 文件系统 API
const fileSystemAPI = {
  // 检查文件是否存在
  checkFileExists: (filePath: string): Promise<boolean> =>
    ipcRenderer.invoke('fs:check-file-exists', filePath),

  // 读取文件内容
  readFile: (filePath: string): Promise<string | null> =>
    ipcRenderer.invoke('fs:read-file', filePath),

  // 获取文件 URL
  getFileUrl: (filePath: string): Promise<string | null> =>
    ipcRenderer.invoke('fs:get-file-url', filePath),

  // 获取文件信息
  getFileInfo: (
    filePath: string
  ): Promise<{
    size: number
    mtime: number
    isFile: boolean
    isDirectory: boolean
  } | null> => ipcRenderer.invoke('fs:get-file-info', filePath),

  // 验证文件完整性
  validateFile: (
    filePath: string,
    expectedSize?: number,
    expectedMtime?: number
  ): Promise<boolean> =>
    ipcRenderer.invoke('fs:validate-file', filePath, expectedSize, expectedMtime),

  // 打开文件选择对话框
  openFileDialog: (options: Electron.OpenDialogOptions): Promise<Electron.OpenDialogReturnValue> =>
    ipcRenderer.invoke('dialog:open-file', options)
}

// 词典服务 API
const dictionaryAPI = {
  // 有道词典API请求
  youdaoRequest: (
    url: string,
    params: Record<string, string>
  ): Promise<{
    success: boolean
    data?: unknown
    error?: string
  }> => ipcRenderer.invoke('dictionary:youdao-request', url, params),

  // 欧陆词典API请求
  eudicRequest: (
    url: string,
    options: RequestInit
  ): Promise<{
    success: boolean
    data?: unknown
    error?: string
    status?: number
  }> => ipcRenderer.invoke('dictionary:eudic-request', url, options),

  // SHA256哈希计算
  sha256: (text: string): Promise<string | null> => ipcRenderer.invoke('crypto:sha256', text),

  // 欧陆词典HTML解析请求
  eudicHtmlRequest: (
    word: string,
    context?: string
  ): Promise<{
    success: boolean
    data?: {
      word: string
      phonetic?: string
      definitions: Array<{
        partOfSpeech?: string
        meaning: string
        examples?: string[]
      }>
      examples?: string[]
      translations?: string[]
    }
    error?: string
  }> => ipcRenderer.invoke('dictionary:eudic-html-request', word, context)
}

// 存储 API
const storeAPI = {
  // 获取所有最近播放项
  getRecentPlays: (): Promise<PlayItem[]> => ipcRenderer.invoke('store:get-recent-plays'),

  // 添加或更新最近播放项
  addRecentPlay: (item: Omit<PlayItem, 'id' | 'lastOpenedAt'>): Promise<ApiResponse> =>
    ipcRenderer.invoke('store:add-recent-play', item),

  // 更新最近播放项
  updateRecentPlay: (id: string, updates: Partial<Omit<PlayItem, 'id'>>): Promise<ApiResponse> =>
    ipcRenderer.invoke('store:update-recent-play', id, updates),

  // 删除最近播放项
  removeRecentPlay: (id: string): Promise<ApiResponse> =>
    ipcRenderer.invoke('store:remove-recent-play', id),

  // 清空最近播放列表
  clearRecentPlays: (): Promise<ApiResponse> => ipcRenderer.invoke('store:clear-recent-plays'),

  // 根据文件路径获取最近播放项
  getRecentPlayByPath: (filePath: string): Promise<PlayItem | null> =>
    ipcRenderer.invoke('store:get-recent-play-by-path', filePath),

  // 获取设置
  getSettings: (): Promise<StoreSettings> => ipcRenderer.invoke('store:get-settings'),

  // 更新设置
  updateSettings: (settings: Partial<StoreSettings>): Promise<ApiResponse> =>
    ipcRenderer.invoke('store:update-settings', settings),

  // 批量删除多个项目
  removeMultipleRecentPlays: (ids: string[]): Promise<ApiResponseWithCount> =>
    ipcRenderer.invoke('store:remove-multiple-recent-plays', ids),

  // 搜索最近播放项
  searchRecentPlays: (query: string): Promise<PlayItem[]> =>
    ipcRenderer.invoke('store:search-recent-plays', query)
}

// Custom APIs for renderer
const api = {
  fileSystem: fileSystemAPI,
  dictionary: dictionaryAPI,
  store: storeAPI
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
