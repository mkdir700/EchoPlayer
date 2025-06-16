import {
  useSubtitleLayoutLocked,
  useSetSubtitleLayoutLocked,
  useDisplayMode,
  useVolume,
  usePlaybackRate,
  useIsSingleLoop,
  useLoopSettings,
  useIsAutoPause,
  useSubtitleDisplay,
  useSetDisplayMode,
  useSetVolume,
  useSetPlaybackRate,
  useSetIsSingleLoop,
  useSetLoopSettings,
  useSetIsAutoPause,
  useSetSubtitleDisplay,
  useSetPlaybackSettings
} from '@renderer/stores'
import { usePlayingVideoContext } from '@renderer/hooks/core/usePlayingVideoContext'
import { VideoPlaybackSettings, SubtitleDisplaySettings, LoopSettings } from '@types_/shared'

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
  fileId: string
  // 字幕布局相关 / Subtitle layout related
  isSubtitleLayoutLocked: boolean
  setSubtitleLayoutLocked: (locked: boolean) => void
  // 播放设置相关 / Playback settings related
  displayMode: VideoPlaybackSettings['displayMode']
  volume: VideoPlaybackSettings['volume']
  playbackRate: VideoPlaybackSettings['playbackRate']
  isSingleLoop: VideoPlaybackSettings['isSingleLoop']
  loopSettings: LoopSettings
  isAutoPause: VideoPlaybackSettings['isAutoPause']
  subtitleDisplay: SubtitleDisplaySettings
  // 设置函数 / Setter functions
  setDisplayMode: (mode: VideoPlaybackSettings['displayMode']) => void
  setVolume: (volume: VideoPlaybackSettings['volume']) => void
  setPlaybackRate: (rate: VideoPlaybackSettings['playbackRate']) => void
  setIsSingleLoop: (loop: VideoPlaybackSettings['isSingleLoop']) => void
  setLoopSettings: (settings: LoopSettings) => void
  setIsAutoPause: (pause: VideoPlaybackSettings['isAutoPause']) => void
  setSubtitleDisplay: (settings: SubtitleDisplaySettings) => void
  setPlaybackSettings: (
    settings: Partial<{
      displayMode: VideoPlaybackSettings['displayMode']
      volume: VideoPlaybackSettings['volume']
      playbackRate: VideoPlaybackSettings['playbackRate']
      isSingleLoop: VideoPlaybackSettings['isSingleLoop']
      loopSettings: LoopSettings
      isAutoPause: VideoPlaybackSettings['isAutoPause']
      subtitleDisplay: SubtitleDisplaySettings
    }>
  ) => void
} {
  const { fileId } = usePlayingVideoContext()

  // 获取当前视频的配置 / Get current video configuration
  const isSubtitleLayoutLocked = useSubtitleLayoutLocked(fileId)
  const displayMode = useDisplayMode(fileId)
  const volume = useVolume(fileId)
  const playbackRate = usePlaybackRate(fileId)
  const isSingleLoop = useIsSingleLoop(fileId)
  const loopSettings = useLoopSettings(fileId)
  const isAutoPause = useIsAutoPause(fileId)
  const subtitleDisplay = useSubtitleDisplay(fileId)

  // 获取设置函数 / Get setter functions
  const setSubtitleLayoutLockedFn = useSetSubtitleLayoutLocked()
  const setDisplayModeFn = useSetDisplayMode()
  const setVolumeFn = useSetVolume()
  const setPlaybackRateFn = useSetPlaybackRate()
  const setIsSingleLoopFn = useSetIsSingleLoop()
  const setLoopSettingsFn = useSetLoopSettings()
  const setIsAutoPauseFn = useSetIsAutoPause()
  const setSubtitleDisplayFn = useSetSubtitleDisplay()
  const setPlaybackSettingsFn = useSetPlaybackSettings()

  return {
    // 当前视频的 fileId / Current video's fileId
    fileId,

    // 字幕布局锁定状态 / Subtitle layout lock state
    isSubtitleLayoutLocked,
    setSubtitleLayoutLocked: (locked: boolean) => setSubtitleLayoutLockedFn(fileId, locked),

    // 播放设置状态 / Playback settings state
    displayMode,
    volume,
    playbackRate,
    isSingleLoop,
    loopSettings,
    isAutoPause,
    subtitleDisplay,

    // 播放设置更新函数 / Playback settings update functions
    setDisplayMode: (mode: VideoPlaybackSettings['displayMode']) => setDisplayModeFn(fileId, mode),
    setVolume: (volume: VideoPlaybackSettings['volume']) => setVolumeFn(fileId, volume),
    setPlaybackRate: (rate: VideoPlaybackSettings['playbackRate']) =>
      setPlaybackRateFn(fileId, rate),
    setIsSingleLoop: (loop: VideoPlaybackSettings['isSingleLoop']) =>
      setIsSingleLoopFn(fileId, loop),
    setLoopSettings: (settings: LoopSettings) => setLoopSettingsFn(fileId, settings),
    setIsAutoPause: (pause: VideoPlaybackSettings['isAutoPause']) =>
      setIsAutoPauseFn(fileId, pause),
    setSubtitleDisplay: (settings: SubtitleDisplaySettings) =>
      setSubtitleDisplayFn(fileId, settings),
    setPlaybackSettings: (
      settings: Partial<{
        displayMode: VideoPlaybackSettings['displayMode']
        volume: VideoPlaybackSettings['volume']
        playbackRate: VideoPlaybackSettings['playbackRate']
        isSingleLoop: VideoPlaybackSettings['isSingleLoop']
        loopSettings: LoopSettings
        isAutoPause: VideoPlaybackSettings['isAutoPause']
        subtitleDisplay: SubtitleDisplaySettings
      }>
    ) => setPlaybackSettingsFn(fileId, settings)
  }
}
