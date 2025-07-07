/**
 * 外部服务入口文件 / External Services Entry Point
 *
 * 包含所有与外部API和第三方服务相关的接口和实现
 * Contains all external API and third-party service interfaces and implementations
 */

// 导出外部服务接口和实现
// Export external service interfaces and implementations

export { DictionaryService } from './dictionary.service'
export { DictionaryEngineFactory } from './engines'
export type {
  DictionaryEngine,
  DictionaryConfig,
  DictionaryQueryResult,
  DictionaryServiceStatus,
  DictionaryTestResult,
  DictionaryServiceStats,
  IDictionaryService
} from '../../infrastructure/types/service/dictionary.types'
