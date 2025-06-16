import { useContext } from 'react'
import {
  PlayingVideoContext,
  type IPlayingVideoContextType
} from '../../contexts/playing-video-context'

export function usePlayingVideoContext(): IPlayingVideoContextType {
  const context = useContext(PlayingVideoContext)
  if (!context) {
    throw new Error('usePlayingVideoContext 必须在 PlayingVideoProvider 内部使用')
  }

  return context
}
