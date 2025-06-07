import React, { useState, useCallback, useEffect, useRef } from 'react'
import { Typography } from 'antd'
import { formatTime } from '@renderer/utils/helpers'
import styles from './VideoProgressBar.module.css'
import {
  useVideoTime,
  useVideoDuration,
  useVideoLoadState,
  useVideoControls
} from '@renderer/hooks/useVideoPlayerHooks'

const { Text } = Typography

// 使用 React.memo 优化性能，避免不必要的重渲染
export const FullScreenVideoProgressBar = React.memo((): React.JSX.Element => {
  const [isHovered, setIsHovered] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const progressBarRef = useRef<HTMLDivElement>(null)
  const progressFillRef = useRef<HTMLDivElement>(null)
  const progressHandleRef = useRef<HTMLDivElement>(null)
  const animationFrameRef = useRef<number | null>(null)

  // 使用现代化的 hooks 替代直接访问 refs
  const currentTime = useVideoTime()
  const duration = useVideoDuration()
  const isVideoLoaded = useVideoLoadState()
  const { seekTo, setDragging } = useVideoControls()

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  // 更新时间位置的通用函数 / Common function to update time position
  const updateTimePosition = useCallback(
    (clientX: number) => {
      if (!progressBarRef.current || !isVideoLoaded || duration === 0) return

      const rect = progressBarRef.current.getBoundingClientRect()
      const percentage = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
      const newTime = percentage * duration

      seekTo(Math.max(0, Math.min(duration, newTime)))
    },
    [seekTo, isVideoLoaded, duration]
  )

  // 处理鼠标按下开始拖拽 / Handle mouse down to start dragging
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!isVideoLoaded || duration === 0) return

      setIsDragging(true)
      setDragging(true) // 通知视频播放器正在拖拽

      // 禁用 transition 以获得即时响应 / Disable transitions for immediate response
      if (progressBarRef.current) {
        progressBarRef.current.style.transition = 'none'
      }
      if (progressFillRef.current) {
        progressFillRef.current.style.transition = 'none'
      }
      if (progressHandleRef.current) {
        progressHandleRef.current.style.transition = 'none'
      }

      // 立即更新位置 / Immediately update position
      updateTimePosition(e.clientX)
    },
    [updateTimePosition, isVideoLoaded, duration, setDragging]
  )

  // 处理鼠标移动 / Handle mouse move
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isDragging) {
        // 取消之前的动画帧 / Cancel previous animation frame
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current)
        }

        // 使用 requestAnimationFrame 确保流畅更新 / Use requestAnimationFrame for smooth updates
        animationFrameRef.current = requestAnimationFrame(() => {
          updateTimePosition(e.clientX)
        })
      }
    },
    [isDragging, updateTimePosition]
  )

  // 处理鼠标释放结束拖拽 / Handle mouse up to end dragging
  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    setDragging(false) // 通知视频播放器拖拽结束

    // 重新启用 transition / Re-enable transitions
    if (progressBarRef.current) {
      progressBarRef.current.style.transition = ''
    }
    if (progressFillRef.current) {
      progressFillRef.current.style.transition = ''
    }
    if (progressHandleRef.current) {
      progressHandleRef.current.style.transition = ''
    }

    // 取消待处理的动画帧 / Cancel pending animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
  }, [setDragging])

  // 处理进度条点击（非拖拽时） / Handle progress bar click (when not dragging)
  const handleProgressClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      // 如果正在拖拽，不处理点击事件 / Don't handle click if dragging
      if (isDragging) return

      updateTimePosition(event.clientX)
    },
    [updateTimePosition, isDragging]
  )

  // 添加全局鼠标事件监听 / Add global mouse event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
        // 清理待处理的动画帧 / Clean up pending animation frame
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current)
          animationFrameRef.current = null
        }
      }
    }
    // 总是返回清理函数以满足 TypeScript / Always return cleanup function for TypeScript
    return () => {}
  }, [isDragging, handleMouseMove, handleMouseUp])

  return (
    <div
      ref={progressBarRef}
      className={`${styles.progressContainer} ${isHovered ? styles.enhanced : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseDown={handleMouseDown}
      onClick={handleProgressClick}
      style={{
        cursor: isDragging ? 'grabbing' : 'pointer'
      }}
    >
      <div className={styles.progressTrack}>
        <div
          ref={progressFillRef}
          className={styles.progressFill}
          style={{ width: `${progress}%` }}
        />
        <div
          ref={progressHandleRef}
          className={styles.progressHandle}
          style={{
            left: `${progress}%`,
            transform: isDragging ? 'translate(-50%, -50%) scale(1.2)' : undefined
          }}
        />
      </div>

      {isHovered && (
        <div className={styles.timeTooltip}>
          <Text className={styles.timeText}>
            {formatTime(currentTime)} / {formatTime(duration)}
          </Text>
        </div>
      )}
    </div>
  )
})

FullScreenVideoProgressBar.displayName = 'FullScreenVideoProgressBar'
