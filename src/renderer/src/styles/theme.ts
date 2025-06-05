import type { ThemeConfig } from 'antd'

/**
 * Design Tokens - 设计令牌常量
 *
 * 为了保持设计系统的一致性，将常用的样式值定义为预设常量
 * 这些值与 Ant Design 的设计理念保持一致
 */

// Font Weight Tokens - 字体粗细
export const FONT_WEIGHTS = {
  // 常规文本
  REGULAR: 400,
  // 中等粗细 - 用于次要强调
  MEDIUM: 500,
  // 半粗体 - 用于强调文本、按钮、标题
  SEMIBOLD: 600,
  // 粗体 - 用于主要标题、品牌名称
  BOLD: 700,
  // 超粗体 - 用于大标题或特殊强调
  EXTRABOLD: 800
} as const

// Typography Scale - 字体大小比例
export const FONT_SIZES = {
  // 极小文本 - 12px
  XS: 12,
  // 小文本 - 14px (Ant Design 默认 fontSizeSM)
  SM: 14,
  // 基础文本 - 16px (Ant Design 默认 fontSize)
  BASE: 16,
  // 大文本 - 18px (Ant Design 默认 fontSizeLG)
  LG: 18,
  // 标题 - 20px
  XL: 20,
  // 大标题 - 24px
  XXL: 24,
  // 特大标题 - 32px
  XXXL: 32
} as const

// Spacing Scale - 间距比例
export const SPACING = {
  // 极小间距 - 4px
  XXS: 4,
  // 小间距 - 8px
  XS: 8,
  // 基础间距 - 12px
  SM: 12,
  // 中等间距 - 16px
  MD: 16,
  // 大间距 - 24px
  LG: 24,
  // 超大间距 - 32px
  XL: 32,
  // 特大间距 - 48px
  XXL: 48
} as const

// Border Radius - 圆角半径
export const BORDER_RADIUS = {
  // 小圆角 - 6px
  SM: 6,
  // 基础圆角 - 8px
  BASE: 8,
  // 大圆角 - 12px
  LG: 12,
  // 特大圆角 - 16px
  XL: 16,
  // 圆形 - 50%
  FULL: '50%'
} as const

// Z-Index Scale - 层级
export const Z_INDEX = {
  // 背景层
  BACKGROUND: -1,
  // 默认层
  DEFAULT: 0,
  // 悬浮层
  ELEVATED: 10,
  // 弹窗层
  MODAL: 1000,
  // 提示层
  TOOLTIP: 1500,
  // 最高层
  TOP: 9999
} as const

// Animation Duration - 动画持续时间
export const ANIMATION_DURATION = {
  // 快速动画 - 0.1s
  FAST: '0.1s',
  // 中等动画 - 0.2s
  MEDIUM: '0.2s',
  // 慢速动画 - 0.3s
  SLOW: '0.3s',
  // 超慢动画 - 0.5s
  SLOWER: '0.5s'
} as const

// Easing Functions - 缓动函数
export const EASING = {
  // 标准缓动
  STANDARD: 'cubic-bezier(0.4, 0, 0.2, 1)',
  // 入场缓动
  ENTER: 'cubic-bezier(0.0, 0, 0.2, 1)',
  // 退场缓动
  EXIT: 'cubic-bezier(0.4, 0, 1, 1)',
  // 苹果风格缓动
  APPLE: 'cubic-bezier(0.4, 0, 0.2, 1)',
  // 弹性缓动
  SPRING: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)'
} as const

// Shadow Levels - 阴影层级
export const SHADOWS = {
  // 轻微阴影
  SM: '0 2px 8px rgba(0, 0, 0, 0.06)',
  // 基础阴影
  BASE: '0 4px 16px rgba(0, 0, 0, 0.08)',
  // 强阴影
  LG: '0 8px 24px rgba(0, 0, 0, 0.12)',
  // 特强阴影
  XL: '0 16px 40px rgba(0, 0, 0, 0.16)'
} as const

