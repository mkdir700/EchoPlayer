## ADDED Requirements

### Requirement: 单条字幕即时翻译

翻译服务 SHALL 支持通过现有的批量翻译方法处理单条字幕翻译请求，通过IPC通道响应前端的翻译需求。

#### Scenario: 单条翻译请求处理

- **WHEN** 接收到单条字幕翻译请求时
- **THEN** 系统 SHALL 使用现有的 `translateSubtitles()` 方法处理请求
- **AND** SHALL 将单条字幕包装成包含一条字幕的数组进行翻译
- **AND** SHALL 返回翻译结果或错误信息
- **AND** SHALL 自动将翻译结果保存到数据库

#### Scenario: 翻译结果数据库更新

- **WHEN** 单条字幕翻译成功完成时
- **THEN** 系统 SHALL 使用字幕ID更新数据库记录
- **AND** SHALL 更新 translatedText 字段
- **AND** SHALL 记录翻译成功的日志信息

#### Scenario: IPC 通信接口

- **WHEN** 前端发送翻译请求时
- **THEN** 系统 SHALL 通过 `translate-subtitle` 通道接收请求
- **AND** SHALL 包含字幕ID、原文文本和相关上下文信息
- **AND** SHALL 调用现有的批量翻译方法进行处理
- **AND** SHALL 返回异步翻译结果

## MODIFIED Requirements

### Requirement: 翻译服务错误处理

翻译服务 SHALL 增强错误处理机制，支持单条翻译操作的异常情况处理。

#### Scenario: 网络错误恢复

- **WHEN** 单条翻译遇到网络错误时
- **THEN** 系统 SHALL 自动重试最多 2 次
- **AND** SHALL 使用指数退避策略
- **AND** 最终失败时 SHALL 返回详细错误信息到前端

#### Scenario: API 配置验证

- **WHEN** 接收到翻译请求时
- **THEN** 系统 SHALL 验证 Zhipu API Key 配置
- **AND** 在配置缺失时 SHALL 返回配置错误提示
- **AND** SHALL 引导用户到配置页面进行设置

### Requirement: 翻译上下文优化

翻译服务 SHALL 为单条字幕翻译提供优化的上下文信息，提高翻译质量。

#### Scenario: 上下文信息构建

- **WHEN** 构建单条字幕翻译提示词时
- **THEN** 系统 SHALL 包含视频文件名作为上下文
- **AND** SHALL 包含前后字幕内容（如果可用）
- **AND** SHALL 要求自然流畅的中文翻译
- **AND** SHALL 保持与批量翻译相同的翻译质量标准
