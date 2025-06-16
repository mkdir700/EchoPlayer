import { useContext } from 'react'
import {
  VideoPlayerContext,
  type VideoPlayerContextType
} from '../../contexts/video-player-context'

export function useVideoPlayerContext(): VideoPlayerContextType {
  const context = useContext(VideoPlayerContext)
  if (!context) {
    throw new Error('useVideoPlayerContext 必须在 VideoPlayerProvider 内部使用')
  }
  return context
}
