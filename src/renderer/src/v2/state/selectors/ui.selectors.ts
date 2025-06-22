/* eslint-disable @typescript-eslint/explicit-function-return-type */
/**
 * V2 界面状态选择器 / V2 UI State Selectors
 *
 * 使用自动生成选择器模式提供高性能的界面状态访问
 * Uses auto-generated selector pattern for high-performance UI state access
 */

import { createSelectors } from '../infrastructure'
import { useUIStore, type UIState, ThemeMode, LayoutMode } from '../stores/ui.store'

/**
 * 带有自动生成选择器的界面 Store / UI Store with auto-generated selectors
 *
 * 使用方式 / Usage:
 * - 基础属性: uiStore.use.themeMode()
 * - 嵌套属性: uiStore.use.dimensions() 然后访问 .windowWidth
 * - 复杂计算: 使用下面的计算属性选择器
 */
export const uiStore = createSelectors(useUIStore)

/**
 * 计算属性选择器 / Computed property selectors
 * 这些选择器提供复杂的计算逻辑，无法通过自动生成获得
 * These selectors provide complex computation logic that cannot be auto-generated
 */
export const uiSelectors = {
  // 计算属性选择器 / Computed property selectors

  hasActiveModals: (state: UIState) => {
    return state.modal.activeModals.length > 0
  },

  modalCount: (state: UIState) => {
    return state.modal.activeModals.length
  },

  topModal: (state: UIState) => {
    const stack = state.modal.modalStack
    return stack.length > 0 ? stack[stack.length - 1] : null
  },

  notificationCount: (state: UIState) => {
    return state.notification.notifications.length
  },

  hasNotifications: (state: UIState) => {
    return state.notification.notifications.length > 0
  },

  latestNotification: (state: UIState) => {
    return state.notification.notifications.length > 0 ? state.notification.notifications[0] : null
  },

  effectiveSidebarWidth: (state: UIState) => {
    if (!state.sidebar.isVisible) return 0
    if (state.sidebar.isCollapsed) return 60 // 折叠时的最小宽度 / Minimum width when collapsed
    return state.dimensions.sidebarWidth
  },

  availableContentWidth: (state: UIState) => {
    const sidebarWidth = uiSelectors.effectiveSidebarWidth(state)
    return state.dimensions.windowWidth - sidebarWidth
  },

  availableContentHeight: (state: UIState) => {
    let height = state.dimensions.windowHeight
    height -= state.dimensions.headerHeight
    height -= state.dimensions.footerHeight
    return Math.max(0, height)
  },

  // 响应式断点选择器 / Responsive breakpoint selectors
  isSmallScreen: (state: UIState) => {
    return state.dimensions.windowWidth < 768
  },

  isMediumScreen: (state: UIState) => {
    return state.dimensions.windowWidth >= 768 && state.dimensions.windowWidth < 1024
  },

  isLargeScreen: (state: UIState) => {
    return state.dimensions.windowWidth >= 1024 && state.dimensions.windowWidth < 1280
  },

  isExtraLargeScreen: (state: UIState) => {
    return state.dimensions.windowWidth >= 1280
  },

  isMobileLayout: (state: UIState) => {
    return state.dimensions.windowWidth < 768
  },

  isTabletLayout: (state: UIState) => {
    return state.dimensions.windowWidth >= 768 && state.dimensions.windowWidth < 1024
  },

  isDesktopLayout: (state: UIState) => {
    return state.dimensions.windowWidth >= 1024
  },

  // 主题相关选择器 / Theme related selectors
  isSystemTheme: (state: UIState) => {
    return state.themeMode === ThemeMode.SYSTEM
  },

  isLightTheme: (state: UIState) => {
    return state.themeMode === ThemeMode.LIGHT
  },

  isDarkTheme: (state: UIState) => {
    return state.themeMode === ThemeMode.DARK
  },

  isCompactLayout: (state: UIState) => {
    return state.layoutMode === LayoutMode.COMPACT
  },

  isComfortableLayout: (state: UIState) => {
    return state.layoutMode === LayoutMode.COMFORTABLE
  },

  isSpaciousLayout: (state: UIState) => {
    return state.layoutMode === LayoutMode.SPACIOUS
  },

  // 特定模态框检查选择器 / Specific modal check selectors
  isModalOpen: (state: UIState, modalId: string) => {
    return state.modal.activeModals.includes(modalId)
  },

  getModalZIndex: (state: UIState, modalId: string) => {
    const modalItem = state.modal.modalStack.find((item) => item.id === modalId)
    return modalItem?.zIndex || 0
  },

  // 通知过滤选择器 / Notification filtering selectors
  getNotificationsByType: (state: UIState, type: 'info' | 'success' | 'warning' | 'error') => {
    return state.notification.notifications.filter((n) => n.type === type)
  },

  recentNotifications: (state: UIState) => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
    return state.notification.notifications.filter((n) => n.timestamp > fiveMinutesAgo)
  },

  // 状态组合选择器 / State composite selectors
  layoutInfo: (state: UIState) => {
    return {
      themeMode: state.themeMode,
      layoutMode: state.layoutMode,
      isDarkMode: state.isDarkMode,
      isFullscreen: state.fullscreen.isFullscreen,
      isInFullscreenMode: state.fullscreen.isInFullscreenMode,
      windowWidth: state.dimensions.windowWidth,
      windowHeight: state.dimensions.windowHeight,
      contentWidth: uiSelectors.availableContentWidth(state),
      contentHeight: uiSelectors.availableContentHeight(state),
      isMobile: uiSelectors.isMobileLayout(state),
      isTablet: uiSelectors.isTabletLayout(state),
      isDesktop: uiSelectors.isDesktopLayout(state)
    }
  },

  sidebarInfo: (state: UIState) => {
    return {
      isVisible: state.sidebar.isVisible,
      isCollapsed: state.sidebar.isCollapsed,
      isPinned: state.sidebar.isPinned,
      activeTab: state.sidebar.activeTab,
      availableTabs: state.sidebar.availableTabs,
      width: uiSelectors.effectiveSidebarWidth(state),
      tabCount: state.sidebar.availableTabs.length
    }
  },

  modalInfo: (state: UIState) => {
    return {
      activeModals: state.modal.activeModals,
      modalCount: state.modal.activeModals.length,
      hasModals: state.modal.activeModals.length > 0,
      topModal: uiSelectors.topModal(state),
      backdropVisible: state.modal.backdropVisible
    }
  },

  notificationInfo: (state: UIState) => {
    return {
      notifications: state.notification.notifications,
      count: state.notification.notifications.length,
      hasNotifications: state.notification.notifications.length > 0,
      latest: uiSelectors.latestNotification(state),
      position: state.notification.position,
      maxCount: state.notification.maxNotifications
    }
  },

  pageStateInfo: (state: UIState) => {
    return {
      showPlayPageHeader: state.showPlayPageHeader,
      showSubtitleList: state.showSubtitleList,
      showControls: state.showControls,
      isDragging: state.isDragging,
      autoResumeAfterWordCard: state.autoResumeAfterWordCard
    }
  }
}

