import React from 'react'
import { useSubtitleList } from '../hooks/useSubtitleList'
import { SubtitleListContext, type ISubtitleListContextType } from './subtitle-list-context'

export function SubtitleListProvider({
  children
}: {
  children: React.ReactNode
}): React.JSX.Element {
  const value: ISubtitleListContextType = useSubtitleList()

  return <SubtitleListContext.Provider value={value}>{children}</SubtitleListContext.Provider>
}
