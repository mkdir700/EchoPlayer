// Export all stores from this index file
export { useUIStore } from './slices/uiStore'
export {
  useVideoConfigStore,
  useSubtitleLayoutLocked,
  useSetSubtitleLayoutLocked,
  // 播放设置相关选择器 / Playback settings related selectors
  useDisplayMode,
  useVolume,
  usePlaybackRate,
  useIsSingleLoop,
  useLoopSettings,
  useIsAutoPause,
  useSubtitleDisplay,
  // 设置函数选择器 / Setter function selectors
  useSetDisplayMode,
  useSetVolume,
  useSetPlaybackRate,
  useSetIsSingleLoop,
  useSetLoopSettings,
  useSetIsAutoPause,
  useSetSubtitleDisplay,
  useSetPlaybackSettings
} from './slices/videoConfigStore'

// Export update notification store
export {
  useUpdateNotificationStore,
  useHasNewVersion,
  useIsCheckingForUpdates,
  useUpdateRedDots,
  useHasVisibleRedDots
} from './slices/updateNotificationStore'

// Export store types
export type { UIStore, UIState, UIActions } from './types'
export type {
  VideoConfigStore,
  VideoConfigState,
  VideoConfigActions,
  VideoConfig
} from './slices/videoConfigStore'
export type {
  UpdateNotificationStore,
  UpdateNotificationState,
  UpdateNotificationActions,
  RedDotState,
  RedDotType
} from './types'

// Export hooks
export { useFullscreenMode } from '../hooks/useFullscreenMode'
