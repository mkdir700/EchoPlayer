import { useVideoTime, useVideoLoadState } from '../features/video/useVideoPlayerHooks'

// 组合 hook - 用于字幕显示组件
export const useVideoSubtitle = (): {
  currentTime: number
  isLoaded: boolean
} => {
  const currentTime = useVideoTime()
  const isLoaded = useVideoLoadState()

  return {
    currentTime,
    isLoaded
  }
}
