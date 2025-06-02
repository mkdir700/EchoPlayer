/* eslint-disable @typescript-eslint/no-explicit-any */
import { ipcMain } from 'electron'
import StoreModule from 'electron-store'
import type StoreType from 'electron-store'
const Store = (StoreModule as any).default || StoreModule
import type {
  RecentPlayItem,
  StoreSchema,
  ApiResponse,
  ApiResponseWithCount
} from '../../types/shared'

// 创建 store 实例
const store = new Store({
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
      }
    }
  }
}) as StoreType<StoreSchema>

// 生成唯一 ID
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

// 设置最近播放列表相关的 IPC 处理器
export function setupStoreHandlers(): void {
  // 获取所有最近播放项
  ipcMain.handle('store:get-recent-plays', (): RecentPlayItem[] => {
    try {
      const recentPlays = (store as any).get('recentPlays', []) as RecentPlayItem[]
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
        const recentPlays = (store as any).get('recentPlays', []) as RecentPlayItem[]
        const settings = (store as any).get('settings', { maxRecentItems: 20 }) as {
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

        ;(store as any).set('recentPlays', recentPlays)
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
        const recentPlays = (store as any).get('recentPlays', []) as RecentPlayItem[]
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
        ;(store as any).set('recentPlays', recentPlays)

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
      const recentPlays = (store as any).get('recentPlays', []) as RecentPlayItem[]
      const filteredPlays = recentPlays.filter((play) => play.fileId !== id)

      if (filteredPlays.length === recentPlays.length) {
        return { success: false, error: '未找到指定的播放项' }
      }

      ;(store as any).set('recentPlays', filteredPlays)
      return { success: true }
    } catch (error) {
      console.error('删除最近播放项失败:', error)
      return { success: false, error: error instanceof Error ? error.message : '未知错误' }
    }
  })

  // 清空最近播放列表
  ipcMain.handle('store:clear-recent-plays', (): ApiResponse => {
    try {
      ;(store as any).set('recentPlays', [])
      return { success: true }
    } catch (error) {
      console.error('清空最近播放列表失败:', error)
      return { success: false, error: error instanceof Error ? error.message : '未知错误' }
    }
  })

  // 根据文件路径获取最近播放项
  ipcMain.handle('store:get-recent-play-by-path', (_, filePath: string): RecentPlayItem | null => {
    try {
      const recentPlays = (store as any).get('recentPlays', []) as RecentPlayItem[]
      return recentPlays.find((play) => play.filePath === filePath) || null
    } catch (error) {
      console.error('根据路径获取最近播放项失败:', error)
      return null
    }
  })

  // 根据文件ID获取最近播放项
  ipcMain.handle('store:get-recent-play-by-file-id', (_, fileId: string): RecentPlayItem | null => {
    try {
      const recentPlays = (store as any).get('recentPlays', []) as RecentPlayItem[]
      return recentPlays.find((play) => play.fileId === fileId) || null
    } catch (error) {
      console.error('根据文件ID获取最近播放项失败:', error)
      return null
    }
  })

  // 获取设置
  ipcMain.handle('store:get-settings', () => {
    try {
      return (store as any).get('settings', {
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
        const currentSettings = (store as any).get('settings', {
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

        // 深度合并设置，特别处理 playback 对象
        const newSettings = {
          ...currentSettings,
          ...settings,
          playback: {
            ...currentSettings.playback,
            ...(settings.playback || {})
          }
        }

        ;(store as any).set('settings', newSettings)

        // 如果更新了最大项目数，需要裁剪现有列表
        if (settings.maxRecentItems !== undefined) {
          const recentPlays = (store as any).get('recentPlays', []) as RecentPlayItem[]
          if (recentPlays.length > settings.maxRecentItems) {
            const trimmedPlays = recentPlays.slice(0, settings.maxRecentItems)
            ;(store as any).set('recentPlays', trimmedPlays)
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
      const recentPlays = (store as any).get('recentPlays', []) as RecentPlayItem[]
      const filteredPlays = recentPlays.filter((play) => !ids.includes(play.fileId))
      const removedCount = recentPlays.length - filteredPlays.length

      ;(store as any).set('recentPlays', filteredPlays)
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
      const recentPlays = (store as any).get('recentPlays', []) as RecentPlayItem[]
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
}

// 导出类型供其他模块使用
export type { RecentPlayItem as RecentPlayItem, StoreSchema }
