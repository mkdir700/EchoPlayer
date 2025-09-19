import { loggerService } from '@logger'
import {
  type ExtendedErrorType,
  TranscodeService,
  type VideoFormatDetectionResult,
  VideoFormatDetector
} from '@renderer/services'
import { usePlayerStore } from '@renderer/state/stores/player.store'
import { useCallback, useEffect, useState } from 'react'

import HLSVideoSurface from './HLSVideoSurface'
import VideoSurface from './VideoSurface'

const logger = loggerService.withContext('PlayerSelector')

interface PlayerSelectorProps {
  src?: string
  onLoadedMetadata?: () => void
  onError?: (error: string, errorType?: ExtendedErrorType) => void
}

type PlayerType = 'native' | 'hls'

/**
 * 智能播放器选择器组件
 *
 * 根据视频格式和播放状态智能选择使用原生 VideoSurface 还是 HLS 播放器
 * 提供与原始 VideoSurface 完全兼容的接口，支持无缝播放器切换
 * 选择策略基于环境动态调整：性能、网络状况、浏览器兼容性等
 */
function PlayerSelector({ src, onLoadedMetadata, onError }: PlayerSelectorProps) {
  const [playerType, setPlayerType] = useState<PlayerType>('native')
  const [formatDetectionResult, setFormatDetectionResult] =
    useState<VideoFormatDetectionResult | null>(null)

  // 播放器切换状态管理
  const [isPlayerSwitching, setIsPlayerSwitching] = useState(false)
  const [savedPlayerState, setSavedPlayerState] = useState<{
    currentTime: number
    volume: number
    muted: boolean
    playbackRate: number
    paused: boolean
  } | null>(null)

  // 性能优化：缓存上一次的源文件，避免重复检测
  const [lastDetectedSrc, setLastDetectedSrc] = useState<string | null>(null)
  const [isDetectionInProgress, setIsDetectionInProgress] = useState(false)

  // 从 store 获取 HLS 相关状态
  const hlsMode = usePlayerStore((s) => s.hlsMode)
  const hlsSrc = usePlayerStore((s) => s.transcodeInfo.hlsSrc)
  const currentTime = usePlayerStore((s) => s.currentTime)

  // 从 store 获取完整播放器状态（用于切换时状态保存）
  const volume = usePlayerStore((s) => s.volume)
  const muted = usePlayerStore((s) => s.muted)
  const playbackRate = usePlayerStore((s) => s.playbackRate)
  const paused = usePlayerStore((s) => s.paused)

  // 从 store 获取转码相关的 actions
  const setTranscodeStatus = usePlayerStore((s) => s.setTranscodeStatus)
  const updateTranscodeInfo = usePlayerStore((s) => s.updateTranscodeInfo)
  const switchToHlsSource = usePlayerStore((s) => s.switchToHlsSource)

  /**
   * 保存当前播放器状态（切换前）
   */
  const savePlayerState = useCallback(() => {
    const state = {
      currentTime,
      volume,
      muted,
      playbackRate,
      paused
    }

    logger.debug('保存播放器状态', { state })
    setSavedPlayerState(state)
    return state
  }, [currentTime, volume, muted, playbackRate, paused])

  /**
   * 恢复播放器状态（切换后）
   */
  const restorePlayerState = useCallback(() => {
    if (!savedPlayerState) {
      logger.debug('没有保存的状态可恢复')
      return
    }

    logger.debug('恢复播放器状态', { savedState: savedPlayerState })

    // 注意：这里不直接调用 store 的 actions，因为这些应该由 PlayerOrchestrator 管理
    // 而是通过事件或回调的方式通知上层进行状态恢复
    // 这样可以保持架构的一致性

    // 清除保存的状态
    setSavedPlayerState(null)
  }, [savedPlayerState])

  /**
   * 执行播放器切换
   */
  const performPlayerSwitch = useCallback(
    (newType: PlayerType, reason: string) => {
      if (newType === playerType) {
        logger.debug('播放器类型相同，跳过切换', { currentType: playerType, newType })
        return
      }

      logger.info('开始播放器切换', {
        from: playerType,
        to: newType,
        reason
      })

      setIsPlayerSwitching(true)

      // 保存当前状态
      const state = savePlayerState()

      // 切换播放器类型
      setPlayerType(newType)

      // 切换完成后恢复状态（通过 useEffect 监听）
      logger.debug('播放器切换状态已更新', {
        newType,
        savedState: state
      })
    },
    [playerType, savePlayerState]
  )

  /**
   * 智能播放器类型选择逻辑
   * 基于格式检测结果、浏览器兼容性和环境条件动态选择
   */
  const selectPlayerType = useCallback(
    (detectionResult: VideoFormatDetectionResult): PlayerType => {
      logger.debug('执行播放器类型选择', {
        detectionResult: {
          needsTranscode: detectionResult.needsTranscode,
          recommendedPlayerType: detectionResult.recommendedPlayerType,
          fileFormat: detectionResult.fileFormat.extension,
          confidence: detectionResult.fileFormat.confidence
        },
        environment: {
          hardwareConcurrency: navigator.hardwareConcurrency
        }
      })

      // 如果检测结果明确建议转码，直接选择 HLS
      if (detectionResult.needsTranscode) {
        logger.info('格式检测建议转码，选择 HLS 播放器', {
          reason: 'needsTranscode',
          confidence: detectionResult.fileFormat.confidence
        })
        return 'hls'
      }

      // 如果明确建议使用 HLS 播放器且置信度超过动态阈值
      if (detectionResult.recommendedPlayerType === 'hls') {
        logger.info('格式检测建议 HLS 播放器且置信度较高，选择 HLS', {
          confidence: detectionResult.fileFormat.confidence
        })
        return 'hls'
      }

      // 检查浏览器对 MIME 类型的支持情况
      if (detectionResult.mimeType.supportLevel === 'no') {
        logger.info('浏览器不支持该 MIME 类型，选择 HLS 播放器', {
          mimeType: detectionResult.mimeType.mimeType,
          supportLevel: detectionResult.mimeType.supportLevel
        })
        return 'hls'
      }

      // 默认优先使用原生播放器（性能更好）
      logger.info('使用原生播放器作为默认选择', {
        confidence: detectionResult.fileFormat.confidence,
        browserSupported: detectionResult.mimeType.browserSupported
      })
      return 'native'
    },
    []
  )

  // 触发转码并切换到 HLS 播放器
  const triggerTranscode = useCallback(
    async (filePath: string) => {
      if (!filePath.startsWith('file://')) {
        logger.warn('仅支持本地文件转码', { filePath })
        return
      }

      try {
        const actualPath = decodeURIComponent(filePath.replace('file://', ''))

        logger.info('开始视频转码', { filePath: actualPath, currentTime })

        // 更新转码状态为进行中
        setTranscodeStatus('transcoding')
        updateTranscodeInfo({
          originalSrc: actualPath,
          startTime: Date.now()
        })

        // 调用转码服务
        const transcodeResult = await TranscodeService.requestTranscode({
          filePath: actualPath,
          timeSeconds: currentTime || 0
        })

        if (transcodeResult.success) {
          logger.info('转码完成，切换到 HLS 播放器', {
            playlistUrl: transcodeResult.playlistUrl,
            cached: transcodeResult.cached,
            assetHash: transcodeResult.assetHash,
            profileHash: transcodeResult.profileHash,
            transcodeTime: transcodeResult.transcodeTime
          })

          // 更新转码信息，包含完整的转码结果
          updateTranscodeInfo({
            status: 'completed',
            endTime: Date.now(),
            cached: transcodeResult.cached,
            windowId: transcodeResult.windowId,
            assetHash: transcodeResult.assetHash,
            profileHash: transcodeResult.profileHash
          })

          // 切换到 HLS 源
          switchToHlsSource(transcodeResult.playlistUrl, {
            status: 'completed',
            endTime: Date.now(),
            cached: transcodeResult.cached,
            windowId: transcodeResult.windowId
          })
        } else {
          logger.error('转码失败')
          setTranscodeStatus('failed')
          updateTranscodeInfo({
            endTime: Date.now()
          })
        }
      } catch (error) {
        logger.error('转码过程发生错误', {
          error: error instanceof Error ? error.message : String(error)
        })
        setTranscodeStatus('failed')
        updateTranscodeInfo({
          endTime: Date.now()
        })
      }
    },
    [currentTime, setTranscodeStatus, updateTranscodeInfo, switchToHlsSource]
  )

  // 对视频源进行格式检测
  useEffect(() => {
    if (!src) {
      setFormatDetectionResult(null)
      setLastDetectedSrc(null)
      return
    }

    // 性能优化：避免重复检测相同的源
    if (src === lastDetectedSrc) {
      logger.debug('源文件未变化，跳过重复检测', { src })
      return
    }

    // 如果正在检测中，跳过新的检测请求
    if (isDetectionInProgress) {
      logger.debug('格式检测正在进行中，跳过新请求', { src })
      return
    }

    // 对于非本地文件，跳过详细检测
    if (!src.startsWith('file://')) {
      logger.debug('非本地文件，跳过格式检测', { src })
      setLastDetectedSrc(src)
      return
    }

    const detectFormat = async () => {
      try {
        setIsDetectionInProgress(true)
        logger.debug('开始视频格式检测', { src })

        // 使用智能检测，根据文件扩展名自动选择检测级别
        const result = await VideoFormatDetector.smartDetection(src)

        logger.info('视频格式检测完成', {
          src,
          result: {
            needsTranscode: result.needsTranscode,
            recommendedPlayerType: result.recommendedPlayerType,
            fileFormat: result.fileFormat,
            detectionLevel: result.detectionLevel
          }
        })

        setFormatDetectionResult(result)

        // 使用智能选择逻辑确定播放器类型
        const selectedType = selectPlayerType(result)

        // 如果选择的播放器类型与当前不同，进行切换
        if (selectedType !== playerType) {
          performPlayerSwitch(selectedType, '格式检测结果')

          // 如果选择 HLS 但检测建议需要转码，预先触发转码
          if (selectedType === 'hls' && result.needsTranscode && !hlsMode) {
            logger.info('预选择 HLS 播放器且需要转码，预先触发转码流程')
            triggerTranscode(src)
          }
        }

        // 标记检测完成，缓存当前源
        setLastDetectedSrc(src)
      } catch (error) {
        logger.error('视频格式检测失败', {
          src,
          error: error instanceof Error ? error.message : String(error)
        })
      } finally {
        // 无论成功失败，都要重置检测状态
        setIsDetectionInProgress(false)
      }
    }

    detectFormat()
  }, [
    src,
    hlsMode,
    playerType,
    selectPlayerType,
    triggerTranscode,
    performPlayerSwitch,
    lastDetectedSrc,
    isDetectionInProgress
  ])

  // 处理原生播放器错误 - 基于格式检测结果和错误类型进行智能处理
  const handleNativeError = useCallback(
    (error: string, errorType?: ExtendedErrorType) => {
      logger.info('原生播放器发生错误，基于格式检测结果进行处理', {
        error,
        errorType,
        currentSrc: src,
        formatDetectionResult
      })

      // 如果有格式检测结果，基于检测结果判断
      if (formatDetectionResult) {
        if (formatDetectionResult.needsTranscode) {
          logger.info('格式检测确认需要转码，开始转码流程')
          if (src) {
            triggerTranscode(src)
          }
          return
        }
      }

      // 基于错误类型进行传统判断
      const isCodecError =
        errorType === 'codec-unsupported' ||
        errorType === 'unsupported-format' ||
        errorType === 'h265-unsupported' ||
        errorType === 'video-codec-unsupported' ||
        errorType === 'audio-codec-unsupported' ||
        error.includes('codec') ||
        error.includes('format')

      if (isCodecError) {
        logger.info('基于错误类型检测到编解码器错误，开始转码流程')
        if (src) {
          triggerTranscode(src)
        }
      } else {
        // 对于其他类型的错误，直接传递给上层处理
        logger.warn('非编解码器相关错误，传递给上层处理', { error, errorType })
        onError?.(error, errorType)
      }
    },
    [src, onError, formatDetectionResult, triggerTranscode]
  )

  // 处理 HLS 播放器错误
  const handleHlsError = useCallback(
    (error: string, errorType?: ExtendedErrorType) => {
      logger.error('HLS 播放器发生错误', { error, errorType })
      // HLS 播放器错误通常是转码服务问题，直接传递给上层
      onError?.(error, errorType)
    },
    [onError]
  )

  // 监听 HLS 模式变化，自动切换播放器类型
  useEffect(() => {
    if (hlsMode && hlsSrc && playerType !== 'hls') {
      logger.info('检测到 HLS 模式激活，切换到 HLS 播放器', { hlsSrc })
      performPlayerSwitch('hls', 'HLS 模式激活')
    } else if (!hlsMode && playerType !== 'native') {
      logger.info('HLS 模式关闭，切换回原生播放器')
      performPlayerSwitch('native', 'HLS 模式关闭')
    }
  }, [hlsMode, hlsSrc, playerType, performPlayerSwitch])

  // 监听播放器切换完成，恢复状态
  useEffect(() => {
    if (isPlayerSwitching && savedPlayerState) {
      // 延迟一小段时间确保新播放器完全初始化
      const timer = setTimeout(() => {
        logger.info('播放器切换完成，准备恢复状态')
        restorePlayerState()
        setIsPlayerSwitching(false)
      }, 100) // 100ms 延迟，确保组件重渲染完成

      return () => clearTimeout(timer)
    }
    // 明确返回 undefined 以满足 TypeScript
    return undefined
  }, [isPlayerSwitching, savedPlayerState, restorePlayerState])

  // 根据当前播放器类型渲染对应的组件
  if (playerType === 'hls' && hlsSrc) {
    logger.debug('渲染 HLS 播放器', { hlsSrc })
    return (
      <HLSVideoSurface src={hlsSrc} onLoadedMetadata={onLoadedMetadata} onError={handleHlsError} />
    )
  }

  // 默认渲染原生播放器
  logger.debug('渲染原生播放器', { src })
  return <VideoSurface src={src} onLoadedMetadata={onLoadedMetadata} onError={handleNativeError} />
}

export default PlayerSelector
