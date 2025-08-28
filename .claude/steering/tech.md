# Technology Steering Document - EchoPlayer

## Technology Vision

构建一个高性能、可扩展的 AI 驱动语言学习平台，采用现代化技术栈确保出色的用户体验和强大的 AI 功能集成。

## Core Technology Stack

### Desktop Application Framework
- **Electron 37.2.4**: 跨平台桌面应用框架
- **Node.js 18.0+**: 服务端运行时环境
- **Multi-process Architecture**: 主进程、渲染进程、预加载脚本分离

### Frontend Technology
- **React 19.1.0**: 现代化前端框架，支持最新特性
- **TypeScript 5.8+**: 类型安全的开发体验
- **Ant Design 5.26.6**: 专业 UI 组件库
- **Styled Components 6.1.19**: CSS-in-JS 样式解决方案
- **Framer Motion 12.23.12**: 动画和交互效果

### State Management & Data Flow
- **Zustand 5.0.6**: 轻量级状态管理
- **React Context**: 主题和全局状态管理
- **Dexie 4.0.11**: IndexedDB 数据库操作
- **Electron-conf**: 应用配置管理

### Build & Development Tools
- **Vite 6.3.5 + electron-vite 3.1.0**: 现代化构建工具链
- **SWC**: 高性能编译器，支持装饰器
- **PNPM**: 快速、节省空间的包管理器
- **ESLint + Prettier**: 代码质量和格式化

### Testing Framework
- **Vitest 2.1.9**: 单元测试框架
- **Playwright 1.54.1**: E2E 测试
- **Testing Library**: React 组件测试
- **MSW 2.10.4**: API Mock 服务

## AI Integration Technology Stack

### Language Models & AI Services
- **OpenAI GPT API**: 场景理解、文化解释、智能问答
- **Claude API**: 替代方案，提供多样化的 AI 能力
- **Custom Fine-tuned Models**: 针对语言学习场景优化的专用模型
- **本地模型支持**: 集成 Ollama 等本地大模型运行环境

### Speech & Audio Technology
- **Web Speech API**: 浏览器原生语音识别
- **Web Audio API**: 音频处理和分析
- **FFmpeg**: 音频格式转换和处理
- **语音评估 API**: 第三方发音评估服务集成
- **Text-to-Speech**: 语音合成服务

### Video & Subtitle Processing
- **React Player 2.16.1**: 视频播放组件
- **SubSRT 1.1.1**: 字幕格式解析和转换
- **FFmpeg Service**: 视频处理和元数据提取
- **字幕 AI 解析**: 智能字幕内容分析和增强

### AI Feature Implementation
- **场景理解引擎**: 
  - 视频帧分析 (计划中)
  - 对话上下文理解
  - 情感和语调识别
- **语音对比系统**:
  - 语音录制和处理
  - 波形对比算法
  - 发音准确度评估
- **智能问答系统**:
  - 上下文相关的问答
  - 学习内容推荐
  - 个性化学习路径

## Architecture Patterns

### Electron Multi-Process Architecture
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Main Process  │    │ Renderer Process │    │ Preload Script  │
│                 │    │                  │    │                 │
│ ├─ Services     │    │ ├─ React App     │    │ ├─ IPC Bridge   │
│ ├─ IPC Handlers │◄──►│ ├─ UI Components │◄──►│ ├─ API Exposure │
│ ├─ Window Mgmt  │    │ ├─ State Stores  │    │ ├─ Security     │
│ ├─ File System  │    │ ├─ AI Integration│    │ └─ Context      │
│ └─ AI Backends  │    │ └─ Media Player  │    │    Isolation    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### AI Service Integration Pattern
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend UI   │    │   AI Orchestrator│    │  AI Providers   │
│                 │    │                  │    │                 │
│ ├─ Chat Interface    │ ├─ Request Router│    │ ├─ OpenAI API   │
│ ├─ Voice Recorder│◄──►│ ├─ Cache Layer   │◄──►│ ├─ Claude API   │
│ ├─ Scene Display │    │ ├─ Rate Limiter │    │ ├─ Local Models │
│ └─ Progress Track│    │ └─ Error Handler │    │ └─ Speech APIs  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### State Management Architecture
- **Player State**: 播放控制、进度、字幕状态
- **AI State**: AI 功能状态、缓存、会话管理  
- **Settings State**: 用户偏好、配置、主题
- **Session State**: 学习会话、历史记录、统计数据

