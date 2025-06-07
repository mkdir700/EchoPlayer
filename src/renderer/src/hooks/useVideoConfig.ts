import { useSubtitleLayoutLocked, useSetSubtitleLayoutLocked } from '../stores'
import { usePlayingVideoContext } from './usePlayingVideoContext'

/**
 * Hook for accessing video-specific configuration settings
 *
 * 用于访问视频特定配置设置的 Hook
 *
 * This hook provides a convenient way to access and modify video-level configurations
 * for the currently playing video. All configurations are automatically persisted to
 * the user data directory via Electron's main process using Zustand persist middleware
 * and will be restored when the same video is loaded again.
 *
 * 所有配置都会自动通过 Zustand 持久化中间件保存到用户数据目录，当再次加载相同视频时会自动恢复。
 */
export function useVideoConfig(): {
  isSubtitleLayoutLocked: boolean
  setSubtitleLayoutLocked: (locked: boolean) => void
  fileId: string
} {
  const { fileId } = usePlayingVideoContext()
  const isSubtitleLayoutLocked = useSubtitleLayoutLocked(fileId)
  const setSubtitleLayoutLocked = useSetSubtitleLayoutLocked()

  return {
    // 字幕布局锁定状态 / Subtitle layout lock state
    isSubtitleLayoutLocked,

    // 设置字幕布局锁定状态 / Set subtitle layout lock state
    setSubtitleLayoutLocked: (locked: boolean) => setSubtitleLayoutLocked(fileId, locked),

    // 当前视频的 fileId / Current video's fileId
    fileId
  }
}
