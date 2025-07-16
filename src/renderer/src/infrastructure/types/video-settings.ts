/**
 * 针对单个视频的播放设置接口
 */

import { SubtitleDisplayMode } from './subtitle'

export enum LoopMode {
  SINGLE = 'single', // 单句循环
  AB = 'ab' // A-B循环
}

// 视频设置接口 / Video Settings Interface
export interface VideoSettings {
  /** 设置记录的唯一标识符 */
  id: string

  /** 播放记录ID */
  playbackHistoryId: string

  // === 基础播放设置 / Basic Playback Settings ===
  /** 音量 (0-1) */
  volume: number

  /** 静音 */
  muted: boolean

  /** 播放速度 */
  playbackRate: number

  // === 循环设置 / Loop Settings ===
  /** 循环播放 */
  loopEnabled: boolean

  /** 循环模式 */
  loopMode: LoopMode

  /** 循环次数 (-1=无限循环，0=关闭，>0=指定次数) */
  loopCount: number

  // === 自动暂停设置 / Auto Pause Settings ===
  /** 是否自动暂停 */
  autoPauseEnabled: boolean

  /** 是否在单句字幕结束时暂停 */
  pauseOnSubtitleEnd: boolean

  /** 恢复播放延迟（毫秒） */
  resumeDelay: number

  // === 字幕设置 / Subtitle Settings ===
  /** 字幕显示模式 */
  subtitleDisplayMode: SubtitleDisplayMode

  // === 时间戳 / Timestamps ===
  /** 创建时间 */
  createdAt: string

  /** 更新时间 */
  updatedAt: string
}
