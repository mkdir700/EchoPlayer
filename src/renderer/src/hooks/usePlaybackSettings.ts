import { useState, useEffect, useCallback } from 'react'
import type { PlaybackSettings } from '@types_/shared'

export interface UsePlaybackSettingsReturn {
  // 播放设置状态
  playbackSettings: PlaybackSettings
  loading: boolean
  error: string | null

  // 操作方法
  updatePlaybackSettings: (settings: Partial<PlaybackSettings>) => Promise<boolean>
  refreshPlaybackSettings: () => Promise<void>

  // 便捷方法
  setAutoScrollEnabled: (enabled: boolean) => Promise<boolean>
  setDisplayMode: (mode: PlaybackSettings['displayMode']) => Promise<boolean>
  setVolume: (volume: number) => Promise<boolean>
  setPlaybackRate: (rate: number) => Promise<boolean>
  setSingleLoop: (enabled: boolean) => Promise<boolean>
  setAutoPause: (enabled: boolean) => Promise<boolean>
}

export function usePlaybackSettings(): UsePlaybackSettingsReturn {
  const [playbackSettings, setPlaybackSettings] = useState<PlaybackSettings>({
    isAutoScrollEnabled: true,
    displayMode: 'bilingual',
    volume: 0.8,
    playbackRate: 1.0,
    isSingleLoop: false,
    isAutoPause: false
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 刷新播放设置
  const refreshPlaybackSettings = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const settings = await window.api.store.getSettings()
      setPlaybackSettings(settings.playback)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取播放设置失败'
      setError(errorMessage)
      console.error('获取播放设置失败:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // 初始化数据
  useEffect(() => {
    refreshPlaybackSettings()
  }, [refreshPlaybackSettings])

  // 更新播放设置 - 立即保存到存储
  const updatePlaybackSettings = useCallback(
    async (newSettings: Partial<PlaybackSettings>): Promise<boolean> => {
      try {
        setError(null)

        // 先更新本地状态，提供即时反馈
        const updatedSettings = { ...playbackSettings, ...newSettings }
        setPlaybackSettings(updatedSettings)

        // 立即保存到存储
        const result = await window.api.store.updateSettings({
          playback: updatedSettings
        })

        if (result.success) {
          return true
        } else {
          // 如果保存失败，回滚本地状态
          setPlaybackSettings(playbackSettings)
          setError(result.error || '更新播放设置失败')
          return false
        }
      } catch (err) {
        // 如果保存失败，回滚本地状态
        setPlaybackSettings(playbackSettings)
        const errorMessage = err instanceof Error ? err.message : '更新播放设置失败'
        setError(errorMessage)
        console.error('更新播放设置失败:', err)
        return false
      }
    },
    [playbackSettings]
  )

  // 便捷方法
  const setAutoScrollEnabled = useCallback(
    (enabled: boolean) => updatePlaybackSettings({ isAutoScrollEnabled: enabled }),
    [updatePlaybackSettings]
  )

  const setDisplayMode = useCallback(
    (mode: PlaybackSettings['displayMode']) => updatePlaybackSettings({ displayMode: mode }),
    [updatePlaybackSettings]
  )

  const setVolume = useCallback(
    (volume: number) => updatePlaybackSettings({ volume }),
    [updatePlaybackSettings]
  )

  const setPlaybackRate = useCallback(
    (rate: number) => updatePlaybackSettings({ playbackRate: rate }),
    [updatePlaybackSettings]
  )

  const setSingleLoop = useCallback(
    (enabled: boolean) => updatePlaybackSettings({ isSingleLoop: enabled }),
    [updatePlaybackSettings]
  )

  const setAutoPause = useCallback(
    (enabled: boolean) => updatePlaybackSettings({ isAutoPause: enabled }),
    [updatePlaybackSettings]
  )

  return {
    // 状态
    playbackSettings,
    loading,
    error,

    // 操作方法
    updatePlaybackSettings,
    refreshPlaybackSettings,

    // 便捷方法
    setAutoScrollEnabled,
    setDisplayMode,
    setVolume,
    setPlaybackRate,
    setSingleLoop,
    setAutoPause
  }
}
