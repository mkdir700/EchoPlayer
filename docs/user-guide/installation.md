# 安装指南

本指南将帮助您在不同操作系统上成功安装 EchoLab

## 📋 系统要求

### Windows 系统

- **操作系统**：Windows 10/11 (64位)
- **内存**：至少 4GB RAM（推荐 8GB）
- **存储空间**：至少 500MB 可用空间
- **显卡**：支持硬件加速的显卡（推荐）
- **网络**：安装时需要网络连接

### macOS 系统

- **操作系统**：macOS 10.15 (Catalina) 或更高版本
- **处理器**：支持 Intel 和 Apple Silicon (M1/M2/M3)
- **内存**：至少 4GB RAM（推荐 8GB）
- **存储空间**：至少 500MB 可用空间
- **权限**：需要允许运行未签名应用程序

### Linux 系统

- **发行版**：Ubuntu 20.04+ 或其他主流发行版
- **架构**：x64 (amd64)
- **内存**：至少 4GB RAM（推荐 8GB）
- **存储空间**：至少 500MB 可用空间
- **依赖**：libgtk-3-0, libgconf-2-4, libnss3

---

## 📥 下载 EchoLab

### 官方下载链接

| 平台    | 文件名                         | 大小   | 下载链接                                                                                                              |
| ------- | ------------------------------ | ------ | --------------------------------------------------------------------------------------------------------------------- |
| Windows | EchoLab-0.1.0-beta.1-Setup.exe | ~120MB | [下载 Windows 版](https://github.com/mkdir700/echolab/releases/download/v0.1.0-beta.1/EchoLab-0.1.0-beta.1-Setup.exe) |
| macOS   | EchoLab-0.1.0-beta.1.dmg       | ~130MB | [下载 macOS 版](https://github.com/mkdir700/echolab/releases/download/v0.1.0-beta.1/EchoLab-0.1.0-beta.1.dmg)         |
| Linux   | EchoLab-0.1.0-beta.1.AppImage  | ~140MB | [下载 Linux 版](https://github.com/mkdir700/echolab/releases/download/v0.1.0-beta.1/EchoLab-0.1.0-beta.1.AppImage)    |

### 备用下载方式

如果官方链接下载缓慢，您可以：

1. **GitHub Releases 页面**：访问 [GitHub Releases](https://github.com/mkdir700/echolab/releases/tag/v0.1.0-beta.1)
2. **镜像站点**：（即将提供国内镜像）

---

## 🖥️ Windows 安装步骤

### 步骤 1：下载安装包

1. 点击上方 Windows 下载链接
2. 保存 `EchoLab-x.x.x-Setup.exe` 到您的电脑

### 步骤 2：运行安装程序

1. 双击下载的安装包
2. 如果出现安全警告，点击"更多信息"
3. 点击"仍要运行"继续安装

### 步骤 3：安装向导

1. 选择安装语言（中文/English）
2. 阅读并接受许可协议
3. 选择安装位置（默认：`C:\Program Files\EchoLab`）
4. 选择开始菜单文件夹
5. 选择附加任务：
   - ✅ 创建桌面快捷方式
   - ✅ 添加到开始菜单
   - ✅ 关联视频文件类型（可选）

### 步骤 4：完成安装

1. 点击"安装"开始安装过程
2. 等待安装完成（约 1-2 分钟）
3. 点击"完成"并选择是否立即启动

### 常见问题解决

**安全警告处理**

- Windows Defender 可能会阻止安装
- 解决方法：设置 → 更新和安全 → Windows 安全中心 → 病毒和威胁防护 → 添加排除项

**安装失败**

- 确保以管理员权限运行安装程序
- 关闭杀毒软件后重试
- 检查磁盘空间是否充足

---

## 🍎 macOS 安装步骤

### 步骤 1：下载 DMG 文件

1. 点击上方 macOS 下载链接
2. 保存 `EchoLab-x.y.z.dmg` 到下载文件夹

### 步骤 2：挂载 DMG

1. 双击下载的 DMG 文件
2. 等待磁盘映像挂载完成

### 步骤 3：安装应用

1. 在打开的窗口中，将 EchoLab 图标拖拽到 Applications 文件夹
2. 等待复制完成

### 步骤 4：首次运行

1. 打开 Applications 文件夹
2. 双击 EchoLab 应用
3. 如果出现安全警告：
   - 系统偏好设置 → 安全性与隐私
   - 点击"仍要打开"

### 权限设置

**允许未知开发者应用**

```bash
# 在终端中运行（如果需要）
sudo spctl --master-disable
```

**手动允许 EchoLab**

```bash
# 在终端中运行
sudo xattr -rd com.apple.quarantine /Applications/EchoLab.app
```

### 常见问题解决

**"EchoLab 已损坏"错误**

- 这是 macOS 的安全机制
- 解决方法：系统偏好设置 → 安全性与隐私 → 允许从以下位置下载的应用 → 任何来源

**应用无法启动**

- 检查 macOS 版本是否符合要求
- 尝试重新下载安装包
- 联系技术支持

---

## 🐧 Linux 安装步骤

### 步骤 1：下载 AppImage

1. 点击上方 Linux 下载链接
2. 保存 `EchoLab-x.y.z.AppImage` 到您的主目录

### 步骤 2：设置执行权限

```bash
# 在终端中运行
chmod +x EchoLab-x.y.z.AppImage
```

### 步骤 3：安装依赖（如果需要）

**Ubuntu/Debian 系统**

```bash
sudo apt update
sudo apt install libgtk-3-0 libgconf-2-4 libnss3 libxss1 libasound2
```

**CentOS/RHEL/Fedora 系统**

```bash
sudo yum install gtk3 GConf2 nss libXScrnSaver alsa-lib
# 或者使用 dnf (Fedora)
sudo dnf install gtk3 GConf2 nss libXScrnSaver alsa-lib
```

### 步骤 4：运行应用

```bash
# 直接运行
./EchoLab-x.y.z.AppImage

# 或者双击文件管理器中的文件
```

### 可选：集成到系统

**创建桌面快捷方式**

```bash
# 创建 .desktop 文件
cat > ~/.local/share/applications/echolab.desktop << EOF
[Desktop Entry]
Name=EchoLab
Comment=Language Learning Video Player
Exec=/path/to/EchoLab-x.y.z.AppImage
Icon=echolab
Terminal=false
Type=Application
Categories=AudioVideo;Education;
EOF
```

**添加到 PATH**

```bash
# 移动到 /usr/local/bin
sudo mv EchoLab-x.y.z.AppImage /usr/local/bin/echolab
sudo chmod +x /usr/local/bin/echolab
```

### 常见问题解决

**缺少依赖库**

- 根据错误信息安装对应的库
- 使用包管理器搜索缺失的库

**权限问题**

- 确保 AppImage 文件有执行权限
- 检查文件所有者和权限设置

---

## ✅ 安装验证

### 检查安装是否成功

1. **启动应用**：双击桌面图标或从开始菜单启动
2. **查看版本信息**：帮助 → 关于 EchoLab
3. **测试基本功能**：
   - 导入一个测试视频文件
   - 检查播放控制是否正常
   - 测试快捷键功能

### 性能测试

**推荐测试视频**

- 格式：MP4 (H.264)
- 分辨率：1080P
- 时长：5-10 分钟
- 字幕：SRT 格式

**测试项目**

- [ ] 视频播放流畅
- [ ] 字幕显示正常
- [ ] 快捷键响应
- [ ] 音量控制正常
- [ ] 播放速度调节正常

---

## 🔧 安装后配置

### 首次启动设置

1. **语言设置**：选择界面语言
2. **默认播放速度**：根据学习水平设置
3. **快捷键确认**：检查快捷键是否冲突
4. **文件关联**：选择是否关联视频文件类型

### 推荐设置

**播放设置**

- 默认播放速度：0.75x（中级学习者）
- 自动暂停：开启
- 单句循环：关闭（按需开启）

**字幕设置**

- 默认模式：双语显示
- 字体大小：中等
- 显示位置：底部居中

**快捷键设置**

- 保持默认设置
- 根据个人习惯调整

---

## 🆘 安装问题排查

### 通用问题

**下载失败**

- 检查网络连接
- 尝试使用其他网络
- 使用下载工具（如 IDM）

**安装包损坏**

- 重新下载安装包
- 检查文件完整性
- 尝试从其他源下载

**启动失败**

- 检查系统要求
- 更新显卡驱动
- 以管理员权限运行

### 平台特定问题

**Windows 特有问题**

- 杀毒软件误报：添加到白名单
- 缺少 Visual C++ 运行库：安装最新版本
- 权限不足：以管理员身份运行

**macOS 特有问题**

- 安全策略阻止：调整安全设置
- 版本不兼容：检查 macOS 版本
- 权限问题：重置应用权限

**Linux 特有问题**

- 依赖库缺失：安装所需依赖
- 权限问题：检查文件权限
- 显示问题：检查 X11 配置

---

## 📞 获取帮助

如果您在安装过程中遇到问题：

### 官方支持渠道

- **GitHub Issues**：[报告安装问题](https://github.com/mkdir700/echolab/issues/new?template=installation_issue.md)
- **邮箱支持**：mkdir700@gmail.com
- **讨论社区**：[GitHub Discussions](https://github.com/mkdir700/echolab/discussions)

### 提供信息

报告问题时请提供：

1. **操作系统**：版本和架构
2. **错误信息**：完整的错误消息
3. **安装步骤**：您执行的具体步骤
4. **系统日志**：相关的系统日志
5. **截图**：错误界面截图

### 社区资源

- **用户论坛**：与其他用户交流经验
- **视频教程**：观看安装演示视频
- **FAQ**：查看常见问题解答

---

## 🎉 安装完成

恭喜您成功安装 EchoLab！现在您可以：

1. **开始学习**：查看[快速入门指南](./quick-start)
2. **深入了解**：阅读[完整用户手册](./user-manual)
3. **掌握技巧**：学习[快捷键操作](../keyboard-shortcuts)
4. **获取支持**：加入用户社区

**开始您的高效语言学习之旅吧！** 🚀

---

_如果您觉得 EchoLab 对您有帮助，请给我们一个 ⭐️ Star，这是对我们最大的鼓励！_
