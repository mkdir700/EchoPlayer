import { loggerService } from '@logger'
import { useShortcut } from '@renderer/infrastructure/hooks/useShortcut'
import { usePlayerStore } from '@renderer/state/stores/player.store'
import { SubtitleDisplayMode } from '@types'
import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'

import { usePlayerCommands } from './usePlayerCommands'
import useSubtitleOverlay from './useSubtitleOverlay'

const logger = loggerService.withContext('TransportBar')

/**
 * Registers global keyboard shortcuts for player controls and subtitle-related actions.
 *
 * Sets up shortcuts for playback (play/pause, seek, volume, loop), subtitle navigation
 * (previous/next, replay), subtitle display mode toggles (none/original/translated/bilingual),
 * subtitle panel toggle, cycling favorite playback rates, and copying the current subtitle to the clipboard.
 *
 * The copy action selects text according to the current subtitle display mode:
 * - ORIGINAL: original text
 * - TRANSLATED: translated text, falling back to original if missing
 * - BILINGUAL: original and translated joined by a newline
 * - NONE or unsupported: no copy performed
 *
 * Side effects:
 * - Invokes player command functions and store actions.
 * - Writes subtitle text to the clipboard via `navigator.clipboard.writeText`.
 * - Emits a `CustomEvent` named `subtitle-copied` with a localized success or failure message.
 * - Logs informational and error events via the module logger.
 */
export function usePlayerShortcuts() {
  const { t } = useTranslation()
  const cmd = usePlayerCommands()
  const { setDisplayMode, currentSubtitle } = useSubtitleOverlay()
  const { toggleSubtitlePanel, cycleFavoriteRateNext, cycleFavoriteRatePrev } = usePlayerStore()
  const displayMode = usePlayerStore((s) => s.subtitleOverlay.displayMode)

  // 复制字幕内容处理函数
  const handleCopySubtitle = useCallback(async () => {
    try {
      let textToCopy = ''

      if (currentSubtitle) {
        // 根据显示模式复制相应的字幕内容
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
            logger.warn('当前显示模式不支持复制')
            return // NONE 模式不复制
        }
        logger.info('复制字幕内容', {
          mode: displayMode,
          length: textToCopy.length
        })
      } else {
        logger.warn('没有当前字幕内容')
        return
      }

      if (textToCopy) {
        await navigator.clipboard.writeText(textToCopy)

        // 触发自定义事件显示toast
        window.dispatchEvent(
          new CustomEvent('subtitle-copied', {
            detail: {
              message: t('player.controls.copy.success')
            }
          })
        )
      }
    } catch (error) {
      logger.error('复制字幕失败', { error })

      // 错误情况下也使用toast显示
      window.dispatchEvent(
        new CustomEvent('subtitle-copied', {
          detail: {
            message: t('player.controls.copy.failed')
          }
        })
      )
    }
  }, [currentSubtitle, displayMode, t])

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
