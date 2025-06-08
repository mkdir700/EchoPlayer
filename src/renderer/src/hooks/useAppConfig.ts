import { useState, useEffect, useCallback } from 'react'
import type { AppConfig, ApiResponse } from '@types_/shared'

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
} {
  const [config, setConfig] = useState<AppConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 加载应用配置 / Load application configuration
  const loadConfig = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const appConfig = await window.api.appConfig.getConfig()
      setConfig(appConfig)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '加载应用配置失败'
      setError(errorMessage)
      console.error('加载应用配置失败:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // 更新应用配置 / Update application configuration
  const updateConfig = useCallback(
    async (updates: Partial<AppConfig>): Promise<ApiResponse> => {
      try {
        setError(null)
        const response = await window.api.appConfig.updateConfig(updates)

        if (response.success) {
          // 重新加载配置以确保同步 / Reload configuration to ensure synchronization
          await loadConfig()
        } else {
          setError(response.error || '更新应用配置失败')
        }

        return response
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '更新应用配置失败'
        setError(errorMessage)
        console.error('更新应用配置失败:', err)
        return { success: false, error: errorMessage }
      }
    },
    [loadConfig]
  )

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

  // 初始化时加载配置 / Load configuration on initialization
  useEffect(() => {
    loadConfig()
  }, [loadConfig])

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
    dataDirectory: config?.dataDirectory ?? ''
  }
}
