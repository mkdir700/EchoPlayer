import { formatTime } from '@renderer/state/infrastructure/utils'
import { usePlayerStore } from '@renderer/state/stores/player.store'
import { PerformanceMonitor } from '@renderer/utils/PerformanceMonitor'
import { Slider } from 'antd'
import React, { useCallback, useRef } from 'react'
import styled from 'styled-components'

import { usePlayerCommandsOrchestrated } from '../hooks/usePlayerCommandsOrchestrated'

/**
 * 独立的进度条 + 时间显示组件
 */
function ProgressSection() {
  const currentTime = usePlayerStore((s) => s.currentTime)
  const duration = usePlayerStore((s) => s.duration)
  const { seekToUser } = usePlayerCommandsOrchestrated()

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
    <ProgressRow>
      <Slider
        min={0}
        max={duration || 100}
        value={currentTime}
        onChange={handleProgressChange}
        onChangeComplete={handleDragEnd}
        tooltip={{
          formatter: (value) => formatTime(value || 0)
        }}
        disabled={!duration}
      />
      <TimeDisplaySpan>
        {formatTime(currentTime)} / {formatTime(duration)}
      </TimeDisplaySpan>
    </ProgressRow>
  )
}

export default React.memo(ProgressSection)

const ProgressRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;

  .ant-slider {
    flex: 1;
    margin: 0;

    .ant-slider-rail {
      background: var(--color-border);
      height: 4px;
      border-radius: 2px;
    }

    .ant-slider-track {
      background: var(--color-primary);
      height: 4px;
      border-radius: 2px;
    }

    .ant-slider-handle {
      width: 14px;
      height: 14px;

      &:hover {
        border-color: var(--color-primary-soft);
      }

      &::after {
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      }
    }

    &:hover {
      .ant-slider-rail {
        background: var(--color-border-hover, var(--color-border));
      }
    }

    &.ant-slider-disabled {
      .ant-slider-rail {
        background: var(--color-border-soft);
      }

      .ant-slider-track {
        background: var(--color-text-3);
      }
    }
  }
`

const TimeDisplaySpan = styled.span`
  min-width: 100px;
  text-align: center;
  color: var(--color-text-2);
  font-size: 13px;
  font-weight: 500;
  font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
  flex-shrink: 0;
  padding: 4px 8px;
`
