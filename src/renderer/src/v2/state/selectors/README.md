# V2 状态选择器使用指南 / V2 State Selectors Usage Guide

## 概述 / Overview

V2 状态管理系统采用了 Zustand 官方推荐的自动生成选择器模式，结合计算属性选择器，提供高性能的状态访问。

The V2 state management system uses Zustand's officially recommended auto-generated selector pattern, combined with computed property selectors, to provide high-performance state access.

## 架构设计 / Architecture Design

### 三层选择器架构 / Three-Layer Selector Architecture

1. **自动生成选择器** / Auto-Generated Selectors

   - 通过 `createSelectors()` 自动为每个状态属性生成选择器
   - 格式：`store.use.propertyName()`
   - 用于访问基础状态属性

2. **计算属性选择器** / Computed Property Selectors

   - 手动定义的复杂计算逻辑
   - 使用 `createSelector()` 进行性能优化
   - 用于复杂的状态计算和组合

3. **便捷 Hook 选择器** / Convenient Hook Selectors
   - 将选择器包装成易用的 React Hook
   - 提供语义化的 API
   - 统一的使用体验

## 使用方式 / Usage Patterns

### 1. 基础属性访问 / Basic Property Access

```typescript
// ✅ 推荐：使用自动生成的选择器
const subtitles = subtitleStore.use.subtitles()
const navigation = subtitleStore.use.navigation()
const displayConfig = subtitleStore.use.displayConfig()

// ✅ 推荐：访问嵌套属性
const currentIndex = subtitleStore((state) => state.navigation.currentIndex)
const displayMode = subtitleStore((state) => state.displayConfig.mode)
const isLoading = subtitleStore((state) => state.loadingState.isLoading)
```

### 2. 复杂计算 / Complex Computations

```typescript
// ✅ 推荐：使用计算属性选择器
const currentSubtitle = subtitleStore(subtitleSelectors.currentSubtitle)
const visibleSubtitles = subtitleStore(subtitleSelectors.visibleSubtitles)
const navigationInfo = subtitleStore(subtitleSelectors.subtitleNavigationInfo)

// ✅ 推荐：使用便捷 Hook
const currentSubtitle = useCurrentSubtitle()
const hasNextSubtitle = useHasNextSubtitle()
const subtitleCount = useSubtitleCount()
```

### 3. 参数化选择器 / Parameterized Selectors

```typescript
// ✅ 推荐：时间相关查询
const subtitleAtTime = useSubtitleAtTime(120.5)
const subtitleIndex = useSubtitleIndexAtTime(120.5)

// ✅ 推荐：缓存查询
const cachedSubtitles = useCachedSubtitles('/path/to/subtitle.srt')
const hasCached = useHasCachedSubtitles('/path/to/subtitle.srt')
```

## 性能优化 / Performance Optimization

### 1. Memoization

所有计算属性选择器都使用 `createSelector()` 进行 memoization：

```typescript
// ✅ 已优化：自动缓存计算结果
export const subtitleSelectors = {
  hasSubtitles: createSelector((state: SubtitleState) => state.subtitles.length > 0),

  visibleSubtitles: createSelector((state: SubtitleState) => {
    // 复杂计算逻辑，结果会被缓存
    // Complex computation logic, results will be cached
  })
}
```

### 2. 精确订阅 / Precise Subscriptions

```typescript
// ✅ 推荐：精确订阅特定属性
const currentIndex = subtitleStore((state) => state.navigation.currentIndex)

// ❌ 避免：订阅整个对象
const navigation = subtitleStore((state) => state.navigation)
const currentIndex = navigation.currentIndex // 会导致不必要的重渲染
```

## 最佳实践 / Best Practices

### 1. 选择器选择指南 / Selector Selection Guide

| 场景 / Scenario | 推荐方式 / Recommended                    |
| --------------- | ----------------------------------------- |
| 基础属性访问    | `store.use.property()`                    |
| 嵌套属性访问    | `store((state) => state.nested.property)` |
| 复杂计算        | `store(selectors.computedProperty)`       |
| 组件中使用      | `useXxxHook()`                            |
| 参数化查询      | `useXxxWithParam(param)`                  |

