import { useState, useEffect, useCallback } from 'react'
import type { AppConfig, ApiResponse, ThemeCustomization } from '@types_/shared'
import { defaultThemeCustomization } from '@renderer/constants/themeConfig'

/**
 * 从 localStorage 迁移主题设置到应用配置 / Migrate theme settings from localStorage to app config
 */
const migrateThemeFromLocalStorage = async (
  updateConfig: (updates: Partial<AppConfig>) => Promise<ApiResponse>
): Promise<void> => {
  try {
    const savedTheme = localStorage.getItem('echolab-theme-customization')
    if (savedTheme) {
      console.log('🔄 检测到 localStorage 中的主题设置，开始迁移...')
      const themeCustomization = JSON.parse(savedTheme) as ThemeCustomization

      // 迁移到应用配置 / Migrate to app config
      const response = await updateConfig({ themeCustomization })

      if (response.success) {
        // 迁移成功，删除 localStorage 中的数据 / Migration successful, remove localStorage data
        localStorage.removeItem('echolab-theme-customization')
        console.log('✅ 主题设置迁移完成，已清理 localStorage')
      } else {
        console.warn('⚠️ 主题设置迁移失败:', response.error)
      }
    }
  } catch (error) {
    console.warn('⚠️ 主题设置迁移过程中出错:', error)
  }
}

/**
 * 应用配置管理 Hook / Application configuration management hook
 * 提供应用级配置的读取、更新和重置功能 / Provides read, update, and reset functionality for application-level configuration
 */
