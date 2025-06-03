# EchoLab E2E 测试指南

## 🎯 MVP 阶段的 E2E 测试策略

在 MVP 阶段，我们专注于验证核心用户流程，确保主要功能可以正常工作。

## 📋 测试覆盖范围

### 🔥 核心流程（优先级：高）

- [x] 应用启动和界面加载
- [x] 视频文件加载流程
- [x] 字幕文件加载和显示
- [x] 逐句播放功能
- [x] 键盘快捷键操作

### 📊 辅助功能（优先级：中）

- [x] 学习进度跟踪
- [x] 设置和偏好配置
- [x] 应用稳定性和错误处理

### 🔍 烟雾测试（快速验证）

- [x] 应用能正常启动
- [x] 主要 UI 组件显示
- [x] 基础交互响应

## 🚀 快速开始

### 1. 安装依赖

```bash
pnpm install
```

### 2. 构建应用

```bash
pnpm build
```

### 3. 运行 E2E 测试

```bash
# 运行所有 E2E 测试
pnpm test:e2e

# 运行带 UI 的测试
pnpm test:e2e:ui

# 调试模式运行
pnpm test:e2e:debug

# 只运行烟雾测试
pnpm test:e2e smoke-test
```

#### Linux 环境设置

在 Linux 环境中运行 E2E 测试需要虚拟显示器：

```bash
# 安装 xvfb（如果未安装）
sudo apt-get install -y xvfb

# 启动虚拟显示器
export DISPLAY=:99
Xvfb :99 -screen 0 1024x768x24 > /dev/null 2>&1 &

# 然后运行测试
pnpm test:e2e
```

### 4. 查看测试报告

```bash
pnpm test:e2e:report
```

## 📁 文件结构

```
e2e/
├── utils/
│   └── electron-helper.ts     # Electron 测试辅助工具
├── core-workflow.e2e.ts      # 核心功能完整测试
├── smoke-test.e2e.ts         # 烟雾测试（快速验证）
├── global-setup.ts           # 全局设置（启动应用）
└── global-teardown.ts        # 全局清理（关闭应用）
```

## 🛠️ 测试编写指南

### MVP 阶段的测试原则

1. **优先覆盖核心流程**：用户最常用的功能
2. **使用模拟数据**：避免依赖外部文件
3. **容错性强**：UI 元素找不到时优雅降级
4. **快速反馈**：测试应该在 2-3 分钟内完成

### 编写新测试

```typescript
import { test, expect } from '@playwright/test'
import { ElectronHelper } from './utils/electron-helper'

test.describe('My Feature', () => {
  let electronApp: ElectronHelper

  test.beforeEach(async () => {
    electronApp = await ElectronHelper.connect()
    await electronApp.waitForAppReady()
  })

  test('should do something', async () => {
    const page = electronApp.getPage()

    // 你的测试逻辑
    await expect(page.locator('[data-testid="my-element"]')).toBeVisible()
  })
})
```

### 添加 data-testid

在组件中添加测试标识符：

```tsx
// 好的做法
<button data-testid="load-video-button">加载视频</button>
<div data-testid="video-player">...</div>
<ul data-testid="subtitle-list">...</ul>
```

## 🚨 故障排除

### 常见问题

1. **应用启动失败**

   - 确保已构建应用：`pnpm build`
   - 检查端口 9222 是否被占用

2. **测试超时**

   - 增加等待时间
   - 检查元素选择器是否正确

3. **CI 环境失败**
   - 确保安装了必要的依赖
   - 使用虚拟显示器（GitHub Actions 已配置）
   - Linux 环境需要设置 DISPLAY 环境变量

### 调试技巧

```bash
# 打开调试模式
pnpm test:e2e:debug

# 查看详细日志
DEBUG=pw:api pnpm test:e2e
```

## 📈 MVP 后的扩展

随着产品成熟，可以考虑：

1. **增加视觉回归测试**
2. **性能测试集成**
3. **真实文件测试**
4. **多语言界面测试**
5. **无障碍功能测试**

## 🤝 贡献指南

1. 新增测试前先运行烟雾测试确保环境正常
2. 保持测试的独立性，不依赖其他测试的状态
3. 添加有意义的断言和错误消息
4. 为复杂测试添加注释说明
