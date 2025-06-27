/**
 * V2 状态持久化入口文件 / V2 State Persistence Entry Point
 *
 * 导出所有持久化相关的类、配置和工具
 * Exports all persistence-related classes, configurations and utilities
 */

// 持久化管理器 / Persistence Manager
export {
  PersistenceManager,
  persistenceManager,
  PersistenceStrategy,
  type PersistenceConfig,
  type PersistenceStatistics
} from './persistence-manager'

// 持久化配置 / Persistence Configuration
export {
  videoPersistenceConfig,
  subtitlePersistenceConfig,
  playbackPersistenceConfig,
  uiPersistenceConfig,
  appConfigPersistenceConfig,
  userPreferencesPersistenceConfig,
  cachePersistenceConfig,
  persistenceConfigMap,
  getPersistenceConfig,
  createCustomPersistenceConfig,
  persistenceStrategyPresets,
  validatorFactory,
  persistenceConfigUtils,
  type PersistenceConfigKey
} from './persistence-config'
