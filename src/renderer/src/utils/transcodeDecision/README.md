# FFmpeg 转码决策层 / FFmpeg Transcoding Decision Layer

这是一个智能的转码决策系统，根据视频兼容性和文件信息自动决定最优的转码策略。

## 主要功能 / Main Features

### 1. 智能决策 / Smart Decision Making

- 自动检测视频和音频编解码器兼容性
- 根据当前环境支持情况决定转码策略
- 支持五种转码策略：无需转码、仅音频转码、仅视频转码、完整转码、容器转换

### 2. 转码策略 / Transcoding Strategies

- **NOT_NEEDED** - 无需转码：视频完全兼容
- **AUDIO_ONLY** - 仅音频转码：视频兼容但音频不兼容（如 AC3 → AAC）
- **VIDEO_ONLY** - 仅视频转码：音频兼容但视频不兼容（如 H.265 → H.264）
- **FULL_TRANSCODE** - 完整转码：视频和音频都不兼容
- **CONTAINER_ONLY** - 容器转换：编解码器兼容但容器格式不兼容（如 MKV → MP4）

### 3. 智能参数优化 / Smart Parameter Optimization

- 根据视频分辨率自动选择最优 CRF 值
- 根据视频时长选择合适的编码预设
- 根据原始码率选择最优音频码率
- 预估转码时间和优先级

## 使用方法 / Usage

### 基本使用 / Basic Usage

```typescript
import { transcodeDecisionMaker, transcodeDecisionHelper } from '@/utils'

// 分析单个视频文件
const analysis = await transcodeDecisionHelper.analyzeVideo('/path/to/video.mkv')
console.log(analysis.recommendation)

if (analysis.canExecute) {
  // 执行转码
  const result = await transcodeDecisionHelper.executeDecision(
    '/path/to/video.mkv',
    analysis.decision,
    undefined, // 自动生成输出路径
    (progress) => {
      console.log(`转码进度: ${progress.progress}%`)
    }
  )

  if (result.success) {
    console.log('转码完成，输出文件:', result.outputPath)
  }
}
```

### 批量处理 / Batch Processing

```typescript
// 批量分析多个视频文件
const filePaths = ['/path/to/video1.mkv', '/path/to/video2.mp4', '/path/to/video3.avi']

const batchResult = await transcodeDecisionHelper.batchAnalyze(filePaths)

// 打印分析报告
console.log(transcodeDecisionHelper.generateReport(batchResult.tasks))

// 按优先级排序任务
const prioritizedTasks = transcodeDecisionHelper.sortTasksByPriority(batchResult.tasks)

// 过滤需要转码的任务
const transcodeTasks = transcodeDecisionHelper.filterTranscodeTasks(prioritizedTasks)

// 依次执行转码
for (const task of transcodeTasks) {
  const result = await transcodeDecisionHelper.executeDecision(task.filePath, task.decision)
  console.log(`${task.filePath}: ${result.success ? '成功' : '失败'}`)
}
```

### 直接使用决策器 / Direct Decision Maker Usage

```typescript
// 直接使用决策器进行决策
const decision = await transcodeDecisionMaker.makeDecision('/path/to/video.mkv')

console.log('转码策略:', decision.strategy)
console.log('原因:', decision.reason)
console.log('预计时间:', decision.estimatedTime, '秒')
console.log('优先级:', decision.priority)
console.log('转码选项:', decision.options)
```

## 决策逻辑 / Decision Logic

系统的决策逻辑基于以下因素：

1. **容器格式兼容性** - 检查文件扩展名（MP4、WebM、OGG 被支持）
2. **视频编解码器兼容性** - 检查 H.264、H.265、VP9、AV1 等支持情况
3. **音频编解码器兼容性** - 检查 AAC、AC3、DTS、Opus 等支持情况
4. **当前环境能力** - 基于浏览器/Electron 环境的实际支持情况

### 决策流程图 / Decision Flow

```
视频文件输入
    ↓
获取视频信息 (FFmpeg probe)
    ↓
检查视频编解码器兼容性
    ↓
检查音频编解码器兼容性
    ↓
检查容器格式兼容性
    ↓
根据兼容性情况决定策略:
- 完全兼容 → 无需转码
- 仅音频不兼容 → 音频转码
- 仅视频不兼容 → 视频转码
- 都不兼容 → 完整转码
- 仅容器不兼容 → 容器转换
```

## 支持的格式 / Supported Formats

### 输入格式 / Input Formats

- 视频：MP4, MKV, AVI, MOV, WMV, FLV, WebM
- 编解码器：H.264, H.265/HEVC, VP9, AV1
- 音频：AAC, AC3, DTS, MP3, FLAC, Opus

### 输出格式 / Output Formats

- 容器：MP4（推荐）
- 视频编解码器：H.264 (libx264)
- 音频编解码器：AAC

## 性能优化 / Performance Optimization

- **并行处理**：支持批量文件的并行分析
- **智能预设**：根据视频时长和分辨率选择最优编码预设
- **时间估算**：提供准确的转码时间预估
- **优先级排序**：高优先级任务优先处理

## 错误处理 / Error Handling

系统包含完善的错误处理机制：

- FFmpeg 不可用时的优雅降级
- 视频信息获取失败的安全回退
- 转码过程中的错误捕获和报告
- 批量处理中单个文件失败不影响其他文件

## 配置选项 / Configuration Options

### CRF 值选择 / CRF Value Selection

- 4K：CRF 20（保持高质量）
- 1080p：CRF 23（标准质量）
- 720p 及以下：CRF 25（较高压缩）

### 编码预设选择 / Preset Selection

- 短视频（< 1小时）：fast
- 中等时长（1-2小时）：medium
- 长视频（> 2小时）：slow

### 音频码率选择 / Audio Bitrate Selection

- 高质量视频（> 10 Mbps）：192k
- 中等质量（5-10 Mbps）：128k
- 低质量（< 5 Mbps）：96k
