/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * IPC客户端服务集成测试
 * IPC Client Service Integration Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { IPCClientService, createIPCClientService } from '../ipc-client.service'
import type {
  IIPCClientService,
  IpcClientConfig
} from '../../../infrastructure/types/service/ipc-client.types'
import { ServiceStatus } from '../../../infrastructure/types/service/base.types'
import { SubtitleDisplayMode } from '../../../infrastructure/types/domain/subtitle.types'
import { VideoFormat } from '../../../infrastructure/types/domain/video.types'

// Mock window.api
const mockAPI = {
  fileSystem: {
    checkFileExists: vi.fn(),
    readFile: vi.fn(),
    getFileUrl: vi.fn(),
    getFileInfo: vi.fn(),
    validateFile: vi.fn(),
    openFileDialog: vi.fn(),
    showItemInFolder: vi.fn()
  },
  dictionary: {
    youdaoRequest: vi.fn(),
    eudicRequest: vi.fn(),
    sha256: vi.fn(),
    eudicHtmlRequest: vi.fn()
  },
  store: {
    getRecentPlays: vi.fn(),
    addRecentPlay: vi.fn(),
    updateRecentPlay: vi.fn(),
    removeRecentPlay: vi.fn(),
    clearRecentPlays: vi.fn(),
    getRecentPlayByPath: vi.fn(),
    getRecentPlayByFileId: vi.fn(),
    removeMultipleRecentPlays: vi.fn(),
    searchRecentPlays: vi.fn(),
    getSettings: vi.fn(),
    updateSettings: vi.fn(),
    getVideoUIConfig: vi.fn(),
    updateVideoUIConfig: vi.fn(),
    getRawData: vi.fn(),
    setRawData: vi.fn(),
    removeRawData: vi.fn()
  },
  update: {
    checkForUpdates: vi.fn(),
    downloadUpdate: vi.fn(),
    installUpdate: vi.fn(),
    enableAutoUpdate: vi.fn(),
    getAppVersion: vi.fn(),
    getUpdateSettings: vi.fn(),
    saveUpdateSettings: vi.fn(),
    setUpdateChannel: vi.fn()
  },
  appConfig: {
    getConfig: vi.fn(),
    updateConfig: vi.fn(),
    resetConfig: vi.fn(),
    getDefaultDataDirectory: vi.fn(),
    getTestVideoPath: vi.fn()
  },
  window: {
    setTitleBarOverlay: vi.fn(),
    setAlwaysOnTop: vi.fn(),
    isAlwaysOnTop: vi.fn(),
    minimize: vi.fn(),
    maximize: vi.fn(),
    close: vi.fn(),
    restart: vi.fn(),
    getPlatform: vi.fn(),
    getVersion: vi.fn(),
    setFullScreen: vi.fn(),
    isFullScreen: vi.fn(),
    toggleFullScreen: vi.fn()
  },
  env: {
    getNodeEnv: vi.fn(() => 'test'),
    isTestEnv: vi.fn(() => true),
    isDevelopment: vi.fn(() => false)
  },
  ffmpeg: {
    checkExists: vi.fn(),
    getVersion: vi.fn(),
    download: vi.fn(),
    getVideoInfo: vi.fn(),
    transcode: vi.fn(),
    getPath: vi.fn(),
    getDataDirectory: vi.fn(),
    cancelTranscode: vi.fn()
  },
  log: vi.fn()
}

// 全局 window.api mock
Object.defineProperty(globalThis, 'window', {
  value: {
    api: mockAPI
  },
  writable: true
})

