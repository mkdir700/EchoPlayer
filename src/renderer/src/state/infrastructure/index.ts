/**
 * V2 状态管理基础设施入口文件 / V2 State Management Infrastructure Entry Point
 *
 * 导出所有状态管理基础设施相关的工具和配置
 * Exports all state management infrastructure related tools and configurations
 */

// 存储引擎 / Storage Engine
export { createStorageConfig, type StorageOptions } from './storage-config'
export { StorageEngine } from './storage-engine'

// 中间件配置 / Middleware Configuration
export {
  createMiddleware,
  type MiddlewareOptions,
  MiddlewarePresets,
  MiddlewareUtils,
  StateMigration
} from './middleware'

// 工具函数 / Utility Functions
export {
  type AsyncStateAction,
  createAction,
  createSelector,
  createSelectors,
  formatTime,
  type StateAction,
  type StateSelector
} from './utils'
