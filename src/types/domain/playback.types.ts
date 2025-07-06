/**
 * 播放控制领域类型定义
 * Playback Control Domain Type Definitions
 *
 * 基于现有 EchoLab 项目的播放控制功能设计
 * Based on existing EchoLab project's playback control features
 */

// 循环设置接口 / Loop Settings Interface
export interface LoopSettings {
  readonly count: number // -1=无限循环，0=关闭，2-50=指定次数循环 / -1=infinite, 0=off, 2-50=specific count
  readonly startTime?: number
  readonly endTime?: number
}

// 跳过设置接口 / Skip Settings Interface
export interface SkipSettings {
  readonly isEnabled: boolean
  readonly skipIntroSeconds: number
  readonly skipOutroSeconds: number
  readonly skipSilenceEnabled: boolean
  readonly silenceThreshold: number
}

// 播放模式枚举 / Playback Mode Enum
export enum PlaybackMode {
  NORMAL = 'normal',
  REPEAT_ONE = 'repeat_one',
  REPEAT_ALL = 'repeat_all',
  SHUFFLE = 'shuffle'
}

// 播放控制设置接口 / Playback Control Settings Interface
export interface PlaybackControlSettings {
  readonly volume: number
  readonly playbackRate: number
  readonly isAutoPlay: boolean
  readonly isAutoPause: boolean
  readonly isSingleLoop: boolean
  readonly loopSettings: LoopSettings
  readonly skipSettings: SkipSettings
  readonly mode: PlaybackMode
}

// 播放器状态接口 / Player State Interface
export interface PlayerState {
  readonly isPlaying: boolean
  readonly isPaused: boolean
  readonly isLoading: boolean
  readonly isMuted: boolean
  readonly hasError: boolean
  readonly errorMessage?: string
}

// 播放进度接口 / Playback Progress Interface
export interface PlaybackProgress {
  readonly currentTime: number
  readonly duration: number
  readonly buffered: number
  readonly played: number
  readonly loaded: number
  readonly playedSeconds: number
  readonly loadedSeconds: number
}

// 音量控制接口 / Volume Control Interface
export interface VolumeControl {
  readonly volume: number
  readonly isMuted: boolean
  readonly previousVolume: number
}

// 播放速度控制接口 / Playback Rate Control Interface
export interface PlaybackRateControl {
  readonly currentRate: number
  readonly availableRates: readonly number[]
  readonly customRates: readonly number[]
}

// 循环播放状态接口 / Loop Playback State Interface
export interface LoopPlaybackState {
  readonly isEnabled: boolean
  readonly currentCount: number
  readonly remainingCount: number
  readonly totalCount: number
  readonly isInfinite: boolean
}

// 自动暂停状态接口 / Auto Pause State Interface
export interface AutoPauseState {
  readonly isEnabled: boolean
  readonly pauseOnSubtitleEnd: boolean
  readonly pauseOnSentenceEnd: boolean
  readonly resumeDelay: number
}

// 播放器事件类型枚举 / Player Event Type Enum
export enum PlayerEventType {
  PLAY = 'play',
  PAUSE = 'pause',
  STOP = 'stop',
  SEEK = 'seek',
  TIME_UPDATE = 'timeupdate',
  DURATION_CHANGE = 'durationchange',
  VOLUME_CHANGE = 'volumechange',
  RATE_CHANGE = 'ratechange',
  ENDED = 'ended',
  ERROR = 'error',
  LOADED_DATA = 'loadeddata',
  LOADED_METADATA = 'loadedmetadata',
  CAN_PLAY = 'canplay',
  CAN_PLAY_THROUGH = 'canplaythrough'
}

// 播放器事件接口 / Player Event Interface
export interface PlayerEvent {
  readonly type: PlayerEventType
  readonly timestamp: Date
  readonly data?: unknown
}

// 播放会话接口 / Playback Session Interface
export interface PlaybackSession {
  readonly sessionId: string
  readonly videoId: string
  readonly startTime: Date
  readonly endTime?: Date
  readonly totalDuration: number
  readonly actualPlayTime: number
  readonly pauseCount: number
  readonly seekCount: number
  readonly loopCount: number
  readonly events: readonly PlayerEvent[]
}

// 播放统计接口 / Playback Statistics Interface
export interface PlaybackStatistics {
  readonly totalPlayTime: number
  readonly averagePlaybackRate: number
  readonly pauseFrequency: number
  readonly seekFrequency: number
  readonly loopUsage: number
  readonly completionRate: number
}
