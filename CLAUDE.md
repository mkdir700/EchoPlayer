# Style

- 当前项目使用 styled-components 库来定义样式组件，v1 的 style 构建机制已经被废弃
- 优先使用 CSS 变量，而不是使用硬编码的样式值
- 应避免硬编码尺寸和时长，改用 useTheme() 的 token（如 motionDurationMid、borderRadiusSM/MD 等）或集中定义的样式变量，以保证跨主题一致性和后续维护的便捷
- CSS 样式文件位于 /Users/mark/MyProjects/echolab/src/renderer/src/assets/styles 目录
- assets/styles 目录下的 SCSS（含 ant.scss）均为全局引入，会全局生效。
- 项目优先使用 styled-components 而非全局 SCSS 来定制 antd 组件样式，应该用 styled(Component) 包装而不是全局 classNames，保持架构一致性和避免样式污染
- 项目约定：所有图标统一使用 lucide-react，而不是 emoji。
- 在布局实现上，后续优先使用 flex 布局（尽量避免使用 grid 作为默认方案）。
- 项目优先使用 antd 组件库，如果组件可以被 antd 复用则优先使用 antd 而不是自定义开发

## 主题变量使用最佳实践

项目启用了 Ant Design 的 CSS 变量模式 (`cssVar: true`)，在 styled-components 中应采用分类使用策略：

### 使用 CSS 变量的场景（主题相关属性）：

- 颜色系统：`var(--ant-color-bg-elevated, fallback)`
- 阴影效果：`var(--ant-box-shadow-secondary, fallback)`
- 主题切换时会发生变化的属性

### 使用 JS 变量的场景（设计系统常量）：

- 尺寸间距：`${SPACING.XS}px`、`${BORDER_RADIUS.SM}px`
- 动画配置：`${ANIMATION_DURATION.SLOW}`、`${EASING.APPLE}`
- 层级关系：`${Z_INDEX.MODAL}`
- 字体配置：`${FONT_SIZES.SM}px`、`${FONT_WEIGHTS.MEDIUM}`
- 毛玻璃效果：`${GLASS_EFFECT.BACKGROUND_ALPHA.LIGHT}`

### 推荐模式：

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

这种混合模式既保持了类型安全和构建时优化，又支持主题的运行时切换，是当前架构下的最佳实践。

# State Management

- 项目使用 Zustand 作为状态管理库，配合 Immer 中间件支持不可变状态更新，使用自定义的中间件栈包含持久化、DevTools 和订阅选择器功能
- 状态管理架构分为三层：stores（具体状态存储）、infrastructure（基础设施和中间件）、persistence（持久化管理），主要有 settings、shortcuts、runtime 三个核心 store
- 使用 MiddlewarePresets 提供预设配置：basic（基础）、persistent（持久化）、full（完整）、temporary（临时），支持状态迁移和选择性持久化
- 项目规则：Zustand 必须使用 selector（useStore(selector)）在组件/Hook 顶层调用，禁止在 useMemo/useEffect 等内部调用 store Hook，避免 Hooks 顺序问题；player 页面已按该规则修复。
- Player 页面修复方案：统一使用 Zustand selector 顶层调用并禁止在 useMemo/useEffect 中调用 store Hook，且为 useSubtitleEngine 增加 subtitles 入参防御处理；已在 SubtitleOverlay、SubtitleListPanel、usePlayerControls、useVideoEvents、VideoSurface、useSubtitleSync 中落地。
- Zustand 使用规范：避免在组件中使用返回对象的 useStore 选择器（如 useStore(s => ({ action1: s.action1, action2: s.action2 }))），因为每次 store 更新都会返回新对象引用导致组件重渲染，在有 useEffect 写入 store 的场景下会形成渲染-写入循环，触发 Maximum update depth exceeded；应使用单字段选择器（如 const action1 = useStore(s => s.action1)）或配合 shallow 比较器来避免此问题。
- 新增团队规范：React「副作用与状态更新」开发规范（防止无限更新），涵盖基本原则（渲染纯函数、Effect 三分法、幂等更新、稳定引用、严格清理、禁止写回自身依赖、Provider 值 memo、外部状态 selector 稳定）、常用模板（订阅/定时器/Fetch/props→state/Zustand/Context）、PR 检查清单、常见反模式、StrictMode 心智、工具配置建议、针对时钟/播放器补充与最小验收标准；默认 TS + React 18。

