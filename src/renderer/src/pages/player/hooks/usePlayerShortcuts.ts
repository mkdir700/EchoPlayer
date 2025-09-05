import { loggerService } from '@logger'
import { useShortcut } from '@renderer/infrastructure/hooks/useShortcust'
import { SubtitleDisplayMode } from '@types'

import { usePlayerCommands } from './usePlayerCommands'
import useSubtitleOverlay from './useSubtitleOverlay'

const logger = loggerService.withContext('TransportBar')

export function usePlayerShortcuts() {
  const cmd = usePlayerCommands()
  const { setDisplayMode } = useSubtitleOverlay()

  useShortcut('play_pause', () => {
    cmd.playPause()
    logger.info('Shortcut play_pause')
  })

  // 重播当前字幕
  useShortcut('replay_current_subtitle', () => {
    cmd.replayBySubtitle()
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
  // useShortcut('toggle_fullscreen', () => {
  //   cmd.toggleFullscreen()
  //   logger.info('Shortcut toggle_fullscreen')
  // })
  // useShortcut('escape_fullscreen', () => {
  //   cmd.escapeFullscreen()
  //   logger.info('Shortcut escape_fullscreen')
  // })

  // 单句循环
  useShortcut('single_loop', () => {
    cmd.toggleLoopEnabled()
  })

  // 字幕显示模式切换
  useShortcut('subtitle_mode_none', () => {
    setDisplayMode(SubtitleDisplayMode.NONE)
    logger.info('字幕显示模式切换: 隐藏')
  })

  useShortcut('subtitle_mode_original', () => {
    setDisplayMode(SubtitleDisplayMode.ORIGINAL)
    logger.info('字幕显示模式切换: 仅原文')
  })

  useShortcut('subtitle_mode_translated', () => {
    setDisplayMode(SubtitleDisplayMode.TRANSLATED)
    logger.info('字幕显示模式切换: 仅译文')
  })

  useShortcut('subtitle_mode_bilingual', () => {
    setDisplayMode(SubtitleDisplayMode.BILINGUAL)
    logger.info('字幕显示模式切换: 双语显示')
  })
}
