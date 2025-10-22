## Purpose

字幕翻译服务 SHALL 使用 Zhipu AI 的 glm-4.5-flash 模型将生成的字幕自动翻译成中文，为语言学习者提供更好的学习体验。系统 SHALL 支持批量处理、智能翻译、错误重试和数据库集成。

## Requirements

### Requirement: 翻译服务核心功能

SubtitleTranslationService SHALL 提供字幕翻译的核心功能，包括服务初始化、批量翻译处理和翻译结果管理。

#### Scenario: 服务初始化

- **WHEN** 创建新的 SubtitleTranslationService 实例时
- **THEN** 服务 SHALL 能够正确初始化而不抛出异常
- **AND** SHALL 准备好接收翻译请求

#### Scenario: 批量翻译调用

- **WHEN** 调用 `translationService.translateSubtitles()` 时
- **THEN** 系统 SHALL 返回包含成功状态和翻译映射的结果
- **AND** SHALL 支持指定目标语言、API Key 和视频文件名

### Requirement: 智能翻译处理

翻译服务 SHALL 构建包含上下文信息的智能翻译提示词，提供高质量的本土化翻译。

#### Scenario: 智能提示词构建

- **WHEN** 构建翻译提示词时
- **THEN** 系统 SHALL 包含视频文件名作为上下文
- **AND** SHALL 为每条字幕提供前后字幕作为翻译参考
- **AND** SHALL 明确要求本土化翻译，避免直译

#### Scenario: 批量翻译处理

- **WHEN** 处理大量字幕时
- **THEN** 系统 SHALL 将字幕分成 10-20 条的小批次
- **AND** SHALL 为每批字幕提供前后上下文
- **AND** SHALL 最多并发处理 2 个批次

### Requirement: 错误处理和重试机制

翻译服务 SHALL 实现完善的错误处理机制，确保系统稳定性。

#### Scenario: 网络错误重试

- **WHEN** 遇到网络错误时
- **THEN** 系统 SHALL 自动重试最多 3 次
- **AND** SHALL 使用指数退避策略
- **AND** 最终失败时 SHALL 返回错误信息

#### Scenario: API Key 错误处理

- **WHEN** API Key 无效时
- **THEN** 系统 SHALL 立即失败并返回适当的错误信息
- **AND** SHALL 不进行重试操作

### Requirement: 数据库集成

翻译服务 SHALL 支持将翻译结果批量更新到数据库中。

#### Scenario: 批量更新翻译

- **WHEN** 翻译完成时
- **THEN** 系统 SHALL 使用字幕 ID 映射翻译结果
- **AND** SHALL 批量更新数据库中的 translatedText 字段
- **AND** 更新失败时 SHALL 记录详细错误信息

### Requirement: ASR 服务集成

翻译服务 SHALL 与 ASR 字幕生成流程无缝集成。

#### Scenario: 自动翻译触发

- **WHEN** ASR 字幕保存到数据库后且配置了 Zhipu API Key 时
- **THEN** 系统 SHALL 自动启动后台翻译任务
- **AND** SHALL 不阻塞字幕生成的主流程

#### Scenario: 翻译失败隔离

- **WHEN** 翻译任务失败时
- **THEN** 系统 SHALL 记录错误日志
- **AND** SHALL 不影响字幕生成的成功状态
- **AND** 原始字幕 SHALL 正常显示给用户

### Requirement: 数据库层扩展

数据访问层 SHALL 支持字幕翻译的批量更新操作。

#### Scenario: 批量更新方法

- **WHEN** 调用 `updateSubtitleTranslations()` 方法时
- **THEN** 系统 SHALL 接收字幕 ID 和翻译文本的映射
- **AND** SHALL 支持事务处理确保数据一致性
- **AND** SHALL 返回详细的更新统计信息

## 与其他服务的集成

### ASR 服务集成

#### Requirement: ASR-015: 在 ASR 流程中集成翻译功能

**Description**: 在字幕生成完成后自动启动后台翻译任务

**Acceptance Criteria**:

- 在字幕保存到数据库后检查 Zhipu API Key 配置
- 使用 Promise.resolve().then() 启动后台任务，不阻塞主流程
- 翻译过程完全静默进行，不影响用户操作
- 翻译完成后更新数据库中的 translatedText 字段

**File**: `src/main/services/ASRSubtitleService.ts`

#### Scenario: ASR-015-01: 自动翻译触发

```typescript
// 在 generateSubtitle 方法的字幕保存后
if (subtitleLibraryId && configManager.getZhipuApiKey()) {
  // 应该启动后台翻译任务
  // 不应该阻塞字幕生成流程
}
```

#### Scenario: ASR-015-02: 翻译失败处理

```typescript
// 翻译任务失败时
// 应该记录错误日志
// 不应该影响字幕生成的成功状态
// 原始字幕应该正常显示给用户
```

### 数据库层集成

#### Requirement: DB-010: 添加批量更新翻译方法

**Description**: 在数据访问层添加批量更新字幕翻译的方法

**Acceptance Criteria**:

- 添加 `updateSubtitleTranslations(subtitleLibraryId, translations)` 方法
- 接收字幕 ID 和翻译文本的映射
- 支持事务处理，确保数据一致性
- 提供详细的错误信息和统计结果

**File**: `src/main/db/dao.ts`

#### Scenario: DB-010-01: 批量更新实现

```typescript
const result = await db.subtitleLibrary.updateSubtitleTranslations(subtitleLibraryId, translations)
// 应该返回更新统计信息
// 应该处理部分更新的情况
```

## 技术约束

- **当前版本仅支持翻译为中文**（代码中需要 TODO 标记未来扩展）
- **使用 zhipu-ai-provider npm 包**（已安装）
- **遵循项目的异步文件操作规范**
- **使用 loggerService 记录日志**

## 性能要求

- 批量处理大小：10-20 条字幕/批次
- 并发批次数量：最多 2 个
- 重试策略：指数退避，最多 3 次重试
- 翻译过程必须在后台进行，不阻塞用户操作
