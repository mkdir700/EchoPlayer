import { createContext } from 'react'
import { ReactCallback } from '@renderer/types/shared'

interface SubtitleControlState {
  isSingleLoop: boolean
  isAutoPause: boolean
}

export interface SubtitleControlContextType extends SubtitleControlState {
  toggleSingleLoop: ReactCallback<() => void>
  toggleAutoPause: ReactCallback<() => void>
  goToNextSubtitle: ReactCallback<() => void>
  goToPreviousSubtitle: ReactCallback<() => void>
  resetState: ReactCallback<() => void>
  restoreState: ReactCallback<(isSingleLoop: boolean, isAutoPause: boolean) => void>
}

export const SubtitleControlContext = createContext<SubtitleControlContextType | null>(null)
