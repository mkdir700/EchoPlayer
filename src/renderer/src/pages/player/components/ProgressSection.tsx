import React, { useCallback } from 'react'
import styled from 'styled-components'
import { Slider } from 'antd'
import { formatTime } from '@renderer/state/infrastructure/utils'
import { usePlayerStore } from '@renderer/state/stores/player.store'
import { PerformanceMonitor } from '@renderer/utils/PerformanceMonitor'

/**
 * 独立的进度条 + 时间显示组件
 * - 仅订阅 currentTime/duration，避免父级 TransportBar 随时间频繁重渲染
 */
function ProgressSection() {
  const currentTime = usePlayerStore((s) => s.currentTime)
  const duration = usePlayerStore((s) => s.duration)
  const setCurrentTime = usePlayerStore((s) => s.setCurrentTime)

  const seekTo = useCallback(
    (time: number) => {
      setCurrentTime(Math.max(0, time))
    },
    [setCurrentTime]
  )

  const handleProgressChange = useCallback(
    (value: number) => {
      const m = new PerformanceMonitor('handleProgressChange')
      seekTo(value)
      m.finish()
    },
    [seekTo]
  )

  return (
    <ProgressRow>
      <Slider
        min={0}
        max={duration || 100}
        value={currentTime}
        onChange={handleProgressChange}
        tooltip={{ formatter: (value) => formatTime(value || 0) }}
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

