import { loggerService } from '@logger'
import { useShortcut } from '@renderer/infrastructure/hooks/useShortcut'
import { NotificationService } from '@renderer/services/NotificationService'
import { usePlayerStore } from '@renderer/state/stores/player.store'
import { SubtitleDisplayMode } from '@types'
import { useCallback } from 'react'

import { usePlayerCommands } from './usePlayerCommands'
import useSubtitleOverlay from './useSubtitleOverlay'

const logger = loggerService.withContext('TransportBar')

export function usePlayerShortcuts() {
  const cmd = usePlayerCommands()
  const { setDisplayMode, currentSubtitle } = useSubtitleOverlay()
  const { toggleSubtitlePanel, cycleFavoriteRateNext, cycleFavoriteRatePrev } = usePlayerStore()
  const displayMode = usePlayerStore((s) => s.subtitleOverlay.displayMode)

  // 复制字幕内容处理函数
  const handleCopySubtitle = useCallback(async () => {
    try {
      const selection = window.getSelection()
      const selectedText = selection?.toString().trim()

      let textToCopy = ''

      if (selectedText) {
        // 有选中文本，复制选中内容
        textToCopy = selectedText
        logger.info('复制选中文本', { length: selectedText.length })
      } else if (currentSubtitle) {
        // 没有选中，复制当前字幕句子
        switch (displayMode) {
          case SubtitleDisplayMode.ORIGINAL:
            textToCopy = currentSubtitle.originalText
            break
          case SubtitleDisplayMode.TRANSLATED:
            textToCopy = currentSubtitle.translatedText || currentSubtitle.originalText
            break
          case SubtitleDisplayMode.BILINGUAL: {
            const texts = [currentSubtitle.originalText, currentSubtitle.translatedText].filter(
              Boolean
            )
            textToCopy = texts.join('\n')
            break
          }
          default:
            return // NONE 模式不复制
        }
        logger.info('复制当前字幕', {
          mode: displayMode,
          length: textToCopy.length
        })
      } else {
        logger.warn('没有可复制的字幕内容')
        return
      }

      if (textToCopy) {
        await navigator.clipboard.writeText(textToCopy)

        // 显示成功通知
        NotificationService.getInstance().send({
          id: `copy-subtitle-${Date.now()}`,
          type: 'success',
          title: '复制成功',
          message: selectedText
            ? `已复制选中文本到剪贴板 (${selectedText.length} 字符)`
            : '已复制字幕内容到剪贴板',
          timestamp: Date.now(),
          source: 'update'
        })
      }
    } catch (error) {
      logger.error('复制字幕失败', { error })

      NotificationService.getInstance().send({
        id: `copy-error-${Date.now()}`,
        type: 'error',
        title: '复制失败',
        message: '无法访问剪贴板',
        timestamp: Date.now(),
        source: 'update'
      })
    }
  }, [currentSubtitle, displayMode])

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

  // 字幕面板切换
  useShortcut('toggle_subtitle_panel', () => {
    toggleSubtitlePanel()
    logger.info('字幕面板切换')
  })

  // 播放速度切换
  useShortcut('playback_rate_next', () => {
    cycleFavoriteRateNext()
    logger.info('播放速度切换: 下一个常用速度')
  })

  useShortcut('playback_rate_prev', () => {
    cycleFavoriteRatePrev()
    logger.info('播放速度切换: 上一个常用速度')
  })

  // 复制字幕内容
  useShortcut('copy_subtitle', () => {
    handleCopySubtitle()
  })
}
