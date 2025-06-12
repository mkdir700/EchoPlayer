# 版本渠道映射文档 / Version Channel Mapping Documentation

## 概述 / Overview

EchoLab 应用程序实现了基于版本字符串的自动更新渠道检测功能。系统能够根据应用程序的版本号自动确定适当的更新渠道，无需用户手动配置。

EchoLab application implements automatic update channel detection based on version strings. The system can automatically determine the appropriate update channel based on the application's version number without requiring manual user configuration.

## 支持的更新渠道 / Supported Update Channels

| 渠道 / Channel | 描述 / Description                                                                                          | 优先级 / Priority |
| -------------- | ----------------------------------------------------------------------------------------------------------- | ----------------- |
| `dev`          | 开发版本，包含最新的开发功能和修复 / Development versions with latest features and fixes                    | 最高 / Highest    |
| `alpha`        | Alpha 预发布版本，功能相对稳定但可能有bug / Alpha pre-release versions, relatively stable but may have bugs | 高 / High         |
| `beta`         | Beta 预发布版本，接近正式发布 / Beta pre-release versions, close to final release                           | 中 / Medium       |
| `stable`       | 稳定发布版本，经过充分测试 / Stable release versions, thoroughly tested                                     | 低 / Low          |

## 版本后缀模式 / Version Suffix Patterns

### 开发版本 / Development Versions

- **模式 / Pattern**: `-dev` 或 `-dev.{number}`
- **渠道 / Channel**: `dev`
- **示例 / Examples**:
  - `0.2.0-dev`
  - `0.2.0-dev.1`
  - `1.0.0-dev.5`

### 测试版本 / Test Versions

- **模式 / Pattern**: `-test` 或 `-test.{number}`
- **渠道 / Channel**: `dev` (映射到开发渠道)
- **示例 / Examples**:
  - `0.2.0-test`
  - `0.2.0-test.1`
  - `1.0.0-test.3`

### Alpha 版本 / Alpha Versions

- **模式 / Pattern**: `-alpha` 或 `-alpha.{number}`
- **渠道 / Channel**: `alpha`
- **示例 / Examples**:
  - `0.2.0-alpha`
  - `0.2.0-alpha.1`
  - `1.0.0-alpha.5`

### Beta 版本 / Beta Versions

- **模式 / Pattern**: `-beta` 或 `-beta.{number}`
- **渠道 / Channel**: `beta`
- **示例 / Examples**:
  - `0.2.0-beta`
  - `0.2.0-beta.1`
  - `1.0.0-beta.3`

### 稳定版本 / Stable Versions

- **模式 / Pattern**: 无后缀，仅版本号 / No suffix, version number only
- **渠道 / Channel**: `stable`
- **示例 / Examples**:
  - `0.2.0`
  - `1.0.0`
  - `2.1.5`

## 渠道选择逻辑 / Channel Selection Logic

系统使用以下优先级顺序来确定更新渠道：

The system uses the following priority order to determine the update channel:

1. **用户手动设置 / User Manual Setting**: 如果用户在设置中手动选择了非默认渠道，优先使用用户设置
2. **版本自动检测 / Version Auto-Detection**: 基于当前应用版本的后缀自动检测渠道
3. **默认回退 / Default Fallback**: 如果无法识别版本格式，默认使用 `stable` 渠道

### 实现细节 / Implementation Details

```typescript
function getEffectiveUpdateChannel(): string {
  const currentVersion = app.getVersion()
  const detectedChannel = getUpdateChannel(currentVersion)
  const settings = getUpdateSettings()

  // 优先使用用户设置的非默认渠道
  const userChannel = settings.updateChannel
  const effectiveChannel = userChannel && userChannel !== 'stable' ? userChannel : detectedChannel

  return effectiveChannel
}
```

## API 接口 / API Interface

### IPC 处理器 / IPC Handlers

#### `get-version-info`

获取当前版本的详细信息，包括检测到的渠道和模式匹配信息。

Get detailed information about the current version, including detected channel and pattern matching info.

**返回 / Returns**: `VersionInfo`

```typescript
interface VersionInfo {
  version: string
  channel: UpdateChannel
  pattern: VersionSuffixPattern | null
  isValid: boolean
}
```

#### `get-auto-detected-channel`

获取基于当前版本自动检测的更新渠道。

Get the auto-detected update channel based on the current version.

**返回 / Returns**: `string` (渠道名称 / Channel name)

#### `get-effective-update-channel`

获取实际使用的更新渠道（考虑用户设置和自动检测）。

Get the effective update channel (considering user settings and auto-detection).

**返回 / Returns**: `string` (有效渠道名称 / Effective channel name)

## 使用示例 / Usage Examples

### 前端获取版本信息 / Frontend Getting Version Info

```typescript
// 获取详细版本信息
const versionInfo = await window.electron.ipcRenderer.invoke('get-version-info')
console.log('当前版本:', versionInfo.version)
console.log('检测到的渠道:', versionInfo.channel)
console.log('是否有效格式:', versionInfo.isValid)

// 获取有效的更新渠道
const effectiveChannel = await window.electron.ipcRenderer.invoke('get-effective-update-channel')
console.log('实际使用的更新渠道:', effectiveChannel)
```

### 后端日志示例 / Backend Logging Example

```
[INFO] 版本信息: {
  version: "0.2.0-alpha.3",
  detectedChannel: "alpha",
  isValid: true,
  pattern: "alpha"
}

[INFO] 渠道选择逻辑: {
  currentVersion: "0.2.0-alpha.3",
  detectedChannel: "alpha",
  userSetChannel: "stable",
  effectiveChannel: "alpha"
}

[INFO] 使用更新渠道: alpha
```

## 测试验证 / Testing and Validation

系统包含完整的单元测试套件，验证以下功能：

The system includes a comprehensive unit test suite that validates:

- ✅ 各种版本后缀的正确识别 / Correct identification of various version suffixes
- ✅ 渠道映射的准确性 / Accuracy of channel mapping
- ✅ 无效输入的优雅处理 / Graceful handling of invalid inputs
- ✅ 优先级逻辑的正确性 / Correctness of priority logic
- ✅ 边界情况的处理 / Handling of edge cases

### 运行测试 / Running Tests

```bash
npm test -- src/test/utils/version-parser.test.ts
```

## 故障排除 / Troubleshooting

### 常见问题 / Common Issues

1. **版本格式无法识别 / Version Format Not Recognized**

   - 确保版本号遵循 `major.minor.patch[-suffix[.number]]` 格式
   - 检查后缀是否为支持的类型（dev, test, alpha, beta）

2. **渠道检测不正确 / Incorrect Channel Detection**

   - 检查版本字符串是否包含额外的空格或特殊字符
   - 验证后缀的拼写是否正确

3. **用户设置未生效 / User Settings Not Taking Effect**
   - 确认用户设置的渠道不是默认的 `stable`
   - 检查设置存储是否正常工作

### 调试信息 / Debug Information

启用详细日志记录以获取更多调试信息：

Enable verbose logging for more debug information:

```typescript
Logger.transports.file.level = 'debug'
```

日志将包含版本解析的详细过程和渠道选择逻辑。

Logs will include detailed version parsing process and channel selection logic.
