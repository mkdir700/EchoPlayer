import type { GlobalToken } from 'antd'
import { themeStyles } from './theme'
import type { ThemeStyles } from '@renderer/types/theme'

/**
 * Build page-level styles including containers, cards, buttons, and basic UI components
 * 构建页面级样式，包括容器、卡片、按钮和基础UI组件
 */
export function buildPlayPageStyles(
  token: GlobalToken
): Pick<
  ThemeStyles,
  | 'playPageContainer'
  | 'playPageContent'
  | 'playPageSplitter'
  | 'mainContentArea'
  | 'videoPlayerSection'
  | 'sidebarSection'
  | 'sidebarDivider'
  | 'playPageGlassPanel'
  | 'videoSectionContainer'
  | 'immersiveContainer'
> {
  return {
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
    }
  }
}
