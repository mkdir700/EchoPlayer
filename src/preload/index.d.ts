import { ElectronAPI } from '@electron-toolkit/preload'
import type {
  RecentPlayItem,
  StoreSettings,
  ApiResponse,
  ApiResponseWithCount
} from '../types/shared'

interface FileSystemAPI {
  checkFileExists: (filePath: string) => Promise<boolean>
  readFile: (filePath: string) => Promise<string | null>
  getFileUrl: (filePath: string) => Promise<string | null>
  getFileInfo: (filePath: string) => Promise<{
    size: number
    mtime: number
    isFile: boolean
    isDirectory: boolean
  } | null>
  validateFile: (
    filePath: string,
    expectedSize?: number,
    expectedMtime?: number
  ) => Promise<boolean>
  openFileDialog: (options: Electron.OpenDialogOptions) => Promise<Electron.OpenDialogReturnValue>
}

interface DictionaryAPI {
  youdaoRequest: (
    url: string,
    params: Record<string, string>
  ) => Promise<{
    success: boolean
    data?: unknown
    error?: string
  }>
  eudicRequest: (
    url: string,
    options: RequestInit
  ) => Promise<{
    success: boolean
    data?: unknown
    error?: string
    status?: number
  }>
  sha256: (text: string) => Promise<string | null>
  eudicHtmlRequest: (
    word: string,
    context?: string
  ) => Promise<{
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
  }>
}

interface UpdateAPI {
  checkForUpdates: (options?: { silent: boolean }) => Promise<UpdateInfoResponse>
  downloadUpdate: () => Promise<{
    status: 'downloading' | 'error'
    progress?: {
      percent: number
      bytesPerSecond: number
      total: number
      transferred: number
    }
    error?: string
  }>
  installUpdate: () => Promise<void>
  enableAutoUpdate: (enable: boolean) => Promise<void>
  getAppVersion: () => Promise<string>
  getUpdateSettings: () => Promise<UpdateSettings>
  saveUpdateSettings: (settings: UpdateSettings) => Promise<void>
  setUpdateChannel: (channel: 'stable' | 'beta' | 'alpha') => Promise<void>
}

interface StoreAPI {
  getRecentPlays: () => Promise<RecentPlayItem[]>
  addRecentPlay: (item: Omit<RecentPlayItem, 'fileId' | 'lastOpenedAt'>) => Promise<ApiResponse>
  updateRecentPlay: (
    fileId: string,
    updates: Partial<Omit<RecentPlayItem, 'fileId'>>
  ) => Promise<ApiResponse>
  getRecentPlayByFileId: (fileId: string) => Promise<RecentPlayItem | null>
  getPlaybackSettingsByFileId: (fileId: string) => Promise<VideoPlaybackSettings>
  updatePlaybackSettingsByFileId: (
    fileId: string,
    updates: Partial<VideoPlaybackSettings>
  ) => Promise<ApiResponse>
  removeRecentPlay: (fileId: string) => Promise<ApiResponse>
  clearRecentPlays: () => Promise<ApiResponse>
  getRecentPlayByPath: (filePath: string) => Promise<RecentPlayItem | null>
  getSettings: () => Promise<StoreSettings>
  updateSettings: (settings: Partial<StoreSettings>) => Promise<ApiResponse>
  removeMultipleRecentPlays: (fileIds: string[]) => Promise<ApiResponseWithCount>
  searchRecentPlays: (query: string) => Promise<RecentPlayItem[]>
}

declare global {
  interface Window {
    electron: ElectronAPI & {
      ipcRenderer: {
        invoke: (channel: string, ...args: unknown[]) => Promise<unknown>
        on: (channel: string, listener: (...args: unknown[]) => void) => void
        removeAllListeners: (channel: string) => void
      }
    }
    api: {
      fileSystem: FileSystemAPI
      dictionary: DictionaryAPI
      store: StoreAPI
      update: UpdateAPI
      log: (
        level: 'debug' | 'info' | 'warn' | 'error',
        message: string,
        data?: unknown
      ) => Promise<void>
    }
  }
}
