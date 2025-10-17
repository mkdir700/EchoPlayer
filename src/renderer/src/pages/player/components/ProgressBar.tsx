import { COMPONENT_TOKENS } from '@renderer/infrastructure/styles/theme'
import { formatTime } from '@renderer/state/infrastructure/utils'
import { usePlayerStore } from '@renderer/state/stores/player.store'
import { usePlayerUIStore } from '@renderer/state/stores/player-ui.store'
import { PerformanceMonitor } from '@renderer/utils/PerformanceMonitor'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import styled from 'styled-components'

import { usePlayerCommands } from '../hooks/usePlayerCommands'

const formatTimeOnly = (time: number): string => {
  return formatTime(time)
}

const INACTIVITY_TIMEOUT = 3000 // 3 seconds

function ProgressBar() {
  const currentTime = usePlayerStore((s) => s.currentTime)
  const duration = usePlayerStore((s) => s.duration)
  const { seekToUser } = usePlayerCommands()

  // 从 PlayerUIStore 获取视频区域悬停状态
  const videoAreaHovered = usePlayerUIStore((s) => s.videoAreaHovered)
  const lastVideoAreaInteraction = usePlayerUIStore((s) => s.lastVideoAreaInteraction)

  // 进度条状态管理
  const [isHovering, setIsHovering] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [previewTime, setPreviewTime] = useState<number | null>(null)
  const [bufferProgress, setBufferProgress] = useState(0)

  // 引用管理
  const progressBarRef = useRef<HTMLDivElement>(null)
  const hideTimeoutRef = useRef<number | null>(null)
  const dragStartRef = useRef(false)

  // 自动隐藏逻辑
  useEffect(() => {
    if (isHovering || isDragging || videoAreaHovered) {
      setIsVisible(true)
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current)
      }
    } else {
      hideTimeoutRef.current = window.setTimeout(() => {
        setIsVisible(false)
      }, COMPONENT_TOKENS.PROGRESS_BAR.AUTO_HIDE_DELAY)
    }

    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current)
      }
    }
  }, [isHovering, isDragging, videoAreaHovered])

  // 视频区域不活动自动隐藏逻辑
  useEffect(() => {
    if (!videoAreaHovered) {
      return
    }

    const timer = window.setTimeout(() => {
      const elapsed = Date.now() - lastVideoAreaInteraction
      if (elapsed >= INACTIVITY_TIMEOUT) {
        setIsVisible(false)
      }
    }, INACTIVITY_TIMEOUT)

    return () => clearTimeout(timer)
  }, [videoAreaHovered, lastVideoAreaInteraction])

  // 模拟缓冲进度（实际项目中应从视频元素获取）
  useEffect(() => {
    if (duration && currentTime) {
      // 简单模拟：缓冲进度稍微领先播放进度
      const simulatedBuffer = Math.min((currentTime + 30) / duration, 1)
      setBufferProgress(simulatedBuffer)
    }
  }, [currentTime, duration])

  const handleProgressChange = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (!duration || !progressBarRef.current) return

      const m = new PerformanceMonitor('handleProgressChange')
      const rect = progressBarRef.current.getBoundingClientRect()
      const clickX = event.clientX - rect.left
      const progress = Math.max(0, Math.min(1, clickX / rect.width))
      const newTime = progress * duration

      seekToUser(newTime)
      m.finish()
    },
    [duration, seekToUser]
  )

  const handleMouseDown = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (event.button !== 0) return // 只处理左键

      setIsDragging(true)
      dragStartRef.current = true
      handleProgressChange(event)

      const handleMouseMove = (e: MouseEvent) => {
        if (!duration || !progressBarRef.current || !dragStartRef.current) return

        const rect = progressBarRef.current.getBoundingClientRect()
        const clickX = e.clientX - rect.left
        const progress = Math.max(0, Math.min(1, clickX / rect.width))
        const newTime = progress * duration

        seekToUser(newTime)
      }

      const handleMouseUp = () => {
        setIsDragging(false)
        dragStartRef.current = false
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }

      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    },
    [duration, seekToUser, handleProgressChange]
  )

  const handleMouseEnter = useCallback(() => {
    setIsHovering(true)
  }, [])

  const handleMouseLeave = useCallback(() => {
    setIsHovering(false)
    setPreviewTime(null)
  }, [])

  const handleMouseMove = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (!duration || !progressBarRef.current || isDragging) return

      const rect = progressBarRef.current.getBoundingClientRect()
      const hoverX = event.clientX - rect.left
      const progress = Math.max(0, Math.min(1, hoverX / rect.width))
      const hoverTime = progress * duration

      setPreviewTime(hoverTime)
    },
    [duration, isDragging]
  )

  // 计算当前进度百分比
  const progressPercentage = useMemo(() => {
    if (!duration || !currentTime) return 0
    return Math.max(0, Math.min(100, (currentTime / duration) * 100))
  }, [currentTime, duration])

  // 计算缓冲进度百分比
  const bufferPercentage = useMemo(() => {
    return Math.max(0, Math.min(100, bufferProgress * 100))
  }, [bufferProgress])

  // 预览时间显示
  const previewTimeDisplay = useMemo(() => {
    return previewTime !== null ? formatTimeOnly(previewTime) : null
  }, [previewTime])

  return (
    <ProgressContainer
      ref={progressBarRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
      onMouseDown={handleMouseDown}
      $isVisible={isVisible}
      $isHovering={isHovering}
      $isDragging={isDragging}
    >
      {/* 缓冲进度条 */}
      <BufferTrack $progress={bufferPercentage} />

      {/* 主进度轨道 */}
      <ProgressTrack $isActive={isHovering || isDragging || videoAreaHovered} />

      {/* 已播放进度 */}
      <ProgressFill
        $progress={progressPercentage}
        $isActive={isHovering || isDragging || videoAreaHovered}
      />

      {/* 手柄 */}
      <ProgressHandle
        $progress={progressPercentage}
        $isVisible={isHovering || isDragging || videoAreaHovered}
      />

      {/* 时间预览提示 */}
      {previewTimeDisplay && isHovering && !isDragging && (
        <TimePreview $show={true}>{previewTimeDisplay}</TimePreview>
      )}
    </ProgressContainer>
  )
}

