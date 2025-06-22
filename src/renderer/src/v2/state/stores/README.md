# V2 状态存储系统 / V2 State Store System

本目录包含 EchoLab V2 架构的状态管理存储，基于 Zustand + Immer 构建的类型安全状态管理系统。

## 架构概述 / Architecture Overview

### 技术栈

- **Zustand**: 轻量级状态管理库
- **Immer**: 不可变状态更新
- **TypeScript**: 完整类型安全
- **持久化**: 选择性本地存储

### 设计原则

- **类型安全**: 所有状态和操作都有完整的 TypeScript 类型定义
- **不可变性**: 使用 Immer 确保状态不可变更新
- **模块化**: 每个功能域独立的 store
- **性能优化**: 细粒度的状态订阅和更新
- **持久化策略**: 智能的状态持久化，只保存必要数据

## Store 列表 / Store List

### 🎬 Video Store (`video.store.ts`)

管理视频相关状态，包括当前视频信息、播放控制、加载状态等。

**主要功能:**

- 视频文件加载和元数据管理
- 播放状态控制（播放/暂停、时间、音量等）
- 最近播放历史记录
- 视频设置缓存（播放设置、UI配置）
- 加载状态和错误处理

**使用示例:**

```typescript
import { useVideoStore } from './stores/video.store'

function VideoPlayer() {
  const {
    currentVideo,
    isPlaying,
    loadVideo,
    setIsPlaying
  } = useVideoStore()

  const handleLoadVideo = async () => {
    await loadVideo('/path/to/video.mp4')
  }

  return (
    <div>
      {currentVideo && (
        <video
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />
      )}
    </div>
  )
}
```

### 📝 Subtitle Store (`subtitle.store.ts`)

管理字幕相关状态，包括字幕数据、导航、显示配置等。

**主要功能:**

- 字幕文件加载和解析
- 字幕导航（当前索引、历史记录）
- 显示配置（字体、颜色、大小等）
- 字幕搜索和过滤
- 字幕缓存管理

**使用示例:**

```typescript
import { useSubtitleStore } from './stores/subtitle.store'

function SubtitlePanel() {
  const {
    subtitles,
    currentIndex,
    searchQuery,
    loadSubtitles,
    setCurrentIndex,
    searchSubtitles
  } = useSubtitleStore()

  const currentSubtitle = subtitles[currentIndex]

  return (
    <div>
      <input
        value={searchQuery}
        onChange={(e) => searchSubtitles(e.target.value)}
        placeholder="搜索字幕..."
      />
      {currentSubtitle && (
        <div>
          <p>{currentSubtitle.originalText}</p>
          <p>{currentSubtitle.translatedText}</p>
        </div>
      )}
    </div>
  )
}
```

### 🎨 UI Store (`ui.store.ts`)

管理界面相关状态，包括主题、布局、全屏、侧边栏等。

**主要功能:**

- 主题模式管理（明亮/暗黑/系统）
- 布局模式和尺寸管理
- 全屏状态控制
- 侧边栏和控制栏状态
- 模态框和通知管理
- 响应式断点检测

**使用示例:**

```typescript
import { useUIStore } from './stores/ui.store'

function ThemeToggle() {
  const {
    themeMode,
    isDarkMode,
    setThemeMode,
    toggleDarkMode
  } = useUIStore()

  return (
    <div>
      <button onClick={toggleDarkMode}>
        {isDarkMode ? '🌙' : '☀️'} 切换主题
      </button>
      <select
        value={themeMode}
        onChange={(e) => setThemeMode(e.target.value)}
      >
        <option value="light">明亮</option>
        <option value="dark">暗黑</option>
        <option value="system">跟随系统</option>
      </select>
    </div>
  )
}
```

### ⏯️ Playback Store (`playback.store.ts`)

管理播放控制相关状态，包括播放模式、速度、循环等。

**主要功能:**

- 播放模式控制（句子模式、连续播放等）
- 播放速度和音量控制
- 循环和重复设置
- 快捷键配置
- 播放历史和统计

## 使用指南 / Usage Guide

### 1. 基本使用模式

```typescript
// 导入 store hook
import { useVideoStore } from './stores/video.store'

function MyComponent() {
  // 订阅整个 store
  const store = useVideoStore()

  // 或者选择性订阅特定状态
  const currentVideo = useVideoStore(state => state.currentVideo)
  const isPlaying = useVideoStore(state => state.isPlaying)

  // 调用操作方法
  const loadVideo = useVideoStore(state => state.loadVideo)

  return <div>...</div>
}
```

### 2. 类型安全的状态更新

