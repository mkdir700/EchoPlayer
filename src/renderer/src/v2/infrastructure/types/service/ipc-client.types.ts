/**
 * IPC客户端服务类型定义
 * IPC Client Service Type Definitions
 *
 * 封装所有 preload API 调用的类型安全 IPC 客户端服务
 * Type-safe IPC client service that encapsulates all preload API calls
 */

import type { IBaseService, ServiceResult } from './base.types'
import type { FileDialogOptions, UpdateStatus } from '../api/ipc.types'
import type { RecentPlayItem } from '@types_/domain/video.types'
import type {
  StoreSettings,
  VideoUIConfig,
  AppConfig,
  TitleBarOverlayOptions,
  TranscodeOptions,
  VideoInfo,
  UpdateSettings
} from '@types_/shared'

// IPC客户端配置接口 / IPC Client Configuration Interface
export interface IpcClientConfig {
  timeout: number
  retries: number
  retryDelay: number
  enableLogging: boolean
  logLevel: 'debug' | 'info' | 'warn' | 'error'
}

// IPC操作选项 / IPC Operation Options
export interface IpcOperationOptions {
  timeout?: number
  retries?: number
  retryDelay?: number
  silent?: boolean
}

// IPC错误类型 / IPC Error Types
export enum IpcErrorType {
  TIMEOUT = 'timeout',
  CHANNEL_NOT_FOUND = 'channel_not_found',
  INVALID_PARAMS = 'invalid_params',
  OPERATION_FAILED = 'operation_failed',
  CONNECTION_LOST = 'connection_lost',
  PRELOAD_NOT_AVAILABLE = 'preload_not_available'
}

// IPC错误信息 / IPC Error Information
export interface IpcErrorInfo {
  type: IpcErrorType
  message: string
  channel?: string
  requestId?: string
  originalError?: Error
}

// 文件系统服务接口 / File System Service Interface
export interface IFileSystemService {
  checkFileExists(filePath: string, options?: IpcOperationOptions): Promise<ServiceResult<boolean>>
  readFile(filePath: string, options?: IpcOperationOptions): Promise<ServiceResult<string | null>>
  getFileUrl(filePath: string, options?: IpcOperationOptions): Promise<ServiceResult<string | null>>
  getFileInfo(
    filePath: string,
    options?: IpcOperationOptions
  ): Promise<
    ServiceResult<{
      size: number
      mtime: number
      isFile: boolean
      isDirectory: boolean
    } | null>
  >
  validateFile(
    filePath: string,
    expectedSize?: number,
    expectedMtime?: number,
    options?: IpcOperationOptions
  ): Promise<ServiceResult<boolean>>
  openFileDialog(
    dialogOptions: FileDialogOptions,
    options?: IpcOperationOptions
  ): Promise<ServiceResult<Electron.OpenDialogReturnValue>>
  showItemInFolder(filePath: string, options?: IpcOperationOptions): Promise<ServiceResult<boolean>>
}

// 词典服务接口 / Dictionary Service Interface
export interface IDictionaryService {
  youdaoRequest(
    url: string,
    params: Record<string, string>,
    options?: IpcOperationOptions
  ): Promise<ServiceResult<{ success: boolean; data?: unknown; error?: string }>>
  eudicRequest(
    url: string,
    requestOptions: RequestInit,
    options?: IpcOperationOptions
  ): Promise<ServiceResult<{ success: boolean; data?: unknown; error?: string; status?: number }>>
  sha256(text: string, options?: IpcOperationOptions): Promise<ServiceResult<string | null>>
  eudicHtmlRequest(
    word: string,
    context?: string,
    options?: IpcOperationOptions
  ): Promise<
    ServiceResult<{
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
  >
}

// 存储服务接口 / Storage Service Interface
export interface IStorageService {
  // 最近播放项管理 / Recent Play Items Management
  getRecentPlays(options?: IpcOperationOptions): Promise<ServiceResult<RecentPlayItem[]>>
  addRecentPlay(
    item: Omit<RecentPlayItem, 'videoInfo' | 'lastPlayedAt'> & {
      videoInfo: Omit<RecentPlayItem['videoInfo'], 'id'>
    },
    options?: IpcOperationOptions
  ): Promise<ServiceResult<void>>
  updateRecentPlay(
    id: string,
    updates: Partial<RecentPlayItem>,
    options?: IpcOperationOptions
  ): Promise<ServiceResult<void>>
  removeRecentPlay(id: string, options?: IpcOperationOptions): Promise<ServiceResult<void>>
  clearRecentPlays(options?: IpcOperationOptions): Promise<ServiceResult<void>>
  getRecentPlayByPath(
    filePath: string,
    options?: IpcOperationOptions
  ): Promise<ServiceResult<RecentPlayItem | null>>
  getRecentPlayByFileId(
    fileId: string,
    options?: IpcOperationOptions
  ): Promise<ServiceResult<RecentPlayItem | null>>
  removeMultipleRecentPlays(
    ids: string[],
    options?: IpcOperationOptions
  ): Promise<ServiceResult<{ count: number }>>
  searchRecentPlays(
    query: string,
    options?: IpcOperationOptions
  ): Promise<ServiceResult<RecentPlayItem[]>>

  // 设置管理 / Settings Management
  getSettings(options?: IpcOperationOptions): Promise<ServiceResult<StoreSettings>>
  updateSettings(
    settings: Partial<StoreSettings>,
    options?: IpcOperationOptions
  ): Promise<ServiceResult<void>>

  // 视频UI配置 / Video UI Configuration
  getVideoUIConfig(
    fileId: string,
    options?: IpcOperationOptions
  ): Promise<ServiceResult<VideoUIConfig>>
  updateVideoUIConfig(
    fileId: string,
    config: Partial<VideoUIConfig>,
    options?: IpcOperationOptions
  ): Promise<ServiceResult<void>>

