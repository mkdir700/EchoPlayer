# Implementation Plan - Support SQLite

## Task Overview

本实施计划将EchoPlayer从Dexie/IndexedDB迁移到SQLite持久化层，使用better-sqlite3和Kysely实现类型安全的数据访问。实施采用7个阶段的渐进式方法，确保每个组件独立测试和验证后再进行集成。

## Steering Document Compliance

- **技术标准遵循**: 使用现有的TypeScript、Electron和服务层架构模式
- **项目结构遵循**: 在`src/main/services/database/`中实现数据库服务，扩展现有IPC和类型系统
- **代码复用最大化**: 利用LoggerService、FileStorage和现有IPC基础设施

## Atomic Task Requirements

每个任务设计为最适合Agent执行的原子单元：

- **文件范围**: 1-3个相关文件操作
- **时间限制**: 15-30分钟完成时间
- **单一职责**: 一个可测试、可验证的结果
- **具体文件路径**: 明确指定要创建或修改的文件
- **Agent优化**: 清晰的输入输出，最小化上下文切换需求

## Tasks

### Phase 1: 项目依赖和基础设置

- [ ] 1. 添加SQLite依赖到package.json

  - 文件: package.json
  - 添加better-sqlite3和kysely依赖到dependencies
  - 添加@types/better-sqlite3到devDependencies
  - 目的: 建立SQLite技术栈基础
  - _Requirements: 1.1_

- [ ] 2. 创建数据库类型定义文件

  - 文件: src/renderer/src/infrastructure/types/database.ts
  - 定义Database接口、表结构和查询类型
  - 扩展现有类型系统，保持一致性
  - 目的: 为Kysely提供类型安全基础
  - _Leverage: src/renderer/src/infrastructure/types/index.ts_
  - _Requirements: 1.2, 4.1_

- [ ] 3. 创建数据库配置文件

  - 文件: src/main/config/database.ts
  - 定义数据库路径、连接选项和性能配置
  - 使用现有配置管理模式
  - 目的: 集中管理数据库配置
  - _Leverage: src/main/config.ts_
  - _Requirements: 1.3_

### Phase 2: 核心数据库服务实现

- [ ] 4. 创建DatabaseService基础类

  - 文件: src/main/services/database/DatabaseService.ts
  - 实现数据库连接、初始化和基础操作
  - 集成LoggerService进行结构化日志记录
  - 目的: 建立数据库管理的核心服务
  - _Leverage: src/main/services/LoggerService.ts_
  - _Requirements: 1.1, 1.4_

- [ ] 5. 实现数据库连接池管理

  - 文件: src/main/services/database/ConnectionPool.ts
  - 创建连接池类，管理SQLite连接的创建和复用
  - 实现连接健康检查和自动重连机制
  - 目的: 优化数据库连接性能和可靠性
  - _Leverage: src/main/services/DatabaseService.ts_
  - _Requirements: 5.3, 6.3_

- [ ] 6. 创建事务管理器

  - 文件: src/main/services/database/TransactionManager.ts
  - 实现事务的开始、提交、回滚和错误处理
  - 支持嵌套事务和并发控制
  - 目的: 确保数据操作的原子性和一致性
  - _Leverage: src/main/services/database/DatabaseService.ts_
  - _Requirements: 6.1, 6.3_

- [ ] 7. 实现Kysely查询构建器集成

  - 文件: src/main/services/database/QueryBuilder.ts
  - 创建类型安全的查询构建器，基于Kysely
  - 提供通用的CRUD操作方法
  - 目的: 实现类型安全的SQL查询生成
  - _Leverage: src/renderer/src/infrastructure/types/database.ts_
  - _Requirements: 4.2, 4.3_

### Phase 3: 数据表结构和迁移

- [ ] 8. 创建数据库Schema定义

  - 文件: src/main/services/database/schema.ts
  - 定义Files、Video Library、Subtitle Library表结构
  - 包含索引、约束和关系定义
  - 目的: 统一管理数据库表结构
  - _Requirements: 2.1, 2.2_

- [ ] 9. 实现数据库迁移系统

  - 文件: src/main/services/database/MigrationManager.ts
  - 创建表结构、索引和初始数据的迁移脚本
  - 支持版本控制和回滚机制
  - 目的: 管理数据库版本和结构变更
  - _Leverage: src/main/services/database/DatabaseService.ts_
  - _Requirements: 2.3, 2.4_

