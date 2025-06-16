import { useContext } from 'react'
import type { ThemeConfig } from 'antd'
import { ThemeContext } from '@renderer/contexts/theme-context'
import type { ThemeCustomization } from '@types_/shared'

export interface ThemeContextType {
  currentTheme: ThemeConfig
  customization: ThemeCustomization
  updateCustomization: (updates: Partial<ThemeCustomization>) => Promise<void>
  updateAndApplyTheme: (updates: Partial<ThemeCustomization>) => Promise<void>
  resetToDefault: () => Promise<void>
  applyTheme: () => void
}

export const useThemeCustomization = (): ThemeContextType => {
  const context = useContext(ThemeContext)

  if (!context) {
    throw new Error('useThemeCustomization must be used within a ThemeProvider')
  }

  return context
}

// 重新导出类型以保持向后兼容性 / Re-export type for backward compatibility
export type { ThemeCustomization }
