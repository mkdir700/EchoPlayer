import { electronAPI } from '@electron-toolkit/preload'
import { UpgradeChannel } from '@shared/config/constant'
import { LogLevel, LogSourceWithContext } from '@shared/config/logger'
import { IpcChannel } from '@shared/IpcChannel'
import type { ASRGenerateOptions, ASRProgress, ASRResult } from '@shared/types'
import { DictionaryResponse, FFmpegVideoInfo, Shortcut, ThemeMode } from '@types'
import { contextBridge, ipcRenderer, OpenDialogOptions, shell, webUtils } from 'electron'
import type {
  FileMetadata,
  FileMetadataInsert,
  FileMetadataRecord,
  PlayerSettingsInsert,
  PlayerSettingsRecord,
  PlayerSettingsUpdate,
  SubtitleLibraryInsert,
  SubtitleLibraryRecord,
  VideoLibraryInsert,
  VideoLibraryRecord
} from 'packages/shared/types/database'

const api = {
  getAppInfo: () => ipcRenderer.invoke(IpcChannel.App_Info),
  reload: () => ipcRenderer.invoke(IpcChannel.App_Reload),
  checkForUpdate: () => ipcRenderer.invoke(IpcChannel.App_CheckForUpdate),
  showUpdateDialog: () => ipcRenderer.invoke(IpcChannel.App_ShowUpdateDialog),
  setLanguage: (lang: string) => ipcRenderer.invoke(IpcChannel.App_SetLanguage, lang),
  setEnableSpellCheck: (isEnable: boolean) =>
    ipcRenderer.invoke(IpcChannel.App_SetEnableSpellCheck, isEnable),
  setSpellCheckLanguages: (languages: string[]) =>
    ipcRenderer.invoke(IpcChannel.App_SetSpellCheckLanguages, languages),
  setLaunchOnBoot: (isActive: boolean) =>
    ipcRenderer.invoke(IpcChannel.App_SetLaunchOnBoot, isActive),
  setLaunchToTray: (isActive: boolean) =>
    ipcRenderer.invoke(IpcChannel.App_SetLaunchToTray, isActive),
  setTray: (isActive: boolean) => ipcRenderer.invoke(IpcChannel.App_SetTray, isActive),
  setTrayOnClose: (isActive: boolean) =>
    ipcRenderer.invoke(IpcChannel.App_SetTrayOnClose, isActive),
  setTestPlan: (isActive: boolean) => ipcRenderer.invoke(IpcChannel.App_SetTestPlan, isActive),
  setTestChannel: (channel: UpgradeChannel) =>
    ipcRenderer.invoke(IpcChannel.App_SetTestChannel, channel),
  setTheme: (theme: ThemeMode) => ipcRenderer.invoke(IpcChannel.App_SetTheme, theme),
  setAutoUpdate: (isActive: boolean) => ipcRenderer.invoke(IpcChannel.App_SetAutoUpdate, isActive),
  select: (options: Electron.OpenDialogOptions) =>
    ipcRenderer.invoke(IpcChannel.App_Select, options),
  hasWritePermission: (path: string) => ipcRenderer.invoke(IpcChannel.App_HasWritePermission, path),
  setAppDataPath: (path: string) => ipcRenderer.invoke(IpcChannel.App_SetAppDataPath, path),
  getDataPathFromArgs: () => ipcRenderer.invoke(IpcChannel.App_GetDataPathFromArgs),
  copy: (oldPath: string, newPath: string, occupiedDirs: string[] = []) =>
    ipcRenderer.invoke(IpcChannel.App_Copy, oldPath, newPath, occupiedDirs),
  setStopQuitApp: (stop: boolean, reason: string) =>
    ipcRenderer.invoke(IpcChannel.App_SetStopQuitApp, stop, reason),
  flushAppData: () => ipcRenderer.invoke(IpcChannel.App_FlushAppData),
  isNotEmptyDir: (path: string) => ipcRenderer.invoke(IpcChannel.App_IsNotEmptyDir, path),
  relaunchApp: (options?: Electron.RelaunchOptions) =>
    ipcRenderer.invoke(IpcChannel.App_RelaunchApp, options),
  openWebsite: (url: string) => ipcRenderer.invoke(IpcChannel.Open_Website, url),
  getCacheSize: () => ipcRenderer.invoke(IpcChannel.App_GetCacheSize),
  clearCache: () => ipcRenderer.invoke(IpcChannel.App_ClearCache),
  logToMain: (source: LogSourceWithContext, level: LogLevel, message: string, data: any[]) =>
    ipcRenderer.invoke(IpcChannel.App_LogToMain, source, level, message, data),
  mac: {
    isProcessTrusted: (): Promise<boolean> =>
      ipcRenderer.invoke(IpcChannel.App_MacIsProcessTrusted),
    requestProcessTrust: (): Promise<boolean> =>
      ipcRenderer.invoke(IpcChannel.App_MacRequestProcessTrust)
  },
  notification: {
    send: (notification: Notification) =>
      ipcRenderer.invoke(IpcChannel.Notification_Send, notification)
  },
  system: {
    getDeviceType: () => ipcRenderer.invoke(IpcChannel.System_GetDeviceType),
    getHostname: () => ipcRenderer.invoke(IpcChannel.System_GetHostname)
  },
  devTools: {
    toggle: () => ipcRenderer.invoke(IpcChannel.System_ToggleDevTools)
  },
  // zip: {
  //   compress: (text: string) => ipcRenderer.invoke(IpcChannel.Zip_Compress, text),
  //   decompress: (text: Buffer) => ipcRenderer.invoke(IpcChannel.Zip_Decompress, text)
  // },
  // backup: {
  //   backup: (filename: string, content: string, path: string, skipBackupFile: boolean) =>
  //     ipcRenderer.invoke(IpcChannel.Backup_Backup, filename, content, path, skipBackupFile),
  //   restore: (path: string) => ipcRenderer.invoke(IpcChannel.Backup_Restore, path),
  //   backupToWebdav: (data: string, webdavConfig: WebDavConfig) =>
  //     ipcRenderer.invoke(IpcChannel.Backup_BackupToWebdav, data, webdavConfig),
  //   restoreFromWebdav: (webdavConfig: WebDavConfig) =>
  //     ipcRenderer.invoke(IpcChannel.Backup_RestoreFromWebdav, webdavConfig),
  //   listWebdavFiles: (webdavConfig: WebDavConfig) =>
  //     ipcRenderer.invoke(IpcChannel.Backup_ListWebdavFiles, webdavConfig),
  //   checkConnection: (webdavConfig: WebDavConfig) =>
  //     ipcRenderer.invoke(IpcChannel.Backup_CheckConnection, webdavConfig),
  //   createDirectory: (webdavConfig: WebDavConfig, path: string, options?: CreateDirectoryOptions) =>
  //     ipcRenderer.invoke(IpcChannel.Backup_CreateDirectory, webdavConfig, path, options),
  //   deleteWebdavFile: (fileName: string, webdavConfig: WebDavConfig) =>
  //     ipcRenderer.invoke(IpcChannel.Backup_DeleteWebdavFile, fileName, webdavConfig),
  //   backupToLocalDir: (
  //     data: string,
  //     fileName: string,
  //     localConfig: { localBackupDir?: string; skipBackupFile?: boolean }
  //   ) => ipcRenderer.invoke(IpcChannel.Backup_BackupToLocalDir, data, fileName, localConfig),
  //   restoreFromLocalBackup: (fileName: string, localBackupDir?: string) =>
  //     ipcRenderer.invoke(IpcChannel.Backup_RestoreFromLocalBackup, fileName, localBackupDir),
  //   listLocalBackupFiles: (localBackupDir?: string) =>
  //     ipcRenderer.invoke(IpcChannel.Backup_ListLocalBackupFiles, localBackupDir),
  //   deleteLocalBackupFile: (fileName: string, localBackupDir?: string) =>
  //     ipcRenderer.invoke(IpcChannel.Backup_DeleteLocalBackupFile, fileName, localBackupDir),
  //   setLocalBackupDir: (dirPath: string) =>
  //     ipcRenderer.invoke(IpcChannel.Backup_SetLocalBackupDir, dirPath),
  //   checkWebdavConnection: (webdavConfig: WebDavConfig) =>
  //     ipcRenderer.invoke(IpcChannel.Backup_CheckConnection, webdavConfig),

  //   backupToS3: (data: string, s3Config: S3Config) =>
  //     ipcRenderer.invoke(IpcChannel.Backup_BackupToS3, data, s3Config),
  //   restoreFromS3: (s3Config: S3Config) =>
  //     ipcRenderer.invoke(IpcChannel.Backup_RestoreFromS3, s3Config),
  //   listS3Files: (s3Config: S3Config) =>
  //     ipcRenderer.invoke(IpcChannel.Backup_ListS3Files, s3Config),
  //   deleteS3File: (fileName: string, s3Config: S3Config) =>
  //     ipcRenderer.invoke(IpcChannel.Backup_DeleteS3File, fileName, s3Config),
  //   checkS3Connection: (s3Config: S3Config) =>
  //     ipcRenderer.invoke(IpcChannel.Backup_CheckS3Connection, s3Config)
  // },
  file: {
    select: (options?: OpenDialogOptions): Promise<FileMetadata[] | null> =>
      ipcRenderer.invoke(IpcChannel.File_Select, options),
    upload: (file: FileMetadata) => ipcRenderer.invoke(IpcChannel.File_Upload, file),
    delete: (fileId: string) => ipcRenderer.invoke(IpcChannel.File_Delete, fileId),
    deleteDir: (dirPath: string) => ipcRenderer.invoke(IpcChannel.File_DeleteDir, dirPath),
    read: (fileId: string, detectEncoding?: boolean) =>
      ipcRenderer.invoke(IpcChannel.File_Read, fileId, detectEncoding),
    // clear: (spanContext?: SpanContext) => ipcRenderer.invoke(IpcChannel.File_Clear, spanContext),
    get: (filePath: string) => ipcRenderer.invoke(IpcChannel.File_Get, filePath),
    /**
     * 创建一个空的临时文件
     * @param fileName 文件名
     * @returns 临时文件路径
     */
    createTempFile: (fileName: string): Promise<string> =>
      ipcRenderer.invoke(IpcChannel.File_CreateTempFile, fileName),
    /**
     * 写入文件
     * @param filePath 文件路径
     * @param data 数据
     */
    write: (filePath: string, data: Uint8Array | string) =>
      ipcRenderer.invoke(IpcChannel.File_Write, filePath, data),

    writeWithId: (id: string, content: string) =>
      ipcRenderer.invoke(IpcChannel.File_WriteWithId, id, content),
    open: (options?: OpenDialogOptions) => ipcRenderer.invoke(IpcChannel.File_Open, options),
    openPath: (path: string) => ipcRenderer.invoke(IpcChannel.File_OpenPath, path),
    save: (path: string, content: string | NodeJS.ArrayBufferView, options?: any) =>
      ipcRenderer.invoke(IpcChannel.File_Save, path, content, options),
    // selectFolder: (spanContext?: SpanContext) =>
    // ipcRenderer.invoke(IpcChannel.File_SelectFolder, spanContext),
    saveImage: (name: string, data: string) =>
      ipcRenderer.invoke(IpcChannel.File_SaveImage, name, data),
    binaryImage: (fileId: string) => ipcRenderer.invoke(IpcChannel.File_BinaryImage, fileId),
    base64Image: (fileId: string) => ipcRenderer.invoke(IpcChannel.File_Base64Image, fileId),
    saveBase64Image: (data: string) => ipcRenderer.invoke(IpcChannel.File_SaveBase64Image, data),
    download: (url: string, isUseContentType?: boolean) =>
      ipcRenderer.invoke(IpcChannel.File_Download, url, isUseContentType),
    copy: (fileId: string, destPath: string) =>
      ipcRenderer.invoke(IpcChannel.File_Copy, fileId, destPath),
    base64File: (fileId: string) => ipcRenderer.invoke(IpcChannel.File_Base64File, fileId),
    getPathForFile: (file: File) => webUtils.getPathForFile(file),
    openFileWithRelativePath: (file: FileMetadata) =>
      ipcRenderer.invoke(IpcChannel.File_OpenWithRelativePath, file),
    readFromPath: (filePath: string, detectEncoding?: boolean) =>
      ipcRenderer.invoke(IpcChannel.File_ReadFromPath, filePath, detectEncoding),
    listDirectory: (
      dirPath: string,
      options?: { recursive?: boolean; extensions?: string[]; includeHidden?: boolean }
    ) => ipcRenderer.invoke(IpcChannel.File_ListDirectory, dirPath, options)
  },
  ffmpeg: {
    checkExists: (): Promise<boolean> => ipcRenderer.invoke(IpcChannel.Ffmpeg_CheckExists),
    getVersion: (): Promise<string | null> => ipcRenderer.invoke(IpcChannel.Ffmpeg_GetVersion),
    getVideoInfo: (inputPath: string): Promise<FFmpegVideoInfo | null> =>
      ipcRenderer.invoke(IpcChannel.Ffmpeg_GetVideoInfo, inputPath),
    getPath: (): Promise<string> => ipcRenderer.invoke(IpcChannel.Ffmpeg_GetPath),
    warmup: (): Promise<boolean> => ipcRenderer.invoke(IpcChannel.Ffmpeg_Warmup),
    getWarmupStatus: (): Promise<{ isWarmedUp: boolean; isWarming: boolean }> =>
      ipcRenderer.invoke(IpcChannel.Ffmpeg_GetWarmupStatus),
    getInfo: (): Promise<{
      path: string
      isBundled: boolean
      isDownloaded: boolean
      isSystemFFmpeg: boolean
      platform: string
      arch: string
      version?: string
      needsDownload: boolean
    }> => ipcRenderer.invoke(IpcChannel.Ffmpeg_GetInfo),
    autoDetectAndDownload: (): Promise<{
      available: boolean
      needsDownload: boolean
      downloadTriggered: boolean
    }> => ipcRenderer.invoke(IpcChannel.Ffmpeg_AutoDetectAndDownload),
    // FFmpeg 下载管理
    download: {
      checkExists: (platform?: string, arch?: string): Promise<boolean> =>
        ipcRenderer.invoke(IpcChannel.FfmpegDownload_CheckExists, platform, arch),
      getVersion: (platform?: string, arch?: string): Promise<string | null> =>
        ipcRenderer.invoke(IpcChannel.FfmpegDownload_GetVersion, platform, arch),
      download: (platform?: string, arch?: string): Promise<boolean> =>
        ipcRenderer.invoke(IpcChannel.FfmpegDownload_Download, platform, arch),
      getProgress: (platform?: string, arch?: string): Promise<any> =>
        ipcRenderer.invoke(IpcChannel.FfmpegDownload_GetProgress, platform, arch),
      cancel: (platform?: string, arch?: string): Promise<void> =>
        ipcRenderer.invoke(IpcChannel.FfmpegDownload_Cancel, platform, arch),
      remove: (platform?: string, arch?: string): Promise<boolean> =>
        ipcRenderer.invoke(IpcChannel.FfmpegDownload_Remove, platform, arch),
      getAllVersions: (): Promise<any[]> =>
        ipcRenderer.invoke(IpcChannel.FfmpegDownload_GetAllVersions),
      cleanupTemp: (): Promise<void> => ipcRenderer.invoke(IpcChannel.FfmpegDownload_CleanupTemp)
    }
  },
  ffprobe: {
    checkExists: (): Promise<boolean> => ipcRenderer.invoke(IpcChannel.Ffprobe_CheckExists),
    getVersion: (): Promise<string | null> => ipcRenderer.invoke(IpcChannel.Ffprobe_GetVersion),
    getPath: (): Promise<string> => ipcRenderer.invoke(IpcChannel.Ffprobe_GetPath),
    getInfo: (): Promise<{
      path: string
      isBundled: boolean
      isDownloaded: boolean
      isSystemFFprobe: boolean
      platform: string
      arch: string
      version?: string
      needsDownload: boolean
    }> => ipcRenderer.invoke(IpcChannel.Ffprobe_GetInfo),
    // FFprobe 下载管理
    download: {
      checkExists: (platform?: string, arch?: string): Promise<boolean> =>
        ipcRenderer.invoke(IpcChannel.FfprobeDownload_CheckExists, platform, arch),
      getVersion: (platform?: string, arch?: string): Promise<string | null> =>
        ipcRenderer.invoke(IpcChannel.FfprobeDownload_GetVersion, platform, arch),
      download: (platform?: string, arch?: string): Promise<boolean> =>
        ipcRenderer.invoke(IpcChannel.FfprobeDownload_Download, platform, arch),
      getProgress: (platform?: string, arch?: string): Promise<any> =>
        ipcRenderer.invoke(IpcChannel.FfprobeDownload_GetProgress, platform, arch),
      cancel: (platform?: string, arch?: string): Promise<void> =>
        ipcRenderer.invoke(IpcChannel.FfprobeDownload_Cancel, platform, arch),
      remove: (platform?: string, arch?: string): Promise<boolean> =>
        ipcRenderer.invoke(IpcChannel.FfprobeDownload_Remove, platform, arch)
    }
  },
  mediainfo: {
    checkExists: (): Promise<boolean> => ipcRenderer.invoke(IpcChannel.MediaInfo_CheckExists),
    getVersion: (): Promise<string | null> => ipcRenderer.invoke(IpcChannel.MediaInfo_GetVersion),
    getVideoInfo: (inputPath: string): Promise<FFmpegVideoInfo | null> =>
      ipcRenderer.invoke(IpcChannel.MediaInfo_GetVideoInfo, inputPath),
    getVideoInfoWithStrategy: (
      inputPath: string,
      strategy:
        | 'remotion-first'
        | 'ffmpeg-first'
        | 'remotion-only'
        | 'ffmpeg-only' = 'remotion-first',
      timeoutMs: number = 10000
    ): Promise<FFmpegVideoInfo | null> =>
      ipcRenderer.invoke(
        IpcChannel.MediaInfo_GetVideoInfoWithStrategy,
        inputPath,
        strategy,
        timeoutMs
      )
  },
  asr: {
    generate: (options: ASRGenerateOptions): Promise<ASRResult> =>
      ipcRenderer.invoke(IpcChannel.ASR_Generate, options),
    cancel: (taskId: string): Promise<void> => ipcRenderer.invoke(IpcChannel.ASR_Cancel, taskId),
    validateApiKey: (apiKey: string): Promise<boolean> =>
      ipcRenderer.invoke(IpcChannel.ASR_ValidateApiKey, apiKey),
    onProgress: (listener: (progress: ASRProgress) => void) => {
      const handler = (_event: unknown, payload: ASRProgress) => listener(payload)
      ipcRenderer.on(IpcChannel.ASR_Progress, handler)
      return () => {
        ipcRenderer.removeListener(IpcChannel.ASR_Progress, handler)
      }
    }
  },
  uv: {
    checkInstallation: (): Promise<{
      exists: boolean
      path?: string
      version?: string
      isSystem: boolean
      isDownloaded: boolean
    }> => ipcRenderer.invoke(IpcChannel.UV_CheckInstallation),
    download: (platform?: string, arch?: string): Promise<boolean> =>
      ipcRenderer.invoke(IpcChannel.UV_Download, platform, arch),
    getProgress: (platform?: string, arch?: string): Promise<any> =>
      ipcRenderer.invoke(IpcChannel.UV_GetProgress, platform, arch),
    cancelDownload: (platform?: string, arch?: string): Promise<void> =>
      ipcRenderer.invoke(IpcChannel.UV_CancelDownload, platform, arch),
    getInfo: (): Promise<{
      exists: boolean
      path?: string
      version?: string
      isSystem: boolean
      isDownloaded: boolean
    }> => ipcRenderer.invoke(IpcChannel.UV_GetInfo)
  },
  pythonVenv: {
    checkInfo: (): Promise<{
      exists: boolean
      venvPath?: string
      pythonPath?: string
      pythonVersion?: string
      hasProjectConfig: boolean
      hasLockfile: boolean
    }> => ipcRenderer.invoke(IpcChannel.PythonVenv_CheckInfo),
    initialize: (pythonVersion?: string): Promise<boolean> =>
      ipcRenderer.invoke(IpcChannel.PythonVenv_Initialize, pythonVersion),
    reinstallDependencies: (): Promise<boolean> =>
      ipcRenderer.invoke(IpcChannel.PythonVenv_ReinstallDependencies),
    remove: (): Promise<boolean> => ipcRenderer.invoke(IpcChannel.PythonVenv_Remove),
    getProgress: (): Promise<{
      stage: 'init' | 'venv' | 'deps' | 'completed' | 'error'
      message: string
      percent: number
    } | null> => ipcRenderer.invoke(IpcChannel.PythonVenv_GetProgress),
    getMediaServerPath: (): Promise<string> =>
      ipcRenderer.invoke(IpcChannel.PythonVenv_GetMediaServerPath)
  },
  mediaServer: {
    start: (config?: {
      port?: number
      host?: string
      logLevel?: 'debug' | 'info' | 'warning' | 'error'
    }): Promise<boolean> => ipcRenderer.invoke(IpcChannel.MediaServer_Start, config),
    stop: (): Promise<boolean> => ipcRenderer.invoke(IpcChannel.MediaServer_Stop),
    restart: (config?: {
      port?: number
      host?: string
      logLevel?: 'debug' | 'info' | 'warning' | 'error'
    }): Promise<boolean> => ipcRenderer.invoke(IpcChannel.MediaServer_Restart, config),
    getInfo: (): Promise<{
      status: 'stopped' | 'starting' | 'running' | 'stopping' | 'error'
      pid?: number
      port?: number
      startTime?: number
      uptime?: number
      error?: string
    }> => ipcRenderer.invoke(IpcChannel.MediaServer_GetInfo),
    getPort: (): Promise<number | null> => ipcRenderer.invoke(IpcChannel.MediaServer_GetPort),
    cleanupCachesForFile: (filePath: string) =>
      ipcRenderer.invoke(IpcChannel.MediaServer_CleanupCachesForFile, filePath)
  },
  fs: {
    checkFileExists: (filePath: string): Promise<boolean> =>
      ipcRenderer.invoke(IpcChannel.Fs_CheckFileExists, filePath)
  },
  shortcuts: {
    update: (shortcuts: Shortcut[]) => ipcRenderer.invoke(IpcChannel.Shortcuts_Update, shortcuts)
  },

  // memory: {
  //   add: (messages: string | AssistantMessage[], options?: AddMemoryOptions) =>
  //     ipcRenderer.invoke(IpcChannel.Memory_Add, messages, options),
  //   search: (query: string, options: MemorySearchOptions) =>
  //     ipcRenderer.invoke(IpcChannel.Memory_Search, query, options),
  //   list: (options?: MemoryListOptions) => ipcRenderer.invoke(IpcChannel.Memory_List, options),
  //   delete: (id: string) => ipcRenderer.invoke(IpcChannel.Memory_Delete, id),
  //   update: (id: string, memory: string, metadata?: Record<string, any>) =>
  //     ipcRenderer.invoke(IpcChannel.Memory_Update, id, memory, metadata),
  //   get: (id: string) => ipcRenderer.invoke(IpcChannel.Memory_Get, id),
  //   setConfig: (config: MemoryConfig) => ipcRenderer.invoke(IpcChannel.Memory_SetConfig, config),
  //   deleteUser: (userId: string) => ipcRenderer.invoke(IpcChannel.Memory_DeleteUser, userId),
  //   deleteAllMemoriesForUser: (userId: string) =>
  //     ipcRenderer.invoke(IpcChannel.Memory_DeleteAllMemoriesForUser, userId),
  //   getUsersList: () => ipcRenderer.invoke(IpcChannel.Memory_GetUsersList)
  // },
  // window: {
  //   setMinimumSize: (width: number, height: number) =>
  //     ipcRenderer.invoke(IpcChannel.Windows_SetMinimumSize, width, height),
  //   resetMinimumSize: () => ipcRenderer.invoke(IpcChannel.Windows_ResetMinimumSize)
  // },
  // fileService: {
  //   upload: (provider: Provider, file: FileMetadata): Promise<FileUploadResponse> =>
  //     ipcRenderer.invoke(IpcChannel.FileService_Upload, provider, file),
  //   list: (provider: Provider): Promise<FileListResponse> =>
  //     ipcRenderer.invoke(IpcChannel.FileService_List, provider),
  //   delete: (provider: Provider, fileId: string) =>
  //     ipcRenderer.invoke(IpcChannel.FileService_Delete, provider, fileId),
  //   retrieve: (provider: Provider, fileId: string): Promise<FileUploadResponse> =>
  //     ipcRenderer.invoke(IpcChannel.FileService_Retrieve, provider, fileId)
  // },
  config: {
    set: (key: string, value: any, isNotify: boolean = false) =>
      ipcRenderer.invoke(IpcChannel.Config_Set, key, value, isNotify),
    get: (key: string) => ipcRenderer.invoke(IpcChannel.Config_Get, key)
  },
  // miniWindow: {
  //   show: () => ipcRenderer.invoke(IpcChannel.MiniWindow_Show),
  //   hide: () => ipcRenderer.invoke(IpcChannel.MiniWindow_Hide),
  //   close: () => ipcRenderer.invoke(IpcChannel.MiniWindow_Close),
  //   toggle: () => ipcRenderer.invoke(IpcChannel.MiniWindow_Toggle),
  //   setPin: (isPinned: boolean) => ipcRenderer.invoke(IpcChannel.MiniWindow_SetPin, isPinned)
  // },
  // aes: {
  //   encrypt: (text: string, secretKey: string, iv: string) =>
  //     ipcRenderer.invoke(IpcChannel.Aes_Encrypt, text, secretKey, iv),
  //   decrypt: (encryptedData: string, iv: string, secretKey: string) =>
  //     ipcRenderer.invoke(IpcChannel.Aes_Decrypt, encryptedData, iv, secretKey)
  // },
  // mcp: {
  //   removeServer: (server: MCPServer) => ipcRenderer.invoke(IpcChannel.Mcp_RemoveServer, server),
  //   restartServer: (server: MCPServer) => ipcRenderer.invoke(IpcChannel.Mcp_RestartServer, server),
  //   stopServer: (server: MCPServer) => ipcRenderer.invoke(IpcChannel.Mcp_StopServer, server),
  //   listTools: (server: MCPServer, context?: SpanContext) =>
  //     tracedInvoke(IpcChannel.Mcp_ListTools, context, server),
  //   callTool: (
  //     {
  //       server,
  //       name,
  //       args,
  //       callId
  //     }: { server: MCPServer; name: string; args: any; callId?: string },
  //     context?: SpanContext
  //   ) => tracedInvoke(IpcChannel.Mcp_CallTool, context, { server, name, args, callId }),
  //   listPrompts: (server: MCPServer) => ipcRenderer.invoke(IpcChannel.Mcp_ListPrompts, server),
  //   getPrompt: ({
  //     server,
  //     name,
  //     args
  //   }: {
  //     server: MCPServer
  //     name: string
  //     args?: Record<string, any>
  //   }) => ipcRenderer.invoke(IpcChannel.Mcp_GetPrompt, { server, name, args }),
  //   listResources: (server: MCPServer) => ipcRenderer.invoke(IpcChannel.Mcp_ListResources, server),
  //   getResource: ({ server, uri }: { server: MCPServer; uri: string }) =>
  //     ipcRenderer.invoke(IpcChannel.Mcp_GetResource, { server, uri }),
  //   getInstallInfo: () => ipcRenderer.invoke(IpcChannel.Mcp_GetInstallInfo),
  //   checkMcpConnectivity: (server: any) =>
  //     ipcRenderer.invoke(IpcChannel.Mcp_CheckConnectivity, server),
  //   uploadDxt: async (file: File) => {
  //     const buffer = await file.arrayBuffer()
  //     return ipcRenderer.invoke(IpcChannel.Mcp_UploadDxt, buffer, file.name)
  //   },
  //   abortTool: (callId: string) => ipcRenderer.invoke(IpcChannel.Mcp_AbortTool, callId),
  //   setProgress: (progress: number) => ipcRenderer.invoke(IpcChannel.Mcp_SetProgress, progress),
  //   getServerVersion: (server: MCPServer) =>
  //     ipcRenderer.invoke(IpcChannel.Mcp_GetServerVersion, server)
  // },

  shell: {
    openExternal: (url: string, options?: Electron.OpenExternalOptions) =>
      shell.openExternal(url, options)
  },

  // 词典服务 API
  dictionary: {
    queryEudic: (word: string, context?: string): Promise<DictionaryResponse> =>
      ipcRenderer.invoke(IpcChannel.Dictionary_Eudic, word, context)
  },

  // 数据库相关 API
  db: {
    // 文件 DAO
    files: {
      add: (file: FileMetadataInsert): Promise<{ id: string }> =>
        ipcRenderer.invoke(IpcChannel.DB_Files_Add, file),

      findByPath: (path: string): Promise<FileMetadataRecord | null> =>
        ipcRenderer.invoke(IpcChannel.DB_Files_FindByPath, path),

      findByType: (type: string): Promise<FileMetadataRecord[]> =>
        ipcRenderer.invoke(IpcChannel.DB_Files_FindByType, type),

      findById: (id: string): Promise<FileMetadataRecord | null> =>
        ipcRenderer.invoke(IpcChannel.DB_Files_FindById, id),

      update: (id: string, data: Partial<FileMetadata>): Promise<FileMetadataRecord> =>
        ipcRenderer.invoke(IpcChannel.DB_Files_Update, id, data),

      delete: (id: string | number): Promise<void> =>
        ipcRenderer.invoke(IpcChannel.DB_Files_Delete, id)
    },

    // 视频库 DAO
    videoLibrary: {
      add: (record: VideoLibraryInsert): Promise<{ id: number }> =>
        ipcRenderer.invoke(IpcChannel.DB_VideoLibrary_Add, record),

      findByFileId: (fileId: string): Promise<VideoLibraryRecord | null> =>
        ipcRenderer.invoke(IpcChannel.DB_VideoLibrary_FindByFileId, fileId),

      getRecentlyPlayed: (limit: number = 10): Promise<VideoLibraryRecord[]> =>
        ipcRenderer.invoke(IpcChannel.DB_VideoLibrary_GetRecentlyPlayed, limit),

      getFavorites: (): Promise<VideoLibraryRecord[]> =>
        ipcRenderer.invoke(IpcChannel.DB_VideoLibrary_GetFavorites),

      updatePlayProgress: (
        videoId: number,
        currentTime: number,
        isFinished?: boolean
      ): Promise<void> =>
        ipcRenderer.invoke(
          IpcChannel.DB_VideoLibrary_UpdatePlayProgress,
          videoId,
          currentTime,
          isFinished
        ),

      toggleFavorite: (videoId: number): Promise<void> =>
        ipcRenderer.invoke(IpcChannel.DB_VideoLibrary_ToggleFavorite, videoId),

      getRecords: (params?: {
        limit?: number
        offset?: number
        sortBy?: 'playedAt' | 'playCount' | 'firstPlayedAt' | 'duration'
        sortOrder?: 'asc' | 'desc'
        favoritesOnly?: boolean
        searchQuery?: string
      }): Promise<VideoLibraryRecord[]> =>
        ipcRenderer.invoke(IpcChannel.DB_VideoLibrary_GetRecords, params),

      findById: (id: number): Promise<VideoLibraryRecord | null> =>
        ipcRenderer.invoke(IpcChannel.DB_VideoLibrary_FindById, id),

      updateRecord: (id: number, updates: any): Promise<{ id: number }> =>
        ipcRenderer.invoke(IpcChannel.DB_VideoLibrary_UpdateRecord, id, updates),

      deleteRecord: (id: number): Promise<void> =>
        ipcRenderer.invoke(IpcChannel.DB_VideoLibrary_DeleteRecord, id),

      deleteRecords: (ids: number[]): Promise<void> =>
        ipcRenderer.invoke(IpcChannel.DB_VideoLibrary_DeleteRecords, ids),

      clearAll: (): Promise<void> => ipcRenderer.invoke(IpcChannel.DB_VideoLibrary_ClearAll),

      searchRecords: (query: string, limit?: number): Promise<VideoLibraryRecord[]> =>
        ipcRenderer.invoke(IpcChannel.DB_VideoLibrary_SearchRecords, query, limit),

      getMostPlayed: (limit?: number): Promise<VideoLibraryRecord[]> =>
        ipcRenderer.invoke(IpcChannel.DB_VideoLibrary_GetMostPlayed, limit)
    },

    // 字幕库 DAO
    subtitleLibrary: {
      add: (subtitle: SubtitleLibraryInsert): Promise<SubtitleLibraryRecord> =>
        ipcRenderer.invoke(IpcChannel.DB_SubtitleLibrary_Add, subtitle),

      findByVideoId: (videoId: number): Promise<SubtitleLibraryRecord[]> =>
        ipcRenderer.invoke(IpcChannel.DB_SubtitleLibrary_FindByVideoId, videoId),

      findByVideoIdAndPath: (
        videoId: number,
        filePath: string
      ): Promise<SubtitleLibraryRecord | null> =>
        ipcRenderer.invoke(IpcChannel.DB_SubtitleLibrary_FindByVideoIdAndPath, videoId, filePath),

      findById: (id: number): Promise<SubtitleLibraryRecord | null> =>
        ipcRenderer.invoke(IpcChannel.DB_SubtitleLibrary_FindById, id),

      update: (id: number, updates: Partial<Pick<SubtitleLibraryRecord, 'videoId' | 'filePath'>>) =>
        ipcRenderer.invoke(IpcChannel.DB_SubtitleLibrary_Update, id, updates),

      findAll: (): Promise<SubtitleLibraryRecord[]> =>
        ipcRenderer.invoke(IpcChannel.DB_SubtitleLibrary_FindAll),

      clear: (): Promise<void> => ipcRenderer.invoke(IpcChannel.DB_SubtitleLibrary_Clear),

      findAllOrderedByCreatedAt: (
        order: 'asc' | 'desc' = 'desc',
        limit?: number
      ): Promise<SubtitleLibraryRecord[]> =>
        ipcRenderer.invoke(IpcChannel.DB_SubtitleLibrary_FindAllOrderedByCreatedAt, order, limit),

      delete: (id: number): Promise<void> =>
        ipcRenderer.invoke(IpcChannel.DB_SubtitleLibrary_Delete, id)
    },

    // 播放器设置 DAO
    playerSettings: {
      get: (videoId: number): Promise<PlayerSettingsRecord | null> =>
        ipcRenderer.invoke(IpcChannel.DB_PlayerSettings_Get, videoId),

      save: (
        videoId: number,
        settings: PlayerSettingsInsert | PlayerSettingsUpdate
      ): Promise<PlayerSettingsRecord> =>
        ipcRenderer.invoke(IpcChannel.DB_PlayerSettings_Save, videoId, settings),

      delete: (videoId: number): Promise<boolean> =>
        ipcRenderer.invoke(IpcChannel.DB_PlayerSettings_Delete, videoId),

      getByVideoIds: (videoIds: number[]): Promise<PlayerSettingsRecord[]> =>
        ipcRenderer.invoke(IpcChannel.DB_PlayerSettings_GetByVideoIds, videoIds),

      has: (videoId: number): Promise<boolean> =>
        ipcRenderer.invoke(IpcChannel.DB_PlayerSettings_Has, videoId)
    }
  },
  on: (channel: string, callback: (...args: any[]) => void) => {
    ipcRenderer.on(channel, (_event, ...args) => callback(...args))
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  off: (channel: string, _callback?: (...args: any[]) => void) => {
    ipcRenderer.removeAllListeners(channel)
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    // eslint-disable-next-line no-restricted-syntax
    console.error('[Preload]Failed to expose APIs:', error as Error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}

export type WindowApiType = typeof api
