import React, { useCallback, useRef, useEffect } from 'react'
// import { useVideoPlaybackSettings } from '../hooks/useVideoPlaybackSettings'
import {
  VideoPlaybackSettingsContext,
  type VideoPlaybackSettingsContextType
} from './video-playback-settings-context'
import { VideoPlaybackSettings, SubtitleDisplaySettings } from '@types_/shared'
import { usePlayingVideoContext } from '@renderer/hooks/usePlayingVideoContext'
import { useRecentPlayList } from '@renderer/hooks/useRecentPlayList'

export function VideoPlaybackSettingsProvider({
  children
}: {
  children: React.ReactNode
}): React.JSX.Element {
  // 从数据库加载播放设置
  const playingVideoContext = usePlayingVideoContext()
  const { getPlaybackSettingsByFileId, updatePlaybackSettingsByFileId } = useRecentPlayList()
  const fileId = playingVideoContext.fileId

  const subtitleDisplayModeRef = useRef<VideoPlaybackSettings['displayMode']>('bilingual')
  const volumeRef = useRef<VideoPlaybackSettings['volume']>(1)
  const playbackRateRef = useRef<VideoPlaybackSettings['playbackRate']>(1)
  const isSingleLoopRef = useRef<VideoPlaybackSettings['isSingleLoop']>(false)
  const isAutoPauseRef = useRef<VideoPlaybackSettings['isAutoPause']>(false)
  const subtitleDisplaySettingsRef = useRef<SubtitleDisplaySettings>({
    margins: {
      left: 20,
      top: 75,
      right: 20,
      bottom: 5
    },
    backgroundType: 'transparent',
    isMaskMode: false,
    maskFrame: {
      left: 0,
      top: 25,
      width: 100,
      height: 50
    }
  })

  // 订阅者集合
  const subtitleDisplayModeSubscribersRef = useRef<
    Set<(displayMode: VideoPlaybackSettings['displayMode']) => void>
  >(new Set())
  const volumeSubscribersRef = useRef<Set<(volume: VideoPlaybackSettings['volume']) => void>>(
    new Set()
  )
  const playbackRateSubscribersRef = useRef<
    Set<(playbackRate: VideoPlaybackSettings['playbackRate']) => void>
  >(new Set())
  const isSingleLoopSubscribersRef = useRef<
    Set<(isSingleLoop: VideoPlaybackSettings['isSingleLoop']) => void>
  >(new Set())
  const isAutoPauseSubscribersRef = useRef<
    Set<(isAutoPause: VideoPlaybackSettings['isAutoPause']) => void>
  >(new Set())
  const subtitleDisplaySettingsSubscribersRef = useRef<
    Set<(subtitleDisplaySettings: SubtitleDisplaySettings) => void>
  >(new Set())
  const settingsSubscribersRef = useRef<Set<(settings: VideoPlaybackSettings) => void>>(new Set())

  // 通知订阅者的方法
  const notifySubtitleDisplayModeSubscribers = useCallback(
    (displayMode: VideoPlaybackSettings['displayMode']) => {
      subtitleDisplayModeSubscribersRef.current.forEach((callback) => callback(displayMode))
    },
    []
  )

  const notifyVolumeSubscribers = useCallback((volume: VideoPlaybackSettings['volume']) => {
    volumeSubscribersRef.current.forEach((callback) => callback(volume))
  }, [])

  const notifyPlaybackRateSubscribers = useCallback(
    (playbackRate: VideoPlaybackSettings['playbackRate']) => {
      playbackRateSubscribersRef.current.forEach((callback) => callback(playbackRate))
    },
    []
  )

  const notifyIsSingleLoopSubscribers = useCallback(
    (isSingleLoop: VideoPlaybackSettings['isSingleLoop']) => {
      isSingleLoopSubscribersRef.current.forEach((callback) => callback(isSingleLoop))
    },
    []
  )

  const notifyIsAutoPauseSubscribers = useCallback(
    (isAutoPause: VideoPlaybackSettings['isAutoPause']) => {
      isAutoPauseSubscribersRef.current.forEach((callback) => callback(isAutoPause))
    },
    []
  )

  const notifySubtitleDisplaySettingsSubscribers = useCallback(
    (subtitleDisplaySettings: SubtitleDisplaySettings) => {
      subtitleDisplaySettingsSubscribersRef.current.forEach((callback) =>
        callback(subtitleDisplaySettings)
      )
    },
    []
  )

  const notifySettingsSubscribers = useCallback((settings: VideoPlaybackSettings) => {
    settingsSubscribersRef.current.forEach((callback) => callback(settings))
  }, [])

  // 订阅方法
  const subscribeToSubtitleDisplayMode = useCallback(
    (callback: (displayMode: VideoPlaybackSettings['displayMode']) => void) => {
      subtitleDisplayModeSubscribersRef.current.add(callback)
      return () => {
        subtitleDisplayModeSubscribersRef.current.delete(callback)
      }
    },
    []
  )

  const subscribeToVolume = useCallback(
    (callback: (volume: VideoPlaybackSettings['volume']) => void) => {
      volumeSubscribersRef.current.add(callback)
      return () => {
        volumeSubscribersRef.current.delete(callback)
      }
    },
    []
  )

  const subscribeToPlaybackRate = useCallback(
    (callback: (playbackRate: VideoPlaybackSettings['playbackRate']) => void) => {
      playbackRateSubscribersRef.current.add(callback)
      return () => {
        playbackRateSubscribersRef.current.delete(callback)
      }
    },
    []
  )

  const subscribeToIsSingleLoop = useCallback(
    (callback: (isSingleLoop: VideoPlaybackSettings['isSingleLoop']) => void) => {
      isSingleLoopSubscribersRef.current.add(callback)
      return () => {
        isSingleLoopSubscribersRef.current.delete(callback)
      }
    },
    []
  )

  const subscribeToIsAutoPause = useCallback(
    (callback: (isAutoPause: VideoPlaybackSettings['isAutoPause']) => void) => {
      isAutoPauseSubscribersRef.current.add(callback)
      return () => {
        isAutoPauseSubscribersRef.current.delete(callback)
      }
    },
    []
  )

  const subscribeToSubtitleDisplaySettings = useCallback(
    (callback: (subtitleDisplaySettings: SubtitleDisplaySettings) => void) => {
      subtitleDisplaySettingsSubscribersRef.current.add(callback)
      return () => {
        subtitleDisplaySettingsSubscribersRef.current.delete(callback)
      }
    },
    []
  )

  const subscribeToSettings = useCallback((callback: (settings: VideoPlaybackSettings) => void) => {
    settingsSubscribersRef.current.add(callback)
    return () => {
      settingsSubscribersRef.current.delete(callback)
    }
  }, [])

  const updateSubtitleDisplayMode = useCallback(
    (displayMode: VideoPlaybackSettings['displayMode']) => {
      subtitleDisplayModeRef.current = displayMode
      notifySubtitleDisplayModeSubscribers(displayMode)
      updatePlaybackSettingsByFileId(fileId, {
        displayMode: displayMode,
        volume: volumeRef.current,
        playbackRate: playbackRateRef.current,
        isSingleLoop: isSingleLoopRef.current,
        isAutoPause: isAutoPauseRef.current
      })
    },
    [notifySubtitleDisplayModeSubscribers, fileId, updatePlaybackSettingsByFileId]
  )

  const updateVolume = useCallback(
    (volume: VideoPlaybackSettings['volume']) => {
      volumeRef.current = volume
      notifyVolumeSubscribers(volume)
      updatePlaybackSettingsByFileId(fileId, {
        volume: volume,
        playbackRate: playbackRateRef.current,
        isSingleLoop: isSingleLoopRef.current,
        isAutoPause: isAutoPauseRef.current
      })
    },
    [notifyVolumeSubscribers, fileId, updatePlaybackSettingsByFileId]
  )

  const updatePlaybackRate = useCallback(
    (playbackRate: VideoPlaybackSettings['playbackRate']) => {
      playbackRateRef.current = playbackRate
      notifyPlaybackRateSubscribers(playbackRate)
      updatePlaybackSettingsByFileId(fileId, {
        volume: volumeRef.current,
        playbackRate: playbackRate,
        isSingleLoop: isSingleLoopRef.current,
        isAutoPause: isAutoPauseRef.current
      })
    },
    [notifyPlaybackRateSubscribers, fileId, updatePlaybackSettingsByFileId]
  )

  const updateIsSingleLoop = useCallback(
    (isSingleLoop: VideoPlaybackSettings['isSingleLoop']) => {
      isSingleLoopRef.current = isSingleLoop
      notifyIsSingleLoopSubscribers(isSingleLoop)
      updatePlaybackSettingsByFileId(fileId, {
        volume: volumeRef.current,
        playbackRate: playbackRateRef.current,
        isSingleLoop: isSingleLoop,
        isAutoPause: isAutoPauseRef.current
      })
    },
    [notifyIsSingleLoopSubscribers, fileId, updatePlaybackSettingsByFileId]
  )

  const updateIsAutoPause = useCallback(
    (isAutoPause: VideoPlaybackSettings['isAutoPause']) => {
      isAutoPauseRef.current = isAutoPause
      notifyIsAutoPauseSubscribers(isAutoPause)
      updatePlaybackSettingsByFileId(fileId, {
        volume: volumeRef.current,
        playbackRate: playbackRateRef.current,
        isSingleLoop: isSingleLoopRef.current,
        isAutoPause: isAutoPause
      })
    },
    [notifyIsAutoPauseSubscribers, fileId, updatePlaybackSettingsByFileId]
  )

  // 恢复
  const restoreSettings = useCallback(
    (settings: VideoPlaybackSettings) => {
      subtitleDisplayModeRef.current = settings.displayMode
      volumeRef.current = settings.volume
      playbackRateRef.current = settings.playbackRate
      isSingleLoopRef.current = settings.isSingleLoop
      isAutoPauseRef.current = settings.isAutoPause
      subtitleDisplaySettingsRef.current = settings.subtitleDisplay || {
        margins: { left: 20, top: 75, right: 20, bottom: 5 },
        backgroundType: 'transparent',
        isMaskMode: false,
        maskFrame: { left: 0, top: 25, width: 100, height: 50 }
      }

      // 通知所有订阅者设置已更新
      console.log('🔄 恢复设置时通知订阅者:', {
        displayMode: settings.displayMode,
        volume: settings.volume,
        playbackRate: settings.playbackRate,
        isSingleLoop: settings.isSingleLoop,
        isAutoPause: settings.isAutoPause
      })
      notifySubtitleDisplayModeSubscribers(settings.displayMode)
      notifyVolumeSubscribers(settings.volume)
      notifyPlaybackRateSubscribers(settings.playbackRate)
      notifyIsSingleLoopSubscribers(settings.isSingleLoop)
      notifyIsAutoPauseSubscribers(settings.isAutoPause)
      notifySubtitleDisplaySettingsSubscribers(subtitleDisplaySettingsRef.current)
      notifySettingsSubscribers(settings)
    },
    [
      notifySubtitleDisplayModeSubscribers,
      notifyVolumeSubscribers,
      notifyPlaybackRateSubscribers,
      notifyIsSingleLoopSubscribers,
      notifyIsAutoPauseSubscribers,
      notifySubtitleDisplaySettingsSubscribers,
      notifySettingsSubscribers
    ]
  )

  // 使用 useEffect 处理异步加载设置
  useEffect(() => {
    const loadSettings = async (): Promise<void> => {
      try {
        const settings = await getPlaybackSettingsByFileId(fileId)
        console.log('加载播放设置:', settings)
        if (settings) {
          restoreSettings(settings)
        } else {
          const defaultSettings: VideoPlaybackSettings = {
            displayMode: subtitleDisplayModeRef.current as VideoPlaybackSettings['displayMode'],
            volume: volumeRef.current as VideoPlaybackSettings['volume'],
            playbackRate: playbackRateRef.current as VideoPlaybackSettings['playbackRate'],
            isSingleLoop: isSingleLoopRef.current as VideoPlaybackSettings['isSingleLoop'],
            isAutoPause: isAutoPauseRef.current as VideoPlaybackSettings['isAutoPause'],
            subtitleDisplay: subtitleDisplaySettingsRef.current as SubtitleDisplaySettings
          }
          console.log('使用默认设置:', defaultSettings)
          updatePlaybackSettingsByFileId(fileId, defaultSettings)
        }
      } catch (error) {
        console.error('加载播放设置失败:', error)
        // 使用默认设置
        const defaultSettings: VideoPlaybackSettings = {
          displayMode: subtitleDisplayModeRef.current as VideoPlaybackSettings['displayMode'],
          volume: volumeRef.current as VideoPlaybackSettings['volume'],
          playbackRate: playbackRateRef.current as VideoPlaybackSettings['playbackRate'],
          isSingleLoop: isSingleLoopRef.current as VideoPlaybackSettings['isSingleLoop'],
          isAutoPause: isAutoPauseRef.current as VideoPlaybackSettings['isAutoPause'],
          subtitleDisplay: subtitleDisplaySettingsRef.current as SubtitleDisplaySettings
        }
        console.log('使用默认设置:', defaultSettings)
        updatePlaybackSettingsByFileId(fileId, defaultSettings)
      }
    }

    loadSettings()
  }, [fileId, getPlaybackSettingsByFileId, restoreSettings, updatePlaybackSettingsByFileId])

  const value: VideoPlaybackSettingsContextType = {
    subtitleDisplayModeRef,
    volumeRef,
    playbackRateRef,
    isSingleLoopRef,
    isAutoPauseRef,
    subtitleDisplaySettingsRef,
    subscribeToSubtitleDisplayMode,
    subscribeToVolume,
    subscribeToPlaybackRate,
    subscribeToIsSingleLoop,
    subscribeToIsAutoPause,
    subscribeToSubtitleDisplaySettings,
    subscribeToSettings,
    updateSubtitleDisplayMode,
    updateVolume,
    updatePlaybackRate,
    updateIsSingleLoop,
    updateIsAutoPause,
    restoreSettings
  }

  return (
    <VideoPlaybackSettingsContext.Provider value={value}>
      {children}
    </VideoPlaybackSettingsContext.Provider>
  )
}
