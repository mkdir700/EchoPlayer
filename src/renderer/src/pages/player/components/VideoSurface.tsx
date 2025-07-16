import { useCallback, useEffect, useRef } from 'react'
import styled from 'styled-components'
import { usePlayerStore } from '@renderer/state/stores/player.store'
import { loggerService } from '@logger'
import { useVideoEvents } from '../hooks'

const logger = loggerService.withContext('VideoSurface')

interface VideoSurfaceProps {
  videoId: number
  src?: string
  onLoadedMetadata?: () => void
  onError?: (error: string) => void
}

function VideoSurface({ videoId, src, onLoadedMetadata, onError }: VideoSurfaceProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const isSeekingRef = useRef<boolean>(false)

  const currentTime = usePlayerStore((s) => s.currentTime)
  const paused = usePlayerStore((s) => s.paused)
  const volume = usePlayerStore((s) => s.volume)
  const muted = usePlayerStore((s) => s.muted)
  const playbackRate = usePlayerStore((s) => s.playbackRate)
  const setDuration = usePlayerStore((s) => s.setDuration)
  const pause = usePlayerStore((s) => s.pause)

  // 事件处理（节流更新 currentTime 等）
  const { handleTimeUpdate } = useVideoEvents()

  // 同步播放/暂停状态
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    if (paused) {
      video.pause()
    } else {
      const playPromise = video.play()
      // 检查 play() 是否返回 Promise（现代浏览器会返回）
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch((error) => {
          // 忽略常见的播放错误，避免干扰用户体验
          if (error.name !== 'AbortError') {
            console.error('Video play error:', error)
            onError?.(error.message || 'Video play failed')
          }
        })
      }
    }
  }, [paused, onError])

  // 同步音量
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    video.volume = muted ? 0 : volume
    video.muted = muted
  }, [volume, muted])

  // 同步播放速度
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    video.playbackRate = playbackRate
  }, [playbackRate])

  // 同步时间跳转（当外部改变 currentTime 时）
  useEffect(() => {
    const video = videoRef.current
    if (!video || isSeekingRef.current) return

    const videoCurrentTime = video.currentTime
    // 阈值：播放中放宽到 1 秒，暂停时几乎实时（避免用户微调时不同步）
    const threshold = paused ? 0.01 : 0.5
    if (Math.abs(videoCurrentTime - currentTime) > threshold) {
      isSeekingRef.current = true
      video.currentTime = currentTime
      // 短暂延迟后重置 seeking 标志
      setTimeout(() => {
        isSeekingRef.current = false
      }, 100)
    }
  }, [currentTime])

  // 处理视频元数据加载完成
  const handleLoadedMetadata = useCallback(() => {
    const video = videoRef.current
    if (!video) return

    setDuration(video.duration)

    if (currentTime > 0) {
      isSeekingRef.current = true
      video.currentTime = currentTime
      setTimeout(() => {
        isSeekingRef.current = false
      }, 100)
    }

    onLoadedMetadata?.()
  }, [setDuration, currentTime, onLoadedMetadata])

  // 处理播放结束
  const handleEnded = useCallback(() => {
    pause()
  }, [pause])

  // 处理视频错误
  const handleVideoError = useCallback(() => {
    const video = videoRef.current
    if (!video || !video.error) return

    const error = video.error
    const errorMessage = `Video error: ${error.message || 'Unknown error'}`
    console.error(errorMessage)
    onError?.(errorMessage)
  }, [onError])

  return (
    <Surface role="region" aria-label="video-surface">
      <StyledVideo
        ref={videoRef}
        src={src}
        onTimeUpdate={(e) => handleTimeUpdate(e.currentTarget)}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onError={handleVideoError}
        controlsList="nodownload"
        disablePictureInPicture={false}
        preload="metadata"
        playsInline
      />
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
`

const StyledVideo = styled.video`
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: #000;
`
