import type { ThemeConfig } from 'antd'

// 苹果设计风格的主题配置
export const appleTheme: ThemeConfig = {
  // 开启 CSS 变量模式
  cssVar: true,
  // 关闭 hash 以减小样式体积
  hashed: false,

  token: {
    // 基础色彩
    colorPrimary: '#007AFF', // 苹果蓝
    colorSuccess: '#34C759', // 苹果绿
    colorWarning: '#FF9500', // 苹果橙
    colorError: '#FF3B30', // 苹果红
    colorInfo: '#5AC8FA', // 苹果浅蓝

    // 圆角
    borderRadius: 8,
    borderRadiusLG: 12,
    borderRadiusSM: 6,

    // 字体
    fontFamily: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif`,
    fontSizeHeading1: 32,
    fontSizeHeading2: 24,
    fontSizeHeading3: 20,
    fontSizeHeading4: 18,
    fontSize: 16,
    fontSizeLG: 18,
    fontSizeSM: 14,

    // 间距
    padding: 16,
    paddingLG: 24,
    paddingXL: 32,
    paddingSM: 12,
    paddingXS: 8,
    paddingXXS: 4,

    margin: 16,
    marginLG: 24,
    marginXL: 32,
    marginSM: 12,
    marginXS: 8,
    marginXXS: 4,

    // 阴影 - 苹果风格的柔和阴影
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
    boxShadowSecondary: '0 4px 16px rgba(0, 0, 0, 0.08)',
    boxShadowTertiary: '0 8px 24px rgba(0, 0, 0, 0.12)',

    // 背景色
    colorBgContainer: '#ffffff',
    colorBgLayout: '#f8f9fa',
    colorBgElevated: '#ffffff',

    // 文字颜色
    colorText: '#1d1d1f',
    colorTextSecondary: '#86868b',
    colorTextTertiary: '#a1a1a6',
    colorTextDescription: '#86868b',

    // 边框
    colorBorder: '#e5e5e7',
    colorBorderSecondary: '#f2f2f7',

    // 动画
    motionDurationFast: '0.1s',
    motionDurationMid: '0.2s',
    motionDurationSlow: '0.3s',
    motionEaseInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    motionEaseOut: 'cubic-bezier(0.0, 0, 0.2, 1)'
  },

  components: {
    // Layout 组件配置
    Layout: {
      headerBg: 'rgba(255, 255, 255, 0.8)',
      headerHeight: 64,
      headerPadding: '0 24px',
      bodyBg: '#ffffff'
    },

    // Button 组件配置
    Button: {
      borderRadius: 8,
      controlHeight: 40,
      controlHeightLG: 48,
      controlHeightSM: 32,
      fontWeight: 600,
      primaryShadow: '0 4px 16px rgba(0, 122, 255, 0.3)'
    },

    // Card 组件配置
    Card: {
      borderRadiusLG: 12,
      headerBg: 'transparent',
      headerHeight: 48,
      actionsBg: 'transparent',
      paddingLG: 24
    },

    // Menu 组件配置
    Menu: {
      borderRadius: 8,
      itemBorderRadius: 6,
      itemHeight: 40,
      itemPaddingInline: 12,
      horizontalItemSelectedBg: 'rgba(0, 122, 255, 0.1)',
      horizontalItemSelectedColor: '#007AFF'
    },

    // Modal 组件配置
    Modal: {
      borderRadiusLG: 16,
      headerBg: 'transparent',
      contentBg: 'rgba(255, 255, 255, 0.95)',
      titleFontSize: 20,
      titleLineHeight: 1.4
    },

    // Typography 组件配置
    Typography: {
      titleMarginTop: 0,
      titleMarginBottom: 16,
      fontWeightStrong: 600
    },

    // Empty 组件配置
    Empty: {
      colorTextDisabled: '#a1a1a6'
    }
  },

  algorithm: undefined // 使用默认算法
}

// 暗色主题配置（可选）
export const appleDarkTheme: ThemeConfig = {
  ...appleTheme,
  token: {
    ...appleTheme.token,
    // 暗色模式的颜色调整
    colorBgContainer: '#1c1c1e',
    colorBgLayout: '#000000',
    colorBgElevated: '#2c2c2e',

    colorText: '#ffffff',
    colorTextSecondary: '#8e8e93',
    colorTextTertiary: '#636366',
    colorTextDescription: '#8e8e93',

    colorBorder: '#38383a',
    colorBorderSecondary: '#2c2c2e',

    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
    boxShadowSecondary: '0 4px 16px rgba(0, 0, 0, 0.4)',
    boxShadowTertiary: '0 8px 24px rgba(0, 0, 0, 0.5)'
  },
  components: {
    ...appleTheme.components,
    Layout: {
      ...appleTheme.components?.Layout,
      headerBg: 'rgba(28, 28, 30, 0.8)',
      bodyBg: '#1c1c1e'
    },
    Modal: {
      ...appleTheme.components?.Modal,
      contentBg: 'rgba(28, 28, 30, 0.95)'
    }
  }
}

// 主题相关的样式常量
export const themeStyles = {
  // 高斯模糊效果
  glassMorphism: {
    backdropFilter: 'blur(20px) saturate(180%)',
    WebkitBackdropFilter: 'blur(20px) saturate(180%)'
  },

  // 苹果风格的卡片阴影
  appleCardShadow: {
    light: '0 2px 8px rgba(0, 0, 0, 0.06)',
    medium: '0 4px 16px rgba(0, 0, 0, 0.08)',
    heavy: '0 8px 24px rgba(0, 0, 0, 0.12)'
  },

  // 渐变色
  gradients: {
    primary: 'linear-gradient(135deg, #007AFF, #5AC8FA)',
    success: 'linear-gradient(135deg, #34C759, #30D158)',
    warning: 'linear-gradient(135deg, #FF9500, #FFAD0A)',
    error: 'linear-gradient(135deg, #FF3B30, #FF453A)'
  },

  // 动画缓动
  easing: {
    apple: 'cubic-bezier(0.4, 0, 0.2, 1)',
    appleSpring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)'
  }
}

export default appleTheme
