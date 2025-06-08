import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import type {
  RecentPlayItem,
  StoreSettings,
  ApiResponse,
  ApiResponseWithCount,
  UpdateSettings,
  VideoUIConfig,
  AppConfig,
  TitleBarOverlayOptions,
  TranscodeOptions,
  VideoInfo
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
    ipcRenderer.invoke('dialog:open-file', options),

  // 在文件管理器中显示文件
  showItemInFolder: (filePath: string): Promise<boolean> =>
    ipcRenderer.invoke('shell:showItemInFolder', filePath)
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
    ipcRenderer.invoke('store:search-recent-plays', query),

  // 获取视频UI配置
  getVideoUIConfig: (fileId: string): Promise<VideoUIConfig> =>
    ipcRenderer.invoke('store:get-video-ui-config', fileId),

  // 更新视频UI配置
  updateVideoUIConfig: (fileId: string, config: Partial<VideoUIConfig>): Promise<ApiResponse> =>
    ipcRenderer.invoke('store:update-video-ui-config', fileId, config),

  // 通用存储方法 - 支持 Zustand persist 中间件
  // Generic storage methods - support Zustand persist middleware
  getRawData: (key: string): Promise<string | null> =>
    ipcRenderer.invoke('store:get-raw-data', key),
  setRawData: (key: string, value: string): Promise<ApiResponse> =>
    ipcRenderer.invoke('store:set-raw-data', key, value),
  removeRawData: (key: string): Promise<ApiResponse> =>
    ipcRenderer.invoke('store:remove-raw-data', key)
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

// 应用配置 API / Application configuration API
const appConfigAPI = {
  // 获取应用配置
  getConfig: (): Promise<AppConfig> => ipcRenderer.invoke('app:get-config'),

  // 更新应用配置
  updateConfig: (updates: Partial<AppConfig>): Promise<ApiResponse> =>
    ipcRenderer.invoke('app:update-config', updates),

  // 重置应用配置
  resetConfig: (): Promise<ApiResponse> => ipcRenderer.invoke('app:reset-config'),

  // 获取默认数据目录
  getDefaultDataDirectory: (): Promise<string> =>
    ipcRenderer.invoke('app:get-default-data-directory'),

  // 获取测试视频文件路径
  getTestVideoPath: (): Promise<string> => ipcRenderer.invoke('app:get-test-video-path')
}

// 窗口控制 API / Window control API
const windowAPI = {
  // 设置标题栏覆盖样式
  setTitleBarOverlay: (overlay: TitleBarOverlayOptions): Promise<void> =>
    ipcRenderer.invoke('window:set-title-bar-overlay', overlay),

  // 设置窗口置顶
  setAlwaysOnTop: (alwaysOnTop: boolean): Promise<void> =>
    ipcRenderer.invoke('window:set-always-on-top', alwaysOnTop),

  // 获取窗口置顶状态
  isAlwaysOnTop: (): Promise<boolean> => ipcRenderer.invoke('window:is-always-on-top'),

  // 最小化窗口
  minimize: (): Promise<void> => ipcRenderer.invoke('window:minimize'),

  // 最大化/恢复窗口
  maximize: (): Promise<void> => ipcRenderer.invoke('window:maximize'),

  // 关闭窗口
  close: (): Promise<void> => ipcRenderer.invoke('window:close'),

  // 重启应用
  restart: (): Promise<void> => ipcRenderer.invoke('app:restart'),

  // 获取平台信息
  getPlatform: (): Promise<string> => ipcRenderer.invoke('app:get-platform'),

  // 获取应用版本
  getVersion: (): Promise<string> => ipcRenderer.invoke('app:get-version'),

  // 设置全屏模式
  setFullScreen: (fullscreen: boolean): Promise<void> =>
    ipcRenderer.invoke('window:set-fullscreen', fullscreen),

  // 获取全屏状态
  isFullScreen: (): Promise<boolean> => ipcRenderer.invoke('window:is-fullscreen'),

  // 切换全屏模式
  toggleFullScreen: (): Promise<boolean> => ipcRenderer.invoke('window:toggle-fullscreen')
}

// 环境信息 API / Environment info API
const envAPI = {
  // 获取当前环境 / Get current environment
  getNodeEnv: (): string => process.env.NODE_ENV || 'production',

  // 检查是否是测试环境 / Check if in test environment
  isTestEnv: (): boolean => process.env.NODE_ENV === 'test',

  // 检查是否是开发环境 / Check if in development environment
  isDevelopment: (): boolean => process.env.NODE_ENV === 'development'
}

// FFmpeg API
const ffmpegAPI = {
  // 检查 FFmpeg 是否存在
  checkExists: (): Promise<boolean> => ipcRenderer.invoke('ffmpeg:check-exists'),

  // 获取 FFmpeg 版本信息
  getVersion: (): Promise<string | null> => ipcRenderer.invoke('ffmpeg:get-version'),

  // 下载 FFmpeg
  download: (): Promise<ApiResponse> => ipcRenderer.invoke('ffmpeg:download'),

  // 获取视频信息
  getVideoInfo: (inputPath: string): Promise<VideoInfo | null> =>
    ipcRenderer.invoke('ffmpeg:get-video-info', inputPath),

  // 转码视频
  transcode: (
    inputPath: string,
    outputPath?: string,
    options?: TranscodeOptions
  ): Promise<ApiResponse & { outputPath?: string }> =>
    ipcRenderer.invoke('ffmpeg:transcode', inputPath, outputPath, options),

  // 获取 FFmpeg 路径
  getPath: (): Promise<string> => ipcRenderer.invoke('ffmpeg:get-path'),

  // 获取用户数据目录
  getDataDirectory: (): Promise<string> => ipcRenderer.invoke('ffmpeg:get-data-directory'),

  // 取消转码
  cancelTranscode: (): Promise<boolean> => ipcRenderer.invoke('ffmpeg:cancel-transcode')
}

// Custom APIs for renderer
const api = {
  fileSystem: fileSystemAPI,
  dictionary: dictionaryAPI,
  store: storeAPI,
  update: updateAPI,
  appConfig: appConfigAPI, // 应用配置 API / Application configuration API
  window: windowAPI, // 窗口控制 API / Window control API
  env: envAPI, // 环境信息 API / Environment info API
  ffmpeg: ffmpegAPI, // FFmpeg API
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
