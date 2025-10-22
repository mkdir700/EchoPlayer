## Purpose

配置管理服务 SHALL 为应用程序提供统一的配置项管理功能，包括 API Key、用户偏好设置等的存储、读取和更新。系统 SHALL 支持多种配置类型的安全存储和实时通知机制。

## Requirements

### Requirement: Zhipu API Key 配置管理

ConfigManager SHALL 支持 Zhipu API Key 的配置管理功能，包括配置枚举扩展、默认值设置、getter/setter 方法实现，以及配置变更通知机制。

#### Scenario: 配置枚举扩展

- **WHEN** 系统初始化 ConfigManager 时
- **THEN** ConfigKeys 枚举 SHALL 包含 `ZhipuApiKey = 'zhipuApiKey'` 配置项
- **AND** 类型系统 SHALL 正确识别新的配置项

#### Scenario: 配置方法实现

- **WHEN** 调用 `configManager.setZhipuApiKey('zhipu-api-key')` 时
- **THEN** 系统 SHALL 正确保存 API Key
- **AND** 调用 `configManager.getZhipuApiKey()` SHALL 返回设置的值

#### Scenario: 默认值配置

- **WHEN** 新安装应用程序或配置未设置时
- **THEN** `configManager.getZhipuApiKey()` SHALL 返回空字符串作为默认值

### Requirement: 配置持久化存储

Zhipu API Key SHALL 使用 electron-conf 进行安全存储，支持配置变更时的自动通知，并提供配置验证和错误处理功能。

#### Scenario: 配置持久化

- **WHEN** 应用程序重启后
- **THEN** 之前设置的 Zhipu API Key SHALL 能够正确恢复
- **AND** 配置值 SHALL 保持不变

#### Scenario: 配置变更通知

- **WHEN** 调用 `configManager.setZhipuApiKey('new-key')` 时
- **THEN** 系统 SHALL 触发订阅者回调通知配置变更
- **AND** 回调函数 SHALL 接收到新的配置值

### Requirement: 默认值管理

ConfigManager SHALL 在 defaultValues 对象中包含所有配置项的默认值，新添加的 Zhipu API Key 配置项 SHALL 有相应的默认值设置。

#### Scenario: 默认值配置更新

- **WHEN** 初始化 defaultValues 对象时
- **THEN** 对象 SHALL 包含 `[ConfigKeys.ZhipuApiKey]: ''` 配置项
- **AND** 默认值 SHALL 为空字符串

### Requirement: 配置类型定义

配置管理 SHALL 确保所有配置项都有明确的 TypeScript 类型定义，保证编译时类型安全。

#### Scenario: 类型定义完整性

- **WHEN** 使用 `ConfigKeys.ZhipuApiKey` 时
- **THEN** TypeScript 编译器 SHALL 正确识别类型
- **AND** 不应产生类型错误

## 现有配置项

### Deepgram 配置

- **DeepgramApiKey**: Deepgram 语音识别 API Key
- **DefaultLanguage**: 默认转写语言
- **Model**: 转写模型选择

### 通用配置

- 各种用户偏好设置
- 应用程序行为配置
- 界面显示选项

## 技术要求

### 存储机制

- 使用 electron-conf 进行配置持久化
- 支持配置的原子性更新
- 提供配置变更的事件通知

### 类型安全

- 所有配置项都有明确的 TypeScript 类型定义
- 枚举值确保配置键的一致性
- 编译时类型检查防止配置错误

### 错误处理

- 配置读取失败时提供合理的默认值
- 配置写入失败时记录错误日志
- 支持配置验证和格式检查