## Performance Requirements

### Application Performance
- **启动时间**: < 3 秒 (冷启动)
- **视频加载**: < 5 秒 (本地文件)
- **字幕同步精度**: < 100ms
- **内存占用**: < 500MB (播放状态)
- **CPU 使用率**: < 30% (正常播放)

### AI Feature Performance
- **场景理解响应**: < 3 秒
- **语音对比分析**: < 2 秒
- **智能问答响应**: < 5 秒
- **发音评估**: < 1 秒 (实时)
- **缓存命中率**: > 80% (常用查询)

### Scalability Targets
- **并发 AI 请求**: 支持 10+ 并发
- **本地数据存储**: 支持 10GB+ 学习数据
- **文件格式支持**: 所有主流视频和字幕格式
- **多语言支持**: 可扩展到 10+ 语言

## Security & Privacy

### Data Security
- **本地数据加密**: 敏感学习数据本地加密存储
- **API 密钥管理**: 安全的密钥存储和轮换
- **网络通信**: 全程 HTTPS/TLS 加密
- **用户隐私**: 最小化数据收集原则

### AI Security
- **输入验证**: 所有 AI 输入进行安全验证
- **输出过滤**: AI 回复内容安全过滤
- **Rate Limiting**: API 调用频率限制
- **Fallback 机制**: AI 服务故障时的降级处理

## Development Constraints

### Cross-Platform Support
- **Windows**: 10/11 (64位)，ARM64 支持计划中
- **macOS**: 10.15+ (Intel + Apple Silicon)
- **Linux**: Ubuntu 18.04+ 和主流发行版

### Dependencies & Compatibility  
- **Node.js**: 18.0+ (LTS 版本)
- **Electron**: 保持最新稳定版本
- **React**: 使用最新稳定特性
- **TypeScript**: 严格类型检查模式

### AI Service Dependencies
- **网络连接**: AI 功能需要稳定网络连接
- **API 配额**: 合理的 API 使用限制和成本控制
- **服务可用性**: 多个 AI 服务提供商的故障转移
- **本地化支持**: 离线 AI 功能的本地模型支持

## Integration Standards

### API Design Patterns
- **RESTful APIs**: 标准 HTTP API 设计
- **GraphQL 支持**: 复杂查询场景的 GraphQL 接口
- **WebSocket**: 实时功能 (语音对比、实时反馈)
- **IPC 通信**: Electron 进程间通信标准化

### AI Service Integration
- **统一 AI 接口**: 抽象层支持多个 AI 服务提供商
- **缓存策略**: 智能缓存减少 API 调用
- **错误处理**: 优雅的 AI 服务故障处理
- **监控和日志**: 详细的 AI 功能使用监控

## Future Technology Roadmap

### Short-term (3-6 months)
- AI 基础功能集成 (OpenAI/Claude)
- 语音录制和对比功能
- 本地数据库优化

### Medium-term (6-12 months)  
- 自定义 AI 模型训练
- 实时语音评估
- 移动端技术预研

### Long-term (12+ months)
- 边缘 AI 部署
- 多模态内容理解
- 分布式学习系统

## Quality Assurance

### Code Quality Standards
- **TypeScript 覆盖率**: 100%
- **单元测试覆盖率**: >80%
- **E2E 测试覆盖率**: 核心用户流程 100%
- **性能测试**: 关键功能性能基准测试

### AI Quality Standards  
- **AI 回复准确性**: 定期人工评估
- **响应时间监控**: 自动化性能监控
- **用户满意度**: 持续收集 AI 功能反馈
- **安全审计**: 定期 AI 安全性审查