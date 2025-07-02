/**
 * V2 状态操作入口文件 / V2 State Actions Entry Point
 *
 * 导出所有状态操作类和相关方法
 * Exports all state action classes and related methods
 */

// 视频状态操作 / Video State Actions
import { VideoActions } from './video.actions'
export { VideoActions }

// 字幕状态操作 / Subtitle State Actions
import { SubtitleActions } from './subtitle.actions'
export { SubtitleActions }

// 播放控制状态操作 / Playback Control State Actions
import { PlaybackActions } from './playback.actions'
export { PlaybackActions }

// 界面状态操作 / UI State Actions
import { UIActions } from './ui.actions'
export { UIActions }

/**
 * 组合操作类 / Composite Actions Class
 *
 * 提供跨多个 Store 的复杂操作
 * Provides complex operations across multiple stores
 */
export class CompositeActions {
  /**
   * 初始化应用状态 / Initialize application state
   *
   * 在应用启动时调用，初始化所有必要的状态
   * Called on app startup to initialize all necessary states
   */
  static async initializeApp(): Promise<void> {
    try {
      // 这里可以添加应用初始化逻辑 / App initialization logic can be added here
      // 例如：加载用户设置、恢复上次会话等 / e.g., load user settings, restore last session, etc.

      console.log('🚀 应用状态初始化完成')
    } catch (error) {
      console.error('❌ 应用状态初始化失败', error)
      throw error
    }
  }

  /**
   * 清理应用状态 / Cleanup application state
   *
   * 在应用关闭时调用，清理所有状态
   * Called on app shutdown to cleanup all states
   */
  static async cleanupApp(): Promise<void> {
    try {
      // 保存播放进度 / Save playback progress
      await VideoActions.savePlaybackProgress(true)

      // 清理视频状态 / Cleanup video states
      VideoActions.cleanupVideoStates()

      // 重置播放控制 / Reset playback control
      PlaybackActions.resetPlaybackControl()

      // 重置 UI 状态 / Reset UI state
      UIActions.resetUIState()

      console.log('🧹 应用状态清理完成')
    } catch (error) {
      console.error('❌ 应用状态清理失败', error)
    }
  }
}
