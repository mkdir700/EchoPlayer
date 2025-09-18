import { loggerService } from '@logger'
import {
  CodecCompatibilityChecker,
  type ExtendedErrorType,
  TranscodeService
} from '@renderer/services'
import { usePlayerStore } from '@renderer/state/stores/player.store'
import { useCallback, useEffect, useRef } from 'react'
import styled from 'styled-components'

import { usePlayerCommands } from '../hooks/usePlayerCommands'
import { usePlayerEngine } from '../hooks/usePlayerEngine'
import AutoResumeCountdown from './AutoResumeCountdown'
import SubtitleOverlay from './SubtitleOverlay'

const logger = loggerService.withContext('VideoSurface')

interface VideoSurfaceProps {
  src?: string
  onLoadedMetadata?: () => void
  onError?: (error: string, errorType?: ExtendedErrorType) => void
}

function VideoSurface({ src, onLoadedMetadata, onError }: VideoSurfaceProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const surfaceRef = useRef<HTMLDivElement>(null) // Container ref for SubtitleOverlay

  const isMountedRef = useRef<boolean>(true)

  const currentTime = usePlayerStore((s) => s.currentTime)
  const pause = usePlayerStore((s) => s.pause)

  // 转码状态管理
  // const hlsMode = usePlayerStore((s) => s.hlsMode) // TODO: 用于UI状态显示
  // const transcodeInfo = usePlayerStore((s) => s.transcodeInfo) // TODO: 用于缓存和状态显示
  const setTranscodeStatus = usePlayerStore((s) => s.setTranscodeStatus)
  const updateTranscodeInfo = usePlayerStore((s) => s.updateTranscodeInfo)
  const switchToHlsSource = usePlayerStore((s) => s.switchToHlsSource)
  // const resetTranscodeInfo = usePlayerStore((s) => s.resetTranscodeInfo) // TODO: 用于清理状态

  const { connectVideoElement, getMediaEventHandlers, orchestrator } = usePlayerEngine()
  const { playPause } = usePlayerCommands()

  // 转码处理函数
  const handleTranscodeRequest = useCallback(
    async (filePath: string, errorType: ExtendedErrorType) => {
      logger.info('开始转码处理', { filePath, errorType })

      try {
        // 设置转码开始状态
        setTranscodeStatus('transcoding')
        updateTranscodeInfo({
          originalSrc: src,
          error: undefined,
          startTime: Date.now()
        })

        // 调用转码服务
        const transcodeResult = await TranscodeService.requestTranscode({
          filePath,
          timeSeconds: currentTime || 0
        })

        logger.info('转码完成', { transcodeResult })

        // 更新转码信息
        updateTranscodeInfo({
          hlsSrc: transcodeResult.playlistUrl,
          windowId: transcodeResult.windowId,
          assetHash: transcodeResult.assetHash,
          profileHash: transcodeResult.profileHash,
          cached: transcodeResult.cached,
          endTime: Date.now()
        })

        // 切换到 HLS 播放源
        switchToHlsSource(transcodeResult.playlistUrl, {
          windowId: transcodeResult.windowId,
          assetHash: transcodeResult.assetHash,
          profileHash: transcodeResult.profileHash,
          cached: transcodeResult.cached
        })

        // 更新视频元素的 src 并通过引擎恢复播放位置
        const video = videoRef.current
        if (video) {
          const playbackPosition = video.currentTime
          video.src = transcodeResult.playlistUrl

          // 通过播放器引擎恢复播放位置（确保与状态管理一致）
          video.addEventListener(
            'loadedmetadata',
            () => {
              if (playbackPosition > 0) {
                // 优先使用播放器引擎来设置时间
                if (orchestrator && orchestrator.isVideoControllerConnected()) {
                  orchestrator.requestSeek(playbackPosition)
                  logger.debug('通过引擎恢复 HLS 播放位置', { position: playbackPosition })
                } else {
                  // 备用方案：直接设置
                  video.currentTime = playbackPosition
                  logger.debug('直接恢复 HLS 播放位置', { position: playbackPosition })
                }
              }
            },
            { once: true }
          )

          logger.debug('视频源已切换到 HLS', {
            hlsSrc: transcodeResult.playlistUrl,
            originalPosition: playbackPosition
          })
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        logger.error('转码失败', { filePath, error: errorMessage })

        // 设置转码失败状态
        setTranscodeStatus('failed')
        updateTranscodeInfo({
          error: errorMessage,
          endTime: Date.now()
        })

        // 通知上层处理错误
        onError?.(errorMessage, errorType)
      }
    },
    [
      src,
      currentTime,
      setTranscodeStatus,
      updateTranscodeInfo,
      switchToHlsSource,
      onError,
      orchestrator
    ]
  )

  // 处理点击播放/暂停
  const handleSurfaceClick = useCallback(() => {
    playPause()
    logger.debug('点击触发播放/暂停')
  }, [playPause])

  // 稳定的 video 元素引用处理
  const handleVideoRef = useCallback(
    (node: HTMLVideoElement | null) => {
      videoRef.current = node

      // 连接到新的播放器引擎
      if (node) {
        // 确保视频元素始终以暂停状态开始
        if (!node.paused) {
          node.pause()
          logger.debug('视频元素连接时确保暂停状态')
        }

        connectVideoElement(node)
        logger.debug('视频元素已连接到播放器引擎', { src: node.src })

        // 强制同步暂停状态到播放器引擎
        // 延迟执行确保引擎完全初始化
        setTimeout(() => {
          if (orchestrator) {
            orchestrator.onPause() // 确保引擎状态为暂停
            logger.debug('强制同步暂停状态到播放器引擎')
          }
        }, 10)
      }
    },
    [connectVideoElement, orchestrator]
  )

  // 获取媒体事件处理器
  const mediaEventHandlers = getMediaEventHandlers()

  // 处理视频元数据加载完成 - 处理元数据并恢复时间
  const handleLoadedMetadata = useCallback(() => {
    const video = videoRef.current
    if (!video || !isMountedRef.current) return

    logger.debug('视频元数据加载完成', {
      duration: video.duration,
      readyState: video.readyState,
      videoWidth: video.videoWidth,
      videoHeight: video.videoHeight
    })

    // 确保视频始终处于暂停状态（防止浏览器自动播放行为）
    if (!video.paused) {
      video.pause()
      logger.debug('视频自动暂停（防止意外播放）')
    }

    // 强制同步暂停状态到播放器引擎
    if (orchestrator) {
      orchestrator.onPause()
      logger.debug('元数据加载完成后强制同步暂停状态到播放器引擎')
    }

    // 恢复保存的播放时间（在元数据加载完成后执行，通过引擎统一调度）
    if (currentTime > 0 && Math.abs(video.currentTime - currentTime) > 0.1) {
      // 延迟一小段时间确保引擎完全准备就绪
      setTimeout(() => {
        if (orchestrator && orchestrator.isVideoControllerConnected()) {
          orchestrator.requestSeek(currentTime)
          logger.debug('通过引擎恢复视频时间', {
            restoredTime: currentTime
          })
        } else {
          // 备用方案：直接设置（如果引擎未连接）
          video.currentTime = currentTime
          logger.debug('直接恢复视频时间', {
            restoredTime: currentTime,
            videoCurrentTime: video.currentTime
          })
        }
      }, 50) // 短暂延迟确保引擎状态同步完成
    }

    onLoadedMetadata?.()
  }, [onLoadedMetadata, currentTime, orchestrator])

  // 处理播放结束
  const handleEnded = useCallback(() => {
    logger.debug('视频播放结束')
    pause()
  }, [pause])

  // 编解码器感知错误处理 - 作为主动检测的兜底方案
  const handleVideoError = useCallback(async () => {
    const video = videoRef.current
    if (!video || !video.error) return

    const error = video.error
    let errorMessage = '视频播放错误'
    let errorType: ExtendedErrorType = 'unknown'

    logger.debug('视频错误详情', {
      code: error.code,
      message: error.message,
      src,
      readyState: video.readyState,
      networkState: video.networkState
    })

    // 检查是否为 HLS 播放错误
    const isHlsUrl = src && (src.includes('.m3u8') || src.includes('playlist'))
    if (isHlsUrl) {
      logger.info('检测到 HLS URL 播放错误', {
        src,
        errorCode: error.code,
        errorMessage: error.message
      })

      // 检查常见的 HLS 播放器缺失错误
      if (
        error.code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED ||
        error.code === MediaError.MEDIA_ERR_DECODE ||
        error.message.includes('DEMUXER_ERROR_COULD_NOT_OPEN') ||
        error.message.includes('FFmpegDemuxer')
      ) {
        errorMessage = 'HLS 播放器尚未就绪，无法播放转码后的视频'
        errorType = 'hls-player-missing'

        logger.warn('HLS 播放器错误：转码已完成但 HLS 播放器未实现', {
          src,
          errorCode: error.code,
          errorMessage: error.message
        })

        onError?.(errorMessage, errorType)
        return
      }
    }

    // 基于MediaError代码进行初步分类
    switch (error.code) {
      case MediaError.MEDIA_ERR_ABORTED:
        errorMessage = '视频加载被中断'
        errorType = 'unknown'
        break
      case MediaError.MEDIA_ERR_NETWORK:
        errorMessage = '网络错误导致视频加载失败'
        errorType = 'network-error'
        break
      case MediaError.MEDIA_ERR_DECODE:
        errorMessage = '视频解码错误'
        errorType = 'decode-error'
        break
      case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
        // 对于"不支持的源"错误，进行深度编解码器兼容性分析
        if (src && src.startsWith('file://')) {
          try {
            // 从file://URL中提取文件路径
            const filePath = decodeURIComponent(src.replace('file://', ''))

            // 首先检查文件是否存在
            const fileExists = await window.api.fs.checkFileExists(filePath)

            if (!fileExists) {
              errorMessage = '视频文件不存在'
              errorType = 'file-missing'
              logger.info('文件存在性检查：文件不存在', { filePath, src })
            } else {
              // 文件存在，进行编解码器兼容性检测
              logger.info('文件存在，开始编解码器兼容性检测', { filePath })

              const compatibilityResult =
                await CodecCompatibilityChecker.checkCompatibility(filePath)

              logger.info('编解码器兼容性检测结果', {
                compatibilityResult,
                filePath
              })

              // 根据兼容性结果生成精确的错误类型和消息
              errorType =
                CodecCompatibilityChecker.getErrorTypeFromCompatibility(compatibilityResult)
              errorMessage = CodecCompatibilityChecker.generateErrorMessage(compatibilityResult)

              // 如果检测到需要转码，触发自动转码流程
              if (compatibilityResult.needsTranscode) {
                logger.warn('检测到不兼容的编解码器，开始自动转码', {
                  videoCodec: compatibilityResult.detectedCodecs.video,
                  audioCodec: compatibilityResult.detectedCodecs.audio,
                  videoSupported: compatibilityResult.videoSupported,
                  audioSupported: compatibilityResult.audioSupported,
                  reasons: compatibilityResult.incompatibilityReasons
                })

                // 触发转码处理，不直接抛出错误
                handleTranscodeRequest(filePath, errorType)
                return // 直接返回，不调用 onError
              }
            }
          } catch (checkError) {
            logger.error('编解码器兼容性检查失败', {
              src,
              checkError: checkError instanceof Error ? checkError.message : String(checkError)
            })
            errorMessage = '无法检测视频格式兼容性'
            errorType = 'codec-unsupported'
          }
        } else {
          errorMessage = '不支持的视频格式或路径'
          errorType = 'unsupported-format'
        }
        break
      default:
        errorMessage = error.message || '未知视频错误'
        errorType = 'unknown'
    }

    logger.error('最终视频错误处理结果:', {
      originalErrorCode: error.code,
      originalErrorMessage: error.message,
      src,
      finalErrorType: errorType,
      finalErrorMessage: errorMessage
    })

    onError?.(errorMessage, errorType)
  }, [onError, src, handleTranscodeRequest])

  // 组件卸载清理
  useEffect(() => {
    return () => {
      isMountedRef.current = false
      logger.debug('VideoSurface 组件卸载清理完成')
    }
  }, [])

  return (
    <Surface
      ref={surfaceRef}
      role="button"
      data-testid="video-surface"
      onClick={handleSurfaceClick}
      tabIndex={0}
    >
      <StyledVideo
        ref={handleVideoRef}
        src={src}
        onTimeUpdate={(e) => mediaEventHandlers.onTimeUpdate(e.nativeEvent)}
        onPlay={() => mediaEventHandlers.onPlay()}
        onPause={() => mediaEventHandlers.onPause()}
        onEnded={() => {
          mediaEventHandlers.onEnded()
          handleEnded()
        }}
        onSeeking={() => mediaEventHandlers.onSeeking()}
        onSeeked={(e) => mediaEventHandlers.onSeeked(e.nativeEvent)}
        onDurationChange={(e) => mediaEventHandlers.onDurationChange(e.nativeEvent)}
        onRateChange={(e) => mediaEventHandlers.onRateChange(e.nativeEvent)}
        onLoadedMetadata={handleLoadedMetadata}
        onError={handleVideoError}
        controlsList="nodownload"
        disablePictureInPicture={false}
        preload="metadata"
        autoPlay={false} // 明确禁用自动播放
        playsInline
        // 添加更多有用的事件处理
        // onCanPlay={() => {
        //   logger.debug('视频可以开始播放')
        // }}
        // onWaiting={() => {
        //   logger.debug('视频缓冲中')
        // }}
        // onStalled={() => {
        //   logger.warn('视频数据停滞')
        // }}
      />
      {/* 字幕覆盖层 - 传递容器引用以进行边界计算 */}
      <SubtitleOverlay containerRef={surfaceRef} />
      <AutoResumeCountdown />
    </Surface>
  )
}

export default VideoSurface

const Surface = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #000;
  cursor: pointer;

  /* 为字幕覆盖层提供定位上下文 */
  overflow: hidden;
`

const StyledVideo = styled.video`
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: #000;
`
