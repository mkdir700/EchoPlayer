import {
  type IPlayingVideoContextType,
  PlayingVideoContext
} from '../../contexts/playing-video-context'

export function usePlayingVideoContext(): IPlayingVideoContextType {
  const context = use(PlayingVideoContext)
  if (!context) {
    throw new Error('usePlayingVideoContext 必须在 PlayingVideoProvider 内部使用')
  }

  return context
}
