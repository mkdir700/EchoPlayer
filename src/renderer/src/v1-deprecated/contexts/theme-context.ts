import type { ThemeContextType } from '@renderer/hooks/features/ui/useThemeCustomization'
import { createContext } from 'react'

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined)
