import { SubtitleDisplaySettings, VideoPlaybackSettings } from '@types_/shared'
import { createContext, RefObject } from 'react'

export type VideoPlaybackSettingsContextType = {
  subtitleDisplayModeRef: RefObject<VideoPlaybackSettings['displayMode']>
  volumeRef: RefObject<VideoPlaybackSettings['volume']>
  playbackRateRef: RefObject<VideoPlaybackSettings['playbackRate']>
  isSingleLoopRef: RefObject<VideoPlaybackSettings['isSingleLoop']>
  isAutoPauseRef: RefObject<VideoPlaybackSettings['isAutoPause']>
  subtitleDisplaySettingsRef: RefObject<SubtitleDisplaySettings>
  subscribeToSubtitleDisplayMode: (
    callback: (displayMode: VideoPlaybackSettings['displayMode']) => void
  ) => () => void
  subscribeToVolume: (callback: (volume: VideoPlaybackSettings['volume']) => void) => () => void
  subscribeToPlaybackRate: (
    callback: (playbackRate: VideoPlaybackSettings['playbackRate']) => void
  ) => () => void
  subscribeToIsSingleLoop: (
    callback: (isSingleLoop: VideoPlaybackSettings['isSingleLoop']) => void
  ) => () => void
  subscribeToIsAutoPause: (
    callback: (isAutoPause: VideoPlaybackSettings['isAutoPause']) => void
  ) => () => void
  subscribeToSubtitleDisplaySettings: (
    callback: (subtitleDisplaySettings: SubtitleDisplaySettings) => void
  ) => () => void
  subscribeToSettings: (callback: (settings: VideoPlaybackSettings) => void) => () => void
  updateSubtitleDisplayMode: (displayMode: VideoPlaybackSettings['displayMode']) => void
  updateVolume: (volume: VideoPlaybackSettings['volume']) => void
  updatePlaybackRate: (playbackRate: VideoPlaybackSettings['playbackRate']) => void
  updateIsSingleLoop: (isSingleLoop: VideoPlaybackSettings['isSingleLoop']) => void
  updateIsAutoPause: (isAutoPause: VideoPlaybackSettings['isAutoPause']) => void
  restoreSettings: (settings: VideoPlaybackSettings) => void
}

export const VideoPlaybackSettingsContext = createContext<VideoPlaybackSettingsContextType | null>(
  null
)