/**
 * 便捷 Hook 选择器 / Convenient Hook selectors
 * 使用自动生成的选择器和计算属性选择器
 * Uses auto-generated selectors and computed property selectors
 */

// 基础界面状态 Hooks / Basic UI state hooks
export const useThemeMode = () => uiStore.use.themeMode()
export const useLayoutMode = () => uiStore.use.layoutMode()
export const useIsDarkMode = () => uiStore.use.isDarkMode()
export const useIsSystemTheme = () => uiStore(uiSelectors.isSystemTheme)
export const useIsLightTheme = () => uiStore(uiSelectors.isLightTheme)
export const useIsDarkTheme = () => uiStore(uiSelectors.isDarkTheme)

// 全屏状态 Hooks / Fullscreen state hooks
export const useFullscreen = () => uiStore.use.fullscreen()
export const useIsFullscreen = () => uiStore((state) => state.fullscreen.isFullscreen)
export const useIsInFullscreenMode = () => uiStore((state) => state.fullscreen.isInFullscreenMode)
export const useCanExitFullscreen = () => uiStore((state) => state.fullscreen.canExitFullscreen)
export const useFullscreenElement = () => uiStore((state) => state.fullscreen.fullscreenElement)

// 布局尺寸 Hooks / Layout dimensions hooks
export const useDimensions = () => uiStore.use.dimensions()
export const useWindowWidth = () => uiStore((state) => state.dimensions.windowWidth)
export const useWindowHeight = () => uiStore((state) => state.dimensions.windowHeight)
export const useWindowDimensions = () =>
  uiStore((state) => ({
    width: state.dimensions.windowWidth,
    height: state.dimensions.windowHeight
  }))
export const useContentDimensions = () =>
  uiStore((state) => ({
    width: uiSelectors.availableContentWidth(state),
    height: uiSelectors.availableContentHeight(state)
  }))
export const useSidebarWidth = () => uiStore((state) => state.dimensions.sidebarWidth)
export const useEffectiveSidebarWidth = () => uiStore(uiSelectors.effectiveSidebarWidth)
export const useAvailableContentWidth = () => uiStore(uiSelectors.availableContentWidth)
export const useAvailableContentHeight = () => uiStore(uiSelectors.availableContentHeight)

