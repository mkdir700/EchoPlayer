import { ipcMain } from 'electron'
import type {
  ApiResponse,
  ApiResponseWithCount,
  VideoUIConfig,
  RecentPlayItem
} from '../../../types/shared'
import { mainStore, generateId } from './storeInstances'

/**
 * 设置最近播放列表相关的 IPC 处理器 / Setup recent plays related IPC handlers
 */
export function setupRecentPlaysHandlers(): void {
  // 获取所有最近播放项 / Get all recent play items
  ipcMain.handle('store:get-recent-plays', (): RecentPlayItem[] => {
    try {
      const recentPlays = mainStore.get('recentPlays', []) as RecentPlayItem[]
      // 按最后播放时间降序排序 / Sort by last played time in descending order
      return recentPlays.sort((a, b) => b.lastPlayedAt.getTime() - a.lastPlayedAt.getTime())
    } catch (error) {
      console.error('获取最近播放列表失败:', error)
      return []
    }
  })

  // 添加或更新最近播放项 / Add or update recent play item
  ipcMain.handle(
    'store:add-recent-play',
    (
      _,
      item: Omit<RecentPlayItem, 'videoInfo' | 'lastPlayedAt'> & {
        videoInfo: Omit<RecentPlayItem['videoInfo'], 'id'>
      }
    ): ApiResponse => {
      try {
        const recentPlays = mainStore.get('recentPlays', []) as RecentPlayItem[]
        const settings = mainStore.get('settings', { maxRecentItems: 20 }) as {
          maxRecentItems: number
        }
        const maxItems = settings.maxRecentItems

        console.log('📝 添加/更新最近播放项:', {
          filePath: item.videoInfo.filePath,
          hasSubtitles: !!item.subtitleFile
        })

        // 检查是否已存在相同文件路径的项 / Check if item with same file path already exists
        const existingIndex = recentPlays.findIndex(
          (play) => play.videoInfo.filePath === item.videoInfo.filePath
        )

        const newItem: RecentPlayItem = {
          ...item,
          videoInfo: {
            ...item.videoInfo,
            id: existingIndex >= 0 ? recentPlays[existingIndex].videoInfo.id : generateId()
          },
          lastPlayedAt: new Date()
        }

        if (existingIndex >= 0) {
          // 更新现有项 / Update existing item
          recentPlays[existingIndex] = newItem
        } else {
          // 添加新项 / Add new item
          recentPlays.unshift(newItem)
        }

        // 限制列表长度 / Limit list length
        if (recentPlays.length > maxItems) {
          recentPlays.splice(maxItems)
        }

        mainStore.set('recentPlays', recentPlays)
        return { success: true, fileId: newItem.videoInfo.id }
      } catch (error) {
        console.error('添加最近播放项失败:', error)
        return { success: false, error: error instanceof Error ? error.message : '未知错误' }
      }
    }
  )

  // 更新最近播放项 / Update recent play item
  ipcMain.handle(
    'store:update-recent-play',
    (_, id: string, updates: Partial<Omit<RecentPlayItem, 'videoInfo'>>): ApiResponse => {
      try {
        const recentPlays = mainStore.get('recentPlays', []) as RecentPlayItem[]
        const index = recentPlays.findIndex((play) => play.videoInfo.id === id)

        if (index === -1) {
          return { success: false, error: '未找到指定的播放项' }
        }

        console.log('🔄 更新最近播放项:', {
          id,
          updates,
          hasSubtitles: !!updates.subtitleFile
        })

        // 更新项目，但保持 videoInfo.id 不变 / Update item, keep videoInfo.id unchanged
        recentPlays[index] = {
          ...recentPlays[index],
          ...updates
        }
        mainStore.set('recentPlays', recentPlays)

        console.log('✅ 更新完成')
        return { success: true }
      } catch (error) {
        console.error('更新最近播放项失败:', error)
        return { success: false, error: error instanceof Error ? error.message : '未知错误' }
      }
    }
  )

  // 删除最近播放项 / Delete recent play item
  ipcMain.handle('store:remove-recent-play', (_, id: string): ApiResponse => {
    try {
      const recentPlays = mainStore.get('recentPlays', []) as RecentPlayItem[]
      const filteredPlays = recentPlays.filter((play) => play.videoInfo.id !== id)

      if (filteredPlays.length === recentPlays.length) {
        return { success: false, error: '未找到指定的播放项' }
      }

      mainStore.set('recentPlays', filteredPlays)
      return { success: true }
    } catch (error) {
      console.error('删除最近播放项失败:', error)
      return { success: false, error: error instanceof Error ? error.message : '未知错误' }
    }
  })

  // 清空最近播放列表 / Clear recent plays list
  ipcMain.handle('store:clear-recent-plays', (): ApiResponse => {
    try {
      mainStore.set('recentPlays', [])
      return { success: true }
    } catch (error) {
      console.error('清空最近播放列表失败:', error)
      return { success: false, error: error instanceof Error ? error.message : '未知错误' }
    }
  })

  // 根据文件路径获取最近播放项 / Get recent play item by file path
  ipcMain.handle('store:get-recent-play-by-path', (_, filePath: string): RecentPlayItem | null => {
    try {
      const recentPlays = mainStore.get('recentPlays', []) as RecentPlayItem[]
      return recentPlays.find((play) => play.videoInfo.filePath === filePath) || null
    } catch (error) {
      console.error('根据路径获取最近播放项失败:', error)
      return null
    }
  })

  // 根据文件ID获取最近播放项 / Get recent play item by file ID
  ipcMain.handle('store:get-recent-play-by-file-id', (_, fileId: string): RecentPlayItem | null => {
    try {
      const recentPlays = mainStore.get('recentPlays', []) as RecentPlayItem[]
      return recentPlays.find((play) => play.videoInfo.id === fileId) || null
    } catch (error) {
      console.error('根据文件ID获取最近播放项失败:', error)
      return null
    }
  })

  // 批量操作：删除多个项目 / Batch operation: delete multiple items
  ipcMain.handle('store:remove-multiple-recent-plays', (_, ids: string[]): ApiResponseWithCount => {
    try {
      const recentPlays = mainStore.get('recentPlays', []) as RecentPlayItem[]
      const filteredPlays = recentPlays.filter((play) => !ids.includes(play.videoInfo.id))
      const removedCount = recentPlays.length - filteredPlays.length

      mainStore.set('recentPlays', filteredPlays)
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

  // 搜索最近播放项 / Search recent play items
  ipcMain.handle('store:search-recent-plays', (_, query: string): RecentPlayItem[] => {
    try {
      const recentPlays = mainStore.get('recentPlays', []) as RecentPlayItem[]
      const lowerQuery = query.toLowerCase()

      return recentPlays
        .filter(
          (play) =>
            play.videoInfo.fileName.toLowerCase().includes(lowerQuery) ||
            play.videoInfo.filePath.toLowerCase().includes(lowerQuery)
        )
        .sort((a, b) => b.lastPlayedAt.getTime() - a.lastPlayedAt.getTime())
    } catch (error) {
      console.error('搜索最近播放项失败:', error)
      return []
    }
  })

  // 获取视频UI配置 / Get video UI config
  ipcMain.handle('store:get-video-ui-config', (_, fileId: string) => {
    try {
      const recentPlays = mainStore.get('recentPlays', []) as RecentPlayItem[]
      const playItem = recentPlays.find((play) => play.videoInfo.id === fileId)

      if (!playItem) {
        // 返回默认配置 / Return default config
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

  // 更新视频UI配置 / Update video UI config
  ipcMain.handle(
    'store:update-video-ui-config',
    (_, fileId: string, config: Partial<VideoUIConfig>): ApiResponse => {
      try {
        const recentPlays = mainStore.get('recentPlays', []) as RecentPlayItem[]
        const index = recentPlays.findIndex((play) => play.videoInfo.id === fileId)

        if (index === -1) {
          return { success: false, error: '未找到指定的播放项' }
        }

        console.log('🔄 更新视频UI配置:', {
          fileId,
          config
        })

        // 更新UI配置 / Update UI config
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

        mainStore.set('recentPlays', recentPlays)
        return { success: true }
      } catch (error) {
        console.error('更新视频UI配置失败:', error)
        return { success: false, error: error instanceof Error ? error.message : '未知错误' }
      }
    }
  )
}
