# EchoLab 文档部署指南

本文档说明如何将 EchoLab 文档部署到 GitHub Pages。

## 自动部署（推荐）

我们已经配置了 GitHub Actions 自动部署工作流，当你推送文档更改到 `main` 分支时会自动触发部署。

### 启用 GitHub Pages

1. 进入你的 GitHub 仓库设置页面
2. 滚动到 "Pages" 部分
3. 在 "Source" 下选择 "GitHub Actions"
4. 保存设置

### 触发部署

部署会在以下情况自动触发：

- 推送到 `main` 分支且包含 `docs/` 目录的更改
- 手动触发工作流（在 Actions 页面）

## 手动部署

如果需要手动部署，可以按照以下步骤：

### 1. 安装依赖

```bash
cd docs
npm install
```

### 2. 构建文档

```bash
npm run build
```

### 3. 预览构建结果

```bash
npm run preview
```

## 配置说明

### VitePress 配置

文档的主要配置在 `docs/.vitepress/config.mts` 文件中：

- `base: '/echolab/'` - 设置为你的仓库名称
- `title` 和 `description` - 网站标题和描述
- `themeConfig` - 导航、侧边栏等主题配置

### GitHub Actions 配置

自动部署配置在 `.github/workflows/deploy-docs.yml` 文件中：

- 监听 `main` 分支的 `docs/` 目录变更
- 使用 Node.js 18 构建
- 自动部署到 GitHub Pages

## 访问地址

部署成功后，文档将可以通过以下地址访问：

```
https://mkdir700.github.io/echolab/
```

## 故障排除

### 构建失败

1. 检查 `docs/package.json` 中的依赖版本
2. 确保所有 Markdown 文件语法正确
3. 检查 VitePress 配置文件是否有语法错误

### 部署失败

1. 确保仓库已启用 GitHub Pages
2. 检查 GitHub Actions 权限设置
3. 查看 Actions 日志获取详细错误信息

### 页面无法访问

1. 确认 GitHub Pages 设置正确
2. 检查 `base` 配置是否与仓库名称匹配
3. 等待几分钟让 DNS 生效

## 本地开发

### 启动开发服务器

```bash
cd docs
npm run dev
```

开发服务器将在 `http://localhost:5173` 启动。

### 添加新页面

1. 在相应目录下创建 `.md` 文件
2. 在 `config.mts` 中添加导航或侧边栏配置
3. 提交更改并推送到 `main` 分支

## 更新文档

1. 编辑相应的 Markdown 文件
2. 本地预览确认无误
3. 提交并推送到 `main` 分支
4. GitHub Actions 将自动构建和部署

---

如有问题，请查看 [VitePress 官方文档](https://vitepress.dev/) 或提交 Issue。
