import { useVideoFile } from '@renderer/hooks/features/video/useVideoFile'
import React from 'react'

import { type IPlayingVideoContextType, PlayingVideoContext } from './playing-video-context'

export function PlayingVideoProvider({
  children
}: {
  children: React.ReactNode
}): React.JSX.Element {
  const value: IPlayingVideoContextType = useVideoFile()

  return <PlayingVideoContext value={value}>{children}</PlayingVideoContext>
}
