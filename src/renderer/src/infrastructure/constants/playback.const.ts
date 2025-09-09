// 播放速度预设常量 / Playback Rate Presets Constants
export const PLAYBACK_RATE_PRESETS: number[] = [0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0] as const

// 音量设置常量 / Volume Settings Constants
export const VOLUME_SETTINGS = {
  MIN: 0,
  MAX: 1,
  DEFAULT: 0.8,
  STEP: 0.1,
  MUTE_THRESHOLD: 0.05
} as const

// 循环次数选项 / Loop Count Options
export const LOOP_COUNT_OPTIONS = [-1, 2, 3, 5, 10] as const

// TODO: 应该移动到 config 目录
// export const PLAYER_CONFIG = {
//   SEEK_STEP: 10, // 秒
//   VOLUME_STEP: 0.1,
//   RATE_STEP: 0.25,
//   AUTO_HIDE_CONTROLS_DELAY: 3000, // 毫秒
//   PROGRESS_UPDATE_INTERVAL: 100 // 毫秒
// } as const
