# EchoLab 发布指南

本文档详细说明了 EchoLab 项目的版本管理和发布流程。

## 版本类型说明

我们的项目支持以下版本类型：

### 🚧 Dev (开发版)

- **格式**: `1.0.0-dev.1`
- **用途**: 开发过程中的临时构建
- **特点**:
  - 跳过测试和类型检查以加快构建速度
  - 构建产物保留 7 天
  - 发布为草稿状态
  - 上传到 `/test-releases/` 路径

### 🔧 Test (测试版)

- **格式**: `1.0.0-test.1`
- **用途**: 内部测试专用版本
- **特点**:
  - 执行完整的测试和类型检查
  - 构建产物保留 7 天
  - 发布为草稿状态
  - 上传到 `/test-releases/` 路径

### ⚠️ Alpha (内测版)

- **格式**: `1.0.0-alpha.1`
- **用途**: 早期预览版本，功能不完整
- **特点**:
  - 执行完整的测试和类型检查
  - 构建产物保留 7 天
  - 标记为预发布版本
  - 上传到 `/prerelease/` 路径

### 🧪 Beta (公测版)

- **格式**: `1.0.0-beta.1`
- **用途**: 功能基本完整的测试版本
- **特点**:
  - 执行完整的测试和类型检查
  - 构建产物保留 7 天
  - 标记为预发布版本
  - 上传到 `/prerelease/` 路径
  - 支持自动更新

### 🎉 Stable (正式版)

- **格式**: `1.0.0`
- **用途**: 生产环境可用的稳定版本
- **特点**:
  - 执行完整的测试、类型检查和代码检查
  - 构建产物保留 30 天
  - 正式发布版本
  - 上传到 `/releases/` 路径
  - 支持自动更新

## 版本管理

### 使用版本管理脚本

我们提供了便捷的版本管理脚本，可以通过以下方式使用：

```bash
# 查看当前版本信息
pnpm version:current

# 设置特定版本
pnpm version:set 1.0.0-beta.1

# 递增版本号
pnpm version:major        # 1.0.0 -> 2.0.0
pnpm version:minor        # 1.0.0 -> 1.1.0
pnpm version:patch        # 1.0.0 -> 1.0.1

# 创建预发布版本
pnpm version:beta         # 1.0.0 -> 1.1.0-beta.1
pnpm version:beta-patch   # 1.0.0 -> 1.0.1-beta.1

# 递增预发布版本号
pnpm version:prerelease   # 1.0.0-beta.1 -> 1.0.0-beta.2
```

### 手动版本管理

你也可以直接使用版本管理脚本：

```bash
# 查看帮助
tsx scripts/version-manager.ts

# 查看当前版本
tsx scripts/version-manager.ts current

# 设置版本
tsx scripts/version-manager.ts set 1.0.0-beta.1

# 递增版本（支持指定类型）
tsx scripts/version-manager.ts minor beta
tsx scripts/version-manager.ts patch alpha
tsx scripts/version-manager.ts major stable

# 递增预发布版本
tsx scripts/version-manager.ts prerelease
```

## 发布流程

### 自动发布（推荐）

1. **更新版本号**

   ```bash
   # 发布 beta 版本
   pnpm version:beta

   # 或者递增现有 beta 版本
   pnpm version:prerelease
   ```

2. **提交并推送标签**

   ```bash
   git add package.json
   git commit -m "chore: bump version to v1.0.0-beta.1"
   git tag v1.0.0-beta.1
   git push origin main --tags
   ```

3. **GitHub Actions 自动构建和发布**
   - 推送标签后，GitHub Actions 会自动触发构建
   - 系统会自动检测版本类型并应用相应的构建策略
   - 构建完成后会自动上传到腾讯云 COS 并创建 GitHub Release

### 手动触发发布

你也可以在 GitHub Actions 页面手动触发发布：

1. 访问项目的 Actions 页面
2. 选择 "Build and Release" workflow
3. 点击 "Run workflow"
4. 填写参数：
   - **version**: 版本号（可选，留空则使用 package.json 中的版本）
   - **force_version_type**: 强制指定版本类型（可选）
   - **skip_tests**: 是否跳过测试（仅用于快速构建）

## 发布路径说明

不同版本类型的文件会上传到不同的路径：

- **Dev/Test**: `/test-releases/{version}/`
- **Alpha/Beta**: `/prerelease/{version}/`
- **Stable**: `/releases/{version}/`

自动更新配置文件路径：

- **Dev/Test**: `/test-autoupdate/`
- **Alpha/Beta**: `/prerelease-autoupdate/`
- **Stable**: `/autoupdate/`

## 最佳实践

### Beta 版本发布流程

1. **开发完成后创建 beta 版本**

   ```bash
   pnpm version:beta
   ```

2. **提交并推送**

   ```bash
   git add package.json
   git commit -m "chore: release v1.0.0-beta.1"
   git tag v1.0.0-beta.1
   git push origin main --tags
   ```

3. **测试 beta 版本**

   - 等待自动构建完成
   - 下载并测试 beta 版本
   - 收集用户反馈

4. **修复问题并发布新的 beta 版本**

   ```bash
   # 修复问题后
   pnpm version:prerelease  # v1.0.0-beta.1 -> v1.0.0-beta.2
   git add package.json
   git commit -m "chore: release v1.0.0-beta.2"
   git tag v1.0.0-beta.2
   git push origin main --tags
   ```

5. **发布正式版本**
   ```bash
   # beta 测试完成后
   pnpm version:set 1.0.0  # 移除 beta 标识
   git add package.json
   git commit -m "chore: release v1.0.0"
   git tag v1.0.0
   git push origin main --tags
   ```

### 版本号规范

- **主版本号 (Major)**: 不兼容的 API 修改
- **次版本号 (Minor)**: 向下兼容的功能性新增
- **修订号 (Patch)**: 向下兼容的问题修正
- **预发布标识**: `alpha.1`, `beta.1`, `dev.1`, `test.1`

### 注意事项

1. **标签格式**: 必须以 `v` 开头，如 `v1.0.0-beta.1`
2. **版本一致性**: 确保 package.json 中的版本与 Git 标签一致
3. **测试覆盖**: 正式版本发布前必须通过完整的测试流程
4. **文档更新**: 重要版本发布时记得更新相关文档

## 故障排除

### 构建失败

1. 检查版本号格式是否正确
2. 确认所有测试都能通过
3. 检查 GitHub Actions 日志中的具体错误信息

### 上传失败

1. 检查腾讯云 COS 配置是否正确
2. 确认 GitHub Secrets 中的密钥是否有效
3. 检查网络连接和权限设置

### 版本检测错误

1. 确认 package.json 中的版本格式正确
2. 检查是否有特殊字符或格式问题
3. 使用版本管理脚本进行标准化处理
