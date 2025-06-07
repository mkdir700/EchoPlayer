import { theme } from 'antd'
import { useMemo } from 'react'
import {
  themeStyles,
  COMPONENT_TOKENS,
  FONT_SIZES,
  SPACING,
  ANIMATION_DURATION,
  EASING
} from '@renderer/styles/theme'
import type { GlobalToken } from 'antd'
import type { CSSProperties } from 'react'

interface ThemeStyles {
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
  // Settings page specific styles
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
  // Navigation specific styles
  sidebarItem: CSSProperties
  sidebarItemActive: CSSProperties
  sidebarIcon: CSSProperties
  sidebarLabel: CSSProperties
  // Horizontal navigation styles for settings
  horizontalNavContainer: CSSProperties
  horizontalNavItem: CSSProperties
  horizontalNavItemActive: CSSProperties
  horizontalNavItemHover: CSSProperties
  horizontalNavIcon: CSSProperties
  horizontalNavLabel: CSSProperties
  // PlayPageHeader specific styles
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
  // Play page specific styles
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
  // Video controls specific styles
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
  // Fullscreen mode specific styles
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
  // Medium width responsive styles (768px-840px)
  mediumWidthMainControls: CSSProperties
  mediumWidthLeftControls: CSSProperties
  mediumWidthCenterControls: CSSProperties
  mediumWidthRightControls: CSSProperties
  mediumWidthSecondaryRow: CSSProperties
  mediumWidthPrimaryControls: CSSProperties
  mediumWidthSecondaryControls: CSSProperties
  // Subtitle specific styles
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
  // Subtitle list item specific styles
  subtitleListItem: CSSProperties
  subtitleListItemActive: CSSProperties
  subtitleListItemHover: CSSProperties
  subtitleListItemTime: CSSProperties
  subtitleListItemText: CSSProperties
  subtitleListItemIndicator: CSSProperties
  // Subtitle list container specific styles
  subtitleListContainer: CSSProperties
  subtitleListContainerNoHeader: CSSProperties
  subtitleListContent: CSSProperties
  subtitleListHeader: CSSProperties
  subtitleListEmptyState: CSSProperties
  subtitleListVirtualizedList: CSSProperties
  // Subtitle prompt specific styles
  subtitlePromptContainer: CSSProperties
  subtitlePromptAlert: CSSProperties
  subtitlePromptButtonContainer: CSSProperties
  subtitlePromptPrimaryButton: CSSProperties
  subtitlePromptSecondaryButton: CSSProperties
  subtitlePromptSupportText: CSSProperties
}

interface ThemeUtils {
  generatePosterBackground: (fileName: string) => string
  formatTimeAgo: (timestamp: number) => string
  hexToRgba: (hex: string, alpha?: number) => string
  createHoverStyle: (
    baseStyle: CSSProperties,
    hoverStyle: CSSProperties
  ) => {
    base: CSSProperties
    hover: CSSProperties
  }
}

interface UseThemeReturn {
  token: GlobalToken
  styles: ThemeStyles
  utils: ThemeUtils
}

/**
 * Builds the theme styles object based on the provided token
 */
