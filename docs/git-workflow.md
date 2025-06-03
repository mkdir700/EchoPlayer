# Git 工作流程指南

## 概述

本项目已配置了自动化的 Git Hooks，在提交代码时会自动执行代码检查和格式化，确保代码质量和一致性。

## 配置的工具

### 1. Husky

- 管理 Git Hooks
- 在特定的 Git 操作时自动执行脚本

### 2. Lint-staged

- 仅对暂存区的文件进行 lint 和格式化
- 提高性能，避免检查整个项目

### 3. ESLint

- 代码质量检查
- 自动修复可修复的问题

### 4. Prettier

- 代码格式化
- 统一代码风格

### 5. Commitlint

- 检查提交消息格式
- 确保提交消息符合约定式提交规范

## 工作流程

### 提交代码时发生什么

1. **pre-commit hook** (提交前)

   - 对暂存的 `.js`, `.jsx`, `.ts`, `.tsx` 文件执行：
     - ESLint 检查并自动修复
     - Prettier 格式化
   - 对暂存的 `.json`, `.md`, `.yml`, `.yaml` 文件执行：
     - Prettier 格式化

2. **commit-msg hook** (提交消息检查)
   - 检查提交消息是否符合约定式提交规范

### 约定式提交规范

提交消息格式：`<type>: <description>`

支持的类型：

- `feat`: 新功能
- `fix`: 修复bug
- `docs`: 文档更新
- `style`: 代码格式修改（不影响代码运行的变动）
- `refactor`: 代码重构（即不是新增功能，也不是修改bug的代码变动）
- `perf`: 性能优化
- `test`: 增加测试
- `chore`: 构建过程或辅助工具的变动
- `ci`: CI配置文件和脚本的变动
- `build`: 构建系统或外部依赖的变动
- `revert`: 撤销之前的commit

示例：

```bash
git commit -m "feat: add auto-pause functionality for subtitle learning"
git commit -m "fix: resolve video playback issue on Windows"
git commit -m "docs: update installation guide"
```

## 手动执行命令

### 代码检查和修复

```bash
# 检查所有文件
pnpm lint

# 检查并自动修复
pnpm lint:fix

# 仅对暂存文件执行 lint-staged
pnpm lint-staged
```

### 代码格式化

```bash
# 格式化所有文件
pnpm format

# 检查格式化（不修改文件）
pnpm format:check
```

### 类型检查

```bash
# 检查所有 TypeScript 文件
pnpm typecheck

# 分别检查 Node.js 和 Web 代码
pnpm typecheck:node
pnpm typecheck:web
```

## 故障排除

### 提交被拒绝

如果提交被拒绝，通常是因为：

1. **ESLint 错误**

   ```bash
   # 查看具体错误
   pnpm lint

   # 尝试自动修复
   pnpm lint:fix
   ```

2. **格式化问题**

   ```bash
   # 格式化代码
   pnpm format
   ```

3. **提交消息格式错误**
   - 确保提交消息符合约定式提交规范
   - 使用正确的类型前缀
   - 消息长度不超过 72 个字符

### 跳过 Hooks（不推荐）

在紧急情况下，可以跳过 hooks：

```bash
# 跳过 pre-commit 和 commit-msg hooks
git commit --no-verify -m "emergency fix"
```

**注意：只在紧急情况下使用，并在后续提交中修复相关问题。**

## 配置文件

- `.husky/pre-commit`: pre-commit hook 脚本
- `.husky/commit-msg`: commit-msg hook 脚本
- `package.json`: lint-staged 配置
- `commitlint.config.js`: commitlint 配置
- `eslint.config.mjs`: ESLint 配置
- `.prettierrc.yaml`: Prettier 配置

## 最佳实践

1. **小而频繁的提交**

   - 每个提交只包含一个逻辑变更
   - 便于 code review 和问题定位

2. **有意义的提交消息**

   - 清楚描述变更内容
   - 使用约定式提交格式

3. **提交前测试**

   - 确保代码能够正常运行
   - 运行相关测试

4. **及时修复 lint 问题**
   - 不要积累大量 lint 错误
   - 利用 IDE 插件实时检查
