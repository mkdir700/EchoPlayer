# 存储处理器模块 / Storage Handlers Module

这个目录包含了所有与数据存储相关的 IPC 处理器，按功能进行了模块化拆分。

## 文件结构 / File Structure

```
store/
├── index.ts                    # 入口文件，统一导出所有处理器 / Entry point, exports all handlers
├── storeInstances.ts          # 存储实例和默认配置 / Storage instances and default configs
├── recentPlaysHandlers.ts     # 最近播放列表处理器 / Recent plays handlers
├── appConfigHandlers.ts       # 应用配置处理器 / App config handlers
├── settingsHandlers.ts        # 设置处理器 / Settings handlers
├── genericStorageHandlers.ts  # 通用存储处理器 / Generic storage handlers
└── README.md                  # 说明文档 / Documentation
```

## 模块功能 / Module Functions

### storeInstances.ts

- 创建和管理存储实例 / Create and manage storage instances
- 定义默认配置 / Define default configurations
- 提供工具函数（如 ID 生成器）/ Provide utility functions (like ID generator)

### recentPlaysHandlers.ts

- 最近播放列表的 CRUD 操作 / CRUD operations for recent plays
- 搜索和过滤功能 / Search and filter functionality
- 视频 UI 配置管理 / Video UI configuration management

### appConfigHandlers.ts

- 应用配置的读取和更新 / Read and update app configuration
- 配置重置功能 / Configuration reset functionality
- 系统路径获取 / System path retrieval

### settingsHandlers.ts

- 用户设置管理 / User settings management
- 播放设置和更新设置 / Playback and update settings

### genericStorageHandlers.ts

- 支持 Zustand persist 中间件 / Support for Zustand persist middleware
- 通用键值存储 / Generic key-value storage

## 存储文件 / Storage Files

该模块管理两个主要的存储文件：

1. **config.json** - 应用配置（主题、语言、窗口设置等）
2. **echolab-recent-plays.json** - 最近播放记录和用户设置

## 使用方法 / Usage

```typescript
import { setupStoreHandlers } from './store'

// 在主进程中初始化所有存储处理器
setupStoreHandlers()
```

## 设计原则 / Design Principles

1. **单一职责** - 每个文件只负责一个特定的功能域
2. **模块化** - 便于维护和测试
3. **类型安全** - 完整的 TypeScript 类型支持
4. **错误处理** - 统一的错误处理和日志记录
5. **可扩展性** - 易于添加新的存储功能
