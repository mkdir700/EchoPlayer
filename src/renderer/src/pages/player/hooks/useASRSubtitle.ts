import { loggerService } from '@logger'
import { SubtitleLibraryService } from '@renderer/services/SubtitleLibrary'
import { usePlayerSubtitlesStore } from '@renderer/state/stores/player-subtitles.store'
import { IpcChannel } from '@shared/IpcChannel'
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

    window.api.on(IpcChannel.ASR_Progress, handleProgress)
    return () => {
      window.api.off(IpcChannel.ASR_Progress)
    }
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
        } else if (result.error) {
          throw new Error(result.error)
        } else {
          throw new Error('ASR generation completed but no subtitle library ID returned')
        }
      } catch (error: any) {
        logger.error('ASR generation failed', error)
        setShowAsrProgress(false)

        // Show appropriate error message
        const errorMsg = error.message || error.toString()
        if (errorMsg.includes('API key')) {
          message.error(t('player.asr.errors.invalidApiKey'))
        } else if (errorMsg.includes('quota')) {
          message.error(t('player.asr.errors.apiQuotaExceeded'))
        } else if (errorMsg.includes('network')) {
          message.error(t('player.asr.errors.networkError'))
        } else if (errorMsg.includes('audio')) {
          message.error(t('player.asr.errors.audioExtractionFailed'))
        } else {
          message.error(t('player.asr.errors.unknown', { message: errorMsg }))
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
