/**
 * 配置存储服务测试 / Configuration Storage Service Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { AppConfigStorageService } from '../app-config-storage.service'
import {
  StorageEngine,
  StorageEventType,
  type StorageConfig
} from '../../../infrastructure/types/service/storage.types'
import { ServiceStatus } from '../../../infrastructure/types/service/base.types'

// Mock IPC Client Service
const mockAppConfigService = {
  getConfig: vi.fn(),
  updateConfig: vi.fn(),
  resetConfig: vi.fn(),
  getDefaultDataDirectory: vi.fn(),
  getTestVideoPath: vi.fn()
}

const mockIPCClientService = {
  initialize: vi.fn().mockResolvedValue(undefined),
  dispose: vi.fn().mockResolvedValue(undefined),
  appConfig: mockAppConfigService,
  isInitialized: true,
  status: ServiceStatus.SUCCESS,
  healthCheck: vi.fn().mockResolvedValue({ healthy: true }),
  isPreloadAvailable: vi.fn().mockReturnValue(true)
}

// Mock the IPC client service factory
vi.mock('../../api/ipc-client.service', () => ({
  createIPCClientService: vi.fn(() => mockIPCClientService)
}))

// Mock window.api for IPC client service
Object.defineProperty(window, 'api', {
  value: {
    appConfig: mockAppConfigService,
    env: {
      getNodeEnv: vi.fn().mockReturnValue('test'),
      isTestEnv: vi.fn().mockReturnValue(true),
      isDevelopment: vi.fn().mockReturnValue(false)
    }
  },
  writable: true,
  configurable: true
})

// Mock logger
vi.mock('../../../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn()
  }
}))

describe('ConfigStorageService', () => {
  let service: AppConfigStorageService
  let mockConfig: StorageConfig

  beforeEach(() => {
    vi.clearAllMocks()

    service = new AppConfigStorageService()

    mockConfig = {
      engine: StorageEngine.ELECTRON_STORE,
      namespace: 'test-config',
      version: '1.0.0'
    }

    // 设置默认的成功响应 / Setup default success responses
    mockAppConfigService.getConfig.mockResolvedValue({
      success: true,
      data: {
        app: {
          theme: 'dark',
          language: 'en'
        },
        user: {
          name: 'Test User',
          preferences: {
            autoSave: true,
            notifications: false
          }
        }
      }
    })

    mockAppConfigService.updateConfig.mockResolvedValue({
      success: true
    })

    mockAppConfigService.resetConfig.mockResolvedValue({
      success: true
    })
  })

  afterEach(async () => {
    if (service.isInitialized) {
      await service.dispose()
    }
  })

  describe('初始化和生命周期 / Initialization and Lifecycle', () => {
    it('应该正确初始化服务 / Should initialize service correctly', async () => {
      expect(service.status).toBe(ServiceStatus.IDLE)
      expect(service.isInitialized).toBe(false)

      await service.initialize()
      await service.configure(mockConfig)
    })

    it('应该正确处理服务销毁 / Should handle service disposal correctly', async () => {
      await service.initialize()
      expect(service.isInitialized).toBe(true)

      await service.dispose()
    })

    it('应该正确执行健康检查 / Should perform health check correctly', async () => {
      await service.initialize()
      await service.configure(mockConfig)

      const healthResult = await service.healthCheck()

      expect(healthResult.healthy).toBe(true)
      expect(healthResult.message).toContain('Configuration storage is healthy')
      expect(healthResult.details).toHaveProperty('engine', StorageEngine.ELECTRON_STORE)
      expect(healthResult.details).toHaveProperty('namespace', 'test-config')
    })
  })

  describe('基础操作 / Basic Operations', () => {
    beforeEach(async () => {
      await service.initialize()
      await service.configure(mockConfig)
    })

    it('应该正确获取配置值 / Should get configuration values correctly', async () => {
      const result = await service.get<string>('app.theme')

      expect(result.success).toBe(true)
      expect(result.data).toBe('dark')
      expect(mockAppConfigService.getConfig).toHaveBeenCalled()
    })

    it('应该在键不存在时返回默认值 / Should return default value when key does not exist', async () => {
      const result = await service.get<string>('nonexistent.key', 'default')

      expect(result.success).toBe(true)
      expect(result.data).toBe('default')
    })

    it('应该正确设置配置值 / Should set configuration values correctly', async () => {
      const result = await service.set('app.newSetting', 'newValue')

      expect(result.success).toBe(true)
      expect(mockAppConfigService.updateConfig).toHaveBeenCalledWith({
        app: { newSetting: 'newValue' }
      })
    })

    it('应该正确检查键是否存在 / Should check if keys exist correctly', async () => {
      const exists = await service.has('app.theme')
      const notExists = await service.has('nonexistent.key')

      expect(exists).toBe(true)
      expect(notExists).toBe(false)
    })

    it('应该正确删除配置值 / Should delete configuration values correctly', async () => {
      const result = await service.delete('app.theme')

      expect(result.success).toBe(true)
      expect(mockAppConfigService.updateConfig).toHaveBeenCalled()
    })

    it('应该正确清空所有配置 / Should clear all configuration correctly', async () => {
      const result = await service.clear()

      expect(result.success).toBe(true)
      expect(mockAppConfigService.resetConfig).toHaveBeenCalled()
    })
  })

  describe('配置节区操作 / Configuration Section Operations', () => {
    beforeEach(async () => {
      await service.initialize()
    })

    it('应该正确获取配置节区值 / Should get configuration section values correctly', async () => {
      const result = await service.getConfig<string>('app', 'theme')

      expect(result.success).toBe(true)
      expect(result.data).toBe('dark')
    })

    it('应该正确设置配置节区值 / Should set configuration section values correctly', async () => {
      const result = await service.setConfig('app', 'newTheme', 'light')

      expect(result.success).toBe(true)
      expect(mockAppConfigService.updateConfig).toHaveBeenCalledWith({
        app: { newTheme: 'light' }
      })
    })

    it('应该正确获取整个配置节区 / Should get entire configuration section correctly', async () => {
      const result = await service.getSection('user.preferences')

      expect(result.success).toBe(true)
      expect(result.data).toEqual({
        autoSave: true,
        notifications: false
      })
    })

    it('应该正确设置整个配置节区 / Should set entire configuration section correctly', async () => {
      const newPreferences = {
        autoSave: false,
        notifications: true,
        theme: 'dark'
      }

      const result = await service.setSection('user.preferences', newPreferences)

      expect(result.success).toBe(true)
      expect(mockAppConfigService.updateConfig).toHaveBeenCalledWith({
        user: { preferences: newPreferences }
      })
    })

    it('应该正确删除配置节区 / Should delete configuration section correctly', async () => {
      const result = await service.deleteConfig('app', 'theme')

      expect(result.success).toBe(true)
      expect(mockAppConfigService.updateConfig).toHaveBeenCalled()
    })
  })

  describe('批量操作 / Batch Operations', () => {
    beforeEach(async () => {
      await service.initialize()
    })

    it('应该正确设置多个值 / Should set multiple values correctly', async () => {
      const items = {
        'app.theme': 'light',
        'app.language': 'zh',
        'user.name': 'New User'
      }

      const result = await service.setMultiple(items)

      expect(result.success).toBe(true)
      expect(mockAppConfigService.updateConfig).toHaveBeenCalledWith({
        app: { theme: 'light', language: 'zh' },
        user: { name: 'New User' }
      })
    })

    it('应该正确获取多个值 / Should get multiple values correctly', async () => {
      const keys = ['app.theme', 'app.language', 'user.name']
      const result = await service.getMultiple<string>(keys)

      expect(result.success).toBe(true)
      expect(result.data).toEqual({
        'app.theme': 'dark',
        'app.language': 'en',
        'user.name': 'Test User'
      })
    })

    it('应该正确删除多个值 / Should delete multiple values correctly', async () => {
      const keys = ['app.theme', 'user.name']
      const result = await service.deleteMultiple(keys)

      expect(result.success).toBe(true)
      expect(mockAppConfigService.updateConfig).toHaveBeenCalled()
    })
  })

  describe('查询操作 / Query Operations', () => {
    beforeEach(async () => {
      await service.initialize()
    })

    it('应该正确获取所有键 / Should get all keys correctly', async () => {
      const result = await service.keys()

      expect(result.success).toBe(true)
      expect(result.data).toContain('app.theme')
      expect(result.data).toContain('app.language')
      expect(result.data).toContain('user.name')
      expect(result.data).toContain('user.preferences.autoSave')
      expect(result.data).toContain('user.preferences.notifications')
    })

    it('应该支持前缀过滤 / Should support prefix filtering', async () => {
      const result = await service.keys({ prefix: 'app' })

      expect(result.success).toBe(true)
      expect(result.data?.every((key) => key.startsWith('app'))).toBe(true)
    })

    it('应该支持分页 / Should support pagination', async () => {
      const result = await service.keys({ offset: 1, limit: 2 })

      expect(result.success).toBe(true)
      expect(result.data?.length).toBeLessThanOrEqual(2)
    })

    it('应该正确获取所有值 / Should get all values correctly', async () => {
      const result = await service.values()

      expect(result.success).toBe(true)
      expect(result.data).toContain('dark')
      expect(result.data).toContain('en')
      expect(result.data).toContain('Test User')
    })

    it('应该正确获取所有条目 / Should get all entries correctly', async () => {
      const result = await service.entries()

      expect(result.success).toBe(true)
      expect(result.data?.some(([key, value]) => key === 'app.theme' && value === 'dark')).toBe(
        true
      )
      expect(
        result.data?.some(([key, value]) => key === 'user.name' && value === 'Test User')
      ).toBe(true)
    })
  })

  describe('高级操作 / Advanced Operations', () => {
    beforeEach(async () => {
      await service.initialize()
      await service.configure(mockConfig)
    })

    it('应该正确计算存储大小 / Should calculate storage size correctly', async () => {
      const size = await service.size()

      expect(typeof size).toBe('number')
      expect(size).toBeGreaterThan(0)
    })

    it('应该正确获取存储统计信息 / Should get storage statistics correctly', async () => {
      const stats = await service.statistics()

      expect(stats).toHaveProperty('totalItems')
      expect(stats).toHaveProperty('engineType', StorageEngine.ELECTRON_STORE)
      expect(stats).toHaveProperty('namespace', 'test-config')
      expect(typeof stats.totalItems).toBe('number')
    })

    it('应该正确创建备份 / Should create backup correctly', async () => {
      const result = await service.backup()

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()

      const backupData = JSON.parse(result.data!)
      expect(backupData).toHaveProperty('version')
      expect(backupData).toHaveProperty('timestamp')
      expect(backupData).toHaveProperty('namespace', 'test-config')
      expect(backupData).toHaveProperty('data')
    })

    it('应该正确恢复备份 / Should restore backup correctly', async () => {
      const backupResult = await service.backup()
      expect(backupResult.success).toBe(true)

      const restoreResult = await service.restore(backupResult.data!)

      expect(restoreResult.success).toBe(true)
      expect(mockAppConfigService.updateConfig).toHaveBeenCalled()
    })

    it('应该在无效备份数据时恢复失败 / Should fail restore with invalid backup data', async () => {
      const result = await service.restore('invalid json')

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })
  })

  describe('配置验证 / Configuration Validation', () => {
    beforeEach(async () => {
      await service.initialize()
    })

    it('应该正确验证配置 / Should validate configuration correctly', async () => {
      const schema = {
        'app.theme': {
          type: 'string' as const,
          required: true
        },
        'app.language': {
          type: 'string' as const,
          required: true
        },
        'user.preferences.autoSave': {
          type: 'boolean' as const,
          required: false
        }
      }

      const result = await service.validateConfig(schema)

      expect(result.success).toBe(true)
    })

    it('应该在配置无效时验证失败 / Should fail validation with invalid configuration', async () => {
      const schema = {
        'nonexistent.required.field': {
          type: 'string' as const,
          required: true
        }
      }

      const result = await service.validateConfig(schema)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Required field')
    })
  })

  describe('事件监听 / Event Listening', () => {
    beforeEach(async () => {
      await service.initialize()
    })

    it('应该正确触发设置事件 / Should trigger set events correctly', async () => {
      const listener = vi.fn()
      service.addEventListener(StorageEventType.SET, listener)

      await service.set('test.key', 'test.value')

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: StorageEventType.SET,
          key: 'test.key',
          value: 'test.value',
          namespace: 'config'
        })
      )
    })

    it('应该正确触发删除事件 / Should trigger delete events correctly', async () => {
      const listener = vi.fn()
      service.addEventListener(StorageEventType.DELETE, listener)

      await service.delete('app.theme')

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: StorageEventType.DELETE,
          key: 'app.theme',
          namespace: 'config'
        })
      )
    })

    it('应该正确监听配置变更 / Should watch configuration changes correctly', async () => {
      const listener = vi.fn()
      service.watchConfig('app', listener)

      await service.set('app.newSetting', 'newValue')

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: StorageEventType.SET,
          key: 'app.newSetting',
          value: 'newValue'
        })
      )
    })

    it('应该正确移除事件监听器 / Should remove event listeners correctly', async () => {
      const listener = vi.fn()
      service.addEventListener(StorageEventType.SET, listener)
      service.removeEventListener(StorageEventType.SET, listener)

      await service.set('test.key', 'test.value')

      expect(listener).not.toHaveBeenCalled()
    })

    it('应该正确取消配置监听 / Should unwatch configuration changes correctly', async () => {
      const listener = vi.fn()
      service.watchConfig('app', listener)
      service.unwatchConfig('app', listener)

      await service.set('app.newSetting', 'newValue')

      expect(listener).not.toHaveBeenCalled()
    })
  })

  describe('错误处理 / Error Handling', () => {
    beforeEach(async () => {
      await service.initialize()
      await service.configure(mockConfig)
    })

    it('应该处理API调用失败 / Should handle API call failures', async () => {
      mockAppConfigService.getConfig.mockResolvedValueOnce({
        success: false,
        error: 'API Error'
      })

      const result = await service.get('any.key')

      expect(result.success).toBe(false)
      expect(result.error).toContain('API Error')
    })

    it('应该处理API异常 / Should handle API exceptions', async () => {
      mockAppConfigService.getConfig.mockRejectedValueOnce(new Error('Network Error'))

      const result = await service.get('any.key')

      expect(result.success).toBe(false)
      expect(result.error).toContain('Network Error')
    })

    it('应该在未初始化时抛出错误 / Should throw error when not initialized', async () => {
      const uninitializedService = new AppConfigStorageService()

      const result = await uninitializedService.get('any.key')

      expect(result.success).toBe(false)
      expect(result.error).toContain('not initialized')
    })
  })

  describe('配置迁移 / Configuration Migration', () => {
    it('应该正确执行配置迁移 / Should execute configuration migration correctly', async () => {
      const migrationConfig: StorageConfig = {
        engine: StorageEngine.ELECTRON_STORE,
        namespace: 'test-config',
        version: '2.0.0',
        migrations: [
          {
            version: '2.0.0',
            migrate: async (data) => ({
              ...data,
              migrated: true,
              version: '2.0.0'
            })
          }
        ]
      }

      const result = await service.configure(migrationConfig)

      expect(result.success).toBe(true)
      expect(mockAppConfigService.updateConfig).toHaveBeenCalledWith(
        expect.objectContaining({
          migrated: true,
          version: '2.0.0'
        })
      )
    })

    it('应该在迁移失败时处理错误 / Should handle migration failures', async () => {
      mockAppConfigService.updateConfig.mockResolvedValueOnce({
        success: false,
        error: 'Migration failed'
      })

      const migrationConfig: StorageConfig = {
        engine: StorageEngine.ELECTRON_STORE,
        namespace: 'test-config',
        version: '2.0.0',
        migrations: [
          {
            version: '2.0.0',
            migrate: async (data) => data
          }
        ]
      }

      const result = await service.configure(migrationConfig)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Migration failed')
    })
  })
})