describe('IPCClientService', () => {
  let service: IIPCClientService
  let config: Partial<IpcClientConfig>

  beforeEach(() => {
    // 重置所有 mock
    vi.clearAllMocks()

    config = {
      timeout: 5000,
      retries: 2,
      retryDelay: 100,
      enableLogging: false
    }

    service = createIPCClientService(config)
  })

  afterEach(async () => {
    if (service && !service.isDisposed) {
      await service.dispose()
    }
  })

  describe('服务初始化 / Service Initialization', () => {
    it('应该成功初始化服务 / should initialize service successfully', async () => {
      expect(service.isInitialized).toBe(false)
      expect(service.status).toBe(ServiceStatus.IDLE)

      await service.initialize()

      expect(service.isInitialized).toBe(true)
      expect(service.status).toBe(ServiceStatus.SUCCESS)
    })

    it('应该在 preload API 不可用时抛出错误 / should throw error when preload API is not available', async () => {
      // 临时移除 window.api
      const originalAPI = (globalThis as any).window.api
      delete (globalThis as any).window.api

      await expect(service.initialize()).rejects.toThrow('Preload API is not available')

      // 恢复 window.api
      ;(globalThis as any).window.api = originalAPI
    })

    it('应该支持重复初始化而不出错 / should support repeated initialization without error', async () => {
      await service.initialize()
      expect(service.isInitialized).toBe(true)

      // 再次初始化应该不抛出错误
      await expect(service.initialize()).resolves.toBeUndefined()
      expect(service.isInitialized).toBe(true)
    })
  })

  describe('健康检查 / Health Check', () => {
    beforeEach(async () => {
      await service.initialize()
    })

    it('应该返回健康状态 / should return healthy status', async () => {
      const healthResult = await service.healthCheck()

      expect(healthResult.healthy).toBe(true)
      expect(healthResult.message).toBe('IPC Client service is healthy')
      expect(healthResult.timestamp).toBeTypeOf('number')
      expect(healthResult.details).toMatchObject({
        preloadAvailable: true,
        environment: 'test'
      })
    })

    it('应该在 preload API 不可用时返回不健康状态 / should return unhealthy when preload API is not available', async () => {
      // 临时移除 window.api
      const originalAPI = (globalThis as any).window.api
      delete (globalThis as any).window.api

      const healthResult = await service.healthCheck()

      expect(healthResult.healthy).toBe(false)
      expect(healthResult.message).toBe('Preload API not available')
      expect(healthResult.details).toMatchObject({
        preloadAvailable: false
      })

      // 恢复 window.api
      ;(globalThis as any).window.api = originalAPI
    })
  })

  describe('文件系统服务 / File System Service', () => {
    beforeEach(async () => {
      await service.initialize()
    })

    it('应该成功检查文件是否存在 / should successfully check if file exists', async () => {
      const filePath = '/test/file.txt'
      mockAPI.fileSystem.checkFileExists.mockResolvedValue(true)

      const result = await service.fileSystem.checkFileExists(filePath)

      expect(result.success).toBe(true)
      expect(result.data).toBe(true)
      expect(mockAPI.fileSystem.checkFileExists).toHaveBeenCalledWith(filePath)
    })

    it('应该处理文件系统操作错误 / should handle file system operation errors', async () => {
      const filePath = '/test/nonexistent.txt'
      const error = new Error('File not found')
      mockAPI.fileSystem.checkFileExists.mockRejectedValue(error)

      const result = await service.fileSystem.checkFileExists(filePath)

      expect(result.success).toBe(false)
      expect(result.error).toContain('File not found')
    })

    it('应该成功读取文件 / should successfully read file', async () => {
      const filePath = '/test/file.txt'
      const fileContent = 'Hello World'
      mockAPI.fileSystem.readFile.mockResolvedValue(fileContent)

      const result = await service.fileSystem.readFile(filePath)

      expect(result.success).toBe(true)
      expect(result.data).toBe(fileContent)
      expect(mockAPI.fileSystem.readFile).toHaveBeenCalledWith(filePath)
    })

    it('应该支持文件对话框操作 / should support file dialog operations', async () => {
      const dialogOptions = {
        title: 'Select File',
        filters: [{ name: 'Videos', extensions: ['mp4', 'avi'] }]
      }
      const dialogResult = {
        canceled: false,
        filePaths: ['/selected/file.mp4']
      }
      mockAPI.fileSystem.openFileDialog.mockResolvedValue(dialogResult)

      const result = await service.fileSystem.openFileDialog(dialogOptions)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(dialogResult)
      expect(mockAPI.fileSystem.openFileDialog).toHaveBeenCalledWith(dialogOptions)
    })
  })

  describe('存储服务 / Storage Service', () => {
    beforeEach(async () => {
      await service.initialize()
    })

    it('应该成功获取最近播放列表 / should successfully get recent plays', async () => {
      const recentPlays = [
        { id: '1', title: 'Video 1', path: '/path/to/video1.mp4', lastOpenedAt: Date.now() }
      ]
      mockAPI.store.getRecentPlays.mockResolvedValue(recentPlays)

      const result = await service.storage.getRecentPlays()

      expect(result.success).toBe(true)
      expect(result.data).toEqual(recentPlays)
      expect(mockAPI.store.getRecentPlays).toHaveBeenCalled()
    })

    it('应该成功添加最近播放项 / should successfully add recent play item', async () => {
      const newItem = {
        videoInfo: {
          filePath: '/path/to/new.mp4',
          fileName: 'new.mp4',
          fileSize: 1024000,
          duration: 3600,
          format: VideoFormat.MP4,
          resolution: {
            width: 1920,
            height: 1080,
            aspectRatio: 16 / 9
          },
          frameRate: 30,
          bitRate: 2000,
          createdAt: new Date('2024-01-01'),
          modifiedAt: new Date('2024-01-01')
        },
        lastPosition: 0,
        playCount: 1,
        videoPlaybackSettings: {
          displayMode: SubtitleDisplayMode.BILINGUAL,
          volume: 0.8,
          playbackRate: 1.0,
          isSingleLoop: false,
          loopSettings: { count: 0 },
          isAutoPause: false
        }
      }
      mockAPI.store.addRecentPlay.mockResolvedValue({ success: true })

      const result = await service.storage.addRecentPlay(newItem)

      expect(result.success).toBe(true)
      expect(mockAPI.store.addRecentPlay).toHaveBeenCalledWith(newItem)
    })

    it('应该处理存储操作失败 / should handle storage operation failures', async () => {
      const newItem = {
        videoInfo: {
          filePath: '/path/to/new.mp4',
          fileName: 'new.mp4',
          fileSize: 1024000,
          duration: 3600,
          format: VideoFormat.MP4,
          resolution: {
            width: 1920,
            height: 1080,
            aspectRatio: 16 / 9
          },
          frameRate: 30,
          bitRate: 2000,
          createdAt: new Date('2024-01-01'),
          modifiedAt: new Date('2024-01-01')
        },
        lastPosition: 0,
        playCount: 1,
        videoPlaybackSettings: {
          displayMode: SubtitleDisplayMode.BILINGUAL,
          volume: 0.8,
          playbackRate: 1.0,
          isSingleLoop: false,
          loopSettings: { count: 0 },
          isAutoPause: false
        }
      }
      mockAPI.store.addRecentPlay.mockResolvedValue({
        success: false,
        error: 'Storage full'
      })

      const result = await service.storage.addRecentPlay(newItem)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Storage full')
    })

    it('应该支持设置管理 / should support settings management', async () => {
      const settings = {
        theme: 'dark',
        autoplay: true
      }
      mockAPI.store.getSettings.mockResolvedValue(settings)

      const result = await service.storage.getSettings()

      expect(result.success).toBe(true)
      expect(result.data).toEqual(settings)
    })
  })

  describe('重试机制 / Retry Mechanism', () => {
    beforeEach(async () => {
      await service.initialize()
    })

    it('应该在操作失败时自动重试 / should automatically retry on operation failure', async () => {
      const filePath = '/test/file.txt'

      // 前两次调用失败，第三次成功
      mockAPI.fileSystem.checkFileExists
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue(true)

      const result = await service.fileSystem.checkFileExists(filePath)

      expect(result.success).toBe(true)
      expect(result.data).toBe(true)
      expect(mockAPI.fileSystem.checkFileExists).toHaveBeenCalledTimes(3)
    })

    it('应该在重试次数耗尽后返回错误 / should return error after retries are exhausted', async () => {
      const filePath = '/test/file.txt'
      const error = new Error('Persistent error')

      // 所有调用都失败
      mockAPI.fileSystem.checkFileExists.mockRejectedValue(error)

      const result = await service.fileSystem.checkFileExists(filePath)

      expect(result.success).toBe(false)
      expect(result.error).toContain('failed after 3 attempts')
      expect(mockAPI.fileSystem.checkFileExists).toHaveBeenCalledTimes(3) // 1 initial + 2 retries
    })
  })

  describe('环境服务 / Environment Service', () => {
    beforeEach(async () => {
      await service.initialize()
    })

    it('应该正确返回环境信息 / should correctly return environment info', () => {
      expect(service.environment.getNodeEnv()).toBe('test')
      expect(service.environment.isTestEnv()).toBe(true)
      expect(service.environment.isDevelopment()).toBe(false)
    })
  })

  describe('配置管理 / Configuration Management', () => {
    it('应该返回当前配置 / should return current configuration', async () => {
      await service.initialize()

      const currentConfig = service.getConfig()

      expect(currentConfig).toMatchObject(config)
    })

    it('应该支持配置更新 / should support configuration updates', async () => {
      await service.initialize()

      const newConfig = { timeout: 10000, retries: 5 }
      service.updateConfig(newConfig)

      const updatedConfig = service.getConfig()

      expect(updatedConfig.timeout).toBe(10000)
      expect(updatedConfig.retries).toBe(5)
    })
  })

  describe('服务销毁 / Service Disposal', () => {
    it('应该正确销毁服务 / should properly dispose service', async () => {
      await service.initialize()
      expect(service.isDisposed).toBe(false)

      await service.dispose()

      expect(service.isDisposed).toBe(true)
      expect(service.isInitialized).toBe(false)
      expect(service.status).toBe(ServiceStatus.IDLE)
    })

    it('应该支持重复销毁而不出错 / should support repeated disposal without error', async () => {
      await service.initialize()
      await service.dispose()

      // 再次销毁应该不抛出错误
      await expect(service.dispose()).resolves.toBeUndefined()
      expect(service.isDisposed).toBe(true)
    })
  })

  describe('工厂函数 / Factory Function', () => {
    it('应该创建带有默认配置的服务实例 / should create service instance with default config', () => {
      const defaultService = createIPCClientService()

      expect(defaultService).toBeInstanceOf(IPCClientService)
      expect(defaultService.name).toBe('IPCClientService')
      expect(defaultService.version).toBe('1.0.0')
    })

    it('应该创建带有自定义配置的服务实例 / should create service instance with custom config', () => {
      const customConfig = {
        timeout: 15000,
        enableLogging: false
      }
      const customService = createIPCClientService(customConfig)

      expect(customService.getConfig().timeout).toBe(15000)
      expect(customService.getConfig().enableLogging).toBe(false)
    })
  })
})