export default ProgressBar

// Netflix 风格进度条容器
const ProgressContainer = styled.div<{
  $isVisible: boolean
  $isHovering: boolean
  $isDragging: boolean
}>`
  position: relative;
  width: 100%;
  cursor: pointer;
  display: flex;
  align-items: center;

  /* 扩大的鼠标交互区域 - 悬停时增加可点击范围 */
  &::before {
    content: '';
    position: absolute;
    top: ${(props) =>
      props.$isHovering || props.$isDragging || props.$isVisible ? '-12px' : '-8px'};
    left: 0;
    right: 0;
    bottom: ${(props) =>
      props.$isHovering || props.$isDragging || props.$isVisible ? '-12px' : '-8px'};
    z-index: 1;
    transition:
      top ${COMPONENT_TOKENS.PROGRESS_BAR.TRANSITION_SMOOTH},
      bottom ${COMPONENT_TOKENS.PROGRESS_BAR.TRANSITION_SMOOTH};
  }
`

// 缓冲进度条
const BufferTrack = styled.div<{ $progress: number }>`
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: ${(props) => props.$progress}%;
  background: var(--ant-color-text-tertiary, rgba(255, 255, 255, 0.3));
  opacity: ${COMPONENT_TOKENS.PROGRESS_BAR.BUFFER_OPACITY};
  border-radius: ${COMPONENT_TOKENS.PROGRESS_BAR.TRACK_BORDER_RADIUS}px;
  transition: all ${COMPONENT_TOKENS.PROGRESS_BAR.TRANSITION_SMOOTH};
  z-index: 1;

  /* 主题适配 */
  [theme-mode='light'] & {
    background: var(--ant-color-text-tertiary, rgba(0, 0, 0, 0.1));
  }

  [theme-mode='dark'] & {
    background: var(--ant-color-text-tertiary, rgba(255, 255, 255, 0.3));
  }
`

