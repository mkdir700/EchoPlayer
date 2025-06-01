# EchoLab 开发指南

## 遮罩模式边框显示状态管理

### 问题描述

在遮罩模式下，定位框的边框显示存在以下问题：

1. 首次计算可能出现 NaN 值
2. 当鼠标移动到字幕区域或控制区域时，遮罩边框消失
3. 当鼠标移出所有区域后，遮罩边框仍然显示

### 解决方案

#### 1. NaN 值防护

在 `useSubtitleState.ts` 的 `calculateDefaultMaskFrame` 函数中添加了完整的参数验证：

- 检查容器尺寸和宽高比的有效性
- 使用 `isFinite()` 确保所有数值都是有限数字
- 提供安全的默认值作为回退

#### 2. 统一的边框状态管理

在 `SubtitleV3.tsx` 中实现了统一的遮罩边框状态管理：

- 新增 `isMaskFrameActive` 状态，控制遮罩边框的显示
- 新增 `isMaskFrameHovering` 状态，跟踪定位框的悬停状态
- 当鼠标进入字幕区域、控制区域或定位框时，激活边框显示
- 当鼠标离开所有相关区域时，隐藏边框

#### 3. 实时状态检测

使用 DOM 查询来获取实时的悬停状态，避免 React 状态更新的延迟问题：

```javascript
const subtitleHovering = containerRef.current?.matches(':hover') || false
const controlsHovering =
  document.querySelector(`.${styles.subtitleControlsExternal}:hover`) !== null
const maskFrameHovering = document.querySelector(`.${styles.maskFrame}:hover`) !== null
```

#### 4. 延时检查机制

使用延时检查避免快速移动鼠标时的状态闪烁：

- 150ms 延时检查遮罩边框状态
- 使用 `maskFrameCheckTimeoutRef` 管理延时器，避免重复触发
- 在组件卸载时清理所有定时器

### 最佳实践

1. **状态管理**：对于复杂的鼠标交互，使用实时的 DOM 查询比依赖 React 状态更可靠
2. **延时检查**：对于用户交互状态，适当的延时可以提供更好的用户体验
3. **资源清理**：始终清理定时器和事件监听器，避免内存泄漏
4. **参数验证**：对于数学计算，始终进行参数验证，防止 NaN 和无效值

### 组件结构

```
SubtitleV3
├── MaskOverlay (遮罩覆盖层)
├── MaskFrame (定位框，支持拖拽和调整大小)
├── SubtitleControlsWrapper (控制按钮)
├── 字幕容器
└── ResizeHandle (调整大小控制点)
```

### 相关文件

- `src/renderer/src/hooks/useSubtitleState.ts` - 字幕状态管理
- `src/renderer/src/components/VideoPlayer/SubtitleV3.tsx` - 主要字幕组件
- `src/renderer/src/components/VideoPlayer/MaskFrame.tsx` - 遮罩定位框组件
- `src/renderer/src/components/VideoPlayer/Subtitle.module.css` - 样式文件
