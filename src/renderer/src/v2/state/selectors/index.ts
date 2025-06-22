/**
 * V2 状态选择器入口文件 / V2 State Selectors Entry Point
 *
 * 导出所有状态选择器和相关 Hooks
 * Exports all state selectors and related hooks
 */

// 视频状态选择器 / Video State Selectors
export {
  videoSelectors,
  // 基础视频信息 Hooks / Basic video info hooks
  useCurrentVideo,
  useVideoLoadingState,
  useRecentPlays,
  // 加载状态 Hooks / Loading state hooks
  useIsVideoLoading,
  useVideoLoadingProgress,
  useVideoLoadingError,
  // 当前视频属性 Hooks / Current video property hooks
  useCurrentVideoId,
  useCurrentVideoPath,
  useCurrentVideoName,
  useCurrentVideoTime,
  useCurrentVideoDuration,
  useIsVideoPlaying,
  useVideoVolume,
  useVideoPlaybackRate,
  // 计算属性 Hooks / Computed property hooks
  useHasCurrentVideo,
  useVideoProgress,
  useVideoProgressText,
  useIsVideoNearEnd,
  // 组合数据 Hooks / Composite data hooks
  useVideoWithProgress,
  useVideoPlaybackInfo,
  useVideoLoadingInfo,
  // 最近播放 Hooks / Recent plays hooks
  useRecentPlaysCount,
  useHasRecentPlays,
  useLatestRecentPlay,
  useRecentPlaysByDate,
  // 缓存 Hooks / Cache hooks
  useCachedPlaybackSettings,
  useCachedUIConfig,
  useHasCachedSettings,
  // 导航相关 Hooks / Navigation related hooks
  useCanSeekForward,
  useCanSeekBackward
} from './video.selectors'

// 字幕状态选择器 / Subtitle State Selectors
export {
  subtitleSelectors,
  // 基础字幕数据 Hooks / Basic subtitle data hooks
  useSubtitles,
  useCurrentSubtitleFile,
  useSubtitleLoadingState,
  useSubtitleDisplayConfig,
  // 导航 Hooks / Navigation hooks
  useCurrentSubtitleIndex,
  useSubtitleNavigation,
  useIsAutoNavigationEnabled,
  // 当前字幕 Hooks / Current subtitle hooks
  useCurrentSubtitle,
  useCurrentSubtitleDisplayText,
  useHasNextSubtitle,
  useHasPreviousSubtitle,
  useNextSubtitle,
  usePreviousSubtitle,
  // 显示配置 Hooks / Display configuration hooks
  useSubtitleDisplayMode,
  useSubtitleFontSize,
  useSubtitleFontFamily,
  useIsAutoScrollEnabled,
  // 加载状态 Hooks / Loading state hooks
  useIsSubtitleLoading,
  useSubtitleLoadingProgress,
  useSubtitleLoadingError,
  // 计算属性 Hooks / Computed property hooks
  useHasSubtitles,
  useSubtitleCount,
  useSubtitleDuration,
  // 搜索和过滤 Hooks / Search and filtering hooks
  useSubtitleSearchQuery,
  useHasSearchQuery,
  useFilteredSubtitles,
  useSearchResultCount,
  useHasFilteredResults,
  // 显示相关 Hooks / Display related hooks
  useVisibleSubtitles,
  // 文件信息 Hooks / File info hooks
  useCurrentSubtitleFileName,
  useCurrentSubtitleFormat,
  useCurrentSubtitleLanguage,
  // 组合数据 Hooks / Composite data hooks
  useSubtitleNavigationInfo,
  useSubtitleFileInfo,
  useSubtitleSearchInfo,
  // 缓存 Hooks / Cache hooks
  useSubtitleCacheStats,
  // 参数化 Hooks / Parameterized hooks
  useSubtitleAtTime,
  useSubtitleIndexAtTime,
  useCachedSubtitles,
  useHasCachedSubtitles
} from './subtitle.selectors'

