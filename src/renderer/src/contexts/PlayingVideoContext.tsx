import React from 'react'
import { useVideoFile } from '../hooks/useVideoFile'
import { PlayingVideoContext, type IPlayingVideoContextType } from './playing-video-context'

export function PlayingVideoProvider({
  children
}: {
  children: React.ReactNode
}): React.JSX.Element {
  const value: IPlayingVideoContextType = useVideoFile()

  return <PlayingVideoContext.Provider value={value}>{children}</PlayingVideoContext.Provider>
}
