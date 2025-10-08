import { loggerService } from '@logger'
import { type ExtendedErrorType } from '@renderer/services'
import { usePlayerStore } from '@renderer/state/stores/player.store'
import { useEffect, useState } from 'react'

import HLSVideoSurface from './HLSVideoSurface'
import VideoSurface from './VideoSurface'

const logger = loggerService.withContext('PlayerSelector')

interface PlayerSelectorProps {
  src?: string
  onError?: (error: string, errorType?: ExtendedErrorType) => void
}

type PlayerType = 'native' | 'hls'

/**
 * 播放器选择器组件
 *
 * 根据 HLS 模式状态智能选择使用原生 VideoSurface 还是 HLS 播放器
 * 转码工作由 PlayerPage 负责，此组件只负责播放器类型的选择和渲染
 */
function PlayerSelector({ src, onError }: PlayerSelectorProps) {
  const [playerType, setPlayerType] = useState<PlayerType>('native')

  // 从 store 获取 HLS 相关状态
  const hlsMode = usePlayerStore((s) => s.hlsMode)
  const hlsSrc = usePlayerStore((s) => s.transcodeInfo.hlsSrc)

  // 处理原生播放器错误 - 传递给上层处理
  const handleNativeError = (error: string, errorType?: ExtendedErrorType) => {
    logger.warn('原生播放器错误，传递给上层处理', { error, errorType })
    onError?.(error, errorType)
  }

  // 处理 HLS 播放器错误
  const handleHlsError = (error: string, errorType?: ExtendedErrorType) => {
    logger.error('HLS 播放器发生错误', { error, errorType })
    onError?.(error, errorType)
  }

  // 监听 HLS 模式变化，自动切换播放器类型
  useEffect(() => {
    if (hlsMode && hlsSrc) {
      if (playerType !== 'hls') {
        logger.info('检测到 HLS 模式激活，切换到 HLS 播放器', { hlsSrc })
        setPlayerType('hls')
      }
    } else if (!hlsMode) {
      if (playerType !== 'native') {
        logger.info('HLS 模式关闭，切换回原生播放器')
        setPlayerType('native')
      }
    }
  }, [hlsMode, hlsSrc, playerType])

  // 根据当前播放器类型渲染对应的组件
  if (playerType === 'hls' && hlsSrc) {
    return <HLSVideoSurface src={hlsSrc} onError={handleHlsError} />
  }

  // 默认渲染原生播放器
  return <VideoSurface src={src} onError={handleNativeError} />
}

export default PlayerSelector
