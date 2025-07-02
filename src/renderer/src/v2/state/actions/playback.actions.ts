/**
 * V2 播放控制状态操作 / V2 Playback Control State Actions
 *
 * 实现复杂的播放控制相关状态变更逻辑，包括跨 Store 操作和异步业务流程
 * Implements complex playback control related state change logic, including cross-store operations and async business flows
 */

import { usePlaybackControlStore, LoopMode } from '../stores/playback.store'
import { useVideoStore } from '../stores/video.store'
import { useSubtitleStore } from '../stores/subtitle.store'
import { useUIStore } from '../stores/ui.store'
import { StateDebug, StatePerformance } from '../infrastructure'
import { logger } from '@renderer/utils/logger'

/**
 * 播放控制操作类 / Playback Control Actions Class
 *
 * 封装复杂的播放控制相关状态操作
 * Encapsulates complex playback control related state operations
 */
export class PlaybackActions {
  /**
   * 智能播放控制 / Smart play control
   *
   * 包含状态检查、错误处理、跨 Store 同步等逻辑
   * Includes state checking, error handling, cross-store synchronization logic
   */
  static async smartPlay(): Promise<boolean> {
    return StatePerformance.measureOperation(async () => {
      const playbackStore = usePlaybackControlStore.getState()
      const videoStore = useVideoStore.getState()
      const uiStore = useUIStore.getState()

      try {
        // 检查是否有当前视频 / Check if there's a current video
        if (!videoStore.currentVideo) {
          throw new Error('没有可播放的视频')
        }

        // 开始播放 / Start playing
        playbackStore.play()
        videoStore.setIsPlaying(true)

        // 更新统计信息 / Update statistics
        playbackStore.updatePlayTime(0) // 开始计时 / Start timing

        logger.info('▶️ 开始播放')
        return true
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '播放失败'
        logger.error(`❌ 播放失败: ${errorMessage}`, error)

        playbackStore.setError(errorMessage)
        uiStore.addNotification({
          type: 'error',
          title: '播放失败',
          message: errorMessage,
          duration: 3000
        })

        return false
      }
    }, 'PlaybackActions.smartPlay')
  }

  /**
   * 智能暂停控制 / Smart pause control
   */
  static smartPause(): void {
    const playbackStore = usePlaybackControlStore.getState()
    const videoStore = useVideoStore.getState()

    try {
      playbackStore.pause()
      videoStore.setIsPlaying(false)

      logger.info('⏸️ 已暂停播放')
    } catch (error) {
      logger.error('❌ 暂停失败', error)
    }
  }

  /**
   * 智能跳转 / Smart seek
   *
   * @param time 目标时间 / Target time
   * @param options 跳转选项 / Seek options
   */
  static async smartSeek(
    time: number,
    options: {
      syncSubtitle?: boolean
      updateHistory?: boolean
      checkBounds?: boolean
    } = {}
  ): Promise<boolean> {
    return StatePerformance.measureOperation(async () => {
      const playbackStore = usePlaybackControlStore.getState()
      const videoStore = useVideoStore.getState()
      const subtitleStore = useSubtitleStore.getState()
      const uiStore = useUIStore.getState()

      const { syncSubtitle = true, updateHistory = true, checkBounds = true } = options

      try {
        // 检查时间边界 / Check time bounds
        if (checkBounds) {
          const duration = videoStore.currentVideo?.duration || 0
          if (time < 0 || time > duration) {
            throw new Error(`跳转时间超出范围: ${time}`)
          }
        }

        // 执行跳转 / Perform seek
        playbackStore.seek(time)
        videoStore.setCurrentTime(time)

        // 同步字幕 / Sync subtitles
        if (syncSubtitle) {
          const subtitleIndex = subtitleStore.subtitles.findIndex(
            (subtitle) => time >= subtitle.startTime && time <= subtitle.endTime
          )

          if (subtitleIndex >= 0) {
            subtitleStore.setCurrentIndex(subtitleIndex)
          } else {
            subtitleStore.setCurrentIndex(-1)
          }
        }

        // 更新历史记录 / Update history
        if (updateHistory) {
          playbackStore.recordAction('seek', { time })
        }

        logger.info(`🎯 跳转到: ${time}秒`)
        return true
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '跳转失败'
        logger.error(`❌ 跳转失败: ${errorMessage}`, error)

        uiStore.addNotification({
          type: 'error',
          title: '跳转失败',
          message: errorMessage,
          duration: 3000
        })

        return false
      }
    }, 'PlaybackActions.smartSeek')
  }

  /**
   * 设置循环模式 / Set loop mode
   *
   * @param mode 循环模式 / Loop mode
   * @param count 循环次数 / Loop count
   */
  static setLoopMode(mode: LoopMode, count?: number): void {
    const playbackStore = usePlaybackControlStore.getState()
    const uiStore = useUIStore.getState()

    try {
      playbackStore.setLoopMode(mode)

      if (count !== undefined) {
        playbackStore.setLoopCount(count)
      }

      let message = ''
      switch (mode) {
        case LoopMode.NONE:
          message = '已关闭循环播放'
          break
        case LoopMode.SINGLE:
          message = count === -1 ? '已开启单句无限循环' : `已开启单句循环 ${count} 次`
          break
        case LoopMode.VIDEO:
          message = '已开启视频循环'
          break
        case LoopMode.PLAYLIST:
          message = '已开启播放列表循环'
          break
      }

      logger.info(`🔄 ${message}`)

      uiStore.addNotification({
        type: 'info',
        title: '循环设置',
        message,
        duration: 2000
      })

      StateDebug.logStateChange(
        'PlaybackActions',
        'setLoopMode',
        playbackStore.loopConfig.mode,
        mode
      )
    } catch (error) {
      logger.error('❌ 设置循环模式失败', error)
    }
  }

