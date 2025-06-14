# EchoLab - 逐句精听，逐步精进

<div align="center">

![EchoLab Logo](https://img.shields.io/badge/EchoLab-语言学习-blue?style=for-the-badge)

**专业的视频语言学习工具**

[![License](https://img.shields.io/badge/license-Apache%202.0-blue?style=flat-square)](LICENSE)
[![Development Status](https://img.shields.io/badge/status-Beta-orange?style=flat-square)](https://github.com/mkdir700/echolab)
[![Electron](https://img.shields.io/badge/Electron-35+-blue?style=flat-square)](https://electronjs.org)
[![React](https://img.shields.io/badge/React-19+-blue?style=flat-square)](https://reactjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8+-blue?style=flat-square)](https://typescriptlang.org)

[下载应用](#-安装) • [使用指南](#-使用指南) • [功能特性](#-功能特性) • [开发](#-开发)

</div>

---

## 📖 项目简介

EchoLab 是一款专为语言学习者设计的视频播放器，通过**逐句精听**的方式帮助用户高效学习外语。无论是电影、电视剧、纪录片还是教学视频，EchoLab 都能让您的视频学习体验更加专业和高效。

> **⚠️ 开发状态说明**  
> 本软件目前处于 **Beta 开发阶段**，功能和界面可能会有所调整。我们正在积极开发和优化中，欢迎您的反馈和建议！

## 📱 软件截图

### 首页界面

_清晰直观的首页设计，快速开始您的学习之旅_

![首页.png](https://cdn.z2blog.com/utools/pic/1749827196647.png)

### 播放页面

_专业的逐句精听界面，专注高效的语言学习体验_

![播放页.png](https://cdn.z2blog.com/utools/pic/1749827233129.png)

## ✨ 功能特性

### 🎯 核心功能

- **逐句播放控制** - 一键跳转到上一句/下一句字幕
- **自动暂停** - 每句字幕结束后自动暂停，便于消化理解
- **单句循环** - 重复播放当前字幕句子，强化练习
- **多语言字幕** - 同时显示原文和译文，支持双语学习

### 📝 字幕功能

- **多格式支持** - 兼容 SRT、VTT、ASS/SSA、JSON 格式
- **智能解析** - 自动识别字幕编码和格式
- **实时同步** - 字幕与视频完美同步显示
- **自由定位** - 字幕位置可自由拖拽调整

### 🎮 播放控制

- **变速播放** - 0.25x 到 2.0x 多档速度调节
- **精确跳转** - 10秒前进/后退，快速定位
- **全屏模式** - 沉浸式学习体验
- **快捷键操作** - 丰富的键盘快捷键支持

### 📚 学习管理

- **播放记录** - 自动保存观看进度和字幕数据
- **文件管理** - 智能的最近播放列表
- **进度恢复** - 重新打开时自动恢复上次播放位置

## 🚀 安装

### 系统要求

- **Windows**: Windows 10/11 (64位)
- **macOS**: macOS 10.15+ (支持 Intel 和 Apple Silicon)
- **Linux**: Ubuntu 18.04+ 或其他主流发行版

### 下载安装

1. 前往 [Releases](../../releases) 页面
2. 下载适合您系统的安装包
3. 运行安装程序完成安装

### 支持的视频格式

- **常见格式**: MP4, AVI, MKV, MOV, WMV, FLV
- **高清格式**: 支持 4K/1080P 高清视频
- **音频格式**: 自动处理各种音频编码

### 支持的字幕格式

- **SRT** - 最常用的字幕格式
- **VTT** - Web 标准字幕格式
- **ASS/SSA** - 高级字幕格式，支持样式
- **JSON** - 自定义 JSON 字幕格式

## 📖 使用指南

### 快速开始

1. **添加视频**: 点击"添加视频"按钮选择本地视频文件
2. **导入字幕**: 应用会自动检测同名字幕文件，或手动选择
3. **开始学习**: 使用播放控制按钮进行逐句精听练习

### 字幕操作

- **自动检测**: 放置同名字幕文件在视频目录，自动导入
- **手动导入**: 点击字幕按钮手动选择字幕文件
- **显示模式**: 支持原文、译文、双语三种显示模式

### 快捷键说明

| 功能       | 快捷键   | 说明              |
| ---------- | -------- | ----------------- |
| 播放/暂停  | `空格键` | 切换播放状态      |
| 上一句字幕 | `H`      | 跳转到上一句字幕  |
| 下一句字幕 | `L`      | 跳转到下一句字幕  |
| 调大音量   | `↑`      | 调大音量 10%      |
| 调小音量   | `↓`      | 调小音量 10%      |
| 后退10秒   | `←`      | 快速后退          |
| 前进10秒   | `→`      | 快速前进          |
| 单句循环   | `L`      | 开启/关闭单句循环 |
| 自动暂停   | `P`      | 开启/关闭自动暂停 |
| 全屏切换   | `F`      | 进入/退出全屏     |

## 🛠 技术栈

### 核心技术

- **Electron** - 跨平台桌面应用框架
- **React** - 现代化前端框架
- **TypeScript** - 类型安全的开发体验
- **Ant Design** - 专业的 UI 组件库

## 💻 开发

### 环境要求

- **Node.js** 18.0+
- **pnpm** 8.0+

### 本地开发

```bash
# 克隆项目
git clone https://github.com/your-username/echolab.git
cd echolab

# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev
```

### 构建发布

```bash
# 构建应用
pnpm build

# 打包 Windows 版本
pnpm build:win

# 打包 macOS 版本
pnpm build:mac

# 打包 Linux 版本
pnpm build:linux
```

### 测试

```bash
# 运行测试
pnpm test

# 运行测试并生成覆盖率报告
pnpm test:coverage

# 交互式测试界面
pnpm test:ui
```

## 📁 项目结构

```
echolab/
├── src/
│   ├── main/           # 主进程代码
│   │   ├── handlers/   # API 处理器
│   │   └── window/     # 窗口管理
│   ├── preload/        # 预加载脚本
│   └── renderer/       # 渲染进程
│       └── src/
│           ├── components/  # React 组件
│           ├── hooks/       # 自定义 Hooks
│           ├── pages/       # 页面组件
│           ├── contexts/    # React Context
│           └── utils/       # 工具函数
├── resources/          # 应用资源文件
└── scripts/           # 构建脚本
```

## 🤝 贡献指南

我们欢迎任何形式的贡献！

1. Fork 本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

### 开发规范

- 使用 TypeScript 进行开发
- 遵循 ESLint 和 Prettier 规范
- 编写单元测试覆盖新功能
- 提交信息遵循 [Conventional Commits](https://conventionalcommits.org/)

### Git 工作流程

项目已配置自动化 Git Hooks，提交时会自动执行：

- **代码检查**: ESLint 自动检查并修复代码问题
- **代码格式化**: Prettier 统一代码风格

详细说明请查看 [Git 工作流程指南](docs/git-workflow.md)

## 📝 更新日志

查看 [CHANGELOG.md](CHANGELOG.md) 了解详细的版本更新记录。

## 📄 许可证

本项目基于 [Apache License 2.0](LICENSE) 开源许可证发布。

## 🙏 致谢

感谢所有为这个项目做出贡献的开发者和用户！

---

<div align="center">

**如果这个项目对您有帮助，请给我们一个 ⭐️**

[问题反馈](../../issues) • [功能建议](../../discussions) • [联系我们](mailto:mkdir700@gmail.com)

</div>
