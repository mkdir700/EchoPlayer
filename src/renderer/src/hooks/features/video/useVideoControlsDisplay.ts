import { useState, useRef, useCallback, useEffect } from 'react'
import { useVideoPlayState } from './useVideoPlayerHooks'

interface UseVideoControlsDisplayReturn {
  showControls: boolean
  showControlsWithTimeout: (timeout?: number) => void
  handleMouseEnter: () => void
  handleMouseLeave: () => void
  handleMouseMove: () => void
  handleWordHoverForControls: (isHovering: boolean) => void
}

/**
 * 视频控制栏显示逻辑的内聚 Hook
 * Video controls display logic cohesion hook
 *
 * 管理控制栏的显示/隐藏逻辑，包括：
 * - 鼠标悬停显示
 * - 自动隐藏定时器
 * - 播放状态响应
 * - 节流优化
 */
export const useVideoControlsDisplay = (): UseVideoControlsDisplayReturn => {
  const isPlaying = useVideoPlayState()

  // 控制栏显示状态
  const [showControls, setShowControls] = useState(false)

  // 定时器引用
  const hideControlsTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastMouseMoveTimeRef = useRef(0)

  // 显示控制栏并设置自动隐藏定时器
  const showControlsWithTimeout = useCallback((timeout: number = 3000) => {
    setShowControls(true)

    if (hideControlsTimeoutRef.current) {
      clearTimeout(hideControlsTimeoutRef.current)
    }

    hideControlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false)
    }, timeout)
  }, [])

  // 鼠标进入视频区域
  const handleMouseEnter = useCallback((): void => {
    showControlsWithTimeout()
  }, [showControlsWithTimeout])

  // 鼠标离开视频区域
  const handleMouseLeave = useCallback((): void => {
    hideControlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false)
    }, 2000) // 2秒后隐藏
  }, [])

  // 节流的鼠标移动处理
  const handleMouseMove = useCallback((): void => {
    const now = Date.now()
    const timeSinceLastMove = now - lastMouseMoveTimeRef.current

    // 如果已经显示控制栏且时间间隔小于100ms，则跳过更新
    if (showControls && timeSinceLastMove < 100) {
      return
    }

    lastMouseMoveTimeRef.current = now

    // 只有在控制栏未显示时才更新状态
    if (!showControls) {
      setShowControls(true)
    }

    // 重置定时器
    if (hideControlsTimeoutRef.current) {
      clearTimeout(hideControlsTimeoutRef.current)
    }

    hideControlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false)
    }, 3000) // 3秒无操作后隐藏
  }, [showControls])

  // 字幕单词悬停显示控制栏
  const handleWordHoverForControls = useCallback((isHovering: boolean) => {
    if (isHovering) {
      setShowControls(true)
    }
  }, [])

  // 播放状态变化时的控制逻辑
  useEffect(() => {
    if (!isPlaying) {
      setShowControls(true)
      if (hideControlsTimeoutRef.current) {
        clearTimeout(hideControlsTimeoutRef.current)
      }
    } else {
      hideControlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false)
      }, 3000)
    }
  }, [isPlaying])

  // 清理定时器
  useEffect(() => {
    return () => {
      if (hideControlsTimeoutRef.current) {
        clearTimeout(hideControlsTimeoutRef.current)
      }
    }
  }, [])

  return {
    showControls,
    showControlsWithTimeout,
    handleMouseEnter,
    handleMouseLeave,
    handleMouseMove,
    handleWordHoverForControls
  }
}
