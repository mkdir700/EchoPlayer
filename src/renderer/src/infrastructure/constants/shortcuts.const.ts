import { Shortcut } from '@types'

/**
 * 默认快捷键配置
 * 包含了视频播放、字幕控制和外观设置相关的快捷键
 */
export const DEFAULT_SHORTCUTS: Shortcut[] = [
  {
    key: 'play_pause',
    shortcut: ['Space'],
    editable: true,
    enabled: true,
    system: false
  },
  {
    key: 'seek_backward',
    shortcut: ['ArrowLeft'],
    editable: true,
    enabled: true,
    system: false
  },
  {
    key: 'seek_forward',
    shortcut: ['ArrowRight'],
    editable: true,
    enabled: true,
    system: false
  },
  {
    key: 'volume_up',
    shortcut: ['ArrowUp'],
    editable: true,
    enabled: true,
    system: false
  },
  {
    key: 'volume_down',
    shortcut: ['ArrowDown'],
    editable: true,
    enabled: true,
    system: false
  },
  {
    key: 'previous_subtitle',
    shortcut: ['A'],
    editable: true,
    enabled: true,
    system: false
  },
  {
    key: 'next_subtitle',
    shortcut: ['D'],
    editable: true,
    enabled: true,
    system: false
  },
  {
    key: 'single_loop',
    shortcut: ['R'],
    editable: true,
    enabled: true,
    system: false
  },
  {
    key: 'replay_current_subtitle',
    shortcut: ['S'],
    editable: true,
    enabled: true,
    system: false
  },
  {
    key: 'toggle_fullscreen',
    shortcut: ['F'],
    editable: true,
    enabled: true,
    system: false
  },
  {
    key: 'escape_fullscreen',
    shortcut: ['Escape'],
    editable: false,
    enabled: true,
    system: true
  },
  {
    key: 'subtitle_mode_none',
    shortcut: ['CommandOrControl', '1'],
    editable: true,
    enabled: true,
    system: false
  },
  {
    key: 'subtitle_mode_original',
    shortcut: ['CommandOrControl', '2'],
    editable: true,
    enabled: true,
    system: false
  },
  {
    key: 'subtitle_mode_translated',
    shortcut: ['CommandOrControl', '3'],
    editable: true,
    enabled: true,
    system: false
  },
  {
    key: 'subtitle_mode_bilingual',
    shortcut: ['CommandOrControl', '4'],
    editable: true,
    enabled: true,
    system: false
  },
  {
    key: 'toggle_subtitle_panel',
    shortcut: ['CommandOrControl', 'BracketRight'],
    editable: true,
    enabled: true,
    system: false
  }
]
