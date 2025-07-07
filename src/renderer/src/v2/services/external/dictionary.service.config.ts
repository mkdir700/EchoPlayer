/**
 * 词典服务配置 / Dictionary Service Configuration
 *
 * 词典服务的注册和配置示例
 * Example registration and configuration for Dictionary Service
 */

import { ServiceRegistry } from '../../infrastructure/core/service-registry'
import { DictionaryService } from './dictionary.service'

/**
 * 注册词典服务到服务注册表 / Register Dictionary Service to Service Registry
 */
export function registerDictionaryService(): void {
  const registry = ServiceRegistry.getInstance()
  const dictionaryService = new DictionaryService()

  // 注册词典服务 / Register dictionary service
  registry.register('DictionaryService', dictionaryService, {
    dependencies: [
      // 词典服务依赖IPC客户端服务 / Dictionary service depends on IPC client service
      { name: 'IPCClientService', required: true }
    ],
    singleton: true, // 单例模式 / Singleton pattern
    autoStart: true, // 自动启动 / Auto start
    priority: 50 // 中等优先级 / Medium priority
  })
}

/**
 * 获取词典服务实例 / Get Dictionary Service Instance
 */
export function getDictionaryService(): DictionaryService {
  const registry = ServiceRegistry.getInstance()
  return registry.get<DictionaryService>('DictionaryService')
}

/**
 * 词典服务的默认配置 / Default Configuration for Dictionary Service
 */
export const DEFAULT_DICTIONARY_CONFIG = {
  engine: 'eudic-html' as const,
  cacheEnabled: true,
  cacheTtl: 3600000, // 1小时 / 1 hour
  timeout: 10000, // 10秒超时 / 10 seconds timeout
  retries: 3, // 重试3次 / 3 retries
  retryDelay: 1000 // 重试延迟1秒 / 1 second retry delay
}

/**
 * 初始化词典服务配置 / Initialize Dictionary Service Configuration
 *
 * 这个函数可以在应用启动时调用，为词典服务设置默认配置
 * This function can be called during app startup to set default configuration for dictionary service
 */
export async function initializeDictionaryServiceConfig(): Promise<void> {
  try {
    const dictionaryService = getDictionaryService()

    // 确保服务已初始化 / Ensure service is initialized
    if (!dictionaryService.isInitialized) {
      await dictionaryService.initialize()
    }

    // 配置服务 / Configure service
    await dictionaryService.configure(DEFAULT_DICTIONARY_CONFIG)

    console.log('Dictionary service configured successfully')
  } catch (error) {
    console.error('Failed to initialize dictionary service configuration:', error)
    throw error
  }
}
