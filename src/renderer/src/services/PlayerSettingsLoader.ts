import { loggerService } from '@logger'
import { PlayerSettingsInsert } from '@shared/types/database'
import { LoopMode } from '@types'
import type { PlayerSettingsRecord } from 'packages/shared/types/database'

import type { PlayerState } from '../state/stores/player.store'
import { createDefaultSubtitleOverlayConfig, createPlayerState } from '../state/stores/player.store'
import { useSettingsStore } from '../state/stores/settings.store'

const logger = loggerService.withContext('PlayerSettingsService')

export class PlayerSettingsService {
  static async load(videoId: number): Promise<PlayerState | null> {
    try {
      logger.debug('加载播放器设置:', { videoId })

      const dbSettings = await window.api.db.playerSettings.get(videoId)
      if (!dbSettings) {
        logger.debug('未找到播放器设置，使用全局默认设置:', { videoId })
        return this.createDefaultPlayerState()
      }

      const playerState = this.mapDatabaseToState(dbSettings)
      logger.debug('播放器设置加载成功:', { videoId, settings: playerState })

      return playerState
    } catch (error) {
      logger.error('加载播放器设置失败:', { videoId, error })
      return null
    }
  }

  /**
   * 创建基于全局设置的默认播放器状态
   */
  private static createDefaultPlayerState(): PlayerState {
    const globalSettings = useSettingsStore.getState().playback

    return createPlayerState({
      globalSettings
    })
  }

  static async save(videoId: number, state: PlayerState): Promise<void> {
    try {
      logger.debug('保存播放器设置:', { videoId })

      const dbSettings = this.mapStateToDatabase(state)
      await window.api.db.playerSettings.save(videoId, dbSettings)

      logger.debug('播放器设置保存成功:', { videoId })
    } catch (error) {
      logger.error('保存播放器设置失败:', { videoId, error })
      throw error
    }
  }

  async delete(videoId: number): Promise<void> {
    try {
      logger.debug('删除播放器设置:', { videoId })

      await window.api.db.playerSettings.delete(videoId)

      logger.debug('播放器设置删除成功:', { videoId })
    } catch (error) {
      logger.error('删除播放器设置失败:', { videoId, error })
      throw error
    }
  }

  async has(videoId: number): Promise<boolean> {
    try {
      const exists = await window.api.db.playerSettings.has(videoId)
      logger.debug('检查播放器设置存在性:', { videoId, exists })
      return exists
    } catch (error) {
      logger.error('检查播放器设置存在性失败:', { videoId, error })
      return false
    }
  }

  /**
   * 将数据库 PlayerSettings 数据映射为 PlayerState
   * @param dbData 数据库数据
   * @returns PlayerState 部分数据
   */
  private static mapDatabaseToState(dbData: PlayerSettingsRecord): PlayerState {
    const globalSettings = useSettingsStore.getState().playback

    // 解析 JSON 字段的辅助函数
    const parseJsonField = <T>(jsonStr: string | null, defaultValue: T): T => {
      if (!jsonStr) return defaultValue
      try {
        return JSON.parse(jsonStr) as T
      } catch (error) {
        logger.warn('JSON 字段解析失败，使用默认值:', { jsonStr, error })
        return defaultValue
      }
    }

    // 解析循环设置
    const loopSettings = parseJsonField(dbData.loopSettings, {
      loopEnabled: false,
      loopMode: LoopMode.SINGLE,
      loopCount: -1,
      loopRemainingCount: -1
    })

    // 解析自动暂停设置
    const autoPauseSettings = parseJsonField(dbData.autoPauseSettings, {
      autoPauseEnabled: false,
      pauseOnSubtitleEnd: true,
      resumeEnabled: false,
      resumeDelay: 5000
    })

    // 解析字幕覆盖层设置
    const subtitleOverlaySettings = parseJsonField(
      dbData.subtitleOverlaySettings,
      createDefaultSubtitleOverlayConfig()
    )

    // 解析常用播放速度
    const favoriteRates = parseJsonField(dbData.favoriteRates, globalSettings.defaultFavoriteRates)

    // 使用工厂函数创建 PlayerState，并用数据库数据覆盖
    return createPlayerState({
      globalSettings,
      persistedSettings: {
        volume: dbData.volume,
        muted: Boolean(dbData.muted),
        playbackRate: dbData.playbackRate,
        favoriteRates,
        currentFavoriteIndex: Math.max(0, favoriteRates.indexOf(dbData.playbackRate)),
        loopEnabled: loopSettings.loopEnabled,
        loopMode: loopSettings.loopMode,
        loopCount: loopSettings.loopCount,
        loopRemainingCount: loopSettings.loopRemainingCount,
        autoPauseEnabled: autoPauseSettings.autoPauseEnabled,
        pauseOnSubtitleEnd: autoPauseSettings.pauseOnSubtitleEnd,
        resumeEnabled: autoPauseSettings.resumeEnabled,
        resumeDelay: autoPauseSettings.resumeDelay,
        subtitleOverlay: subtitleOverlaySettings
      }
    })
  }

  /**
   * 将 PlayerState 数据映射为数据库 PlayerSettings 更新数据
   * @param state PlayerState
   * @returns PlayerSettingsUpdate 格式的数据
   */
  private static mapStateToDatabase(state: PlayerState): Omit<PlayerSettingsInsert, 'videoId'> {
    // 构建循环设置 JSON
    const loopSettings = {
      loopEnabled: state.loopEnabled,
      loopMode: state.loopMode,
      loopCount: state.loopCount,
      loopRemainingCount: state.loopRemainingCount
    }

    // 构建自动暂停设置 JSON
    const autoPauseSettings = {
      autoPauseEnabled: state.autoPauseEnabled,
      pauseOnSubtitleEnd: state.pauseOnSubtitleEnd,
      resumeEnabled: state.resumeEnabled,
      resumeDelay: state.resumeDelay
    }

    // 构建字幕覆盖层设置 JSON
    const subtitleOverlaySettings = state.subtitleOverlay

    return {
      playbackRate: state.playbackRate,
      volume: state.volume,
      muted: state.muted,
      favoriteRates: JSON.stringify(state.favoriteRates),
      // currentFavoriteIndex 是运行时状态，不需要持久化
      loopSettings: JSON.stringify(loopSettings),
      autoPauseSettings: JSON.stringify(autoPauseSettings),
      subtitleOverlaySettings: JSON.stringify(subtitleOverlaySettings)
    }
  }
}
