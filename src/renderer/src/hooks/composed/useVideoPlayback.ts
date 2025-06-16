import {
  useVideoPlayState,
  useVideoLoadState,
  useVideoError,
  useVideoControls
} from '../features/video/useVideoPlayerHooks'

// 组合 hook - 用于播放控制按钮
export const useVideoPlayback = (): {
  isPlaying: boolean
  isLoaded: boolean
  error: string | null
  play: () => void
  pause: () => void
  toggle: () => void
  canPlay: boolean
} => {
  const isPlaying = useVideoPlayState()
  const isLoaded = useVideoLoadState()
  const error = useVideoError()
  const { play, pause, toggle } = useVideoControls()

  return {
    isPlaying,
    isLoaded,
    error,
    play,
    pause,
    toggle,
    canPlay: isLoaded && !error
  }
}
