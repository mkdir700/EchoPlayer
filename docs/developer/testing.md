# 高效测试标识符管理指南

## 概述

本指南介绍如何在 EchoLab 项目中高效地添加和管理测试标识符（`data-testid`），避免逐个手动添加的低效方式。

## 核心工具

### 1. 测试工具函数 (`src/renderer/src/utils/test-utils.ts`)

提供标准化的测试标识符生成和管理功能：

```typescript
import { testId, withTestId, COMMON_TEST_IDS } from '@renderer/utils/test-utils'

// 生成标准化测试ID
const videoPlayerId = testId('video', 'player') // "echolab-video-player"

// 生成属性对象
const testProps = withTestId(videoPlayerId) // { 'data-testid': 'echolab-video-player' }
```

### 2. React Hook (`src/renderer/src/hooks/useTestIds.ts`)

自动为组件生成测试标识符：

```typescript
import { useTestIds } from '@renderer/hooks/useTestIds'

function VideoPlayer() {
  const testIds = useTestIds('video-player', {
    container: 'container',
    playButton: 'play-button',
    progressBar: 'progress-bar'
  })

  return (
    <div {...testIds.withTestId('container')}>
      <button {...testIds.withTestId('playButton')}>播放</button>
      <div {...testIds.withTestId('progressBar')} />
    </div>
  )
}
```

## 最佳实践

### 1. 使用预定义常量

```typescript
import { COMMON_TEST_IDS } from '@renderer/utils/test-utils'

// 好的做法 - 使用常量
<div data-testid={COMMON_TEST_IDS.VIDEO_PLAYER}>

// 避免 - 硬编码字符串
<div data-testid="video-player">
```

### 2. 组件级别的测试ID管理

```typescript
// 为每个组件定义测试ID映射
const VIDEO_PLAYER_TEST_IDS = {
  container: 'container',
  playButton: 'play-button',
  pauseButton: 'pause-button',
  progressBar: 'progress-bar',
  volumeControl: 'volume-control'
} as const

function VideoPlayer() {
  const testIds = useTestIds('video-player', VIDEO_PLAYER_TEST_IDS)

  return (
    <div {...testIds.withTestId('container')}>
      {/* 其他元素 */}
    </div>
  )
}
```

### 3. 动态列表的测试ID

```typescript
import { subtitleItemTestId } from '@renderer/utils/test-utils'

function SubtitleList({ subtitles }) {
  return (
    <ul data-testid={COMMON_TEST_IDS.SUBTITLE_LIST}>
      {subtitles.map((subtitle, index) => (
        <li key={subtitle.id} data-testid={subtitleItemTestId(index)}>
          {subtitle.text}
        </li>
      ))}
    </ul>
  )
}
```

### 4. 条件性测试ID（开发/测试环境）

```typescript
import { devTestId } from '@renderer/utils/test-utils'

function ProductionComponent() {
  return (
    <div {...devTestId('debug-panel')}>
      {/* 只在开发/测试环境中添加测试ID */}
    </div>
  )
}
```

## 实际应用示例

### 示例 1：视频播放器组件

```typescript
import React from 'react'
import { useTestIds } from '@renderer/hooks/useTestIds'

const PLAYER_ELEMENTS = {
  container: 'container',
  video: 'video-element',
  playButton: 'play-button',
  pauseButton: 'pause-button',
  progressBar: 'progress-bar',
  timeDisplay: 'time-display'
} as const

export function VideoPlayer() {
  const testIds = useTestIds('video-player', PLAYER_ELEMENTS)

  return (
    <div className="video-player" {...testIds.withTestId('container')}>
      <video {...testIds.withTestId('video')} />

      <div className="controls">
        <button {...testIds.withTestId('playButton')}>播放</button>
        <button {...testIds.withTestId('pauseButton')}>暂停</button>
        <div {...testIds.withTestId('progressBar')} />
        <span {...testIds.withTestId('timeDisplay')}>00:00</span>
      </div>
    </div>
  )
}
```

### 示例 2：字幕列表组件

```typescript
import React from 'react'
import { useTestIds, useListItemTestIds } from '@renderer/hooks/useTestIds'

const SUBTITLE_ELEMENTS = {
  container: 'container',
  list: 'list',
  emptyState: 'empty-state'
} as const

export function SubtitleList({ subtitles }) {
  const testIds = useTestIds('subtitle-list', SUBTITLE_ELEMENTS)
  const itemTestIds = useListItemTestIds('subtitle', subtitles)

  if (subtitles.length === 0) {
    return (
      <div {...testIds.withTestId('emptyState')}>
        暂无字幕
      </div>
    )
  }

  return (
    <div {...testIds.withTestId('container')}>
      <ul {...testIds.withTestId('list')}>
        {itemTestIds.map(({ item, withTestId }) => (
          <li key={item.id} {...withTestId()}>
            {item.text}
          </li>
        ))}
      </ul>
    </div>
  )
}
```

## E2E 测试中的使用

```typescript
import { TEST_IDS, testSelector } from './test-constants'

test('视频播放功能', async ({ page }) => {
  // 使用统一的测试选择器
  await page.click(testSelector(TEST_IDS.PLAY_BUTTON))
  await expect(page.locator(testSelector(TEST_IDS.VIDEO_PLAYER))).toBeVisible()

  // 动态生成的测试ID
  await page.click(testSelector(subtitleItemTestId(0)))
})
```

## 优势总结

1. **标准化**：统一的命名规范和生成规则
2. **类型安全**：TypeScript 类型检查，避免拼写错误
3. **可维护性**：集中管理，易于重构和更新
4. **开发效率**：批量生成，减少重复代码
5. **一致性**：自动保证测试ID的一致性格式
6. **条件性**：可以根据环境条件添加测试ID

## 迁移策略

1. **新组件**：直接使用新的测试工具
2. **现有组件**：逐步迁移，优先处理核心功能组件
3. **测试文件**：更新 E2E 测试以使用新的测试ID常量

通过这些工具和最佳实践，你可以高效地管理测试标识符，避免逐个手动添加的繁琐工作。
