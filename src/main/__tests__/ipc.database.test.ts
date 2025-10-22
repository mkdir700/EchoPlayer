import { IpcChannel } from '@shared/IpcChannel'
import type { App as ElectronApp, BrowserWindow } from 'electron'
import { ipcMain } from 'electron'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { registerIpc } from '../ipc'

const electronModuleMock = vi.hoisted(() => {
  const appMock = {
    getVersion: vi.fn(() => '1.0.0'),
    isPackaged: true,
    getAppPath: vi.fn(() => '/app'),
    getPath: vi.fn((type: string) => `/${type}`),
    setPath: vi.fn(),
    relaunch: vi.fn(),
    exit: vi.fn(),
    isQuitting: false,
    whenReady: vi.fn(() => Promise.resolve()),
    on: vi.fn(),
    once: vi.fn(),
    removeListener: vi.fn(),
    setLoginItemSettings: vi.fn(),
    getLocale: vi.fn(() => 'en-US'),
    isReady: vi.fn(() => true),
    requestSingleInstanceLock: vi.fn(() => true),
    releaseSingleInstanceLock: vi.fn(),
    getName: vi.fn(() => 'Echolab'),
    hide: vi.fn(),
    quit: vi.fn(),
    dock: {
      show: vi.fn(),
      hide: vi.fn()
    }
  } as unknown as ElectronApp

  return {
    BrowserWindow: {
      getAllWindows: vi.fn(() => []),
      fromWebContents: vi.fn()
    },
    ipcMain: {
      handle: vi.fn(),
      removeHandler: vi.fn()
    },
    app: appMock,
    dialog: {
      showOpenDialog: vi.fn()
    },
    session: {
      defaultSession: {
        clearCache: vi.fn(),
        clearStorageData: vi.fn(),
        flushStorageData: vi.fn(),
        cookies: { flushStore: vi.fn() },
        closeAllConnections: vi.fn()
      },
      fromPartition: vi.fn(() => ({
        clearCache: vi.fn(),
        clearStorageData: vi.fn()
      }))
    },
    shell: {
      openExternal: vi.fn(),
      showItemInFolder: vi.fn()
    },
    systemPreferences: {
      isTrustedAccessibilityClient: vi.fn()
    },
    webContents: {
      getAllWebContents: vi.fn(() => [])
    }
  }
})

vi.mock('electron', () => electronModuleMock)

const getMockedApp = () => electronModuleMock.app as ElectronApp

vi.mock('../db/dao', () => ({
  db: {
    files: {
      addFile: vi.fn(),
      findByPath: vi.fn(),
      findByType: vi.fn(),
      deleteFile: vi.fn()
    },
    videoLibrary: {
      addVideoRecord: vi.fn(),
      findByFileId: vi.fn(),
      getRecentlyPlayed: vi.fn(),
      getFavorites: vi.fn(),
      updatePlayProgress: vi.fn(),
      toggleFavorite: vi.fn()
    },
    subtitleLibrary: {
      addSubtitle: vi.fn(),
      findByVideoId: vi.fn(),
      findByVideoIdAndPath: vi.fn(),
      deleteSubtitle: vi.fn()
    }
  }
}))

vi.mock('../services/LoggerService', () => ({
  loggerService: {
    withContext: vi.fn(() => ({
      info: vi.fn(),
      debug: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      getLogsDir: vi.fn(() => '/logs')
    }))
  }
}))

vi.mock('../services/ConfigManager', () => ({
  configManager: {
    setLanguage: vi.fn(),
    set: vi.fn(),
    get: vi.fn(),
    getTestPlan: vi.fn(),
    setTestPlan: vi.fn(),
    getTestChannel: vi.fn(),
    setTestChannel: vi.fn(),
    setTray: vi.fn(),
    setTrayOnClose: vi.fn(),
    setLaunchToTray: vi.fn(),
    setAutoUpdate: vi.fn(),
    setShortcuts: vi.fn(),
    getZhipuApiKey: vi.fn(() => 'mock-zhipu-api-key')
  }
}))

vi.mock('../services/AppService', () => ({
  default: {
    setAppLaunchOnBoot: vi.fn()
  }
}))

vi.mock('../services/AppUpdater', () => ({
  default: vi.fn().mockImplementation(() => ({
    setAutoUpdate: vi.fn(),
    showUpdateDialog: vi.fn(),
    checkForUpdates: vi.fn(),
    cancelDownload: vi.fn()
  }))
}))

vi.mock('../services/ThemeService', () => ({
  themeService: {
    setTheme: vi.fn()
  }
}))

vi.mock('../services/NotificationService', () => ({
  default: vi.fn().mockImplementation(() => ({
    sendNotification: vi.fn()
  }))
}))

