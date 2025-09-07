import { beforeEach, describe, expect, it, vi } from 'vitest'

import { initDatabase } from '../init'

// Mock dependencies
vi.mock('@main/services/LoggerService', () => {
  const mockLogger = {
    info: vi.fn(),
    error: vi.fn()
  }

  return {
    loggerService: {
      withContext: vi.fn(() => mockLogger)
    },
    __mockLogger: mockLogger
  }
})

vi.mock('../index', () => ({
  openDatabase: vi.fn()
}))

vi.mock('../migrate', () => ({
  runMigrations: vi.fn()
}))

describe('Database Init', () => {
  let mockLogger: any
  const mockOpenDatabase = vi.fn()
  const mockRunMigrations = vi.fn()

  beforeEach(async () => {
    vi.clearAllMocks()

    // 获取 mock logger 实例
    const loggerServiceMock = await import('@main/services/LoggerService')
    mockLogger = (loggerServiceMock as any).__mockLogger

    const indexModule = await import('../index')
    vi.mocked(indexModule.openDatabase).mockImplementation(mockOpenDatabase)

    const migrateModule = await import('../migrate')
    vi.mocked(migrateModule.runMigrations).mockImplementation(mockRunMigrations)
  })

  describe('initDatabase', () => {
    it('应该成功初始化数据库', async () => {
      mockRunMigrations.mockResolvedValue(undefined)

      await initDatabase()

      expect(mockLogger.info).toHaveBeenCalledWith('Initializing database...')
      expect(mockOpenDatabase).toHaveBeenCalledTimes(1)
      expect(mockLogger.info).toHaveBeenCalledWith('Database connection established')
      expect(mockRunMigrations).toHaveBeenCalledTimes(1)
      expect(mockLogger.info).toHaveBeenCalledWith('Migrations completed')
      expect(mockLogger.info).toHaveBeenCalledWith('Database initialization completed successfully')
    })

    it('应该处理数据库打开失败', async () => {
      const error = new Error('Database open failed')
      mockOpenDatabase.mockImplementation(() => {
        throw error
      })

      await expect(initDatabase()).rejects.toThrow('Database open failed')

      expect(mockLogger.error).toHaveBeenCalledWith('Failed to initialize database:', {
        error
      })
      expect(mockRunMigrations).not.toHaveBeenCalled()
    })

    it('应该处理迁移失败', async () => {
      const error = new Error('Migration failed')
      mockRunMigrations.mockRejectedValue(error)

      await expect(initDatabase()).rejects.toThrow('Migration failed')

      expect(mockOpenDatabase).toHaveBeenCalledTimes(1)
      expect(mockLogger.error).toHaveBeenCalledWith('Failed to initialize database:', {
        error
      })
    })

    it('应该按正确顺序执行初始化步骤', async () => {
      const callOrder: string[] = []

      mockOpenDatabase.mockImplementation(() => {
        callOrder.push('openDatabase')
      })

      mockRunMigrations.mockImplementation(() => {
        callOrder.push('runMigrations')
        return Promise.resolve()
      })

      await initDatabase()

      expect(callOrder).toEqual(['openDatabase', 'runMigrations'])
    })
  })
})
