import { loggerService } from '@logger'
import { PlayerSettings, usePlayerStore } from '@renderer/state/stores/player.store'

import { PlayerSettingsService } from './PlayerSettingsLoader'

const logger = loggerService.withContext('PlayerSettingsPersistenceService')

// 仅选择需要持久化的切片
function selectPersistedSlice(state: ReturnType<typeof usePlayerStore.getState>): PlayerSettings {
  return {
    volume: state.volume,
    muted: state.muted,
    playbackRate: state.playbackRate,
    loopEnabled: state.loopEnabled,
    loopMode: state.loopMode,
    loopCount: state.loopCount,
    loopRemainingCount: state.loopRemainingCount,
    autoPauseEnabled: state.autoPauseEnabled,
    pauseOnSubtitleEnd: state.pauseOnSubtitleEnd,
    resumeEnabled: state.resumeEnabled,
    resumeDelay: state.resumeDelay,
    subtitleOverlay: state.subtitleOverlay
  }
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

  attach(videoId: number) {
    this.detach()
    if (!videoId || videoId <= 0) {
      logger.warn('attach: 无效 videoId，跳过', { videoId })
      return
    }

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
    this.lastSaved = null
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
