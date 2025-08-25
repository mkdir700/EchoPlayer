import { loggerService } from '@logger'
import { useShortcut } from '@renderer/infrastructure/hooks/system/useShortcust'

import { usePlayerCommands } from './usePlayerCommands'

const logger = loggerService.withContext('TransportBar')

// 集中注册快捷键，统一委托给命令层，确保按钮与快捷键一致
export function usePlayerShortcuts() {
  const cmd = usePlayerCommands()

  useShortcut('play_pause', () => {
    cmd.playPause()
    logger.info('Shortcut play_pause')
  })

  // 跳转
  useShortcut('seek_backward', () => cmd.seekBackwardByStep())
  useShortcut('seek_forward', () => cmd.seekForwardByStep())

  // 音量
  useShortcut('volume_up', () => cmd.volumeUpByStep())
  useShortcut('volume_down', () => cmd.volumeDownByStep())

  // 字幕
  useShortcut('previous_subtitle', () => cmd.goToPreviousSubtitle())
  useShortcut('next_subtitle', () => cmd.goToNextSubtitle())

  // 全屏
  useShortcut('toggle_fullscreen', () => {
    cmd.toggleFullscreen()
    logger.info('Shortcut toggle_fullscreen')
  })
  useShortcut('escape_fullscreen', () => {
    cmd.escapeFullscreen()
    logger.info('Shortcut escape_fullscreen')
  })

  // 单句循环
  useShortcut('single_loop', () => {
    cmd.singleLoop()
    logger.info('Shortcut single_loop')
  })
}
