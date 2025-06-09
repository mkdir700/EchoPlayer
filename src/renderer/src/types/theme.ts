import type { GlobalToken } from 'antd'
import type { CSSProperties } from 'react'

/**
 * Theme styles interface containing all CSS-in-JS style definitions
 * 主题样式接口，包含所有CSS-in-JS样式定义
 */
export interface ThemeStyles {
  // Base page styles - 基础页面样式
  pageContainer: CSSProperties
  cardContainer: CSSProperties
  cardHover: CSSProperties
  glassEffect: CSSProperties
  gradientText: CSSProperties
  primaryButton: CSSProperties
  secondaryButton: CSSProperties
  emptyContainer: CSSProperties
  pageTitle: CSSProperties
  pageSubtitle: CSSProperties
  sectionTitle: CSSProperties
  videoPoster: CSSProperties
  playOverlay: CSSProperties
  durationBadge: CSSProperties
  deleteButton: CSSProperties

  // Settings page specific styles - 设置页面特定样式
  settingsContainer: CSSProperties
  settingsLayout: CSSProperties
  settingsSidebar: CSSProperties
  settingsContent: CSSProperties
  settingsMain: CSSProperties
  settingsMainContent: CSSProperties
  shortcutItem: CSSProperties
  shortcutKeyTag: CSSProperties
  shortcutEditInput: CSSProperties
  settingsActionBar: CSSProperties

  // Settings section specific styles - 设置区块通用样式
  settingsSectionCard: CSSProperties
  settingsRow: CSSProperties
  settingsRowContent: CSSProperties
  settingsRowTitle: CSSProperties
  settingsRowDescription: CSSProperties
  settingsRowControl: CSSProperties
  settingsInfoHeader: CSSProperties
  settingsInfoIcon: CSSProperties
  settingsFeatureList: CSSProperties
  settingsFeatureListItem: CSSProperties
  settingsDivider: CSSProperties

  // Settings form styles - 设置表单样式
  settingsPageTitle: CSSProperties
  settingsPageSubtitle: CSSProperties
  settingsFormContainer: CSSProperties
  settingsInputGroup: CSSProperties
  settingsLabel: CSSProperties
  settingsInput: CSSProperties
  settingsButtonGroup: CSSProperties
  settingsDangerZone: CSSProperties
  settingsDangerZoneTitle: CSSProperties
  settingsDangerZoneDescription: CSSProperties

  // Navigation specific styles - 导航特定样式
  sidebarItem: CSSProperties
  sidebarItemActive: CSSProperties
  sidebarIcon: CSSProperties
  sidebarLabel: CSSProperties

  // Horizontal navigation styles for settings - 设置页面水平导航样式
  horizontalNavContainer: CSSProperties
  horizontalNavItem: CSSProperties
  horizontalNavItemActive: CSSProperties
  horizontalNavItemHover: CSSProperties
  horizontalNavIcon: CSSProperties
  horizontalNavLabel: CSSProperties

  // PlayPageHeader specific styles - 播放页面头部特定样式
  playPageHeader: CSSProperties
  playPageHeaderBackground: CSSProperties
  playPageHeaderLeft: CSSProperties
  playPageBackButton: CSSProperties
  playPageHeaderCenter: CSSProperties
  playPageVideoInfo: CSSProperties
  playPageVideoIcon: CSSProperties
  playPageVideoDetails: CSSProperties
  playPageVideoTitle: CSSProperties
  playPageVideoStatus: CSSProperties
  playPageHeaderRight: CSSProperties

  // Play page specific styles - 播放页面特定样式
  playPageContainer: CSSProperties
  playPageContent: CSSProperties
  playPageSplitter: CSSProperties
  mainContentArea: CSSProperties
  videoPlayerSection: CSSProperties
  sidebarSection: CSSProperties
  sidebarDivider: CSSProperties
  playPageGlassPanel: CSSProperties
  videoSectionContainer: CSSProperties
  immersiveContainer: CSSProperties

  // Video controls specific styles - 视频控制器特定样式
  compactControlsContainer: CSSProperties
  progressSection: CSSProperties
  progressSlider: CSSProperties
  timeDisplay: CSSProperties
  timeText: CSSProperties
  mainControls: CSSProperties
  leftControls: CSSProperties
  centerControls: CSSProperties
  rightControls: CSSProperties
  controlBtn: CSSProperties
  controlBtnActive: CSSProperties
  playPauseBtn: CSSProperties
  controlPopup: CSSProperties
  playbackRateControl: CSSProperties
  playbackRateSelect: CSSProperties

