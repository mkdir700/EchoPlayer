import React from 'react'
import { useCurrentSubtitleDisplay } from '@renderer/hooks/features/subtitle/useCurrentSubtitleDisplay'
import {
  CurrentSubtitleDisplayContext,
  type ICurrentSubtitleDisplayContextType
} from './current-subtitle-display-context'

export function CurrentSubtitleDisplayProvider({
  children
}: {
  children: React.ReactNode
}): React.JSX.Element {
  const value: ICurrentSubtitleDisplayContextType = useCurrentSubtitleDisplay()

  return (
    <CurrentSubtitleDisplayContext.Provider value={value}>
      {children}
    </CurrentSubtitleDisplayContext.Provider>
  )
}
