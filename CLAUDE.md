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
