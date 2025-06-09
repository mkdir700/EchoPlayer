import type { GlobalToken } from 'antd'
import { themeStyles } from './theme'
import type { ThemeStyles } from '@renderer/types/theme'

/**
 * Build page-level styles including containers, cards, buttons, and basic UI components
 * 构建页面级样式，包括容器、卡片、按钮和基础UI组件
 */
export function buildPageStyles(
  token: GlobalToken
): Pick<
  ThemeStyles,
  | 'pageContainer'
  | 'cardContainer'
  | 'cardHover'
  | 'glassEffect'
  | 'gradientText'
  | 'primaryButton'
  | 'secondaryButton'
  | 'emptyContainer'
  | 'pageTitle'
  | 'pageSubtitle'
  | 'sectionTitle'
  | 'videoPoster'
  | 'playOverlay'
  | 'durationBadge'
  | 'deleteButton'
> {
  return {
    // 页面容器样式
    pageContainer: {
      minHeight: '100vh',
      background: `linear-gradient(180deg, ${token.colorBgContainer} 0%, ${token.colorBgLayout} 100%)`,
      padding: token.paddingLG,
      overflow: 'auto',
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
    }
  }
}
