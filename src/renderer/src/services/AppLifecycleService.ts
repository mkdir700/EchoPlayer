import { loggerService } from '@logger'

import { disposeGlobalOrchestrator } from '../pages/player/hooks/usePlayerEngine'

const logger = loggerService.withContext('AppLifecycleService')

/**
 * 应用生命周期服务
 * 负责处理应用退出、窗口关闭等场景下的资源清理
 */
export class AppLifecycleService {
  private static instance: AppLifecycleService | null = null
  private isDisposed = false
  private cleanupHandlers: Array<() => void> = []

  public static getInstance(): AppLifecycleService {
    if (!AppLifecycleService.instance) {
      AppLifecycleService.instance = new AppLifecycleService()
    }
    return AppLifecycleService.instance
  }

  private constructor() {
    this.setupEventListeners()
  }

  /**
   * 注册清理处理器
   */
  public registerCleanupHandler(handler: () => void): () => void {
    this.cleanupHandlers.push(handler)

    // 返回取消注册的函数
    return () => {
      const index = this.cleanupHandlers.indexOf(handler)
      if (index > -1) {
        this.cleanupHandlers.splice(index, 1)
      }
    }
  }

  /**
   * 设置事件监听器
   */
  private setupEventListeners(): void {
    // 页面即将卸载时的清理
    window.addEventListener('beforeunload', this.handleBeforeUnload.bind(this))

    // 页面可见性变化处理（用户切换应用、最小化窗口等）
    document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this))

    // 监听主进程发送的退出信号（如果有的话）
    if (window.electron?.ipcRenderer) {
      window.electron.ipcRenderer.on('app-will-quit', this.handleAppWillQuit.bind(this))
    }

    logger.debug('应用生命周期事件监听器已设置')
  }

  /**
   * 处理页面即将卸载
   */
  private handleBeforeUnload(): void {
    if (this.isDisposed) return

    try {
      logger.debug('页面即将卸载，开始清理资源')
      this.performFullCleanup()
    } catch (error) {
      logger.error('页面卸载时清理资源失败:', { error })
    }
  }

  /**
   * 处理页面可见性变化
   */
  private handleVisibilityChange(): void {
    if (document.visibilityState === 'hidden') {
      logger.debug('页面变为不可见状态')
      // 这里可以添加暂停播放等逻辑，但不完全清理资源
    } else if (document.visibilityState === 'visible') {
      logger.debug('页面变为可见状态')
      // 页面重新可见时的恢复逻辑
    }
  }

  /**
   * 处理应用即将退出（来自主进程的信号）
   */
  private handleAppWillQuit(): void {
    if (this.isDisposed) return

    try {
      logger.debug('应用即将退出，开始清理资源')
      this.performFullCleanup()
    } catch (error) {
      logger.error('应用退出时清理资源失败:', { error })
    }
  }

  /**
   * 执行完整的资源清理
   */
  private performFullCleanup(): void {
    if (this.isDisposed) {
      logger.warn('资源已被清理，跳过重复清理')
      return
    }

    logger.debug('开始执行完整资源清理')

    // 1. 清理播放器编排器
    try {
      disposeGlobalOrchestrator()
      logger.debug('播放器编排器已清理')
    } catch (error) {
      logger.error('清理播放器编排器失败:', { error })
    }

    // 2. 执行所有注册的清理处理器
    try {
      this.cleanupHandlers.forEach((handler, index) => {
        try {
          handler()
          logger.debug(`清理处理器 ${index} 执行成功`)
        } catch (error) {
          logger.error(`清理处理器 ${index} 执行失败:`, { error })
        }
      })
    } catch (error) {
      logger.error('执行自定义清理处理器时出错:', { error })
    }

    // 3. 标记为已清理
    this.isDisposed = true
    logger.debug('完整资源清理完成')
  }

  /**
   * 手动触发清理（供外部调用）
   */
  public dispose(): void {
    this.performFullCleanup()

    // 移除事件监听器
    try {
      window.removeEventListener('beforeunload', this.handleBeforeUnload.bind(this))
      document.removeEventListener('visibilitychange', this.handleVisibilityChange.bind(this))

      if (window.electron?.ipcRenderer) {
        window.electron.ipcRenderer.removeAllListeners('app-will-quit')
      }

      logger.debug('应用生命周期事件监听器已移除')
    } catch (error) {
      logger.error('移除事件监听器时出错:', { error })
    }
  }

  /**
   * 检查是否已被清理
   */
  public isDisposedState(): boolean {
    return this.isDisposed
  }
}

// 创建全局单例实例
export const appLifecycleService = AppLifecycleService.getInstance()
