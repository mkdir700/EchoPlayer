# EchoLab 构建和发布策略

## 🏗️ 构建流程概览

我们设计了灵活的构建和发布系统，支持不同场景的需求：

### 构建类型

1. **开发测试构建** (`build-test.yml`)

   - 用于日常开发验证
   - 支持选择性平台构建
   - 可手动触发或自动触发

2. **正式发布构建** (`build-and-release.yml`)

   - 用于正式版本发布
   - 构建所有平台
   - 创建 GitHub Release

3. **代码质量检查** (`test.yml`)
   - PR 和推送时自动运行
   - 多平台多版本测试
   - 代码质量保证

## 📋 使用场景

### 场景一：日常开发测试

**何时使用：**

- 开发新功能后想验证构建
- 测试特定平台的兼容性
- 在合并 PR 前验证

**触发方式：**

1. **手动触发**（推荐）

   - 进入 GitHub Actions 页面
   - 选择 "Build Test" workflow
   - 点击 "Run workflow"
   - 选择要构建的平台：
     - `all` - 构建所有平台
     - `win` - 仅 Windows
     - `mac` - 仅 macOS
     - `linux` - 仅 Linux
     - `win,mac` - Windows 和 macOS
   - 选择是否创建下载文件

2. **自动触发**
   - 推送到 `main` 或 `develop` 分支
   - 自动构建所有平台
   - 创建临时下载文件（保留3天）

**输出结果：**

- 构建成功/失败状态
- 可下载的测试安装包
- 构建日志和错误信息

### 场景二：正式版本发布

**何时使用：**

- 准备发布新版本
- 需要创建 GitHub Release
- 分发给用户使用

**发布流程：**

```bash
# 方法一：使用便捷脚本（推荐）
pnpm release        # 完整流程：准备 + 发布
# 或者分步骤
pnpm release:prepare  # 仅准备（测试、版本号、构建）
pnpm release:publish  # 仅发布（推送标签）

# 方法二：手动操作
./scripts/prepare-release.sh patch  # patch/minor/major
./scripts/publish-release.sh

# 方法三：完全手动
npm version patch --no-git-tag-version
git add . && git commit -m "chore: bump version to vX.X.X"
git tag vX.X.X
git push origin main --tags
```

**发布检查清单：**

- ✅ 所有测试通过
- ✅ 类型检查通过
- ✅ 代码规范检查通过
- ✅ 版本号更新
- ✅ 构建成功
- ✅ Git 标签创建
- ✅ 推送到远程仓库

## 🔧 配置详解

### 构建平台配置

```yaml
# Windows
- os: windows-latest
  platform: win
  output: echolab-X.X.X-setup.exe

# macOS
- os: macos-latest
  platform: mac
  output: echolab-X.X.X.dmg

# Linux
- os: ubuntu-latest
  platform: linux
  outputs:
    - echolab-X.X.X.AppImage
    - echolab-X.X.X.deb
    - echolab-X.X.X.snap
```

### 触发条件

```yaml
# 测试构建
on:
  workflow_dispatch:     # 手动触发
  push:
    branches: [main, develop]  # 推送触发

# 正式发布
on:
  push:
    tags: ['v*']         # 标签推送触发
  workflow_dispatch:     # 手动触发
```

## 🚀 快速开始

### 1. 开发过程中测试构建

```bash
# 推送代码到 main/develop 分支
git push origin main

# 或者手动触发（GitHub Actions 页面）
# 选择需要的平台进行构建
```

### 2. 发布新版本

```bash
# 一键发布（推荐）
pnpm release

# 会自动执行：
# 1. 运行测试
# 2. 类型检查
# 3. 代码检查
# 4. 更新版本号
# 5. 构建项目
# 6. 提交和推送
# 7. 创建标签
# 8. 触发 GitHub Actions
```

### 3. 监控构建状态

- GitHub Actions 页面查看构建进度
- 构建完成后检查 Releases 页面
- 下载和测试生成的安装包

## 📊 构建产物

### 文件结构

```
dist/
├── echolab-0.1.0-setup.exe           # Windows 安装程序
├── echolab-0.1.0.dmg                 # macOS 磁盘镜像
├── echolab-0.1.0.AppImage            # Linux AppImage
├── echolab-0.1.0.deb                 # Debian 包
├── echolab-0.1.0.snap                # Snap 包
├── latest.yml                        # Windows 更新信息
├── latest-mac.yml                    # macOS 更新信息
└── latest-linux.yml                  # Linux 更新信息
```

### 自动更新支持

生成的 `latest*.yml` 文件包含版本信息，支持 electron-updater 自动更新：

```yaml
# latest.yml 示例
version: 0.1.0
files:
  - url: echolab-0.1.0-setup.exe
    sha512: abc123...
    size: 12345678
path: echolab-0.1.0-setup.exe
sha512: abc123...
releaseDate: '2024-01-01T00:00:00.000Z'
```

**重要提示：** 这些 YAML 文件会自动上传到 GitHub Release 的资产中，确保 electron-updater 能够正确检查和下载更新。

## 🛠️ 故障排除

### 常见问题

1. **构建失败**

   - 检查测试是否通过
   - 查看构建日志中的错误信息
   - 确保所有依赖都已安装

2. **版本号冲突**

   - 确保 package.json 版本号唯一
   - 检查是否有重复的 git 标签

3. **权限问题**

   - 确保脚本有执行权限
   - 检查 GitHub token 权限

4. **自动更新失败**
   - 确保 `latest.yml`、`latest-mac.yml`、`latest-linux.yml` 文件已上传到 GitHub Release
   - 检查 electron-builder 配置中的 `publish` 设置
   - 验证 `generateUpdatesFilesForAllChannels: true` 配置

### 调试技巧

```bash
# 本地测试构建
pnpm build:unpack  # 快速测试构建

# 检查特定平台
pnpm build:win     # 仅测试 Windows
pnpm build:mac     # 仅测试 macOS
pnpm build:linux   # 仅测试 Linux

# 查看详细日志
pnpm build 2>&1 | tee build.log
```

## 📈 最佳实践

1. **版本管理**

   - 使用语义化版本号
   - 主要功能用 minor 版本
   - Bug 修复用 patch 版本
   - 破坏性变更用 major 版本

2. **发布节奏**

   - 定期发布 patch 版本
   - 功能稳定后发布 minor 版本
   - 充分测试后发布 major 版本

3. **质量保证**
   - 发布前必须通过所有测试
   - 在不同平台上验证安装包
   - 收集用户反馈持续改进
