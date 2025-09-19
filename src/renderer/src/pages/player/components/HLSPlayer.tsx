import { loggerService } from '@logger'
import { type ExtendedErrorType } from '@renderer/services'
import { usePlayerStore } from '@renderer/state/stores/player.store'
import Hls from 'hls.js'
import { useCallback, useEffect, useRef } from 'react'
import styled from 'styled-components'

import { usePlayerEngine } from '../hooks/usePlayerEngine'

const logger = loggerService.withContext('HLSPlayer')

interface HLSPlayerProps {
  src?: string
  onLoadedMetadata?: () => void
  onError?: (error: string, errorType?: ExtendedErrorType) => void
}

function HLSPlayer({ src, onLoadedMetadata, onError }: HLSPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<Hls | null>(null)
  const isMountedRef = useRef<boolean>(true)
  const isReadyRef = useRef<boolean>(false)
  const currentSrcRef = useRef<string>('')

  const { connectVideoElement, getMediaEventHandlers } = usePlayerEngine()

  const hlsMode = usePlayerStore((s) => s.hlsMode)
  const hlsSrc = usePlayerStore((s) => s.transcodeInfo.hlsSrc)
  const transcodeStatus = usePlayerStore((s) => s.transcodeInfo.status)
  const pause = usePlayerStore((s) => s.pause)

  // 修复播放源逻辑：只有在转码完成且有有效 HLS 源时才使用 HLS 模式
  const actualSrc = hlsMode && hlsSrc && transcodeStatus === 'completed' ? hlsSrc : src

  // 稳定的 video 元素引用处理，延迟连接直到准备完成
  const handleVideoRef = useCallback(
    (node: HTMLVideoElement | null) => {
      videoRef.current = node
      isReadyRef.current = false

      if (node && isMountedRef.current) {
        const currentSrc = currentSrcRef.current
        // 对于非 HLS 视频，立即连接
        if (!currentSrc?.includes('.m3u8')) {
          connectVideoElement(node)
          isReadyRef.current = true
          logger.debug('非HLS视频元素已连接到播放器引擎')
        }
        // HLS 视频会在 loadedmetadata 事件后连接
      }
    },
    [connectVideoElement]
  )

  // 处理元数据加载完成 - 在这时连接到播放器引擎
  const handleLoadedMetadata = useCallback(() => {
    logger.debug('HLS视频元数据加载完成')

    // 对于 HLS 视频，在元数据加载完成后才连接到引擎
    const currentSrc = currentSrcRef.current
    if (videoRef.current && !isReadyRef.current && currentSrc?.includes('.m3u8')) {
      connectVideoElement(videoRef.current)
      isReadyRef.current = true
      logger.debug('HLS视频元素已连接到播放器引擎')
    }

    onLoadedMetadata?.()
  }, [onLoadedMetadata, connectVideoElement])

  // 处理视频播放结束
  const handleEnded = useCallback(() => {
    logger.debug('HLS视频播放结束')
    pause()
  }, [pause])

  // HLS视频播放错误处理
  const handleError = useCallback(() => {
    const video = videoRef.current
    if (!video?.error) return

    const error = video.error
    const currentSrc = currentSrcRef.current
    const isHLS = currentSrc?.includes('.m3u8')
    let errorMessage = '视频播放错误'
    let errorType: ExtendedErrorType = 'unknown'

    logger.debug('HLS视频播放错误', {
      code: error.code,
      message: error.message,
      src: currentSrc,
      readyState: video.readyState,
      networkState: video.networkState
    })

    // 基于 MediaError 代码进行分类
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
        errorMessage = isHLS ? 'HLS解码错误' : '视频解码错误'
        errorType = 'decode-error'
        break
      case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
        errorMessage = isHLS ? '不支持的HLS格式' : '不支持的视频格式'
        errorType = 'unsupported-format'
        break
      default:
        errorMessage = error.message || '未知视频错误'
        errorType = 'unknown'
    }

    logger.error('HLS视频播放错误', {
      errorType,
      errorMessage,
      src: currentSrc,
      mediaError: {
        code: error.code,
        message: error.message
      }
    })

    onError?.(errorMessage, errorType)
  }, [onError])

  // HLS 初始化逻辑
  useEffect(() => {
    if (!actualSrc || !videoRef.current) return

    // 避免重复初始化相同的源
    if (currentSrcRef.current === actualSrc) {
      logger.debug('相同源，跳过重新初始化', { actualSrc })
      return
    }

    const videoElement = videoRef.current
    logger.debug('HLS 初始化开始', {
      actualSrc,
      previousSrc: currentSrcRef.current,
      isM3U8: actualSrc.includes('.m3u8')
    })

    // 更新当前源
    currentSrcRef.current = actualSrc

    // 重置准备状态
    isReadyRef.current = false

    // 清理现有 HLS
    if (hlsRef.current) {
      logger.debug('清理现有 HLS 实例')
      hlsRef.current.destroy()
      hlsRef.current = null
    }

    // 非 HLS 直接播放
    if (!actualSrc.includes('.m3u8')) {
      videoElement.src = actualSrc
      logger.debug('非HLS模式：设置原生视频源')
      return
    }

    // Safari 原生 HLS
    if (!Hls.isSupported()) {
      if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
        videoElement.src = actualSrc
        logger.debug('Safari原生HLS：设置视频源')
      } else {
        logger.error('浏览器不支持HLS播放')
        onError?.('不支持 HLS 播放', 'hls-playback-error')
      }
      return
    }

    // HLS.js 模式 - 针对音频分离流的优化配置
    const hls = new Hls({
      enableWorker: true,
      lowLatencyMode: true
    })
    hlsRef.current = hls

    // 增强的 HLS 错误处理与自动恢复
    hls.on(Hls.Events.ERROR, (_event, data) => {
      logger.debug('HLS错误事件', {
        type: data.type,
        details: data.details,
        fatal: data.fatal,
        errorAction: data.errorAction
      })

      if (data.fatal) {
        logger.error('HLS致命错误', { data })
        let message = 'HLS 播放错误'

        switch (data.type) {
          case Hls.ErrorTypes.NETWORK_ERROR:
            message = 'HLS 网络错误'
            // 尝试重新加载源
            logger.info('尝试从网络错误中恢复')
            hls.startLoad()
            break
          case Hls.ErrorTypes.MEDIA_ERROR:
            message = 'HLS 媒体错误'
            // 尝试媒体错误恢复
            logger.info('尝试从媒体错误中恢复')
            hls.recoverMediaError()
            break
          default:
            // 其他致命错误，销毁并重新创建
            logger.error('HLS无法恢复的错误，需要重新初始化')
            onError?.(message, 'hls-playback-error')
            break
        }
      } else {
        // 处理非致命错误，特别是 bufferStalledError
        if (data.details === 'bufferStalledError') {
          logger.warn('检测到缓冲停滞错误，尝试恢复', {
            currentTime: videoRef.current?.currentTime,
            buffered: videoRef.current?.buffered.length
          })

          // 尝试多种恢复策略
          setTimeout(() => {
            if (videoRef.current && hlsRef.current) {
              // 策略1: 微调播放位置
              const currentTime = videoRef.current.currentTime
              videoRef.current.currentTime = currentTime + 0.1

              // 策略2: 如果微调无效，重新开始加载
              setTimeout(() => {
                if (videoRef.current && videoRef.current.paused && hlsRef.current) {
                  logger.info('微调无效，重新开始加载')
                  hlsRef.current.startLoad()
                }
              }, 500)
            }
          }, 100)
        } else {
          logger.debug('HLS非致命错误（正常行为）', {
            type: data.type,
            details: data.details
          })
        }
      }
    })

    // HLS 事件监听
    hls.on(Hls.Events.MEDIA_ATTACHED, () => {
      logger.debug('HLS媒体附加成功')
    })

    hls.on(Hls.Events.MANIFEST_LOADED, () => {
      logger.debug('HLS清单加载成功')
    })

    hls.loadSource(actualSrc)
    hls.attachMedia(videoElement)

    return () => {
      logger.debug('HLS清理开始')
      if (hlsRef.current) {
        hlsRef.current.destroy()
        hlsRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actualSrc])

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      isMountedRef.current = false
      currentSrcRef.current = ''

      // 确保 HLS 实例被正确清理
      if (hlsRef.current) {
        logger.debug('组件卸载时清理 HLS 实例')
        hlsRef.current.destroy()
        hlsRef.current = null
      }
    }
  }, [])

  // 从播放器引擎获取事件处理器 - 使用稳定引用
  const mediaEventHandlers = getMediaEventHandlers()

  return (
    <PlayerContainer data-testid="hls-player">
      <StyledVideo
        ref={handleVideoRef}
        src={!actualSrc?.includes('.m3u8') ? actualSrc : undefined}
        onPlay={() => mediaEventHandlers.onPlay()}
        onPause={() => mediaEventHandlers.onPause()}
        onTimeUpdate={(e) => mediaEventHandlers.onTimeUpdate(e.nativeEvent)}
        onSeeking={() => mediaEventHandlers.onSeeking()}
        onSeeked={(e) => mediaEventHandlers.onSeeked(e.nativeEvent)}
        onDurationChange={(e) => mediaEventHandlers.onDurationChange(e.nativeEvent)}
        onRateChange={(e) => mediaEventHandlers.onRateChange(e.nativeEvent)}
        onLoadedMetadata={handleLoadedMetadata}
        onError={handleError}
        onEnded={handleEnded}
        controlsList="nodownload"
        disablePictureInPicture={false}
        preload="metadata"
        autoPlay={false}
        playsInline
      />
    </PlayerContainer>
  )
}

export default HLSPlayer
export type { HLSPlayerProps }

const PlayerContainer = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #000;
  overflow: hidden;
`

const StyledVideo = styled.video`
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: #000;
`
