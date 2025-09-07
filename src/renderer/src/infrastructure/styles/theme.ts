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

// Glass Effect Tokens - 毛玻璃效果令牌
export const GLASS_EFFECT = {
  // 背景透明度
  BACKGROUND_ALPHA: {
    LIGHT: 0.8, // 亮色模式下的透明度
    MEDIUM: 0.6, // 中等透明度
    HEAVY: 0.4, // 强透明度
    SUBTLE: 0.95 // 微妙透明度
  },

  // 边框透明度
  BORDER_ALPHA: {
    LIGHT: 0.2, // 轻微边框
    MEDIUM: 0.3, // 中等边框
    HEAVY: 0.4, // 强边框
    SUBTLE: 0.1 // 微妙边框
  },

  // 模糊强度
  BLUR_STRENGTH: {
    LIGHT: 10, // 轻微模糊 - 10px
    MEDIUM: 20, // 中等模糊 - 20px (默认)
    HEAVY: 30, // 强模糊 - 30px
    SUBTLE: 6 // 微妙模糊 - 6px
  },

  // 饱和度增强
  SATURATION: {
    NONE: 100, // 无增强
    LIGHT: 120, // 轻微增强
    MEDIUM: 150, // 中等增强
    HEAVY: 180 // 强增强 (默认)
  }
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
  },

  // 进度条组件
  PROGRESS_BAR: {
    // 尺寸系统
    TRACK_HEIGHT_BASE: 4, // 基础轨道高度
    TRACK_HEIGHT_HOVER: 6, // 悬停轨道高度
    TRACK_HEIGHT_DRAG: 6, // 拖动轨道高度

    HANDLE_SIZE_BASE: 8, // 基础手柄尺寸
    HANDLE_SIZE_HOVER: 12, // 悬停手柄尺寸
    HANDLE_SIZE_DRAG: 14, // 拖动手柄尺寸

    // 边框系统
    HANDLE_BORDER_BASE: 1, // 基础边框宽度
    HANDLE_BORDER_HOVER: 1.5, // 悬停边框宽度
    HANDLE_BORDER_DRAG: 2, // 拖动边框宽度

    // 圆角系统
    TRACK_BORDER_RADIUS: BORDER_RADIUS.SM / 2, // 3px

    // 透明度系统
    HANDLE_GRADIENT_INNER: 0.9, // 内圈渐变透明度
    HANDLE_GRADIENT_OUTER: 0.7, // 外圈渐变透明度
    HANDLE_BORDER_ALPHA: 0.6, // 边框透明度
    HANDLE_BORDER_ALPHA_HOVER: 0.8, // 悬停边框透明度

    RAIL_OPACITY_BASE: 0.15, // 基础轨道透明度
    RAIL_OPACITY_HOVER: 0.3, // 悬停轨道透明度
    RAIL_OPACITY_DRAG: 0.4, // 拖动轨道透明度

    // 阴影系统
    HANDLE_SHADOW_BLUR_BASE: 4, // 基础光晕模糊半径
    HANDLE_SHADOW_BLUR_HOVER: 8, // 悬停光晕模糊半径
    HANDLE_SHADOW_BLUR_DRAG_1: 12, // 拖动光晕模糊半径1
    HANDLE_SHADOW_BLUR_DRAG_2: 24, // 拖动光晕模糊半径2

    HANDLE_SHADOW_OFFSET: 2, // 阴影偏移
    HANDLE_SHADOW_ALPHA_BASE: 0.4, // 基础阴影透明度
    HANDLE_SHADOW_ALPHA_HOVER: 0.6, // 悬停阴影透明度
    HANDLE_SHADOW_ALPHA_DRAG: 0.8, // 拖动阴影透明度

    TRACK_SHADOW_BLUR_HOVER: 8, // 轨道悬停光晕
    TRACK_SHADOW_BLUR_DRAG: 16, // 轨道拖动光晕

    // 动画系统
    TRANSITION_DURATION_BASE: ANIMATION_DURATION.MEDIUM, // 0.2s
    TRANSITION_DURATION_SLOW: '0.25s', // 慢速动画
    TRANSITION_EASING: EASING.STANDARD, // cubic-bezier(0.4, 0, 0.2, 1)

    // 缩放系统
    HANDLE_SCALE_HIDDEN: 0, // 隐藏时缩放
    HANDLE_SCALE_BASE: 0.8, // 基础缩放
    HANDLE_SCALE_HOVER: 1, // 悬停缩放
    HANDLE_SCALE_DRAG: 1.1, // 拖动缩放

    // 计算工具函数
    calculateHandleOffset: (handleSize: number, trackSize: number) => -(handleSize - trackSize) / 2
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
export type GlassBackgroundAlpha =
  (typeof GLASS_EFFECT.BACKGROUND_ALPHA)[keyof typeof GLASS_EFFECT.BACKGROUND_ALPHA]
export type GlassBorderAlpha =
  (typeof GLASS_EFFECT.BORDER_ALPHA)[keyof typeof GLASS_EFFECT.BORDER_ALPHA]
export type GlassBlurStrength =
  (typeof GLASS_EFFECT.BLUR_STRENGTH)[keyof typeof GLASS_EFFECT.BLUR_STRENGTH]
export type GlassSaturation = (typeof GLASS_EFFECT.SATURATION)[keyof typeof GLASS_EFFECT.SATURATION]

/**
 * Glass effect utility functions
 * 毛玻璃效果工具函数
 */
export const glassUtils = {
  /**
   * Create glass morphism style with custom parameters
   * 创建自定义参数的毛玻璃形态样式
   */
  createGlassMorphism: (
    blurStrength: GlassBlurStrength = GLASS_EFFECT.BLUR_STRENGTH.MEDIUM,
    saturation: GlassSaturation = GLASS_EFFECT.SATURATION.HEAVY
  ) => ({
    backdropFilter: `blur(${blurStrength}px) saturate(${saturation}%)`,
    WebkitBackdropFilter: `blur(${blurStrength}px) saturate(${saturation}%)`
  }),

  /**
   * Create glass effect background with theme-aware colors
   * 创建主题感知的毛玻璃效果背景
   */
  createGlassBackground: (
    baseColor: string,
    backgroundAlpha: GlassBackgroundAlpha = GLASS_EFFECT.BACKGROUND_ALPHA.LIGHT,
    borderAlpha: GlassBorderAlpha = GLASS_EFFECT.BORDER_ALPHA.LIGHT
  ) => {
    const hexToRgba = (hex: string, alpha: number) => {
      const r = parseInt(hex.slice(1, 3), 16)
      const g = parseInt(hex.slice(3, 5), 16)
      const b = parseInt(hex.slice(5, 7), 16)
      return `rgba(${r}, ${g}, ${b}, ${alpha})`
    }

    return {
      background: hexToRgba(baseColor, backgroundAlpha),
      border: `1px solid ${hexToRgba(baseColor, borderAlpha)}`
    }
  },

  /**
   * Create complete glass effect style
   * 创建完整的毛玻璃效果样式
   */
  createGlassEffect: (
    baseColor: string,
    variant: 'subtle' | 'light' | 'medium' | 'heavy' = 'light'
  ) => {
    const variantConfig = {
      subtle: {
        backgroundAlpha: GLASS_EFFECT.BACKGROUND_ALPHA.SUBTLE,
        borderAlpha: GLASS_EFFECT.BORDER_ALPHA.SUBTLE,
        blurStrength: GLASS_EFFECT.BLUR_STRENGTH.SUBTLE,
        saturation: GLASS_EFFECT.SATURATION.LIGHT
      },
      light: {
        backgroundAlpha: GLASS_EFFECT.BACKGROUND_ALPHA.LIGHT,
        borderAlpha: GLASS_EFFECT.BORDER_ALPHA.LIGHT,
        blurStrength: GLASS_EFFECT.BLUR_STRENGTH.LIGHT,
        saturation: GLASS_EFFECT.SATURATION.MEDIUM
      },
      medium: {
        backgroundAlpha: GLASS_EFFECT.BACKGROUND_ALPHA.MEDIUM,
        borderAlpha: GLASS_EFFECT.BORDER_ALPHA.MEDIUM,
        blurStrength: GLASS_EFFECT.BLUR_STRENGTH.MEDIUM,
        saturation: GLASS_EFFECT.SATURATION.HEAVY
      },
      heavy: {
        backgroundAlpha: GLASS_EFFECT.BACKGROUND_ALPHA.HEAVY,
        borderAlpha: GLASS_EFFECT.BORDER_ALPHA.HEAVY,
        blurStrength: GLASS_EFFECT.BLUR_STRENGTH.HEAVY,
        saturation: GLASS_EFFECT.SATURATION.HEAVY
      }
    }

    const config = variantConfig[variant]

    return {
      ...glassUtils.createGlassMorphism(config.blurStrength, config.saturation),
      ...glassUtils.createGlassBackground(baseColor, config.backgroundAlpha, config.borderAlpha)
    }
  }
} as const

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

    // 扩展色彩 token - 用于字幕控制
    colorErrorHover: '#FF453A', // 错误色悬停态
    colorPrimaryHover: '#0051D0', // 主色悬停态
    colorWhite: '#ffffff', // 白色常量

    // 圆角
    borderRadius: BORDER_RADIUS.BASE,
    borderRadiusLG: BORDER_RADIUS.LG,
    borderRadiusSM: BORDER_RADIUS.SM,

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

    // 扩展色彩 token - 暗色模式下的字幕控制
    colorErrorHover: '#FF453A', // 暗色模式下的错误色悬停态
    colorPrimaryHover: '#0A84FF', // 暗色模式下的主色悬停态
    colorWhite: '#ffffff', // 保持一致的白色

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

/**
 * 主题感知的毛玻璃效果生成函数
 * Theme-aware glass effect generation functions
 */
export const createThemeAwareGlassEffect = {
  /**
   * 从 Ant Design token 生成毛玻璃效果
   * Generate glass effect from Ant Design tokens
   */
  fromToken: (token: any, variant: 'subtle' | 'light' | 'medium' | 'heavy' = 'light') => {
    return glassUtils.createGlassEffect(token.colorBgContainer, variant)
  },

  /**
   * 为亮色主题生成毛玻璃效果
   * Generate glass effect for light theme
   */
  forLightTheme: (variant: 'subtle' | 'light' | 'medium' | 'heavy' = 'light') => {
    return glassUtils.createGlassEffect('#ffffff', variant)
  },

  /**
   * 为暗色主题生成毛玻璃效果
   * Generate glass effect for dark theme
   */
  forDarkTheme: (variant: 'subtle' | 'light' | 'medium' | 'heavy' = 'medium') => {
    return glassUtils.createGlassEffect('#1c1c1e', variant)
  },

  /**
   * 自动检测主题模式并生成合适的毛玻璃效果
   * Auto-detect theme mode and generate appropriate glass effect
   */
  auto: (token: any, variant?: 'subtle' | 'light' | 'medium' | 'heavy') => {
    // 通过背景色亮度判断是否为暗色主题
    const isDarkTheme =
      token.colorBgContainer === '#1c1c1e' ||
      token.colorBgContainer === '#000000' ||
      token.colorBgLayout === '#000000'

    const defaultVariant = isDarkTheme ? 'medium' : 'light'
    const selectedVariant = variant || defaultVariant

    return glassUtils.createGlassEffect(token.colorBgContainer, selectedVariant)
  }
}

// 主题相关的样式常量
export const themeStyles = {
  // 高斯模糊效果 (基础版本，推荐使用 glassUtils)
  glassMorphism: glassUtils.createGlassMorphism(),

  // 毛玻璃效果变体 - 使用token系统
  glassEffect: {
    // 默认轻度毛玻璃效果
    light: glassUtils.createGlassEffect('#ffffff', 'light'),
    // 中等毛玻璃效果
    medium: glassUtils.createGlassEffect('#ffffff', 'medium'),
    // 重度毛玻璃效果
    heavy: glassUtils.createGlassEffect('#ffffff', 'heavy'),
    // 微妙毛玻璃效果
    subtle: glassUtils.createGlassEffect('#ffffff', 'subtle')
  },

  // 主题感知的毛玻璃效果生成器
  createThemeGlassEffect: (baseColor: string, isDark = false) => {
    const variant = isDark ? 'medium' : 'light'
    return glassUtils.createGlassEffect(baseColor, variant)
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
