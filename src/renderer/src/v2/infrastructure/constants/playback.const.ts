// 播放速度预设常量 / Playback Rate Presets Constants
export const PLAYBACK_RATE_PRESETS = [
  { value: 0.25, label: '0.25x' },
  { value: 0.5, label: '0.5x' },
  { value: 0.75, label: '0.75x' },
  { value: 1.0, label: '正常' },
  { value: 1.25, label: '1.25x' },
  { value: 1.5, label: '1.5x' },
  { value: 1.75, label: '1.75x' },
  { value: 2.0, label: '2.0x' }
] as const

// 音量设置常量 / Volume Settings Constants
export const VOLUME_SETTINGS = {
  MIN: 0,
  MAX: 1,
  DEFAULT: 0.8,
  STEP: 0.1,
  MUTE_THRESHOLD: 0.05
} as const

// 循环次数选项 / Loop Count Options
export const LOOP_COUNT_OPTIONS = [
  { value: -1, label: '无限循环' },
  { value: 2, label: '2次' },
  { value: 3, label: '3次' },
  { value: 5, label: '5次' },
  { value: 10, label: '10次' }
] as const

// 播放器配置常量 / Player Config Constants
export const PLAYER_CONFIG = {
  SEEK_STEP: 10, // 秒
  VOLUME_STEP: 0.1,
  RATE_STEP: 0.25,
  AUTO_HIDE_CONTROLS_DELAY: 3000, // 毫秒
  PROGRESS_UPDATE_INTERVAL: 100 // 毫秒
} as const
