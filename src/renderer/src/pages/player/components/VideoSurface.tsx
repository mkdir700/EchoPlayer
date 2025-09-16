import { loggerService } from '@logger'
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
  onError?: (
    error: string,
    errorType?: 'file-missing' | 'unsupported-format' | 'decode-error' | 'network-error' | 'unknown'
  ) => void
}

function VideoSurface({ src, onLoadedMetadata, onError }: VideoSurfaceProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const surfaceRef = useRef<HTMLDivElement>(null) // Container ref for SubtitleOverlay

  const isMountedRef = useRef<boolean>(true)

  const currentTime = usePlayerStore((s) => s.currentTime)
  const pause = usePlayerStore((s) => s.pause)

  const { connectVideoElement, getMediaEventHandlers, orchestrator } = usePlayerEngine()
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

  // 增强的错误处理 - 支持错误类型检测和文件存在性检查
  const handleVideoError = useCallback(async () => {
    const video = videoRef.current
    if (!video || !video.error) return

    const error = video.error
    let errorMessage = '视频播放错误'
    let errorType:
      | 'file-missing'
      | 'unsupported-format'
      | 'decode-error'
      | 'network-error'
      | 'unknown' = 'unknown'

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
        // 对于"不支持的源"错误，需要进一步检查是文件缺失还是格式不支持
        if (src && src.startsWith('file://')) {
          try {
            // 从file://URL中提取文件路径
            const filePath = decodeURIComponent(src.replace('file://', ''))
            const fileExists = await window.api.fs.checkFileExists(filePath)

            if (!fileExists) {
              errorMessage = '视频文件不存在'
              errorType = 'file-missing'
              logger.info('文件存在性检查：文件不存在', { filePath, src })
            } else {
              errorMessage = '不支持的视频格式'
              errorType = 'unsupported-format'
              logger.info('文件存在性检查：文件存在但格式不支持', { filePath, src })
            }
          } catch (checkError) {
            logger.error('检查文件存在性时出错', { src, checkError })
            errorMessage = '无法访问视频文件'
            errorType = 'file-missing'
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

    logger.error('视频错误:', {
      code: error.code,
      message: error.message,
      src,
      errorType,
      finalMessage: errorMessage
    })

    onError?.(errorMessage, errorType)
  }, [onError, src])

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
