import { createContext } from 'react'
import { UseCurrentSubtitleDisplayReturn } from '@renderer/hooks/features/subtitle/useCurrentSubtitleDisplay'

export interface ICurrentSubtitleDisplayContextType extends UseCurrentSubtitleDisplayReturn {}

export const CurrentSubtitleDisplayContext =
  createContext<ICurrentSubtitleDisplayContextType | null>(null)
