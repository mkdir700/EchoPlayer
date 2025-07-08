import { StorageConfig, StorageEngine } from '@renderer/v2/infrastructure/types/service'
import { AppConfigStorageService } from './app-config-storage.service'
import { ServiceRegistry } from '@renderer/v2/infrastructure'
import { logger } from '@renderer/utils'

export function registerAppConfigStorageService(): void {
  const registry = ServiceRegistry.getInstance()
  const appConfigStorageService = new AppConfigStorageService()

  // 注册应用配置存储服务 / Register application configuration storage service
  registry.register('AppConfigStorageService', appConfigStorageService, {
    dependencies: [
      // 应用配置存储服务依赖 IPC 客户端服务 / Application configuration storage service depends on IPC client service
      { name: 'IPCClientService', required: true }
    ],
    singleton: true, // 单例模式 / Singleton pattern
    autoStart: true, // 自动启动 / Auto start
    priority: 50 // 中等优先级 / Medium priority
  })
}

/**
 * 获取应用配置存储服务实例 / Get application configuration storage service instance
 */
export function getAppConfigStorageService(): AppConfigStorageService {
  const registry = ServiceRegistry.getInstance()
  return registry.get<AppConfigStorageService>('AppConfigStorageService')
}

export const DEFAULT_APP_CONFIG_STORAGE_SERVICE_CONFIG: StorageConfig = {
  engine: StorageEngine.FILE_SYSTEM,
  namespace: 'config'
}

export async function initializeAppConfigStorageServiceConfig(): Promise<void> {
  try {
    const appConfigStorageService = getAppConfigStorageService()

    // 确保服务已初始化 / Ensure service is initialized
    if (!appConfigStorageService.isInitialized) {
      await appConfigStorageService.initialize()
    }

    // 配置服务 / Configure service
    await appConfigStorageService.configure(DEFAULT_APP_CONFIG_STORAGE_SERVICE_CONFIG)

    console.log('App config storage service configured successfully')
  } catch (error) {
    logger.error('Failed to configure app config storage service:', error)
    throw error
  }
}
