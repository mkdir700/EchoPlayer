import type { GlobalToken } from 'antd'
import { themeStyles } from './theme'
import type { ThemeStyles } from '@renderer/types/theme'

/**
 * Build page-level styles including containers, cards, buttons, and basic UI components
 * 构建页面级样式，包括容器、卡片、按钮和基础UI组件
 */
export function buildPlayPageHeaderStyles(
  token: GlobalToken
): Pick<
  ThemeStyles,
  | 'playPageHeader'
  | 'playPageHeaderBackground'
  | 'playPageHeaderLeft'
  | 'playPageBackButton'
  | 'playPageHeaderCenter'
  | 'playPageVideoInfo'
  | 'playPageVideoIcon'
  | 'playPageVideoDetails'
  | 'playPageVideoTitle'
  | 'playPageVideoStatus'
  | 'playPageHeaderRight'
> {
  return {
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
      zIndex: token.zIndexPopupBase // Use token zIndex instead of hardcoded value - 使用token中的zIndex而非硬编码值
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
    }
  }
}
