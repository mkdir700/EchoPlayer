import { loggerService } from '@logger'

const logger = loggerService.withContext('FFmpegWarmupManager')

export interface WarmupState {
  isWarming: boolean
  isComplete: boolean
  hasError: boolean
  errorMessage?: string
  duration?: number
}

export type WarmupCallback = (state: WarmupState) => void

/**
 * FFmpeg 预热管理器
 * 负责管理 FFmpeg 预热过程，提供状态回调和错误处理
 */
class FFmpegWarmupManager {
  private static instance: FFmpegWarmupManager | null = null
  private callbacks: Set<WarmupCallback> = new Set()
  private currentState: WarmupState = {
    isWarming: false,
    isComplete: false,
    hasError: false
  }

  private warmupPromise: Promise<boolean> | null = null

  // 单例模式
  public static getInstance(): FFmpegWarmupManager {
    if (!FFmpegWarmupManager.instance) {
      FFmpegWarmupManager.instance = new FFmpegWarmupManager()
    }
    return FFmpegWarmupManager.instance
  }

  /**
   * 订阅预热状态变化
   */
  public subscribe(callback: WarmupCallback): () => void {
    this.callbacks.add(callback)

    // 立即发送当前状态
    callback({ ...this.currentState })

    // 返回取消订阅函数
    return () => {
      this.callbacks.delete(callback)
    }
  }

  /**
   * 更新状态并通知所有订阅者
   */
  private updateState(newState: Partial<WarmupState>): void {
    this.currentState = { ...this.currentState, ...newState }
    logger.info('🔥 预热状态更新', this.currentState)

    // 通知所有订阅者
    this.callbacks.forEach((callback) => {
      try {
        callback({ ...this.currentState })
      } catch (error) {
        logger.error('预热状态回调执行失败:', { error })
      }
    })
  }

  /**
   * 获取当前预热状态
   */
  public getCurrentState(): WarmupState {
    return { ...this.currentState }
  }

  /**
   * 开始预热 FFmpeg
   * 如果已经在预热中或已完成，会复用现有的 Promise
   */
  public async startWarmup(): Promise<boolean> {
    // 如果已经完成，直接返回成功
    if (this.currentState.isComplete && !this.currentState.hasError) {
      logger.info('🔥 FFmpeg 已预热完成，跳过')
      return true
    }

    // 如果正在预热中，返回现有的 Promise
    if (this.warmupPromise) {
      logger.info('🔥 FFmpeg 预热已在进行中，等待结果...')
      return await this.warmupPromise
    }

    // 开始新的预热过程
    this.warmupPromise = this.performWarmup()

    try {
      const result = await this.warmupPromise
      return result
    } finally {
      this.warmupPromise = null
    }
  }

  /**
   * 执行实际的预热操作
   */
  private async performWarmup(): Promise<boolean> {
    const startTime = Date.now()

    try {
      this.updateState({
        isWarming: true,
        isComplete: false,
        hasError: false,
        errorMessage: undefined
      })

      logger.info('🔥 开始 FFmpeg 预热...')

      // 调用主进程的预热接口
      const success = await window.api.ffmpeg.warmup()
      const duration = Date.now() - startTime

      if (success) {
        this.updateState({
          isWarming: false,
          isComplete: true,
          hasError: false,
          duration
        })
        logger.info(`🔥 FFmpeg 预热成功，耗时: ${duration}ms`)
        return true
      } else {
        this.updateState({
          isWarming: false,
          isComplete: true,
          hasError: true,
          errorMessage: 'FFmpeg 预热失败',
          duration
        })
        logger.warn(`🔥 FFmpeg 预热失败，耗时: ${duration}ms`)
        return false
      }
    } catch (error) {
      const duration = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : String(error)

      this.updateState({
        isWarming: false,
        isComplete: true,
        hasError: true,
        errorMessage,
        duration
      })

      logger.error(`🔥 FFmpeg 预热异常，耗时: ${duration}ms`, { error })
      return false
    }
  }

  /**
   * 检查远程预热状态
   * 用于同步主进程的预热状态
   */
  public async checkRemoteStatus(): Promise<void> {
    try {
      const remoteStatus = await window.api.ffmpeg.getWarmupStatus()

      // 如果远程已经预热完成，更新本地状态
      if (remoteStatus.isWarmedUp && !this.currentState.isComplete) {
        this.updateState({
          isWarming: false,
          isComplete: true,
          hasError: false
        })
        logger.info('🔥 检测到远程 FFmpeg 已预热完成')
      } else if (remoteStatus.isWarming && !this.currentState.isWarming) {
        this.updateState({
          isWarming: true,
          isComplete: false,
          hasError: false
        })
        logger.info('🔥 检测到远程 FFmpeg 正在预热中')
      }
    } catch (error) {
      logger.error('检查远程预热状态失败:', { error })
    }
  }

  /**
   * 重置预热状态
   * 用于测试或手动重置
   */
  public reset(): void {
    this.currentState = {
      isWarming: false,
      isComplete: false,
      hasError: false
    }
    this.warmupPromise = null
    logger.info('🔥 预热管理器状态已重置')
  }

  /**
   * 清理资源
   */
  public dispose(): void {
    this.callbacks.clear()
    this.warmupPromise = null
    logger.info('🔥 预热管理器已清理')
  }
}

// 导出类和单例实例
export { FFmpegWarmupManager }
export const ffmpegWarmupManager = FFmpegWarmupManager.getInstance()
export default ffmpegWarmupManager
