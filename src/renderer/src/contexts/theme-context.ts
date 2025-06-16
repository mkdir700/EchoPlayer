import { createContext } from 'react'
import type { ThemeContextType } from '@renderer/hooks/features/ui/useThemeCustomization'

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined)