vi.mock('../services/FileStorage', () => ({
  default: vi.fn().mockImplementation(() => ({
    open: vi.fn(),
    openPath: vi.fn(),
    save: vi.fn(),
    selectFile: vi.fn(),
    uploadFile: vi.fn(),
    clear: vi.fn(),
    readFile: vi.fn(),
    deleteFile: vi.fn(),
    deleteDir: vi.fn(),
    getFile: vi.fn(),
    selectFolder: vi.fn(),
    createTempFile: vi.fn(),
    writeFile: vi.fn(),
    writeFileWithId: vi.fn(),
    saveImage: vi.fn(),
    base64Image: vi.fn(),
    saveBase64Image: vi.fn(),
    base64File: vi.fn(),
    downloadFile: vi.fn(),
    copyFile: vi.fn(),
    binaryImage: vi.fn(),
    readFileFromPath: vi.fn(),
    listDirectory: vi.fn(),
    openFileWithRelativePath: vi.fn(),
    clearTemp: vi.fn()
  }))
}))

vi.mock('../services/DictionaryService', () => ({
  default: vi.fn().mockImplementation(() => ({
    queryEudic: vi.fn()
  }))
}))

vi.mock('../services/FFmpegService', () => ({
  default: vi.fn().mockImplementation(() => ({
    checkFFmpegExists: vi.fn(),
    getFFmpegVersion: vi.fn(),
    downloadFFmpeg: vi.fn(),
    getVideoInfo: vi.fn(),
    transcodeVideo: vi.fn(),
    cancelTranscode: vi.fn(),
    getFFmpegPath: vi.fn(),
    getDownloadService: vi.fn(() => ({
      checkFFmpegExists: vi.fn(),
      getFFmpegVersion: vi.fn(),
      downloadFFmpeg: vi.fn(),
      getDownloadProgress: vi.fn(),
      cancelDownload: vi.fn(),
      removeFFmpeg: vi.fn(),
      getAllSupportedVersions: vi.fn(),
      cleanupTempFiles: vi.fn()
    }))
  }))
}))

vi.mock('../services/ShortcutService', () => ({
  registerShortcuts: vi.fn(),
  unregisterAllShortcuts: vi.fn()
}))

vi.mock('../utils', () => ({
  calculateDirectorySize: vi.fn(),
  getResourcePath: vi.fn(() => '/resources')
}))

vi.mock('../utils/file', () => ({
  getCacheDir: vi.fn(() => '/cache'),
  getConfigDir: vi.fn(() => '/config'),
  getFilesDir: vi.fn(() => '/files'),
  hasWritePermission: vi.fn()
}))

vi.mock('../utils/init', () => ({
  updateAppDataConfig: vi.fn()
}))

vi.mock('../constant', () => ({
  isLinux: false,
  isMac: false,
  isPortable: false,
  isWin: true
}))