function buildStyles(token: GlobalToken): ThemeStyles {
  return {
    // 页面容器样式
    pageContainer: {
      minHeight: '100vh',
      height: '100vh',
      background: `linear-gradient(180deg, ${token.colorBgContainer} 0%, ${token.colorBgLayout} 100%)`,
      padding: token.paddingLG,
      overflow: 'hidden',
      boxSizing: 'border-box' as const
    },

    // 卡片容器样式
    cardContainer: {
      background: token.colorBgContainer,
      borderRadius: token.borderRadiusLG,
      border: `1px solid ${token.colorBorderSecondary}`,
      boxShadow: themeStyles.appleCardShadow.light,
      overflow: 'hidden',
      transition: `all ${token.motionDurationMid} ${token.motionEaseInOut}`
    },

    // 卡片悬停样式
    cardHover: {
      boxShadow: themeStyles.appleCardShadow.heavy,
      transform: 'translateY(-4px)'
    },

    // 毛玻璃效果
    glassEffect: {
      background: `rgba(${token.colorBgContainer
        .slice(1)
        .match(/.{2}/g)
        ?.map((hex) => parseInt(hex, 16))
        .join(', ')}, 0.8)`,
      ...themeStyles.glassMorphism,
      border: `1px solid rgba(${token.colorBorder
        .slice(1)
        .match(/.{2}/g)
        ?.map((hex) => parseInt(hex, 16))
        .join(', ')}, 0.2)`
    },

    // 渐变文字
    gradientText: {
      background: themeStyles.gradients.primary,
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
      fontWeight: 600
    },

    // 主要按钮样式
    primaryButton: {
      height: 48,
      borderRadius: token.borderRadiusLG,
      fontSize: token.fontSizeLG,
      fontWeight: 600,
      border: 'none',
      background: themeStyles.gradients.primary,
      boxShadow: `0 4px 16px rgba(${token.colorPrimary
        .slice(1)
        .match(/.{2}/g)
        ?.map((hex) => parseInt(hex, 16))
        .join(', ')}, 0.3)`,
      transition: `all ${token.motionDurationMid} ${themeStyles.easing.apple}`
    },

    // 次要按钮样式
    secondaryButton: {
      height: 48,
      borderRadius: token.borderRadiusLG,
      fontSize: token.fontSizeLG,
      fontWeight: 600,
      background: token.colorBgContainer,
      borderColor: token.colorBorder,
      color: token.colorText,
      transition: `all ${token.motionDurationMid} ${themeStyles.easing.apple}`
    },

    // 空状态容器
    emptyContainer: {
      textAlign: 'center' as const,
      padding: `${token.paddingXL * 2}px`,
      background: token.colorBgContainer,
      borderRadius: token.borderRadiusLG,
      border: `1px solid ${token.colorBorderSecondary}`
    },

    // 标题样式
    pageTitle: {
      fontSize: token.fontSizeHeading1 * 1.2,
      fontWeight: 700,
      margin: `0 0 ${token.marginSM}px 0`,
      background: themeStyles.gradients.primary,
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text'
    },

    // 副标题样式
    pageSubtitle: {
      fontSize: token.fontSizeLG,
      color: token.colorTextDescription,
      fontWeight: 500
    },

    // 区域标题样式
    sectionTitle: {
      margin: 0,
      fontSize: token.fontSizeHeading2,
      fontWeight: 600,
      color: token.colorText,
      display: 'flex',
      alignItems: 'center',
      gap: token.marginSM
    },

    // 视频海报容器
    videoPoster: {
      position: 'relative' as const,
      aspectRatio: '16/9' as const,
      overflow: 'hidden' as const
    },

    // 播放覆盖层
    playOverlay: {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.3)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      opacity: 0,
      transition: `opacity ${token.motionDurationMid} ease`
    },

    // 时长标签
    durationBadge: {
      position: 'absolute' as const,
      bottom: token.paddingSM,
      right: token.paddingSM,
      background: 'rgba(0, 0, 0, 0.7)',
      color: '#fff',
      padding: `${token.paddingXXS}px ${token.paddingXS}px`,
      borderRadius: token.borderRadius,
      fontSize: token.fontSizeSM,
      fontWeight: 500,
      backdropFilter: 'blur(4px)'
    },

    // 删除按钮
    deleteButton: {
      background: 'rgba(0, 0, 0, 0.6)',
      color: '#fff',
      border: 'none',
      borderRadius: token.borderRadius,
      backdropFilter: 'blur(4px)'
    },

    // Settings page specific styles
    settingsContainer: {
      minHeight: '100vh',
      background: token.colorBgLayout,
      display: 'flex',
      flexDirection: 'column' as const,
      overflow: 'auto',
      boxSizing: 'border-box' as const
    },

    settingsLayout: {
      display: 'flex',
      flex: 1,
      minHeight: 'calc(100vh - 0px)' // 确保有足够高度
    },

    settingsSidebar: {
      width: 240,
      background: token.colorBgContainer,
      borderRight: `1px solid ${token.colorBorderSecondary}`,
      display: 'flex',
      flexDirection: 'column' as const,
      flexShrink: 0
    },

    settingsContent: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column' as const,
      minWidth: 0
    },

    settingsMain: {
      background: token.colorBgContainer,
      flex: 1,
      display: 'flex',
      flexDirection: 'column' as const,
      minHeight: 0
    },

    settingsMainContent: {
      flex: 1,
      padding: `${token.paddingXL}px`,
      background: token.colorBgContainer,
      minHeight: 'calc(100vh - 200px)', // 减去头部和导航的高度
      overflowY: 'auto' as const,
      boxSizing: 'border-box' as const
    },

    shortcutItem: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: `${token.paddingMD}px ${token.paddingLG}px`,
      borderBottom: `1px solid ${token.colorBorderSecondary}`,
      transition: `background-color ${token.motionDurationMid} ${themeStyles.easing.apple}`,
      position: 'relative' as const
    },

    shortcutKeyTag: {
      background: token.colorFillQuaternary,
      color: token.colorText,
      border: `1px solid ${token.colorBorder}`,
      borderRadius: token.borderRadius,
      padding: `${token.paddingXXS}px ${token.paddingSM}px`,
      fontSize: token.fontSizeSM,
      fontWeight: 500,
      fontFamily: 'Monaco, "SF Mono", Consolas, monospace',
      minWidth: 80,
      textAlign: 'center' as const,
      transition: `all ${token.motionDurationMid} ease`
    },

    shortcutEditInput: {
      position: 'relative' as const,
      display: 'flex',
      alignItems: 'center',
      gap: token.marginXS,
      background: token.colorBgElevated,
      borderRadius: token.borderRadius,
      border: `2px solid ${token.colorPrimary}`,
      padding: token.paddingXS
    },

    settingsActionBar: {
      padding: token.paddingLG,
      borderTop: `1px solid ${token.colorBorderSecondary}`,
      background: token.colorBgElevated,
      display: 'flex',
      justifyContent: 'center',
      gap: token.marginSM
    },

    // Sidebar navigation styles
    sidebarItem: {
      display: 'flex',
      alignItems: 'center',
      gap: token.marginSM,
      padding: `${token.paddingMD}px ${token.paddingLG}px`,
      margin: `${token.marginXXS}px ${token.marginSM}px`,
      borderRadius: token.borderRadius,
      cursor: 'pointer',
      transition: `all ${token.motionDurationMid} ${themeStyles.easing.apple}`,
      color: token.colorTextSecondary,
      fontSize: token.fontSize,
      fontWeight: 500,
      position: 'relative' as const,
      overflow: 'hidden'
    },

    sidebarItemActive: {
      background: token.colorPrimary,
      color: token.colorWhite,
      fontWeight: 600,
      boxShadow: `0 2px 12px ${token.colorPrimary}30`
    },

    sidebarIcon: {
      fontSize: token.fontSizeHeading3,
      width: 18,
      height: 18,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0
    },

    sidebarLabel: {
      flex: 1,
      whiteSpace: 'nowrap' as const,
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    },

    // Horizontal navigation styles for settings
    horizontalNavContainer: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: token.marginXS,
      padding: `${token.paddingMD}px 0`,
      borderBottom: `1px solid ${token.colorBorderSecondary}`,
      background: token.colorBgElevated,
      flexWrap: 'wrap' as const,
      overflowX: 'auto' as const,
      scrollbarWidth: 'none' as const, // Firefox
      msOverflowStyle: 'none' as const, // IE/Edge
      // Hide scrollbar for WebKit browsers
      '::-webkit-scrollbar': {
        display: 'none'
      }
    } as CSSProperties,

    horizontalNavItem: {
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      justifyContent: 'center',
      gap: token.marginXXS,
      padding: `${token.paddingSM}px ${token.paddingMD}px`,
      borderRadius: token.borderRadius,
      cursor: 'pointer',
      transition: `all ${token.motionDurationMid} ${themeStyles.easing.apple}`,
      color: token.colorTextSecondary,
      fontSize: token.fontSizeSM,
      fontWeight: COMPONENT_TOKENS.NAVIGATION.INACTIVE_FONT_WEIGHT,
      minWidth: 80,
      textAlign: 'center' as const,
      border: `1px solid transparent`,
      background: 'transparent',
      position: 'relative' as const,
      flexShrink: 0
    },

    horizontalNavItemActive: {
      background: token.colorPrimary,
      color: token.colorWhite,
      fontWeight: COMPONENT_TOKENS.NAVIGATION.ACTIVE_FONT_WEIGHT,
      boxShadow: `0 2px 12px ${token.colorPrimary}30`,
      transform: 'translateY(-1px)'
    },

    horizontalNavItemHover: {
      background: token.colorFillQuaternary,
      color: token.colorText,
      border: `1px solid ${token.colorBorderSecondary}`,
      transform: 'translateY(-1px)',
      boxShadow: themeStyles.appleCardShadow.light
    },

    horizontalNavIcon: {
      fontSize: token.fontSizeHeading4,
      width: 20,
      height: 20,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      transition: `all ${token.motionDurationMid} ${themeStyles.easing.apple}`
    },

    horizontalNavLabel: {
      whiteSpace: 'nowrap' as const,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      maxWidth: '100%',
      lineHeight: 1.2
    },

    // PlayPageHeader specific styles
    playPageHeader: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: 56,
      padding: `0 ${token.paddingLG}px`,
      background: token.colorBgElevated,
      position: 'relative' as const,
      overflow: 'hidden',
      flexShrink: 0,
      borderBottom: `1px solid ${token.colorBorderSecondary}`,
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      zIndex: 100
    },

    playPageHeaderBackground: {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: `linear-gradient(
        90deg,
        rgba(${token.colorPrimary
          .slice(1)
          .match(/.{2}/g)
          ?.map((hex) => parseInt(hex, 16))
          .join(', ')}, 0.02) 0%,
        transparent 20%,
        transparent 80%,
        rgba(${token.colorPrimary
          .slice(1)
          .match(/.{2}/g)
          ?.map((hex) => parseInt(hex, 16))
          .join(', ')}, 0.02) 100%
      )`,
      pointerEvents: 'none' as const
    },

    playPageHeaderLeft: {
      display: 'flex',
      alignItems: 'center',
      flexShrink: 0,
      zIndex: 1
    },

    playPageBackButton: {
      color: `${token.colorTextSecondary} !important`,
      border: `1px solid rgba(255, 255, 255, 0.08) !important`,
      background: `rgba(255, 255, 255, 0.03) !important`,
      borderRadius: `${token.borderRadiusSM}px !important`,
      transition: `all ${token.motionDurationMid} ${themeStyles.easing.apple} !important`,
      fontWeight: 500,
      height: '36px !important',
      width: '36px !important',
      padding: '0 !important',
      display: 'flex !important',
      alignItems: 'center !important',
      justifyContent: 'center !important'
    },

    playPageHeaderCenter: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flex: 1,
      minWidth: 0,
      zIndex: 1
    },

    playPageVideoInfo: {
      display: 'flex',
      alignItems: 'center',
      gap: token.marginMD,
      maxWidth: '100%',
      minWidth: 0
    },

    playPageVideoIcon: {
      color: token.colorPrimary,
      fontSize: 18,
      flexShrink: 0,
      opacity: 0.9
    },

    playPageVideoDetails: {
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      minWidth: 0,
      gap: 2
    },

    playPageVideoTitle: {
      color: `${token.colorText} !important`,
      fontSize: `${token.fontSizeLG}px !important`,
      fontWeight: '600 !important',
      lineHeight: `${token.lineHeightSM} !important`,
      whiteSpace: 'nowrap' as const,
      overflow: 'hidden' as const,
      textOverflow: 'ellipsis' as const,
      maxWidth: 400,
      cursor: 'pointer',
      transition: `color ${token.motionDurationMid} ${themeStyles.easing.apple}`
    },

    playPageVideoStatus: {
      color: `${token.colorTextSecondary} !important`,
      fontSize: `${token.fontSize * 0.85}px !important`,
      fontWeight: '400 !important',
      lineHeight: '1 !important',
      opacity: 0.8,
      whiteSpace: 'nowrap' as const
    },

    playPageHeaderRight: {
      display: 'flex',
      alignItems: 'center',
      flexShrink: 0,
      zIndex: 1,
      minWidth: 120,
      justifyContent: 'flex-end'
    },

    // Play page specific styles
    playPageContainer: {
      display: 'flex',
      flexDirection: 'column' as const,
      height: '100vh',
      width: '100%',
      background: token.colorBgLayout,
      position: 'relative' as const,
      overflow: 'hidden',
      boxSizing: 'border-box' as const
    },

    playPageContent: {
      display: 'flex',
      flex: 1,
      minHeight: 0,
      position: 'relative' as const,
      background: token.colorBgContainer
    },

    playPageSplitter: {
      background: token.colorBgContainer,
      boxShadow: themeStyles.appleCardShadow.light,
      borderRadius: 0,
      border: 'none'
    },

    mainContentArea: {
      display: 'flex',
      flexDirection: 'column' as const,
      minWidth: 0,
      height: '100%',
      background: token.colorBgContainer,
      transition: `all ${token.motionDurationMid} ${themeStyles.easing.apple}`,
      position: 'relative' as const
    },

    videoPlayerSection: {
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#000000',
      position: 'relative' as const,
      minHeight: 0,
      overflow: 'hidden',
      borderRadius: `0 0 ${token.borderRadiusLG}px 0`,
      boxShadow: 'inset 0 0 0 1px rgba(255, 255, 255, 0.1)'
    },

    sidebarSection: {
      display: 'flex',
      flexDirection: 'column' as const,
      height: '100%',
      background: token.colorBgContainer,
      borderLeft: `1px solid ${token.colorBorderSecondary}`,
      position: 'relative' as const,
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)'
    },

    sidebarDivider: {
      position: 'absolute' as const,
      left: 0,
      top: 0,
      bottom: 0,
      width: 1,
      background: `linear-gradient(
        to bottom,
        transparent 0%,
        ${token.colorBorderSecondary} 20%,
        ${token.colorBorder} 50%,
        ${token.colorBorderSecondary} 80%,
        transparent 100%
      )`,
      zIndex: 1
    },

    playPageGlassPanel: {
      background: `rgba(${token.colorBgContainer
        .slice(1)
        .match(/.{2}/g)
        ?.map((hex) => parseInt(hex, 16))
        .join(', ')}, 0.85)`,
      backdropFilter: 'blur(20px) saturate(180%)',
      WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      border: `1px solid rgba(${token.colorBorder
        .slice(1)
        .match(/.{2}/g)
        ?.map((hex) => parseInt(hex, 16))
        .join(', ')}, 0.3)`,
      borderRadius: token.borderRadiusLG,
      boxShadow: themeStyles.appleCardShadow.medium
    },

    videoSectionContainer: {
      width: '100%',
      height: '100%',
      position: 'relative' as const,
      background: '#000000',
      borderRadius: token.borderRadiusLG,
      overflow: 'hidden',
      boxShadow: themeStyles.appleCardShadow.heavy
    },

    immersiveContainer: {
      background: `linear-gradient(
        135deg,
        ${token.colorBgContainer} 0%,
        ${token.colorBgLayout} 50%,
        ${token.colorBgContainer} 100%
      )`,
      minHeight: '100vh',
      position: 'relative' as const,
      overflow: 'hidden'
    },

    // Video controls specific styles
    compactControlsContainer: {
      background: token.colorBgContainer,
      borderTop: `1px solid ${token.colorBorderSecondary}`,
      padding: `${token.paddingSM}px ${token.paddingMD}px`,
      display: 'flex',
      flexDirection: 'column' as const,
      borderRadius: 0,
      transition: `all ${token.motionDurationSlow} ${themeStyles.easing.apple}`
    },

    progressSection: {
      display: 'flex',
      alignItems: 'center',
      gap: token.marginSM,
      paddingBottom: token.marginXS
    },

    progressSlider: {
      flex: 1
    },

    timeDisplay: {
      minWidth: 90,
      textAlign: 'center' as const,
      flexShrink: 0
    },

    timeText: {
      color: token.colorTextSecondary,
      fontSize: token.fontSizeSM,
      fontWeight: 500,
      fontFamily: '"SF Mono", "Monaco", "Consolas", monospace'
    },

    mainControls: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      width: '100%',
      minHeight: 44
    },

    leftControls: {
      display: 'flex',
      alignItems: 'center',
      gap: token.marginXXS,
      flex: '0 0 auto',
      minWidth: 120
    },

    centerControls: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: token.marginXS,
      flex: '1 1 auto'
    },

    rightControls: {
      display: 'flex',
      alignItems: 'center',
      gap: token.marginXXS,
      flex: '0 0 auto',
      minWidth: 120,
      justifyContent: 'flex-end'
    },

    controlBtn: {
      width: 32,
      height: 32,
      border: 'none',
      background: 'transparent',
      color: token.colorTextSecondary,
      borderRadius: token.borderRadiusSM,
      transition: `all ${token.motionDurationMid} ${themeStyles.easing.apple}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      fontSize: token.fontSizeSM,
      flexShrink: 0
    },

    controlBtnActive: {
      background: `rgba(${token.colorPrimary
        .slice(1)
        .match(/.{2}/g)
        ?.map((hex) => parseInt(hex, 16))
        .join(', ')}, 0.15)`,
      color: token.colorPrimary
    },

    playPauseBtn: {
      background: token.colorPrimary,
      width: 40,
      height: 40,
      borderRadius: '50%',
      color: token.colorWhite,
      fontSize: token.fontSizeHeading5,
      border: 'none',
      cursor: 'pointer',
      transition: `all ${token.motionDurationMid} ${themeStyles.easing.apple}`,
      flexShrink: 0,
      boxShadow: `0 2px 8px rgba(${token.colorPrimary
        .slice(1)
        .match(/.{2}/g)
        ?.map((hex) => parseInt(hex, 16))
        .join(', ')}, 0.3)`
    },

    controlPopup: {
      position: 'absolute' as const,
      bottom: 45,
      left: '50%',
      transform: 'translateX(-50%)',
      background: token.colorBgElevated,
      padding: `${token.paddingLG}px ${token.paddingMD}px`,
      borderRadius: token.borderRadiusLG,
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      gap: token.marginSM,
      minHeight: 120,
      boxShadow: themeStyles.appleCardShadow.heavy,
      border: `1px solid ${token.colorBorderSecondary}`,
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      zIndex: token.zIndexPopupBase // Use token zIndex instead of hardcoded value - 使用token中的zIndex而非硬编码值
    },

    playbackRateControl: {
      position: 'relative' as const
    },

    playbackRateSelect: {
      width: 50,
      height: 30,
      fontSize: token.fontSizeSM
    },

    // Fullscreen mode specific styles
    fullscreenContainer: {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 5
    },

    fullscreenControlsBar: {
      position: 'absolute' as const,
      bottom: 0,
      left: 0,
      right: 0,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      background:
        'linear-gradient(to top, rgba(0, 0, 0, 0.9) 0%, rgba(0, 0, 0, 0.7) 50%, transparent 100%)',
      padding: `${token.paddingLG}px ${token.paddingLG + 8}px`,
      transform: 'translateY(100%)',
      opacity: 0,
      transition: `all ${token.motionDurationSlow} ${themeStyles.easing.apple}`,
      zIndex: 10,
      pointerEvents: 'auto' as const,
      minHeight: 80
    },

    fullscreenControlsBarVisible: {
      transform: 'translateY(0)',
      opacity: 1
    },

    fullscreenControlsLeft: {
      display: 'flex',
      alignItems: 'center',
      gap: token.marginSM,
      flex: 1
    },

    fullscreenControlsCenter: {
      display: 'flex',
      alignItems: 'center',
      gap: token.marginLG,
      justifyContent: 'center',
      flex: '0 0 auto'
    },

    fullscreenControlsRight: {
      display: 'flex',
      alignItems: 'center',
      gap: token.marginSM,
      flex: 1,
      justifyContent: 'flex-end'
    },

    fullscreenControlGroup: {
      display: 'flex',
      alignItems: 'center',
      gap: token.marginXS
    },

    fullscreenControlBtn: {
      width: 40,
      height: 40,
      border: 'none',
      background: 'transparent',
      color: 'rgba(255, 255, 255, 0.8)',
      borderRadius: token.borderRadiusSM,
      transition: `all ${token.motionDurationMid} ${themeStyles.easing.apple}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      fontSize: token.fontSizeLG,
      flexShrink: 0
    },

    fullscreenControlBtnActive: {
      background: 'rgba(255, 255, 255, 0.2)',
      color: 'white'
    },

    fullscreenControlBtnHover: {
      background: 'rgba(255, 255, 255, 0.15)',
      color: 'white',
      transform: 'translateY(-1px)'
    },

    fullscreenPlayPauseBtn: {
      background: 'rgba(255, 255, 255, 0.1)',
      width: 50,
      height: 50,
      borderRadius: '50%',
      fontSize: token.fontSizeXL,
      border: 'none',
      color: 'rgba(255, 255, 255, 0.8)',
      transition: `all ${token.motionDurationMid} ${themeStyles.easing.apple}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      margin: `0 ${token.marginXS}px`
    },

    fullscreenCenterPlayButton: {
      position: 'absolute' as const,
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      zIndex: 5,
      pointerEvents: 'auto' as const
    },

    fullscreenCenterPlayBtn: {
      width: 80,
      height: 80,
      borderRadius: '50%',
      background: 'rgba(0, 0, 0, 0.8)',
      border: 'none',
      color: 'white',
      fontSize: token.fontSizeHeading1,
      transition: `all ${token.motionDurationSlow} ${themeStyles.easing.apple}`,
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
      cursor: 'pointer'
    },

    fullscreenTimeDisplay: {
      fontSize: token.fontSizeSM,
      fontWeight: 500,
      color: token.colorTextSecondary
    },

    fullscreenTimeText: {
      fontSize: token.fontSizeSM,
      fontWeight: 500,
      color: token.colorTextSecondary
    },

    fullscreenVolumeSliderPopup: {
      position: 'absolute' as const,
      bottom: 45,
      left: '50%',
      transform: 'translateX(-50%)',
      background: token.colorBgElevated,
      padding: `${token.paddingLG}px ${token.paddingMD}px`,
      borderRadius: token.borderRadiusLG,
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      gap: token.marginSM,
      minHeight: 120,
      boxShadow: themeStyles.appleCardShadow.heavy,
      border: `1px solid ${token.colorBorderSecondary}`,
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      zIndex: token.zIndexPopupBase // Use token zIndex instead of hardcoded value - 使用token中的zIndex而非硬编码值
    },

    fullscreenVolumeSliderVertical: {
      height: 80
    },

    fullscreenVolumeText: {
      color: token.colorTextSecondary,
      fontSize: token.fontSizeSM,
      fontWeight: 600,
      width: 36,
      textAlign: 'center' as const,
      lineHeight: 1,
      flexShrink: 0
    },

    fullscreenSettingsControl: {
      position: 'relative' as const
    },

    fullscreenSettingsPopup: {
      position: 'absolute' as const,
      bottom: 45,
      right: 0,
      background: token.colorBgElevated,
      borderRadius: token.borderRadiusLG,
      minWidth: 200,
      boxShadow: themeStyles.appleCardShadow.heavy,
      border: `1px solid ${token.colorBorderSecondary}`,
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      zIndex: token.zIndexPopupBase // Use token zIndex instead of hardcoded value - 使用token中的zIndex而非硬编码值
    },

    fullscreenSettingsContent: {
      padding: token.paddingLG
    },

    fullscreenSettingsTitle: {
      color: token.colorText,
      fontSize: token.fontSize,
      fontWeight: 600,
      marginBottom: token.marginMD,
      display: 'block'
    },

    fullscreenSettingsItem: {
      padding: `${token.paddingSM}px 0`,
      borderBottom: `1px solid ${token.colorBorderSecondary}`,
      cursor: 'pointer',
      transition: `all ${token.motionDurationMid} ${themeStyles.easing.apple}`,
      borderRadius: token.borderRadiusSM,
      margin: `${token.marginXXS}px 0`
    },

    fullscreenSettingsLabel: {
      color: token.colorTextSecondary,
      fontSize: token.fontSizeSM,
      transition: `all ${token.motionDurationMid} ${themeStyles.easing.apple}`
    },

    fullscreenPlaybackRateSelect: {
      width: 50,
      height: 30,
      fontSize: token.fontSizeSM
    },

    // Playback Rate Selector Styles - 播放速度选择器样式
    playbackRateButton: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '4px',
      width: '60px',
      height: '30px',
      fontSize: token.fontSizeSM,
      padding: '0 8px',
      border: `1px solid ${token.colorBorder}`,
      borderRadius: token.borderRadius,
      background: token.colorBgContainer,
      cursor: 'pointer',
      transition: `all ${token.motionDurationMid} ease`,
      flexShrink: 0,
      color: token.colorText
    },

    playbackRateButtonCompact: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '4px',
      width: '80px',
      height: '30px',
      fontSize: token.fontSizeSM,
      padding: '0 8px',
      border: `1px solid ${token.colorBorder}`,
      borderRadius: token.borderRadius,
      background: token.colorBgContainer,
      cursor: 'pointer',
      transition: `all ${token.motionDurationMid} ease`,
      flexShrink: 0,
      color: token.colorText
    },

    playbackRateButtonFullscreen: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '4px',
      width: '70px',
      height: '32px',
      fontSize: '12px',
      padding: '0 8px',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      borderRadius: '6px',
      background: 'rgba(0, 0, 0, 0.7)', // 全屏模式强制使用暗色背景
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      flexShrink: 0,
      color: 'rgba(255, 255, 255, 0.9)' // 全屏模式强制使用白色文字
    },

    playbackRatePopup: {
      position: 'fixed' as const,
      background: token.colorBgElevated,
      border: `1px solid ${token.colorBorderSecondary}`,
      borderRadius: token.borderRadiusLG,
      boxShadow: themeStyles.appleCardShadow.heavy,
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      zIndex: token.zIndexPopupBase, // Use token zIndex for popup layer - 使用token中的popup层级zIndex
      minWidth: '400px',
      maxWidth: '480px',
      padding: '12px 16px',
      color: token.colorText
    },

    playbackRatePopupFullscreen: {
      position: 'fixed' as const,
      background: 'rgba(20, 20, 20, 0.95)', // 全屏模式强制使用暗色背景
      border: '1px solid rgba(255, 255, 255, 0.1)', // 暗色边框
      borderRadius: token.borderRadiusLG,
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.8)', // 更深的阴影
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      zIndex: token.zIndexPopupBase, // Use token zIndex for popup layer - 使用token中的popup层级zIndex
      minWidth: '400px',
      maxWidth: '480px',
      padding: '12px 16px',
      color: 'rgba(255, 255, 255, 0.9)' // 全屏模式强制使用白色文字
    },

    playbackRateConfigSection: {
      marginBottom: token.marginSM
    },

    playbackRateConfigSectionTitle: {
      fontSize: token.fontSizeSM,
      fontWeight: 500,
      marginBottom: token.marginXS,
      color: token.colorTextSecondary
    },

    playbackRateConfigSectionTitleFullscreen: {
      fontSize: token.fontSizeSM,
      fontWeight: 500,
      marginBottom: token.marginXS,
      color: 'rgba(255, 255, 255, 0.7)'
    },

    playbackRateConfigGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: '6px'
    },

    playbackRateConfigItem: {
      padding: '6px 8px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      cursor: 'pointer',
      borderRadius: '4px',
      border: `1px solid ${token.colorBorder}`,
      background: token.colorBgContainer,
      transition: 'all 0.15s ease',
      minHeight: '32px',
      color: token.colorText
    },

    playbackRateConfigItemFullscreen: {
      padding: '6px 8px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      cursor: 'pointer',
      borderRadius: '4px',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      background: 'rgba(255, 255, 255, 0.05)',
      transition: 'all 0.15s ease',
      minHeight: '32px',
      color: 'rgba(255, 255, 255, 0.9)'
    },

    playbackRateConfigItemSelected: {
      border: `1px solid ${token.colorPrimary}`,
      background: token.colorPrimaryBg,
      color: token.colorText
    },

    playbackRateConfigItemSelectedFullscreen: {
      border: '1px solid rgba(255, 255, 255, 0.3)',
      background: 'rgba(255, 255, 255, 0.2)',
      color: 'rgba(255, 255, 255, 0.9)'
    },

    playbackRateConfigItemCurrent: {
      fontWeight: 600,
      color: token.colorPrimary
    },

    playbackRateConfigItemCurrentFullscreen: {
      fontWeight: 600,
      color: '#007AFF' // 即使在全屏模式也使用主色
    },

    playbackRateConfigItemText: {
      fontSize: token.fontSizeSM,
      fontWeight: 500,
      flex: 1,
      userSelect: 'none' as const,
      color: 'inherit'
    },

    playbackRateQuickSection: {
      marginTop: token.marginSM
    },

    playbackRateQuickSectionTitle: {
      fontSize: token.fontSizeSM,
      fontWeight: 500,
      marginBottom: token.marginXS,
      color: token.colorTextSecondary
    },

    playbackRateQuickSectionTitleFullscreen: {
      fontSize: token.fontSizeSM,
      fontWeight: 500,
      marginBottom: token.marginXS,
      color: 'rgba(255, 255, 255, 0.7)'
    },

    playbackRateQuickButton: {
      height: '28px',
      fontSize: '12px',
      padding: '0 12px',
      borderRadius: '6px',
      fontWeight: 'normal'
    },

    playbackRateQuickButtonActive: {
      fontWeight: 600
    },

    playbackRateDivider: {
      height: '1px',
      background: token.colorBorderSecondary,
      margin: `0 0 ${token.marginSM}px`
    },

    playbackRateSpanText: {
      flex: 1,
      textAlign: 'center' as const,
      fontSize: '12px',
      color: token.colorText
    },

    playbackRateSpanTextFullscreen: {
      flex: 1,
      textAlign: 'center' as const,
      fontSize: '12px',
      color: 'rgba(255, 255, 255, 0.9)'
    },

    volumeControl: {
      position: 'relative' as const
    },

    volumeSliderPopup: {
      position: 'absolute' as const,
      bottom: 45,
      left: '50%',
      transform: 'translateX(-50%)',
      background: token.colorBgElevated,
      padding: `${token.paddingLG}px ${token.paddingMD}px`,
      borderRadius: token.borderRadiusLG,
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      gap: token.marginSM,
      minHeight: 120,
      boxShadow: themeStyles.appleCardShadow.heavy,
      border: `1px solid ${token.colorBorderSecondary}`,
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      zIndex: token.zIndexPopupBase // Use token zIndex instead of hardcoded value - 使用token中的zIndex而非硬编码值
    },

    volumeSliderVertical: {
      height: 80
    },

    volumeSliderHorizontal: {
      width: 150,
      position: 'relative' as const
    },

    volumeSliderHorizontalContainer: {
      position: 'absolute' as const,
      bottom: 45,
      left: '50%',
      transform: 'translateX(-50%)',
      display: 'flex',
      alignItems: 'center',
      gap: token.marginXS,
      background: token.colorBgElevated,
      padding: `${token.paddingXXS}px ${token.paddingXS}px`,
      borderRadius: token.borderRadiusSM,
      boxShadow: '0 2px 6px rgba(0, 0, 0, 0.12)',
      border: `1px solid ${token.colorBorder}`,
      width: 180,
      height: 32,
      boxSizing: 'border-box' as const,
      zIndex: token.zIndexPopupBase // Use token zIndex instead of hardcoded value - 使用token中的zIndex而非硬编码值
    },

    volumeSliderHorizontalTrack: {
      position: 'relative' as const,
      width: '100%',
      padding: `${token.marginSM}px 0`
    },

    volumeSliderKeyPoint: {
      position: 'absolute' as const,
      top: -2,
      width: 4,
      height: 4,
      borderRadius: '50%',
      background: token.colorTextQuaternary,
      cursor: 'pointer',
      transition: `all ${token.motionDurationMid} ${themeStyles.easing.apple}`,
      zIndex: 2,
      transform: 'translateX(-50%)'
    },

    volumeSliderKeyPointActive: {
      background: token.colorPrimary,
      width: 6,
      height: 6,
      transform: 'translateX(-50%)',
      boxShadow: `0 1px 3px rgba(${token.colorPrimary
        .slice(1)
        .match(/.{2}/g)
        ?.map((hex) => parseInt(hex, 16))
        .join(', ')}, 0.4)`
    },

    volumeSliderKeyPointLabel: {
      position: 'absolute' as const,
      top: -20,
      left: '50%',
      transform: 'translateX(-50%)',
      fontSize: 10,
      color: token.colorTextTertiary,
      fontWeight: 500,
      whiteSpace: 'nowrap' as const,
      pointerEvents: 'none' as const,
      opacity: 0,
      transition: `opacity ${token.motionDurationMid} ${themeStyles.easing.apple}`
    },

    customVolumeSlider: {
      position: 'relative' as const,
      width: 120,
      height: 16,
      cursor: 'pointer'
    },

    customVolumeSliderTrack: {
      position: 'absolute' as const,
      top: '50%',
      left: 0,
      right: 0,
      height: 3,
      background: token.colorFillSecondary,
      borderRadius: 1.5,
      transform: 'translateY(-50%)'
    },

    customVolumeSliderTrackFilled: {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      height: '100%',
      background: token.colorPrimary,
      borderRadius: 2,
      transition: `width ${token.motionDurationMid} ${themeStyles.easing.apple}`
    },

    customVolumeSliderHandle: {
      position: 'absolute' as const,
      top: '50%',
      width: 12,
      height: 12,
      background: token.colorPrimary,
      borderRadius: '50%',
      transform: 'translate(-50%, -50%)',
      cursor: 'grab',
      transition: `all ${token.motionDurationMid} ${themeStyles.easing.apple}`,
      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
      zIndex: 3
    },

    customVolumeSliderKeyPoint: {
      position: 'absolute' as const,
      top: '50%',
      width: 6,
      height: 6,
      background: token.colorTextSecondary,
      borderRadius: '50%',
      transform: 'translate(-50%, -50%)',
      zIndex: 2,
      cursor: 'pointer',
      transition: `all ${token.motionDurationMid} ${themeStyles.easing.apple}`
    },

    customVolumeSliderKeyPointActive: {
      width: 8,
      height: 8,
      background: token.colorPrimary,
      boxShadow: `0 0 0 2px ${token.colorBgContainer}`
    },

    subtitleModeControl: {
      position: 'relative' as const,
      display: 'flex',
      alignItems: 'center',
      gap: token.marginXXS
    },

    subtitleModeSelector: {
      position: 'absolute' as const,
      top: -200,
      left: 0,
      background: token.colorBgElevated,
      border: `1px solid ${token.colorBorderSecondary}`,
      borderRadius: token.borderRadiusLG,
      padding: token.paddingXS,
      minWidth: 120,
      boxShadow: themeStyles.appleCardShadow.heavy,
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      zIndex: token.zIndexPopupBase // Use token zIndex instead of hardcoded value - 使用token中的zIndex而非硬编码值
    },

    compactLayoutContainer: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: token.marginSM
    },

    // Medium width responsive styles (768px-840px)
    mediumWidthMainControls: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: token.marginXS,
      width: '100%'
    },

    mediumWidthLeftControls: {
      display: 'flex',
      alignItems: 'center',
      gap: token.marginXS,
      flex: '0 0 auto'
    },

    mediumWidthCenterControls: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: token.marginXS,
      flex: '1 1 auto'
    },

    mediumWidthRightControls: {
      display: 'flex',
      alignItems: 'center',
      gap: token.marginXS,
      flex: '0 0 auto'
    },

    mediumWidthSecondaryRow: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: token.marginXS,
      paddingTop: token.marginXS,
      borderTop: `1px solid ${token.colorBorderSecondary}`
    },

    mediumWidthPrimaryControls: {
      display: 'flex',
      justifyContent: 'flex-start',
      alignItems: 'center',
      width: '100%',
      minHeight: 40
    },

    mediumWidthSecondaryControls: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      width: '100%',
      paddingTop: token.marginXS,
      borderTop: `1px solid ${token.colorBorderSecondary}`
    },

    // Subtitle component styles
    subtitleContainer: {
      minWidth: `${COMPONENT_TOKENS.SUBTITLE.MIN_WIDTH_PERCENT}%`,
      minHeight: `${COMPONENT_TOKENS.SUBTITLE.MIN_HEIGHT_PERCENT}%`,
      maxWidth: `${COMPONENT_TOKENS.SUBTITLE.MAX_WIDTH_PERCENT}%`,
      maxHeight: `${COMPONENT_TOKENS.SUBTITLE.MAX_HEIGHT_PERCENT}%`,
      pointerEvents: 'auto' as const,
      position: 'absolute' as const,
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      justifyContent: 'center',
      gap: token.marginSM,
      transition: `all ${COMPONENT_TOKENS.SUBTITLE.TRANSITION_DURATION} ease-out`,
      borderRadius: token.borderRadiusLG,
      flexShrink: 0,
      flexGrow: 0,
      overflow: 'hidden',
      boxSizing: 'border-box' as const,
      border: '2px dashed transparent'
    },

    subtitleContainerHover: {
      border: `2px dashed ${COMPONENT_TOKENS.SUBTITLE.CONTAINER_BORDER_HOVER}`,
      boxShadow: COMPONENT_TOKENS.SUBTITLE.CONTAINER_SHADOW_HOVER
    },

    subtitleContainerDragging: {
      zIndex: 100,
      transform: 'rotate(1deg)',
      boxShadow: COMPONENT_TOKENS.SUBTITLE.CONTAINER_SHADOW_DRAGGING,
      border: `2px dashed ${COMPONENT_TOKENS.SUBTITLE.CONTAINER_BORDER_DRAGGING}`
    },

    subtitleContent: {
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center' as const,
      position: 'relative' as const,
      borderRadius: token.borderRadiusLG,
      background: 'transparent',
      backdropFilter: 'none',
      transition: `all ${COMPONENT_TOKENS.SUBTITLE.TRANSITION_DURATION}`,
      pointerEvents: 'auto' as const,
      boxSizing: 'border-box' as const,
      overflow: 'hidden'
    },

    subtitleContentTransparent: {
      background: 'transparent',
      backdropFilter: 'none',
      border: 'none',
      boxShadow: 'none'
    },

    subtitleContentBlur: {
      background: COMPONENT_TOKENS.SUBTITLE.BLUR_BACKGROUND,
      backdropFilter: 'blur(12px) saturate(180%)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
    },

    subtitleContentSolidBlack: {
      background: COMPONENT_TOKENS.SUBTITLE.SOLID_BLACK_BACKGROUND,
      border: '1px solid rgba(255, 255, 255, 0.05)',
      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
    },

    subtitleContentSolidGray: {
      background: COMPONENT_TOKENS.SUBTITLE.SOLID_GRAY_BACKGROUND,
      border: '1px solid rgba(255, 255, 255, 0.1)',
      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
    },

    subtitleText: {
      fontFamily: `-apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif`,
      lineHeight: COMPONENT_TOKENS.SUBTITLE.DEFAULT_LINE_HEIGHT,
      fontWeight: COMPONENT_TOKENS.SUBTITLE.DEFAULT_FONT_WEIGHT,
      color: COMPONENT_TOKENS.SUBTITLE.DEFAULT_COLOR,
      textShadow: COMPONENT_TOKENS.SUBTITLE.DEFAULT_TEXT_SHADOW,
      letterSpacing: '0.02em',
      display: 'inline-block',
      transition: `all ${COMPONENT_TOKENS.SUBTITLE.TRANSITION_DURATION}`,
      width: 'auto',
      whiteSpace: 'pre-wrap' as const,
      wordWrap: 'break-word' as const,
      overflowWrap: 'break-word' as const
    },

    subtitleTextEnglish: {
      fontWeight: COMPONENT_TOKENS.SUBTITLE.ENGLISH_FONT_WEIGHT,
      color: COMPONENT_TOKENS.SUBTITLE.DEFAULT_COLOR,
      textShadow: COMPONENT_TOKENS.SUBTITLE.ENGLISH_TEXT_SHADOW,
      lineHeight: COMPONENT_TOKENS.SUBTITLE.ENGLISH_LINE_HEIGHT
    },

    subtitleTextChinese: {
      fontWeight: COMPONENT_TOKENS.SUBTITLE.CHINESE_FONT_WEIGHT,
      color: COMPONENT_TOKENS.SUBTITLE.CHINESE_COLOR,
      textShadow: COMPONENT_TOKENS.SUBTITLE.CHINESE_TEXT_SHADOW,
      opacity: 0.95,
      lineHeight: COMPONENT_TOKENS.SUBTITLE.CHINESE_LINE_HEIGHT
    },

    subtitleTextHidden: {
      color: `${COMPONENT_TOKENS.SUBTITLE.HIDDEN_COLOR} !important`,
      fontStyle: 'italic',
      fontSize: '14px !important',
      fontWeight: '500 !important',
      textShadow: COMPONENT_TOKENS.SUBTITLE.CHINESE_TEXT_SHADOW,
      background: 'rgba(0, 0, 0, 0.4)',
      padding: `${token.paddingXS}px ${token.paddingMD}px`,
      borderRadius: token.borderRadiusSM,
      border: '1px dashed rgba(255, 255, 255, 0.3)',
      backdropFilter: 'blur(4px)'
    },

    subtitleWord: {
      cursor: 'default',
      padding: '1px 2px',
      borderRadius: '4px',
      transition: `all ${COMPONENT_TOKENS.SUBTITLE.TRANSITION_DURATION}`,
      position: 'relative' as const,
      display: 'inline-block',
      pointerEvents: 'auto' as const,
      zIndex: 2
    },

    subtitleWordHover: {
      backgroundColor: COMPONENT_TOKENS.SUBTITLE.WORD_HOVER_BACKGROUND,
      color: `${COMPONENT_TOKENS.SUBTITLE.HOVER_COLOR} !important`,
      transform: 'scale(1.05)',
      fontWeight: '700 !important',
      textShadow:
        '0 1px 3px rgba(0, 0, 0, 0.9), 0 2px 6px rgba(102, 126, 234, 0.6), 0 0 12px rgba(102, 126, 234, 0.4)',
      backdropFilter: 'blur(8px)'
    },

    subtitleWordClickable: {
      cursor: 'pointer',
      transition: `all ${COMPONENT_TOKENS.SUBTITLE.TRANSITION_DURATION}`,
      pointerEvents: 'auto' as const
    },

    subtitleWordClickableHover: {
      backgroundColor: `${COMPONENT_TOKENS.SUBTITLE.CLICKABLE_WORD_HOVER_BACKGROUND} !important`,
      color: `${COMPONENT_TOKENS.SUBTITLE.HOVER_COLOR} !important`,
      transform: 'scale(1.08) !important',
      fontWeight: '700 !important',
      textShadow:
        '0 1px 3px rgba(0, 0, 0, 0.9), 0 2px 6px rgba(102, 126, 234, 0.8), 0 0 16px rgba(102, 126, 234, 0.6) !important',
      backdropFilter: 'blur(12px)'
    },

    subtitleControls: {
      position: 'relative' as const,
      top: 'auto',
      right: 'auto',
      display: 'flex',
      gap: '2px',
      background: COMPONENT_TOKENS.SUBTITLE.CONTROL_BACKGROUND,
      backdropFilter: 'blur(12px)',
      borderRadius: token.borderRadiusSM,
      padding: '4px',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4), 0 2px 8px rgba(0, 0, 0, 0.6)',
      animation: `${COMPONENT_TOKENS.SUBTITLE.FADE_IN_DURATION} ease-out fadeInDown`,
      pointerEvents: 'auto' as const,
      zIndex: 60,
      minWidth: 'auto'
    },

    subtitleControlButton: {
      color: 'rgba(255, 255, 255, 0.9) !important',
      border: 'none !important',
      background: `${COMPONENT_TOKENS.SUBTITLE.CONTROL_BUTTON_BACKGROUND} !important`,
      borderRadius: `${token.borderRadiusSM}px !important`,
      display: 'flex !important',
      alignItems: 'center !important',
      justifyContent: 'center !important',
      transition: `all ${COMPONENT_TOKENS.SUBTITLE.TRANSITION_DURATION} !important`,
      fontWeight: 'bold !important'
    },

    subtitleControlButtonHover: {
      color: '#ffffff !important',
      background: `${COMPONENT_TOKENS.SUBTITLE.CONTROL_BUTTON_HOVER_BACKGROUND} !important`,
      transform: 'scale(1.1)',
      boxShadow: '0 2px 8px rgba(102, 126, 234, 0.4)'
    },

    subtitleControlButtonActive: {
      color: `${token.colorPrimary} !important`,
      background: `${COMPONENT_TOKENS.SUBTITLE.CONTROL_BUTTON_ACTIVE_BACKGROUND} !important`
    },

    subtitleControlButtonMaskActive: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: `linear-gradient(135deg, ${token.colorError}, ${token.colorErrorHover}) !important`,
      color: `${token.colorWhite} !important`,
      boxShadow: `0 0 15px ${token.colorError}CC, inset 0 1px 0 rgba(255, 255, 255, 0.4)`,
      border: `2px solid ${token.colorWhite} !important`,
      transform: 'scale(1.08)'
    },

    subtitleControlButtonMaskInactive: {
      background: 'rgba(255, 255, 255, 0.9) !important',
      color: `${token.colorPrimary} !important`,
      border: `2px solid ${token.colorPrimary}CC !important`,
      backdropFilter: 'blur(8px)',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
    },

    subtitleControlIcon: {
      lineHeight: 1,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: `${token.colorWhite}`,
      filter: 'drop-shadow(0 1px 3px rgba(0, 0, 0, 0.9))',
      textShadow: '0 1px 2px rgba(0, 0, 0, 1), 0 0 4px rgba(0, 0, 0, 0.8)'
    },

    subtitleControlIconMask: {
      lineHeight: 1,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: `${token.colorWhite}`,
      filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.8))',
      verticalAlign: 'middle',
      height: '100%',
      width: '100%'
    },

    subtitleResizeHandle: {
      position: 'absolute' as const,
      background: COMPONENT_TOKENS.SUBTITLE.RESIZE_HANDLE_COLOR,
      border: `2px solid ${COMPONENT_TOKENS.SUBTITLE.RESIZE_HANDLE_BORDER}`,
      zIndex: 50,
      transition: `all ${COMPONENT_TOKENS.SUBTITLE.TRANSITION_DURATION}`,
      pointerEvents: 'auto' as const
    },

    subtitleResizeHandleHover: {
      background: token.colorPrimary,
      transform: 'scale(1.1)',
      boxShadow: '0 2px 8px rgba(102, 126, 234, 0.4)'
    },

    subtitleMaskOverlay: {
      boxSizing: 'border-box' as const,
      transition: `all ${COMPONENT_TOKENS.SUBTITLE.FADE_IN_DURATION} ease-in-out`,
      animation: `${COMPONENT_TOKENS.SUBTITLE.FADE_IN_DURATION} ease-out fadeInMask`,
      boxShadow: 'none'
    },

    // Subtitle list item specific styles
    subtitleListItem: {
      padding: `${SPACING.SM}px ${SPACING.MD}px`,
      margin: `0 0 ${SPACING.XXS}px 0`,
      width: '100%',
      height: '60px',
      boxSizing: 'border-box' as const,
      display: 'flex',
      flexDirection: 'column' as const,
      justifyContent: 'center',
      position: 'relative' as const,
      overflow: 'hidden',
      cursor: 'pointer',
      userSelect: 'none' as const,
      border: 'none', // 移除边框，避免悬停时出现黑色边框 / Remove border to avoid black border on hover
      background: 'transparent',
      borderRadius: token.borderRadius,
      wordBreak: 'break-word' as const,
      overflowWrap: 'break-word' as const,
      hyphens: 'auto' as const,
      willChange: 'transform, background-color, box-shadow',
      contain: 'layout style paint' as const,
      transform: 'translateZ(0)',
      backfaceVisibility: 'hidden' as const,
      WebkitBackfaceVisibility: 'hidden' as const,
      WebkitFontSmoothing: 'antialiased' as const,
      MozOsxFontSmoothing: 'grayscale' as const,
      // 禁用 focus 样式 / Disable focus styles
      outline: 'none',
      transition: window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? `background-color ${ANIMATION_DURATION.FAST} ease, box-shadow ${ANIMATION_DURATION.FAST} ease, transform ${ANIMATION_DURATION.FAST} ease`
        : `background-color ${ANIMATION_DURATION.MEDIUM} ${EASING.STANDARD}, box-shadow ${ANIMATION_DURATION.MEDIUM} ${EASING.STANDARD}, transform ${ANIMATION_DURATION.MEDIUM} ${EASING.STANDARD}`
    },

    subtitleListItemActive: {
      backgroundColor: `${token.colorPrimary}18`,
      border: 'none', // 确保激活状态也没有边框
      boxShadow: `0 6px 20px ${token.colorPrimary}40, 0 3px 6px rgba(0, 0, 0, 0.12)`,
      transform: window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'translateZ(0)'
        : 'scale(1.02) translateZ(0)',
      zIndex: 3
    },

    subtitleListItemHover: {
      backgroundColor: `${token.colorPrimary}08`, // 减淡悬停背景色，使其更微妙
      border: 'none', // 确保悬停状态没有边框
      transform: window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'translateZ(0)'
        : 'translateY(-1px) scale(1.005) translateZ(0)', // 减少悬停动画幅度，使其更优雅
      boxShadow: `0 2px 8px ${token.colorPrimary}20, 0 1px 3px rgba(0, 0, 0, 0.06)`, // 减淡阴影
      zIndex: 2
    },

    subtitleListItemTime: {
      fontSize: FONT_SIZES.XS,
      fontWeight: 'normal'
    },

    subtitleListItemText: {
      fontSize: window.innerWidth <= 768 ? FONT_SIZES.XS : 13,
      lineHeight: 1.3,
      fontWeight: 'normal',
      overflow: 'hidden',
      display: '-webkit-box' as const,
      WebkitLineClamp: 2,
      WebkitBoxOrient: 'vertical' as const,
      textOverflow: 'ellipsis',
      whiteSpace: 'normal' as const,
      maxHeight: '2.6em'
    },

    subtitleListItemIndicator: {
      position: 'absolute' as const,
      left: 0,
      top: '50%',
      transform: 'translateY(-50%)',
      width: 4,
      height: '70%',
      background: `linear-gradient(to bottom, ${token.colorPrimary}, ${token.colorPrimary}99)`,
      boxShadow: `0 0 8px ${token.colorPrimary}66`
    },

    // Subtitle list container specific styles
    subtitleListContainer: {
      background: token.colorBgContainer,
      border: `1px solid ${token.colorBorderSecondary}`,
      borderRadius: token.borderRadiusLG,
      boxShadow: themeStyles.appleCardShadow.light,
      backdropFilter: 'blur(20px)',
      marginBottom: token.marginLG,
      height: 320,
      display: 'flex',
      flexDirection: 'column' as const,
      overflow: 'hidden'
    },

    subtitleListContainerNoHeader: {
      background: 'var(--darker-bg)',
      border: 'none',
      borderRadius: 0,
      boxShadow: 'none',
      backdropFilter: 'none',
      height: '100%',
      display: 'flex',
      flexDirection: 'column' as const,
      overflow: 'hidden',
      borderTop: '1px solid rgba(255, 255, 255, 0.04)'
    },

    subtitleListContent: {
      flex: 1,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column' as const,
      minHeight: 0,
      height: '100%',
      position: 'relative' as const
    },

    subtitleListHeader: {
      padding: `${token.paddingXS}px`,
      borderBottom: `1px solid ${token.colorBorderSecondary}`,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      background: 'linear-gradient(to bottom, rgba(255, 255, 255, 0.01) 0%, transparent 100%)'
    },

    subtitleListEmptyState: {
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      padding: token.paddingXL,
      color: token.colorTextTertiary,
      fontSize: token.fontSize
    },

    subtitleListVirtualizedList: {
      outline: 'none',
      overflowY: 'auto' as const,
      overflowX: 'hidden' as const,
      // Custom scrollbar styles through CSS variables
      scrollbarWidth: 'thin' as const,
      scrollbarColor: 'rgba(255, 255, 255, 0.2) transparent',
      // 确保虚拟列表内部元素不受其他样式影响
      border: 'none',
      background: 'transparent'
    },

    // Subtitle prompt specific styles
    subtitlePromptContainer: {
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      padding: `${token.paddingXL}px ${token.paddingLG}px`,
      gap: token.marginXL,
      background: `linear-gradient(135deg, 
        ${token.colorBgContainer}f8 0%, 
        ${token.colorBgLayout}f0 50%, 
        ${token.colorBgContainer}f8 100%)`,
      backdropFilter: 'blur(20px) saturate(180%)',
      WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      borderRadius: token.borderRadiusLG,
      position: 'relative' as const,
      overflow: 'hidden'
    },

    subtitlePromptAlert: {
      width: '100%',
      maxWidth: '400px',
      marginBottom: token.marginLG,
      background: `linear-gradient(135deg, 
        ${token.colorWarningBg}f0 0%, 
        ${token.colorWarningBgHover}e0 100%)`,
      border: `1px solid ${token.colorWarningBorder}60`,
      borderRadius: token.borderRadiusLG,
      boxShadow: `0 8px 32px ${token.colorWarning}20, 
                  0 4px 16px rgba(0, 0, 0, 0.08)`,
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      transition: `all ${token.motionDurationMid} ${token.motionEaseInOut}`
    },

    subtitlePromptButtonContainer: {
      display: 'flex',
      gap: token.marginMD,
      flexDirection: 'column' as const,
      width: '100%',
      maxWidth: '320px',
      alignItems: 'stretch'
    },

    subtitlePromptPrimaryButton: {
      width: '100%',
      height: '56px',
      fontSize: token.fontSizeLG,
      fontWeight: 600,
      borderRadius: token.borderRadiusLG,
      border: 'none',
      background: `linear-gradient(135deg, 
        ${token.colorPrimary} 0%, 
        ${token.colorPrimaryHover} 50%, 
        ${token.colorPrimary} 100%)`,
      color: token.colorWhite,
      boxShadow: `0 8px 24px ${token.colorPrimary}40, 
                  0 4px 12px rgba(0, 0, 0, 0.15)`,
      transition: `all ${token.motionDurationMid} ${token.motionEaseInOut}`,
      cursor: 'pointer',
      position: 'relative' as const,
      overflow: 'hidden'
    },

    subtitlePromptSecondaryButton: {
      width: '100%',
      height: '48px',
      fontSize: token.fontSize,
      fontWeight: 500,
      borderRadius: token.borderRadius,
      background: 'transparent',
      border: `1px solid ${token.colorBorderSecondary}80`,
      color: token.colorTextSecondary,
      transition: `all ${token.motionDurationMid} ${token.motionEaseInOut}`,
      cursor: 'pointer',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)'
    },

    subtitlePromptSupportText: {
      fontSize: token.fontSizeSM,
      color: token.colorTextTertiary,
      textAlign: 'center' as const,
      lineHeight: 1.6,
      maxWidth: '280px',
      padding: `${token.paddingSM}px ${token.paddingMD}px`,
      background: `${token.colorFillQuaternary}40`,
      borderRadius: token.borderRadius,
      border: `1px solid ${token.colorBorderSecondary}40`,
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      fontFamily: token.fontFamilyCode || 'monospace'
    }
  }
}

/**
 * Builds the theme utils object
 */
function buildUtils(): ThemeUtils {
  return {
    // 生成海报占位符背景
    generatePosterBackground: (fileName: string): string => {
      const colors = [
        themeStyles.gradients.primary,
        themeStyles.gradients.success,
        themeStyles.gradients.warning,
        themeStyles.gradients.error,
        'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)'
      ]
      const index = fileName.length % colors.length
      return colors[index]
    },

    // 格式化时间差
    formatTimeAgo: (timestamp: number): string => {
      const now = Date.now()
      const diff = now - timestamp
      const minutes = Math.floor(diff / (1000 * 60))
      const hours = Math.floor(diff / (1000 * 60 * 60))
      const days = Math.floor(diff / (1000 * 60 * 60 * 24))

      if (minutes < 1) return '刚刚'
      if (minutes < 60) return `${minutes}分钟前`
      if (hours < 24) return `${hours}小时前`
      if (days < 7) return `${days}天前`
      return new Date(timestamp).toLocaleDateString()
    },

    // 颜色工具函数
    hexToRgba: (hex: string, alpha: number = 1): string => {
      const result = hex.slice(1).match(/.{2}/g)
      if (!result) return hex
      const [r, g, b] = result.map((x) => parseInt(x, 16))
      return `rgba(${r}, ${g}, ${b}, ${alpha})`
    },

    // 创建悬停样式
    createHoverStyle: (
      baseStyle: CSSProperties,
      hoverStyle: CSSProperties
    ): { base: CSSProperties; hover: CSSProperties } => {
      return {
        base: baseStyle,
        hover: hoverStyle
      }
    }
  }
}

/**
 * Provides a unified React hook for accessing theme tokens, predefined style objects, and utility functions for consistent UI theming.
 *
 * The returned object includes:
 * - `token`: The current Ant Design theme token.
 * - `styles`: A comprehensive set of reusable CSS-in-JS style objects for various UI components and states.
 * - `utils`: Utility functions for color conversion, time formatting, hover style creation, and poster background generation.
 *
 * @returns An object containing theme tokens, style definitions, and theme-related utility functions for use throughout the application.
 */
export function useTheme(): UseThemeReturn {
  const { token } = theme.useToken()

  const styles = useMemo(() => buildStyles(token), [token])
  const utils = useMemo(() => buildUtils(), [])

  return { token, styles, utils }
}

export default useTheme