  /**
   * 调整音量 / Adjust volume
   *
   * @param volume 音量值 (0-1) / Volume value (0-1)
   * @param showNotification 是否显示通知 / Whether to show notification
   */
  static adjustVolume(volume: number, showNotification = true): void {
    const playbackStore = usePlaybackControlStore.getState()
    const videoStore = useVideoStore.getState()
    const uiStore = useUIStore.getState()

    try {
      const clampedVolume = Math.max(0, Math.min(1, volume))

      playbackStore.setVolume(clampedVolume)
      videoStore.setVolume(clampedVolume)

      if (showNotification) {
        const volumePercent = Math.round(clampedVolume * 100)
        uiStore.addNotification({
          type: 'info',
          title: '音量',
          message: `音量已调整为 ${volumePercent}%`,
          duration: 1500
        })
      }

      logger.debug(`🔊 音量调整为: ${Math.round(clampedVolume * 100)}%`)
    } catch (error) {
      logger.error('❌ 调整音量失败', error)
    }
  }

  /**
   * 调整播放速度 / Adjust playback rate
   *
   * @param rate 播放速度 / Playback rate
   * @param showNotification 是否显示通知 / Whether to show notification
   */
  static adjustPlaybackRate(rate: number, showNotification = true): void {
    const playbackStore = usePlaybackControlStore.getState()
    const videoStore = useVideoStore.getState()
    const uiStore = useUIStore.getState()

    try {
      const clampedRate = Math.max(0.25, Math.min(4, rate))

      playbackStore.setPlaybackRate(clampedRate)
      videoStore.setPlaybackRate(clampedRate)

      if (showNotification) {
        uiStore.addNotification({
          type: 'info',
          title: '播放速度',
          message: `播放速度已调整为 ${clampedRate}x`,
          duration: 1500
        })
      }

      logger.debug(`⚡ 播放速度调整为: ${clampedRate}x`)
    } catch (error) {
      logger.error('❌ 调整播放速度失败', error)
    }
  }

  /**
   * 处理播放结束 / Handle playback end
   */
  static async handlePlaybackEnd(): Promise<void> {
    const playbackStore = usePlaybackControlStore.getState()
    const videoStore = useVideoStore.getState()
    const subtitleStore = useSubtitleStore.getState()

    try {
      logger.info('🏁 播放结束')

      // 检查循环设置 / Check loop settings
      const { loopConfig } = playbackStore

      if (loopConfig.isActive) {
        if (loopConfig.mode === LoopMode.VIDEO) {
          // 视频循环：重新开始播放 / Video loop: restart playback
          await this.smartSeek(0, { syncSubtitle: true })
          await this.smartPlay()
          return
        } else if (loopConfig.mode === LoopMode.SINGLE) {
          // 单句循环：跳转到当前字幕开始 / Single loop: jump to current subtitle start
          const currentSubtitle = subtitleStore.getCurrentSubtitle()
          if (currentSubtitle) {
            await this.smartSeek(currentSubtitle.startTime, { syncSubtitle: true })
            await this.smartPlay()
            return
          }
        }
      }

      // 正常结束：停止播放 / Normal end: stop playback
      playbackStore.stop()
      videoStore.setIsPlaying(false)
    } catch (error) {
      logger.error('❌ 处理播放结束失败', error)
    }
  }

  /**
   * 同步播放状态 / Sync playback state
   *
   * 用于在不同组件间同步播放状态
   * Used to sync playback state between different components
   */
  static syncPlaybackState(): void {
    const playbackStore = usePlaybackControlStore.getState()
    const videoStore = useVideoStore.getState()

    try {
      const currentVideo = videoStore.currentVideo
      if (!currentVideo) return

      // 同步播放状态 / Sync play state
      if (playbackStore.isPlaying !== currentVideo.isPlaying) {
        videoStore.setIsPlaying(playbackStore.isPlaying)
      }

      // 同步音量 / Sync volume
      if (playbackStore.controlConfig.volume !== currentVideo.volume) {
        videoStore.setVolume(playbackStore.controlConfig.volume)
      }

      // 同步播放速度 / Sync playback rate
      if (playbackStore.controlConfig.playbackRate !== currentVideo.playbackRate) {
        videoStore.setPlaybackRate(playbackStore.controlConfig.playbackRate)
      }
    } catch (error) {
      logger.warn('⚠️ 同步播放状态失败', error)
    }
  }

  /**
   * 重置播放控制状态 / Reset playback control state
   */
  static resetPlaybackControl(): void {
    const playbackStore = usePlaybackControlStore.getState()

    try {
      playbackStore.stop()
      playbackStore.clearError()
      playbackStore.resetLoop()

      logger.info('🔄 播放控制状态已重置')
    } catch (error) {
      logger.error('❌ 重置播放控制状态失败', error)
    }
  }
}
