import { loggerService } from '@logger'
import { type ExtendedErrorType } from '@renderer/services'
import { usePlayerStore } from '@renderer/state/stores/player.store'
import { useCallback, useEffect, useRef } from 'react'
import ReactPlayer from 'react-player'
import styled from 'styled-components'

import { usePlayerEngine } from '../hooks/usePlayerEngine'

const logger = loggerService.withContext('HLSPlayer')

interface HLSPlayerProps {
  src?: string
  onLoadedMetadata?: () => void
  onError?: (error: string, errorType?: ExtendedErrorType) => void
}

/**
 * HLS 播放器组件，基于 react-player 实现
 * 提供与 VideoSurface 相同的接口，专门用于播放 HLS 流
 */
function HLSPlayer({ src, onLoadedMetadata, onError }: HLSPlayerProps) {
  const playerRef = useRef<ReactPlayer>(null)
  const internalVideoRef = useRef<HTMLVideoElement | null>(null)

  // 集成播放器引擎
  const { connectVideoElement, getMediaEventHandlers, orchestrator } = usePlayerEngine()

  // HLS 状态管理
  const hlsMode = usePlayerStore((s) => s.hlsMode)
  const transcodeInfo = usePlayerStore((s) => s.transcodeInfo)
  const currentTime = usePlayerStore((s) => s.currentTime)

  // 根据 HLS 模式确定实际播放源
  const actualSrc = hlsMode && transcodeInfo.hlsSrc ? transcodeInfo.hlsSrc : src

  // 处理播放器准备就绪
  const handleReady = useCallback(() => {
    logger.debug('ReactPlayer 准备就绪', { src })

    // 获取内部的 video 元素并连接到播放器引擎
    const internalPlayer = playerRef.current?.getInternalPlayer() as HTMLVideoElement
    if (internalPlayer && internalPlayer.tagName === 'VIDEO') {
      internalVideoRef.current = internalPlayer

      // 确保播放器处于暂停状态
      if (!internalPlayer.paused) {
        internalPlayer.pause()
        logger.debug('ReactPlayer 强制暂停状态')
      }

      // 连接到播放器引擎
      connectVideoElement(internalPlayer)
      logger.debug('ReactPlayer 内部 video 元素已连接到播放器引擎')

      // 强制同步暂停状态到播放器引擎
      setTimeout(() => {
        if (orchestrator) {
          orchestrator.onPause()
          logger.debug('强制同步暂停状态到播放器引擎')
        }
      }, 10)
    }

    onLoadedMetadata?.()
  }, [src, onLoadedMetadata, connectVideoElement, orchestrator])

  // 处理播放器错误
  const handleError = useCallback(
    (error: any) => {
      logger.error('ReactPlayer 播放错误', { error, src })

      let errorMessage = '视频播放错误'
      let errorType: ExtendedErrorType = 'unknown'

      if (error && typeof error === 'object') {
        if (error.message) {
          errorMessage = error.message
        }
        if (error.code) {
          errorMessage = `${errorMessage} (代码: ${error.code})`
        }
      } else if (typeof error === 'string') {
        errorMessage = error
      }

      // 检查是否为 HLS 相关错误
      if (src && (src.includes('.m3u8') || src.includes('playlist'))) {
        errorType = 'hls-playback-error'
        errorMessage = `HLS 播放错误: ${errorMessage}`
      }

      onError?.(errorMessage, errorType)
    },
    [src, onError]
  )

  // 处理缓冲开始
  const handleBufferStart = useCallback(() => {
    logger.debug('ReactPlayer 开始缓冲', { src })
  }, [src])

  // 处理缓冲结束
  const handleBufferEnd = useCallback(() => {
    logger.debug('ReactPlayer 缓冲结束', { src })
  }, [src])

  // ReactPlayer 特有的事件处理器
  const handleProgress = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (_state: { playedSeconds: number }) => {
      // ReactPlayer 的 progress 事件对应原生 video 的 timeupdate 事件
      const mediaEventHandlers = getMediaEventHandlers()
      if (internalVideoRef.current) {
        // 创建模拟的事件对象
        const mockEvent = { target: internalVideoRef.current } as unknown as Event
        mediaEventHandlers.onTimeUpdate(mockEvent)
      }
    },
    [getMediaEventHandlers]
  )

  const handlePlay = useCallback(() => {
    const mediaEventHandlers = getMediaEventHandlers()
    mediaEventHandlers.onPlay()
    logger.debug('ReactPlayer 播放事件')
  }, [getMediaEventHandlers])

  const handlePause = useCallback(() => {
    const mediaEventHandlers = getMediaEventHandlers()
    mediaEventHandlers.onPause()
    logger.debug('ReactPlayer 暂停事件')
  }, [getMediaEventHandlers])

  const handleEnded = useCallback(() => {
    const mediaEventHandlers = getMediaEventHandlers()
    mediaEventHandlers.onEnded()
    logger.debug('ReactPlayer 播放结束事件')
  }, [getMediaEventHandlers])

  const handleDuration = useCallback(
    (duration: number) => {
      const mediaEventHandlers = getMediaEventHandlers()
      if (internalVideoRef.current) {
        // 模拟 durationchange 事件
        const mockEvent = { target: { ...internalVideoRef.current, duration } } as unknown as Event
        mediaEventHandlers.onDurationChange(mockEvent)
      }
      logger.debug('ReactPlayer 时长变化', { duration })
    },
    [getMediaEventHandlers]
  )

  const handleSeek = useCallback(
    (seconds: number) => {
      const mediaEventHandlers = getMediaEventHandlers()
      if (internalVideoRef.current) {
        // 触发 seeking 和 seeked 事件
        mediaEventHandlers.onSeeking()
        const mockEvent = {
          target: { ...internalVideoRef.current, currentTime: seconds }
        } as unknown as Event
        mediaEventHandlers.onSeeked(mockEvent)
      }
      logger.debug('ReactPlayer 跳转事件', { seconds })
    },
    [getMediaEventHandlers]
  )

  // 处理 HLS 源切换时的播放位置恢复
  useEffect(() => {
    if (hlsMode && transcodeInfo.hlsSrc && playerRef.current) {
      logger.info('HLS 源切换检测', {
        hlsMode,
        hlsSrc: transcodeInfo.hlsSrc,
        originalSrc: src,
        currentTime
      })

      // 如果有保存的播放位置，恢复它
      if (currentTime > 0) {
        const timeoutId = setTimeout(() => {
          const internalPlayer = playerRef.current?.getInternalPlayer() as HTMLVideoElement
          if (internalPlayer && Math.abs(internalPlayer.currentTime - currentTime) > 1) {
            // 使用播放器引擎来恢复位置
            if (orchestrator && orchestrator.isVideoControllerConnected()) {
              orchestrator.requestSeek(currentTime)
              logger.debug('通过引擎恢复 HLS 切换后的播放位置', { position: currentTime })
            } else {
              // 备用方案：直接设置
              internalPlayer.currentTime = currentTime
              logger.debug('直接恢复 HLS 切换后的播放位置', { position: currentTime })
            }
          }
        }, 100) // 短暂延迟确保播放器完全加载

        return () => clearTimeout(timeoutId)
      }
    }

    // 确保所有代码路径都返回清理函数（即使是空的）
    return undefined
  }, [hlsMode, transcodeInfo.hlsSrc, currentTime, orchestrator, src])

  return (
    <PlayerContainer>
      <ReactPlayer
        ref={playerRef}
        url={actualSrc}
        width="100%"
        height="100%"
        controls={false}
        playing={false}
        muted={false}
        loop={false}
        pip={false}
        stopOnUnmount={false}
        playbackRate={1}
        volume={1}
        config={{
          file: {
            attributes: {
              controlsList: 'nodownload',
              disablePictureInPicture: false,
              preload: 'metadata',
              playsInline: true
            },
            forceHLS: true, // 强制使用 HLS.js 处理 .m3u8 文件
            hlsOptions: {
              debug: false,
              enableWorker: true,
              lowLatencyMode: false,
              backBufferLength: 90
            }
          }
        }}
        onReady={handleReady}
        onError={handleError}
        onBufferStart={handleBufferStart}
        onBufferEnd={handleBufferEnd}
        onProgress={handleProgress}
        onPlay={handlePlay}
        onPause={handlePause}
        onEnded={handleEnded}
        onDuration={handleDuration}
        onSeek={handleSeek}
      />
    </PlayerContainer>
  )
}

// 导出播放器组件和获取实例的方法
export default HLSPlayer
export type { HLSPlayerProps }

const PlayerContainer = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  background: #000;

  /* 确保 ReactPlayer 填充整个容器 */
  & > div {
    position: absolute !important;
    inset: 0;
  }

  /* 确保视频元素正确显示 */
  video {
    width: 100% !important;
    height: 100% !important;
    object-fit: contain;
    background: #000;
  }
`