  // Fullscreen mode specific styles - 全屏模式特定样式
  fullscreenContainer: CSSProperties
  fullscreenControlsBar: CSSProperties
  fullscreenControlsBarVisible: CSSProperties
  fullscreenControlsLeft: CSSProperties
  fullscreenControlsCenter: CSSProperties
  fullscreenControlsRight: CSSProperties
  fullscreenControlGroup: CSSProperties
  fullscreenControlBtn: CSSProperties
  fullscreenControlBtnActive: CSSProperties
  fullscreenControlBtnHover: CSSProperties
  fullscreenPlayPauseBtn: CSSProperties
  fullscreenCenterPlayButton: CSSProperties
  fullscreenCenterPlayBtn: CSSProperties
  fullscreenTimeDisplay: CSSProperties
  fullscreenTimeText: CSSProperties
  fullscreenVolumeSliderPopup: CSSProperties
  fullscreenVolumeSliderVertical: CSSProperties
  fullscreenVolumeText: CSSProperties
  fullscreenSettingsControl: CSSProperties
  fullscreenSettingsPopup: CSSProperties
  fullscreenSettingsContent: CSSProperties
  fullscreenSettingsTitle: CSSProperties
  fullscreenSettingsItem: CSSProperties
  fullscreenSettingsLabel: CSSProperties
  fullscreenPlaybackRateSelect: CSSProperties

  // Playback Rate Selector - 播放速度选择器样式
  playbackRateButton: CSSProperties
  playbackRateButtonCompact: CSSProperties
  playbackRateButtonFullscreen: CSSProperties
  playbackRatePopup: CSSProperties
  playbackRatePopupFullscreen: CSSProperties
  playbackRateConfigSection: CSSProperties
  playbackRateConfigSectionTitle: CSSProperties
  playbackRateConfigSectionTitleFullscreen: CSSProperties
  playbackRateConfigGrid: CSSProperties
  playbackRateConfigItem: CSSProperties
  playbackRateConfigItemFullscreen: CSSProperties
  playbackRateConfigItemSelected: CSSProperties
  playbackRateConfigItemSelectedFullscreen: CSSProperties
  playbackRateConfigItemCurrent: CSSProperties
  playbackRateConfigItemCurrentFullscreen: CSSProperties
  playbackRateConfigItemText: CSSProperties
  playbackRateQuickSection: CSSProperties
  playbackRateQuickSectionTitle: CSSProperties
  playbackRateQuickSectionTitleFullscreen: CSSProperties
  playbackRateQuickButton: CSSProperties
  playbackRateQuickButtonActive: CSSProperties
  playbackRateDivider: CSSProperties
  playbackRateSpanText: CSSProperties
  playbackRateSpanTextFullscreen: CSSProperties

  // Volume control styles - 音量控制样式
  volumeControl: CSSProperties
  volumeSliderPopup: CSSProperties
  volumeSliderVertical: CSSProperties
  volumeSliderHorizontal: CSSProperties
  volumeSliderHorizontalContainer: CSSProperties
  volumeSliderHorizontalTrack: CSSProperties
  volumeSliderKeyPoint: CSSProperties
  volumeSliderKeyPointActive: CSSProperties
  volumeSliderKeyPointLabel: CSSProperties
  customVolumeSlider: CSSProperties
  customVolumeSliderTrack: CSSProperties
  customVolumeSliderTrackFilled: CSSProperties
  customVolumeSliderHandle: CSSProperties
  customVolumeSliderKeyPoint: CSSProperties
  customVolumeSliderKeyPointActive: CSSProperties
  subtitleModeControl: CSSProperties
  subtitleModeSelector: CSSProperties
  compactLayoutContainer: CSSProperties

  // Medium width responsive styles (768px-840px) - 中等宽度响应式样式
  mediumWidthMainControls: CSSProperties
  mediumWidthLeftControls: CSSProperties
  mediumWidthCenterControls: CSSProperties
  mediumWidthRightControls: CSSProperties
  mediumWidthSecondaryRow: CSSProperties
  mediumWidthPrimaryControls: CSSProperties
  mediumWidthSecondaryControls: CSSProperties

