/**
 * ServiceRegistry 测试 / ServiceRegistry Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { ServiceRegistry } from '../service-registry'
import { BaseService } from '../base-service'
import { ServiceInitOptions } from '../../types/service/base.types'

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
 * 测试服务A / Test Service A
 */
class ServiceA extends BaseService {
  public initializeMock = vi.fn()

  constructor() {
    super('ServiceA', '1.0.0')
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected async onInitialize(_options?: ServiceInitOptions): Promise<void> {
    this.initializeMock()
  }
}

/**
 * 测试服务B / Test Service B
 */
class ServiceB extends BaseService {
  public initializeMock = vi.fn()

  constructor() {
    super('ServiceB', '1.0.0')
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected async onInitialize(_options?: ServiceInitOptions): Promise<void> {
    this.initializeMock()
  }
}

/**
 * 测试服务C（依赖于A和B）/ Test Service C (depends on A and B)
 */
class ServiceC extends BaseService {
  public initializeMock = vi.fn()

  constructor() {
    super('ServiceC', '1.0.0')
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected async onInitialize(_options?: ServiceInitOptions): Promise<void> {
    this.initializeMock()
  }
}

describe('ServiceRegistry', () => {
  let registry: ServiceRegistry
  let serviceA: ServiceA
  let serviceB: ServiceB
  let serviceC: ServiceC

  beforeEach(() => {
    // Reset singleton instance

    ;(ServiceRegistry as any)._instance = null
    registry = ServiceRegistry.getInstance()
    serviceA = new ServiceA()
    serviceB = new ServiceB()
    serviceC = new ServiceC()
  })

  afterEach(async () => {
    await registry.disposeAll()
  })

  describe('Singleton Pattern', () => {
    it('should return same instance', () => {
      const registry1 = ServiceRegistry.getInstance()
      const registry2 = ServiceRegistry.getInstance()

      expect(registry1).toBe(registry2)
    })
  })

  describe('Service Registration', () => {
    it('should register service successfully', () => {
      registry.register('serviceA', serviceA)

      expect(registry.has('serviceA')).toBe(true)
      expect(registry.getServiceNames()).toContain('serviceA')
    })

    it('should not register duplicate service', () => {
      registry.register('serviceA', serviceA)

      expect(() => registry.register('serviceA', serviceB)).toThrow(
        "Service 'serviceA' is already registered"
      )
    })

    it('should register service with dependencies', () => {
      registry.register('serviceA', serviceA)
      registry.register('serviceB', serviceB)
      registry.register('serviceC', serviceC, {
        dependencies: [
          { name: 'serviceA', required: true },
          { name: 'serviceB', required: true }
        ]
      })

      expect(registry.has('serviceC')).toBe(true)
    })
  })

  describe('Service Retrieval', () => {
    it('should get registered service', () => {
      registry.register('serviceA', serviceA)

      const retrieved = registry.get('serviceA')
      expect(retrieved).toBe(serviceA)
    })

    it('should throw error for unregistered service', () => {
      expect(() => registry.get('nonexistent')).toThrow("Service 'nonexistent' is not registered")
    })

    it('should return same instance for singleton services', () => {
      registry.register('serviceA', serviceA, { singleton: true })

      const instance1 = registry.get('serviceA')
      const instance2 = registry.get('serviceA')

      expect(instance1).toBe(instance2)
    })
  })

  describe('Service Initialization', () => {
    it('should initialize single service', async () => {
      registry.register('serviceA', serviceA)

      await registry.initializeService('serviceA')

      expect(serviceA.isInitialized).toBe(true)
    })

    it('should initialize all services', async () => {
      registry.register('serviceA', serviceA)
      registry.register('serviceB', serviceB)

      await registry.initializeAll()

      expect(serviceA.isInitialized).toBe(true)
      expect(serviceB.isInitialized).toBe(true)
    })

    it('should initialize services in dependency order', async () => {
      const initOrder: string[] = []

      // Setup mocks to track order
      serviceA.initializeMock.mockImplementation(() => {
        initOrder.push('serviceA')
      })
      serviceB.initializeMock.mockImplementation(() => {
        initOrder.push('serviceB')
      })
      serviceC.initializeMock.mockImplementation(() => {
        initOrder.push('serviceC')
      })

      registry.register('serviceC', serviceC, {
        dependencies: [
          { name: 'serviceA', required: true },
          { name: 'serviceB', required: true }
        ]
      })
      registry.register('serviceA', serviceA)
      registry.register('serviceB', serviceB)

      await registry.initializeAll()

      // serviceC should be initialized after its dependencies
      expect(initOrder.indexOf('serviceA')).toBeLessThan(initOrder.indexOf('serviceC'))
      expect(initOrder.indexOf('serviceB')).toBeLessThan(initOrder.indexOf('serviceC'))
    })

    it('should handle missing required dependencies', async () => {
      registry.register('serviceC', serviceC, {
        dependencies: [{ name: 'nonexistent', required: true }]
      })

      await expect(registry.initializeService('serviceC')).rejects.toThrow(
        "Required dependency 'nonexistent' for service 'serviceC' is not registered"
      )
    })
  })

  describe('Service Unregistration', () => {
    it('should unregister service', async () => {
      registry.register('serviceA', serviceA)
      await registry.initializeService('serviceA')

      await registry.unregister('serviceA')

      expect(registry.has('serviceA')).toBe(false)
      expect(serviceA.isDisposed).toBe(true)
    })

    it('should not unregister service with dependents', async () => {
      registry.register('serviceA', serviceA)
      registry.register('serviceC', serviceC, {
        dependencies: [{ name: 'serviceA', required: true }]
      })

      await expect(registry.unregister('serviceA')).rejects.toThrow(
        "Cannot unregister service 'serviceA' because it has dependents: serviceC"
      )
    })
  })

  describe('Health Checks', () => {
    it('should perform health check on all services', async () => {
      registry.register('serviceA', serviceA)
      registry.register('serviceB', serviceB)
      await registry.initializeAll()

      const results = await registry.healthCheckAll()

      expect(results.serviceA.healthy).toBe(true)
      expect(results.serviceB.healthy).toBe(true)
    })
  })

  describe('Service Disposal', () => {
    it('should dispose all services', async () => {
      registry.register('serviceA', serviceA)
      registry.register('serviceB', serviceB)
      await registry.initializeAll()

      await registry.disposeAll()

      expect(serviceA.isDisposed).toBe(true)
      expect(serviceB.isDisposed).toBe(true)
    })
  })

  describe('Circular Dependencies', () => {
    it('should detect circular dependencies', () => {
      registry.register('serviceA', serviceA, {
        dependencies: [{ name: 'serviceB', required: true }]
      })
      registry.register('serviceB', serviceB, {
        dependencies: [{ name: 'serviceA', required: true }]
      })

      expect(() => registry.initializeAll()).rejects.toThrow(/Circular dependency detected/)
    })
  })

  describe('Service Priority', () => {
    it('should respect service priority in initialization order', async () => {
      const initOrder: string[] = []

      serviceA.initializeMock.mockImplementation(() => {
        initOrder.push('serviceA')
      })
      serviceB.initializeMock.mockImplementation(() => {
        initOrder.push('serviceB')
      })

      // Register serviceA with lower priority (should initialize after serviceB)
      registry.register('serviceA', serviceA, { priority: 1 })
      registry.register('serviceB', serviceB, { priority: 10 })

      await registry.initializeAll()

      expect(initOrder.indexOf('serviceB')).toBeLessThan(initOrder.indexOf('serviceA'))
    })
  })
})
