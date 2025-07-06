/**
 * 服务注册表 / Service Registry
 *
 * 管理所有服务的注册、初始化、生命周期和依赖关系
 * Manages registration, initialization, lifecycle and dependencies of all services
 */

import { IBaseService, ServiceInitOptions, HealthCheckResult } from '../types/service/base.types'
import { logger } from '../../../utils/logger'

/**
 * 服务依赖配置 / Service Dependency Configuration
 */
export interface ServiceDependency {
  name: string
  required: boolean
  version?: string
}

/**
 * 服务注册配置 / Service Registration Configuration
 */
export interface ServiceRegistration {
  name: string
  service: IBaseService
  dependencies: ServiceDependency[]
  singleton: boolean
  autoStart: boolean
  priority: number
}

/**
 * 服务注册表类 / Service Registry Class
 *
 * 单例模式，管理整个应用的服务生命周期
 * Singleton pattern, manages the entire application's service lifecycle
 */
export class ServiceRegistry {
  private static _instance: ServiceRegistry | null = null
  private readonly _services = new Map<string, ServiceRegistration>()
  private readonly _instances = new Map<string, IBaseService>()
  private readonly _initializationOrder: string[] = []
  private _initialized = false

  private constructor() {
    logger.info('[ServiceRegistry] Service registry created')
  }

  /**
   * 获取服务注册表实例 / Get Service Registry Instance
   */
  static getInstance(): ServiceRegistry {
    if (!ServiceRegistry._instance) {
      ServiceRegistry._instance = new ServiceRegistry()
    }
    return ServiceRegistry._instance
  }

  /**
   * 注册服务 / Register Service
   */
  register(
    name: string,
    service: IBaseService,
    options: {
      dependencies?: ServiceDependency[]
      singleton?: boolean
      autoStart?: boolean
      priority?: number
    } = {}
  ): void {
    if (this._services.has(name)) {
      throw new Error(`Service '${name}' is already registered`)
    }

    const registration: ServiceRegistration = {
      name,
      service,
      dependencies: options.dependencies || [],
      singleton: options.singleton !== false, // Default to true
      autoStart: options.autoStart !== false, // Default to true
      priority: options.priority || 0
    }

    this._services.set(name, registration)
    logger.info(`[ServiceRegistry] Service '${name}' registered`)
  }

  /**
   * 注销服务 / Unregister Service
   */
  async unregister(name: string): Promise<void> {
    const registration = this._services.get(name)
    if (!registration) {
      logger.warn(`[ServiceRegistry] Service '${name}' not found for unregistration`)
      return
    }

    // Check if other services depend on this service
    const dependents = this.findDependents(name)
    if (dependents.length > 0) {
      throw new Error(
        `Cannot unregister service '${name}' because it has dependents: ${dependents.join(', ')}`
      )
    }

    // Dispose the service instance if it exists
    const instance = this._instances.get(name)
    if (instance) {
      await instance.dispose()
      this._instances.delete(name)
    }

    this._services.delete(name)

    // Remove from initialization order
    const index = this._initializationOrder.indexOf(name)
    if (index !== -1) {
      this._initializationOrder.splice(index, 1)
    }

    logger.info(`[ServiceRegistry] Service '${name}' unregistered`)
  }

  /**
   * 获取服务实例 / Get Service Instance
   */
  get<T extends IBaseService>(name: string): T {
    const registration = this._services.get(name)
    if (!registration) {
      throw new Error(`Service '${name}' is not registered`)
    }

    // Return existing instance for singleton services
    if (registration.singleton) {
      const existingInstance = this._instances.get(name)
      if (existingInstance) {
        return existingInstance as T
      }
    }

    // Create new instance
    const instance = registration.service
    if (registration.singleton) {
      this._instances.set(name, instance)
    }

    return instance as T
  }

  /**
   * 检查服务是否已注册 / Check if Service is Registered
   */
  has(name: string): boolean {
    return this._services.has(name)
  }

  /**
   * 获取所有已注册的服务名称 / Get All Registered Service Names
   */
  getServiceNames(): string[] {
    return Array.from(this._services.keys())
  }

  /**
   * 初始化所有服务 / Initialize All Services
   */
  async initializeAll(options?: ServiceInitOptions): Promise<void> {
    if (this._initialized) {
      logger.warn('[ServiceRegistry] Services already initialized')
      return
    }

    try {
      logger.info('[ServiceRegistry] Starting service initialization...')

      // Calculate initialization order based on dependencies
      this.calculateInitializationOrder()

      // Initialize services in order
      for (const serviceName of this._initializationOrder) {
        const registration = this._services.get(serviceName)
        if (registration && registration.autoStart) {
          await this.initializeService(serviceName, options)
        }
      }

      this._initialized = true
      logger.info('[ServiceRegistry] All services initialized successfully')
    } catch (error) {
      logger.error('[ServiceRegistry] Service initialization failed', error)
      throw error
    }
  }

