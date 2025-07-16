import { useSubtitleList } from '@renderer/hooks/features/subtitle/useSubtitleList'
import React from 'react'

import { type ISubtitleListContextType, SubtitleListContext } from './subtitle-list-context'

export function SubtitleListProvider({
  children
}: {
  children: React.ReactNode
}): React.JSX.Element {
  const value: ISubtitleListContextType = useSubtitleList()

  return <SubtitleListContext value={value}>{children}</SubtitleListContext>
}