// 主进度轨道
const ProgressTrack = styled.div<{ $isActive: boolean }>`
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 100%;
  height: ${(props) =>
    props.$isActive
      ? COMPONENT_TOKENS.PROGRESS_BAR.TRACK_HEIGHT_HOVER
      : COMPONENT_TOKENS.PROGRESS_BAR.TRACK_HEIGHT_HIDDEN}px;
  background: var(--ant-color-border, rgba(255, 255, 255, 0.2));
  opacity: ${(props) =>
    props.$isActive
      ? COMPONENT_TOKENS.PROGRESS_BAR.RAIL_OPACITY_HOVER
      : COMPONENT_TOKENS.PROGRESS_BAR.RAIL_OPACITY_BASE};
  border-radius: ${COMPONENT_TOKENS.PROGRESS_BAR.TRACK_BORDER_RADIUS}px;
  transition: all ${COMPONENT_TOKENS.PROGRESS_BAR.TRANSITION_SMOOTH};
  z-index: 2;

  /* 主题适配 */
  [theme-mode='light'] & {
    background: var(--ant-color-border, rgba(0, 0, 0, 0.15));
  }

  [theme-mode='dark'] & {
    background: var(--ant-color-border, rgba(255, 255, 255, 0.2));
  }
`

// 已播放进度填充
const ProgressFill = styled.div<{ $progress: number; $isActive: boolean }>`
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: ${(props) => props.$progress}%;
  height: ${(props) =>
    props.$isActive
      ? COMPONENT_TOKENS.PROGRESS_BAR.TRACK_HEIGHT_HOVER
      : COMPONENT_TOKENS.PROGRESS_BAR.TRACK_HEIGHT_HIDDEN}px;
  background: ${COMPONENT_TOKENS.PROGRESS_BAR.PROGRESS_GRADIENT};
  border-radius: ${COMPONENT_TOKENS.PROGRESS_BAR.TRACK_BORDER_RADIUS}px;
  transition: all ${COMPONENT_TOKENS.PROGRESS_BAR.TRANSITION_SMOOTH};
  z-index: 3;

  /* 主题色光晕效果 */
  box-shadow: ${(props) =>
    props.$isActive
      ? COMPONENT_TOKENS.PROGRESS_BAR.PROGRESS_GLOW_HOVER
      : COMPONENT_TOKENS.PROGRESS_BAR.PROGRESS_GLOW};
`

// 进度手柄
const ProgressHandle = styled.div<{
  $progress: number
  $isVisible: boolean
}>`
  position: absolute;
  top: 50%;
  left: ${(props) => props.$progress}%;
  transform: translate(-50%, -50%);
  width: ${COMPONENT_TOKENS.PROGRESS_BAR.HANDLE_SIZE_HOVER}px;
  height: ${COMPONENT_TOKENS.PROGRESS_BAR.HANDLE_SIZE_HOVER}px;
  background: ${COMPONENT_TOKENS.PROGRESS_BAR.HANDLE_GRADIENT};
  border-radius: ${COMPONENT_TOKENS.PROGRESS_BAR.HANDLE_BORDER_RADIUS};
  box-shadow: ${COMPONENT_TOKENS.PROGRESS_BAR.HANDLE_SHADOW};
  opacity: ${(props) =>
    props.$isVisible
      ? COMPONENT_TOKENS.PROGRESS_BAR.HANDLE_OPACITY_HOVER
      : COMPONENT_TOKENS.PROGRESS_BAR.HANDLE_OPACITY_BASE};
  transform: translate(-50%, -50%)
    scale(
      ${(props) =>
        props.$isVisible
          ? COMPONENT_TOKENS.PROGRESS_BAR.HANDLE_SCALE_HOVER
          : COMPONENT_TOKENS.PROGRESS_BAR.HANDLE_SCALE_HIDDEN}
    );
  transition: all ${COMPONENT_TOKENS.PROGRESS_BAR.TRANSITION_ELASTIC};
  z-index: 4;
`

// 时间预览提示
const TimePreview = styled.div<{ $show: boolean }>`
  position: absolute;
  top: -35px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: ${COMPONENT_TOKENS.PROGRESS_BAR.TIME_FONT_SIZE}px;
  font-weight: 500;
  white-space: nowrap;
  opacity: ${(props) => (props.$show ? COMPONENT_TOKENS.PROGRESS_BAR.TIME_OPACITY : 0)};
  transform: translateX(-50%) translateY(${(props) => (props.$show ? 0 : 5)}px);
  transition: all ${COMPONENT_TOKENS.PROGRESS_BAR.TRANSITION_FAST};
  pointer-events: none;
  z-index: 5;

  /* 小三角箭头 */
  &::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border: 4px solid transparent;
    border-top-color: rgba(0, 0, 0, 0.8);
  }
`
