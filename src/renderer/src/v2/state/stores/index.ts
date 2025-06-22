/**
 * V2 状态存储入口文件 / V2 State Stores Entry Point
 *
 * 导出所有状态存储和相关类型
 * Exports all state stores and related types
 */

// 视频状态存储 / Video State Store
export {
  useVideoStore,
  type VideoStore,
  type VideoState,
  type VideoActions,
  type CurrentVideoState,
  type VideoLoadingState
} from './video.store'

// 字幕状态存储 / Subtitle State Store
export {
  useSubtitleStore,
  type SubtitleStore,
  type SubtitleState,
  type SubtitleActions,
  type SubtitleDisplayConfig,
  type SubtitleLoadingState,
  type SubtitleNavigationState
} from './subtitle.store'

// 播放控制状态存储 / Playback Control State Store
export {
  usePlaybackControlStore,
  PlaybackState,
  LoopMode,
  type PlaybackControlStore,
  type PlaybackControlState,
  type PlaybackControlActions,
  type PlaybackControlConfig,
  type LoopControlConfig,
  type PlaybackProgress,
  type PlaybackStatistics
} from './playback.store'

// 界面状态存储 / UI State Store
export {
  useUIStore,
  ThemeMode,
  LayoutMode,
  type UIStore,
  type UIState,
  type UIActions,
  type FullscreenState,
  type LayoutDimensions,
  type SidebarState,
  type ControlBarState,
  type ModalState,
  type NotificationState
} from './ui.store'
