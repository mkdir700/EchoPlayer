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
}

// Combined UI store type
export type UIStore = UIState & UIActions
