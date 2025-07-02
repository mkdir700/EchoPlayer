/**
 * V2 状态管理系统入口文件 / V2 State Management System Entry Point
 */

/**
 * V2 状态管理系统版本信息 / V2 State Management System Version Info
 */
export const V2_STATE_VERSION = '1.0.0'

/**
 * V2 状态管理系统初始化函数 / V2 State Management System Initialization Function
 *
 * 在应用启动时调用，初始化状态管理系统
 * Called on app startup to initialize the state management system
 */
export async function initializeV2StateSystem(): Promise<void> {
  try {
    console.log(`🚀 初始化 V2 状态管理系统 v${V2_STATE_VERSION}`)

    // 预热存储引擎缓存 / Warm up storage engine cache
    const { v2StorageEngine } = await import('./infrastructure/storage-engine')
    await v2StorageEngine.warmUpCache([
      'v2-video-state',
      'v2-subtitle-state',
      'v2-playback-state',
      'v2-ui-state'
    ])

    // TODO: 初始化持久化管理器 / Initialize persistence manager
    // const { persistenceManager } = await import('./persistence')

    console.log('✅ V2 状态管理系统初始化完成')
  } catch (error) {
    console.error('❌ V2 状态管理系统初始化失败', error)
    throw error
  }
}

/**
 * V2 状态管理系统清理函数 / V2 State Management System Cleanup Function
 *
 * 在应用关闭时调用，清理状态管理系统资源
 * Called on app shutdown to cleanup state management system resources
 */
export async function cleanupV2StateSystem(): Promise<void> {
  try {
    console.log('🧹 清理 V2 状态管理系统')

    // 执行待处理的持久化任务 / Execute pending persistence tasks
    const { persistenceManager } = await import('./persistence')
    await persistenceManager.executePendingTasks()

    // 清理持久化管理器资源 / Cleanup persistence manager resources
    persistenceManager.cleanup()

    // 清理存储引擎缓存 / Clear storage engine cache
    const { v2StorageEngine } = await import('./infrastructure/storage-engine')
    v2StorageEngine.clearCache()

    console.log('✅ V2 状态管理系统清理完成')
  } catch (error) {
    console.error('❌ V2 状态管理系统清理失败', error)
  }
}

/**
 * 获取 V2 状态管理系统统计信息 / Get V2 State Management System Statistics
 */
// export async function getV2StateSystemStats(): Promise<{
//   version: string
//   cacheStats: any
//   persistenceStats: any
// }> {
//   try {
//     const { v2StorageEngine } = await import('./infrastructure/storage-engine')
//     const { persistenceManager } = await import('./persistence')

//     return {
//       version: V2_STATE_VERSION,
//       cacheStats: v2StorageEngine.getCacheStats(),
//       persistenceStats: persistenceManager.getStatistics()
//     }
//   } catch (error) {
//     console.error('❌ 获取 V2 状态管理系统统计信息失败', error)
//     return {
//       version: V2_STATE_VERSION,
//       cacheStats: { size: 0, keys: [] },
//       persistenceStats: {
//         totalOperations: 0,
//         successfulOperations: 0,
//         failedOperations: 0,
//         averageLatency: 0,
//         cacheHitRate: 0,
//         lastOperationTime: new Date()
//       }
//     }
//   }
// }
