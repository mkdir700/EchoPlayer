import { setupRecentPlaysHandlers } from './recentPlaysHandlers'
import { setupAppConfigHandlers } from './appConfigHandlers'
import { setupGenericStorageHandlers } from './genericStorageHandlers'
import { setupSettingsHandlers } from './settingsHandlers'

/**
 * 设置所有存储相关的 IPC 处理器 / Setup all storage-related IPC handlers
 */
export function setupStoreHandlers(): void {
  // 设置最近播放列表处理器 / Setup recent plays handlers
  setupRecentPlaysHandlers()

  // 设置应用配置处理器 / Setup app config handlers
  setupAppConfigHandlers()

  // 设置通用存储处理器 / Setup generic storage handlers
  setupGenericStorageHandlers()

  // 设置设置处理器 / Setup settings handlers
  setupSettingsHandlers()
}

// 重新导出类型和函数
export { getAppConfig } from './appConfigHandlers'
export type { RecentPlayItem, StoreSchema } from '../../../types/shared'
