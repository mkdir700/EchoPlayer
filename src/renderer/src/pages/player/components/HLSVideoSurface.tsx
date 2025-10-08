import { loggerService } from '@logger'
import { type ExtendedErrorType } from '@renderer/services'
import { useCallback, useRef } from 'react'
import styled from 'styled-components'

import { usePlayerCommands } from '../hooks/usePlayerCommands'
import AutoResumeCountdown from './AutoResumeCountdown'
import HLSPlayer from './HLSPlayer'
import SubtitleOverlay from './SubtitleOverlay'
import TranscodeLoadingIndicator from './TranscodeLoadingIndicator'

const logger = loggerService.withContext('HLSVideoSurface')

interface HLSVideoSurfaceProps {
  src?: string
  onLoadedMetadata?: () => void
  onError?: (error: string, errorType?: ExtendedErrorType) => void
}

/**
 * HLS 视频播放表面组件
 * 集成 HLSPlayer、字幕覆盖层和自动恢复倒计时
 * 提供与原始 VideoSurface 完全兼容的接口
 */
function HLSVideoSurface({ src, onError }: HLSVideoSurfaceProps) {
  const surfaceRef = useRef<HTMLDivElement>(null)

  const { playPause } = usePlayerCommands()

  // 处理点击播放/暂停
  const handleSurfaceClick = useCallback(() => {
    playPause()
    logger.debug('点击触发播放/暂停')
  }, [playPause])

  // 处理播放错误
  const handleVideoError = useCallback(
    (errorMessage: string, errorType?: ExtendedErrorType) => {
      logger.error('HLS 视频播放错误', { errorMessage, errorType, src })
      onError?.(errorMessage, errorType)
    },
    [onError, src]
  )

  return (
    <Surface
      ref={surfaceRef}
      role="button"
      data-testid="hls-video-surface"
      onClick={handleSurfaceClick}
      tabIndex={0}
    >
      <HLSPlayer src={src} onError={handleVideoError} />

      {/* 转码加载指示器 - 在 seek 到未转码时间点时显示 */}
      <TranscodeLoadingIndicator />

      {/* 字幕覆盖层 - 传递容器引用以进行边界计算 */}
      <SubtitleOverlay containerRef={surfaceRef} />

      {/* 自动恢复倒计时 */}
      <AutoResumeCountdown />
    </Surface>
  )
}

export default HLSVideoSurface

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
