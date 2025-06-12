# 版本管理和发布指南 / Version Management & Release Guide

这个文档介绍了 EchoLab 项目的版本管理和自动化发布流程，帮助你避免忘记更新版本号的问题。

## 🚀 快速开始 / Quick Start

### 自动化发布（推荐）

```bash
# 一键自动化发布，包含版本选择、构建、发布等全流程
npm run release:auto
```

### 发布前检查

```bash
# 检查当前项目状态，获取版本更新建议
npm run release:check
```

## 📦 版本管理命令 / Version Management Commands

### 查看当前版本

```bash
npm run version:current
```

### 版本递增

```bash
# 补丁版本 (0.2.0 -> 0.2.1) - 用于 bug 修复
npm run version:patch

# 次版本 (0.2.0 -> 0.3.0) - 用于新功能
npm run version:minor

# 主版本 (0.2.0 -> 1.0.0) - 用于破坏性更改
npm run version:major
```

### 预发布版本

```bash
# 预发布递增 (0.2.0-alpha.2 -> 0.2.0-alpha.3)
npm run version:prerelease

# 创建 beta 版本 (0.2.0 -> 0.3.0-beta.1)
npm run version:beta

# beta 补丁版本 (0.2.0 -> 0.2.1-beta.1)
npm run version:beta-patch
```

### 手动设置版本

```bash
# 设置具体版本号
npm run version:set -- 1.0.0
npm run version:set -- 1.0.0-beta.1
```

## 🔄 发布流程 / Release Process

### 方法一：自动化发布（推荐）

1. **运行自动化发布工具**：

   ```bash
   npm run release:auto
   ```

2. **按提示选择版本类型**：

   - patch: 修复 bug
   - minor: 新功能
   - major: 破坏性更改
   - prerelease: 预发布递增
   - beta: Beta 版本
   - custom: 自定义版本号

3. **确认发布信息**并选择发布渠道

4. **工具会自动**：
   - 更新版本号
   - 运行测试和检查
   - 创建 Git 提交和标签
   - 构建和发布应用
   - 推送到远程仓库

### 方法二：手动发布

1. **检查项目状态**：

   ```bash
   npm run release:check
   ```

2. **根据建议更新版本**：

   ```bash
   npm run version:patch  # 或 minor, major
   ```

3. **运行测试**：

   ```bash
   npm run test:run
   npm run lint
   npm run typecheck
   ```

4. **提交版本更改**：

   ```bash
   git add package.json
   git commit -m "chore: release v1.0.0"
   git tag v1.0.0
   ```

5. **构建和发布**：

   ```bash
   npm run release:draft  # 或其他发布命令
   ```

6. **推送到远程**：
   ```bash
   git push origin main --tags
   ```

## 🔍 发布前检查功能 / Pre-release Check Features

运行 `npm run release:check` 会检查：

- ✅ Git 工作区状态
- ✅ 版本号是否需要更新
- ✅ 基于提交历史的版本类型建议
- ✅ TypeScript 和 Lint 检查
- ✅ 最近的提交记录
- ✅ 发布前清单

## 🛡️ 自动提醒机制 / Automatic Reminder

### Git Pre-push Hook

项目配置了 Git pre-push hook，会在推送前自动运行发布检查：

```bash
# 推送时会自动运行
git push origin main
```

如果检测到版本需要更新，会显示提醒但不会阻止推送。

## 📋 版本类型选择指南 / Version Type Selection Guide

根据你的更改类型选择合适的版本：

| 更改类型   | 版本类型     | 示例                          |
| ---------- | ------------ | ----------------------------- |
| Bug 修复   | `patch`      | 0.2.0 → 0.2.1                 |
| 新功能     | `minor`      | 0.2.0 → 0.3.0                 |
| 破坏性更改 | `major`      | 0.2.0 → 1.0.0                 |
| 预发布测试 | `prerelease` | 0.2.0-alpha.2 → 0.2.0-alpha.3 |
| Beta 测试  | `beta`       | 0.2.0 → 0.3.0-beta.1          |

## 🎯 最佳实践 / Best Practices

1. **始终在发布前运行检查**：

   ```bash
   npm run release:check
   ```

2. **使用自动化发布工具**：

   ```bash
   npm run release:auto
   ```

3. **遵循语义化版本**：

   - 修复 bug → patch
   - 新功能 → minor
   - 破坏性更改 → major

4. **测试后再发布**：

   - 单元测试：`npm run test:run`
   - E2E 测试：`npm run test:e2e`
   - 代码检查：`npm run lint`

5. **使用有意义的提交信息**：
   ```bash
   git commit -m "feat: add new subtitle feature"
   git commit -m "fix: resolve video playback issue"
   git commit -m "chore: release v1.0.0"
   ```

## 🔧 故障排除 / Troubleshooting

### 问题：忘记更新版本号

**解决方案**：使用自动化发布工具或发布前检查

```bash
npm run release:check  # 获取建议
npm run release:auto   # 自动化发布
```

### 问题：Git 工作区不干净

**解决方案**：提交或暂存更改

```bash
git add .
git commit -m "fix: your changes"
# 或
git stash
```

### 问题：构建失败

**解决方案**：修复错误后重新发布

```bash
npm run lint:fix      # 修复 lint 错误
npm run typecheck     # 检查类型错误
npm run test:run      # 运行测试
```

### 问题：发布到错误渠道

**解决方案**：使用正确的发布命令

```bash
npm run release:draft    # 草稿发布（推荐）
npm run release         # 正式发布
npm run release:never   # 仅构建不发布
```

## 📚 相关文档 / Related Documentation

- [版本管理脚本源码](../scripts/version-manager.ts)
- [自动化发布脚本源码](../scripts/release.ts)
- [发布前检查脚本源码](../scripts/pre-release-check.ts)
- [Electron Builder 配置](../electron-builder.yml)

---

使用这个版本管理系统，你再也不会忘记更新版本号了！🎉
