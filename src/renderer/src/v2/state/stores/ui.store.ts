/**
 * V2 界面状态存储 / V2 UI State Store
 *
 * 管理界面相关的状态，包括全屏状态、布局设置、侧边栏状态等 UI 相关状态
 * Manages UI-related state including fullscreen state, layout settings, sidebar state, etc.
 */

import { create } from 'zustand'
import { V2MiddlewarePresets, StateDebug, StateValidation } from '../infrastructure'
import { logger } from '@renderer/utils/logger'

/**
 * 主题模式枚举 / Theme Mode Enum
 */
export enum ThemeMode {
  LIGHT = 'light',
  DARK = 'dark',
  SYSTEM = 'system'
}

/**
 * 布局模式枚举 / Layout Mode Enum
 */
export enum LayoutMode {
  COMPACT = 'compact', // 紧凑模式 / Compact mode
  COMFORTABLE = 'comfortable', // 舒适模式 / Comfortable mode
  SPACIOUS = 'spacious' // 宽松模式 / Spacious mode
}

/**
 * 全屏状态接口 / Fullscreen State Interface
 */
export interface FullscreenState {
  isFullscreen: boolean // 是否全屏 / Is fullscreen
  isInFullscreenMode: boolean // 应用内全屏模式 / In-app fullscreen mode
  canExitFullscreen: boolean // 是否可以退出全屏 / Can exit fullscreen
  fullscreenElement: string | null // 全屏元素选择器 / Fullscreen element selector
}

/**
 * 布局尺寸接口 / Layout Dimensions Interface
 */
export interface LayoutDimensions {
  windowWidth: number // 窗口宽度 / Window width
  windowHeight: number // 窗口高度 / Window height
  sidebarWidth: number // 侧边栏宽度 / Sidebar width
  headerHeight: number // 头部高度 / Header height
  footerHeight: number // 底部高度 / Footer height
  contentWidth: number // 内容区域宽度 / Content area width
  contentHeight: number // 内容区域高度 / Content area height
}

/**
 * 侧边栏状态接口 / Sidebar State Interface
 */
export interface SidebarState {
  isVisible: boolean // 是否可见 / Is visible
  isCollapsed: boolean // 是否折叠 / Is collapsed
  isPinned: boolean // 是否固定 / Is pinned
  activeTab: string | null // 当前激活的标签 / Active tab
  availableTabs: string[] // 可用标签列表 / Available tabs
}

/**
 * 控制栏状态接口 / Control Bar State Interface
 */
export interface ControlBarState {
  isVisible: boolean // 是否可见 / Is visible
  isAutoHide: boolean // 是否自动隐藏 / Is auto hide
  hideTimeout: number // 隐藏超时时间 / Hide timeout
  position: 'top' | 'bottom' | 'overlay' // 位置 / Position
}

/**
 * 模态框状态接口 / Modal State Interface
 */
export interface ModalState {
  activeModals: string[] // 激活的模态框列表 / Active modals
  modalStack: { id: string; zIndex: number }[] // 模态框堆栈 / Modal stack
  backdropVisible: boolean // 背景遮罩是否可见 / Backdrop visible
}

/**
 * 通知状态接口 / Notification State Interface
 */
export interface NotificationState {
  notifications: {
    id: string
    type: 'info' | 'success' | 'warning' | 'error'
    title: string
    message: string
    duration?: number
    timestamp: Date
  }[]
  maxNotifications: number // 最大通知数量 / Max notifications
  position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' // 位置 / Position
}

/**
 * 界面状态接口 / UI State Interface
 */
export interface UIState {
  // 主题和外观 / Theme and appearance
  themeMode: ThemeMode
  layoutMode: LayoutMode
  isDarkMode: boolean

  // 全屏状态 / Fullscreen state
  fullscreen: FullscreenState

  // 布局尺寸 / Layout dimensions
  dimensions: LayoutDimensions

  // 侧边栏状态 / Sidebar state
  sidebar: SidebarState

  // 控制栏状态 / Control bar state
  controlBar: ControlBarState

  // 模态框状态 / Modal state
  modal: ModalState

  // 通知状态 / Notification state
  notification: NotificationState

  // 页面状态 / Page state
  showPlayPageHeader: boolean // 显示播放页面头部 / Show play page header
  showSubtitleList: boolean // 显示字幕列表 / Show subtitle list
  showControls: boolean // 显示控制栏 / Show controls
  isDragging: boolean // 是否正在拖拽 / Is dragging

