/**
 * Update-related type definitions for the application
 * 应用程序更新相关的类型定义
 */

/**
 * Update status enumeration / 更新状态枚举
 */
export type UpdateStatusType =
  | 'checking' // 检查更新中
  | 'available' // 有可用更新
  | 'not-available' // 无可用更新
  | 'downloading' // 下载中
  | 'downloaded' // 下载完成
  | 'error' // 出现错误

/**
 * Update progress information / 更新进度信息
 */
export interface UpdateProgress {
  /** Download progress percentage (0-100) / 下载进度百分比 (0-100) */
  percent: number
  /** Download speed in bytes per second / 下载速度（字节/秒） */
  bytesPerSecond: number
  /** Total file size in bytes / 总文件大小（字节） */
  total: number
  /** Downloaded bytes / 已下载字节数 */
  transferred: number
}

/**
 * Update information / 更新信息
 */
export interface UpdateInfo {
  /** Version string (e.g., "1.2.3") / 版本号（如："1.2.3"） */
  version: string
  /** Release date / 发布日期 */
  releaseDate?: string
  /** Release notes (supports markdown) / 发布说明（支持 Markdown） */
  releaseNotes?: string | Record<string, unknown>
  /** Update file size in bytes / 更新文件大小（字节） */
  updateSize?: number
  /** Additional metadata / 额外元数据 */
  [key: string]: unknown
}

/**
 * Complete update status object / 完整的更新状态对象
 */
export interface UpdateStatus {
  /** Current update status / 当前更新状态 */
  status: UpdateStatusType
  /** Update information (available when status is 'available', 'downloading', or 'downloaded') / 更新信息 */
  info?: UpdateInfo
  /** Error message (available when status is 'error') / 错误信息 */
  error?: string
  /** Download progress (available when status is 'downloading') / 下载进度 */
  progress?: UpdateProgress
}

/**
 * Update prompt dialog callback functions / 更新提示对话框回调函数
 */
export interface UpdatePromptCallbacks {
  /** Called when user chooses to remind later / 用户选择稍后提醒时调用 */
  onRemindLater: () => void
  /** Called when user chooses to download update / 用户选择下载更新时调用 */
  onDownload: () => void
  /** Called when user chooses to install downloaded update / 用户选择安装已下载的更新时调用 */
  onInstall: () => void
  /** Called when user chooses to retry after error / 用户选择重试（错误后）时调用 */
  onRetry: () => void
  /** Called when user dismisses the dialog / 用户主动关闭对话框时调用 */
  onDismiss?: () => void
}

/**
 * Update prompt dialog props / 更新提示对话框属性
 */
export interface UpdatePromptDialogProps extends UpdatePromptCallbacks {
  /** Whether the dialog is visible / 是否显示对话框 */
  isVisible: boolean
  /** Current update status / 当前更新状态 */
  updateStatus: UpdateStatus | null
}

/**
 * Check for updates options / 检查更新选项
 */
export interface CheckUpdateOptions {
  /** Whether to check silently (no UI feedback) / 是否静默检查（无UI反馈） */
  silent?: boolean
}

/**
 * Update API interface / 更新 API 接口
 */
export interface UpdateAPI {
  /** Check for available updates / 检查可用更新 */
  checkForUpdates: (options?: CheckUpdateOptions) => Promise<UpdateStatus>
  /** Download available update / 下载可用更新 */
  downloadUpdate: () => Promise<void>
  /** Install downloaded update (will restart app) / 安装已下载的更新（将重启应用） */
  installUpdate: () => void
}

/**
 * Type guard to check if update is mandatory / 类型守卫：检查更新是否为强制更新
 */
export function isMandatoryUpdate(updateStatus: UpdateStatus | null): boolean {
  if (!updateStatus?.info?.releaseNotes) return false

  const releaseNotes = updateStatus.info.releaseNotes
  if (typeof releaseNotes === 'string') {
    return releaseNotes.includes('[MANDATORY]') || releaseNotes.includes('[CRITICAL]')
  }

  return false
}

/**
 * Utility function to format file size / 工具函数：格式化文件大小
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`
  } else if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`
  } else if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  } else {
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
  }
}

/**
 * Utility function to format download speed / 工具函数：格式化下载速度
 */
export function formatSpeed(bytesPerSecond: number): string {
  if (bytesPerSecond < 1024) {
    return `${bytesPerSecond} B/s`
  } else if (bytesPerSecond < 1024 * 1024) {
    return `${Math.round(bytesPerSecond / 1024)} KB/s`
  } else {
    return `${(bytesPerSecond / (1024 * 1024)).toFixed(1)} MB/s`
  }
}
