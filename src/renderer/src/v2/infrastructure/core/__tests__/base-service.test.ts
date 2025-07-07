/**
 * BaseService 测试 / BaseService Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { BaseService } from '../base-service'
import { ServiceInitOptions, ServiceStatus, ServiceErrorType } from '../../types/service/base.types'

// Mock logger to avoid console output during tests
vi.mock('../../../../utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
}))

/**
 * 测试服务实现 / Test Service Implementation
 */
class TestService extends BaseService {
  private initializeCalled = false
  private disposeCalled = false
  private shouldFailInit = false
  private shouldFailDispose = false

  constructor(name = 'TestService', version = '1.0.0') {
    super(name, version)
  }

  setShouldFailInit(shouldFail: boolean): void {
    this.shouldFailInit = shouldFail
  }

  setShouldFailDispose(shouldFail: boolean): void {
    this.shouldFailDispose = shouldFail
  }

  get wasInitializeCalled(): boolean {
    return this.initializeCalled
  }

  get wasDisposeCalled(): boolean {
    return this.disposeCalled
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected async onInitialize(_options?: ServiceInitOptions): Promise<void> {
    if (this.shouldFailInit) {
      throw new Error('Initialization failed')
    }
    this.initializeCalled = true
  }

  protected async onDispose(): Promise<void> {
    if (this.shouldFailDispose) {
      throw new Error('Disposal failed')
    }
    this.disposeCalled = true
  }

  protected async onHealthCheck(): Promise<Record<string, unknown>> {
    return {
      customCheck: 'passed',
      timestamp: Date.now()
    }
  }
}

describe('BaseService', () => {
  let service: TestService

  beforeEach(() => {
    service = new TestService()
  })

  afterEach(async () => {
    if (service.isInitialized && !service.isDisposed) {
      await service.dispose()
    }
  })

  describe('Constructor', () => {
    it('should create service with correct name and version', () => {
      expect(service.name).toBe('TestService')
      expect(service.version).toBe('1.0.0')
      expect(service.status).toBe(ServiceStatus.IDLE)
      expect(service.isInitialized).toBe(false)
      expect(service.isDisposed).toBe(false)
    })

    it('should create service with custom name and version', () => {
      const customService = new TestService('CustomService', '2.0.0')
      expect(customService.name).toBe('CustomService')
      expect(customService.version).toBe('2.0.0')
    })
  })

  describe('Initialization', () => {
    it('should initialize service successfully', async () => {
      await service.initialize()

      expect(service.isInitialized).toBe(true)
      expect(service.status).toBe(ServiceStatus.SUCCESS)
      expect(service.wasInitializeCalled).toBe(true)
    })

    it('should not initialize twice', async () => {
      await service.initialize()
      await service.initialize() // Should not throw

      expect(service.isInitialized).toBe(true)
    })

    it('should handle initialization failure', async () => {
      service.setShouldFailInit(true)

      await expect(service.initialize()).rejects.toThrow()
      expect(service.isInitialized).toBe(false)
      expect(service.status).toBe(ServiceStatus.ERROR)
    })
  })

  describe('Health Check', () => {
    it('should return unhealthy for uninitialized service', async () => {
      const result = await service.healthCheck()

      expect(result.healthy).toBe(false)
      expect(result.message).toBe('Service not initialized')
    })

    it('should return healthy for initialized service', async () => {
      await service.initialize()
      const result = await service.healthCheck()

      expect(result.healthy).toBe(true)
      expect(result.message).toBe('Service healthy')
      expect(result.details).toEqual({
        customCheck: 'passed',
        timestamp: expect.any(Number)
      })
    })

    it('should return unhealthy for disposed service', async () => {
      await service.initialize()
      await service.dispose()
      const result = await service.healthCheck()

      expect(result.healthy).toBe(false)
      expect(result.message).toBe('Service disposed')
    })
  })

  describe('Disposal', () => {
    it('should dispose initialized service', async () => {
      await service.initialize()
      await service.dispose()

      expect(service.isDisposed).toBe(true)
      expect(service.isInitialized).toBe(false)
      expect(service.status).toBe(ServiceStatus.IDLE)
      expect(service.wasDisposeCalled).toBe(true)
    })

    it('should not dispose twice', async () => {
      await service.initialize()
      await service.dispose()
      await service.dispose() // Should not throw

      expect(service.isDisposed).toBe(true)
    })
  })

  describe('Error Handling', () => {
    it('should create service error correctly', () => {
      const error = (service as any).createError(
        ServiceErrorType.VALIDATION,
        'Test error',
        'TEST_001',
        { detail: 'test' }
      )

      expect(error.type).toBe(ServiceErrorType.VALIDATION)
      expect(error.message).toBe('Test error')
      expect(error.code).toBe('TEST_001')
      expect(error.details).toEqual({ detail: 'test' })
      expect(error.timestamp).toBeGreaterThan(0)
    })

    it('should wrap errors correctly', () => {
      const originalError = new Error('Original error')
      const wrappedError = (service as any).wrapError(originalError, 'Wrapped')

      expect(wrappedError.type).toBe(ServiceErrorType.INTERNAL)
      expect(wrappedError.message).toBe('Wrapped: Original error')
      expect(wrappedError.details?.originalError).toBe('Error')
    })
  })

  describe('Utility Methods', () => {
    it('should ensure initialization', async () => {
      expect(() => (service as any).ensureInitialized()).toThrow('Service not initialized')

      await service.initialize()
      expect(() => (service as any).ensureInitialized()).not.toThrow()

      await service.dispose()
      expect(() => (service as any).ensureInitialized()).toThrow('Service disposed')
    })

    it('should safely execute operations', async () => {
      await service.initialize()

      const result = await (service as any).safeExecute(async () => 'success', 'Operation failed')

      expect(result).toBe('success')
    })

    it('should handle safe execution errors', async () => {
      await service.initialize()

      await expect(
        (service as any).safeExecute(async () => {
          throw new Error('Test error')
        }, 'Operation failed')
      ).rejects.toThrow()
    })
  })
})
