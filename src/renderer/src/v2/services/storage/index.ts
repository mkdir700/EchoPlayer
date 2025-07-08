/**
 * 存储服务入口文件 / Storage Services Entry Point
 *
 * 包含所有与存储相关的服务接口和实现
 * Contains all storage-related service interfaces and implementations
 */

// 导出配置存储服务 / Export configuration storage service
export {
  AppConfigStorageService as ConfigStorageService,
  createConfigStorageService
} from './app-config-storage.service'

// 导出存储服务类型 / Export storage service types
export type {
  IConfigStorageService,
  ICacheStorageService,
  IUserDataStorageService,
  IStorageService
} from '../../infrastructure/types/service/storage.types'
