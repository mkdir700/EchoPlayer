/**
 * IPC客户端服务实现
 * IPC Client Service Implementation
 *
 * 封装所有 preload API 调用的类型安全 IPC 客户端服务
 * Type-safe IPC client service that encapsulates all preload API calls
 */

import {
  IIPCClientService,
  IFileSystemService,
  IDictionaryService,
  IStorageService,
  IUpdateService,
  IAppConfigService,
  IWindowService,
  IEnvironmentService,
  IFFmpegService,
  ILoggingService,
  IpcClientConfig,
  IpcOperationOptions,
  IpcErrorType,
  IpcErrorInfo
} from '../../infrastructure/types/service/ipc-client.types'
import {
  ServiceStatus,
  ServiceErrorType,
  type ServiceResult,
  type ServiceInitOptions,
  type HealthCheckResult,
  type ServiceError
} from '../../infrastructure/types/service/base.types'
import type { RecentPlayItem } from '../../infrastructure/types/domain/video.types'
import type {
  StoreSettings,
  VideoUIConfig,
  AppConfig,
  TitleBarOverlayOptions,
  TranscodeOptions,
  VideoInfo,
  UpdateInfoResponse,
  UpdateSettings
} from '@types_/shared'
import type { FileDialogOptions } from '../../infrastructure/types/api/ipc.types'
import { OpenDialogOptions } from 'electron/main'

// 默认配置 / Default Configuration
const DEFAULT_CONFIG: IpcClientConfig = {
  timeout: 30000,
  retries: 3,
  retryDelay: 1000,
  enableLogging: true,
  logLevel: 'info'
}

// IPC客户端错误类 / IPC Client Error Class
class IpcClientError extends Error {
  readonly type: IpcErrorType
  readonly code?: string
  readonly channel?: string
  readonly requestId?: string
  readonly originalError?: Error

  constructor(info: IpcErrorInfo) {
    super(info.message)
    this.name = 'IpcClientError'
    this.type = info.type
    this.code = info.type
    this.channel = info.channel
    this.requestId = info.requestId
    this.originalError = info.originalError
  }
}

// 重试工具函数 / Retry Utility Function
async function withRetry<T>(
  operation: () => Promise<T>,
  options: {
    retries: number
    retryDelay: number
    operationName: string
  }
): Promise<T> {
  let lastError: Error | undefined

  for (let attempt = 0; attempt <= options.retries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error as Error

      if (attempt < options.retries) {
        await new Promise((resolve) => setTimeout(resolve, options.retryDelay))
        continue
      }
    }
  }

  throw new IpcClientError({
    type: IpcErrorType.OPERATION_FAILED,
    message: `Operation ${options.operationName} failed after ${options.retries + 1} attempts: ${lastError?.message || 'Unknown error'}`,
    originalError: lastError
  })
}

// 操作包装器 / Operation Wrapper
function createOperationWrapper(config: IpcClientConfig, serviceName: string) {
  return async <T>(
    operation: () => Promise<T>,
    operationName: string,
    options?: IpcOperationOptions
  ): Promise<ServiceResult<T>> => {
    const effectiveOptions = {
      timeout: options?.timeout ?? config.timeout,
      retries: options?.retries ?? config.retries,
      retryDelay: options?.retryDelay ?? config.retryDelay,
      silent: options?.silent ?? false
    }

    try {
      // 检查 preload API 是否可用 / Check if preload API is available
      if (!window.api) {
        throw new IpcClientError({
          type: IpcErrorType.PRELOAD_NOT_AVAILABLE,
          message: 'Preload API is not available'
        })
      }

      // 执行带重试的操作 / Execute operation with retry
      const data = await withRetry(operation, {
        retries: effectiveOptions.retries,
        retryDelay: effectiveOptions.retryDelay,
        operationName: `${serviceName}.${operationName}`
      })

      return {
        success: true,
        data
      }
    } catch (error) {
      const serviceError: ServiceError = {
        type:
          error instanceof IpcClientError
            ? (error.type as unknown as ServiceErrorType)
            : ServiceErrorType.INTERNAL,
        message: error instanceof Error ? error.message : 'Unknown error',
        code: error instanceof IpcClientError ? error.code : undefined,
        details: {
          serviceName,
          operationName,
          channel: error instanceof IpcClientError ? error.channel : undefined,
          requestId: error instanceof IpcClientError ? error.requestId : undefined
        },
        timestamp: Date.now()
      }

      if (config.enableLogging && !effectiveOptions.silent) {
        console.error(`[IPCClient] ${serviceName}.${operationName} failed:`, serviceError)
      }

      return {
        success: false,
        error: serviceError.message,
        code: serviceError.code
      }
    }
  }
}