  // Subtitle specific styles - 字幕特定样式
  subtitleContainer: CSSProperties
  subtitleContainerHover: CSSProperties
  subtitleContainerDragging: CSSProperties
  subtitleContent: CSSProperties
  subtitleContentTransparent: CSSProperties
  subtitleContentBlur: CSSProperties
  subtitleContentSolidBlack: CSSProperties
  subtitleContentSolidGray: CSSProperties
  subtitleText: CSSProperties
  subtitleTextEnglish: CSSProperties
  subtitleTextChinese: CSSProperties
  subtitleTextHidden: CSSProperties
  subtitleWord: CSSProperties
  subtitleWordHover: CSSProperties
  subtitleWordClickable: CSSProperties
  subtitleWordClickableHover: CSSProperties
  subtitleControls: CSSProperties
  subtitleControlButton: CSSProperties
  subtitleControlButtonHover: CSSProperties
  subtitleControlButtonActive: CSSProperties
  subtitleControlButtonMaskActive: CSSProperties
  subtitleControlButtonMaskInactive: CSSProperties
  subtitleControlIcon: CSSProperties
  subtitleControlIconMask: CSSProperties
  subtitleResizeHandle: CSSProperties
  subtitleResizeHandleHover: CSSProperties
  subtitleMaskOverlay: CSSProperties

  // Subtitle list item specific styles - 字幕列表项特定样式
  subtitleListItem: CSSProperties
  subtitleListItemActive: CSSProperties
  subtitleListItemHover: CSSProperties
  subtitleListItemTime: CSSProperties
  subtitleListItemText: CSSProperties
  subtitleListItemIndicator: CSSProperties

  // Subtitle list container specific styles - 字幕列表容器特定样式
  subtitleListContainer: CSSProperties
  subtitleListContainerNoHeader: CSSProperties
  subtitleListContent: CSSProperties
  subtitleListHeader: CSSProperties
  subtitleListEmptyState: CSSProperties
  subtitleListVirtualizedList: CSSProperties

  // Subtitle prompt specific styles - 字幕提示特定样式
  subtitlePromptContainer: CSSProperties
  subtitlePromptAlert: CSSProperties
  subtitlePromptButtonContainer: CSSProperties
  subtitlePromptPrimaryButton: CSSProperties
  subtitlePromptSecondaryButton: CSSProperties
  subtitlePromptSupportText: CSSProperties

  // Subtitle search specific styles - 字幕搜索相关样式
  subtitleSearchContainer: CSSProperties
  subtitleSearchIcon: CSSProperties
  subtitleSearchTitle: CSSProperties
  subtitleSearchSubtitle: CSSProperties
  subtitleSearchActionContainer: CSSProperties
  subtitleSearchImportButton: CSSProperties
  subtitleSearchDivider: CSSProperties
  subtitleSearchDividerText: CSSProperties
  subtitleSearchOnlineContainer: CSSProperties
  subtitleSearchWebsiteGrid: CSSProperties
  subtitleSearchWebsiteButton: CSSProperties
  subtitleSearchWebsiteButtonIcon: CSSProperties

  // Video compatibility modal specific styles - 视频兼容性模态框样式
  videoCompatibilityModalContainer: CSSProperties
  videoCompatibilityModalDescription: CSSProperties
  videoCompatibilityModalProblemList: CSSProperties
  videoCompatibilityModalProblemItem: CSSProperties
  videoCompatibilityModalHelpText: CSSProperties
  videoCompatibilityModalAlertContainer: CSSProperties
  videoCompatibilityModalProgressContainer: CSSProperties
  videoCompatibilityModalProgressHeader: CSSProperties
  videoCompatibilityModalProgressFooter: CSSProperties
  videoCompatibilityModalProgressText: CSSProperties
}

/**
 * Theme utility functions interface
 * 主题工具函数接口
 */
export interface ThemeUtils {
  /**
   * Generate poster background based on file name
   * 基于文件名生成海报背景
   */
  generatePosterBackground: (fileName: string) => string

  /**
   * Format timestamp to relative time ago string
   * 将时间戳格式化为相对时间字符串
   */
  formatTimeAgo: (timestamp: number) => string

  /**
   * Convert hex color to rgba with alpha
   * 将十六进制颜色转换为带透明度的rgba
   */
  hexToRgba: (hex: string, alpha?: number) => string

  /**
   * Create hover style object from base and hover styles
   * 从基础样式和悬停样式创建悬停样式对象
   */
  createHoverStyle: (
    baseStyle: CSSProperties,
    hoverStyle: CSSProperties
  ) => {
    base: CSSProperties
    hover: CSSProperties
  }
}

/**
 * Return type of useTheme hook
 * useTheme hook的返回类型
 */
export interface UseThemeReturn {
  /**
   * Ant Design theme token
   * Ant Design主题令牌
   */
  token: GlobalToken

  /**
   * Theme styles object
   * 主题样式对象
   */
  styles: ThemeStyles

  /**
   * Theme utility functions
   * 主题工具函数
   */
  utils: ThemeUtils
}
