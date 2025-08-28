# Structure Steering Document - EchoPlayer

## Project Architecture Overview

EchoPlayer 采用清晰的模块化架构，支持 Electron 多进程模式和现代化前端开发模式，为 AI 功能集成提供良好的扩展性。

## Directory Structure

```
echoplayer/
├── .claude/                    # Claude Code 配置和引导文档
│   └── steering/              # 项目引导文档
├── src/                       # 源代码目录
│   ├── main/                  # 主进程代码
│   │   ├── services/          # 系统服务层
│   │   ├── utils/             # 工具函数
│   │   ├── bootstrap.ts       # 应用初始化
│   │   ├── config.ts          # 配置管理
│   │   ├── ipc.ts             # 进程间通信
│   │   └── index.ts           # 主进程入口
│   ├── preload/               # 预加载脚本
│   │   ├── index.ts           # 预加载入口
│   │   └── preload.d.ts       # 类型定义
│   └── renderer/              # 渲染进程 (React 应用)
│       └── src/               # React 应用源码
│           ├── components/    # 公共组件
│           ├── contexts/      # React Context
│           ├── hooks/         # 自定义 Hooks
│           ├── infrastructure/# 基础设施层
│           ├── pages/         # 页面组件
│           ├── services/      # 前端服务层
│           ├── state/         # 状态管理
│           └── utils/         # 工具函数
├── packages/                  # 共享包 (计划中)
│   └── shared/               # 跨进程共享代码
├── scripts/                  # 构建和部署脚本
├── resources/                # 应用资源文件
└── icons/                    # 应用图标资源
```

## Main Process Structure (主进程架构)

### Services Layer (`src/main/services/`)
采用服务导向架构，每个服务负责特定的系统功能：

```typescript
// 核心服务
- AppService.ts           // 应用生命周期管理
- ConfigManager.ts        // 配置管理服务
- WindowService.ts        // 窗口管理服务
- LoggerService.ts        // 日志服务
- FileStorage.ts          // 文件存储服务

// 功能服务  
- NotificationService.ts  // 系统通知
- ShortcutService.ts      // 全局快捷键
- TrayService.ts          // 系统托盘
- ThemeService.ts         // 主题管理
- AppUpdater.ts           // 应用更新

// AI 相关服务 (计划新增)
- AIOrchestrator.ts       // AI 服务协调器
- SpeechService.ts        // 语音处理服务
- SubtitleAIService.ts    // 字幕 AI 分析
- LearningAnalytics.ts    // 学习数据分析
```

### Service Pattern Standards
```typescript
// 标准服务模式
export class ServiceName {
  private static instance: ServiceName
  private logger = loggerService.withContext('ServiceName')
  
  static getInstance(): ServiceName {
    if (!ServiceName.instance) {
      ServiceName.instance = new ServiceName()
    }
    return ServiceName.instance
  }
  
  // 服务初始化
  async initialize(): Promise<void>
  
  // 服务清理
  async cleanup(): Promise<void>
}
```

## Renderer Process Structure (渲染进程架构)

### Infrastructure Layer (`src/renderer/src/infrastructure/`)
基础设施层提供应用的核心支撑：

```typescript
- constants/              // 应用常量定义
  ├── index.ts           // 通用常量
  ├── platform.ts        // 平台相关常量
  ├── playback.const.ts  // 播放相关常量
  ├── shortcuts.const.ts // 快捷键定义
  └── ai.const.ts        // AI 功能常量 (新增)

- types/                  // TypeScript 类型定义
  ├── index.ts           // 导出所有类型
  ├── video.ts           // 视频相关类型
  ├── subtitle.ts        // 字幕相关类型
  ├── ai/                // AI 功能类型 (新增)
  │   ├── scene.ts       // 场景理解类型
  │   ├── speech.ts      // 语音对比类型
  │   └── chat.ts        // 智能问答类型
  └── ui/                // UI 相关类型

- hooks/                  // 基础设施 Hooks
  ├── performance/       // 性能相关
  ├── system/           // 系统集成
  ├── interaction/      // 用户交互
  └── ai/               // AI 功能 Hooks (新增)

- styles/                // 全局样式管理
- databases/            // 本地数据库
```