// 播放控制状态选择器 / Playback Control State Selectors
export {
  playbackSelectors,
  // 基础播放状态 Hooks / Basic playback state hooks
  usePlaybackState,
  useIsPlaying,
  useIsPaused,
  useIsLoading,
  useHasError,
  useErrorMessage,
  // 播放进度 Hooks / Playback progress hooks
  useCurrentTime,
  useDuration,
  useProgressPercentage,
  useTimeRemaining,
  useIsNearEnd,
  // 控制配置 Hooks / Control configuration hooks
  useVolume,
  usePlaybackRate,
  useIsMuted,
  useIsAutoPause,
  useEffectiveVolume,
  // 循环配置 Hooks / Loop configuration hooks
  useLoopMode,
  useLoopCount,
  useRemainingCount,
  useIsLoopActive,
  useIsInfiniteLoop,
  useHasLoopRange,
  // 能力检查 Hooks / Capability check hooks
  useCanPlay,
  useCanPause,
  useCanSeek,
  // 格式化数据 Hooks / Formatted data hooks
  useFormattedCurrentTime,
  useFormattedDuration,
  useFormattedProgressText,
  useFormattedVolume,
  // 组合数据 Hooks / Composite data hooks
  usePlaybackInfo,
  useLoopInfo,
  useControlInfo,
  useStatisticsInfo,
  // 统计信息 Hooks / Statistics hooks
  usePlayCount,
  useTotalPlayTime,
  useSessionPlayTime,
  // 参数化 Hooks / Parameterized hooks
  useCanSeekTo,
  useIsInLoopRange
} from './playback.selectors'

// 界面状态选择器 / UI State Selectors
export {
  uiSelectors,
  // 主题和布局 Hooks / Theme and layout hooks
  useThemeMode,
  useLayoutMode,
  useIsDarkMode,
  useIsSystemTheme,
  useIsLightTheme,
  useIsDarkTheme,
  // 全屏状态 Hooks / Fullscreen state hooks
  useIsFullscreen,
  useIsInFullscreenMode,
  useCanExitFullscreen,
  useFullscreenElement,
  // 布局尺寸 Hooks / Layout dimensions hooks
  useWindowDimensions,
  useContentDimensions,
  useSidebarWidth,
  useEffectiveSidebarWidth,
  // 侧边栏状态 Hooks / Sidebar state hooks
  useIsSidebarVisible,
  useIsSidebarCollapsed,
  useIsSidebarPinned,
  useSidebarActiveTab,
  useSidebarAvailableTabs,
  // 控制栏状态 Hooks / Control bar state hooks
  useIsControlBarVisible,
  useIsControlBarAutoHide,
  useControlBarPosition,
  // 模态框状态 Hooks / Modal state hooks
  useActiveModals,
  useHasActiveModals,
  useModalCount,
  useTopModal,
  useIsBackdropVisible,
  // 通知状态 Hooks / Notification state hooks
  useNotifications,
  useNotificationCount,
  useHasNotifications,
  useLatestNotification,
  useNotificationPosition,
  // 页面状态 Hooks / Page state hooks
  useShowPlayPageHeader,
  useShowSubtitleList,
  useShowControls,
  useIsDragging,
  useAutoResumeAfterWordCard,
  // 响应式断点 Hooks / Responsive breakpoint hooks
  useIsSmallScreen,
  useIsMediumScreen,
  useIsLargeScreen,
  useIsExtraLargeScreen,
  useIsMobileLayout,
  useIsTabletLayout,
  useIsDesktopLayout,
  // 布局模式 Hooks / Layout mode hooks
  useIsCompactLayout,
  useIsComfortableLayout,
  useIsSpaciousLayout,
  // 组合数据 Hooks / Composite data hooks
  useLayoutInfo,
  useSidebarInfo,
  useModalInfo,
  useNotificationInfo,
  usePageStateInfo,
  // 参数化 Hooks / Parameterized hooks
  useIsModalOpen,
  useModalZIndex,
  useNotificationsByType,
  useRecentNotifications
} from './ui.selectors'