// 文件系统服务实现 / File System Service Implementation
class FileSystemService implements IFileSystemService {
  constructor(private wrapper: ReturnType<typeof createOperationWrapper>) {}

  async checkFileExists(
    filePath: string,
    options?: IpcOperationOptions
  ): Promise<ServiceResult<boolean>> {
    return this.wrapper(
      () => window.api.fileSystem.checkFileExists(filePath),
      'checkFileExists',
      options
    )
  }

  async readFile(
    filePath: string,
    options?: IpcOperationOptions
  ): Promise<ServiceResult<string | null>> {
    return this.wrapper(() => window.api.fileSystem.readFile(filePath), 'readFile', options)
  }

  async getFileUrl(
    filePath: string,
    options?: IpcOperationOptions
  ): Promise<ServiceResult<string | null>> {
    return this.wrapper(() => window.api.fileSystem.getFileUrl(filePath), 'getFileUrl', options)
  }

  async getFileInfo(
    filePath: string,
    options?: IpcOperationOptions
  ): Promise<
    ServiceResult<{ size: number; mtime: number; isFile: boolean; isDirectory: boolean } | null>
  > {
    return this.wrapper(() => window.api.fileSystem.getFileInfo(filePath), 'getFileInfo', options)
  }

  async validateFile(
    filePath: string,
    expectedSize?: number,
    expectedMtime?: number,
    options?: IpcOperationOptions
  ): Promise<ServiceResult<boolean>> {
    return this.wrapper(
      () => window.api.fileSystem.validateFile(filePath, expectedSize, expectedMtime),
      'validateFile',
      options
    )
  }

  async openFileDialog(
    dialogOptions: FileDialogOptions,
    options?: IpcOperationOptions
  ): Promise<ServiceResult<Electron.OpenDialogReturnValue>> {
    return this.wrapper(
      () => window.api.fileSystem.openFileDialog(dialogOptions as OpenDialogOptions),
      'openFileDialog',
      options
    )
  }

  async showItemInFolder(
    filePath: string,
    options?: IpcOperationOptions
  ): Promise<ServiceResult<boolean>> {
    return this.wrapper(
      () => window.api.fileSystem.showItemInFolder(filePath),
      'showItemInFolder',
      options
    )
  }
}

// 词典服务实现 / Dictionary Service Implementation
class DictionaryService implements IDictionaryService {
  constructor(private wrapper: ReturnType<typeof createOperationWrapper>) {}

  async youdaoRequest(
    url: string,
    params: Record<string, string>,
    options?: IpcOperationOptions
  ): Promise<ServiceResult<{ success: boolean; data?: unknown; error?: string }>> {
    return this.wrapper(
      () => window.api.dictionary.youdaoRequest(url, params),
      'youdaoRequest',
      options
    )
  }

  async eudicRequest(
    url: string,
    requestOptions: RequestInit,
    options?: IpcOperationOptions
  ): Promise<ServiceResult<{ success: boolean; data?: unknown; error?: string; status?: number }>> {
    return this.wrapper(
      () => window.api.dictionary.eudicRequest(url, requestOptions),
      'eudicRequest',
      options
    )
  }

  async sha256(text: string, options?: IpcOperationOptions): Promise<ServiceResult<string | null>> {
    return this.wrapper(() => window.api.dictionary.sha256(text), 'sha256', options)
  }

