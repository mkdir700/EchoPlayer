import { useCurrentSubtitleDisplay } from '@renderer/hooks/features/subtitle/useCurrentSubtitleDisplay'
import React from 'react'

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

  return <CurrentSubtitleDisplayContext value={value}>{children}</CurrentSubtitleDisplayContext>
}
