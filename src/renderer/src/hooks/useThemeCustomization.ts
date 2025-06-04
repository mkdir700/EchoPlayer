import { useContext } from 'react'
import type { ThemeConfig } from 'antd'
import { ThemeContext } from '@renderer/contexts/ThemeContext'

export interface ThemeCustomization {
  // Basic colors
  colorPrimary: string
  colorSuccess: string
  colorWarning: string
  colorError: string
  // Layout
  borderRadius: number
  fontSize: number
  // Theme mode
  algorithm: 'default' | 'dark' | 'compact' | 'darkCompact'
}

export interface ThemeContextType {
  currentTheme: ThemeConfig
  customization: ThemeCustomization
  updateCustomization: (updates: Partial<ThemeCustomization>) => void
  updateAndApplyTheme: (updates: Partial<ThemeCustomization>) => void
  resetToDefault: () => void
  applyTheme: () => void
}

export const useThemeCustomization = (): ThemeContextType => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useThemeCustomization must be used within a ThemeProvider')
  }
  return context
}