### 2. 命名约定 / Naming Conventions

```typescript
// ✅ 推荐的命名模式
export const subtitleSelectors = {
  // 布尔值：has/is/can 前缀
  hasSubtitles: createSelector(...),
  isLoading: createSelector(...),
  canNavigate: createSelector(...),

  // 计算值：描述性名词
  currentSubtitle: createSelector(...),
  visibleSubtitles: createSelector(...),

  // 组合信息：Info 后缀
  navigationInfo: createSelector(...),
  fileInfo: createSelector(...),

  // 参数化：get 前缀
  getSubtitleAtTime: (time) => (state) => ...,
  getCachedSubtitles: (path) => (state) => ...
}

// Hook 命名：use 前缀 + 描述性名称
export const useCurrentSubtitle = () => ...
export const useHasNextSubtitle = () => ...
export const useSubtitleAtTime = (time: number) => ...
```

### 3. 避免的反模式 / Anti-Patterns to Avoid

```typescript
// ❌ 避免：重复定义基础选择器
export const subtitleSelectors = {
  subtitles: (state) => state.subtitles, // 不需要，使用 store.use.subtitles()
  navigation: (state) => state.navigation // 不需要，使用 store.use.navigation()
}

// ❌ 避免：在选择器中直接调用其他选择器
export const badSelector = createSelector((state) => {
  const current = subtitleSelectors.currentSubtitle(state) // 可能导致循环依赖
  return current?.text
})

// ✅ 推荐：使用状态计算
export const goodSelector = createSelector((state) => {
  const { subtitles, navigation } = state
  const current = subtitles[navigation.currentIndex]
  return current?.text
})
```

## 迁移指南 / Migration Guide

### 从旧版本迁移 / Migrating from Old Version

```typescript
// 旧版本 / Old Version
const subtitles = useSubtitleStore((state) => state.subtitles)
const currentIndex = useSubtitleStore((state) => state.navigation.currentIndex)

// 新版本 / New Version
const subtitles = subtitleStore.use.subtitles()
const currentIndex = subtitleStore((state) => state.navigation.currentIndex)

// 或使用便捷 Hook / Or use convenient hooks
const subtitles = useSubtitles()
const currentIndex = useCurrentSubtitleIndex()
```

## 调试技巧 / Debugging Tips

### 1. 选择器性能监控 / Selector Performance Monitoring

```typescript
// 在开发环境中监控选择器调用
if (process.env.NODE_ENV === 'development') {
  const originalSelector = subtitleSelectors.visibleSubtitles
  subtitleSelectors.visibleSubtitles = createSelector((state) => {
    console.time('visibleSubtitles')
    const result = originalSelector(state)
    console.timeEnd('visibleSubtitles')
    return result
  })
}
```

### 2. 状态变化追踪 / State Change Tracking

```typescript
// 使用 Zustand 的 subscribeWithSelector 中间件
const unsubscribe = subtitleStore.subscribe(
  (state) => state.navigation.currentIndex,
  (currentIndex, previousIndex) => {
    console.log('Current index changed:', { previousIndex, currentIndex })
  }
)
```

## 总结 / Summary

简化后的选择器架构具有以下优势：

1. **减少重复代码** - 移除了不必要的基础选择器
2. **提升性能** - 使用 memoization 优化计算选择器
3. **清晰的使用模式** - 明确的三层架构和使用指南
4. **更好的开发体验** - 自动生成 + 便捷 Hook 的组合
5. **类型安全** - 完整的 TypeScript 支持

The simplified selector architecture provides the following advantages:

1. **Reduced code duplication** - Removed unnecessary basic selectors
2. **Improved performance** - Used memoization to optimize computed selectors
3. **Clear usage patterns** - Well-defined three-layer architecture and usage guide
4. **Better developer experience** - Combination of auto-generation + convenient hooks
5. **Type safety** - Complete TypeScript support
