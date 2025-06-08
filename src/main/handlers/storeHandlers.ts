import { ipcMain, app } from 'electron'
import { Conf } from 'electron-conf/main'
import path from 'path'
import type {
  RecentPlayItem,
  StoreSchema,
  ApiResponse,
  ApiResponseWithCount,
  VideoUIConfig,
  AppConfig
} from '../../types/shared'

// 获取默认数据目录 / Get default data directory
function getDefaultDataDirectory(): string {
  return path.join(app.getPath('userData'), 'data')
}

// 默认应用配置 / Default application configuration
const defaultAppConfig: AppConfig = {
  useWindowFrame: false, // 默认使用自定义标题栏 / Default to custom title bar
  appTheme: 'system', // 默认跟随系统主题 / Default to system theme
  autoCheckUpdates: true, // 默认自动检查更新 / Default to auto check updates
  language: 'zh-CN', // 默认语言为中文 / Default language is Chinese
  dataDirectory: getDefaultDataDirectory() // 默认数据目录使用系统位置 / Default data directory uses system location
}

// 创建 store 实例
const store = new Conf({
  name: 'echolab-recent-plays',
  defaults: {
    recentPlays: [],
    settings: {
      maxRecentItems: 20,
      playback: {
        isAutoScrollEnabled: true,
        displayMode: 'bilingual',
        volume: 1,
        playbackRate: 1.0,
        isSingleLoop: false,
        isAutoPause: false
      },
      update: {
        autoUpdate: true,
        lastChecked: 0,
        updateChannel: 'stable'
      },
      app: defaultAppConfig // 添加应用配置 / Add application configuration
    },
    appConfig: defaultAppConfig // 单独的应用配置存储 / Separate application configuration storage
  }
})

// 生成唯一 ID
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