export function useAppConfig(): {
  config: AppConfig | null
  loading: boolean
  error: string | null
  loadConfig: () => Promise<void>
  updateConfig: (updates: Partial<AppConfig>) => Promise<ApiResponse>
  resetConfig: () => Promise<ApiResponse>
  restartApp: () => Promise<void>
  useWindowFrame: boolean
  appTheme: 'system' | 'light' | 'dark'
  autoCheckUpdates: boolean
  language: 'zh-CN' | 'en-US'
  dataDirectory: string
  themeCustomization: ThemeCustomization | null
  updateThemeCustomization: (updates: Partial<ThemeCustomization>) => Promise<ApiResponse>
  resetThemeCustomization: () => Promise<ApiResponse>
} {
  const [config, setConfig] = useState<AppConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [migrationCompleted, setMigrationCompleted] = useState(false)

  // 加载应用配置 / Load application configuration
  const loadConfig = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      console.log('📖 开始加载应用配置...')
      const appConfig = await window.api.appConfig.getConfig()
      console.log('✅ 应用配置加载成功:', appConfig)
      setConfig(appConfig)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '加载应用配置失败'
      setError(errorMessage)
      console.error('❌ 加载应用配置失败:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // 更新应用配置 / Update application configuration
  const updateConfig = useCallback(
    async (updates: Partial<AppConfig>): Promise<ApiResponse> => {
      try {
        setError(null)
        console.log('🔧 开始更新应用配置:', updates)
        const response = await window.api.appConfig.updateConfig(updates)
        console.log('📤 配置更新响应:', response)

        if (response.success) {
          // 重新加载配置以确保同步 / Reload configuration to ensure synchronization
          console.log('🔄 重新加载配置以确保同步...')
          await loadConfig()
        } else {
          setError(response.error || '更新应用配置失败')
        }

        return response
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '更新应用配置失败'
        setError(errorMessage)
        console.error('❌ 更新应用配置失败:', err)
        return { success: false, error: errorMessage }
      }
    },
    [loadConfig]
  )

  // 更新主题自定义配置 / Update theme customization configuration
  const updateThemeCustomization = useCallback(
    async (updates: Partial<ThemeCustomization>): Promise<ApiResponse> => {
      try {
        setError(null)
        const currentThemeCustomization = config?.themeCustomization || defaultThemeCustomization
        const newThemeCustomization: ThemeCustomization = {
          ...currentThemeCustomization,
          ...updates
        }

        console.log('🎨 开始更新主题配置:', {
          current: currentThemeCustomization,
          updates,
          new: newThemeCustomization
        })

        const response = await window.api.appConfig.updateConfig({
          themeCustomization: newThemeCustomization
        })

        console.log('📤 主题配置更新响应:', response)

        if (response.success) {
          // 立即更新本地状态以确保主题立即生效 / Immediately update local state to ensure theme takes effect immediately
          console.log('⚡ 立即更新本地配置状态...')
          setConfig((prevConfig) => ({
            ...prevConfig!,
            themeCustomization: newThemeCustomization
          }))

          // 异步重新加载配置以确保长期同步 / Asynchronously reload configuration for long-term synchronization
          setTimeout(async () => {
            console.log('🔄 异步重新加载配置以确保同步...')
            await loadConfig()
          }, 100)
        } else {
          setError(response.error || '更新主题配置失败')
        }

        return response
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '更新主题配置失败'
        setError(errorMessage)
        console.error('❌ 更新主题配置失败:', err)
        return { success: false, error: errorMessage }
      }
    },
    [config?.themeCustomization, loadConfig]
  )

  // 重置主题自定义配置 / Reset theme customization configuration
  const resetThemeCustomization = useCallback(async (): Promise<ApiResponse> => {
    try {
      setError(null)
      const response = await window.api.appConfig.updateConfig({
        themeCustomization: defaultThemeCustomization
      })

      if (response.success) {
        // 重新加载配置以确保同步 / Reload configuration to ensure synchronization
        await loadConfig()
      } else {
        setError(response.error || '重置主题配置失败')
      }

      return response
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '重置主题配置失败'
      setError(errorMessage)
      console.error('重置主题配置失败:', err)
      return { success: false, error: errorMessage }
    }
  }, [loadConfig])

  // 重置应用配置 / Reset application configuration
  const resetConfig = useCallback(async (): Promise<ApiResponse> => {
    try {
      setError(null)
      const response = await window.api.appConfig.resetConfig()

      if (response.success) {
        // 重新加载配置以确保同步 / Reload configuration to ensure synchronization
        await loadConfig()
      } else {
        setError(response.error || '重置应用配置失败')
      }

      return response
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '重置应用配置失败'
      setError(errorMessage)
      console.error('重置应用配置失败:', err)
      return { success: false, error: errorMessage }
    }
  }, [loadConfig])

  // 重启应用 / Restart application
  const restartApp = useCallback(async (): Promise<void> => {
    try {
      await window.api.window.restart()
    } catch (err) {
      console.error('重启应用失败:', err)
      throw err
    }
  }, [])

  // 初始化时加载配置和执行迁移 / Load configuration and perform migration on initialization
  useEffect(() => {
    const initializeConfig = async (): Promise<void> => {
      await loadConfig()

      // 只在首次加载且未完成迁移时执行迁移 / Only perform migration on first load and if not completed
      if (!migrationCompleted) {
        await migrateThemeFromLocalStorage(updateConfig)
        setMigrationCompleted(true)
      }
    }

    initializeConfig()
  }, [loadConfig, updateConfig, migrationCompleted])

  return {
    config,
    loading,
    error,
    loadConfig,
    updateConfig,
    resetConfig,
    restartApp,
    // 便捷的配置属性访问 / Convenient configuration property access
    useWindowFrame: config?.useWindowFrame ?? false,
    appTheme: config?.appTheme ?? 'system',
    autoCheckUpdates: config?.autoCheckUpdates ?? true,
    language: config?.language ?? 'zh-CN',
    dataDirectory: config?.dataDirectory ?? '',
    themeCustomization: config?.themeCustomization ?? null,
    // 主题自定义配置管理 / Theme customization configuration management
    updateThemeCustomization,
    resetThemeCustomization
  }
}
