import { useEffect, useRef } from 'react'
import { useSubtitleDisplayMode } from '@renderer/hooks/features/video/useVideoPlaybackHooks'
import type { DisplayMode } from '@renderer/types'

interface UseSubtitleModeMonitorProps {
  onModeChange: (mode: DisplayMode) => void // 模式变化时的回调 / Callback when mode changes
}

/**
 * Hook for monitoring subtitle mode changes and triggering overlay display
 * 监听字幕模式变化并触发覆盖层显示的Hook
 *
 * Features:
 * - Detects subtitle mode changes
 * - Triggers callback when mode changes
 * - Prevents initial trigger on mount
 *
 * 特性：
 * - 检测字幕模式变化
 * - 模式变化时触发回调
 * - 防止组件挂载时的初始触发
 */
export function useSubtitleModeMonitor({ onModeChange }: UseSubtitleModeMonitorProps): void {
  const displayMode = useSubtitleDisplayMode()
  const previousModeRef = useRef<DisplayMode>(displayMode)
  const isInitialMountRef = useRef(true)

  useEffect(() => {
    // 跳过初始挂载时的触发 / Skip initial mount trigger
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false
      previousModeRef.current = displayMode
      return
    }

    // 检查模式是否真的发生了变化 / Check if mode actually changed
    if (previousModeRef.current !== displayMode) {
      console.log(`🎬 字幕模式变化: ${previousModeRef.current} → ${displayMode}`)
      onModeChange(displayMode)
      previousModeRef.current = displayMode
    }
  }, [displayMode, onModeChange])
}
