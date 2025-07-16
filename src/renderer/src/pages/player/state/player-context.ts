import { usePlayerStore } from '@renderer/state/stores/player.store'
import { usePlayerSessionStore } from '@renderer/state/stores/player-session.store'
import { usePlayerSubtitlesStore } from '@renderer/state/stores/player-subtitles.store'
import { usePlayerUIStore } from '@renderer/state/stores/player-ui.store'
import type { SubtitleItem } from '@types'
import { useMemo } from 'react'

import { usePlayerControls, useSubtitleEngine } from '../hooks'

export interface PlayerPlaybackAPI {
  currentTime: number
  duration: number
  paused: boolean
  isPlaying: boolean
  volume: number
  muted: boolean
  playbackRate: number
  isFullscreen: boolean
  play: () => void
  pause: () => void
  togglePlay: () => void
  seekTo: (time: number) => void
  seekBy: (seconds: number) => void
  setVolumeLevel: (level: number) => void
  toggleMute: () => void
  setSpeed: (rate: number) => void
  increaseSpeed: () => void
  decreaseSpeed: () => void
  toggleFullscreen: () => void
}

export function usePlayerPlayback(): PlayerPlaybackAPI {
  const api = usePlayerControls()
  const paused = usePlayerStore((s) => s.paused)
  const isPlaying = !paused
  return { ...api, paused, isPlaying }
}

export function usePlaybackMeta() {
  return usePlayerStore((s) => ({
    duration: s.duration,
    volume: s.volume,
    playbackRate: s.playbackRate,
    muted: s.muted,
    isFullscreen: s.isFullscreen
  }))
}

export function useIsPlaying(): boolean {
  return usePlayerStore((s) => !s.paused)
}

export function usePlayerUI() {
  const state = usePlayerUIStore((s) => ({
    controlsVisible: s.controlsVisible,
    isLoading: s.isLoading
  }))
  const actions = usePlayerUIStore((s) => ({
    showControls: s.showControls,
    hideControls: s.hideControls,
    pokeInteraction: s.pokeInteraction,
    openSettings: s.openSettings,
    closeSettings: s.closeSettings
  }))
  return { ...state, ...actions }
}

export function useControlsVisible(): boolean {
  return usePlayerUIStore((s) => s.controlsVisible)
}

// 读取当前视频元数据（由 PlayerPage 注入）
export function useCurrentVideo() {
  return usePlayerSessionStore((s) => s.video)
}

export function useSubtitles(): SubtitleItem[] {
  return usePlayerSubtitlesStore((s) => s.subtitles)
}

export function useSubtitlesLoading(): boolean {
  return usePlayerSubtitlesStore((s) => s.isLoading)
}

export interface SubtitleStats {
  total: number
  current: number
  progress: number
}

export function useSubtitleStats(): SubtitleStats {
  const subtitles = usePlayerSubtitlesStore((s) => s.subtitles)
  const currentTime = usePlayerStore((s) => s.currentTime)
  const { currentIndex } = useSubtitleEngine(subtitles, currentTime)

  return useMemo(() => {
    const total = subtitles.length
    const current = currentIndex >= 0 ? currentIndex + 1 : 0
    const progress = total > 0 ? Math.round((current / total) * 100) : 0
    return { total, current, progress }
  }, [subtitles.length, currentIndex])
}
