import type { GlobalToken } from 'antd'
import { themeStyles } from './theme'
import type { ThemeStyles } from '@renderer/types/theme'

/**
 * Build page-level styles including containers, cards, buttons, and basic UI components
 * 构建页面级样式，包括容器、卡片、按钮和基础UI组件
 */
export function buildVideoControlsStyles(
  token: GlobalToken
): Pick<
  ThemeStyles,
  | 'compactControlsContainer'
  | 'progressSection'
  | 'progressSlider'
  | 'timeDisplay'
  | 'timeText'
  | 'mainControls'
  | 'leftControls'
  | 'centerControls'
  | 'rightControls'
  | 'controlBtn'
  | 'controlBtnActive'
  | 'playPauseBtn'
  | 'controlPopup'
  | 'playbackRateControl'
  | 'playbackRateSelect'
  | 'playbackRateConfigItemCurrent'
  | 'playbackRateConfigItemText'
  | 'playbackRateQuickSection'
  | 'playbackRateQuickSectionTitle'
  | 'playbackRateQuickButton'
  | 'playbackRateQuickButtonActive'
  | 'playbackRateDivider'
  | 'playbackRateSpanText'
  | 'volumeControl'
  | 'volumeSliderPopup'
  | 'volumeSliderVertical'
  | 'volumeSliderHorizontal'
  | 'volumeSliderHorizontalContainer'
  | 'volumeSliderHorizontalTrack'
  | 'volumeSliderKeyPoint'
  | 'volumeSliderKeyPointActive'
  | 'volumeSliderKeyPointLabel'
  | 'customVolumeSlider'
  | 'customVolumeSliderTrack'
  | 'customVolumeSliderTrackFilled'
  | 'customVolumeSliderHandle'
  | 'customVolumeSliderKeyPoint'
  | 'customVolumeSliderKeyPointActive'
  | 'subtitleModeControl'
  | 'subtitleModeSelector'
  | 'playbackRateButton'
  | 'playbackRateButtonCompact'
  | 'playbackRatePopup'
  | 'playbackRateConfigSection'
  | 'playbackRateConfigSectionTitle'
  | 'playbackRateConfigGrid'
  | 'playbackRateConfigItem'
  | 'playbackRateConfigItemSelected'
> {
  return {
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
    playbackRateConfigItemCurrent: {
      fontWeight: 600,
      color: token.colorPrimary
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

    playbackRateConfigSection: {
      marginBottom: token.marginSM
    },

    playbackRateConfigSectionTitle: {
      fontSize: token.fontSizeSM,
      fontWeight: 500,
      marginBottom: token.marginXS,
      color: token.colorTextSecondary
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

    playbackRateConfigItemSelected: {
      border: `1px solid ${token.colorPrimary}`,
      background: token.colorPrimaryBg,
      color: token.colorText
    }
  }
}
