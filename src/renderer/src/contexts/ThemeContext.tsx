import React, { useState, useCallback, useEffect, useMemo } from 'react'
import { ConfigProvider, theme } from 'antd'
import type { ThemeConfig } from 'antd'
import { ThemeContext } from '@renderer/contexts/theme-context'
import appleTheme, { appleDarkTheme } from '@renderer/styles/theme'
import type { ThemeCustomization } from '@types_/shared'
import { useAppConfig } from '@renderer/hooks/useAppConfig'
import { defaultThemeCustomization } from '../constants/themeConfig'

// 生成主题配置
const generateThemeConfig = (customization: ThemeCustomization): ThemeConfig => {
  const baseTheme =
    customization.algorithm === 'dark' || customization.algorithm === 'darkCompact'
      ? appleDarkTheme
      : appleTheme

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
  // 获取持久化配置hook
  const { themeCustomization, updateThemeCustomization, resetThemeCustomization, loading } =
    useAppConfig()

  // 本地主题状态 - 确保立即生效
  const [localCustomization, setLocalCustomization] =
    useState<ThemeCustomization>(defaultThemeCustomization)
  const [isInitialized, setIsInitialized] = useState(false)

  // 从持久化配置初始化本地状态
  useEffect(() => {
    if (!loading && themeCustomization && !isInitialized) {
      console.log('🔄 从持久化配置初始化本地主题状态:', themeCustomization)
      setLocalCustomization(themeCustomization)
      setIsInitialized(true)
    }
  }, [themeCustomization, loading, isInitialized])

  // 生成当前主题配置
  const currentTheme = useMemo(() => {
    const theme = generateThemeConfig(localCustomization)
    console.log('🎨 当前主题配置生成:', {
      algorithm: localCustomization.algorithm,
      colorPrimary: localCustomization.colorPrimary,
      timestamp: Date.now()
    })
    return theme
  }, [localCustomization])

  // 更新主题的核心方法
  const updateAndApplyTheme = useCallback(
    async (updates: Partial<ThemeCustomization>) => {
      console.log('🚀 开始更新主题:', updates)

      // 1. 立即更新本地状态，确保UI立即响应
      const newCustomization = { ...localCustomization, ...updates }
      setLocalCustomization(newCustomization)
      console.log('⚡ 本地主题状态立即更新:', newCustomization)

      // 2. 异步保存到持久化存储
      try {
        await updateThemeCustomization(updates)
        console.log('💾 主题配置已保存到持久化存储')
      } catch (error) {
        console.error('❌ 保存主题配置失败:', error)
        // 如果保存失败，可以选择回滚本地状态或显示错误提示
      }
    },
    [localCustomization, updateThemeCustomization]
  )

  const updateCustomization = useCallback(
    async (updates: Partial<ThemeCustomization>) => {
      await updateAndApplyTheme(updates)
    },
    [updateAndApplyTheme]
  )

  const resetToDefault = useCallback(async () => {
    console.log('🔄 重置主题为默认配置')

    // 1. 立即更新本地状态
    setLocalCustomization(defaultThemeCustomization)
    console.log('⚡ 本地主题状态立即重置')

    // 2. 异步保存到持久化存储
    try {
      await resetThemeCustomization()
      console.log('💾 默认主题配置已保存到持久化存储')
    } catch (error) {
      console.error('❌ 重置主题配置失败:', error)
    }
  }, [resetThemeCustomization])

  const applyTheme = useCallback(() => {
    console.log('🎨 应用当前主题 (no-op)')
  }, [])

  // 创建context值
  const contextValue = useMemo(
    () => ({
      currentTheme,
      customization: localCustomization,
      updateCustomization,
      updateAndApplyTheme,
      resetToDefault,
      applyTheme
    }),
    [
      currentTheme,
      localCustomization,
      updateCustomization,
      updateAndApplyTheme,
      resetToDefault,
      applyTheme
    ]
  )

  return (
    <ThemeContext.Provider value={contextValue}>
      <ConfigProvider theme={currentTheme}>{children}</ConfigProvider>
    </ThemeContext.Provider>
  )
}

export default ThemeProvider