  // 字幕交互设置 / Subtitle interaction settings
  autoResumeAfterWordCard: boolean // 查词后自动恢复播放 / Auto resume after word card
}

/**
 * 界面操作接口 / UI Actions Interface
 */
export interface UIActions {
  // 主题和外观操作 / Theme and appearance operations
  setThemeMode: (mode: ThemeMode) => void
  setLayoutMode: (mode: LayoutMode) => void
  toggleDarkMode: () => void

  // 全屏操作 / Fullscreen operations
  enterFullscreen: (element?: string) => void
  exitFullscreen: () => void
  toggleFullscreen: () => void
  setInAppFullscreen: (enabled: boolean) => void

  // 布局尺寸操作 / Layout dimensions operations
  updateDimensions: (dimensions: Partial<LayoutDimensions>) => void
  setSidebarWidth: (width: number) => void
  setHeaderHeight: (height: number) => void
  setFooterHeight: (height: number) => void

  // 侧边栏操作 / Sidebar operations
  showSidebar: () => void
  hideSidebar: () => void
  toggleSidebar: () => void
  collapseSidebar: () => void
  expandSidebar: () => void
  toggleSidebarCollapse: () => void
  pinSidebar: () => void
  unpinSidebar: () => void
  toggleSidebarPin: () => void
  setActiveTab: (tab: string | null) => void
  addTab: (tab: string) => void
  removeTab: (tab: string) => void

  // 控制栏操作 / Control bar operations
  showControlBar: () => void
  hideControlBar: () => void
  toggleControlBar: () => void
  setControlBarAutoHide: (enabled: boolean) => void
  setControlBarPosition: (position: 'top' | 'bottom' | 'overlay') => void

  // 模态框操作 / Modal operations
  openModal: (id: string) => void
  closeModal: (id: string) => void
  closeAllModals: () => void
  isModalOpen: (id: string) => boolean
  getTopModal: () => string | null

  // 通知操作 / Notification operations
  addNotification: (
    notification: Omit<NotificationState['notifications'][0], 'id' | 'timestamp'>
  ) => string
  removeNotification: (id: string) => void
  clearAllNotifications: () => void
  setNotificationPosition: (position: NotificationState['position']) => void

  // 页面状态操作 / Page state operations
  setShowPlayPageHeader: (show: boolean) => void
  setShowSubtitleList: (show: boolean) => void
  setShowControls: (show: boolean) => void
  setIsDragging: (dragging: boolean) => void
  setAutoResumeAfterWordCard: (enabled: boolean) => void

  // 工具方法 / Utility methods
  calculateContentDimensions: () => { width: number; height: number }
  isResponsiveBreakpoint: (breakpoint: 'sm' | 'md' | 'lg' | 'xl') => boolean
  validateState: () => { isValid: boolean; errors: string[] }
  resetToDefaults: () => void
}

/**
 * 界面存储类型 / UI Store Type
 */
export type UIStore = UIState & UIActions

/**
 * 默认全屏状态 / Default fullscreen state
 */
const defaultFullscreenState: FullscreenState = {
  isFullscreen: false,
  isInFullscreenMode: false,
  canExitFullscreen: true,
  fullscreenElement: null
}

/**
 * 默认布局尺寸 / Default layout dimensions
 */
const defaultDimensions: LayoutDimensions = {
  windowWidth: 1200,
  windowHeight: 800,
  sidebarWidth: 300,
  headerHeight: 60,
  footerHeight: 0,
  contentWidth: 900,
  contentHeight: 740
}

/**
 * 默认侧边栏状态 / Default sidebar state
 */
const defaultSidebarState: SidebarState = {
  isVisible: true,
  isCollapsed: false,
  isPinned: true,
  activeTab: 'subtitles',
  availableTabs: ['subtitles', 'playlist', 'settings']
}

/**
 * 默认控制栏状态 / Default control bar state
 */
const defaultControlBarState: ControlBarState = {
  isVisible: true,
  isAutoHide: false,
  hideTimeout: 3000,
  position: 'bottom'
}

/**
 * 默认模态框状态 / Default modal state
 */
const defaultModalState: ModalState = {
  activeModals: [],
  modalStack: [],
  backdropVisible: false
}

/**
 * 默认通知状态 / Default notification state
 */
const defaultNotificationState: NotificationState = {
  notifications: [],
  maxNotifications: 5,
  position: 'top-right'
}

/**
 * 初始状态 / Initial state
 */