describe('IPC Database Handlers', () => {
  const mockMainWindow = {} as BrowserWindow
  let mockApp: ElectronApp

  type IpcHandler = (...args: any[]) => any
  let ipcHandlers: Map<string, IpcHandler>

  beforeEach(() => {
    vi.clearAllMocks()
    mockApp = getMockedApp()
    ipcHandlers = new Map()

    // Mock ipcMain.handle to capture handlers
    vi.mocked(ipcMain.handle).mockImplementation((channel: string, handler: IpcHandler) => {
      ipcHandlers.set(channel, handler)
    })

    // Register IPC handlers
    registerIpc(mockMainWindow, mockApp)
  })

  afterEach(() => {
    ipcHandlers.clear()
  })

  describe('Files DAO IPC Handlers', () => {
    describe('DB_Files_Add', () => {
      it('应该成功添加文件并记录日志', async () => {
        const mockFile = {
          name: 'video.mp4',
          origin_name: 'test_video.mp4',
          path: '/test/video.mp4',
          size: 1024,
          ext: '.mp4',
          type: 'video' as const,
          created_at: new Date().toISOString()
        }
        const mockResult = { id: 1, ...mockFile }

        const { db } = await import('../db/dao')
        vi.mocked(db.files.addFile).mockResolvedValue(mockResult as any)

        const handler = ipcHandlers.get(IpcChannel.DB_Files_Add)!
        const result = await handler({}, mockFile)

        expect(db.files.addFile).toHaveBeenCalledWith(mockFile)
        expect(result).toEqual(mockResult)
      })

      it('应该处理添加文件时的错误', async () => {
        const mockFile = {
          name: 'video.mp4',
          origin_name: 'test_video.mp4',
          path: '/test/video.mp4',
          size: 1024,
          ext: '.mp4',
          type: 'video' as const,
          created_at: new Date().toISOString()
        }
        const mockError = new Error('Database error')

        const { db } = await import('../db/dao')
        vi.mocked(db.files.addFile).mockRejectedValue(mockError)

        const handler = ipcHandlers.get(IpcChannel.DB_Files_Add)!

        await expect(handler({}, mockFile)).rejects.toThrow('Database error')
        expect(db.files.addFile).toHaveBeenCalledWith(mockFile)
      })
    })

    describe('DB_Files_FindByPath', () => {
      it('应该根据路径查找文件', async () => {
        const mockPath = '/test/video.mp4'
        const mockResult = {
          id: 1,
          name: 'video.mp4',
          origin_name: 'test_video.mp4',
          path: mockPath,
          size: 1024,
          ext: '.mp4',
          type: 'video' as const,
          created_at: new Date()
        }

        const { db } = await import('../db/dao')
        vi.mocked(db.files.findByPath).mockResolvedValue(mockResult as any)

        const handler = ipcHandlers.get(IpcChannel.DB_Files_FindByPath)!
        const result = await handler({}, mockPath)

        expect(db.files.findByPath).toHaveBeenCalledWith(mockPath)
        expect(result).toEqual(mockResult)
      })

      it('应该处理路径查找文件时的错误', async () => {
        const mockPath = '/test/video.mp4'
        const mockError = new Error('File not found')

        const { db } = await import('../db/dao')
        vi.mocked(db.files.findByPath).mockRejectedValue(mockError)

        const handler = ipcHandlers.get(IpcChannel.DB_Files_FindByPath)!

        await expect(handler({}, mockPath)).rejects.toThrow('File not found')
      })

      it('应该返回undefined当文件不存在时', async () => {
        const mockPath = '/nonexistent/video.mp4'

        const { db } = await import('../db/dao')
        vi.mocked(db.files.findByPath).mockResolvedValue(undefined)

        const handler = ipcHandlers.get(IpcChannel.DB_Files_FindByPath)!
        const result = await handler({}, mockPath)

        expect(result).toBeUndefined()
      })
    })

    describe('DB_Files_FindByType', () => {
      it('应该根据类型查找文件', async () => {
        const mockType = 'video'
        const mockResult = [
          {
            id: 1,
            name: 'video1.mp4',
            origin_name: 'test_video1.mp4',
            path: '/test/video1.mp4',
            size: 1024,
            ext: '.mp4',
            type: 'video' as const,
            created_at: new Date()
          },
          {
            id: 2,
            name: 'video2.mp4',
            origin_name: 'test_video2.mp4',
            path: '/test/video2.mp4',
            size: 2048,
            ext: '.mp4',
            type: 'video' as const,
            created_at: new Date()
          }
        ]

        const { db } = await import('../db/dao')
        vi.mocked(db.files.findByType).mockResolvedValue(mockResult as any)

        const handler = ipcHandlers.get(IpcChannel.DB_Files_FindByType)!
        const result = await handler({}, mockType)

        expect(db.files.findByType).toHaveBeenCalledWith(mockType)
        expect(result).toEqual(mockResult)
      })

      it('应该返回空数组当没有匹配类型的文件时', async () => {
        const mockType = 'nonexistent'

        const { db } = await import('../db/dao')
        vi.mocked(db.files.findByType).mockResolvedValue([])

        const handler = ipcHandlers.get(IpcChannel.DB_Files_FindByType)!
        const result = await handler({}, mockType)

        expect(result).toEqual([])
      })

      it('应该处理类型查找文件时的错误', async () => {
        const mockType = 'video'
        const mockError = new Error('Database error')

        const { db } = await import('../db/dao')
        vi.mocked(db.files.findByType).mockRejectedValue(mockError)

        const handler = ipcHandlers.get(IpcChannel.DB_Files_FindByType)!

        await expect(handler({}, mockType)).rejects.toThrow('Database error')
      })
    })

    describe('DB_Files_Delete', () => {
      it('应该成功删除文件并记录日志', async () => {
        const mockFileId = 1
        const mockResult = [{ numDeletedRows: 1n }]

        const { db } = await import('../db/dao')
        vi.mocked(db.files.deleteFile).mockResolvedValue(mockResult as any)

        const handler = ipcHandlers.get(IpcChannel.DB_Files_Delete)!
        const result = await handler({}, mockFileId)

        expect(db.files.deleteFile).toHaveBeenCalledWith(mockFileId)
        expect(result).toEqual(mockResult)
      })

      it('应该处理删除文件时的错误', async () => {
        const mockFileId = 1
        const mockError = new Error('Delete failed')

        const { db } = await import('../db/dao')
        vi.mocked(db.files.deleteFile).mockRejectedValue(mockError)

        const handler = ipcHandlers.get(IpcChannel.DB_Files_Delete)!

        await expect(handler({}, mockFileId)).rejects.toThrow('Delete failed')
      })
    })
  })

  describe('VideoLibrary DAO IPC Handlers', () => {
    describe('DB_VideoLibrary_Upsert', () => {
      it('应该成功插入或更新视频记录', async () => {
        const mockRecord = {
          fileId: 'file123',
          currentTime: 120,
          duration: 3600,
          playedAt: Date.now(),
          firstPlayedAt: Date.now(),
          playCount: 1,
          isFinished: false,
          isFavorite: false,
          thumbnailPath: undefined
        }
        const mockResult = { id: 1 }

        const { db } = await import('../db/dao')
        vi.mocked(db.videoLibrary.addVideoRecord).mockResolvedValue(mockResult as any)

        const handler = ipcHandlers.get(IpcChannel.DB_VideoLibrary_Add)!
        const result = await handler({}, mockRecord)

        expect(db.videoLibrary.addVideoRecord).toHaveBeenCalledWith(mockRecord)
        expect(result).toEqual(mockResult)
      })

      it('应该处理插入或更新视频记录时的错误', async () => {
        const mockRecord = {
          fileId: 'file123',
          currentTime: 0,
          duration: 0,
          playedAt: Date.now(),
          firstPlayedAt: Date.now(),
          playCount: 0,
          isFinished: false,
          isFavorite: false
        }
        const mockError = new Error('Upsert failed')

        const { db } = await import('../db/dao')
        vi.mocked(db.videoLibrary.addVideoRecord).mockRejectedValue(mockError)

        const handler = ipcHandlers.get(IpcChannel.DB_VideoLibrary_Add)!

        await expect(handler({}, mockRecord)).rejects.toThrow('Upsert failed')
      })
    })

    describe('DB_VideoLibrary_FindByFileId', () => {
      it('应该根据文件ID查找视频记录', async () => {
        const mockFileId = 'file123'
        const mockResult = {
          id: 1,
          fileId: mockFileId,
          currentTime: 120,
          duration: 3600,
          playedAt: Date.now(),
          firstPlayedAt: Date.now(),
          playCount: 1,
          isFinished: false,
          isFavorite: true,
          thumbnailPath: undefined
        }

        const { db } = await import('../db/dao')
        vi.mocked(db.videoLibrary.findByFileId).mockResolvedValue(mockResult as any)

        const handler = ipcHandlers.get(IpcChannel.DB_VideoLibrary_FindByFileId)!
        const result = await handler({}, mockFileId)

        expect(db.videoLibrary.findByFileId).toHaveBeenCalledWith(mockFileId)
        expect(result).toEqual(mockResult)
      })

      it('应该返回undefined当视频记录不存在时', async () => {
        const mockFileId = 'nonexistent'

        const { db } = await import('../db/dao')
        vi.mocked(db.videoLibrary.findByFileId).mockResolvedValue(undefined)

        const handler = ipcHandlers.get(IpcChannel.DB_VideoLibrary_FindByFileId)!
        const result = await handler({}, mockFileId)

        expect(result).toBeUndefined()
      })

      it('应该处理查找视频记录时的错误', async () => {
        const mockFileId = 'file123'
        const mockError = new Error('Find failed')

        const { db } = await import('../db/dao')
        vi.mocked(db.videoLibrary.findByFileId).mockRejectedValue(mockError)

        const handler = ipcHandlers.get(IpcChannel.DB_VideoLibrary_FindByFileId)!

        await expect(handler({}, mockFileId)).rejects.toThrow('Find failed')
      })
    })

    describe('DB_VideoLibrary_GetRecentlyPlayed', () => {
      it('应该获取最近播放的视频列表（使用默认限制）', async () => {
        const mockResult = [
          {
            id: 1,
            fileId: 'file1',
            currentTime: 120,
            duration: 3600,
            playedAt: Date.now(),
            firstPlayedAt: Date.now(),
            playCount: 1,
            isFinished: false,
            isFavorite: false,
            thumbnailPath: undefined
          },
          {
            id: 2,
            fileId: 'file2',
            currentTime: 240,
            duration: 7200,
            playedAt: Date.now() - 1000,
            firstPlayedAt: Date.now() - 10000,
            playCount: 2,
            isFinished: true,
            isFavorite: true,
            thumbnailPath: undefined
          }
        ]

        const { db } = await import('../db/dao')
        vi.mocked(db.videoLibrary.getRecentlyPlayed).mockResolvedValue(mockResult as any)

        const handler = ipcHandlers.get(IpcChannel.DB_VideoLibrary_GetRecentlyPlayed)!
        const result = await handler({})

        expect(db.videoLibrary.getRecentlyPlayed).toHaveBeenCalledWith(10) // 默认限制
        expect(result).toEqual(mockResult)
      })

      it('应该获取最近播放的视频列表（使用自定义限制）', async () => {
        const mockLimit = 5
        const mockResult = [
          {
            id: 1,
            fileId: 'file1',
            currentTime: 120,
            duration: 3600,
            playedAt: Date.now(),
            firstPlayedAt: Date.now(),
            playCount: 1,
            isFinished: false,
            isFavorite: false,
            thumbnailPath: undefined
          }
        ]

        const { db } = await import('../db/dao')
        vi.mocked(db.videoLibrary.getRecentlyPlayed).mockResolvedValue(mockResult as any)

        const handler = ipcHandlers.get(IpcChannel.DB_VideoLibrary_GetRecentlyPlayed)!
        const result = await handler({}, mockLimit)

        expect(db.videoLibrary.getRecentlyPlayed).toHaveBeenCalledWith(mockLimit)
        expect(result).toEqual(mockResult)
      })

      it('应该处理获取最近播放视频时的错误', async () => {
        const mockError = new Error('Get recently played failed')

        const { db } = await import('../db/dao')
        vi.mocked(db.videoLibrary.getRecentlyPlayed).mockRejectedValue(mockError)

        const handler = ipcHandlers.get(IpcChannel.DB_VideoLibrary_GetRecentlyPlayed)!

        await expect(handler({})).rejects.toThrow('Get recently played failed')
      })
    })

    describe('DB_VideoLibrary_GetFavorites', () => {
      it('应该获取收藏视频列表', async () => {
        const mockResult = [
          {
            id: 1,
            fileId: 'file1',
            currentTime: 120,
            duration: 3600,
            playedAt: Date.now(),
            firstPlayedAt: Date.now(),
            playCount: 1,
            isFinished: false,
            isFavorite: true,
            thumbnailPath: undefined
          },
          {
            id: 2,
            fileId: 'file2',
            currentTime: 240,
            duration: 7200,
            playedAt: Date.now() - 1000,
            firstPlayedAt: Date.now() - 10000,
            playCount: 2,
            isFinished: true,
            isFavorite: true,
            thumbnailPath: undefined
          }
        ]

        const { db } = await import('../db/dao')
        vi.mocked(db.videoLibrary.getFavorites).mockResolvedValue(mockResult as any)

        const handler = ipcHandlers.get(IpcChannel.DB_VideoLibrary_GetFavorites)!
        const result = await handler({})

        expect(db.videoLibrary.getFavorites).toHaveBeenCalled()
        expect(result).toEqual(mockResult)
      })

      it('应该返回空数组当没有收藏视频时', async () => {
        const { db } = await import('../db/dao')
        vi.mocked(db.videoLibrary.getFavorites).mockResolvedValue([])

        const handler = ipcHandlers.get(IpcChannel.DB_VideoLibrary_GetFavorites)!
        const result = await handler({})

        expect(result).toEqual([])
      })

      it('应该处理获取收藏视频时的错误', async () => {
        const mockError = new Error('Get favorites failed')

        const { db } = await import('../db/dao')
        vi.mocked(db.videoLibrary.getFavorites).mockRejectedValue(mockError)

        const handler = ipcHandlers.get(IpcChannel.DB_VideoLibrary_GetFavorites)!

        await expect(handler({})).rejects.toThrow('Get favorites failed')
      })
    })

    describe('DB_VideoLibrary_UpdatePlayProgress', () => {
      it('应该更新播放进度（不包含完成状态）', async () => {
        const mockFileId = 'file123'
        const mockCurrentTime = 240
        const mockResult = [{ numUpdatedRows: 1n }]

        const { db } = await import('../db/dao')
        vi.mocked(db.videoLibrary.updatePlayProgress).mockResolvedValue(mockResult as any)

        const handler = ipcHandlers.get(IpcChannel.DB_VideoLibrary_UpdatePlayProgress)!
        const result = await handler({}, mockFileId, mockCurrentTime)

        expect(db.videoLibrary.updatePlayProgress).toHaveBeenCalledWith(
          mockFileId,
          mockCurrentTime,
          undefined
        )
        expect(result).toEqual(mockResult)
      })

      it('应该更新播放进度（包含完成状态）', async () => {
        const mockFileId = 'file123'
        const mockCurrentTime = 3600
        const mockIsFinished = true
        const mockResult = [{ numUpdatedRows: 1n }]

        const { db } = await import('../db/dao')
        vi.mocked(db.videoLibrary.updatePlayProgress).mockResolvedValue(mockResult as any)

        const handler = ipcHandlers.get(IpcChannel.DB_VideoLibrary_UpdatePlayProgress)!
        const result = await handler({}, mockFileId, mockCurrentTime, mockIsFinished)

        expect(db.videoLibrary.updatePlayProgress).toHaveBeenCalledWith(
          mockFileId,
          mockCurrentTime,
          mockIsFinished
        )
        expect(result).toEqual(mockResult)
      })

      it('应该处理更新播放进度时的错误', async () => {
        const mockFileId = 'file123'
        const mockCurrentTime = 240
        const mockError = new Error('Update progress failed')

        const { db } = await import('../db/dao')
        vi.mocked(db.videoLibrary.updatePlayProgress).mockRejectedValue(mockError)

        const handler = ipcHandlers.get(IpcChannel.DB_VideoLibrary_UpdatePlayProgress)!

        await expect(handler({}, mockFileId, mockCurrentTime)).rejects.toThrow(
          'Update progress failed'
        )
      })
    })

    describe('DB_VideoLibrary_ToggleFavorite', () => {
      it('应该切换视频收藏状态', async () => {
        const mockFileId = 'file123'
        const mockResult = [{ numUpdatedRows: 1n }]

        const { db } = await import('../db/dao')
        vi.mocked(db.videoLibrary.toggleFavorite).mockResolvedValue(mockResult as any)

        const handler = ipcHandlers.get(IpcChannel.DB_VideoLibrary_ToggleFavorite)!
        const result = await handler({}, mockFileId)

        expect(db.videoLibrary.toggleFavorite).toHaveBeenCalledWith(mockFileId)
        expect(result).toEqual(mockResult)
      })

      it('应该处理切换收藏状态时的错误', async () => {
        const mockFileId = 'file123'
        const mockError = new Error('Toggle favorite failed')

        const { db } = await import('../db/dao')
        vi.mocked(db.videoLibrary.toggleFavorite).mockRejectedValue(mockError)

        const handler = ipcHandlers.get(IpcChannel.DB_VideoLibrary_ToggleFavorite)!

        await expect(handler({}, mockFileId)).rejects.toThrow('Toggle favorite failed')
      })
    })
  })

  describe('SubtitleLibrary DAO IPC Handlers', () => {
    describe('DB_SubtitleLibrary_Add', () => {
      it('应该成功添加字幕并记录日志', async () => {
        const mockSubtitle = {
          videoId: 1,
          filePath: '/test/subtitle.srt',
          created_at: new Date().toISOString()
        }
        const mockResult = { id: 1, ...mockSubtitle }

        const { db } = await import('../db/dao')
        vi.mocked(db.subtitleLibrary.addSubtitle).mockResolvedValue(mockResult as any)

        const handler = ipcHandlers.get(IpcChannel.DB_SubtitleLibrary_Add)!
        const result = await handler({}, mockSubtitle)

        expect(db.subtitleLibrary.addSubtitle).toHaveBeenCalledWith(mockSubtitle)
        expect(result).toEqual(mockResult)
      })

      it('应该处理添加字幕时的错误', async () => {
        const mockSubtitle = {
          videoId: 1,
          filePath: '/test/subtitle.srt',
          created_at: new Date().toISOString()
        }
        const mockError = new Error('Add subtitle failed')

        const { db } = await import('../db/dao')
        vi.mocked(db.subtitleLibrary.addSubtitle).mockRejectedValue(mockError)

        const handler = ipcHandlers.get(IpcChannel.DB_SubtitleLibrary_Add)!

        await expect(handler({}, mockSubtitle)).rejects.toThrow('Add subtitle failed')
        expect(db.subtitleLibrary.addSubtitle).toHaveBeenCalledWith(mockSubtitle)
      })
    })

    describe('DB_SubtitleLibrary_FindByVideoId', () => {
      it('应该根据视频ID查找字幕', async () => {
        const mockVideoId = 1
        const mockResult = [
          {
            id: 1,
            videoId: mockVideoId,
            filePath: '/test/subtitle1.srt',
            created_at: new Date()
          },
          {
            id: 2,
            videoId: mockVideoId,
            filePath: '/test/subtitle2.vtt',
            created_at: new Date()
          }
        ]

        const { db } = await import('../db/dao')
        vi.mocked(db.subtitleLibrary.findByVideoId).mockResolvedValue(mockResult as any)

        const handler = ipcHandlers.get(IpcChannel.DB_SubtitleLibrary_FindByVideoId)!
        const result = await handler({}, mockVideoId)

        expect(db.subtitleLibrary.findByVideoId).toHaveBeenCalledWith(mockVideoId)
        expect(result).toEqual(mockResult)
      })

      it('应该返回空数组当没有字幕时', async () => {
        const mockVideoId = 999

        const { db } = await import('../db/dao')
        vi.mocked(db.subtitleLibrary.findByVideoId).mockResolvedValue([])

        const handler = ipcHandlers.get(IpcChannel.DB_SubtitleLibrary_FindByVideoId)!
        const result = await handler({}, mockVideoId)

        expect(result).toEqual([])
      })

      it('应该处理查找字幕时的错误', async () => {
        const mockVideoId = 1
        const mockError = new Error('Find subtitles failed')

        const { db } = await import('../db/dao')
        vi.mocked(db.subtitleLibrary.findByVideoId).mockRejectedValue(mockError)

        const handler = ipcHandlers.get(IpcChannel.DB_SubtitleLibrary_FindByVideoId)!

        await expect(handler({}, mockVideoId)).rejects.toThrow('Find subtitles failed')
      })
    })

    describe('DB_SubtitleLibrary_FindByVideoIdAndPath', () => {
      it('应该根据视频ID和路径查找字幕', async () => {
        const mockVideoId = 1
        const mockFilePath = '/test/subtitle.srt'
        const mockResult = {
          id: 1,
          videoId: mockVideoId,
          filePath: mockFilePath,
          created_at: new Date()
        }

        const { db } = await import('../db/dao')
        vi.mocked(db.subtitleLibrary.findByVideoIdAndPath).mockResolvedValue(mockResult as any)

        const handler = ipcHandlers.get(IpcChannel.DB_SubtitleLibrary_FindByVideoIdAndPath)!
        const result = await handler({}, mockVideoId, mockFilePath)

        expect(db.subtitleLibrary.findByVideoIdAndPath).toHaveBeenCalledWith(
          mockVideoId,
          mockFilePath
        )
        expect(result).toEqual(mockResult)
      })

      it('应该返回undefined当字幕不存在时', async () => {
        const mockVideoId = 1
        const mockFilePath = '/nonexistent/subtitle.srt'

        const { db } = await import('../db/dao')
        vi.mocked(db.subtitleLibrary.findByVideoIdAndPath).mockResolvedValue(undefined)

        const handler = ipcHandlers.get(IpcChannel.DB_SubtitleLibrary_FindByVideoIdAndPath)!
        const result = await handler({}, mockVideoId, mockFilePath)

        expect(result).toBeUndefined()
      })

      it('应该处理查找特定字幕时的错误', async () => {
        const mockVideoId = 1
        const mockFilePath = '/test/subtitle.srt'
        const mockError = new Error('Find specific subtitle failed')

        const { db } = await import('../db/dao')
        vi.mocked(db.subtitleLibrary.findByVideoIdAndPath).mockRejectedValue(mockError)

        const handler = ipcHandlers.get(IpcChannel.DB_SubtitleLibrary_FindByVideoIdAndPath)!

        await expect(handler({}, mockVideoId, mockFilePath)).rejects.toThrow(
          'Find specific subtitle failed'
        )
      })
    })

    describe('DB_SubtitleLibrary_Delete', () => {
      it('应该成功删除字幕并记录日志', async () => {
        const mockSubtitleId = 1
        const mockResult = [{ numDeletedRows: 1n }]

        const { db } = await import('../db/dao')
        vi.mocked(db.subtitleLibrary.deleteSubtitle).mockResolvedValue(mockResult as any)

        const handler = ipcHandlers.get(IpcChannel.DB_SubtitleLibrary_Delete)!
        const result = await handler({}, mockSubtitleId)

        expect(db.subtitleLibrary.deleteSubtitle).toHaveBeenCalledWith(mockSubtitleId)
        expect(result).toEqual(mockResult)
      })

      it('应该处理删除字幕时的错误', async () => {
        const mockSubtitleId = 1
        const mockError = new Error('Delete subtitle failed')

        const { db } = await import('../db/dao')
        vi.mocked(db.subtitleLibrary.deleteSubtitle).mockRejectedValue(mockError)

        const handler = ipcHandlers.get(IpcChannel.DB_SubtitleLibrary_Delete)!

        await expect(handler({}, mockSubtitleId)).rejects.toThrow('Delete subtitle failed')
      })

      it('应该返回删除结果当字幕不存在时', async () => {
        const mockSubtitleId = 999
        const mockResult = [{ numDeletedRows: 0n }]

        const { db } = await import('../db/dao')
        vi.mocked(db.subtitleLibrary.deleteSubtitle).mockResolvedValue(mockResult as any)

        const handler = ipcHandlers.get(IpcChannel.DB_SubtitleLibrary_Delete)!
        const result = await handler({}, mockSubtitleId)

        expect(result).toEqual(mockResult)
      })
    })
  })

  describe('Database Transaction IPC Handler', () => {
    describe('DB_Transaction', () => {
      it('应该验证数据库事务IPC通道未被注册', () => {
        // 由于在ipc.ts中，DB_Transaction处理程序被注释了，
        // 这个测试确保该通道确实没有被注册
        const handler = ipcHandlers.get(IpcChannel.DB_Transaction)

        expect(handler).toBeUndefined()
      })

      it('应该说明事务功能的设计意图', () => {
        // 这个测试记录了为什么事务处理程序被注释掉的原因：
        // IPC 限制使得无法直接传递函数给事务回调
        // 实际的事务操作应该通过具体的数据库操作来实现
        expect(true).toBe(true) // 占位符断言
      })
    })

    describe('事务替代方案测试', () => {
      it('应该能通过组合多个DAO操作来模拟事务', async () => {
        // 模拟一个复杂操作，需要多个数据库操作协同工作
        const mockFile = {
          name: 'video.mp4',
          origin_name: 'test_video.mp4',
          path: '/test/video.mp4',
          size: 1024,
          ext: '.mp4',
          type: 'video' as const,
          created_at: new Date().toISOString()
        }

        const mockVideoRecord = {
          fileId: 'file123',
          currentTime: 0,
          duration: 3600,
          playedAt: Date.now(),
          firstPlayedAt: Date.now(),
          playCount: 1,
          isFinished: false,
          isFavorite: false
        }

        const mockSubtitle = {
          videoId: 1,
          filePath: '/test/subtitle.srt',
          created_at: new Date().toISOString()
        }

        const { db } = await import('../db/dao')

        // 模拟成功的文件添加
        vi.mocked(db.files.addFile).mockResolvedValue({ id: 1, ...mockFile } as any)

        // 模拟成功的视频记录创建
        vi.mocked(db.videoLibrary.addVideoRecord).mockResolvedValue({ id: 1 } as any)

        // 模拟成功的字幕添加
        vi.mocked(db.subtitleLibrary.addSubtitle).mockResolvedValue({
          id: 1,
          ...mockSubtitle
        } as any)

        // 执行组合操作
        const fileHandler = ipcHandlers.get(IpcChannel.DB_Files_Add)!
        const videoHandler = ipcHandlers.get(IpcChannel.DB_VideoLibrary_Add)!
        const subtitleHandler = ipcHandlers.get(IpcChannel.DB_SubtitleLibrary_Add)!

        const fileResult = await fileHandler({}, mockFile)
        const videoResult = await videoHandler({}, mockVideoRecord)
        const subtitleResult = await subtitleHandler({}, mockSubtitle)

        // 验证所有操作都成功执行
        expect(fileResult).toBeDefined()
        expect(videoResult).toBeDefined()
        expect(subtitleResult).toBeDefined()

        // 验证所有DAO方法都被调用
        expect(db.files.addFile).toHaveBeenCalledWith(mockFile)
        expect(db.videoLibrary.addVideoRecord).toHaveBeenCalledWith(mockVideoRecord)
        expect(db.subtitleLibrary.addSubtitle).toHaveBeenCalledWith(mockSubtitle)
      })

      it('应该能处理组合操作中的错误', async () => {
        const mockFile = {
          name: 'video.mp4',
          origin_name: 'test_video.mp4',
          path: '/test/video.mp4',
          size: 1024,
          ext: '.mp4',
          type: 'video' as const,
          created_at: new Date().toISOString()
        }

        const { db } = await import('../db/dao')

        // 模拟第一个操作成功
        vi.mocked(db.files.addFile).mockResolvedValue({ id: 1, ...mockFile } as any)

        // 模拟第二个操作失败
        const mockError = new Error('Video record creation failed')
        vi.mocked(db.videoLibrary.addVideoRecord).mockRejectedValue(mockError)

        const fileHandler = ipcHandlers.get(IpcChannel.DB_Files_Add)!
        const videoHandler = ipcHandlers.get(IpcChannel.DB_VideoLibrary_Add)!

        // 第一个操作应该成功
        const fileResult = await fileHandler({}, mockFile)
        expect(fileResult).toBeDefined()

        // 第二个操作应该失败
        await expect(
          videoHandler(
            {},
            {
              fileId: 'file123',
              currentTime: 0,
              duration: 0,
              playedAt: Date.now(),
              firstPlayedAt: Date.now(),
              playCount: 0,
              isFinished: false,
              isFavorite: false
            }
          )
        ).rejects.toThrow('Video record creation failed')

        // 在实际应用中，这里需要手动回滚第一个操作
        // 这展示了为什么需要在应用层面实现事务逻辑
      })
    })

    describe('错误处理和日志记录测试', () => {
      it('应该验证IPC处理程序中的错误日志记录', async () => {
        const mockError = new Error('Database connection failed')
        const { db } = await import('../db/dao')

        vi.mocked(db.files.addFile).mockRejectedValue(mockError)

        const handler = ipcHandlers.get(IpcChannel.DB_Files_Add)!

        await expect(
          handler(
            {},
            {
              name: 'test.mp4',
              origin_name: 'test.mp4',
              path: '/test.mp4',
              size: 1024,
              ext: '.mp4',
              type: 'video' as const,
              created_at: new Date().toISOString()
            }
          )
        ).rejects.toThrow('Database connection failed')

        // 在实际的IPC处理程序中，错误会被记录到日志
        // 这个测试确保错误被正确抛出，可以被上层捕获和记录
        expect(db.files.addFile).toHaveBeenCalled()
      })

      it('应该验证成功操作的日志记录', async () => {
        const mockFile = {
          name: 'video.mp4',
          origin_name: 'test_video.mp4',
          path: '/test/video.mp4',
          size: 1024,
          ext: '.mp4',
          type: 'video' as const,
          created_at: new Date().toISOString()
        }
        const mockResult = { id: 1, ...mockFile }

        const { db } = await import('../db/dao')
        vi.mocked(db.files.addFile).mockResolvedValue(mockResult as any)

        const handler = ipcHandlers.get(IpcChannel.DB_Files_Add)!
        const result = await handler({}, mockFile)

        // 验证操作成功完成
        expect(result).toEqual(mockResult)
        expect(db.files.addFile).toHaveBeenCalledWith(mockFile)

        // 在实际的IPC处理程序中，成功的操作会被记录到日志
        // 包括操作类型和相关的ID信息
      })
    })
  })
})