  async eudicHtmlRequest(
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
  > {
    return this.wrapper(
      () => window.api.dictionary.eudicHtmlRequest(word, context),
      'eudicHtmlRequest',
      options
    )
  }
}

// 存储服务实现 / Storage Service Implementation
class StorageService implements IStorageService {
  constructor(private wrapper: ReturnType<typeof createOperationWrapper>) {}

  async getRecentPlays(options?: IpcOperationOptions): Promise<ServiceResult<RecentPlayItem[]>> {
    return this.wrapper(() => window.api.store.getRecentPlays(), 'getRecentPlays', options)
  }

  async addRecentPlay(
    item: RecentPlayItem,
    options?: IpcOperationOptions
  ): Promise<ServiceResult<void>> {
    return this.wrapper(
      async () => {
        const result = await window.api.store.addRecentPlay(item)
        if (!result.success) {
          throw new Error(result.error || 'Failed to add recent play')
        }
      },
      'addRecentPlay',
      options
    )
  }

  async updateRecentPlay(
    id: string,
    updates: Partial<Omit<RecentPlayItem, 'id'>>,
    options?: IpcOperationOptions
  ): Promise<ServiceResult<void>> {
    return this.wrapper(
      async () => {
        const result = await window.api.store.updateRecentPlay(id, updates)
        if (!result.success) {
          throw new Error(result.error || 'Failed to update recent play')
        }
      },
      'updateRecentPlay',
      options
    )
  }

  async removeRecentPlay(id: string, options?: IpcOperationOptions): Promise<ServiceResult<void>> {
    return this.wrapper(
      async () => {
        const result = await window.api.store.removeRecentPlay(id)
        if (!result.success) {
          throw new Error(result.error || 'Failed to remove recent play')
        }
      },
      'removeRecentPlay',
      options
    )
  }

  async clearRecentPlays(options?: IpcOperationOptions): Promise<ServiceResult<void>> {
    return this.wrapper(
      async () => {
        const result = await window.api.store.clearRecentPlays()
        if (!result.success) {
          throw new Error(result.error || 'Failed to clear recent plays')
        }
      },
      'clearRecentPlays',
      options
    )
  }

  async getRecentPlayByPath(
    filePath: string,
    options?: IpcOperationOptions
  ): Promise<ServiceResult<RecentPlayItem | null>> {
    return this.wrapper(
      () => window.api.store.getRecentPlayByPath(filePath),
      'getRecentPlayByPath',
      options
    )
  }

  async getRecentPlayByFileId(
    fileId: string,
    options?: IpcOperationOptions
  ): Promise<ServiceResult<RecentPlayItem | null>> {
    return this.wrapper(
      () => window.api.store.getRecentPlayByFileId(fileId),
      'getRecentPlayByFileId',
      options
    )
  }

  async removeMultipleRecentPlays(
    ids: string[],
    options?: IpcOperationOptions
  ): Promise<ServiceResult<{ count: number }>> {
    return this.wrapper(
      async () => {
        const result = await window.api.store.removeMultipleRecentPlays(ids)
        if (!result.success) {
          throw new Error(result.error || 'Failed to remove multiple recent plays')
        }
        return { count: result.removedCount || 0 }
      },
      'removeMultipleRecentPlays',
      options
    )
  }

  async searchRecentPlays(
    query: string,
    options?: IpcOperationOptions
  ): Promise<ServiceResult<RecentPlayItem[]>> {
    return this.wrapper(
      () => window.api.store.searchRecentPlays(query),
      'searchRecentPlays',
      options
    )
  }

  async getSettings(options?: IpcOperationOptions): Promise<ServiceResult<StoreSettings>> {
    return this.wrapper(() => window.api.store.getSettings(), 'getSettings', options)
  }

  async updateSettings(
    settings: Partial<StoreSettings>,
    options?: IpcOperationOptions
  ): Promise<ServiceResult<void>> {
    return this.wrapper(
      async () => {
        const result = await window.api.store.updateSettings(settings)
        if (!result.success) {
          throw new Error(result.error || 'Failed to update settings')
        }
      },
      'updateSettings',
      options
    )
  }

