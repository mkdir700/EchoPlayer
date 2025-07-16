import { UseCurrentSubtitleDisplayReturn } from '@renderer/hooks/features/subtitle/useCurrentSubtitleDisplay'
import { createContext } from 'react'

export interface ICurrentSubtitleDisplayContextType extends UseCurrentSubtitleDisplayReturn {}

export const CurrentSubtitleDisplayContext =
  createContext<ICurrentSubtitleDisplayContextType | null>(null)
