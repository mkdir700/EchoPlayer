import type { GlobalToken } from 'antd'
import { COMPONENT_TOKENS, themeStyles } from './theme'
import type { ThemeStyles } from '@renderer/types/theme'
import { CSSProperties } from 'react'

/**
 * Build page-level styles including containers, cards, buttons, and basic UI components
 * 构建页面级样式，包括容器、卡片、按钮和基础UI组件
 */
export function buildHorizontalNavigationStyles(
  token: GlobalToken
): Pick<
  ThemeStyles,
  | 'horizontalNavContainer'
  | 'horizontalNavItem'
  | 'horizontalNavItemActive'
  | 'horizontalNavItemHover'
  | 'horizontalNavIcon'
  | 'horizontalNavLabel'
> {
  return {
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
      '::WebkitScrollbar': {
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
    }
  }
}