// Component Specific Tokens - 组件特定令牌
export const COMPONENT_TOKENS = {
  // 头部组件
  HEADER: {
    HEIGHT: 64,
    TITLE_FONT_WEIGHT: FONT_WEIGHTS.BOLD,
    BRAND_FONT_WEIGHT: FONT_WEIGHTS.BOLD
  },

  // 按钮组件
  BUTTON: {
    PRIMARY_FONT_WEIGHT: FONT_WEIGHTS.SEMIBOLD,
    SECONDARY_FONT_WEIGHT: FONT_WEIGHTS.MEDIUM,
    GHOST_FONT_WEIGHT: FONT_WEIGHTS.MEDIUM
  },

  // 卡片组件
  CARD: {
    TITLE_FONT_WEIGHT: FONT_WEIGHTS.SEMIBOLD,
    SUBTITLE_FONT_WEIGHT: FONT_WEIGHTS.MEDIUM,
    BODY_FONT_WEIGHT: FONT_WEIGHTS.REGULAR
  },

  // 导航组件
  NAVIGATION: {
    ACTIVE_FONT_WEIGHT: FONT_WEIGHTS.SEMIBOLD,
    INACTIVE_FONT_WEIGHT: FONT_WEIGHTS.MEDIUM
  },

  // 字幕组件
  SUBTITLE: {
    // 字体相关
    ENGLISH_FONT_WEIGHT: FONT_WEIGHTS.BOLD,
    CHINESE_FONT_WEIGHT: FONT_WEIGHTS.MEDIUM,
    DEFAULT_FONT_WEIGHT: FONT_WEIGHTS.SEMIBOLD,

    // 字体大小比例（基于 base 字体大小的倍数）
    ENGLISH_FONT_SCALE: 1.75,
    CHINESE_FONT_SCALE: 1.4,
    DEFAULT_FONT_SCALE: 1.5,

    // 行高
    DEFAULT_LINE_HEIGHT: 1.6,
    ENGLISH_LINE_HEIGHT: 1.7,
    CHINESE_LINE_HEIGHT: 1.5,

    // 颜色
    DEFAULT_COLOR: '#ffffff',
    CHINESE_COLOR: '#f0f0f0',
    HOVER_COLOR: '#ffffff',
    HIDDEN_COLOR: 'rgba(255, 255, 255, 0.7)',

    // 背景颜色
    BLUR_BACKGROUND: 'rgba(0, 0, 0, 0.6)',
    SOLID_BLACK_BACKGROUND: 'rgba(0, 0, 0, 0.8)',
    SOLID_GRAY_BACKGROUND: 'rgba(128, 128, 128, 0.7)',

    // 边框颜色
    CONTAINER_BORDER_HOVER: 'rgba(102, 126, 234, 0.6)',
    CONTAINER_BORDER_DRAGGING: 'rgba(102, 126, 234, 0.8)',

    // 控制按钮
    CONTROL_BUTTON_SIZE_BASE: 32,
    CONTROL_ICON_SIZE_RATIO: 0.6,
    CONTROL_BACKGROUND: 'rgba(0, 0, 0, 0.9)',
    CONTROL_BUTTON_BACKGROUND: 'rgba(255, 255, 255, 0.1)',
    CONTROL_BUTTON_HOVER_BACKGROUND: 'rgba(102, 126, 234, 0.8)',
    CONTROL_BUTTON_ACTIVE_BACKGROUND: 'rgba(102, 126, 234, 0.2)',

    // 调整大小控制点
    RESIZE_HANDLE_COLOR: 'rgba(102, 126, 234, 0.8)',
    RESIZE_HANDLE_BORDER: 'rgba(255, 255, 255, 0.9)',

    // 单词交互
    WORD_HOVER_BACKGROUND: 'rgba(0, 122, 255, 0.6)',
    CLICKABLE_WORD_HOVER_BACKGROUND: 'rgba(0, 122, 255, 0.8)',

    // 阴影
    DEFAULT_TEXT_SHADOW:
      '0 1px 2px rgba(0, 0, 0, 0.8), 0 2px 4px rgba(0, 0, 0, 0.6), 0 0 8px rgba(0, 0, 0, 0.4)',
    ENGLISH_TEXT_SHADOW:
      '0 1px 3px rgba(0, 0, 0, 0.9), 0 2px 6px rgba(0, 0, 0, 0.7), 0 0 12px rgba(0, 0, 0, 0.5)',
    CHINESE_TEXT_SHADOW: '0 1px 2px rgba(0, 0, 0, 0.8), 0 2px 4px rgba(0, 0, 0, 0.6)',
    CONTAINER_SHADOW_HOVER: '0 0 0 1px rgba(102, 126, 234, 0.3)',
    CONTAINER_SHADOW_DRAGGING: '0 8px 32px rgba(0, 0, 0, 0.4)',

    // 尺寸限制
    MIN_WIDTH_PERCENT: 20,
    MIN_HEIGHT_PERCENT: 5,
    MAX_WIDTH_PERCENT: 100,
    MAX_HEIGHT_PERCENT: 50,

    // 动画
    TRANSITION_DURATION: ANIMATION_DURATION.MEDIUM,
    FADE_IN_DURATION: ANIMATION_DURATION.SLOW
  }
} as const