```typescript
// ✅ 正确：使用 store 提供的操作方法
const { setCurrentTime, setVolume } = useVideoStore()
setCurrentTime(120) // 类型安全
setVolume(0.8) // 类型安全

// ❌ 错误：直接修改状态（只读）
// store.currentVideo.currentTime = 120 // TypeScript 错误
```

### 3. 异步操作

```typescript
function VideoLoader() {
  const { loadVideo, loadingState } = useVideoStore()

  const handleLoad = async () => {
    try {
      await loadVideo('/path/to/video.mp4')
      console.log('视频加载成功')
    } catch (error) {
      console.error('视频加载失败:', error)
    }
  }

  return (
    <div>
      {loadingState.isLoading && <div>加载中...</div>}
      <button onClick={handleLoad}>加载视频</button>
    </div>
  )
}
```

### 4. 状态持久化

```typescript
// stores 会自动处理持久化
// 用户偏好设置会自动保存到 localStorage
// 临时状态（如加载状态）不会被持久化

const {
  displayConfig, // ✅ 会被持久化
  loadingState, // ❌ 不会被持久化
  recentPlays // ✅ 会被持久化
} = useSubtitleStore()
```

## 最佳实践 / Best Practices

### 1. 状态订阅优化

```typescript
// ✅ 好：只订阅需要的状态
const isPlaying = useVideoStore((state) => state.isPlaying)

// ❌ 差：订阅整个 store 导致不必要的重渲染
const store = useVideoStore()
```

### 2. 条件性操作

```typescript
function VideoControls() {
  const { currentVideo, setIsPlaying } = useVideoStore()

  const handlePlay = () => {
    // ✅ 检查状态后再操作
    if (currentVideo) {
      setIsPlaying(true)
    }
  }

  return <button onClick={handlePlay}>播放</button>
}
```

### 3. 错误处理

```typescript
function SubtitleLoader() {
  const { loadSubtitles, loadingState } = useSubtitleStore()

  const handleLoad = async () => {
    try {
      await loadSubtitles('/path/to/subtitle.srt')
    } catch (error) {
      // ✅ 适当的错误处理
      console.error('字幕加载失败:', error)
      // 显示用户友好的错误消息
    }
  }

  return (
    <div>
      {loadingState.error && (
        <div className="error">
          错误: {loadingState.error}
        </div>
      )}
    </div>
  )
}
```

### 4. 类型安全验证

```typescript
// 每个 store 都提供 validateState 方法
function useStoreValidation() {
  const validateVideo = useVideoStore((state) => state.validateState)
  const validateUI = useUIStore((state) => state.validateState)

  const validateAll = () => {
    const videoResult = validateVideo()
    const uiResult = validateUI()

    if (!videoResult.isValid) {
      console.error('Video store 状态无效:', videoResult.errors)
    }

    if (!uiResult.isValid) {
      console.error('UI store 状态无效:', uiResult.errors)
    }
  }

  return { validateAll }
}
```

## 调试和开发 / Debugging & Development

### 1. 状态调试

```typescript
// 开发环境下会自动记录状态变更
// 查看浏览器控制台中的 StateDebug 日志

// 手动触发状态验证
const { validateState } = useVideoStore()
const result = validateState()
console.log('状态验证结果:', result)
```

### 2. 重置状态

```typescript
// 每个 store 都提供重置方法
const { resetToDefaults } = useVideoStore()

// 重置到初始状态
resetToDefaults()
```

### 3. 状态检查工具

```typescript
// 获取当前完整状态
const videoState = useVideoStore.getState()
const uiState = useUIStore.getState()

console.log('当前视频状态:', videoState)
console.log('当前UI状态:', uiState)
```

## 迁移指南 / Migration Guide

### 从 V1 迁移到 V2

```typescript
// V1 (Legacy)
import { useVideoContext } from '../contexts/VideoContext'

// V2 (New)
import { useVideoStore } from './stores/video.store'

// V1 使用方式
const { videoState, updateVideoState } = useVideoContext()

// V2 使用方式
const { currentVideo, setCurrentTime } = useVideoStore()
```

## 性能考虑 / Performance Considerations

1. **细粒度订阅**: 只订阅组件需要的特定状态
2. **memo 优化**: 对于复杂组件使用 `React.memo`
3. **状态规范化**: 避免深层嵌套的状态结构
4. **懒加载**: 状态按需初始化和加载

## 未来规划 / Future Plans

- [ ] 状态时间旅行调试
- [ ] 更细粒度的持久化控制
- [ ] 状态同步和备份
- [ ] 性能监控和分析
- [ ] 自动状态恢复机制

---

有关更多详细信息，请参考各个 store 文件中的内联文档和类型定义。
