/**
 * V2 状态持久化配置 / V2 State Persistence Configuration
 *
 * 定义各个 Store 的持久化配置和策略
 * Defines persistence configuration and strategies for each store
 */

import { type PersistenceConfig, PersistenceStrategy } from './persistence-manager'

/**
 * 视频状态持久化配置 / Video State Persistence Configuration
 */
export const videoPersistenceConfig: PersistenceConfig = {
  key: 'v2-video-state',
  strategy: PersistenceStrategy.DEBOUNCED,
  delay: 2000,
  maxRetries: 3,
  retryDelay: 1000,
  compress: false,
  encrypt: false,
  version: 1,
  validator: (data) => {
    return (
      data &&
      typeof data === 'object' &&
      Array.isArray(data.recentPlays) &&
      typeof data.playbackSettingsCache === 'object' &&
      typeof data.uiConfigCache === 'object'
    )
  }
}

/**
 * 字幕状态持久化配置 / Subtitle State Persistence Configuration
 */
export const subtitlePersistenceConfig: PersistenceConfig = {
  key: 'v2-subtitle-state',
  strategy: PersistenceStrategy.DEBOUNCED,
  delay: 1500,
  maxRetries: 3,
  retryDelay: 1000,
  compress: false,
  encrypt: false,
  version: 1,
  validator: (data) => {
    return (
      data &&
      typeof data === 'object' &&
      typeof data.displayConfig === 'object' &&
      typeof data.subtitleCache === 'object'
    )
  }
}

/**
 * 播放控制状态持久化配置 / Playback Control State Persistence Configuration
 */
export const playbackPersistenceConfig: PersistenceConfig = {
  key: 'v2-playback-state',
  strategy: PersistenceStrategy.THROTTLED,
  delay: 3000,
  maxRetries: 3,
  retryDelay: 1000,
  compress: false,
  encrypt: false,
  version: 1,
  validator: (data) => {
    return (
      data &&
      typeof data === 'object' &&
      typeof data.controlConfig === 'object' &&
      typeof data.loopConfig === 'object' &&
      typeof data.statistics === 'object'
    )
  }
}

/**
 * 界面状态持久化配置 / UI State Persistence Configuration
 */
export const uiPersistenceConfig: PersistenceConfig = {
  key: 'v2-ui-state',
  strategy: PersistenceStrategy.DEBOUNCED,
  delay: 1000,
  maxRetries: 3,
  retryDelay: 1000,
  compress: false,
  encrypt: false,
  version: 1,
  validator: (data) => {
    return (
      data &&
      typeof data === 'object' &&
      typeof data.themeMode === 'string' &&
      typeof data.layoutMode === 'string' &&
      typeof data.autoResumeAfterWordCard === 'boolean'
    )
  }
}

/**
 * 应用配置持久化配置 / App Configuration Persistence Configuration
 */
export const appConfigPersistenceConfig: PersistenceConfig = {
  key: 'v2-app-config',
  strategy: PersistenceStrategy.IMMEDIATE,
  maxRetries: 5,
  retryDelay: 500,
  compress: false,
  encrypt: true, // 应用配置可能包含敏感信息 / App config might contain sensitive information
  version: 1,
  validator: (data) => {
    return data && typeof data === 'object'
  }
}

/**
 * 用户偏好设置持久化配置 / User Preferences Persistence Configuration
 */
export const userPreferencesPersistenceConfig: PersistenceConfig = {
  key: 'v2-user-preferences',
  strategy: PersistenceStrategy.DEBOUNCED,
  delay: 2000,
  maxRetries: 3,
  retryDelay: 1000,
  compress: false,
  encrypt: false,
  version: 1,
  validator: (data) => {
    return data && typeof data === 'object'
  }
}

/**
 * 缓存数据持久化配置 / Cache Data Persistence Configuration
 */
export const cachePersistenceConfig: PersistenceConfig = {
  key: 'v2-cache-data',
  strategy: PersistenceStrategy.MANUAL, // 缓存数据手动控制持久化 / Cache data manually controls persistence
  maxRetries: 2,
  retryDelay: 2000,
  compress: true, // 缓存数据可能较大，启用压缩 / Cache data might be large, enable compression
  encrypt: false,
  version: 1,
  validator: (data) => {
    return data && typeof data === 'object'
  }
}

/**
 * 持久化配置映射 / Persistence Configuration Mapping
 */
export const persistenceConfigMap = {
  video: videoPersistenceConfig,
  subtitle: subtitlePersistenceConfig,
  playback: playbackPersistenceConfig,
  ui: uiPersistenceConfig,
  appConfig: appConfigPersistenceConfig,
  userPreferences: userPreferencesPersistenceConfig,
  cache: cachePersistenceConfig
} as const

/**
 * 持久化配置类型 / Persistence Configuration Type
 */
export type PersistenceConfigKey = keyof typeof persistenceConfigMap

/**
 * 获取持久化配置 / Get persistence configuration
 *
 * @param key 配置键名 / Configuration key
 * @returns 持久化配置 / Persistence configuration
 */
export function getPersistenceConfig(key: PersistenceConfigKey): PersistenceConfig {
  return persistenceConfigMap[key]
}

/**
 * 创建自定义持久化配置 / Create custom persistence configuration
 *
 * @param baseKey 基础配置键名 / Base configuration key
 * @param overrides 覆盖配置 / Override configuration
 * @returns 自定义持久化配置 / Custom persistence configuration
 */
