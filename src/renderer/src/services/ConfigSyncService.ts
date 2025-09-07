import { loggerService } from '@logger'
import { useSettingsStore } from '@renderer/state/stores/settings.store'
import { UpgradeChannel } from '@shared/config/constant'
import { LanguageVarious, ThemeMode } from '@types'

const logger = loggerService.withContext('ConfigSyncService')

/**
 * 配置同步服务
 * 负责在应用启动时从 main 进程同步配置到 renderer 进程的 store
 */
export class ConfigSyncService {
  private static instance: ConfigSyncService

  private constructor() {
    // 私有构造函数，确保单例模式
  }

  static getInstance(): ConfigSyncService {
    if (!ConfigSyncService.instance) {
      ConfigSyncService.instance = new ConfigSyncService()
    }
    return ConfigSyncService.instance
  }

  /**
   * 同步所有配置项到 SettingsStore
   */
  async syncAllConfigs(): Promise<void> {
    logger.info('🔄 开始同步配置从 main 进程到 renderer store')

    try {
      // 检查API是否可用
      if (!window.api || !window.api.config || typeof window.api.config.get !== 'function') {
        logger.warn('⚠️ window.api.config.get 不可用，跳过配置同步')
        return
      }

      // 批量获取所有需要同步的配置项
      const configs = await this.getAllConfigsFromMain()

      // 应用到 store
      this.applyConfigsToStore(configs)

      logger.info('✅ 配置同步完成', { configs })
    } catch (error) {
      logger.error('❌ 配置同步失败:', { error })
      // 不抛出异常，让应用继续启动
    }
  }

  /**
   * 从 main 进程获取所有需要同步的配置项
   */
  private async getAllConfigsFromMain(): Promise<Record<string, any>> {
    const configKeys = [
      'testPlan',
      'testChannel',
      'autoUpdate',
      'theme',
      'language',
      'tray',
      'trayOnClose',
      'launchToTray'
    ]

    const configs: Record<string, any> = {}

    // 确保API可用
    if (!window.api || !window.api.config || typeof window.api.config.get !== 'function') {
      logger.warn('window.api.config.get 不可用，返回空配置')
      return configs
    }

    // 并发获取所有配置项
    await Promise.all(
      configKeys.map(async (key) => {
        try {
          const value = await window.api.config.get(key)
          if (value !== undefined) {
            configs[key] = value
          }
        } catch (error) {
          logger.warn(`获取配置 ${key} 失败:`, { error })
        }
      })
    )

    return configs
  }

  /**
   * 将配置应用到 SettingsStore
   */
  private applyConfigsToStore(configs: Record<string, any>): void {
    const store = useSettingsStore.getState()

    // testPlan
    if (configs.testPlan !== undefined && typeof configs.testPlan === 'boolean') {
      store.setTestPlan(configs.testPlan)
      logger.debug('同步 testPlan:', { testPlan: configs.testPlan })
    }

    // testChannel
    if (
      configs.testChannel !== undefined &&
      Object.values(UpgradeChannel).includes(configs.testChannel)
    ) {
      store.setTestChannel(configs.testChannel)
      logger.debug('同步 testChannel:', { testChannel: configs.testChannel })
    }

    // autoUpdate
    if (configs.autoUpdate !== undefined && typeof configs.autoUpdate === 'boolean') {
      store.setAutoCheckUpdate(configs.autoUpdate)
      logger.debug('同步 autoUpdate:', { autoUpdate: configs.autoUpdate })
    }

    // theme
    if (configs.theme !== undefined && Object.values(ThemeMode).includes(configs.theme)) {
      store.setTheme(configs.theme)
      logger.debug('同步 theme:', { theme: configs.theme })
    }

    // language
    if (configs.language !== undefined && typeof configs.language === 'string') {
      store.setLanguage(configs.language as LanguageVarious)
      logger.debug('同步 language:', { language: configs.language })
    }

    // tray
    if (configs.tray !== undefined && typeof configs.tray === 'boolean') {
      store.setShowTray(configs.tray)
      logger.debug('同步 tray:', { tray: configs.tray })
    }

    // trayOnClose
    if (configs.trayOnClose !== undefined && typeof configs.trayOnClose === 'boolean') {
      store.setTrayOnClose(configs.trayOnClose)
      logger.debug('同步 trayOnClose:', { trayOnClose: configs.trayOnClose })
    }

    // launchToTray
    if (configs.launchToTray !== undefined && typeof configs.launchToTray === 'boolean') {
      store.setLaunchToTray(configs.launchToTray)
      logger.debug('同步 launchToTray:', { launchToTray: configs.launchToTray })
    }
  }

  /**
   * 同步单个配置项
   */
  async syncSingleConfig<T>(key: string, setter: (value: T) => void): Promise<void> {
    try {
      // 检查API可用性
      if (!window.api || !window.api.config || typeof window.api.config.get !== 'function') {
        logger.warn(`window.api.config.get 不可用，跳过配置 ${key} 同步`)
        return
      }

      const value = await window.api.config.get(key)
      if (value !== undefined) {
        setter(value)
        logger.debug(`同步单个配置 ${key}:`, { [key]: value })
      }
    } catch (error) {
      logger.warn(`同步配置 ${key} 失败:`, { error })
    }
  }
}

// 导出单例实例
export const configSyncService = ConfigSyncService.getInstance()
