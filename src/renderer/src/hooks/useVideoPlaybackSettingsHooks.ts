import { useVideoPlaybackSettingsContext } from './useVideoPlaybackSettingsContext'

export const useSingleLoop = (): boolean => {
  const { settings } = useVideoPlaybackSettingsContext()
  return settings.isSingleLoop
}

export const useAutoPause = (): boolean => {
  const { settings } = useVideoPlaybackSettingsContext()
  return settings.isAutoPause
}
