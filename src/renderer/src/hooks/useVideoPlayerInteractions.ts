import { useCallback } from 'react'
import { useVideoControls } from './useVideoPlayerHooks'

interface UseVideoPlayerInteractionsProps {
  showControlsWithTimeout: (timeout?: number) => void
}

interface UseVideoPlayerInteractionsReturn {
  handleVideoClick: () => void
}

/**
 * 视频播放器交互逻辑的内聚 Hook
 * Video player interactions logic cohesion hook
 *
 * 管理视频播放器的用户交互，包括：
 * - 点击播放/暂停
 * - 显示控制栏
 */
export const useVideoPlayerInteractions = ({
  showControlsWithTimeout
}: UseVideoPlayerInteractionsProps): UseVideoPlayerInteractionsReturn => {
  const { toggle } = useVideoControls()

  // 处理视频播放器点击事件
  const handleVideoClick = useCallback((): void => {
    toggle()
    showControlsWithTimeout()
  }, [toggle, showControlsWithTimeout])

  return {
    handleVideoClick
  }
}
