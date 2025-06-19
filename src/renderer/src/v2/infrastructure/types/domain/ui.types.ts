/**
 * UI领域类型定义
 * UI Domain Type Definitions
 *
 * 基于现有 EchoLab 项目的用户界面功能设计
 * Based on existing EchoLab project's user interface features
 */

// 页面类型枚举 / Page Type Enum
export enum PageType {
  HOME = 'home',
  PLAY = 'play',
  FAVORITES = 'favorites',
  ABOUT = 'about',
  SETTINGS = 'settings'
}

// 主题模式枚举 / Theme Mode Enum
export enum ThemeMode {
  LIGHT = 'light',
  DARK = 'dark',
  SYSTEM = 'system'
}

// 全屏状态接口 / Fullscreen State Interface
export interface FullscreenState {
  readonly isFullscreen: boolean
  readonly isInFullscreenMode: boolean // 应用内全屏模式
  readonly canToggleFullscreen: boolean
}

// UI状态接口 / UI State Interface
export interface UIState {
  readonly fullscreen: FullscreenState
  readonly showPlayPageHeader: boolean
  readonly showSubtitleList: boolean
  readonly sidebarWidth: number
  readonly showControls: boolean
  readonly isDragging: boolean
  readonly autoResumeAfterWordCard: boolean
  readonly currentPage: PageType
  readonly theme: ThemeMode
}

// 布局尺寸接口 / Layout Dimensions Interface
export interface LayoutDimensions {
  readonly sidebarWidth: number
  readonly sidebarMinWidth: number
  readonly sidebarMaxWidth: number
  readonly headerHeight: number
  readonly footerHeight: number
  readonly toolbarHeight: number
}

// 响应式断点接口 / Responsive Breakpoints Interface
export interface ResponsiveBreakpoints {
  readonly xs: number
  readonly sm: number
  readonly md: number
  readonly lg: number
  readonly xl: number
}

// 动画配置接口 / Animation Config Interface
export interface AnimationConfig {
  readonly durationFast: number
  readonly durationNormal: number
  readonly durationSlow: number
  readonly easing: string
}

// 颜色主题接口 / Color Theme Interface
export interface ColorTheme {
  readonly primary: string
  readonly success: string
  readonly warning: string
  readonly error: string
  readonly background: string
  readonly surface: string
  readonly textPrimary: string
  readonly textSecondary: string
}

// Z-Index层级接口 / Z-Index Levels Interface
export interface ZIndexLevels {
  readonly dropdown: number
  readonly modal: number
  readonly popover: number
  readonly tooltip: number
  readonly notification: number
}

// 导航项接口 / Navigation Item Interface
export interface NavigationItem {
  readonly key: PageType
  readonly label: string
  readonly icon: React.ReactNode
  readonly path: string
  readonly isActive?: boolean
  readonly disabled?: boolean
}

// 控件变体类型 / Control Variant Type
export type ControlVariant = 'compact' | 'fullscreen' | 'minimal'

// 控件大小类型 / Control Size Type
export type ControlSize = 'small' | 'medium' | 'large'

// 控件状态类型 / Control State Type
export type ControlState = 'normal' | 'active' | 'disabled' | 'loading'

// 模态框配置接口 / Modal Config Interface
export interface ModalConfig {
  readonly title?: string
  readonly width?: number | string
  readonly height?: number | string
  readonly closable?: boolean
  readonly maskClosable?: boolean
  readonly centered?: boolean
  readonly destroyOnClose?: boolean
}

// 通知配置接口 / Notification Config Interface
export interface NotificationConfig {
  readonly type: 'success' | 'info' | 'warning' | 'error'
  readonly title: string
  readonly message?: string
  readonly duration?: number
  readonly placement?: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight'
}

// 拖拽状态接口 / Drag State Interface
export interface DragState {
  readonly isDragging: boolean
  readonly dragType: 'resize' | 'move' | 'reorder'
  readonly startPosition: { x: number; y: number }
  readonly currentPosition: { x: number; y: number }
  readonly target?: string
}

// 键盘快捷键接口 / Keyboard Shortcut Interface
export interface KeyboardShortcut {
  readonly key: string
  readonly modifiers: readonly ('ctrl' | 'alt' | 'shift' | 'meta')[]
  readonly action: string
  readonly description: string
  readonly enabled: boolean
}

// 工具提示配置接口 / Tooltip Config Interface
export interface TooltipConfig {
  readonly title: string
  readonly placement?: 'top' | 'bottom' | 'left' | 'right'
  readonly trigger?: 'hover' | 'focus' | 'click'
  readonly delay?: number
}

// 加载指示器配置接口 / Loading Indicator Config Interface
export interface LoadingIndicatorConfig {
  readonly type: 'spinner' | 'progress' | 'skeleton'
  readonly size: ControlSize
  readonly message?: string
  readonly progress?: number
}

// 错误边界状态接口 / Error Boundary State Interface
export interface ErrorBoundaryState {
  readonly hasError: boolean
  readonly error?: Error
  readonly errorInfo?: React.ErrorInfo
  readonly fallbackComponent?: React.ComponentType
}
