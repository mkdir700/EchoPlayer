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
