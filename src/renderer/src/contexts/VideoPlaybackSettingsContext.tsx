import React from 'react'
import { useVideoPlaybackSettings } from '../hooks/useVideoPlaybackSettings'
import {
  VideoPlaybackSettingsContext,
  type VideoPlaybackSettingsContextType
} from './video-playback-settings-context'

export function VideoPlaybackSettingsProvider({
  children
}: {
  children: React.ReactNode
}): React.JSX.Element {
  const value: VideoPlaybackSettingsContextType = useVideoPlaybackSettings()

  return (
    <VideoPlaybackSettingsContext.Provider value={value}>
      {children}
    </VideoPlaybackSettingsContext.Provider>
  )
}