const initialState: UIState = {
  themeMode: ThemeMode.SYSTEM,
  layoutMode: LayoutMode.COMFORTABLE,
  isDarkMode: false,
  fullscreen: defaultFullscreenState,
  dimensions: defaultDimensions,
  sidebar: defaultSidebarState,
  controlBar: defaultControlBarState,
  modal: defaultModalState,
  notification: defaultNotificationState,
  showPlayPageHeader: true,
  showSubtitleList: true,
  showControls: true,
  isDragging: false,
  autoResumeAfterWordCard: true
}

/**
 * 状态验证规则 / State validation rules
 */
const stateValidationRules = {
  themeMode: (value: unknown): value is ThemeMode =>
    Object.values(ThemeMode).includes(value as ThemeMode),
  layoutMode: (value: unknown): value is LayoutMode =>
    Object.values(LayoutMode).includes(value as LayoutMode),
  isDarkMode: (value: unknown): value is boolean => typeof value === 'boolean',
  fullscreen: (value: unknown): value is FullscreenState =>
    typeof value === 'object' && value !== null && 'isFullscreen' in value,
  dimensions: (value: unknown): value is LayoutDimensions =>
    typeof value === 'object' && value !== null && 'windowWidth' in value,
  sidebar: (value: unknown): value is SidebarState =>
    typeof value === 'object' && value !== null && 'isVisible' in value,
  controlBar: (value: unknown): value is ControlBarState =>
    typeof value === 'object' && value !== null && 'isVisible' in value,
  modal: (value: unknown): value is ModalState =>
    typeof value === 'object' && value !== null && 'activeModals' in value,
  notification: (value: unknown): value is NotificationState =>
    typeof value === 'object' && value !== null && 'notifications' in value
}

/**
 * 响应式断点 / Responsive breakpoints
 */
const breakpoints = {
  md: 768,
  lg: 1024,
  xl: 1280
}

