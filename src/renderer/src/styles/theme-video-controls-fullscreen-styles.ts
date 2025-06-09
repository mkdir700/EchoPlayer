import type { GlobalToken } from 'antd'
import { themeStyles } from './theme'
import type { ThemeStyles } from '@renderer/types/theme'

/**
 * Build page-level styles including containers, cards, buttons, and basic UI components
 * 构建页面级样式，包括容器、卡片、按钮和基础UI组件
 */
export function buildVideoControlsFullscreenStyles(
  token: GlobalToken
): Pick<
  ThemeStyles,
  | 'fullscreenContainer'
  | 'fullscreenControlsBar'
  | 'fullscreenControlsBarVisible'
  | 'fullscreenControlsLeft'
  | 'fullscreenControlsCenter'
  | 'fullscreenControlsRight'
  | 'fullscreenControlGroup'
  | 'fullscreenControlBtn'
  | 'fullscreenControlBtnActive'
  | 'fullscreenControlBtnHover'
  | 'fullscreenPlayPauseBtn'
  | 'fullscreenCenterPlayButton'
  | 'fullscreenCenterPlayBtn'
  | 'fullscreenTimeDisplay'
  | 'fullscreenTimeText'
  | 'fullscreenVolumeSliderPopup'
  | 'fullscreenVolumeSliderVertical'
  | 'fullscreenVolumeText'
  | 'fullscreenSettingsControl'
  | 'fullscreenSettingsPopup'
  | 'fullscreenSettingsContent'
  | 'fullscreenSettingsTitle'
  | 'fullscreenSettingsItem'
  | 'fullscreenSettingsLabel'
  | 'fullscreenPlaybackRateSelect'
  | 'playbackRateButtonFullscreen'
  | 'playbackRatePopupFullscreen'
  | 'playbackRateConfigSectionTitleFullscreen'
  | 'playbackRateConfigItemFullscreen'
  | 'playbackRateConfigItemCurrentFullscreen'
  | 'playbackRateQuickSectionTitleFullscreen'
  | 'playbackRateSpanTextFullscreen'
  | 'playbackRateConfigItemSelectedFullscreen'
> {
  return {
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

    playbackRateConfigSectionTitleFullscreen: {
      fontSize: token.fontSizeSM,
      fontWeight: 500,
      marginBottom: token.marginXS,
      color: 'rgba(255, 255, 255, 0.7)'
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

    playbackRateConfigItemCurrentFullscreen: {
      fontWeight: 600,
      color: '#007AFF' // 即使在全屏模式也使用主色
    },

    playbackRateQuickSectionTitleFullscreen: {
      fontSize: token.fontSizeSM,
      fontWeight: 500,
      marginBottom: token.marginXS,
      color: 'rgba(255, 255, 255, 0.7)'
    },

    playbackRateSpanTextFullscreen: {
      flex: 1,
      textAlign: 'center' as const,
      fontSize: '12px',
      color: 'rgba(255, 255, 255, 0.9)'
    },

    playbackRateConfigItemSelectedFullscreen: {
      border: '1px solid rgba(255, 255, 255, 0.3)',
      background: 'rgba(255, 255, 255, 0.2)',
      color: 'rgba(255, 255, 255, 0.9)'
    }
  }
}