### Pages Structure (`src/renderer/src/pages/`)
采用特性导向的页面组织方式：

```typescript
- home/                   // 首页模块
  ├── HomePage.tsx       // 主页面组件  
  ├── VideoAddButton.tsx // 视频添加按钮
  ├── EmptyState.tsx     // 空状态展示
  └── components/        // 首页专用组件

- player/                // 播放器模块
  ├── PlayerPage.tsx     // 主播放页面
  ├── components/        // 播放器组件
  │   ├── VideoSurface.tsx      // 视频渲染
  │   ├── ControllerPanel/      // 控制面板
  │   ├── SubtitleOverlay.tsx   // 字幕覆盖层
  │   ├── AIAssistant/          // AI 助手面板 (新增)
  │   │   ├── SceneAnalysis.tsx // 场景分析
  │   │   ├── ChatInterface.tsx // 问答界面
  │   │   └── VoiceCompare.tsx  // 语音对比
  │   └── index.ts
  ├── engine/            // 播放器引擎
  │   ├── PlayerOrchestrator.ts // 播放器协调器
  │   ├── MediaClock.ts         // 媒体时钟
  │   └── core/                 // 核心算法
  ├── hooks/             // 播放器专用 Hooks
  └── state/             // 播放器状态管理

- settings/              // 设置页面
  ├── SettingsPage.tsx   // 设置主页
  ├── GeneralSettings.tsx// 通用设置
  ├── PlaybackSettings.tsx // 播放设置
  ├── AISettings.tsx     // AI 功能设置 (新增)
  └── ShortcutSettings.tsx // 快捷键设置
```

### State Management (`src/renderer/src/state/`)
基于 Zustand 的模块化状态管理：

```typescript
- stores/                 // 状态存储
  ├── player.store.ts     // 播放器核心状态
  ├── player-ui.store.ts  // 播放器 UI 状态  
  ├── player-subtitles.store.ts // 字幕状态
  ├── settings.store.ts   // 应用设置状态
  ├── ai.store.ts         // AI 功能状态 (新增)
  ├── learning.store.ts   // 学习数据状态 (新增)
  └── search.store.ts     // 搜索状态

- infrastructure/        // 状态管理基础设施
  ├── storage-engine.ts  // 持久化引擎
  ├── middleware.ts      // 状态中间件
  └── utils.ts          // 状态工具函数

- persistence/           // 持久化管理
  ├── persistence-manager.ts // 持久化管理器
  └── persistence-config.ts  // 持久化配置
```

## Component Organization Patterns

### Component Hierarchy
```typescript
// 组件分层原则
1. Page Components (页面组件)
   - 路由级别的顶层组件
   - 负责数据获取和状态管理
   - 组合多个 Feature Components

2. Feature Components (功能组件)  
   - 实现特定功能的组合组件
   - 管理局部状态和业务逻辑
   - 可复用的功能单元

3. UI Components (UI组件)
   - 纯展示组件，无业务逻辑
   - 高度可复用
   - 通过 props 接收数据和回调

4. Layout Components (布局组件)
   - 页面布局和结构组件
   - 响应式设计处理
   - 跨页面复用
```

### Component Naming Conventions
```typescript
// 文件命名规范
- PascalCase.tsx          // React 组件
- camelCase.ts           // 工具函数、服务
- kebab-case.scss        // 样式文件
- UPPER_CASE.ts          // 常量文件
- *.test.ts              // 测试文件
- *.d.ts                 // 类型定义文件

// 组件结构规范
ComponentName/
├── ComponentName.tsx    // 主组件文件
├── index.ts            // 导出文件
├── hooks/              // 组件专用 hooks
├── components/         // 子组件
├── styles/             // 组件样式
└── __tests__/          // 组件测试
```

## AI Integration Structure (新增)

