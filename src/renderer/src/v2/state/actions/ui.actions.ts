/**
 * V2 界面状态操作 / V2 UI State Actions
 *
 * 实现复杂的界面相关状态变更逻辑，包括跨 Store 操作和异步业务流程
 * Implements complex UI-related state change logic, including cross-store operations and async business flows
 */

import { useUIStore, ThemeMode, LayoutMode } from '../stores/ui.store'
import { useVideoStore } from '../stores/video.store'
import { usePlaybackControlStore } from '../stores/playback.store'
import { StateDebug, StatePerformance } from '../infrastructure'
import { logger } from '@renderer/utils/logger'

/**
 * 界面操作类 / UI Actions Class
 *
 * 封装复杂的界面相关状态操作
 * Encapsulates complex UI-related state operations
 */
export class UIActions {
  /**
   * 智能全屏切换 / Smart fullscreen toggle
   *
   * 包含状态同步、UI 调整等逻辑
   * Includes state synchronization, UI adjustment logic
   */
  static async toggleFullscreen(): Promise<boolean> {
    return StatePerformance.measureOperation(async () => {
      const uiStore = useUIStore.getState()

      try {
        const isCurrentlyFullscreen = uiStore.fullscreen.isFullscreen

        if (isCurrentlyFullscreen) {
          // 退出全屏 / Exit fullscreen
          uiStore.exitFullscreen()

          // 恢复 UI 元素 / Restore UI elements
          uiStore.setShowPlayPageHeader(true)
          uiStore.setControlBarAutoHide(false)
          uiStore.showSidebar()

          logger.info('🔲 已退出全屏模式')
        } else {
          // 进入全屏 / Enter fullscreen
          uiStore.enterFullscreen()

          // 隐藏不必要的 UI 元素 / Hide unnecessary UI elements
          uiStore.setShowPlayPageHeader(false)
          uiStore.setControlBarAutoHide(true)
          uiStore.hideSidebar()

          logger.info('🔳 已进入全屏模式')
        }

        // 发送通知 / Send notification
        uiStore.addNotification({
          type: 'info',
          title: '全屏模式',
          message: isCurrentlyFullscreen ? '已退出全屏' : '已进入全屏',
          duration: 2000
        })

        return !isCurrentlyFullscreen
      } catch (error) {
        logger.error('❌ 切换全屏模式失败', error)

        uiStore.addNotification({
          type: 'error',
          title: '全屏切换失败',
          message: '无法切换全屏模式',
          duration: 3000
        })

        return false
      }
    }, 'UIActions.toggleFullscreen')
  }

  /**
   * 智能主题切换 / Smart theme toggle
   *
   * @param mode 主题模式 / Theme mode
   */
  static switchTheme(mode: ThemeMode): void {
    const uiStore = useUIStore.getState()

    try {
      const previousMode = uiStore.themeMode
      uiStore.setThemeMode(mode)

      // 应用主题到文档 / Apply theme to document
      this.applyThemeToDocument(mode, uiStore.isDarkMode)

      let message = ''
      switch (mode) {
        case ThemeMode.LIGHT:
          message = '已切换到浅色主题'
          break
        case ThemeMode.DARK:
          message = '已切换到深色主题'
          break
        case ThemeMode.SYSTEM:
          message = '已切换到系统主题'
          break
      }

      logger.info(`🎨 ${message}`)

      uiStore.addNotification({
        type: 'info',
        title: '主题切换',
        message,
        duration: 2000
      })

      StateDebug.logStateChange('UIActions', 'switchTheme', previousMode, mode)
    } catch (error) {
      logger.error('❌ 切换主题失败', error)
    }
  }

  /**
   * 应用主题到文档 / Apply theme to document
   *
   * @param mode 主题模式 / Theme mode
   * @param isDarkMode 是否为暗色模式 / Whether is dark mode
   */
  private static applyThemeToDocument(mode: ThemeMode, isDarkMode: boolean): void {
    try {
      const root = document.documentElement

      // 移除现有主题类 / Remove existing theme classes
      root.classList.remove('theme-light', 'theme-dark', 'theme-system')

      // 添加新主题类 / Add new theme class
      root.classList.add(`theme-${mode}`)

      // 设置暗色模式属性 / Set dark mode attribute
      if (isDarkMode) {
        root.setAttribute('data-theme', 'dark')
      } else {
        root.setAttribute('data-theme', 'light')
      }
    } catch (error) {
      logger.warn('⚠️ 应用主题到文档失败', error)
    }
  }

  /**
   * 智能布局调整 / Smart layout adjustment
   *
   * @param mode 布局模式 / Layout mode
   */
  static adjustLayout(mode: LayoutMode): void {
    const uiStore = useUIStore.getState()

    try {
      const previousMode = uiStore.layoutMode
      uiStore.setLayoutMode(mode)

      // 根据布局模式调整尺寸 / Adjust dimensions based on layout mode
      switch (mode) {
        case LayoutMode.COMPACT:
          uiStore.setSidebarWidth(250)
          uiStore.setHeaderHeight(50)
          break
        case LayoutMode.COMFORTABLE:
          uiStore.setSidebarWidth(300)
          uiStore.setHeaderHeight(60)
          break
        case LayoutMode.SPACIOUS:
          uiStore.setSidebarWidth(350)
          uiStore.setHeaderHeight(70)
          break
      }

      let message = ''
      switch (mode) {
        case LayoutMode.COMPACT:
          message = '已切换到紧凑布局'
          break
        case LayoutMode.COMFORTABLE:
          message = '已切换到舒适布局'
          break
        case LayoutMode.SPACIOUS:
          message = '已切换到宽松布局'
          break
      }

      logger.info(`📐 ${message}`)

      uiStore.addNotification({
        type: 'info',
        title: '布局调整',
        message,
        duration: 2000
      })

      StateDebug.logStateChange('UIActions', 'adjustLayout', previousMode, mode)
    } catch (error) {
      logger.error('❌ 调整布局失败', error)
    }
  }

