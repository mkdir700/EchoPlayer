import { useContext } from 'react'
import {
  SubtitleListContext,
  type ISubtitleListContextType
} from '@renderer/contexts/subtitle-list-context'

export function useSubtitleListContext(): ISubtitleListContextType {
  const context = useContext(SubtitleListContext)
  if (!context) {
    throw new Error('useSubtitleListContext 必须在 SubtitleListProvider 内部使用')
  }

  return context
}