  async getVideoUIConfig(
    fileId: string,
    options?: IpcOperationOptions
  ): Promise<ServiceResult<VideoUIConfig>> {
    return this.wrapper(
      () => window.api.store.getVideoUIConfig(fileId),
      'getVideoUIConfig',
      options
    )
  }

  async updateVideoUIConfig(
    fileId: string,
    config: Partial<VideoUIConfig>,
    options?: IpcOperationOptions
  ): Promise<ServiceResult<void>> {
    return this.wrapper(
      async () => {
        const result = await window.api.store.updateVideoUIConfig(fileId, config)
        if (!result.success) {
          throw new Error(result.error || 'Failed to update video UI config')
        }
      },
      'updateVideoUIConfig',
      options
    )
  }

  async getRawData(
    key: string,
    options?: IpcOperationOptions
  ): Promise<ServiceResult<string | null>> {
    return this.wrapper(() => window.api.store.getRawData(key), 'getRawData', options)
  }

  async setRawData(
    key: string,
    value: string,
    options?: IpcOperationOptions
  ): Promise<ServiceResult<void>> {
    return this.wrapper(
      async () => {
        const result = await window.api.store.setRawData(key, value)
        if (!result.success) {
          throw new Error(result.error || 'Failed to set raw data')
        }
      },
      'setRawData',
      options
    )
  }

  async removeRawData(key: string, options?: IpcOperationOptions): Promise<ServiceResult<void>> {
    return this.wrapper(
      async () => {
        const result = await window.api.store.removeRawData(key)
        if (!result.success) {
          throw new Error(result.error || 'Failed to remove raw data')
        }
      },
      'removeRawData',
      options
    )
  }
}

class UpdateService implements IUpdateService {
  constructor(private wrapper: ReturnType<typeof createOperationWrapper>) {}

  async checkForUpdates(
    checkOptions?: { silent: boolean },
    options?: IpcOperationOptions
  ): Promise<ServiceResult<UpdateInfoResponse>> {
    return this.wrapper(
      async () => {
        const result = await window.api.update.checkForUpdates(checkOptions)
        if (!result.success) {
          throw new Error(result.error || 'Failed to check for updates')
        }
        return result
      },
      'checkForUpdates',
      options
    )
  }

  async downloadUpdate(options?: IpcOperationOptions): Promise<
    ServiceResult<{
      status: 'downloading' | 'error'
      progress?: {
        percent: number
        bytesPerSecond: number
        total: number
        transferred: number
      }
      error?: string
    }>
  > {
    return this.wrapper(async () => window.api.update.downloadUpdate(), 'downloadUpdate', options)
  }

  async installUpdate(options?: IpcOperationOptions): Promise<ServiceResult<void>> {
    return this.wrapper(async () => window.api.update.installUpdate(), 'installUpdate', options)
  }

  async enableAutoUpdate(
    enable: boolean,
    options?: IpcOperationOptions
  ): Promise<ServiceResult<void>> {
    return this.wrapper(
      async () => window.api.update.enableAutoUpdate(enable),
      'enableAutoUpdate',
      options
    )
  }

  async getAppVersion(options?: IpcOperationOptions): Promise<ServiceResult<string>> {
    return this.wrapper(async () => window.api.update.getAppVersion(), 'getAppVersion', options)
  }

  async getUpdateSettings(options?: IpcOperationOptions): Promise<ServiceResult<UpdateSettings>> {
    return this.wrapper(
      async () => window.api.update.getUpdateSettings(),
      'getUpdateSettings',
      options
    )
  }

  async saveUpdateSettings(
    settings: UpdateSettings,
    options?: IpcOperationOptions
  ): Promise<ServiceResult<void>> {
    return this.wrapper(
      async () => window.api.update.saveUpdateSettings(settings),
      'saveUpdateSettings',
      options
    )
  }

