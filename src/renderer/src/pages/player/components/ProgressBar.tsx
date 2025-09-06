import { formatTime } from '@renderer/state/infrastructure/utils'
import { usePlayerStore } from '@renderer/state/stores/player.store'
import { PerformanceMonitor } from '@renderer/utils/PerformanceMonitor'
import { Slider } from 'antd'
import { useCallback, useRef } from 'react'
import styled from 'styled-components'

import { usePlayerCommands } from '../hooks/usePlayerCommands'

const formatProgress = (currentTime: number, duration: number): string => {
  return `${formatTime(currentTime)} / ${formatTime(duration)}`
}

function ProgressBar() {
  const currentTime = usePlayerStore((s) => s.currentTime)
  const duration = usePlayerStore((s) => s.duration)
  const { seekToUser } = usePlayerCommands()

  // 使用 ref 来跟踪是否是第一次 onChange（开始拖拽）
  const isFirstChange = useRef(true)
  const dragTimeoutRef = useRef<number | null>(null)

  const handleProgressChange = useCallback(
    (value: number) => {
      const m = new PerformanceMonitor('handleProgressChange')

      // 第一次改变时重置循环状态
      if (isFirstChange.current) {
        isFirstChange.current = false
      }

      // 清理之前的定时器
      if (dragTimeoutRef.current) {
        clearTimeout(dragTimeoutRef.current)
      }

      // 设置定时器，在拖拽停止后一段时间后重置状态
      dragTimeoutRef.current = window.setTimeout(() => {
        isFirstChange.current = true
      }, 200)

      // 使用用户跳转方法，自动管理循环禁用状态
      seekToUser(Math.max(0, value))

      m.finish()
    },
    [seekToUser]
  )

  // 处理拖拽结束
  const handleDragEnd = useCallback(() => {
    // 重置拖拽状态
    isFirstChange.current = true

    // 清理定时器
    if (dragTimeoutRef.current) {
      clearTimeout(dragTimeoutRef.current)
      dragTimeoutRef.current = null
    }
  }, [])

  return (
    <StyledSlider
      min={0}
      max={duration || 100}
      value={currentTime}
      onChange={handleProgressChange}
      onChangeComplete={handleDragEnd}
      tooltip={{
        formatter: (value) => formatProgress(value || 0, duration || 0)
      }}
      disabled={!duration}
    />
  )
}

export default ProgressBar

// 直接样式化 Slider 组件，无容器包装
const StyledSlider = styled(Slider)`
  /* 增加选择器特异性来覆盖 Ant Design 的默认变量 */
  &.ant-slider {
    --ant-slider-rail-size: 1px !important; /* 轨道基础尺寸 */
  }

  /* 重置所有默认margin/padding */
  margin: 0 !important;
  padding: 0 !important;
  width: 100%;

  .ant-slider-horizontal {
    height: 0px; /* 移除默认高度 */
  }

  /* 轨道样式 - 默认状态 */
  .ant-slider-rail {
    background: var(--color-border);
    opacity: 0.15;
    height: 4px; /* 增加厚度，提高可见性 */
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  }

  /* 进度轨道样式 - 已播放部分 */
  .ant-slider-track {
    background: var(--color-primary);
    height: 4px; /* 增加厚度，提高可见性 */
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 0 4px var(--color-primary);
    filter: opacity(0.9);
  }

  /* 手柄样式 - 椭圆形白色手柄 */
  .ant-slider-handle {
    width: 8px;
    height: 8px;
    border: 2px solid #ffffff; /* 使用纯白色边框 */
    background: #ffffff; /* 使用纯白色背景 */
    margin-top: 1px; /* 精确居中对齐 4px 高度的轨道 */
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15); /* 使用黑色阴影而非主色 */
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    transform: scale(0.8);
    cursor: pointer;

    /* 移除默认的伪元素 */
    &::after {
      display: none !important;
    }

    /* 移除默认的方形边框 */
    &::before {
      display: none !important;
    }

    /* 手柄激活状态 */
    &:hover,
    &:focus,
    &:active {
      border-color: #ffffff;
      background: #ffffff;
      box-shadow: 0 3px 8px rgba(0, 0, 0, 0.2);
      opacity: 1;
      transform: scale(1);
    }
  }

  /* 悬停整个进度条时的效果 */
  &:hover {
    .ant-slider-rail {
      background: var(--color-border);
      opacity: 0.3;
      height: 6px; /* 悬停时增加厚度 */
      border-radius: 3px;
    }

    .ant-slider-track {
      height: 6px; /* 悬停时增加厚度 */
      border-radius: 3px;
      box-shadow: 0 0 8px var(--color-primary);
      filter: opacity(1);
    }

    .ant-slider-handle {
      opacity: 1; /* 悬停时显示手柄 */
      transform: scale(1);
      width: 14px;
      height: 14px;
      margin-top: -1px;
      border: 2px solid #ffffff;
      background: #ffffff;
      box-shadow: 0 3px 8px rgba(0, 0, 0, 0.2);
    }
  }

  /* 激活状态进一步增强 */
  &:active,
  &.ant-slider-drag {
    .ant-slider-rail {
      height: 8px;
      border-radius: 4px;
      opacity: 0.4;
    }

    .ant-slider-track {
      height: 8px;
      border-radius: 4px;
      box-shadow: 0 0 12px var(--color-primary);
    }

    .ant-slider-handle {
      width: 14px;
      height: 14px;
      margin-top: -1px;
      transform: scale(1.1);
      border: 2px solid #ffffff;
      background: #ffffff;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
    }
  }

  /* 禁用状态 */
  &.ant-slider-disabled {
    .ant-slider-rail {
      background: var(--color-border);
      opacity: 0.1;
    }

    .ant-slider-track {
      background: var(--color-text-3);
      box-shadow: none;
      filter: none;
    }

    .ant-slider-handle {
      background: rgba(255, 255, 255, 0.3); /* 禁用时半透明白色 */
      border: 2px solid rgba(255, 255, 255, 0.3);
      box-shadow: none;
      filter: none;
      border-radius: 50% !important;
    }
  }

  /* Tooltip 优化 */
  + .ant-tooltip {
    .ant-tooltip-inner {
      background: var(--color-background-soft);
      opacity: 0.95;
      backdrop-filter: blur(8px);
      border-radius: 4px;
      font-size: 11px;
      padding: 4px 8px;
      color: var(--color-text-1);
      border: 1px solid var(--color-border);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .ant-tooltip-arrow {
      &::before {
        background: var(--color-background-soft);
        border: 1px solid var(--color-border);
      }
    }
  }

  /* 主题适配 - 确保 handle 在所有主题下都是白色 */
  [theme-mode='dark'] & {
    .ant-slider-handle {
      border: 2px solid #ffffff !important;
      background: #ffffff !important;
      border-radius: 50% !important;
    }
  }

  [theme-mode='light'] & {
    .ant-slider-handle {
      border: 2px solid #ffffff !important;
      background: #ffffff !important;
      border-radius: 50% !important;
    }

    .ant-slider-rail {
      background: var(--color-border);
      opacity: 0.2;
    }
  }
`
