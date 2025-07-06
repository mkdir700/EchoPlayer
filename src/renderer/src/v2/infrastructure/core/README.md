# 服务基础设施 / Service Infrastructure

EchoLab V2 架构的核心服务基础设施，提供统一的服务生命周期管理、依赖注入和错误处理。

## 核心组件 / Core Components

### BaseService 抽象类

所有服务的基础抽象类，提供：

- **生命周期管理**：初始化、健康检查、销毁
- **状态管理**：服务状态跟踪和验证
- **错误处理**：统一的错误创建和包装
- **日志记录**：集成的日志功能
- **类型安全**：完整的 TypeScript 支持

### ServiceRegistry 服务注册表

单例模式的服务注册表，提供：

- **服务注册**：注册和注销服务
- **依赖管理**：自动解析和验证服务依赖
- **生命周期管理**：统一的服务初始化和销毁
- **健康监控**：服务健康状态检查
- **优先级控制**：基于优先级的初始化顺序

### ServiceFactory 服务工厂

简化服务创建和配置的工厂类，提供：

- **便捷创建**：简化服务实例创建过程
- **构建器模式**：流式API配置服务
- **批量操作**：批量创建和管理服务
- **统一接口**：一致的服务管理接口

## 快速开始 / Quick Start

### 1. 创建服务

```typescript
import { BaseService } from '@/v2/infrastructure/core'
import { ServiceInitOptions } from '@/v2/infrastructure/types'

class MyService extends BaseService {
  constructor() {
    super('MyService', '1.0.0')
  }

  protected async onInitialize(options?: ServiceInitOptions): Promise<void> {
    // 服务初始化逻辑
    this.logInfo('Service initializing...')
  }

  protected async onHealthCheck(): Promise<Record<string, unknown>> {
    return {
      status: 'healthy',
      timestamp: Date.now()
    }
  }

  protected async onDispose(): Promise<void> {
    // 清理资源
    this.logInfo('Service disposing...')
  }

  // 业务方法
  public doSomething(): string {
    this.ensureInitialized()
    return 'Hello from MyService'
  }
}
```

### 2. 注册和使用服务

```typescript
import { ServiceRegistry, ServiceFactory } from '@/v2/infrastructure/core'

// 获取服务工厂
const factory = new ServiceFactory()

// 注册服务
factory.register('MyService', new MyService(), {
  singleton: true,
  autoStart: true,
  priority: 10
})

// 初始化所有服务
await factory.initializeAll()

// 使用服务
const myService = factory.get<MyService>('MyService')
const result = myService.doSomething()

// 清理资源
await factory.disposeAll()
```

### 3. 使用构建器模式

```typescript
const myService = factory
  .builder('MyService', MyService)
  .asSingleton()
  .withPriority(10)
  .autoStart()
  .withInitOptions({ debug: true })
  .build()
```

## 服务依赖管理 / Service Dependency Management

### 定义依赖

```typescript
// 服务A依赖于ConfigService
factory.register('ServiceA', new ServiceA(), {
  dependencies: [
    { name: 'ConfigService', required: true },
    { name: 'LoggerService', required: false }
  ]
})
```

### 自动依赖解析

ServiceRegistry 会自动：

1. **验证依赖**：检查必需依赖是否已注册
2. **计算顺序**：基于依赖关系计算初始化顺序
3. **循环检测**：检测并报告循环依赖
4. **优先级排序**：在满足依赖的前提下按优先级排序

## 错误处理 / Error Handling

### 服务错误类型

```typescript
import { ServiceErrorType } from '@/v2/infrastructure/types'

// 在服务中创建错误
const error = this.createError(ServiceErrorType.VALIDATION, 'Invalid configuration', 'CONFIG_001', {
  configKey: 'apiUrl'
})

// 包装外部错误
try {
  await externalOperation()
} catch (error) {
  throw this.wrapError(error, 'External operation failed')
}
```

### 安全执行

```typescript
// 自动错误处理和状态检查
const result = await this.safeExecute(async () => {
  return await riskyOperation()
}, 'Risky operation failed')
```

## 健康检查 / Health Checks

### 实现健康检查

```typescript
protected async onHealthCheck(): Promise<Record<string, unknown>> {
  return {
    databaseConnected: await this.checkDatabase(),
    cacheSize: this.getCacheSize(),
    lastActivity: this.getLastActivity()
  }
}
```

### 执行健康检查

```typescript
// 单个服务健康检查
const health = await myService.healthCheck()

// 所有服务健康检查
const allHealth = await factory.getHealthStatus()
```

## 日志记录 / Logging

BaseService 提供集成的日志功能：

```typescript
// 不同级别的日志
this.logDebug('Debug information', { data: 'value' })
this.logInfo('Service started')
this.logWarn('Deprecated feature used')
this.logError('Operation failed', error)
```

日志级别可以通过初始化选项控制：

```typescript
await service.initialize({
  debug: true,
  logLevel: 'debug' // 'debug' | 'info' | 'warn' | 'error'
})
```

## 最佳实践 / Best Practices

### 1. 服务设计

- **单一职责**：每个服务只负责一个明确的功能域
- **接口隔离**：定义清晰的服务接口
- **依赖最小化**：尽量减少服务间的依赖关系

### 2. 错误处理

- **使用类型化错误**：使用 ServiceErrorType 枚举
- **提供详细信息**：在错误中包含有用的调试信息
- **优雅降级**：处理可选依赖的缺失

### 3. 性能优化

- **懒加载**：只在需要时初始化服务
- **资源清理**：在 onDispose 中正确清理资源
- **健康监控**：实现有意义的健康检查

### 4. 测试

- **模拟依赖**：使用 mock 对象测试服务
- **生命周期测试**：测试初始化、运行和销毁过程
- **错误场景**：测试各种错误情况

## 示例项目 / Example Projects

查看 `examples/` 目录中的完整使用示例：

- `usage-example.ts` - 基本使用示例
- 更多示例即将添加...

## API 参考 / API Reference

详细的 API 文档请参考各个类的 TypeScript 定义和注释。
