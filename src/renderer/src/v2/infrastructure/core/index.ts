/**
 * 核心服务基础设施入口文件 / Core Service Infrastructure Entry Point
 *
 * 导出服务基础设施相关的类和接口
 * Exports service infrastructure related classes and interfaces
 */

// 基础服务抽象类 / Base Service Abstract Class
export { BaseService } from './base-service'

// 服务注册表 / Service Registry
export {
  ServiceRegistry,
  type ServiceDependency,
  type ServiceRegistration
} from './service-registry'

// 服务工厂 / Service Factory
export { ServiceFactory } from './service-factory'