  async setUpdateChannel(
    channel: 'stable' | 'beta' | 'alpha',
    options?: IpcOperationOptions
  ): Promise<ServiceResult<void>> {
    return this.wrapper(
      async () => window.api.update.setUpdateChannel(channel),
      'setUpdateChannel',
      options
    )
  }
}

class AppConfigService implements IAppConfigService {
  constructor(private wrapper: ReturnType<typeof createOperationWrapper>) {}

  async getConfig(options?: IpcOperationOptions): Promise<ServiceResult<AppConfig>> {
    return this.wrapper(() => window.api.appConfig.getConfig(), 'getConfig', options)
  }

  async updateConfig(
    updates: Partial<AppConfig>,
    options?: IpcOperationOptions
  ): Promise<ServiceResult<void>> {
    return this.wrapper(
      async () => {
        const result = await window.api.appConfig.updateConfig(updates)
        if (!result.success) {
          throw new Error(result.error || 'Failed to update config')
        }
      },
      'updateConfig',
      options
    )
  }

  async resetConfig(options?: IpcOperationOptions): Promise<ServiceResult<void>> {
    return this.wrapper(
      async () => {
        const result = await window.api.appConfig.resetConfig()
        if (!result.success) {
          throw new Error(result.error || 'Failed to reset config')
        }
      },
      'resetConfig',
      options
    )
  }

  async getDefaultDataDirectory(options?: IpcOperationOptions): Promise<ServiceResult<string>> {
    return this.wrapper(
      () => window.api.appConfig.getDefaultDataDirectory(),
      'getDefaultDataDirectory',
      options
    )
  }

  async getTestVideoPath(options?: IpcOperationOptions): Promise<ServiceResult<string>> {
    return this.wrapper(() => window.api.appConfig.getTestVideoPath(), 'getTestVideoPath', options)
  }
}

class WindowService implements IWindowService {
  constructor(private wrapper: ReturnType<typeof createOperationWrapper>) {}

  async setTitleBarOverlay(
    overlay: TitleBarOverlayOptions,
    options?: IpcOperationOptions
  ): Promise<ServiceResult<void>> {
    return this.wrapper(
      () => window.api.window.setTitleBarOverlay(overlay),
      'setTitleBarOverlay',
      options
    )
  }

  async setAlwaysOnTop(
    alwaysOnTop: boolean,
    options?: IpcOperationOptions
  ): Promise<ServiceResult<void>> {
    return this.wrapper(
      () => window.api.window.setAlwaysOnTop(alwaysOnTop),
      'setAlwaysOnTop',
      options
    )
  }

  async isAlwaysOnTop(options?: IpcOperationOptions): Promise<ServiceResult<boolean>> {
    return this.wrapper(() => window.api.window.isAlwaysOnTop(), 'isAlwaysOnTop', options)
  }

  async minimize(options?: IpcOperationOptions): Promise<ServiceResult<void>> {
    return this.wrapper(() => window.api.window.minimize(), 'minimize', options)
  }

  async maximize(options?: IpcOperationOptions): Promise<ServiceResult<void>> {
    return this.wrapper(() => window.api.window.maximize(), 'maximize', options)
  }

  async close(options?: IpcOperationOptions): Promise<ServiceResult<void>> {
    return this.wrapper(() => window.api.window.close(), 'close', options)
  }

  async restart(options?: IpcOperationOptions): Promise<ServiceResult<void>> {
    return this.wrapper(() => window.api.window.restart(), 'restart', options)
  }

  async getPlatform(options?: IpcOperationOptions): Promise<ServiceResult<string>> {
    return this.wrapper(() => window.api.window.getPlatform(), 'getPlatform', options)
  }

  async getVersion(options?: IpcOperationOptions): Promise<ServiceResult<string>> {
    return this.wrapper(() => window.api.window.getVersion(), 'getVersion', options)
  }

  async setFullScreen(
    fullscreen: boolean,
    options?: IpcOperationOptions
  ): Promise<ServiceResult<void>> {
    return this.wrapper(() => window.api.window.setFullScreen(fullscreen), 'setFullScreen', options)
  }