// 设置最近播放列表相关的 IPC 处理器
export function setupStoreHandlers(): void {
  // 获取所有最近播放项
  ipcMain.handle('store:get-recent-plays', (): RecentPlayItem[] => {
    try {
      const recentPlays = store.get('recentPlays', []) as RecentPlayItem[]
      // 按最后打开时间降序排序
      return recentPlays.sort((a, b) => b.lastOpenedAt - a.lastOpenedAt)
    } catch (error) {
      console.error('获取最近播放列表失败:', error)
      return []
    }
  })

  // 添加或更新最近播放项
  ipcMain.handle(
    'store:add-recent-play',
    (_, item: Omit<RecentPlayItem, 'fileId' | 'lastOpenedAt'>): ApiResponse => {
      try {
        const recentPlays = store.get('recentPlays', []) as RecentPlayItem[]
        const settings = store.get('settings', { maxRecentItems: 20 }) as {
          maxRecentItems: number
        }
        const maxItems = settings.maxRecentItems

        console.log('📝 添加/更新最近播放项:', {
          filePath: item.filePath,
          hasSubtitles: !!item.subtitleItems,
          subtitlesLength: item.subtitleItems?.length || 0
        })

        // 检查是否已存在相同文件路径的项
        const existingIndex = recentPlays.findIndex((play) => play.filePath === item.filePath)

        const newItem: RecentPlayItem = {
          ...item,
          fileId: existingIndex >= 0 ? recentPlays[existingIndex].fileId : generateId(),
          lastOpenedAt: Date.now()
        }

        if (existingIndex >= 0) {
          // 更新现有项
          recentPlays[existingIndex] = newItem
        } else {
          // 添加新项
          recentPlays.unshift(newItem)
        }

        // 限制列表长度
        if (recentPlays.length > maxItems) {
          recentPlays.splice(maxItems)
        }

        store.set('recentPlays', recentPlays)
        return { success: true, fileId: newItem.fileId }
      } catch (error) {
        console.error('添加最近播放项失败:', error)
        return { success: false, error: error instanceof Error ? error.message : '未知错误' }
      }
    }
  )

  // 更新最近播放项
  ipcMain.handle(
    'store:update-recent-play',
    (_, id: string, updates: Partial<Omit<RecentPlayItem, 'fileId'>>): ApiResponse => {
      try {
        const recentPlays = store.get('recentPlays', []) as RecentPlayItem[]
        const index = recentPlays.findIndex((play) => play.fileId === id)

        if (index === -1) {
          return { success: false, error: '未找到指定的播放项' }
        }

        console.log('🔄 更新最近播放项:', {
          id,
          updates,
          hasSubtitles: updates.subtitleItems ? updates.subtitleItems.length : 'undefined',
          originalSubtitles: recentPlays[index].subtitleItems
            ? recentPlays[index].subtitleItems.length
            : 'undefined'
        })

        // 更新项目，但保持 lastOpenedAt 不变（除非明确指定）
        recentPlays[index] = {
          ...recentPlays[index],
          ...updates
        }
        store.set('recentPlays', recentPlays)

        console.log(
          '✅ 更新完成，最终字幕数量:',
          recentPlays[index].subtitleItems ? recentPlays[index].subtitleItems.length : 'undefined'
        )
        return { success: true }
      } catch (error) {
        console.error('更新最近播放项失败:', error)
        return { success: false, error: error instanceof Error ? error.message : '未知错误' }
      }
    }
  )

  // 删除最近播放项
  ipcMain.handle('store:remove-recent-play', (_, id: string): ApiResponse => {
    try {
      const recentPlays = store.get('recentPlays', []) as RecentPlayItem[]
      const filteredPlays = recentPlays.filter((play) => play.fileId !== id)

      if (filteredPlays.length === recentPlays.length) {
        return { success: false, error: '未找到指定的播放项' }
      }

      store.set('recentPlays', filteredPlays)
      return { success: true }
    } catch (error) {
      console.error('删除最近播放项失败:', error)
      return { success: false, error: error instanceof Error ? error.message : '未知错误' }
    }
  })

  // 清空最近播放列表
  ipcMain.handle('store:clear-recent-plays', (): ApiResponse => {
    try {
      store.set('recentPlays', [])
      return { success: true }
    } catch (error) {
      console.error('清空最近播放列表失败:', error)
      return { success: false, error: error instanceof Error ? error.message : '未知错误' }
    }
  })

  // 根据文件路径获取最近播放项
  ipcMain.handle('store:get-recent-play-by-path', (_, filePath: string): RecentPlayItem | null => {
    try {
      const recentPlays = store.get('recentPlays', []) as RecentPlayItem[]
      return recentPlays.find((play) => play.filePath === filePath) || null
    } catch (error) {
      console.error('根据路径获取最近播放项失败:', error)
      return null
    }
  })

  // 根据文件ID获取最近播放项
  ipcMain.handle('store:get-recent-play-by-file-id', (_, fileId: string): RecentPlayItem | null => {
    try {
      const recentPlays = store.get('recentPlays', []) as RecentPlayItem[]
      return recentPlays.find((play) => play.fileId === fileId) || null
    } catch (error) {
      console.error('根据文件ID获取最近播放项失败:', error)
      return null
    }
  })

  // 获取设置
  ipcMain.handle('store:get-settings', () => {
    try {
      return store.get('settings', {
        maxRecentItems: 20,
        playback: {
          isAutoScrollEnabled: true,
          displayMode: 'bilingual',
          volume: 0.8,
          playbackRate: 1.0,
          isSingleLoop: false,
          isAutoPause: false
        }
      })
    } catch (error) {
      console.error('获取设置失败:', error)
      return {
        maxRecentItems: 20,
        playback: {
          isAutoScrollEnabled: true,
          displayMode: 'bilingual',
          volume: 0.8,
          playbackRate: 1.0,
          isSingleLoop: false,
          isAutoPause: false
        }
      }
    }
  })

  // 更新设置
  ipcMain.handle(
    'store:update-settings',
    (_, settings: Partial<StoreSchema['settings']>): ApiResponse => {
      try {
        const currentSettings = store.get('settings', {
          maxRecentItems: 20,
          playback: {
            isAutoScrollEnabled: true,
            displayMode: 'bilingual',
            volume: 0.8,
            playbackRate: 1.0,
            isSingleLoop: false,
            isAutoPause: false
          },
          update: {
            autoUpdate: true,
            lastChecked: 0,
            updateChannel: 'stable'
          }
        }) as StoreSchema['settings']

        // 深度合并设置，特别处理 playback 和 update 对象
        const newSettings = {
          ...currentSettings,
          ...settings,
          playback: {
            ...currentSettings.playback,
            ...(settings.playback || {})
          },
          update: {
            ...currentSettings.update,
            ...(settings.update || {})
          }
        }

        store.set('settings', newSettings)

        // 如果更新了最大项目数，需要裁剪现有列表
        if (settings.maxRecentItems !== undefined) {
          const recentPlays = store.get('recentPlays', []) as RecentPlayItem[]
          if (recentPlays.length > settings.maxRecentItems) {
            const trimmedPlays = recentPlays.slice(0, settings.maxRecentItems)
            store.set('recentPlays', trimmedPlays)
          }
        }

        return { success: true }
      } catch (error) {
        console.error('更新设置失败:', error)
        return { success: false, error: error instanceof Error ? error.message : '未知错误' }
      }
    }
  )

  // 批量操作：删除多个项目
  ipcMain.handle('store:remove-multiple-recent-plays', (_, ids: string[]): ApiResponseWithCount => {
    try {
      const recentPlays = store.get('recentPlays', []) as RecentPlayItem[]
      const filteredPlays = recentPlays.filter((play) => !ids.includes(play.fileId))
      const removedCount = recentPlays.length - filteredPlays.length

      store.set('recentPlays', filteredPlays)
      return { success: true, removedCount }
    } catch (error) {
      console.error('批量删除最近播放项失败:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误',
        removedCount: 0
      }
    }
  })

  // 搜索最近播放项
  ipcMain.handle('store:search-recent-plays', (_, query: string): RecentPlayItem[] => {
    try {
      const recentPlays = store.get('recentPlays', []) as RecentPlayItem[]
      const lowerQuery = query.toLowerCase()

      return recentPlays
        .filter(
          (play) =>
            play.fileName.toLowerCase().includes(lowerQuery) ||
            play.filePath.toLowerCase().includes(lowerQuery)
        )
        .sort((a, b) => b.lastOpenedAt - a.lastOpenedAt)
    } catch (error) {
      console.error('搜索最近播放项失败:', error)
      return []
    }
  })

  // 获取视频UI配置
  ipcMain.handle('store:get-video-ui-config', (_, fileId: string) => {
    try {
      const recentPlays = store.get('recentPlays', []) as RecentPlayItem[]
      const playItem = recentPlays.find((play) => play.fileId === fileId)

      if (!playItem) {
        // 返回默认配置
        return {
          isSubtitleLayoutLocked: false
        }
      }

      return (
        playItem.videoUIConfig || {
          isSubtitleLayoutLocked: false
        }
      )
    } catch (error) {
      console.error('获取视频UI配置失败:', error)
      return {
        isSubtitleLayoutLocked: false
      }
    }
  })

  // 更新视频UI配置
  ipcMain.handle(
    'store:update-video-ui-config',
    (_, fileId: string, config: Partial<VideoUIConfig>): ApiResponse => {
      try {
        const recentPlays = store.get('recentPlays', []) as RecentPlayItem[]
        const index = recentPlays.findIndex((play) => play.fileId === fileId)

        if (index === -1) {
          return { success: false, error: '未找到指定的播放项' }
        }

        console.log('🔄 更新视频UI配置:', {
          fileId,
          config
        })

        // 更新UI配置
        const currentConfig = recentPlays[index].videoUIConfig || {
          isSubtitleLayoutLocked: false
        }

        recentPlays[index] = {
          ...recentPlays[index],
          videoUIConfig: {
            ...currentConfig,
            ...config
          }
        }

        store.set('recentPlays', recentPlays)
        return { success: true }
      } catch (error) {
        console.error('更新视频UI配置失败:', error)
        return { success: false, error: error instanceof Error ? error.message : '未知错误' }
      }
    }
  )

  // 通用存储方法 - 支持 Zustand persist 中间件
  // Generic storage methods - support Zustand persist middleware

  // 获取通用存储数据
  ipcMain.handle('store:get-raw-data', (_, key: string): string | null => {
    try {
      console.log(`📖 获取通用存储数据: ${key}`)
      return store.get(key, null) as string | null
    } catch (error) {
      console.error('获取通用存储数据失败:', error)
      return null
    }
  })

  // 设置通用存储数据
  ipcMain.handle('store:set-raw-data', (_, key: string, value: string): ApiResponse => {
    try {
      console.log(`💾 设置通用存储数据: ${key}`, value.length, 'characters')
      store.set(key, value)
      return { success: true }
    } catch (error) {
      console.error('设置通用存储数据失败:', error)
      return { success: false, error: error instanceof Error ? error.message : '未知错误' }
    }
  })

  // 删除通用存储数据
  ipcMain.handle('store:remove-raw-data', (_, key: string): ApiResponse => {
    try {
      console.log(`🗑️ 删除通用存储数据: ${key}`)
      store.delete(key)
      return { success: true }
    } catch (error) {
      console.error('删除通用存储数据失败:', error)
      return { success: false, error: error instanceof Error ? error.message : '未知错误' }
    }
  })

  // 应用配置相关的 IPC 处理器 / Application configuration IPC handlers

  // 获取应用配置
  ipcMain.handle('app:get-config', (): AppConfig => {
    try {
      const config = store.get('appConfig', defaultAppConfig) as AppConfig
      return { ...defaultAppConfig, ...config }
    } catch (error) {
      console.error('获取应用配置失败:', error)
      return defaultAppConfig
    }
  })

  // 更新应用配置
  ipcMain.handle('app:update-config', (_, updates: Partial<AppConfig>): ApiResponse => {
    try {
      const currentConfig = store.get('appConfig', defaultAppConfig) as AppConfig
      const newConfig = { ...currentConfig, ...updates }

      console.log('🔄 更新应用配置:', { updates, newConfig })
      store.set('appConfig', newConfig)

      return { success: true }
    } catch (error) {
      console.error('更新应用配置失败:', error)
      return { success: false, error: error instanceof Error ? error.message : '未知错误' }
    }
  })

  // 重置应用配置为默认值
  ipcMain.handle('app:reset-config', (): ApiResponse => {
    try {
      console.log('🔄 重置应用配置为默认值')
      store.set('appConfig', defaultAppConfig)
      return { success: true }
    } catch (error) {
      console.error('重置应用配置失败:', error)
      return { success: false, error: error instanceof Error ? error.message : '未知错误' }
    }
  })

  // 获取默认数据目录
  ipcMain.handle('app:get-default-data-directory', (): string => {
    try {
      return getDefaultDataDirectory()
    } catch (error) {
      console.error('获取默认数据目录失败:', error)
      return getDefaultDataDirectory()
    }
  })

  // 获取测试视频文件路径 / Get test video file path
  ipcMain.handle('app:get-test-video-path', (): string => {
    try {
      // 获取应用根目录，然后拼接测试文件路径 / Get app root directory, then join test file path
      const appPath = app.getAppPath()
      return path.join(appPath, 'e2e', 'assets', 'test-video.mp4')
    } catch (error) {
      console.error('获取测试视频文件路径失败:', error)
      // 返回默认的相对路径 / Return default relative path
      return path.join(process.cwd(), 'e2e', 'assets', 'test-video.mp4')
    }
  })
}

/**
 * 获取应用配置的同步方法 / Synchronous method to get application configuration
 * 这个方法可以在窗口创建时使用 / This method can be used during window creation
 */
export function getAppConfig(): AppConfig {
  try {
    const config = store.get('appConfig', defaultAppConfig) as AppConfig
    return { ...defaultAppConfig, ...config }
  } catch (error) {
    console.error('获取应用配置失败:', error)
    return defaultAppConfig
  }
}

// 导出类型供其他模块使用
export type { RecentPlayItem as RecentPlayItem, StoreSchema }
