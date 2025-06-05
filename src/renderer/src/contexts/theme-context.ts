import { createContext } from 'react'
import type { ThemeContextType } from '@renderer/hooks/useThemeCustomization'

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined)
