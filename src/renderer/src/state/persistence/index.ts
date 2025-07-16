/**
 * V2 状态持久化入口文件 / V2 State Persistence Entry Point
 *
 * 导出所有持久化相关的类、配置和工具
 * Exports all persistence-related classes, configurations and utilities
 */

// 持久化管理器 / Persistence Manager
export {
  type PersistenceConfig,
  PersistenceManager,
  persistenceManager,
  type PersistenceStatistics,
  PersistenceStrategy
} from './persistence-manager'

// 持久化配置 / Persistence Configuration
export {
  appConfigPersistenceConfig,
  cachePersistenceConfig,
  createCustomPersistenceConfig,
  getPersistenceConfig,
  type PersistenceConfigKey,
  persistenceConfigMap,
  persistenceConfigUtils,
  persistenceStrategyPresets,
  playbackPersistenceConfig,
  subtitlePersistenceConfig,
  uiPersistenceConfig,
  userPreferencesPersistenceConfig,
  validatorFactory,
  videoPersistenceConfig
} from './persistence-config'
