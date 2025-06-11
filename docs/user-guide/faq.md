# 常见问题解答 (FAQ)

## 一般问题

### Q: EchoLab 是免费的吗？

A: 是的，EchoLab 是完全免费的开源软件，基于 Apache-2.0 许可证发布。

### Q: EchoLab 支持哪些操作系统？

A: EchoLab 支持以下操作系统：

- Windows 10/11
- macOS 10.15 及以上版本
- Linux (Ubuntu 20.04 及以上版本)

### Q: EchoLab 支持哪些视频格式？

A: EchoLab 支持大多数常见的视频格式，包括：

- MP4 (推荐)
- WebM
- OGV
- AVI
- MOV
- MKV

### Q: EchoLab 支持哪些字幕格式？

A: EchoLab 支持以下字幕格式：

- SRT (SubRip)
- VTT (WebVTT)
- ASS (Advanced SubStation Alpha)
- JSON (自定义格式)

## 功能相关

### Q: 如何使用逐句精听功能？

A: 逐句精听是 EchoLab 的核心功能：

1. 导入视频和字幕文件
2. 使用 `↑` 和 `↓` 箭头键跳转到上一句/下一句
3. 按 `空格键` 暂停/播放
4. 使用 `R` 键重复播放当前句子

### Q: 如何调整播放速度？

A: 您可以通过以下方式调整播放速度：

- 使用播放器底部的速度控制按钮
- 使用快捷键 `[` 减速，`]` 加速
- 支持 0.25x 到 2.0x 的播放速度

### Q: 如何导出学习进度？

A: 目前 EchoLab 支持导出：

- 字幕文件（多种格式）
- 学习笔记
- 播放列表

## 技术问题

### Q: 为什么视频播放时有延迟？

A: 可能的原因和解决方案：

- 视频文件过大：尝试降低分辨率
- 系统资源不足：关闭其他程序
- 硬盘读取速度慢：将视频文件移到 SSD

### Q: 字幕显示乱码怎么办？

A: 字幕乱码通常是编码问题：

1. 确保字幕文件使用 UTF-8 编码
2. 使用文本编辑器重新保存为 UTF-8 格式
3. 检查字幕文件是否损坏

### Q: 如何备份我的设置？

A: EchoLab 的设置文件位于：

- Windows: `%APPDATA%\EchoLab\`
- macOS: `~/Library/Application Support/EchoLab/`
- Linux: `~/.config/EchoLab/`

复制整个文件夹即可备份所有设置。

## 学习相关

### Q: EchoLab 适合什么水平的语言学习者？

A: EchoLab 适合各个水平的语言学习者：

- 初学者：可以使用慢速播放和重复功能
- 中级学习者：利用逐句精听提高听力
- 高级学习者：用于精细化语音语调练习

### Q: 如何最有效地使用 EchoLab 学习？

A: 推荐的学习方法：

1. 首次观看：正常速度，了解大意
2. 精听阶段：使用逐句功能，逐句理解
3. 跟读练习：暂停后跟读每个句子
4. 复习巩固：重复播放难点句子

### Q: 可以同时显示多种语言的字幕吗？

A: 目前 EchoLab 支持双语字幕显示，您可以：

- 同时加载两个字幕文件
- 在设置中选择显示模式
- 切换主要/次要字幕语言

## 更新和支持

### Q: 如何更新 EchoLab？

A: EchoLab 会自动检查更新：

- 启动时会检查新版本
- 您也可以在设置中手动检查更新
- 支持自动下载和安装更新

### Q: 遇到问题如何获取帮助？

A: 您可以通过以下方式获取帮助：

- 查看[故障排除页面](/user-guide/troubleshooting)
- 在 [GitHub Issues](https://github.com/mkdir700/echolab/issues) 提交问题
- 发送邮件至：mkdir700@gmail.com
- 参与 [GitHub Discussions](https://github.com/mkdir700/echolab/discussions)

### Q: 如何为 EchoLab 做贡献？

A: 我们欢迎各种形式的贡献：

- 报告 Bug 和提出功能建议
- 提交代码改进
- 翻译文档到其他语言
- 分享使用经验和学习心得

详细信息请查看我们的 [GitHub 仓库](https://github.com/mkdir700/echolab)。