  /**
   * 初始化单个服务 / Initialize Single Service
   */
  async initializeService(name: string, options?: ServiceInitOptions): Promise<void> {
    const registration = this._services.get(name)
    if (!registration) {
      throw new Error(`Service '${name}' is not registered`)
    }

    // Check if dependencies are satisfied
    await this.ensureDependencies(name)

    // Get or create service instance
    const service = this.get(name)

    // Initialize if not already initialized
    if (!service.isInitialized) {
      logger.info(`[ServiceRegistry] Initializing service '${name}'...`)
      await service.initialize(options)
      logger.info(`[ServiceRegistry] Service '${name}' initialized`)
    }
  }

  /**
   * 销毁所有服务 / Dispose All Services
   */
  async disposeAll(): Promise<void> {
    logger.info('[ServiceRegistry] Disposing all services...')

    // Dispose in reverse order
    const reverseOrder = [...this._initializationOrder].reverse()

    for (const serviceName of reverseOrder) {
      const instance = this._instances.get(serviceName)
      if (instance) {
        try {
          await instance.dispose()
          logger.info(`[ServiceRegistry] Service '${serviceName}' disposed`)
        } catch (error) {
          logger.error(`[ServiceRegistry] Failed to dispose service '${serviceName}'`, error)
        }
      }
    }

    this._instances.clear()
    this._initialized = false
    logger.info('[ServiceRegistry] All services disposed')
  }

  /**
   * 执行所有服务的健康检查 / Perform Health Check on All Services
   */
  async healthCheckAll(): Promise<Record<string, HealthCheckResult>> {
    const results: Record<string, HealthCheckResult> = {}

    for (const [name, instance] of this._instances) {
      try {
        results[name] = await instance.healthCheck()
      } catch (error) {
        results[name] = {
          healthy: false,
          message: error instanceof Error ? error.message : 'Health check failed',
          timestamp: Date.now()
        }
      }
    }

    return results
  }

  /**
   * 计算初始化顺序 / Calculate Initialization Order
   */
  private calculateInitializationOrder(): void {
    const visited = new Set<string>()
    const visiting = new Set<string>()
    const order: string[] = []

    const visit = (serviceName: string): void => {
      if (visiting.has(serviceName)) {
        throw new Error(`Circular dependency detected involving service '${serviceName}'`)
      }

      if (visited.has(serviceName)) {
        return
      }

      visiting.add(serviceName)

      const registration = this._services.get(serviceName)
      if (registration) {
        // Visit dependencies first
        for (const dep of registration.dependencies) {
          if (this._services.has(dep.name)) {
            visit(dep.name)
          } else if (dep.required) {
            throw new Error(
              `Required dependency '${dep.name}' for service '${serviceName}' is not registered`
            )
          }
        }
      }

      visiting.delete(serviceName)
      visited.add(serviceName)
      order.push(serviceName)
    }

    // Sort services by priority first
    const sortedServices = Array.from(this._services.entries()).sort(
      ([, a], [, b]) => b.priority - a.priority
    )

    for (const [serviceName] of sortedServices) {
      visit(serviceName)
    }

    this._initializationOrder.length = 0
    this._initializationOrder.push(...order)

    logger.debug('[ServiceRegistry] Initialization order calculated:', order)
  }

  /**
   * 确保依赖项已满足 / Ensure Dependencies are Satisfied
   */
  private async ensureDependencies(serviceName: string): Promise<void> {
    const registration = this._services.get(serviceName)
    if (!registration) {
      return
    }

    for (const dep of registration.dependencies) {
      if (!this._services.has(dep.name)) {
        if (dep.required) {
          throw new Error(
            `Required dependency '${dep.name}' for service '${serviceName}' is not registered`
          )
        }
        continue
      }

      // Initialize dependency if not already initialized
      const depService = this.get(dep.name)
      if (!depService.isInitialized) {
        await this.initializeService(dep.name)
      }
    }
  }

  /**
   * 查找依赖于指定服务的服务 / Find Services that Depend on the Specified Service
   */
  private findDependents(serviceName: string): string[] {
    const dependents: string[] = []

    for (const [name, registration] of this._services) {
      if (registration.dependencies.some((dep) => dep.name === serviceName)) {
        dependents.push(name)
      }
    }

    return dependents
  }
}