- [ ] 10. 创建数据库初始化脚本

  - 文件: src/main/services/database/migrations/001_initial_schema.sql
  - SQL脚本创建三个核心表和相关索引
  - 包含外键约束和数据完整性检查
  - 目的: 建立完整的数据库表结构
  - _Leverage: src/main/services/database/schema.ts_
  - _Requirements: 2.1, 6.2_

### Phase 4: 数据访问服务层实现

- [ ] 11. 创建SQLite文件服务

  - 文件: src/main/services/database/SQLiteFileService.ts
  - 实现文件元数据的CRUD操作
  - 集成重复文件检测和hash计算
  - 目的: 管理文件元数据存储
  - _Leverage: src/main/services/FileStorage.ts, src/main/services/database/QueryBuilder.ts_
  - _Requirements: 3.1, 3.3_

- [ ] 12. 实现SQLiteVideoLibraryService核心方法

  - 文件: src/main/services/database/SQLiteVideoLibraryService.ts
  - 创建addOrUpdateRecord、getRecords、deleteRecord方法
  - 保持与现有VideoLibraryService API兼容
  - 目的: 替换Dexie的视频库管理功能
  - _Leverage: src/renderer/src/services/VideoLibraryService.ts, src/main/services/database/QueryBuilder.ts_
  - _Requirements: 3.1, 3.4_

- [ ] 13. 添加视频库高级查询功能

  - 文件: src/main/services/database/SQLiteVideoLibraryService.ts (扩展)
  - 实现复杂查询：getRecentRecords、getMostPlayedRecords、searchRecords
  - 优化查询性能，使用适当的索引
  - 目的: 提供强大的视频数据查询能力
  - _Leverage: 现有VideoLibraryService查询方法_
  - _Requirements: 5.1, 5.2_

- [ ] 14. 创建SQLiteSubtitleService

  - 文件: src/main/services/database/SQLiteSubtitleService.ts
  - 实现字幕文件关联、索引和搜索功能
  - 支持多语言字幕管理
  - 目的: 管理视频字幕文件的数据库操作
  - _Leverage: src/renderer/src/services/SubtitleLibrary.ts, src/main/services/database/QueryBuilder.ts_
  - _Requirements: 3.2, 3.4_

- [ ] 15. 实现数据库操作错误处理

  - 文件: src/main/services/database/DatabaseErrorHandler.ts
  - 统一的数据库错误分类、记录和恢复机制
  - 提供用户友好的错误消息转换
  - 目的: 标准化数据库错误处理流程
  - _Leverage: src/main/services/LoggerService.ts_
  - _Requirements: 8.2, 8.3_

### Phase 5: IPC通信层集成

- [ ] 16. 扩展IPC handlers for数据库操作

  - 文件: src/main/ipc.ts (修改现有)
  - 添加数据库相关的IPC消息处理器
  - 实现类型安全的消息序列化和错误传播
  - 目的: 提供渲染进程访问数据库的安全接口
  - _Leverage: 现有IPC基础设施和错误处理模式_
  - _Requirements: 7.1, 7.4_

- [ ] 17. 创建渲染进程数据库客户端

  - 文件: src/renderer/src/services/database/DatabaseClient.ts
  - 封装IPC调用，提供Promise-based的数据库操作接口
  - 实现请求缓存和批处理优化
  - 目的: 为渲染进程提供便捷的数据库访问方法
  - _Leverage: 现有IPC通信模式_
  - _Requirements: 7.2, 5.3_

- [ ] 18. 实现IPC性能优化

  - 文件: src/main/services/database/IPCOptimizer.ts
  - 批量操作支持，减少IPC通信频率
  - 实现查询结果压缩和序列化优化
  - 目的: 优化跨进程数据传输性能
  - _Leverage: src/renderer/src/services/database/DatabaseClient.ts_
  - _Requirements: 7.3, 5.4_

### Phase 6: 服务层替换和集成

- [ ] 19. 更新VideoLibraryService以使用SQLite后端

  - 文件: src/renderer/src/services/VideoLibraryService.ts (重大修改)
  - 替换Dexie调用为DatabaseClient调用
  - 保持所有现有API方法签名不变
  - 目的: 无缝切换到SQLite后端
  - _Leverage: src/renderer/src/services/database/DatabaseClient.ts_
  - _Requirements: 3.1, 3.4_

