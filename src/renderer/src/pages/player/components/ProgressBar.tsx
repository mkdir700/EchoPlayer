import { useTheme } from '@renderer/contexts/theme.context'
import { COMPONENT_TOKENS } from '@renderer/infrastructure/styles/theme'
import { formatTime } from '@renderer/state/infrastructure/utils'
import { usePlayerStore } from '@renderer/state/stores/player.store'
import { PerformanceMonitor } from '@renderer/utils/PerformanceMonitor'
import { Slider } from 'antd'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import styled from 'styled-components'

import { usePlayerCommands } from '../hooks/usePlayerCommands'

const formatProgress = (currentTime: number, duration: number): string => {
  return `${formatTime(currentTime)} / ${formatTime(duration)}`
}

function ProgressBar() {
  const currentTime = usePlayerStore((s) => s.currentTime)
  const duration = usePlayerStore((s) => s.duration)
  const { seekToUser } = usePlayerCommands()
  const { token } = useTheme()

  // 使用 ref 来跟踪是否是第一次 onChange（开始拖拽）
  const isFirstChange = useRef(true)
  const dragTimeoutRef = useRef<number | null>(null)

  // 跟踪悬停和拖动状态
  const [isHovering, setIsHovering] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  // 清理定时器（组件卸载）
  useEffect(() => {
    return () => {
      if (dragTimeoutRef.current) {
        clearTimeout(dragTimeoutRef.current)
      }
    }
  }, [])

  const handleProgressChange = useCallback(
    (value: number) => {
      const m = new PerformanceMonitor('handleProgressChange')

      // 第一次改变时重置循环状态并设置拖动状态
      if (isFirstChange.current) {
        isFirstChange.current = false
        setIsDragging(true)
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
    setIsDragging(false)

    // 清理定时器
    if (dragTimeoutRef.current) {
      clearTimeout(dragTimeoutRef.current)
      dragTimeoutRef.current = null
    }
  }, [])

  // 处理鼠标进入
  const handleMouseEnter = useCallback(() => {
    setIsHovering(true)
  }, [])

  // 处理鼠标离开
  const handleMouseLeave = useCallback(() => {
    setIsHovering(false)
  }, [])

  // Memoize tooltip配置避免每次渲染重建
  const tooltipConfig = useMemo(
    () => ({
      formatter: (value?: number) => formatProgress(value ?? 0, duration ?? 0)
    }),
    [duration]
  )

  // 约束value值在有效范围内
  const clampedValue = useMemo(
    () => Math.min(Math.max(0, currentTime ?? 0), duration ?? 0),
    [currentTime, duration]
  )

  return (
    <SliderWrapper onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <StyledSlider
        min={0}
        max={duration || 100}
        value={clampedValue}
        onChange={handleProgressChange}
        onChangeComplete={handleDragEnd}
        tooltip={tooltipConfig}
        disabled={!duration}
        aria-label="Progress"
        $isHovering={isHovering}
        $isDragging={isDragging}
        $token={token}
      />
    </SliderWrapper>
  )
}

export default ProgressBar

// 包装容器处理鼠标事件
const SliderWrapper = styled.div`
  width: 100%;
  cursor: pointer;
`

// 直接样式化 Slider 组件，无容器包装
const StyledSlider = styled(Slider)<{
  $isHovering: boolean
  $isDragging: boolean
  $token: any
}>`
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

  /* 轨道样式 - 默认状态 - 使用主题令牌 */
  .ant-slider-rail {
    background: var(--color-border);
    opacity: ${COMPONENT_TOKENS.PROGRESS_BAR.RAIL_OPACITY_BASE};
    height: ${COMPONENT_TOKENS.PROGRESS_BAR.TRACK_HEIGHT_BASE}px;
    transition: all ${COMPONENT_TOKENS.PROGRESS_BAR.TRANSITION_DURATION_BASE}
      ${COMPONENT_TOKENS.PROGRESS_BAR.TRANSITION_EASING};
  }

  /* 进度轨道样式 - 已播放部分 - 使用主题令牌 */
  .ant-slider-track {
    background: var(--color-primary);
    height: ${COMPONENT_TOKENS.PROGRESS_BAR.TRACK_HEIGHT_BASE}px;
    transition: all ${COMPONENT_TOKENS.PROGRESS_BAR.TRANSITION_DURATION_BASE}
      ${COMPONENT_TOKENS.PROGRESS_BAR.TRANSITION_EASING};
    box-shadow: 0 0 ${COMPONENT_TOKENS.PROGRESS_BAR.HANDLE_SHADOW_BLUR_BASE}px var(--color-primary);
    filter: opacity(0.9);
  }

  /* 手柄样式 - 沉浸式设计，与进度条统一 - 默认隐藏 - 使用主题令牌 */
  .ant-slider-handle {
    width: ${COMPONENT_TOKENS.PROGRESS_BAR.HANDLE_SIZE_BASE}px;
    height: ${COMPONENT_TOKENS.PROGRESS_BAR.HANDLE_SIZE_BASE}px;
    /* 使用渐变色，从主色到半透明白色 - 透明度来自主题令牌 */
    background: radial-gradient(
      circle,
      var(--color-primary) 0%,
      rgba(255, 255, 255, ${COMPONENT_TOKENS.PROGRESS_BAR.HANDLE_GRADIENT_INNER}) 70%,
      rgba(255, 255, 255, ${COMPONENT_TOKENS.PROGRESS_BAR.HANDLE_GRADIENT_OUTER}) 100%
    );
    /* 边框使用主题令牌透明度 */
    border: ${COMPONENT_TOKENS.PROGRESS_BAR.HANDLE_BORDER_BASE}px solid
      rgba(
        var(--color-primary-rgb, 59, 130, 246),
        ${COMPONENT_TOKENS.PROGRESS_BAR.HANDLE_BORDER_ALPHA}
      );
    /* 使用主题令牌的光晕阴影 */
    box-shadow:
      0 0 ${COMPONENT_TOKENS.PROGRESS_BAR.HANDLE_SHADOW_BLUR_BASE}px
        rgba(
          var(--color-primary-rgb, 59, 130, 246),
          ${COMPONENT_TOKENS.PROGRESS_BAR.HANDLE_SHADOW_ALPHA_BASE}
        ),
      0 ${COMPONENT_TOKENS.PROGRESS_BAR.HANDLE_SHADOW_OFFSET}px 8px rgba(0, 0, 0, 0.1);
    transition: all ${COMPONENT_TOKENS.PROGRESS_BAR.TRANSITION_DURATION_SLOW}
      ${COMPONENT_TOKENS.PROGRESS_BAR.TRANSITION_EASING};
    /* 默认完全隐藏 - 使用主题令牌缩放 */
    opacity: 0;
    transform: scale(${COMPONENT_TOKENS.PROGRESS_BAR.HANDLE_SCALE_HIDDEN});
    cursor: pointer;

    /* 移除默认的伪元素 */
    &::after {
      display: none !important;
    }

    /* 移除默认的方形边框 */
    &::before {
      display: none !important;
    }

    /* 手柄激活状态 - 使用主题令牌 */
    &:focus {
      border-color: var(--color-primary);
      background: radial-gradient(
        circle,
        var(--color-primary) 0%,
        rgba(255, 255, 255, ${COMPONENT_TOKENS.PROGRESS_BAR.HANDLE_GRADIENT_INNER}) 70%,
        rgba(255, 255, 255, ${COMPONENT_TOKENS.PROGRESS_BAR.HANDLE_GRADIENT_OUTER}) 100%
      );
      box-shadow:
        0 0 ${COMPONENT_TOKENS.PROGRESS_BAR.HANDLE_SHADOW_BLUR_BASE + 2}px
          rgba(var(--color-primary-rgb, 59, 130, 246), 0.5),
        0 3px 8px rgba(0, 0, 0, 0.15);
    }
  }

  /* 基于props的条件样式 - 悬停时显示handler - 使用主题令牌 */
  ${(props) =>
    (props.$isHovering || props.$isDragging) &&
    `
    .ant-slider-handle {
      opacity: 1 !important;
      transform: scale(${COMPONENT_TOKENS.PROGRESS_BAR.HANDLE_SCALE_HOVER}) !important;
      width: ${COMPONENT_TOKENS.PROGRESS_BAR.HANDLE_SIZE_HOVER}px !important;
      height: ${COMPONENT_TOKENS.PROGRESS_BAR.HANDLE_SIZE_HOVER}px !important;
      margin-left: -${COMPONENT_TOKENS.PROGRESS_BAR.HANDLE_SIZE_HOVER / 2}px !important;
      /* 悬停时增强渐变效果 */
      background: radial-gradient(
        circle,
        var(--color-primary) 0%,
        rgba(255, 255, 255, 0.95) 60%,
        rgba(255, 255, 255, 0.8) 100%
      ) !important;
      border: ${COMPONENT_TOKENS.PROGRESS_BAR.HANDLE_BORDER_HOVER}px solid rgba(var(--color-primary-rgb, 59, 130, 246), ${COMPONENT_TOKENS.PROGRESS_BAR.HANDLE_BORDER_ALPHA_HOVER}) !important;
      /* 增强光晕效果与进度条呼应 */
      box-shadow:
        0 0 ${COMPONENT_TOKENS.PROGRESS_BAR.HANDLE_SHADOW_BLUR_HOVER}px rgba(var(--color-primary-rgb, 59, 130, 246), ${COMPONENT_TOKENS.PROGRESS_BAR.HANDLE_SHADOW_ALPHA_HOVER}),
        0 3px 12px rgba(0, 0, 0, 0.15) !important;
    }
    .ant-slider-rail {
      height: ${COMPONENT_TOKENS.PROGRESS_BAR.TRACK_HEIGHT_HOVER}px !important;
      border-radius: ${COMPONENT_TOKENS.PROGRESS_BAR.TRACK_BORDER_RADIUS}px !important;
      opacity: ${COMPONENT_TOKENS.PROGRESS_BAR.RAIL_OPACITY_HOVER} !important;
    }
    .ant-slider-track {
      height: ${COMPONENT_TOKENS.PROGRESS_BAR.TRACK_HEIGHT_HOVER}px !important;
      border-radius: ${COMPONENT_TOKENS.PROGRESS_BAR.TRACK_BORDER_RADIUS}px !important;
      box-shadow: 0 0 ${COMPONENT_TOKENS.PROGRESS_BAR.TRACK_SHADOW_BLUR_HOVER}px var(--color-primary) !important;
      filter: opacity(1) !important;
    }
  `}

  /* 悬停整个进度条时的效果 - 仅轨道变化，handler通过props控制 - 使用主题令牌 */
  &:hover {
    .ant-slider-rail {
      background: var(--color-border);
      opacity: ${COMPONENT_TOKENS.PROGRESS_BAR.RAIL_OPACITY_HOVER};
      height: ${COMPONENT_TOKENS.PROGRESS_BAR.TRACK_HEIGHT_HOVER}px;
      border-radius: ${COMPONENT_TOKENS.PROGRESS_BAR.TRACK_BORDER_RADIUS}px;
    }

    .ant-slider-track {
      height: ${COMPONENT_TOKENS.PROGRESS_BAR.TRACK_HEIGHT_HOVER}px;
      border-radius: ${COMPONENT_TOKENS.PROGRESS_BAR.TRACK_BORDER_RADIUS}px;
      box-shadow: 0 0 ${COMPONENT_TOKENS.PROGRESS_BAR.TRACK_SHADOW_BLUR_HOVER}px
        var(--color-primary);
      filter: opacity(1);
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

  /* 主题适配 - 确保沉浸式设计在所有主题下都和谐 - 使用主题令牌 */
  [theme-mode='dark'] & {
    .ant-slider-handle {
      /* 暗色主题下的渐变调整 */
      background: radial-gradient(
        circle,
        var(--color-primary) 0%,
        rgba(255, 255, 255, 0.95) 70%,
        rgba(255, 255, 255, 0.8) 100%
      ) !important;
      border: ${COMPONENT_TOKENS.PROGRESS_BAR.HANDLE_BORDER_BASE}px solid
        rgba(var(--color-primary-rgb, 59, 130, 246), 0.7) !important;
      border-radius: 50% !important;
    }
  }

  [theme-mode='light'] & {
    .ant-slider-handle {
      /* 亮色主题下的渐变调整 */
      background: radial-gradient(
        circle,
        var(--color-primary) 0%,
        rgba(255, 255, 255, ${COMPONENT_TOKENS.PROGRESS_BAR.HANDLE_GRADIENT_INNER}) 70%,
        rgba(255, 255, 255, ${COMPONENT_TOKENS.PROGRESS_BAR.HANDLE_GRADIENT_OUTER}) 100%
      ) !important;
      border: ${COMPONENT_TOKENS.PROGRESS_BAR.HANDLE_BORDER_BASE}px solid
        rgba(
          var(--color-primary-rgb, 59, 130, 246),
          ${COMPONENT_TOKENS.PROGRESS_BAR.HANDLE_BORDER_ALPHA}
        ) !important;
      border-radius: 50% !important;
    }

    .ant-slider-rail {
      background: var(--color-border);
      opacity: 0.2;
    }
  }
`
