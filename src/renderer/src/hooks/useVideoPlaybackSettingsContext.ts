import { useContext } from 'react'
import {
  VideoPlaybackSettingsContext,
  type VideoPlaybackSettingsContextType
} from '../contexts/video-playback-settings-context'

export function useVideoPlaybackSettingsContext(): VideoPlaybackSettingsContextType {
  const context = useContext(VideoPlaybackSettingsContext)
  if (!context) {
    throw new Error('useVideoPlaybackSettingsContext 必须在 VideoPlaybackSettingsProvider 内部使用')
  }
  return context
}