  async isFullScreen(options?: IpcOperationOptions): Promise<ServiceResult<boolean>> {
    return this.wrapper(() => window.api.window.isFullScreen(), 'isFullScreen', options)
  }

  async toggleFullScreen(options?: IpcOperationOptions): Promise<ServiceResult<boolean>> {
    return this.wrapper(() => window.api.window.toggleFullScreen(), 'toggleFullScreen', options)
  }
}

class EnvironmentService implements IEnvironmentService {
  getNodeEnv(): string {
    return window.api.env.getNodeEnv()
  }

  isTestEnv(): boolean {
    return window.api.env.isTestEnv()
  }

  isDevelopment(): boolean {
    return window.api.env.isDevelopment()
  }
}

class FFmpegService implements IFFmpegService {
  constructor(private wrapper: ReturnType<typeof createOperationWrapper>) {}

  async checkExists(options?: IpcOperationOptions): Promise<ServiceResult<boolean>> {
    return this.wrapper(() => window.api.ffmpeg.checkExists(), 'checkExists', options)
  }

  async getVersion(options?: IpcOperationOptions): Promise<ServiceResult<string | null>> {
    return this.wrapper(() => window.api.ffmpeg.getVersion(), 'getVersion', options)
  }

  async download(options?: IpcOperationOptions): Promise<ServiceResult<void>> {
    return this.wrapper(
      async () => {
        const result = await window.api.ffmpeg.download()
        if (!result.success) {
          throw new Error(result.error || 'Failed to download FFmpeg')
        }
      },
      'download',
      options
    )
  }

  async getVideoInfo(
    inputPath: string,
    options?: IpcOperationOptions
  ): Promise<ServiceResult<VideoInfo | null>> {
    return this.wrapper(() => window.api.ffmpeg.getVideoInfo(inputPath), 'getVideoInfo', options)
  }

  async transcode(
    inputPath: string,
    outputPath?: string,
    transcodeOptions?: TranscodeOptions,
    options?: IpcOperationOptions
  ): Promise<ServiceResult<{ outputPath?: string }>> {
    return this.wrapper(
      async () => {
        const result = await window.api.ffmpeg.transcode(inputPath, outputPath, transcodeOptions)
        if (!result.success) {
          throw new Error(result.error || 'Failed to transcode')
        }
        return { outputPath: result.outputPath }
      },
      'transcode',
      options
    )
  }

  async getPath(options?: IpcOperationOptions): Promise<ServiceResult<string>> {
    return this.wrapper(() => window.api.ffmpeg.getPath(), 'getPath', options)
  }

  async getDataDirectory(options?: IpcOperationOptions): Promise<ServiceResult<string>> {
    return this.wrapper(() => window.api.ffmpeg.getDataDirectory(), 'getDataDirectory', options)
  }

  async cancelTranscode(options?: IpcOperationOptions): Promise<ServiceResult<boolean>> {
    return this.wrapper(() => window.api.ffmpeg.cancelTranscode(), 'cancelTranscode', options)
  }
}

class LoggingService implements ILoggingService {
  constructor(private wrapper: ReturnType<typeof createOperationWrapper>) {}

  async log(
    level: 'debug' | 'info' | 'warn' | 'error',
    message: string,
    data?: unknown,
    options?: IpcOperationOptions
  ): Promise<ServiceResult<void>> {
    return this.wrapper(() => window.api.log(level, message, data), 'log', options)
  }
}

// 主要 IPC 客户端服务实现 / Main IPC Client Service Implementation
export class IPCClientService implements IIPCClientService {
  readonly name = 'IPCClientService'
  readonly version = '1.0.0'

  private _status: ServiceStatus = ServiceStatus.IDLE
  private _isInitialized = false
  private _isDisposed = false
  private _config: IpcClientConfig
  private _wrapper: ReturnType<typeof createOperationWrapper>