  /**
   * 响应式布局调整 / Responsive layout adjustment
   *
   * @param windowWidth 窗口宽度 / Window width
   * @param windowHeight 窗口高度 / Window height
   */
  static handleResponsiveLayout(windowWidth: number, windowHeight: number): void {
    const uiStore = useUIStore.getState()

    try {
      // 更新窗口尺寸 / Update window dimensions
      uiStore.updateDimensions({ windowWidth, windowHeight })

      // 根据屏幕尺寸自动调整布局 / Auto adjust layout based on screen size
      if (windowWidth < 768) {
        // 移动端布局 / Mobile layout
        uiStore.hideSidebar()
        uiStore.setControlBarPosition('bottom')
        uiStore.setLayoutMode(LayoutMode.COMPACT)
      } else if (windowWidth < 1024) {
        // 平板布局 / Tablet layout
        uiStore.collapseSidebar()
        uiStore.setLayoutMode(LayoutMode.COMFORTABLE)
      } else {
        // 桌面布局 / Desktop layout
        uiStore.showSidebar()
        uiStore.expandSidebar()
        uiStore.setLayoutMode(LayoutMode.COMFORTABLE)
      }

      logger.debug(`📱 响应式布局调整: ${windowWidth}x${windowHeight}`)
    } catch (error) {
      logger.warn('⚠️ 响应式布局调整失败', error)
    }
  }

  /**
   * 管理模态框堆栈 / Manage modal stack
   *
   * @param modalId 模态框ID / Modal ID
   * @param action 操作类型 / Action type
   */
  static manageModal(modalId: string, action: 'open' | 'close'): void {
    const uiStore = useUIStore.getState()

    try {
      if (action === 'open') {
        uiStore.openModal(modalId)
        logger.debug(`📋 打开模态框: ${modalId}`)
      } else {
        uiStore.closeModal(modalId)
        logger.debug(`📋 关闭模态框: ${modalId}`)
      }
    } catch (error) {
      logger.error(`❌ 管理模态框失败: ${modalId}`, error)
    }
  }

  /**
   * 批量通知管理 / Batch notification management
   *
   * @param notifications 通知列表 / Notification list
   */
  static addBatchNotifications(
    notifications: Array<{
      type: 'info' | 'success' | 'warning' | 'error'
      title: string
      message: string
      duration?: number
    }>
  ): string[] {
    const uiStore = useUIStore.getState()
    const notificationIds: string[] = []

    try {
      notifications.forEach((notification) => {
        const id = uiStore.addNotification(notification)
        notificationIds.push(id)
      })

      logger.info(`📢 已添加 ${notifications.length} 个通知`)
      return notificationIds
    } catch (error) {
      logger.error('❌ 批量添加通知失败', error)
      return []
    }
  }

  /**
   * 智能侧边栏管理 / Smart sidebar management
   *
   * @param action 操作类型 / Action type
   */
  static manageSidebar(action: 'toggle' | 'pin' | 'unpin' | 'collapse' | 'expand'): void {
    const uiStore = useUIStore.getState()

    try {
      switch (action) {
        case 'toggle':
          uiStore.toggleSidebar()
          break
        case 'pin':
          uiStore.pinSidebar()
          break
        case 'unpin':
          uiStore.unpinSidebar()
          break
        case 'collapse':
          uiStore.collapseSidebar()
          break
        case 'expand':
          uiStore.expandSidebar()
          break
      }

      logger.debug(`📂 侧边栏操作: ${action}`)
    } catch (error) {
      logger.error(`❌ 侧边栏操作失败: ${action}`, error)
    }
  }

  /**
   * 同步 UI 状态与播放状态 / Sync UI state with playback state
   */
  static syncWithPlaybackState(): void {
    const uiStore = useUIStore.getState()
    const playbackStore = usePlaybackControlStore.getState()
    const videoStore = useVideoStore.getState()

    try {
      // 根据播放状态调整控制栏显示 / Adjust control bar display based on playback state
      if (playbackStore.isPlaying && uiStore.controlBar.isAutoHide) {
        // 播放时自动隐藏控制栏 / Auto hide control bar when playing
        setTimeout(() => {
          if (playbackStore.isPlaying) {
            uiStore.hideControlBar()
          }
        }, uiStore.controlBar.hideTimeout)
      }

      // 根据视频状态调整 UI / Adjust UI based on video state
      if (!videoStore.currentVideo) {
        uiStore.setShowControls(false)
        uiStore.setShowSubtitleList(false)
      } else {
        uiStore.setShowControls(true)
        uiStore.setShowSubtitleList(true)
      }
    } catch (error) {
      logger.warn('⚠️ 同步 UI 状态与播放状态失败', error)
    }
  }

  /**
   * 重置 UI 状态 / Reset UI state
   */
  static resetUIState(): void {
    const uiStore = useUIStore.getState()

    try {
      // 关闭所有模态框 / Close all modals
      uiStore.closeAllModals()

      // 清除所有通知 / Clear all notifications
      uiStore.clearAllNotifications()

      // 退出全屏 / Exit fullscreen
      if (uiStore.fullscreen.isFullscreen) {
        uiStore.exitFullscreen()
      }

      // 重置拖拽状态 / Reset dragging state
      uiStore.setIsDragging(false)

      logger.info('🔄 UI 状态已重置')
    } catch (error) {
      logger.error('❌ 重置 UI 状态失败', error)
    }
  }
}
