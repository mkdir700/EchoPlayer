import { loggerService } from '@logger'
import { SubtitleLibraryService } from '@renderer/services/SubtitleLibrary'
import { usePlayerSubtitlesStore } from '@renderer/state/stores/player-subtitles.store'
import { ASRProgress, ASRProgressStage, ASRResult } from '@shared/types'
import { message } from 'antd'
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

const logger = loggerService.withContext('useASRSubtitle')

export function useASRSubtitle(videoId: number | null, videoPath: string | null) {
  const { t } = useTranslation()
  const setSubtitles = usePlayerSubtitlesStore((s) => s.setSubtitles)

  const [asrEnabled, setAsrEnabled] = useState(false)
  const [showAsrPrompt, setShowAsrPrompt] = useState(false)
  const [showAsrProgress, setShowAsrProgress] = useState(false)
  const [asrProgress, setAsrProgress] = useState<ASRProgress>({
    taskId: '',
    stage: ASRProgressStage.Initializing,
    percent: 0
  })

  // Check if ASR is enabled (API key configured)
  useEffect(() => {
    const checkAsrEnabled = async () => {
      try {
        const apiKey = await window.api.config.get('deepgramApiKey')
        setAsrEnabled(!!apiKey && apiKey.trim().length > 0)
      } catch (error) {
        logger.error('Failed to check ASR enabled status', { error })
        setAsrEnabled(false)
      }
    }

    checkAsrEnabled()
  }, [])

  // Listen for ASR progress updates
  useEffect(() => {
    const handleProgress = (progress: ASRProgress) => {
      // 添加空值检查
      if (!progress || !progress.stage) {
        logger.warn('Received invalid ASR progress', { progress })
        return
      }

      setAsrProgress(progress)

      // Auto-close progress modal when complete
      if (progress.stage === ASRProgressStage.Complete) {
        setTimeout(() => {
          setShowAsrProgress(false)
        }, 2000)
      }
    }

    // 使用白名单方案的ASR进度订阅方法
    const unsubscribe = window.api.asr.onProgress(handleProgress)
    return unsubscribe
  }, [])

  const handleOpenASRGenerator = useCallback(() => {
    setShowAsrPrompt(true)
  }, [])

  const handleGenerateSubtitle = useCallback(
    async (language: string) => {
      setShowAsrPrompt(false)

      if (!videoPath || !videoId) {
        message.error(t('player.asr.errors.unknown', { message: 'No video path' }))
        return
      }

      try {
        setShowAsrProgress(true)
        setAsrProgress({
          taskId: '',
          stage: ASRProgressStage.ExtractingAudio,
          percent: 0
        })

        const result: ASRResult = await window.api.asr.generate({
          videoPath,
          language,
          videoId
        })

        // Success - reload subtitles from database
        if (result.success && result.subtitleLibraryId) {
          message.success(
            t('player.asr.success.message', { count: result.stats?.subtitleCount || 0 })
          )

          // Reload subtitles from database
          const svc = new SubtitleLibraryService()
          const subtitles = await svc.getSubtitlesForVideo(videoId)
          setSubtitles(subtitles)

          logger.info('ASR 字幕加载成功', {
            subtitleLibraryId: result.subtitleLibraryId,
            count: subtitles.length
          })
        } else {
          // Handle error response - prioritize errorCode over error message
          const errorCode = result.errorCode
          const errorMessage = result.error || 'Unknown error'

          // Log the error details for debugging
          logger.error('ASR generation failed with error code', {
            errorCode,
            errorMessage,
            fullResult: result
          })

          // Create error with code attached for upstream handling
          const error = new Error(errorMessage)
          if (errorCode) {
            ;(error as any).code = errorCode
          }
          throw error
        }
      } catch (error: any) {
        logger.error('ASR generation failed', error)
        setShowAsrProgress(false)

        // Prioritize errorCode from backend, fall back to string matching
        const errorCode = error.code
        const errorMessage = error.message || error.toString()

        // Map error codes to user-friendly messages
        let translationKey: string
        switch (errorCode) {
          case 'NO_API_KEY':
            translationKey = 'player.asr.errors.noApiKey'
            break
          case 'INVALID_API_KEY':
            translationKey = 'player.asr.errors.invalidApiKey'
            break
          case 'QUOTA_EXCEEDED':
            translationKey = 'player.asr.errors.apiQuotaExceeded'
            break
          case 'NETWORK_ERROR':
            translationKey = 'player.asr.errors.networkError'
            break
          case 'AUDIO_EXTRACTION_FAILED':
            translationKey = 'player.asr.errors.audioExtractionFailed'
            break
          case 'TASK_CANCELLED':
            // Don't show error for user-initiated cancellation
            return
          case 'SUBTITLE_EXTRACTION_FAILED':
            translationKey = 'player.asr.errors.transcriptionFailed'
            break
          case 'UNKNOWN_ERROR':
          default:
            // Fall back to string matching for legacy errors without codes
            if (!errorCode) {
              if (errorMessage.includes('API key') || errorMessage.includes('API Key')) {
                translationKey = 'player.asr.errors.invalidApiKey'
              } else if (errorMessage.includes('quota') || errorMessage.includes('配额')) {
                translationKey = 'player.asr.errors.apiQuotaExceeded'
              } else if (errorMessage.includes('network') || errorMessage.includes('网络')) {
                translationKey = 'player.asr.errors.networkError'
              } else if (errorMessage.includes('audio')) {
                translationKey = 'player.asr.errors.audioExtractionFailed'
              } else {
                translationKey = 'player.asr.errors.unknown'
              }
            } else {
              translationKey = 'player.asr.errors.unknown'
            }
        }

        // Show the error message
        if (translationKey === 'player.asr.errors.unknown') {
          message.error(t(translationKey, { message: errorMessage }))
        } else {
          message.error(t(translationKey))
        }
      }
    },
    [videoPath, videoId, t, setSubtitles]
  )

  const handleCancelAsr = useCallback(async () => {
    if (asrProgress?.taskId) {
      try {
        await window.api.asr.cancel(asrProgress.taskId)
        setShowAsrProgress(false)
        message.info(t('common.cancel'))
      } catch (error) {
        logger.error('Failed to cancel ASR task', { error })
      }
    } else {
      // 如果没有 taskId，直接关闭进度窗口
      setShowAsrProgress(false)
    }
  }, [asrProgress, t])

  const handleAsrLater = useCallback(() => {
    setShowAsrPrompt(false)
  }, [])

  return {
    asrEnabled,
    showAsrPrompt,
    showAsrProgress,
    asrProgress,
    handleOpenASRGenerator,
    handleGenerateSubtitle,
    handleCancelAsr,
    handleAsrLater
  }
}
