import {
  VideoPlayerContext,
  type VideoPlayerContextType
} from '../../contexts/video-player-context'

export function useVideoPlayerContext(): VideoPlayerContextType {
  const context = use(VideoPlayerContext)
  if (!context) {
    throw new Error('useVideoPlayerContext 必须在 VideoPlayerProvider 内部使用')
  }
  return context
}