// Type definitions for better TypeScript support
export type FontWeight = (typeof FONT_WEIGHTS)[keyof typeof FONT_WEIGHTS]
export type FontSize = (typeof FONT_SIZES)[keyof typeof FONT_SIZES]
export type Spacing = (typeof SPACING)[keyof typeof SPACING]
export type BorderRadius = (typeof BORDER_RADIUS)[keyof typeof BORDER_RADIUS]
export type ZIndex = (typeof Z_INDEX)[keyof typeof Z_INDEX]
export type AnimationDuration = (typeof ANIMATION_DURATION)[keyof typeof ANIMATION_DURATION]
export type Easing = (typeof EASING)[keyof typeof EASING]
export type Shadow = (typeof SHADOWS)[keyof typeof SHADOWS]

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
    borderRadius: BORDER_RADIUS.BASE,
    borderRadiusLG: BORDER_RADIUS.LG,
    borderRadiusSM: BORDER_RADIUS.SM,

    // 字体
    fontFamily: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif`,
    fontSizeHeading1: FONT_SIZES.XXXL,
    fontSizeHeading2: FONT_SIZES.XXL,
    fontSizeHeading3: FONT_SIZES.XL,
    fontSizeHeading4: FONT_SIZES.LG,
    fontSize: FONT_SIZES.BASE,
    fontSizeLG: FONT_SIZES.LG,
    fontSizeSM: FONT_SIZES.SM,

    // 间距
    padding: SPACING.MD,
    paddingLG: SPACING.LG,
    paddingXL: SPACING.XL,
    paddingSM: SPACING.SM,
    paddingXS: SPACING.XS,
    paddingXXS: SPACING.XXS,

    margin: SPACING.MD,
    marginLG: SPACING.LG,
    marginXL: SPACING.XL,
    marginSM: SPACING.SM,
    marginXS: SPACING.XS,
    marginXXS: SPACING.XXS,

    // 阴影 - 苹果风格的柔和阴影
    boxShadow: SHADOWS.SM,
    boxShadowSecondary: SHADOWS.BASE,
    boxShadowTertiary: SHADOWS.LG,

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
    motionDurationFast: ANIMATION_DURATION.FAST,
    motionDurationMid: ANIMATION_DURATION.MEDIUM,
    motionDurationSlow: ANIMATION_DURATION.SLOW,
    motionEaseInOut: EASING.STANDARD,
    motionEaseOut: EASING.ENTER
  },

  components: {
    // Layout 组件配置
    Layout: {
      headerBg: 'rgba(255, 255, 255, 0.8)',
      headerHeight: COMPONENT_TOKENS.HEADER.HEIGHT,
      headerPadding: `0 ${SPACING.LG}px`,
      bodyBg: '#ffffff'
    },

    // Button 组件配置
    Button: {
      borderRadius: BORDER_RADIUS.BASE,
      controlHeight: 40,
      controlHeightLG: 48,
      controlHeightSM: 32,
      fontWeight: FONT_WEIGHTS.SEMIBOLD,
      primaryShadow: '0 4px 16px rgba(0, 122, 255, 0.3)'
    },

    // Card 组件配置
    Card: {
      borderRadiusLG: BORDER_RADIUS.LG,
      headerBg: 'transparent',
      headerHeight: 48,
      actionsBg: 'transparent',
      paddingLG: SPACING.LG
    },

    // Menu 组件配置
    Menu: {
      borderRadius: BORDER_RADIUS.BASE,
      itemBorderRadius: BORDER_RADIUS.SM,
      itemHeight: 40,
      itemPaddingInline: SPACING.SM,
      horizontalItemSelectedBg: 'rgba(0, 122, 255, 0.1)',
      horizontalItemSelectedColor: '#007AFF'
    },

    // Modal 组件配置
    Modal: {
      borderRadiusLG: BORDER_RADIUS.XL,
      headerBg: 'transparent',
      contentBg: 'rgba(255, 255, 255, 0.95)',
      titleFontSize: FONT_SIZES.XL,
      titleLineHeight: 1.4
    },

    // Typography 组件配置
    Typography: {
      titleMarginTop: 0,
      titleMarginBottom: SPACING.MD,
      fontWeightStrong: FONT_WEIGHTS.SEMIBOLD
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
    light: SHADOWS.SM,
    medium: SHADOWS.BASE,
    heavy: SHADOWS.LG
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
    apple: EASING.APPLE,
    appleSpring: EASING.SPRING
  }
}

export default appleTheme