/**
 * 状态创建器 / State creator
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createUIStore = (set: any, get: () => UIStore): UIStore => ({
  ...initialState,

  // 主题和外观操作 / Theme and appearance operations
  setThemeMode: (mode: ThemeMode) => {
    set((state: UIStore) => {
      state.themeMode = mode

      // 根据主题模式设置暗色模式 / Set dark mode based on theme mode
      if (mode === ThemeMode.DARK) {
        state.isDarkMode = true
      } else if (mode === ThemeMode.LIGHT) {
        state.isDarkMode = false
      } else {
        // 系统模式：检测系统主题 / System mode: detect system theme
        state.isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches
      }
    })

    StateDebug.logStateChange('UIStore', 'setThemeMode', get().themeMode, mode)
  },

  setLayoutMode: (mode: LayoutMode) => {
    set((state: UIStore) => {
      state.layoutMode = mode
    })
  },

  toggleDarkMode: () => {
    set((state: UIStore) => {
      state.isDarkMode = !state.isDarkMode
      state.themeMode = state.isDarkMode ? ThemeMode.DARK : ThemeMode.LIGHT
    })
  },

  // 全屏操作 / Fullscreen operations
  enterFullscreen: (element?: string) => {
    set((state: UIStore) => {
      state.fullscreen.isFullscreen = true
      state.fullscreen.fullscreenElement = element || null
    })

    StateDebug.logStateChange('UIStore', 'enterFullscreen', false, true)
  },

  exitFullscreen: () => {
    set(
      (state: {
        fullscreen: { isFullscreen: boolean; isInFullscreenMode: boolean; fullscreenElement: null }
      }) => {
        state.fullscreen.isFullscreen = false
        state.fullscreen.isInFullscreenMode = false
        state.fullscreen.fullscreenElement = null
      }
    )

    StateDebug.logStateChange('UIStore', 'exitFullscreen', true, false)
  },

  toggleFullscreen: () => {
    const state = get()
    if (state.fullscreen.isFullscreen) {
      get().exitFullscreen()
    } else {
      get().enterFullscreen()
    }
  },

  setInAppFullscreen: (enabled: boolean) => {
    set((state: UIStore) => {
      state.fullscreen.isInFullscreenMode = enabled
    })
  },

  // 布局尺寸操作 / Layout dimensions operations
  updateDimensions: (dimensions: Partial<LayoutDimensions>) => {
    set((state: UIStore) => {
      Object.assign(state.dimensions, dimensions)

      // 重新计算内容区域尺寸 / Recalculate content area dimensions
      const { windowWidth, windowHeight, sidebarWidth, headerHeight, footerHeight } =
        state.dimensions
      state.dimensions.contentWidth = windowWidth - (state.sidebar.isVisible ? sidebarWidth : 0)
      state.dimensions.contentHeight = windowHeight - headerHeight - footerHeight
    })
  },

  setSidebarWidth: (width: number) => {
    get().updateDimensions({ sidebarWidth: Math.max(200, Math.min(600, width)) })
  },

  setHeaderHeight: (height: number) => {
    get().updateDimensions({ headerHeight: Math.max(0, height) })
  },

  setFooterHeight: (height: number) => {
    get().updateDimensions({ footerHeight: Math.max(0, height) })
  },

  // 侧边栏操作 / Sidebar operations
  showSidebar: () => {
    set((state: UIStore) => {
      state.sidebar.isVisible = true
    })

    // 更新内容区域尺寸 / Update content area dimensions
    get().updateDimensions({})
  },

  hideSidebar: () => {
    set((state: UIStore) => {
      state.sidebar.isVisible = false
    })

    // 更新内容区域尺寸 / Update content area dimensions
    get().updateDimensions({})
  },

  toggleSidebar: () => {
    const state = get()
    if (state.sidebar.isVisible) {
      get().hideSidebar()
    } else {
      get().showSidebar()
    }
  },

  collapseSidebar: () => {
    set((state: UIStore) => {
      state.sidebar.isCollapsed = true
    })
  },

  expandSidebar: () => {
    set((state: UIStore) => {
      state.sidebar.isCollapsed = false
    })
  },

  toggleSidebarCollapse: () => {
    const state = get()
    if (state.sidebar.isCollapsed) {
      get().expandSidebar()
    } else {
      get().collapseSidebar()
    }
  },

  pinSidebar: () => {
    set((state: UIStore) => {
      state.sidebar.isPinned = true
    })
  },

  unpinSidebar: () => {
    set((state: UIStore) => {
      state.sidebar.isPinned = false
    })
  },

  toggleSidebarPin: () => {
    const state = get()
    if (state.sidebar.isPinned) {
      get().unpinSidebar()
    } else {
      get().pinSidebar()
    }
  },

  setActiveTab: (tab: string | null) => {
    set((state: UIStore) => {
      state.sidebar.activeTab = tab
    })
  },

  addTab: (tab: string) => {
    set((state: UIStore) => {
      if (!state.sidebar.availableTabs.includes(tab)) {
        state.sidebar.availableTabs.push(tab)
      }
    })
  },

  removeTab: (tab: string) => {
    set((state: UIStore) => {
      const index = state.sidebar.availableTabs.indexOf(tab)
      if (index >= 0) {
        state.sidebar.availableTabs.splice(index, 1)

        // 如果移除的是当前激活的标签，切换到第一个可用标签 / If removing active tab, switch to first available
        if (state.sidebar.activeTab === tab) {
          state.sidebar.activeTab = state.sidebar.availableTabs[0] || null
        }
      }
    })
  },

  // 控制栏操作 / Control bar operations
  showControlBar: () => {
    set((state: UIStore) => {
      state.controlBar.isVisible = true
    })
  },

  hideControlBar: () => {
    set((state: UIStore) => {
      state.controlBar.isVisible = false
    })
  },

  toggleControlBar: () => {
    const state = get()
    if (state.controlBar.isVisible) {
      get().hideControlBar()
    } else {
      get().showControlBar()
    }
  },

  setControlBarAutoHide: (enabled: boolean) => {
    set((state: UIStore) => {
      state.controlBar.isAutoHide = enabled
    })
  },

  setControlBarPosition: (position: 'top' | 'bottom' | 'overlay') => {
    set((state: UIStore) => {
      state.controlBar.position = position
    })
  },

  // 模态框操作 / Modal operations
  openModal: (id: string) => {
    set((state: UIStore) => {
      if (!state.modal.activeModals.includes(id)) {
        state.modal.activeModals.push(id)

        const zIndex = 1000 + state.modal.modalStack.length
        state.modal.modalStack.push({ id, zIndex })
        state.modal.backdropVisible = true
      }
    })
  },

  closeModal: (id: string) => {
    set((state: UIStore) => {
      const modalIndex = state.modal.activeModals.indexOf(id)
      if (modalIndex >= 0) {
        state.modal.activeModals.splice(modalIndex, 1)
      }

      const stackIndex = state.modal.modalStack.findIndex((item) => item.id === id)
      if (stackIndex >= 0) {
        state.modal.modalStack.splice(stackIndex, 1)
      }

      state.modal.backdropVisible = state.modal.activeModals.length > 0
    })
  },

  closeAllModals: () => {
    set((state: UIStore) => {
      state.modal.activeModals = []
      state.modal.modalStack = []
      state.modal.backdropVisible = false
    })
  },

  isModalOpen: (id: string) => {
    const state = get()
    return state.modal.activeModals.includes(id)
  },

  getTopModal: () => {
    const state = get()
    const topModal = state.modal.modalStack[state.modal.modalStack.length - 1]
    return topModal?.id || null
  },

  // 通知操作 / Notification operations
  addNotification: (notification) => {
    const id = `notification-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`

    set((state: UIStore) => {
      const newNotification = {
        ...notification,
        id,
        timestamp: new Date()
      }

      state.notification.notifications.unshift(newNotification)

      // 限制通知数量 / Limit notification count
      if (state.notification.notifications.length > state.notification.maxNotifications) {
        state.notification.notifications.splice(state.notification.maxNotifications)
      }
    })

    // 自动移除通知 / Auto remove notification
    if (notification.duration && notification.duration > 0) {
      setTimeout(() => {
        get().removeNotification(id)
      }, notification.duration)
    }

    return id
  },

  removeNotification: (id: string) => {
    set((state: UIStore) => {
      const index = state.notification.notifications.findIndex((n) => n.id === id)
      if (index >= 0) {
        state.notification.notifications.splice(index, 1)
      }
    })
  },

  clearAllNotifications: () => {
    set((state: UIStore) => {
      state.notification.notifications = []
    })
  },

  setNotificationPosition: (position: NotificationState['position']) => {
    set((state: UIStore) => {
      state.notification.position = position
    })
  },

  // 页面状态操作 / Page state operations
  setShowPlayPageHeader: (show: boolean) => {
    set((state: UIStore) => {
      state.showPlayPageHeader = show
    })
  },

  setShowSubtitleList: (show: boolean) => {
    set((state: UIStore) => {
      state.showSubtitleList = show
    })
  },

  setShowControls: (show: boolean) => {
    set((state: UIStore) => {
      state.showControls = show
    })
  },

  setIsDragging: (dragging: boolean) => {
    set((state: UIStore) => {
      state.isDragging = dragging
    })
  },

  setAutoResumeAfterWordCard: (enabled: boolean) => {
    set((state: UIStore) => {
      state.autoResumeAfterWordCard = enabled
    })
  },

  // 工具方法 / Utility methods
  calculateContentDimensions: () => {
    const state = get()
    const { windowWidth, windowHeight, sidebarWidth, headerHeight, footerHeight } = state.dimensions

    return {
      width: windowWidth - (state.sidebar.isVisible ? sidebarWidth : 0),
      height: windowHeight - headerHeight - footerHeight
    }
  },

  isResponsiveBreakpoint: (breakpoint: 'sm' | 'md' | 'lg' | 'xl') => {
    const state = get()
    return state.dimensions.windowWidth >= breakpoints[breakpoint]
  },

  validateState: () => {
    const state = get()
    const { isValid, invalidKeys } = StateValidation.validateStateTypes(
      state as unknown as Record<string, unknown>,
      stateValidationRules
    )

    return {
      isValid,
      errors: invalidKeys.map((key) => `Invalid state for key: ${key}`)
    }
  },

  resetToDefaults: () => {
    set(() => ({ ...initialState }))
    logger.info('🔄 界面状态已重置为默认值')
  }
})

/**
 * V2 界面状态存储 / V2 UI State Store
 *
 * 使用 Zustand + Immer + 持久化中间件管理界面状态
 * Uses Zustand + Immer + persistence middleware to manage UI state
 */
export const useUIStore = create<UIStore>()(
  V2MiddlewarePresets.persistent<UIStore>('ui-store', {
    // 选择性持久化：持久化用户偏好设置 / Selective persistence: persist user preferences
    partialize: (state: UIStore) => ({
      themeMode: state.themeMode,
      layoutMode: state.layoutMode,
      sidebar: {
        ...state.sidebar,
        isVisible: true // 重置可见性 / Reset visibility
      },
      controlBar: state.controlBar,
      notification: {
        ...state.notification,
        notifications: [] // 不持久化通知 / Don't persist notifications
      },
      autoResumeAfterWordCard: state.autoResumeAfterWordCard
    }),
    version: 1
  })(createUIStore)
)