  // 服务实例 / Service Instances
  readonly fileSystem: IFileSystemService
  readonly dictionary: IDictionaryService
  readonly storage: IStorageService
  readonly update: IUpdateService
  readonly appConfig: IAppConfigService
  readonly window: IWindowService
  readonly environment: IEnvironmentService
  readonly ffmpeg: IFFmpegService
  readonly logging: ILoggingService

  constructor(config?: Partial<IpcClientConfig>) {
    this._config = { ...DEFAULT_CONFIG, ...config }
    this._wrapper = createOperationWrapper(this._config, this.name)

    // 初始化服务实例 / Initialize service instances
    this.fileSystem = new FileSystemService(this._wrapper)
    this.dictionary = new DictionaryService(this._wrapper)
    this.storage = new StorageService(this._wrapper)
    this.update = new UpdateService(this._wrapper)
    this.appConfig = new AppConfigService(this._wrapper)
    this.window = new WindowService(this._wrapper)
    this.environment = new EnvironmentService()
    this.ffmpeg = new FFmpegService(this._wrapper)
    this.logging = new LoggingService(this._wrapper)
  }

  get status(): ServiceStatus {
    return this._status
  }

  get isInitialized(): boolean {
    return this._isInitialized
  }

  get isDisposed(): boolean {
    return this._isDisposed
  }

  async initialize(options?: ServiceInitOptions): Promise<void> {
    if (this._isInitialized) {
      return
    }

    try {
      this._status = ServiceStatus.LOADING

      // 检查 preload API 是否可用 / Check if preload API is available
      if (!this.isPreloadAvailable()) {
        throw new IpcClientError({
          type: IpcErrorType.PRELOAD_NOT_AVAILABLE,
          message: 'Preload API is not available in the current context'
        })
      }

      // 应用初始化选项 / Apply initialization options
      if (options?.config) {
        this._config = { ...this._config, ...options.config }
        this._wrapper = createOperationWrapper(this._config, this.name)
      }

      this._isInitialized = true
      this._status = ServiceStatus.SUCCESS

      if (this._config.enableLogging) {
        console.info(`[IPCClient] Service initialized successfully`)
      }
    } catch (error) {
      this._status = ServiceStatus.ERROR
      throw error
    }
  }

  async healthCheck(): Promise<HealthCheckResult> {
    const timestamp = Date.now()

    try {
      // 检查 preload API 可用性 / Check preload API availability
      const isAvailable = this.isPreloadAvailable()

      if (!isAvailable) {
        return {
          healthy: false,
          message: 'Preload API not available',
          timestamp,
          details: { preloadAvailable: false }
        }
      }

      // 执行简单的 API 调用测试 / Perform simple API call test
      const envTest = this.environment.getNodeEnv()

      return {
        healthy: true,
        message: 'IPC Client service is healthy',
        timestamp,
        details: {
          preloadAvailable: true,
          environment: envTest,
          config: this._config
        }
      }
    } catch (error) {
      return {
        healthy: false,
        message: error instanceof Error ? error.message : 'Unknown health check error',
        timestamp,
        details: { error: error instanceof Error ? error.message : error }
      }
    }
  }

  async dispose(): Promise<void> {
    if (this._isDisposed) {
      return
    }

    try {
      this._isDisposed = true
      this._isInitialized = false
      this._status = ServiceStatus.IDLE

      if (this._config.enableLogging) {
        console.info(`[IPCClient] Service disposed successfully`)
      }
    } catch (error) {
      console.error(`[IPCClient] Error during disposal:`, error)
      throw error
    }
  }

  getConfig(): IpcClientConfig {
    return { ...this._config }
  }

  updateConfig(config: Partial<IpcClientConfig>): void {
    this._config = { ...this._config, ...config }
    this._wrapper = createOperationWrapper(this._config, this.name)
  }

  isPreloadAvailable(): boolean {
    return typeof window !== 'undefined' && !!window.api
  }
}

// 工厂函数 / Factory Function
export function createIPCClientService(config?: Partial<IpcClientConfig>): IIPCClientService {
  return new IPCClientService(config)
}
