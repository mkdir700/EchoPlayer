# EchoLab 发布检查清单

## 发布前准备 ✅

### 项目准备

- [ ] 确认所有功能已完成并测试
- [ ] 更新 README.md 文档
- [ ] 确认应用图标和资源文件
- [ ] 检查 package.json 中的应用信息
  - [ ] 应用名称
  - [ ] 版本号
  - [ ] 描述
  - [ ] 作者信息
  - [ ] 主页链接

### 代码质量检查

- [ ] 运行所有测试：`pnpm test:run`
- [ ] 类型检查：`pnpm typecheck`
- [ ] 代码规范检查：`pnpm lint`
- [ ] 代码格式化：`pnpm format`

### 构建测试

- [ ] 本地构建测试：`pnpm build:unpack`
- [ ] Windows 构建测试：`pnpm build:win`
- [ ] macOS 构建测试：`pnpm build:mac`
- [ ] Linux 构建测试：`pnpm build:linux`

### 安装包测试

- [ ] Windows 安装程序测试
- [ ] macOS DMG 文件测试
- [ ] Linux AppImage 测试
- [ ] 应用启动和基本功能验证

## 发布流程 🚀

### 1. 版本准备

```bash
# 选择合适的版本类型
pnpm release:patch   # 0.1.0 -> 0.1.1
pnpm release:minor   # 0.1.0 -> 0.2.0
pnpm release:major   # 0.1.0 -> 1.0.0
```

### 2. 推送到 GitHub

```bash
git push origin main --tags
```

### 3. 监控 CI/CD 构建

- [ ] GitHub Actions 构建成功
- [ ] 所有平台构建完成
- [ ] Release 草稿创建成功

### 4. 发布 Release

- [ ] 检查 Release 草稿内容
- [ ] 添加更新说明
- [ ] 发布 Release

## 发布后任务 📋

### 官网更新

- [ ] 更新下载链接
- [ ] 发布更新公告
- [ ] 更新版本说明文档

### 社媒宣传

- [ ] 准备发布推文/帖子
- [ ] 更新项目展示页面
- [ ] 通知用户群体

### 监控和反馈

- [ ] 监控下载统计
- [ ] 收集用户反馈
- [ ] 跟踪错误报告

## 应急响应 🆘

### 如果发现问题

1. 立即停止推广
2. 评估问题严重性
3. 准备热修复版本
4. 通知用户并道歉

### 回滚计划

- [ ] 删除有问题的 Release
- [ ] 恢复到上一个稳定版本
- [ ] 更新下载链接

## 版本记录 📚

| 版本   | 发布日期 | 主要变更 | 发布人 |
| ------ | -------- | -------- | ------ |
| v0.1.0 | 待定     | 首次发布 | -      |
