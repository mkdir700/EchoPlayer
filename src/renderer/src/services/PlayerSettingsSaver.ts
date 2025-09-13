import { loggerService } from '@logger'
import { PlayerSettings, usePlayerStore } from '@renderer/state/stores/player.store'

import { PlayerSettingsService } from './PlayerSettingsLoader'

const logger = loggerService.withContext('PlayerSettingsPersistenceService')

function selectPersistedSlice(state: ReturnType<typeof usePlayerStore.getState>): PlayerSettings {
  return state as PlayerSettings
}

function deepEqual(a: any, b: any): boolean {
  if (a === b) return true
  if (typeof a !== 'object' || typeof b !== 'object' || !a || !b) return false
  const ak = Object.keys(a)
  const bk = Object.keys(b)
  if (ak.length !== bk.length) return false
  for (const k of ak) {
    if (!deepEqual(a[k], b[k])) return false
  }
  return true
}

export class PlayerSettingsPersistenceService {
  private static _instance: PlayerSettingsPersistenceService | null = null
  static get instance() {
    if (!this._instance) this._instance = new PlayerSettingsPersistenceService()
    return this._instance
  }

  private storage = PlayerSettingsService
  private unsubscribe: (() => void) | null = null
  private unsubscribeCurrentTime: (() => void) | null = null
  private debounceCurrentTimeTimer: NodeJS.Timeout | null = null
  private readonly debounceCurrentTimeMs = 1200

  private lastSaved: PlayerSettings | null = null
  private debounceTimer: NodeJS.Timeout | null = null
  private readonly debounceMs = 1200

  // 用户跳转时暂时禁用自动保存的标志位
  private isUserSeeking = false
  private userSeekingTimer: NodeJS.Timeout | null = null
  private currentVideoId: number | null = null

  attach(videoId: number) {
    this.detach()
    if (!videoId || videoId <= 0) {
      logger.warn('attach: 无效 videoId，跳过', { videoId })
      return
    }

    this.currentVideoId = videoId

    // 订阅持久化切片变化（手动在回调内比较，避免类型不匹配问题）
    this.unsubscribe = usePlayerStore.subscribe((state, prevState) => {
      const slice = selectPersistedSlice(state)
      const prevSlice = prevState ? selectPersistedSlice(prevState) : null
      if (prevSlice && deepEqual(slice, prevSlice)) return
      this.onSliceChanged(videoId, slice)
    })
    logger.debug('已订阅播放器设置切片变化', { videoId })

    // 订阅 currentTime（x 秒防抖，持久化到 VideoLibrary）
    this.unsubscribeCurrentTime = usePlayerStore.subscribe((state, prevState) => {
      const prevTime = prevState ? prevState.currentTime : undefined
      const curTime = state.currentTime
      if (prevState && curTime === prevTime) return
      this.onCurrentTimeChanged(videoId, curTime)
    })
    logger.debug('已订阅视频播放进度变化', { videoId })
  }

  detach() {
    if (this.unsubscribe) {
      this.unsubscribe()
      this.unsubscribe = null
    }
    if (this.unsubscribeCurrentTime) {
      this.unsubscribeCurrentTime()
      this.unsubscribeCurrentTime = null
    }
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer)
      this.debounceTimer = null
    }
    if (this.debounceCurrentTimeTimer) {
      clearTimeout(this.debounceCurrentTimeTimer)
      this.debounceCurrentTimeTimer = null
    }
    if (this.userSeekingTimer) {
      clearTimeout(this.userSeekingTimer)
      this.userSeekingTimer = null
    }
    this.lastSaved = null
    this.isUserSeeking = false
    this.currentVideoId = null
  }

  /**
   * 标记用户正在跳转，暂时禁用 currentTime 的自动保存
   */
  markUserSeeking() {
    this.isUserSeeking = true

    // 清除之前的定时器
    if (this.userSeekingTimer) {
      clearTimeout(this.userSeekingTimer)
    }

    // 1秒后恢复自动保存（比 debounceCurrentTimeMs 稍长一些）
    this.userSeekingTimer = setTimeout(async () => {
      this.isUserSeeking = false
      this.userSeekingTimer = null

      // 立即保存一次当前播放进度，确保用户跳转后的位置被记录
      if (this.currentVideoId) {
        try {
          const currentTime = usePlayerStore.getState().currentTime
          await window.api.db.videoLibrary.updatePlayProgress(this.currentVideoId, currentTime)
          logger.debug('用户跳转状态已恢复，立即保存当前进度', {
            videoId: this.currentVideoId,
            currentTime
          })
        } catch (error) {
          logger.error('用户跳转状态恢复时保存进度失败', {
            videoId: this.currentVideoId,
            error
          })
        }
      }

      logger.debug('用户跳转状态已恢复，重新启用进度自动保存')
    }, 1000)

    logger.debug('已标记用户跳转状态，暂时禁用进度自动保存')
  }

  private onSliceChanged(videoId: number, slice: PlayerSettings) {
    if (this.lastSaved && deepEqual(this.lastSaved, slice)) return

    if (this.debounceTimer) clearTimeout(this.debounceTimer)
    this.debounceTimer = setTimeout(async () => {
      try {
        await this.storage.save(videoId, {
          ...usePlayerStore.getState(),
          ...slice,
          currentVideoId: videoId
        } as any)
        this.lastSaved = slice
        logger.debug('播放器设置已保存', { videoId })
      } catch (error) {
        logger.error('保存播放器设置失败', { videoId, error })
      }
    }, this.debounceMs)
  }

  private onCurrentTimeChanged(videoId: number, currentTime: number) {
    // 如果用户正在跳转，跳过自动保存
    if (this.isUserSeeking) {
      logger.debug('用户正在跳转，跳过进度自动保存', { videoId, currentTime })
      return
    }

    if (this.debounceCurrentTimeTimer) clearTimeout(this.debounceCurrentTimeTimer)
    this.debounceCurrentTimeTimer = setTimeout(async () => {
      try {
        await window.api.db.videoLibrary.updatePlayProgress(videoId, currentTime)
        logger.debug('播放进度已保存', { videoId, currentTime })
      } catch (error) {
        logger.error('保存播放进度失败', { videoId, error })
      }
    }, this.debounceCurrentTimeMs)
  }
}

export const playerSettingsPersistenceService = PlayerSettingsPersistenceService.instance
