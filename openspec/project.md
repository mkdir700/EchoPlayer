# Project Context

## Purpose

这是一个基于 Electron + React + TypeScript 的桌面视频播放器应用，专注于提供高质量的字幕处理和播放体验。应用支持多种视频格式，提供字幕编辑、同步、样式定制等功能。

## Tech Stack

- **前端框架**: React 18 + TypeScript
- **桌面框架**: Electron
- **状态管理**: Zustand + Immer
- **样式方案**: styled-components + Ant Design (CSS 变量模式)
- **图标库**: lucide-react
- **测试框架**: vitest
- **包管理器**: pnpm
- **日志系统**: 自定义 loggerService

## Project Conventions

### Code Style

- 使用 styled-components 定义样式组件，废弃 v1 style 构建机制
- 优先使用 CSS 变量而非硬编码样式值
- CSS 样式文件位于 `src/renderer/src/assets/styles` 目录
- `assets/styles` 目录下的 SCSS（含 ant.scss）均为全局引入，会全局生效
- 使用 useTheme() token 或集中定义的样式变量保证跨主题一致性
- 所有图标统一使用 lucide-react，禁用 emoji
- 布局优先使用 flex 布局，避免 grid 作为默认方案
- 优先使用 antd 组件库，可复用时避免自定义开发

### 主题变量使用最佳实践

项目启用了 Ant Design 的 CSS 变量模式 (`cssVar: true`)，在 styled-components 中应采用分类使用策略：

**使用 CSS 变量的场景（主题相关属性）**：

- 颜色系统：`var(--ant-color-bg-elevated, fallback)`
- 阴影效果：`var(--ant-box-shadow-secondary, fallback)`
- 主题切换时会发生变化的属性

**使用 JS 变量的场景（设计系统常量）**：

- 尺寸间距：`${SPACING.XS}px`、`${BORDER_RADIUS.SM}px`
- 动画配置：`${ANIMATION_DURATION.SLOW}`、`${EASING.APPLE}`
- 层级关系：`${Z_INDEX.MODAL}`
- 字体配置：`${FONT_SIZES.SM}px`、`${FONT_WEIGHTS.MEDIUM}`
- 毛玻璃效果：`${GLASS_EFFECT.BACKGROUND_ALPHA.LIGHT}`

**推荐模式**：

