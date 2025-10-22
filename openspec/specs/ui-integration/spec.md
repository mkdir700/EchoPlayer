## Purpose

用户界面集成 SHALL 为字幕翻译功能提供完整的前端界面实现，包括设置页面重构、配置界面、状态管理、国际化支持和 IPC 通信。系统 SHALL 确保用户体验的一致性和易用性。

## Requirements

### Requirement: 设置页面重构

应用程序 SHALL 将 ASR 设置页面重构为"字幕生成"设置页面，包含语音识别和翻译两个功能分组。

#### Scenario: 页面标题更新

- **WHEN** 用户访问设置页面时
- **THEN** 页面 SHALL 显示"字幕生成"作为主标题
- **AND** SHALL 支持中英文国际化

#### Scenario: 分组结构重构

- **WHEN** 页面渲染时
- **THEN** 系统 SHALL 显示两个主要分组
- **AND** 第一个分组 SHALL 为"语音识别 (Deepgram)"
- **AND** 第二个分组 SHALL 为"字幕翻译 (Zhipu AI)"
- **AND** SHALL 保持现有 Deepgram 配置功能不变

### Requirement: 翻译配置界面

系统 SHALL 为字幕翻译功能提供完整的 Zhipu API Key 配置界面。

#### Scenario: API Key 输入组件

- **WHEN** 用户配置翻译功能时
- **THEN** 系统 SHALL 提供密码类型的输入框
- **AND** SHALL 支持实时验证状态显示
- **AND** SHALL 在失焦时自动保存配置

#### Scenario: API Key 验证功能

- **WHEN** 用户点击验证按钮时
- **THEN** 系统 SHALL 调用后端验证 API
- **AND** SHALL 显示验证结果反馈
- **AND** 验证过程中 SHALL 显示加载状态

#### Scenario: 获取 API Key 链接

- **WHEN** 用户需要获取 API Key 时
- **THEN** 系统 SHALL 提供指向 Zhipu 官网的链接
- **AND** 链接 SHALL 在新窗口中打开

### Requirement: 状态管理

设置组件 SHALL 实现完整的翻译配置状态管理。

#### Scenario: 状态定义

- **WHEN** 组件初始化时
- **THEN** 系统 SHALL 定义 zhipuApiKey 状态
- **AND** SHALL 定义 zhipuApiKeyValid 验证状态
- **AND** SHALL 定义 validatingZhipuApiKey 加载状态

#### Scenario: 配置加载和保存

- **WHEN** 组件挂载时
- **THEN** 系统 SHALL 自动从后端加载现有配置
- **AND** SHALL 在配置变更时自动保存
- **AND** SHALL 遵循项目的状态管理规范

### Requirement: 国际化支持

翻译功能界面 SHALL 完整支持中英文国际化。

#### Scenario: 中文国际化文本

- **WHEN** 应用程序使用中文界面时
- **THEN** 所有翻译相关文本 SHALL 显示为中文
- **AND** SHALL 包含页面标题、分组名称、输入框标签等

#### Scenario: 英文国际化文本

- **WHEN** 应用程序使用英文界面时
- **THEN** 所有翻译相关文本 SHALL 显示为英文
- **AND** SHALL 保持与中文版本功能一致

### Requirement: IPC 通信

前后端 SHALL 通过 IPC 通道实现翻译功能的通信。

#### Scenario: IPC 通道定义

- **WHEN** 前端需要验证 API Key 时
- **THEN** 主进程 SHALL 提供 'translation:validateApiKey' 处理器
- **AND** SHALL 调用翻译服务进行验证

#### Scenario: Preload API 暴露

- **WHEN** 前端组件需要访问翻译功能时
- **THEN** preload 脚本 SHALL 暴露 translation API
- **AND** SHALL 提供 validateApiKey 方法

### Requirement: 用户体验设计

界面 SHALL 遵循一致的设计语言和用户体验标准。

#### Scenario: 错误处理反馈

- **WHEN** 配置操作失败时
- **THEN** 系统 SHALL 提供清晰的错误提示
- **AND** SHALL 指导用户如何解决问题

#### Scenario: 成功状态反馈

- **WHEN** 配置操作成功时
- **THEN** 系统 SHALL 提供适当的成功反馈
- **AND** SHALL 在适当时机自动消失

## 设计要求

### 界面布局

- 使用 Ant Design 组件库保持设计一致性
- 采用清晰的分组结构，便于用户理解
- 提供适当的间距和视觉层次

### 用户体验

- 配置变更即时保存，无需手动确认
- 提供清晰的错误提示和成功反馈
- API Key 验证过程显示加载状态

### 响应式设计

- 支持不同屏幕尺寸的适配
- 确保在移动设备上的可用性

## 技术约束

### 状态管理规范

- 使用 React Hooks 进行状态管理
- 遵循项目中关于 Zustand 使用的规定
- 避免在 useEffect 中调用 store Hook

### 样式实现

- 优先使用 styled-components 而非全局 SCSS
- 使用 CSS 变量而非硬编码样式值
- 保持与项目整体设计系统的一致性

### 图标使用

- 统一使用 lucide-react 图标库
- 避免使用 emoji 作为图标
