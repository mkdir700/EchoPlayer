import { createContext } from 'react'
import type { UseVideoPlaybackSettingsReturn } from '../hooks/useVideoPlaybackSettings'

export type VideoPlaybackSettingsContextType = UseVideoPlaybackSettingsReturn

export const VideoPlaybackSettingsContext = createContext<VideoPlaybackSettingsContextType | null>(
  null
)