// 侧边栏状态 Hooks / Sidebar state hooks
export const useSidebar = () => uiStore.use.sidebar()
export const useIsSidebarVisible = () => uiStore((state) => state.sidebar.isVisible)
export const useIsSidebarCollapsed = () => uiStore((state) => state.sidebar.isCollapsed)
export const useIsSidebarPinned = () => uiStore((state) => state.sidebar.isPinned)
export const useSidebarActiveTab = () => uiStore((state) => state.sidebar.activeTab)
export const useSidebarAvailableTabs = () => uiStore((state) => state.sidebar.availableTabs)

// 控制栏状态 Hooks / Control bar state hooks
export const useControlBar = () => uiStore.use.controlBar()
export const useIsControlBarVisible = () => uiStore((state) => state.controlBar.isVisible)
export const useIsControlBarAutoHide = () => uiStore((state) => state.controlBar.isAutoHide)
export const useControlBarPosition = () => uiStore((state) => state.controlBar.position)
export const useControlBarHideTimeout = () => uiStore((state) => state.controlBar.hideTimeout)

// 模态框状态 Hooks / Modal state hooks
export const useModal = () => uiStore.use.modal()
export const useActiveModals = () => uiStore((state) => state.modal.activeModals)
export const useModalStack = () => uiStore((state) => state.modal.modalStack)
export const useHasActiveModals = () => uiStore(uiSelectors.hasActiveModals)
export const useModalCount = () => uiStore(uiSelectors.modalCount)
export const useTopModal = () => uiStore(uiSelectors.topModal)
export const useIsBackdropVisible = () => uiStore((state) => state.modal.backdropVisible)

// 通知状态 Hooks / Notification state hooks
export const useNotification = () => uiStore.use.notification()
export const useNotifications = () => uiStore((state) => state.notification.notifications)
export const useNotificationCount = () => uiStore(uiSelectors.notificationCount)
export const useHasNotifications = () => uiStore(uiSelectors.hasNotifications)
export const useLatestNotification = () => uiStore(uiSelectors.latestNotification)
export const useNotificationPosition = () => uiStore((state) => state.notification.position)
export const useMaxNotifications = () => uiStore((state) => state.notification.maxNotifications)

// 页面状态 Hooks / Page state hooks
export const useShowPlayPageHeader = () => uiStore.use.showPlayPageHeader()
export const useShowSubtitleList = () => uiStore.use.showSubtitleList()
export const useShowControls = () => uiStore.use.showControls()
export const useIsDragging = () => uiStore.use.isDragging()
export const useAutoResumeAfterWordCard = () => uiStore.use.autoResumeAfterWordCard()

// 响应式断点 Hooks / Responsive breakpoint hooks
export const useIsSmallScreen = () => uiStore(uiSelectors.isSmallScreen)
export const useIsMediumScreen = () => uiStore(uiSelectors.isMediumScreen)
export const useIsLargeScreen = () => uiStore(uiSelectors.isLargeScreen)
export const useIsExtraLargeScreen = () => uiStore(uiSelectors.isExtraLargeScreen)
export const useIsMobileLayout = () => uiStore(uiSelectors.isMobileLayout)
export const useIsTabletLayout = () => uiStore(uiSelectors.isTabletLayout)
export const useIsDesktopLayout = () => uiStore(uiSelectors.isDesktopLayout)

// 布局模式 Hooks / Layout mode hooks
export const useIsCompactLayout = () => uiStore(uiSelectors.isCompactLayout)
export const useIsComfortableLayout = () => uiStore(uiSelectors.isComfortableLayout)
export const useIsSpaciousLayout = () => uiStore(uiSelectors.isSpaciousLayout)

// 组合数据 Hooks / Composite data hooks
export const useLayoutInfo = () => uiStore(uiSelectors.layoutInfo)
export const useSidebarInfo = () => uiStore(uiSelectors.sidebarInfo)
export const useModalInfo = () => uiStore(uiSelectors.modalInfo)
export const useNotificationInfo = () => uiStore(uiSelectors.notificationInfo)
export const usePageStateInfo = () => uiStore(uiSelectors.pageStateInfo)

// 参数化 Hooks / Parameterized hooks
export const useIsModalOpen = (modalId: string) =>
  uiStore((state) => uiSelectors.isModalOpen(state, modalId))
export const useModalZIndex = (modalId: string) =>
  uiStore((state) => uiSelectors.getModalZIndex(state, modalId))
export const useNotificationsByType = (type: 'info' | 'success' | 'warning' | 'error') =>
  uiStore((state) => uiSelectors.getNotificationsByType(state, type))
export const useRecentNotifications = () => uiStore(uiSelectors.recentNotifications)