  // 通用存储方法 / Generic Storage Methods
  getRawData(key: string, options?: IpcOperationOptions): Promise<ServiceResult<string | null>>
  setRawData(
    key: string,
    value: string,
    options?: IpcOperationOptions
  ): Promise<ServiceResult<void>>
  removeRawData(key: string, options?: IpcOperationOptions): Promise<ServiceResult<void>>
}

// 更新服务接口 / Update Service Interface
export interface IUpdateService {
  checkForUpdates(
    checkOptions?: { silent: boolean },
    options?: IpcOperationOptions
  ): Promise<ServiceResult<UpdateStatus>>
  downloadUpdate(options?: IpcOperationOptions): Promise<ServiceResult<UpdateStatus>>
  installUpdate(options?: IpcOperationOptions): Promise<ServiceResult<void>>
  enableAutoUpdate(enable: boolean, options?: IpcOperationOptions): Promise<ServiceResult<void>>
  getAppVersion(options?: IpcOperationOptions): Promise<ServiceResult<string>>
  getUpdateSettings(options?: IpcOperationOptions): Promise<ServiceResult<UpdateSettings>>
  saveUpdateSettings(
    settings: UpdateSettings,
    options?: IpcOperationOptions
  ): Promise<ServiceResult<void>>
  setUpdateChannel(
    channel: 'stable' | 'beta' | 'alpha',
    options?: IpcOperationOptions
  ): Promise<ServiceResult<void>>
}

// 应用配置服务接口 / App Configuration Service Interface
export interface IAppConfigService {
  getConfig(options?: IpcOperationOptions): Promise<ServiceResult<AppConfig>>
  updateConfig(
    updates: Partial<AppConfig>,
    options?: IpcOperationOptions
  ): Promise<ServiceResult<void>>
  resetConfig(options?: IpcOperationOptions): Promise<ServiceResult<void>>
  getDefaultDataDirectory(options?: IpcOperationOptions): Promise<ServiceResult<string>>
  getTestVideoPath(options?: IpcOperationOptions): Promise<ServiceResult<string>>
}

// 窗口控制服务接口 / Window Control Service Interface
export interface IWindowService {
  setTitleBarOverlay(
    overlay: TitleBarOverlayOptions,
    options?: IpcOperationOptions
  ): Promise<ServiceResult<void>>
  setAlwaysOnTop(alwaysOnTop: boolean, options?: IpcOperationOptions): Promise<ServiceResult<void>>
  isAlwaysOnTop(options?: IpcOperationOptions): Promise<ServiceResult<boolean>>
  minimize(options?: IpcOperationOptions): Promise<ServiceResult<void>>
  maximize(options?: IpcOperationOptions): Promise<ServiceResult<void>>
  close(options?: IpcOperationOptions): Promise<ServiceResult<void>>
  restart(options?: IpcOperationOptions): Promise<ServiceResult<void>>
  getPlatform(options?: IpcOperationOptions): Promise<ServiceResult<string>>
  getVersion(options?: IpcOperationOptions): Promise<ServiceResult<string>>
  setFullScreen(fullscreen: boolean, options?: IpcOperationOptions): Promise<ServiceResult<void>>
  isFullScreen(options?: IpcOperationOptions): Promise<ServiceResult<boolean>>
  toggleFullScreen(options?: IpcOperationOptions): Promise<ServiceResult<boolean>>
}

// 环境信息服务接口 / Environment Info Service Interface
export interface IEnvironmentService {
  getNodeEnv(): string
  isTestEnv(): boolean
  isDevelopment(): boolean
}

// FFmpeg服务接口 / FFmpeg Service Interface
export interface IFFmpegService {
  checkExists(options?: IpcOperationOptions): Promise<ServiceResult<boolean>>
  getVersion(options?: IpcOperationOptions): Promise<ServiceResult<string | null>>
  download(options?: IpcOperationOptions): Promise<ServiceResult<void>>
  getVideoInfo(
    inputPath: string,
    options?: IpcOperationOptions
  ): Promise<ServiceResult<VideoInfo | null>>
  transcode(
    inputPath: string,
    outputPath?: string,
    transcodeOptions?: TranscodeOptions,
    options?: IpcOperationOptions
  ): Promise<ServiceResult<{ outputPath?: string }>>
  getPath(options?: IpcOperationOptions): Promise<ServiceResult<string>>
  getDataDirectory(options?: IpcOperationOptions): Promise<ServiceResult<string>>
  cancelTranscode(options?: IpcOperationOptions): Promise<ServiceResult<boolean>>
}

// 日志服务接口 / Logging Service Interface
export interface ILoggingService {
  log(
    level: 'debug' | 'info' | 'warn' | 'error',
    message: string,
    data?: unknown,
    options?: IpcOperationOptions
  ): Promise<ServiceResult<void>>
}

// IPC客户端服务主接口 / Main IPC Client Service Interface
export interface IIPCClientService extends IBaseService {
  readonly fileSystem: IFileSystemService
  readonly dictionary: IDictionaryService
  readonly storage: IStorageService
  readonly update: IUpdateService
  readonly appConfig: IAppConfigService
  readonly window: IWindowService
  readonly environment: IEnvironmentService
  readonly ffmpeg: IFFmpegService
  readonly logging: ILoggingService

  // 配置管理 / Configuration Management
  getConfig(): IpcClientConfig
  updateConfig(config: Partial<IpcClientConfig>): void

  // 连接状态检查 / Connection Status Check
  isPreloadAvailable(): boolean
}

// IPC客户端工厂接口 / IPC Client Factory Interface
export interface IIPCClientFactory {
  create(config?: Partial<IpcClientConfig>): IIPCClientService
}
