import { usePlayerStore } from '@renderer/state/stores/player.store'
import { useCallback, useRef } from 'react'

/**
 * 视频事件处理 Hook
 * 处理 timeupdate、seeking、ended、loadedmetadata 等事件
 */
export function useVideoEvents() {
  const lastTimeUpdateRef = useRef<number>(0)
  const setCurrentTime = usePlayerStore((s) => s.setCurrentTime)
  const setDuration = usePlayerStore((s) => s.setDuration)
  const play = usePlayerStore((s) => s.play)
  const pause = usePlayerStore((s) => s.pause)

  // 时间更新事件（带节流）
  const handleTimeUpdate = useCallback(
    (video: HTMLVideoElement) => {
      const now = Date.now()
      // 节流：每100ms最多更新一次
      if (now - lastTimeUpdateRef.current < 100) {
        return
      }
      lastTimeUpdateRef.current = now

      const newTime = video.currentTime
      setCurrentTime(newTime)
    },
    [setCurrentTime]
  )

  // 元数据加载完成
  const handleLoadedMetadata = useCallback(
    (video: HTMLVideoElement) => {
      setDuration(video.duration)
    },
    [setDuration]
  )

  // 播放事件
  const handlePlay = useCallback(() => {
    play()
  }, [play])

  // 暂停事件
  const handlePause = useCallback(() => {
    pause()
  }, [pause])

  // 播放结束
  const handleEnded = useCallback(() => {
    pause()
    // 可以在这里添加播放结束的逻辑，比如跳转到下一个视频
  }, [pause])

  // 跳转开始
  const handleSeeking = useCallback(() => {
    // 跳转开始时可以暂停某些更新
  }, [])

  // 跳转结束
  const handleSeeked = useCallback(
    (video: HTMLVideoElement) => {
      setCurrentTime(video.currentTime)
    },
    [setCurrentTime]
  )

  // 错误处理
  const handleError = useCallback((video: HTMLVideoElement, onError?: (error: string) => void) => {
    const error = video.error
    const errorMessage = error ? `Video error: ${error.message}` : 'Unknown video error'
    onError?.(errorMessage)
  }, [])

  // 等待数据
  const handleWaiting = useCallback(() => {
    // 可以显示加载指示器
  }, [])

  // 可以播放
  const handleCanPlay = useCallback(() => {
    // 可以隐藏加载指示器
  }, [])

  return {
    handleTimeUpdate,
    handleLoadedMetadata,
    handlePlay,
    handlePause,
    handleEnded,
    handleSeeking,
    handleSeeked,
    handleError,
    handleWaiting,
    handleCanPlay
  }
}
