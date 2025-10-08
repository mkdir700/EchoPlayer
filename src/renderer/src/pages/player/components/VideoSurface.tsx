import { loggerService } from '@logger'
import { type ExtendedErrorType } from '@renderer/services'
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
  onError?: (error: string, errorType?: ExtendedErrorType) => void
}

/**
 * 原生视频播放表面组件
 * 专门处理原生 HTML5 视频播放，不包含转码逻辑
 */
function VideoSurface({ src, onError }: VideoSurfaceProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const surfaceRef = useRef<HTMLDivElement>(null)
  const isMountedRef = useRef<boolean>(true)

  const pause = usePlayerStore((s) => s.pause)

  const { connectVideoElement, getMediaEventHandlers } = usePlayerEngine()
  const { playPause } = usePlayerCommands()

  // 处理点击播放/暂停
  const handleSurfaceClick = useCallback(() => {
    playPause()
    logger.debug('点击触发播放/暂停')
  }, [playPause])

  // 稳定的 video 元素引用处理
  const handleVideoRef = useCallback(
    (node: HTMLVideoElement | null) => {
      videoRef.current = node
      if (node && isMountedRef.current) {
        connectVideoElement(node)
        logger.debug('视频元素已连接到播放器引擎')
      }
    },
    [connectVideoElement]
  )

  // 处理视频播放结束
  const handleEnded = useCallback(() => {
    logger.debug('视频播放结束')
    pause()
  }, [pause])

  // 原生视频播放错误处理
  const handleVideoError = useCallback(() => {
    const video = videoRef.current
    if (!video || !video.error) return

    const error = video.error
    let errorMessage = '视频播放错误'
    let errorType: ExtendedErrorType = 'unknown'

    logger.debug('原生视频播放错误', {
      code: error.code,
      message: error.message,
      src,
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
        errorMessage = '视频解码错误'
        errorType = 'decode-error'
        break
      case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
        // 检查文件是否存在
        if (src && src.startsWith('file://')) {
          const filePath = decodeURIComponent(src.replace('file://', ''))
          // 简单的文件存在性检查
          window.api.fs
            .checkFileExists(filePath)
            .then((exists) => {
              if (!exists) {
                logger.error('视频文件不存在', { filePath, src })
                onError?.('视频文件不存在', 'file-missing')
              } else {
                logger.error('不支持的视频格式', { filePath, src })
                onError?.('不支持的视频格式', 'unsupported-format')
              }
            })
            .catch(() => {
              logger.error('文件检查失败', { filePath, src })
              onError?.('无法访问视频文件', 'file-missing')
            })
          return
        } else {
          errorMessage = '不支持的视频格式'
          errorType = 'unsupported-format'
        }
        break
      default:
        errorMessage = error.message || '未知视频错误'
        errorType = 'unknown'
    }

    logger.error('原生视频播放错误', {
      errorType,
      errorMessage,
      src,
      mediaError: {
        code: error.code,
        message: error.message
      }
    })

    onError?.(errorMessage, errorType)
  }, [onError, src])

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  // 从播放器引擎获取事件处理器
  const mediaEventHandlers = getMediaEventHandlers()

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
        onPlay={() => mediaEventHandlers.onPlay()}
        onPause={() => mediaEventHandlers.onPause()}
        onTimeUpdate={(e) => mediaEventHandlers.onTimeUpdate(e.nativeEvent)}
        onSeeking={() => mediaEventHandlers.onSeeking()}
        onSeeked={(e) => mediaEventHandlers.onSeeked(e.nativeEvent)}
        onDurationChange={(e) => mediaEventHandlers.onDurationChange(e.nativeEvent)}
        onRateChange={(e) => mediaEventHandlers.onRateChange(e.nativeEvent)}
        onError={handleVideoError}
        onEnded={handleEnded}
        controlsList="nodownload"
        disablePictureInPicture={false}
        preload="metadata"
        autoPlay={false}
        playsInline
      />

      {/* 字幕覆盖层 */}
      <SubtitleOverlay containerRef={surfaceRef} />

      {/* 自动恢复倒计时 */}
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
  overflow: hidden;
`

const StyledVideo = styled.video`
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: #000;
`
