/**
 * 服务工厂 / Service Factory
 *
 * 提供服务实例的创建和配置功能
 * Provides service instance creation and configuration functionality
 */

import { IBaseService, ServiceInitOptions, HealthCheckResult } from '../types/service/base.types'
import { ServiceRegistry, ServiceDependency } from './service-registry'
import { logger } from '../../../utils/logger'

/**
 * 服务构造函数类型 / Service Constructor Type
 */
export type ServiceConstructor<T extends IBaseService = IBaseService> = new (
  ...args: unknown[]
) => T

/**
 * 服务配置选项 / Service Configuration Options
 */
export interface ServiceFactoryOptions {
  dependencies?: ServiceDependency[]
  singleton?: boolean
  autoStart?: boolean
  priority?: number
  initOptions?: ServiceInitOptions
}

/**
 * 服务工厂类 / Service Factory Class
 *
 * 简化服务的创建、注册和配置过程
 * Simplifies the creation, registration and configuration process of services
 */
export class ServiceFactory {
  private readonly registry: ServiceRegistry

  constructor(registry?: ServiceRegistry) {
    this.registry = registry || ServiceRegistry.getInstance()
  }

  /**
   * 创建并注册服务 / Create and Register Service
   */
  create<T extends IBaseService>(
    name: string,
    ServiceClass: ServiceConstructor<T>,
    constructorArgs: unknown[] = [],
    options: ServiceFactoryOptions = {}
  ): T {
    try {
      // Create service instance
      const service = new ServiceClass(...constructorArgs)

      // Register service
      this.registry.register(name, service, {
        dependencies: options.dependencies,
        singleton: options.singleton,
        autoStart: options.autoStart,
        priority: options.priority
      })

      logger.info(`[ServiceFactory] Service '${name}' created and registered`)
      return service
    } catch (error) {
      logger.error(`[ServiceFactory] Failed to create service '${name}'`, error)
      throw error
    }
  }

  /**
   * 创建并注册多个服务 / Create and Register Multiple Services
   */
  createMultiple(
    services: Array<{
      name: string
      ServiceClass: ServiceConstructor
      constructorArgs?: unknown[]
      options?: ServiceFactoryOptions
    }>
  ): void {
    for (const serviceConfig of services) {
      this.create(
        serviceConfig.name,
        serviceConfig.ServiceClass,
        serviceConfig.constructorArgs || [],
        serviceConfig.options || {}
      )
    }
  }

  /**
   * 注册现有服务实例 / Register Existing Service Instance
   */
  register(name: string, service: IBaseService, options: ServiceFactoryOptions = {}): void {
    this.registry.register(name, service, {
      dependencies: options.dependencies,
      singleton: options.singleton,
      autoStart: options.autoStart,
      priority: options.priority
    })

    logger.info(`[ServiceFactory] Existing service '${name}' registered`)
  }

  /**
   * 获取服务实例 / Get Service Instance
   */
  get<T extends IBaseService>(name: string): T {
    return this.registry.get<T>(name)
  }

  /**
   * 检查服务是否存在 / Check if Service Exists
   */
  has(name: string): boolean {
    return this.registry.has(name)
  }

  /**
   * 初始化所有服务 / Initialize All Services
   */
  async initializeAll(options?: ServiceInitOptions): Promise<void> {
    await this.registry.initializeAll(options)
  }

  /**
   * 初始化特定服务 / Initialize Specific Service
   */
  async initialize(name: string, options?: ServiceInitOptions): Promise<void> {
    await this.registry.initializeService(name, options)
  }

  /**
   * 销毁所有服务 / Dispose All Services
   */
  async disposeAll(): Promise<void> {
    await this.registry.disposeAll()
  }

  /**
   * 销毁特定服务 / Dispose Specific Service
   */
  async dispose(name: string): Promise<void> {
    await this.registry.unregister(name)
  }

  /**
   * 获取所有服务的健康状态 / Get Health Status of All Services
   */
  async getHealthStatus(): Promise<Record<string, HealthCheckResult>> {
    return await this.registry.healthCheckAll()
  }

  /**
   * 获取服务列表 / Get Service List
   */
  getServiceNames(): string[] {
    return this.registry.getServiceNames()
  }

  /**
   * 创建服务构建器 / Create Service Builder
   */
  builder<T extends IBaseService>(
    name: string,
    ServiceClass: ServiceConstructor<T>
  ): ServiceBuilder<T> {
    return new ServiceBuilder(name, ServiceClass, this)
  }
}

/**
 * 服务构建器 / Service Builder
 *
 * 提供流式API来配置服务
 * Provides fluent API for configuring services
 */
export class ServiceBuilder<T extends IBaseService> {
  private constructorArgs: unknown[] = []
  private options: ServiceFactoryOptions = {}

  constructor(
    private readonly name: string,
    private readonly ServiceClass: ServiceConstructor<T>,
    private readonly factory: ServiceFactory
  ) {}

  /**
   * 设置构造函数参数 / Set Constructor Arguments
   */
  withArgs(...args: unknown[]): this {
    this.constructorArgs = args
    return this
  }

  /**
   * 设置依赖项 / Set Dependencies
   */
  withDependencies(dependencies: ServiceDependency[]): this {
    this.options.dependencies = dependencies
    return this
  }

  /**
   * 设置为单例 / Set as Singleton
   */
  asSingleton(singleton = true): this {
    this.options.singleton = singleton
    return this
  }

  /**
   * 设置自动启动 / Set Auto Start
   */
  autoStart(autoStart = true): this {
    this.options.autoStart = autoStart
    return this
  }

  /**
   * 设置优先级 / Set Priority
   */
  withPriority(priority: number): this {
    this.options.priority = priority
    return this
  }

  /**
   * 设置初始化选项 / Set Initialization Options
   */
  withInitOptions(initOptions: ServiceInitOptions): this {
    this.options.initOptions = initOptions
    return this
  }

  /**
   * 构建并注册服务 / Build and Register Service
   */
  build(): T {
    return this.factory.create(this.name, this.ServiceClass, this.constructorArgs, this.options)
  }
}

/**
 * 默认服务工厂实例 / Default Service Factory Instance
 */
export const serviceFactory = new ServiceFactory()
