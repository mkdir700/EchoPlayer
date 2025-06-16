import { useEffect, useRef } from 'react'
import { useVideoConfig } from '@renderer/hooks/features/video/useVideoConfig'

interface UsePlaybackSpeedMonitorProps {
  onSpeedChange: (speed: number) => void // 速度变化回调 / Speed change callback
}

/**
 * Hook for monitoring playback speed changes and triggering overlay display
 * 监听播放速度变化并触发覆盖层显示的Hook
 *
 * Features:
 * - Detects playback speed changes
 * - Triggers callback when speed changes
 * - Prevents initial trigger on mount
 *
 * 特性：
 * - 检测播放速度变化
 * - 速度变化时触发回调
 * - 防止组件挂载时的初始触发
 */
export function usePlaybackSpeedMonitor({ onSpeedChange }: UsePlaybackSpeedMonitorProps): void {
  const { playbackRate } = useVideoConfig()
  const previousSpeedRef = useRef<number>(playbackRate)
  const isInitialMountRef = useRef(true)

  useEffect(() => {
    // 跳过初始挂载时的触发 / Skip initial mount trigger
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false
      previousSpeedRef.current = playbackRate
      return
    }

    // 检查速度是否真的发生了变化 / Check if speed actually changed
    if (previousSpeedRef.current !== playbackRate) {
      console.log(`🚀 播放速度变化: ${previousSpeedRef.current}x → ${playbackRate}x`)
      onSpeedChange(playbackRate)
      previousSpeedRef.current = playbackRate
    }
  }, [playbackRate, onSpeedChange])
}
