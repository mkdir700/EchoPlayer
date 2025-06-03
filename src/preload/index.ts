import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import type {
  RecentPlayItem,
  StoreSettings,
  ApiResponse,
  ApiResponseWithCount,
  UpdateSettings
} from '../types/shared'

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
  getRecentPlays: (): Promise<RecentPlayItem[]> => ipcRenderer.invoke('store:get-recent-plays'),

  // 添加或更新最近播放项
  addRecentPlay: (item: Omit<RecentPlayItem, 'id' | 'lastOpenedAt'>): Promise<ApiResponse> =>
    ipcRenderer.invoke('store:add-recent-play', item),

  // 更新最近播放项
  updateRecentPlay: (
    id: string,
    updates: Partial<Omit<RecentPlayItem, 'id'>>
  ): Promise<ApiResponse> => ipcRenderer.invoke('store:update-recent-play', id, updates),

  // 删除最近播放项
  removeRecentPlay: (id: string): Promise<ApiResponse> =>
    ipcRenderer.invoke('store:remove-recent-play', id),

  // 清空最近播放列表
  clearRecentPlays: (): Promise<ApiResponse> => ipcRenderer.invoke('store:clear-recent-plays'),

  // 根据文件路径获取最近播放项
  getRecentPlayByPath: (filePath: string): Promise<RecentPlayItem | null> =>
    ipcRenderer.invoke('store:get-recent-play-by-path', filePath),

  // 根据文件ID获取最近播放项
  getRecentPlayByFileId: (fileId: string): Promise<RecentPlayItem | null> =>
    ipcRenderer.invoke('store:get-recent-play-by-file-id', fileId),

  // 获取设置
  getSettings: (): Promise<StoreSettings> => ipcRenderer.invoke('store:get-settings'),

  // 更新设置
  updateSettings: (settings: Partial<StoreSettings>): Promise<ApiResponse> =>
    ipcRenderer.invoke('store:update-settings', settings),

  // 批量删除多个项目
  removeMultipleRecentPlays: (ids: string[]): Promise<ApiResponseWithCount> =>
    ipcRenderer.invoke('store:remove-multiple-recent-plays', ids),

  // 搜索最近播放项
  searchRecentPlays: (query: string): Promise<RecentPlayItem[]> =>
    ipcRenderer.invoke('store:search-recent-plays', query)
}

// 更新API
// 更新状态类型定义
interface UpdateStatus {
  status: 'checking' | 'available' | 'not-available' | 'downloading' | 'downloaded' | 'error'
  info?: {
    version: string
    releaseDate?: string
    releaseNotes?: string | Record<string, unknown>
    [key: string]: unknown
  }
  error?: string
  progress?: {
    percent: number
    bytesPerSecond: number
    total: number
    transferred: number
  }
}

const updateAPI = {
  // 检查更新
  checkForUpdates: (options?: { silent: boolean }): Promise<UpdateStatus> =>
    ipcRenderer.invoke('check-for-updates', options),

  // 下载更新
  downloadUpdate: (): Promise<UpdateStatus> => ipcRenderer.invoke('download-update'),

  // 安装更新
  installUpdate: (): Promise<void> => ipcRenderer.invoke('install-update'),

  // 启用/禁用自动更新
  enableAutoUpdate: (enable: boolean): Promise<void> =>
    ipcRenderer.invoke('enable-auto-update', enable),

  // 获取应用版本
  getAppVersion: (): Promise<string> => ipcRenderer.invoke('get-app-version'),

  // 获取更新设置
  getUpdateSettings: (): Promise<UpdateSettings> => ipcRenderer.invoke('get-update-settings'),

  // 保存更新设置
  saveUpdateSettings: (settings: Partial<UpdateSettings>): Promise<UpdateSettings> =>
    ipcRenderer.invoke('save-update-settings', settings),

  // 设置更新渠道
  setUpdateChannel: (channel: 'stable' | 'beta' | 'alpha'): Promise<UpdateSettings> =>
    ipcRenderer.invoke('set-update-channel', channel)
}

// Custom APIs for renderer
const api = {
  fileSystem: fileSystemAPI,
  dictionary: dictionaryAPI,
  store: storeAPI,
  update: updateAPI,
  // 日志API
  log: (level: 'debug' | 'info' | 'warn' | 'error', message: string, data?: unknown) =>
    ipcRenderer.invoke('log', level, message, data)
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