export function createCustomPersistenceConfig(
  baseKey: PersistenceConfigKey,
  overrides: Partial<PersistenceConfig>
): PersistenceConfig {
  const baseConfig = getPersistenceConfig(baseKey)
  return {
    ...baseConfig,
    ...overrides
  }
}

/**
 * 持久化策略预设 / Persistence Strategy Presets
 */
export const persistenceStrategyPresets = {
  /**
   * 实时持久化 - 适用于重要配置 / Real-time persistence - suitable for important configurations
   */
  realTime: {
    strategy: PersistenceStrategy.IMMEDIATE,
    maxRetries: 5,
    retryDelay: 500
  },

  /**
   * 快速响应 - 适用于用户交互频繁的数据 / Quick response - suitable for frequently interacted data
   */
  quickResponse: {
    strategy: PersistenceStrategy.DEBOUNCED,
    delay: 500,
    maxRetries: 3,
    retryDelay: 1000
  },

  /**
   * 平衡模式 - 适用于一般状态数据 / Balanced mode - suitable for general state data
   */
  balanced: {
    strategy: PersistenceStrategy.DEBOUNCED,
    delay: 2000,
    maxRetries: 3,
    retryDelay: 1000
  },

  /**
   * 节约模式 - 适用于大量数据或低频更新 / Economy mode - suitable for large data or low-frequency updates
   */
  economy: {
    strategy: PersistenceStrategy.THROTTLED,
    delay: 5000,
    maxRetries: 2,
    retryDelay: 2000
  },

  /**
   * 手动控制 - 适用于需要精确控制的场景 / Manual control - suitable for scenarios requiring precise control
   */
  manual: {
    strategy: PersistenceStrategy.MANUAL,
    maxRetries: 3,
    retryDelay: 1000
  }
} as const

/**
 * 数据验证器工厂 / Data Validator Factory
 */
export const validatorFactory = {
  /**
   * 创建对象验证器 / Create object validator
   *
   * @param requiredKeys 必需的键名列表 / List of required keys
   * @returns 验证器函数 / Validator function
   */
  createObjectValidator: (requiredKeys: string[]) => {
    return (data: unknown): boolean => {
      if (!data || typeof data !== 'object') return false

      return requiredKeys.every((key) => key in data)
    }
  },

  /**
   * 创建数组验证器 / Create array validator
   *
   * @param itemValidator 数组项验证器 / Array item validator
   * @returns 验证器函数 / Validator function
   */
  createArrayValidator: (itemValidator?: (item: unknown) => boolean) => {
    return (data: unknown): boolean => {
      if (!Array.isArray(data)) return false

      if (itemValidator) {
        return data.every(itemValidator)
      }

      return true
    }
  },

  /**
   * 创建类型验证器 / Create type validator
   *
   * @param expectedType 期望的类型 / Expected type
   * @returns 验证器函数 / Validator function
   */
  createTypeValidator: (expectedType: string) => {
    return (data: unknown): boolean => {
      return typeof data === expectedType
    }
  },

  /**
   * 创建组合验证器 / Create composite validator
   *
   * @param validators 验证器列表 / List of validators
   * @returns 验证器函数 / Validator function
   */
  createCompositeValidator: (validators: Array<(data: unknown) => boolean>) => {
    return (data: unknown): boolean => {
      return validators.every((validator) => validator(data))
    }
  }
}

/**
 * 持久化配置工具 / Persistence Configuration Utilities
 */
export const persistenceConfigUtils = {
  /**
   * 验证持久化配置 / Validate persistence configuration
   *
   * @param config 持久化配置 / Persistence configuration
   * @returns 验证结果 / Validation result
   */
  validateConfig: (config: PersistenceConfig): { isValid: boolean; errors: string[] } => {
    const errors: string[] = []

    if (!config.key || typeof config.key !== 'string') {
      errors.push('配置键名无效')
    }

    if (!Object.values(PersistenceStrategy).includes(config.strategy)) {
      errors.push('持久化策略无效')
    }

    if (config.delay !== undefined && (typeof config.delay !== 'number' || config.delay < 0)) {
      errors.push('延迟时间无效')
    }

    if (
      config.maxRetries !== undefined &&
      (typeof config.maxRetries !== 'number' || config.maxRetries < 0)
    ) {
      errors.push('最大重试次数无效')
    }

    if (
      config.retryDelay !== undefined &&
      (typeof config.retryDelay !== 'number' || config.retryDelay < 0)
    ) {
      errors.push('重试延迟无效')
    }

    if (
      config.version !== undefined &&
      (typeof config.version !== 'number' || config.version < 1)
    ) {
      errors.push('版本号无效')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  },

  /**
   * 合并持久化配置 / Merge persistence configurations
   *
   * @param configs 配置列表 / List of configurations
   * @returns 合并后的配置 / Merged configuration
   */
  mergeConfigs: (...configs: Partial<PersistenceConfig>[]): PersistenceConfig => {
    const merged = configs.reduce(
      (acc, config) => ({
        ...acc,
        ...config
      }),
      {} as PersistenceConfig
    )

    // 确保必需字段存在 / Ensure required fields exist
    if (!merged.key) {
      throw new Error('合并后的配置缺少键名')
    }

    if (!merged.strategy) {
      merged.strategy = PersistenceStrategy.DEBOUNCED
    }

    return merged as PersistenceConfig
  }
}
