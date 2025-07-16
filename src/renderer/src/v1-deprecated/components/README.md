# 组件结构说明

## 重构后的组件层次结构

### 主应用组件

- `App.tsx` - 主应用组件，负责状态管理和组件协调

### 布局组件

- `AppHeader.tsx` - 应用头部组件
- `VideoSection.tsx` - 视频播放区域组件
- `SidebarSection.tsx` - 右侧边栏组件

### 视频相关组件

- `VideoPlaceholder.tsx` - 视频占位符组件
- `LoadingIndicator.tsx` - 加载状态指示器
- `ErrorIndicator.tsx` - 错误状态指示器
- `VideoControls.tsx` - 视频控制器组件

### 字幕相关组件

- `SubtitleListContent.tsx` - 字幕列表内容组件
- `SubtitleListItem.tsx` - 字幕列表项组件

## 重构收益

1. **代码可维护性提升**

   - 主App组件从514行减少到约120行
   - 每个组件职责单一，便于理解和维护

2. **组件复用性**

   - 独立的组件可在其他地方复用
   - 组件间依赖清晰，便于测试

3. **类型安全**

   - 使用共享类型定义避免重复
   - 明确的接口定义提高类型安全性

4. **开发效率**
   - 组件结构清晰，便于团队协作
   - 修改某个功能时只需关注相关组件

## 文件大小对比

- **重构前**: `App.tsx` 514行
- **重构后**:
  - `App.tsx` ~120行
  - `VideoSection.tsx` ~118行
  - `VideoControls.tsx` ~149行
  - `SubtitleListContent.tsx` ~134行
  - 其他小组件 20-40行

总体代码量虽然略有增加，但结构更加清晰，维护成本大幅降低。
