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
    shortcut: ['H'],
    editable: true,
    enabled: true,
    system: false
  },
  {
    key: 'next_subtitle',
    shortcut: ['L'],
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
  }
]
