/**
 * UI State Types for EchoLab
 */

// Fullscreen state interface
export interface FullscreenState {
  isFullscreen: boolean
  isInFullscreenMode: boolean // 应用内全屏模式
}

// UI state interface
export interface UIState {
  // Fullscreen related
  fullscreen: FullscreenState

  // Layout related
  showPlayPageHeader: boolean
  showSubtitleList: boolean
  sidebarWidth: number
  showControls: boolean
  isDragging: boolean

  // Subtitle interaction settings - 字幕交互设置
  autoResumeAfterWordCard: boolean // 查词后自动恢复播放 / Auto resume playback after word card closes
}

// UI Actions interface
export interface UIActions {
  // Fullscreen actions
  toggleFullscreen: () => void
  setFullscreen: (isFullscreen: boolean) => void
  enterFullscreenMode: () => void
  exitFullscreenMode: () => void

  // Layout actions
  togglePlayPageHeader: () => void
  toggleSubtitleList: () => void
  setSidebarWidth: (width: number) => void
  setShowControls: (show: boolean) => void
  setIsDragging: (isDragging: boolean) => void

  // Subtitle interaction actions - 字幕交互操作
  setAutoResumeAfterWordCard: (enabled: boolean) => void
}

// Combined UI store type
export type UIStore = UIState & UIActions

/**
 * Update Notification State Types for EchoLab
 * 更新通知状态类型定义
 */

// Red dot types - 红点类型
export type RedDotType = 'update' | 'feature' | 'announcement'

// Red dot state interface - 红点状态接口
export interface RedDotState {
  id: string // 唯一标识符 / Unique identifier
  type: RedDotType // 红点类型 / Red dot type
  visible: boolean // 是否可见 / Visibility
  priority: number // 优先级 (1-10, 10最高) / Priority (1-10, 10 highest)
  createdAt: number // 创建时间戳 / Creation timestamp
  expiresAt?: number // 过期时间戳 / Expiration timestamp (optional)
  metadata?: Record<string, unknown> // 附加数据 / Additional metadata
}

// Update notification state interface - 更新通知状态接口
export interface UpdateNotificationState {
  // Version information - 版本信息
  currentVersion: string
  latestVersion: string | null
  lastChecked: number | null
  lastSeenVersion: string | null
  skippedVersions: string[] // 用户跳过的版本列表 / List of versions skipped by user

  // Red dots management - 红点管理
  redDots: Record<string, RedDotState> // 所有红点状态 / All red dot states

  // Update status - 更新状态
  isCheckingForUpdates: boolean
  hasNewVersion: boolean

  // Settings - 设置
  autoCheckEnabled: boolean
  checkInterval: number // 检查间隔(毫秒) / Check interval in milliseconds
}

// Update notification actions interface - 更新通知操作接口
export interface UpdateNotificationActions {
  // Version management - 版本管理
  setCurrentVersion: (version: string) => void
  setLatestVersion: (version: string | null) => void
  setLastChecked: (timestamp: number) => void
  setLastSeenVersion: (version: string) => void
  skipVersion: (version: string) => void // 跳过指定版本 / Skip specified version
  isVersionSkipped: (version: string) => boolean // 检查版本是否被跳过 / Check if version is skipped

  // Update checking - 更新检查
  setIsCheckingForUpdates: (checking: boolean) => void
  checkForUpdates: () => Promise<void>
  markUpdateAsSeen: () => void

  // Red dots management - 红点管理
  showRedDot: (id: string, type: RedDotType, options?: Partial<RedDotState>) => void
  hideRedDot: (id: string) => void
  clearRedDot: (id: string) => void
  clearAllRedDots: () => void
  clearExpiredRedDots: () => void

  // Red dot queries - 红点查询
  isRedDotVisible: (id: string) => boolean
  getRedDotsByType: (type: RedDotType) => RedDotState[]
  hasVisibleRedDots: () => boolean

  // Settings - 设置
  setAutoCheckEnabled: (enabled: boolean) => void
  setCheckInterval: (interval: number) => void

  // Initialization - 初始化
  initialize: () => Promise<void>
  reset: () => void
}

// Combined update notification store type - 组合的更新通知存储类型
export type UpdateNotificationStore = UpdateNotificationState & UpdateNotificationActions
