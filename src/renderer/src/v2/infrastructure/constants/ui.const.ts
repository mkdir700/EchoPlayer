import { AnimationConfig, LayoutDimensions, ResponsiveBreakpoints, ZIndexLevels } from '../types'

// 布局尺寸常量 / Layout Dimensions Constants
export const LAYOUT_DIMENSIONS: LayoutDimensions = {
  sidebarWidth: 300,
  sidebarMinWidth: 200,
  sidebarMaxWidth: 500,
  headerHeight: 60,
  footerHeight: 40,
  toolbarHeight: 48
} as const

// 响应式断点常量 / Responsive Breakpoints Constants
export const BREAKPOINTS: ResponsiveBreakpoints = {
  xs: 480,
  sm: 768,
  md: 1024,
  lg: 1280,
  xl: 1920
} as const

// 动画配置常量 / Animation Config Constants
export const ANIMATION_CONFIG: AnimationConfig = {
  durationFast: 150,
  durationNormal: 300,
  durationSlow: 500,
  easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
} as const

// Z-Index层级常量 / Z-Index Levels Constants
export const Z_INDEX: ZIndexLevels = {
  dropdown: 1000,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
  notification: 1080
} as const

// 颜色主题常量 / Color Theme Constants
export const COLOR_THEMES = {
  LIGHT: {
    primary: '#1890ff',
    success: '#52c41a',
    warning: '#faad14',
    error: '#ff4d4f',
    background: '#ffffff',
    surface: '#f5f5f5',
    textPrimary: '#262626',
    textSecondary: '#8c8c8c'
  },
  DARK: {
    primary: '#177ddc',
    success: '#49aa19',
    warning: '#d89614',
    error: '#dc4446',
    background: '#141414',
    surface: '#1f1f1f',
    textPrimary: '#ffffff',
    textSecondary: '#a6a6a6'
  }
} as const
