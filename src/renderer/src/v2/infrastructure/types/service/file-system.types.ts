/**
 * 文件系统服务类型定义
 * File System Service Types
 */

import { ServiceResult, ProgressInfo } from './base.types'

// 文件类型 / File Type
export enum FileType {
  VIDEO = 'video',
  SUBTITLE = 'subtitle',
  AUDIO = 'audio',
  IMAGE = 'image',
  CONFIG = 'config',
  LOG = 'log',
  CACHE = 'cache',
  TEMP = 'temp',
  UNKNOWN = 'unknown'
}

// 文件信息 / File Information
export interface FileInfo {
  path: string
  name: string
  extension: string
  size: number
  type: FileType
  mimeType?: string
  exists: boolean
  readable: boolean
  writable: boolean
  createdAt: Date
  modifiedAt: Date
  accessedAt: Date
  metadata?: Record<string, unknown>
}

// 文件过滤器 / File Filter
export interface FileFilter {
  name: string
  extensions: string[]
}

// 文件对话框选项 / File Dialog Options
export interface FileDialogOptions {
  title?: string
  defaultPath?: string
  filters?: FileFilter[]
  multiSelections?: boolean
  showHiddenFiles?: boolean
  buttonLabel?: string
  message?: string
}

// 文件选择结果 / File Selection Result
export interface FileSelectionResult {
  canceled: boolean
  filePaths: string[]
  bookmarks?: string[]
}

// 文件保存选项 / File Save Options
export interface FileSaveOptions {
  title?: string
  defaultPath?: string
  filters?: FileFilter[]
  showsTagField?: boolean
  buttonLabel?: string
  message?: string
}

// 文件保存结果 / File Save Result
export interface FileSaveResult {
  canceled: boolean
  filePath?: string
  bookmark?: string
}

// 文件操作选项 / File Operation Options
export interface FileOperationOptions {
  overwrite?: boolean
  createDirectories?: boolean
  preserveTimestamps?: boolean
  followSymlinks?: boolean
  onProgress?: (progress: ProgressInfo) => void
}

// 文件复制选项 / File Copy Options
export interface FileCopyOptions extends FileOperationOptions {
  preserveMode?: boolean
  preserveOwnership?: boolean
  dereference?: boolean
}

// 文件移动选项 / File Move Options
export interface FileMoveOptions extends FileOperationOptions {
  atomic?: boolean
}

// 文件删除选项 / File Delete Options
export interface FileDeleteOptions {
  recursive?: boolean
  force?: boolean
  dryRun?: boolean
}

// 目录创建选项 / Directory Creation Options
export interface DirectoryCreationOptions {
  recursive?: boolean
  mode?: string
}

// 文件监听选项 / File Watch Options
export interface FileWatchOptions {
  recursive?: boolean
  ignored?: string[]
  followSymlinks?: boolean
  usePolling?: boolean
  interval?: number
}

// 文件变更事件 / File Change Event
export interface FileChangeEvent {
  type: 'add' | 'change' | 'unlink' | 'addDir' | 'unlinkDir'
  path: string
  stats?: FileInfo
  timestamp: number
}

// 文件监听器 / File Watcher
export interface FileWatcher {
  close(): Promise<void>
  add(path: string): Promise<void>
  unwatch(path: string): Promise<void>
  getWatched(): string[]
}

// 文件系统服务接口 / File System Service Interface
export interface IFileSystemService {
  // 文件信息获取 / File Information
  getFileInfo(path: string): Promise<ServiceResult<FileInfo>>
  exists(path: string): Promise<boolean>
  isDirectory(path: string): Promise<boolean>
  isFile(path: string): Promise<boolean>

  // 文件对话框 / File Dialogs
  showOpenDialog(options?: FileDialogOptions): Promise<FileSelectionResult>
  showSaveDialog(options?: FileSaveOptions): Promise<FileSaveResult>

  // 文件操作 / File Operations
  readFile(path: string, encoding?: BufferEncoding): Promise<ServiceResult<string | Buffer>>
  writeFile(
    path: string,
    data: string | Buffer,
    options?: FileOperationOptions
  ): Promise<ServiceResult<void>>
  copyFile(
    source: string,
    destination: string,
    options?: FileCopyOptions
  ): Promise<ServiceResult<void>>
  moveFile(
    source: string,
    destination: string,
    options?: FileMoveOptions
  ): Promise<ServiceResult<void>>
  deleteFile(path: string, options?: FileDeleteOptions): Promise<ServiceResult<void>>

  // 目录操作 / Directory Operations
  createDirectory(path: string, options?: DirectoryCreationOptions): Promise<ServiceResult<void>>
  readDirectory(path: string): Promise<ServiceResult<string[]>>
  deleteDirectory(path: string, options?: FileDeleteOptions): Promise<ServiceResult<void>>

  // 文件监听 / File Watching
  watchFile(path: string, options?: FileWatchOptions): Promise<ServiceResult<FileWatcher>>
  watchDirectory(path: string, options?: FileWatchOptions): Promise<ServiceResult<FileWatcher>>

  // 路径操作 / Path Operations
  resolvePath(...paths: string[]): string
  joinPath(...paths: string[]): string
  getBaseName(path: string): string
  getDirName(path: string): string
  getExtension(path: string): string

  // 临时文件 / Temporary Files
  createTempFile(prefix?: string, suffix?: string): Promise<ServiceResult<string>>
  createTempDirectory(prefix?: string): Promise<ServiceResult<string>>
  cleanupTempFiles(): Promise<ServiceResult<void>>
}

// 文件系统错误类型 / File System Error Types
export enum FileSystemErrorType {
  NOT_FOUND = 'not_found',
  ACCESS_DENIED = 'access_denied',
  DISK_FULL = 'disk_full',
  FILE_TOO_LARGE = 'file_too_large',
  INVALID_PATH = 'invalid_path',
  OPERATION_FAILED = 'operation_failed'
}

// 文件系统错误 / File System Error
export interface FileSystemError {
  type: FileSystemErrorType
  message: string
  path?: string
  code?: string
  errno?: number
}
