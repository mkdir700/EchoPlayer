import { theme } from 'antd'
import { themeStyles } from '@renderer/styles/theme'
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
  volumeText: CSSProperties
  videoSettingsControl: CSSProperties
  videoSettingsPopup: CSSProperties
  videoSettingsContent: CSSProperties
  videoSettingsTitle: CSSProperties
  videoSettingsItem: CSSProperties
  videoSettingsLabel: CSSProperties
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
 * 自定义主题 Hook
 * 提供统一的主题访问接口，封装常用的样式组合
 */
export function useTheme(): UseThemeReturn {
  const { token } = theme.useToken()

  return {
    // 原始 token
    token,

    // 预定义的样式组合
    styles: {
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
        padding: `${token.padding}px`,
        background: token.colorBgLayout,
        minHeight: 'fit-content'
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
        gap: token.marginSM,
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
        zIndex: 1000
      },

      playbackRateControl: {
        position: 'relative' as const
      },

      playbackRateSelect: {
        width: 50,
        height: 30,
        fontSize: token.fontSizeSM
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
        zIndex: 1000
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
        zIndex: 1000
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

      volumeText: {
        color: token.colorTextSecondary,
        fontSize: token.fontSizeSM,
        fontWeight: 600,
        width: 36,
        textAlign: 'center' as const,
        lineHeight: 1,
        flexShrink: 0
      },

      videoSettingsControl: {
        position: 'relative' as const
      },

      videoSettingsPopup: {
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
        zIndex: 1000
      },

      videoSettingsContent: {
        padding: token.paddingLG
      },

      videoSettingsTitle: {
        color: token.colorText,
        fontSize: token.fontSize,
        fontWeight: 600,
        marginBottom: token.marginMD,
        display: 'block'
      },

      videoSettingsItem: {
        padding: `${token.paddingSM}px 0`,
        borderBottom: `1px solid ${token.colorBorderSecondary}`,
        cursor: 'pointer',
        transition: `all ${token.motionDurationMid} ${themeStyles.easing.apple}`,
        borderRadius: token.borderRadiusSM,
        margin: `${token.marginXXS}px 0`
      },

      videoSettingsLabel: {
        color: token.colorTextSecondary,
        fontSize: token.fontSizeSM,
        transition: `all ${token.motionDurationMid} ${themeStyles.easing.apple}`
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
        zIndex: 1000
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
      }
    },

    // 工具函数
    utils: {
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
}

export default useTheme
