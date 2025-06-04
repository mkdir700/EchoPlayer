import React, { useState, useCallback } from 'react'
import { ConfigProvider, theme } from 'antd'
import { appleTheme, appleDarkTheme } from '@renderer/styles/theme'
import { ThemeContext } from '@renderer/contexts/ThemeContext'
import type { ThemeCustomization, ThemeContextType } from '@renderer/hooks/useThemeCustomization'
import type { ThemeConfig } from 'antd'

const defaultCustomization: ThemeCustomization = {
  colorPrimary: '#007AFF',
  colorSuccess: '#34C759',
  colorWarning: '#FF9500',
  colorError: '#FF3B30',
  borderRadius: 8,
  fontSize: 16,
  algorithm: 'default'
}

// 从 localStorage 读取保存的主题设置
const loadSavedCustomization = (): ThemeCustomization => {
  try {
    const saved = localStorage.getItem('echolab-theme-customization')
    if (saved) {
      return { ...defaultCustomization, ...JSON.parse(saved) }
    }
  } catch (error) {
    console.warn('Failed to load saved theme customization:', error)
  }
  return defaultCustomization
}

// 保存主题设置到 localStorage
const saveCustomization = (customization: ThemeCustomization): void => {
  try {
    localStorage.setItem('echolab-theme-customization', JSON.stringify(customization))
  } catch (error) {
    console.warn('Failed to save theme customization:', error)
  }
}

// 根据自定义设置生成主题配置
const generateThemeConfig = (customization: ThemeCustomization): ThemeConfig => {
  const baseTheme =
    customization.algorithm === 'dark' || customization.algorithm === 'darkCompact'
      ? appleDarkTheme
      : appleTheme

  // 选择算法
  let algorithms: (typeof theme.defaultAlgorithm)[] = []
  switch (customization.algorithm) {
    case 'dark':
      algorithms = [theme.darkAlgorithm]
      break
    case 'compact':
      algorithms = [theme.compactAlgorithm]
      break
    case 'darkCompact':
      algorithms = [theme.darkAlgorithm, theme.compactAlgorithm]
      break
    default:
      algorithms = [theme.defaultAlgorithm]
      break
  }

  return {
    ...baseTheme,
    algorithm: algorithms,
    token: {
      ...baseTheme.token,
      colorPrimary: customization.colorPrimary,
      colorSuccess: customization.colorSuccess,
      colorWarning: customization.colorWarning,
      colorError: customization.colorError,
      borderRadius: customization.borderRadius,
      fontSize: customization.fontSize
    }
  }
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [customization, setCustomization] = useState<ThemeCustomization>(loadSavedCustomization)

  // 生成当前主题配置 - 直接使用当前customization
  const currentTheme = generateThemeConfig(customization)

  const updateCustomization = useCallback((updates: Partial<ThemeCustomization>) => {
    setCustomization((prev) => ({ ...prev, ...updates }))
  }, [])

  // 新增：直接更新并应用主题的方法
  const updateAndApplyTheme = useCallback((updates: Partial<ThemeCustomization>) => {
    setCustomization((prev) => {
      const newCustomization = { ...prev, ...updates }
      saveCustomization(newCustomization)
      return newCustomization
    })
  }, [])

  const resetToDefault = useCallback(() => {
    setCustomization(defaultCustomization)
    saveCustomization(defaultCustomization)
  }, [])

  const applyTheme = useCallback(() => {
    saveCustomization(customization)
  }, [customization])

  const contextValue: ThemeContextType = {
    currentTheme,
    customization,
    updateCustomization,
    updateAndApplyTheme,
    resetToDefault,
    applyTheme
  }

  return (
    <ThemeContext.Provider value={contextValue}>
      <ConfigProvider theme={currentTheme}>{children}</ConfigProvider>
    </ThemeContext.Provider>
  )
}

export default ThemeProvider
