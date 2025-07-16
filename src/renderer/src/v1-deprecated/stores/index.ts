// Export all stores from this index file
export { useUIStore } from './slices/uiStore'
export {
  // 播放设置相关选择器 / Playback settings related selectors
  useDisplayMode,
  useIsAutoPause,
  useIsSingleLoop,
  useLoopSettings,
  usePlaybackRate,
  // 设置函数选择器 / Setter function selectors
  useSetDisplayMode,
  useSetIsAutoPause,
  useSetIsSingleLoop,
  useSetLoopSettings,
  useSetPlaybackRate,
  useSetPlaybackSettings,
  useSetSubtitleDisplay,
  useSetSubtitleLayoutLocked,
  useSetVolume,
  useSubtitleDisplay,
  useSubtitleLayoutLocked,
  useVideoConfigStore,
  useVolume
} from './slices/videoConfigStore'

// Export update notification store
export {
  useHasNewVersion,
  useHasVisibleRedDots,
  useIsCheckingForUpdates,
  useUpdateNotificationStore,
  useUpdateRedDots
} from './slices/updateNotificationStore'

// Export store types
export type {
  VideoConfig,
  VideoConfigActions,
  VideoConfigState,
  VideoConfigStore
} from './slices/videoConfigStore'
export type { UIActions, UIState, UIStore } from './types'
export type {
  RedDotState,
  RedDotType,
  UpdateNotificationActions,
  UpdateNotificationState,
  UpdateNotificationStore
} from './types'

// Export hooks
export { useFullscreenMode } from '../hooks/features/ui/useFullscreenMode'