- [ ] 20. 更新SubtitleLibrary服务集成

  - 文件: src/renderer/src/services/SubtitleLibrary.ts (修改)
  - 集成SQLiteSubtitleService功能
  - 维持现有字幕管理API兼容性
  - 目的: 将字幕管理切换到SQLite存储
  - _Leverage: src/renderer/src/services/database/DatabaseClient.ts_
  - _Requirements: 3.2, 3.4_

- [ ] 21. 集成FileStorage与数据库元数据

  - 文件: src/main/services/FileStorage.ts (修改现有方法)
  - 在文件操作时同步更新SQLite中的元数据记录
  - 实现文件删除时的数据库清理机制
  - 目的: 保持文件系统和数据库的数据一致性
  - _Leverage: src/main/services/database/SQLiteFileService.ts_
  - _Requirements: 3.3_

- [ ] 22. 移除Dexie依赖和清理代码

  - 文件: src/renderer/src/infrastructure/databases/index.ts (删除)、package.json (修改)
  - 删除Dexie相关代码和配置
  - 清理unused imports和依赖项
  - 目的: 完成从Dexie到SQLite的迁移
  - _Requirements: All_

### Phase 7: 测试和性能优化

- [ ] 23. 创建数据库服务单元测试

  - 文件: src/test/main/services/database/DatabaseService.test.ts
  - 测试数据库连接、事务、错误处理
  - 使用内存SQLite进行隔离测试
  - 目的: 确保数据库核心功能正确性
  - _Leverage: 现有测试框架和模式_
  - _Requirements: 8.1, 8.4_

- [ ] 24. 创建VideoLibraryService集成测试

  - 文件: src/test/renderer/services/VideoLibraryService.test.ts
  - 测试完整的CRUD操作和业务逻辑
  - 验证API兼容性和性能指标
  - 目的: 确保视频库服务功能完整正确
  - _Leverage: 现有服务层测试模式_
  - _Requirements: 3.1, 5.1_

- [ ] 25. 实现数据库性能基准测试

  - 文件: src/test/performance/database-benchmarks.ts
  - 测试查询响应时间、并发操作、大数据集处理
  - 验证<50ms常规查询，<200ms复杂查询目标
  - 目的: 确保性能要求达标
  - _Requirements: 5.1, 5.2_

- [ ] 26. 创建IPC通信集成测试

  - 文件: src/test/integration/ipc-database.test.ts
  - 测试跨进程数据访问的完整流程
  - 验证错误处理和超时机制
  - 目的: 确保IPC数据访问的可靠性
  - _Requirements: 7.1, 7.2_

- [ ] 27. 实现查询性能优化

  - 文件: src/main/services/database/QueryOptimizer.ts
  - 分析慢查询，优化索引使用
  - 实现查询计划缓存和预编译语句
  - 目的: 达到性能目标并建立持续优化机制
  - _Leverage: src/main/services/database/QueryBuilder.ts_
  - _Requirements: 5.1, 5.2_

- [ ] 28. 添加数据库监控和日志

  - 文件: src/main/services/database/DatabaseMonitor.ts
  - 实现查询性能监控、连接状态跟踪
  - 集成现有日志系统，提供详细的调试信息
  - 目的: 提供生产环境的数据库运行状态监控
  - _Leverage: src/main/services/LoggerService.ts_
  - _Requirements: 8.3, 8.4_

## Implementation Notes

### 关键依赖关系
- 任务1-3必须在所有其他任务之前完成
- Phase 2 (任务4-7) 是Phase 3-4的前提
- 任务19-22的服务替换需要Phase 4和5完成
- 测试任务(23-26)可以与开发任务并行进行

### 性能验证检查点
- 任务13完成后: 验证查询性能<50ms
- 任务18完成后: 验证IPC通信延迟<100ms  
- 任务25完成后: 确认所有性能目标达成
- 任务27完成后: 建立持续性能监控

### 质量保证要求
- 每个Phase完成后运行相关测试套件
- 任务22完成后进行全面集成测试
- 所有数据库操作必须包含错误处理
- 所有公共API保持向后兼容性