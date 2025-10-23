import { loggerService } from '@logger'
import { usePlayerSessionStore } from '@renderer/state/stores/player-session.store'
import { usePlayerSubtitlesStore } from '@renderer/state/stores/player-subtitles.store'
import { IpcChannel } from '@shared/IpcChannel'
import { useCallback, useState } from 'react'

const logger = loggerService.withContext('useSubtitleTranslation')

export interface TranslationState {
  isTranslating: boolean
  translatingId: string | null
  error: string | null
}

export interface UseSubtitleTranslationResult {
  translationState: TranslationState
  translateSubtitle: (subtitleId: string, text: string) => Promise<void>
  clearError: () => void
}

/**
 * 字幕翻译 Hook
 *
 * 提供单条字幕翻译功能，包括翻译状态管理和错误处理
 */
export function useSubtitleTranslation(): UseSubtitleTranslationResult {
  const { video } = usePlayerSessionStore()
  const updateSubtitle = usePlayerSubtitlesStore((s) => s.updateSubtitle)
  const subtitles = usePlayerSubtitlesStore((s) => s.subtitles)

  const [translationState, setTranslationState] = useState<TranslationState>({
    isTranslating: false,
    translatingId: null,
    error: null
  })

  const translateSubtitle = useCallback(
    async (subtitleId: string, text: string) => {
      if (!video) {
        logger.error('无法翻译：缺少视频信息')
        setTranslationState({
          isTranslating: false,
          translatingId: null,
          error: '无法翻译：缺少视频信息'
        })
        return
      }

      setTranslationState({
        isTranslating: true,
        translatingId: subtitleId,
        error: null
      })

      logger.info('开始翻译字幕', { subtitleId, text: text.substring(0, 50) })

      try {
        const result = await window.electron.ipcRenderer.invoke(
          IpcChannel.Translation_TranslateSubtitle,
          subtitleId,
          text,
          {
            videoId: video.id,
            videoFilename: video.title,
            targetLanguage: 'zh'
          }
        )

        if (result.success) {
          logger.info('字幕翻译成功', { subtitleId })

          // 更新前端的字幕数据
          const subtitleIndex = subtitles.findIndex((sub) => sub.id === subtitleId)
          if (subtitleIndex >= 0) {
            updateSubtitle(subtitleIndex, {
              translatedText: result.result.translatedText
            })
            logger.debug('更新前端字幕数据成功', { subtitleId, subtitleIndex })
          } else {
            logger.warn('未找到要更新的字幕索引', { subtitleId, subtitleIndex })
          }

          setTranslationState({
            isTranslating: false,
            translatingId: null,
            error: null
          })
        } else {
          const errorMessage = result.error || '翻译失败'
          logger.error('字幕翻译失败', { subtitleId, error: errorMessage })
          setTranslationState({
            isTranslating: false,
            translatingId: null,
            error: errorMessage
          })
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '翻译过程中发生错误'
        logger.error('字幕翻译异常', { subtitleId, error: errorMessage })
        setTranslationState({
          isTranslating: false,
          translatingId: null,
          error: errorMessage
        })
      }
    },
    [video, subtitles, updateSubtitle]
  )

  const clearError = useCallback(() => {
    setTranslationState((prev) => ({
      ...prev,
      error: null
    }))
  }, [])

  return {
    translationState,
    translateSubtitle,
    clearError
  }
}

export default useSubtitleTranslation