```typescript
const StyledComponent = styled.div`
  /* 主题相关：使用 CSS 变量 */
  background: var(--ant-color-bg-elevated, rgba(0, 0, 0, ${GLASS_EFFECT.BACKGROUND_ALPHA.LIGHT}));
  color: var(--ant-color-white, #ffffff);
  box-shadow: var(--ant-box-shadow-secondary, ${SHADOWS.SM});

  /* 设计系统常量：使用 JS 变量 */
  padding: ${SPACING.XS}px ${SPACING.MD}px;
  border-radius: ${BORDER_RADIUS.SM}px;
  font-size: ${FONT_SIZES.SM}px;
  transition: opacity ${ANIMATION_DURATION.SLOW} ${EASING.APPLE};
  z-index: ${Z_INDEX.MODAL};
`
```

### Architecture Patterns

- **状态管理架构**: 三层架构
  - stores: 具体状态存储 (settings, shortcuts, runtime)
  - infrastructure: 基础设施和中间件
  - persistence: 持久化管理
- **中间件栈**: 包含持久化、DevTools 和订阅选择器功能
- **MiddlewarePresets**: 提供 basic/persistent/full/temporary 预设配置
- **组件模式**: 使用 styled(Component) 包装 antd 组件，保持架构一致性

### Testing Strategy

- 使用 vitest 作为测试框架
- 全局测试配置 `tests/setup.ts` 中 mock 了 `node:fs` 和 `node:fs/promises`
- 需要真实文件系统操作的测试必须在开头使用 `vi.unmock()` 取消全局 mock
- 使用 `loggerService` 记录测试日志，避免使用 console

### Git Workflow

- 使用 semantic-release 风格的提交信息
- 提交信息使用英文编写
- PR 内容使用英文编写
- 分支策略：功能开发使用 feature 分支，主分支保持稳定

## Domain Context

### 视频播放器架构

- **播放器控制**: 全权由编排器控制，组件不允许直接写入 currentTime
- **字幕处理**: 支持多格式字幕文件，提供字幕编辑、同步、样式定制功能
- **临时文件管理**: 实现集中清理机制，防止磁盘空间浪费

### 状态管理模式

- **Zustand 使用规范**: 必须使用 selector 在组件/Hook 顶层调用
- **禁止在 useMemo/useEffect 中调用 store Hook**
- **选择器规范**: 避免返回对象的选择器，使用单字段选择器或 shallow 比较器
- **React 副作用规范**: 遵循渲染纯函数、Effect 三分法、幂等更新等原则

### 资源管理与清理规范

**临时文件清理规范**：所有生成临时文件的服务都应实现集中清理机制，参考 `FFmpegDownloadService.cleanupTempFiles()` 和 `SubtitleExtractorService.cleanupTempFiles()` 的实现模式

临时文件清理的最佳实践：

1. 在服务中实现 `cleanupTempFiles()` 方法，扫描并删除符合特定模式的临时文件
2. 在 `src/main/index.ts` 的 `app.on('will-quit')` 事件中调用清理方法
3. 通过 IPC 通道暴露清理接口，允许渲染进程手动触发清理（如 `SubtitleExtractor_CleanupTemp`）
4. 使用正则表达式精确匹配临时文件模式，避免误删其他文件
5. 包含完整的错误处理和日志记录，跳过正在使用或无法删除的文件

**临时文件命名规范**：使用 `<prefix>_<timestamp>_<random>.<ext>` 格式（如 `subtitle_1234567890_abc123.srt`），便于模式匹配和清理

### 文件系统操作规范

**禁止使用同步文件操作**：在主进程中必须使用异步文件 API（`fs.promises.*`），避免阻塞事件循环导致应用冻结

文件操作最佳实践：

- ❌ 错误示例：`fs.readdirSync()`, `fs.unlinkSync()`, `fs.readFileSync()`
- ✅ 正确示例：`await fs.promises.readdir()`, `await fs.promises.unlink()`, `await fs.promises.readFile()`
- 批量文件操作使用 `Promise.all()` 并行执行，提升性能
- 所有文件操作方法应声明为 `async` 并返回 `Promise`

## Important Constraints

### 技术约束

- **文件操作**: 主进程中必须使用异步文件 API (`fs.promises.*`)，禁止同步操作
- **进程管理**: 不执行杀掉进程和启动程序的命令，仅提醒用户
- **状态更新**: 播放器控制全权由编排器控制，组件不支持写入 currentTime
- **内存管理**: 实现临时文件集中清理机制，遵循 `<prefix>_<timestamp>_<random>.<ext>` 命名规范

### 业务约束

- **废弃代码**: v1-deprecated 目录内容仅用于学习，禁止使用
- **日志规范**: 统一使用 loggerService，第二参数必须接收为 `{}`
- **主题兼容**: 使用 Ant Design CSS 变量实现浅色/深色主题自动适配
- **包管理**: 统一使用 pnpm 作为包管理器

## External Dependencies

### 核心依赖

- **Electron**: 桌面应用框架
- **React 18**: 前端UI框架
- **Ant Design**: UI组件库 (CSS变量模式)
- **Zustand**: 状态管理
- **styled-components**: CSS-in-JS 样式方案
- **lucide-react**: 图标库

### 开发依赖

- **vitest**: 测试框架
- **TypeScript**: 类型系统
- **pnpm**: 包管理器

### 系统集成

- **文件系统**: 通过 IPC 通道实现主进程与渲染进程通信
- **临时目录**: 系统临时目录用于字幕文件处理
- **日志系统**: 自定义 loggerService 提供统一日志接口

## Known Issues & Solutions

### DictionaryPopover 组件主题兼容性问题

- **问题**: 硬编码的深色主题颜色导致浅色主题下显示异常
- **解决方案**: 将硬编码颜色替换为 Ant Design CSS 变量（如 `var(--ant-color-text)`、`var(--ant-color-bg-elevated)`）
- **修复范围**: 文字颜色、背景色、边框、滚动条和交互状态的完整主题化

### SubtitleExtractorService 临时文件清理机制

- **问题**: 临时文件堆积导致磁盘空间浪费
- **解决方案**: 在应用退出时自动清理系统临时目录中的字幕临时文件
- **实现方式**:
  - 在 `src/main/index.ts` 的 `app.on('will-quit')` 事件中调用清理方法
  - 通过 IPC 通道暴露清理接口，允许手动触发清理
  - 使用正则表达式匹配临时文件模式进行精确清理

### Player 页面 Zustand Hook 使用规范

- **问题**: 在 useMemo/useEffect 中调用 store Hook 导致 Hooks 顺序问题
- **解决方案**: 统一使用 Zustand selector 顶层调用，禁止在 useMemo/useEffect 中调用 store Hook
- **修复范围**: SubtitleOverlay、SubtitleListPanel、usePlayerControls、useVideoEvents、VideoSurface、useSubtitleSync
- **防御措施**: 为 useSubtitleEngine 增加 subtitles 入参防御处理

### Zustand 选择器无限更新问题

- **问题**: 使用返回对象的选择器导致组件重渲染循环
- **解决方案**: 使用单字段选择器或配合 shallow 比较器
- **错误示例**: `useStore(s => ({ action1: s.action1, action2: s.action2 }))`
- **正确示例**: `const action1 = useStore(s => s.action1)` 或 `useStore(s => ({...}), shallow)`
