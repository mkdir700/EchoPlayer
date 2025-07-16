import { usePlayerStore } from '@renderer/state/stores/player.store'
import { useCallback } from 'react'

/**
 * 播放器控制 Hook
 * 封装播放/暂停、跳转、调速、音量控制等操作
 */
export function usePlayerControls() {
  // 使用 selector 细粒度订阅，避免不必要重渲染
  const currentTime = usePlayerStore((s) => s.currentTime)
  const duration = usePlayerStore((s) => s.duration)
  const paused = usePlayerStore((s) => s.paused)
  const volume = usePlayerStore((s) => s.volume)
  const muted = usePlayerStore((s) => s.muted)
  const playbackRate = usePlayerStore((s) => s.playbackRate)
  const isFullscreen = usePlayerStore((s) => s.isFullscreen)
  const togglePlay = usePlayerStore((s) => s.togglePlay)
  const setCurrentTime = usePlayerStore((s) => s.setCurrentTime)
  const setVolume = usePlayerStore((s) => s.setVolume)
  const setMuted = usePlayerStore((s) => s.setMuted)
  const setPlaybackRate = usePlayerStore((s) => s.setPlaybackRate)
  const setFullscreen = usePlayerStore((s) => s.setFullscreen)

  // 播放控制
  const play = useCallback(() => {
    if (paused) {
      togglePlay()
    }
  }, [paused, togglePlay])

  const pause = useCallback(() => {
    if (!paused) {
      togglePlay()
    }
  }, [paused, togglePlay])

  // 跳转控制
  const seekTo = useCallback(
    (time: number) => {
      setCurrentTime(Math.max(0, time))
    },
    [setCurrentTime]
  )

  const seekBy = useCallback(
    (seconds: number) => {
      const currentTime = usePlayerStore.getState().currentTime
      seekTo(currentTime + seconds)
    },
    [seekTo]
  )

  // 音量控制
  const setVolumeLevel = useCallback(
    (level: number) => {
      const clampedLevel = Math.max(0, Math.min(1, level))
      setVolume(clampedLevel)
      if (clampedLevel > 0 && muted) {
        setMuted(false)
      }
    },
    [setVolume, muted, setMuted]
  )

  const toggleMute = useCallback(() => {
    setMuted(!muted)
  }, [muted, setMuted])

  // 倍速控制
  const setSpeed = useCallback(
    (rate: number) => {
      const clampedRate = Math.max(0.25, Math.min(3, rate))
      setPlaybackRate(clampedRate)
    },
    [setPlaybackRate]
  )

  const increaseSpeed = useCallback(() => {
    const speeds = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]
    const currentIndex = speeds.findIndex((speed) => speed >= playbackRate)
    const nextIndex = Math.min(currentIndex + 1, speeds.length - 1)
    setSpeed(speeds[nextIndex])
  }, [playbackRate, setSpeed])

  const decreaseSpeed = useCallback(() => {
    const speeds = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]
    const currentIndex = speeds.findIndex((speed) => speed >= playbackRate)
    const prevIndex = Math.max(currentIndex - 1, 0)
    setSpeed(speeds[prevIndex])
  }, [playbackRate, setSpeed])

  // 全屏控制
  const toggleFullscreen = useCallback(() => {
    setFullscreen(!isFullscreen)
  }, [isFullscreen, setFullscreen])

  return {
    // 状态
    currentTime,
    duration,
    paused,
    volume,
    muted,
    playbackRate,
    isFullscreen,

    // 播放控制
    play,
    pause,
    togglePlay,

    // 跳转控制
    seekTo,
    seekBy,

    // 音量控制
    setVolumeLevel,
    toggleMute,

    // 倍速控制
    setSpeed,
    increaseSpeed,
    decreaseSpeed,

    // 全屏控制
    toggleFullscreen
  }
}
