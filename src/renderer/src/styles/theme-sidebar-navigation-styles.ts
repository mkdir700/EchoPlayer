import { CSSProperties } from 'react'
import { themeStyles } from './theme'
import { GlobalToken } from 'antd/es/theme/interface'

interface SidebarNavigationStylesReturn {
  // Navigation specific styles
  sidebarItem: CSSProperties
  sidebarItemActive: CSSProperties
  sidebarIcon: CSSProperties
  sidebarLabel: CSSProperties
}

export function buildSidebarNavigationStyles(token: GlobalToken): SidebarNavigationStylesReturn {
  return {
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
    }
  }
}
