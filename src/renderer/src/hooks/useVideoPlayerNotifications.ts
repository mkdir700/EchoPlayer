import { useEffect } from 'react'
import { useFullscreenMode } from './useFullscreenMode'

interface UseVideoPlayerNotificationsProps {
  onFullscreenToggle?: (isFullscreen: boolean) => void
  onVideoReady?: () => void
}

/**
 * 视频播放器通知功能的内聚 Hook
 * Video player notifications functionality cohesion hook
 *
 * 管理视频播放器的外部通知，包括：
 * - 全屏状态变化通知
 * - 视频就绪通知
 */
export const useVideoPlayerNotifications = ({
  onFullscreenToggle
}: UseVideoPlayerNotificationsProps): void => {
  const { isFullscreen } = useFullscreenMode()

  // 监听全屏状态变化并通知父组件
  useEffect(() => {
    onFullscreenToggle?.(isFullscreen)
  }, [isFullscreen, onFullscreenToggle])

  // 注意：onVideoReady 的处理在 VideoPlayer 中的 handleReactPlayerReady 回调中
  // 这里只是为了类型完整性包含在接口中
}