### AI Service Layer
```typescript
- src/main/services/ai/
  ├── AIOrchestrator.ts       // AI 服务协调器
  ├── providers/              // AI 提供商适配层
  │   ├── OpenAIProvider.ts   // OpenAI API 集成
  │   ├── ClaudeProvider.ts   // Claude API 集成
  │   └── LocalProvider.ts    // 本地模型集成
  ├── processors/             // AI 功能处理器
  │   ├── SceneProcessor.ts   // 场景理解处理
  │   ├── SpeechProcessor.ts  // 语音分析处理
  │   └── ChatProcessor.ts    // 问答处理
  └── cache/                 // AI 结果缓存管理
      ├── CacheManager.ts     // 缓存管理器
      └── strategies/         // 缓存策略
```

### AI Frontend Integration
```typescript
- src/renderer/src/services/ai/
  ├── AIClient.ts            // AI 客户端封装
  ├── hooks/                 // AI 相关 Hooks
  │   ├── useSceneAnalysis.ts // 场景分析 Hook
  │   ├── useSpeechCompare.ts // 语音对比 Hook
  │   └── useAIChat.ts       // AI 问答 Hook
  └── components/            // AI UI 组件
      ├── AIAssistant/       // AI 助手组件
      ├── VoiceRecorder/     // 语音录制组件
      └── SceneDisplay/      // 场景展示组件
```

## File Naming & Organization Standards

### Import/Export Patterns
```typescript
// 统一的导入导出模式
// 每个模块目录包含 index.ts 统一导出
export { ComponentName } from './ComponentName'
export type { ComponentNameProps } from './ComponentName'

// 路径别名使用
import { PlayerOrchestrator } from '@renderer/pages/player/engine'
import { VideoType } from '@types/video'
import { loggerService } from '@logger'
```

### Code Organization Principles
1. **单一职责**: 每个文件/组件只负责一个功能
2. **依赖方向**: 依赖关系明确，避免循环依赖
3. **层次分离**: UI、业务逻辑、数据访问分层
4. **模块内聚**: 相关功能组织在同一模块内
5. **接口隔离**: 通过类型定义明确接口边界

## Testing Structure

### Test Organization
```typescript
- src/test/                   // 测试配置和工具
  ├── setup.ts               // 测试环境设置
  ├── utils/                 // 测试工具函数
  └── mocks/                 // 测试模拟数据

- 每个源文件对应的测试文件:
  ComponentName.tsx
  ComponentName.test.tsx     // 单元测试
  ComponentName.integration.test.tsx // 集成测试

- E2E 测试结构:
  tests/
  ├── e2e/                   // Playwright E2E 测试
  │   ├── player.spec.ts     // 播放器功能测试
  │   ├── ai.spec.ts         // AI 功能测试 (新增)
  │   └── helpers/           // 测试辅助函数
```

### Testing Patterns
- **单元测试**: 组件和函数的独立测试
- **集成测试**: 多个模块协作的测试
- **E2E 测试**: 完整用户流程测试
- **AI 功能测试**: AI 接口和响应测试

## Build & Deployment Structure

### Build Configuration
```typescript
- 构建配置文件:
  ├── electron.vite.config.ts    // Electron + Vite 构建配置
  ├── tsconfig.json              // TypeScript 根配置
  ├── tsconfig.node.json         // Node.js 类型配置
  ├── tsconfig.web.json          // Web 端类型配置
  ├── vitest.config.ts           // 测试配置
  └── playwright.config.ts       // E2E 测试配置

- 部署脚本:
  ├── scripts/release.ts         // 发布流程
  ├── scripts/version-manager.ts // 版本管理
  └── electron-builder.yml       // 打包配置
```

## Future Structure Considerations

### Planned Architectural Enhancements
1. **微服务化**: AI 功能逐步独立为微服务
2. **插件系统**: 支持第三方功能插件
3. **移动端**: React Native 代码复用策略
4. **云服务**: 云端数据同步架构

### Extension Points
- **AI 提供商**: 新增 AI 服务提供商的接入点
- **字幕格式**: 新字幕格式的解析扩展点
- **学习算法**: 个性化学习算法的插入点
- **UI 主题**: 自定义主题的扩展机制