# Test

- 使用 vitest 作为测试框架
- **重要**：全局测试配置文件 `tests/setup.ts` 中 mock 了 `node:fs` 和 `node:fs/promises` 模块，这会影响需要真实文件系统操作的测试
- 对于需要真实文件系统操作的测试（如文件清理、文件读写等），必须在测试文件开头使用 `vi.unmock('node:fs')` 和 `vi.unmock('node:fs/promises')` 来取消全局 mock
- 示例：

  ```typescript
  // 在测试文件开头
  vi.unmock('node:fs')
  vi.unmock('node:fs/promises')

  // 然后导入真实的 fs
  import * as fs from 'fs'
  ```

# Package Management

- 项目使用 pnpm 作为包管理器

# Logging

- 项目统一使用 loggerService 记录日志而不是 console；示例：const logger = loggerService.withContext('<ComponentName>')

# Deprecated Code

- v1-deprecated 目录中的所有内容都是废弃的，只能用于学习业务逻辑，不能使用其中的任何组件和代码

# Important

- 不要执行任何杀掉进程和启动程序的命令，这些操作始终应该由用户来做，AI只负责提醒用户
- 始终使用中文回复我
- 任何组件或页面都不要支持写入currentTime,关于播放器的控制应该全权由编排器来控制
- 包管理器工具请使用 pnpm
- logger 的使用例子: `logger.error('Error in MediaClock listener:', { error: error })`, 第二参数必须接收为 `{}`

## Resource Management & Cleanup

- **临时文件清理规范**：所有生成临时文件的服务都应实现集中清理机制，参考 `FFmpegDownloadService.cleanupTempFiles()` 和 `SubtitleExtractorService.cleanupTempFiles()` 的实现模式
- 临时文件清理的最佳实践：
  1. 在服务中实现 `cleanupTempFiles()` 方法，扫描并删除符合特定模式的临时文件
  2. 在 `src/main/index.ts` 的 `app.on('will-quit')` 事件中调用清理方法
  3. 通过 IPC 通道暴露清理接口，允许渲染进程手动触发清理（如 `SubtitleExtractor_CleanupTemp`）
  4. 使用正则表达式精确匹配临时文件模式，避免误删其他文件
  5. 包含完整的错误处理和日志记录，跳过正在使用或无法删除的文件
- 临时文件命名规范：使用 `<prefix>_<timestamp>_<random>.<ext>` 格式（如 `subtitle_1234567890_abc123.srt`），便于模式匹配和清理

## File System Operations

- **禁止使用同步文件操作**：在主进程中必须使用异步文件 API（`fs.promises.*`），避免阻塞事件循环导致应用冻结
- 文件操作最佳实践：
  - ❌ 错误示例：`fs.readdirSync()`, `fs.unlinkSync()`, `fs.readFileSync()`
  - ✅ 正确示例：`await fs.promises.readdir()`, `await fs.promises.unlink()`, `await fs.promises.readFile()`
  - 批量文件操作使用 `Promise.all()` 并行执行，提升性能
  - 所有文件操作方法应声明为 `async` 并返回 `Promise`

## Issues & Solutions

1. DictionaryPopover 组件主题兼容性问题已修复：将硬编码的深色主题颜色（白色文字、深色背景）替换为 Ant Design CSS 变量（如 `var(--ant-color-text)`、`var(--ant-color-bg-elevated)`），实现浅色和深色主题的自动适配，包括文字颜色、背景色、边框、滚动条和交互状态的完整主题化。

2. SubtitleExtractorService 临时文件清理机制已实现：在应用退出时自动清理系统临时目录中的字幕临时文件，防止磁盘空间浪费；支持通过 IPC 通道手动触发清理。

## Task Master AI Instructions

**Import Task Master's development workflow commands and guidelines, treat as if import is in the main CLAUDE.md file.**
@./.taskmaster/CLAUDE.md
