import { SettingsState, useSettingsStore } from '@renderer/state/stores/settings.store'
import { UpgradeChannel } from '@shared/config/constant'
import { ThemeMode } from '@types'
import { useCallback } from 'react'

export function useSettings() {
  // ✅ 使用选择器分别获取状态
  const language = useSettingsStore((state) => state.language)
  const theme = useSettingsStore((state) => state.theme)
  const compactMode = useSettingsStore((state) => state.compactMode)
  const userTheme = useSettingsStore((state) => state.userTheme)
  const windowStyle = useSettingsStore((state) => state.windowStyle)
  const messageStyle = useSettingsStore((state) => state.messageStyle)
  const videoListViewMode = useSettingsStore((state) => state.videoListViewMode)
  const playback = useSettingsStore((state) => state.playback)
  const autoCheckUpdate = useSettingsStore((state) => state.autoCheckUpdate)
  const testPlan = useSettingsStore((state) => state.testPlan)
  const testChannel = useSettingsStore((state) => state.testChannel)
  const enableDeveloperMode = useSettingsStore((state) => state.enableDeveloperMode)
  const launchOnBoot = useSettingsStore((state) => state.launchOnBoot)
  const launchToTray = useSettingsStore((state) => state.launchToTray)
  const trayOnClose = useSettingsStore((state) => state.trayOnClose)
  const tray = useSettingsStore((state) => state.tray)

  // ✅ 直接获取actions（稳定引用）
  const setLanguage = useSettingsStore((state) => state.setLanguage)
  const setTheme = useSettingsStore((state) => state.setTheme)
  const setCompactMode = useSettingsStore((state) => state.setCompactMode)
  const setUserTheme = useSettingsStore((state) => state.setUserTheme)
  const setWindowStyle = useSettingsStore((state) => state.setWindowStyle)
  const setMessageStyle = useSettingsStore((state) => state.setMessageStyle)
  const setVideoListViewMode = useSettingsStore((state) => state.setVideoListViewMode)
  const setPlayback = useSettingsStore((state) => state.setPlayback)
  const setAutoCheckUpdate = useSettingsStore((state) => state.setAutoCheckUpdate)
  const setTestPlan = useSettingsStore((state) => state.setTestPlan)
  const setTestChannel = useSettingsStore((state) => state.setTestChannel)
  const setLaunchOnBoot = useSettingsStore((state) => state.setLaunchOnBoot)
  const setLaunchToTray = useSettingsStore((state) => state.setLaunchToTray)
  const setShowTray = useSettingsStore((state) => state.setShowTray)
  const setTrayOnClose = useSettingsStore((state) => state.setTrayOnClose)
  const setDefaultVolume = useSettingsStore((state) => state.setDefaultVolume)
  const setDefaultPlaybackSpeed = useSettingsStore((state) => state.setDefaultPlaybackSpeed)
  const setDefaultSubtitleBackgroundType = useSettingsStore(
    (state) => state.setDefaultSubtitleBackgroundType
  )
  const setDefaultSubtitleDisplayMode = useSettingsStore(
    (state) => state.setDefaultSubtitleDisplayMode
  )
  const setDefaultFavoriteRates = useSettingsStore((state) => state.setDefaultFavoriteRates)

  // ✅ 复合操作使用 useCallback 稳定引用
  const setLaunch = useCallback(
    (isLaunchOnBoot: boolean | undefined, isLaunchToTray: boolean | undefined = undefined) => {
      if (isLaunchOnBoot !== undefined) {
        setLaunchOnBoot(isLaunchOnBoot)
        window.api.setLaunchOnBoot(isLaunchOnBoot)
      }
      if (isLaunchToTray !== undefined) {
        setLaunchToTray(isLaunchToTray)
        window.api.setLaunchToTray(isLaunchToTray)
      }
    },
    [setLaunchOnBoot, setLaunchToTray]
  )

  const setTray = useCallback(
    (isShowTray: boolean | undefined, isTrayOnClose: boolean | undefined = undefined) => {
      if (isShowTray !== undefined) {
        setShowTray(isShowTray)
        window.api.setTray(isShowTray)
      }
      if (isTrayOnClose !== undefined) {
        setTrayOnClose(isTrayOnClose)
        window.api.setTrayOnClose(isTrayOnClose)
      }
    },
    [setShowTray, setTrayOnClose]
  )

  // ✅ 需要额外API调用的action包装
  const setAutoCheckUpdateWithApi = useCallback(
    (isAutoUpdate: boolean) => {
      setAutoCheckUpdate(isAutoUpdate)
      window.api.setAutoUpdate(isAutoUpdate)
    },
    [setAutoCheckUpdate]
  )

  const setTestPlanWithApi = useCallback(
    (isTestPlan: boolean) => {
      setTestPlan(isTestPlan)
      window.api.setTestPlan(isTestPlan)
    },
    [setTestPlan]
  )

  const setTestChannelWithApi = useCallback(
    (channel: UpgradeChannel) => {
      setTestChannel(channel)
      window.api.setTestChannel(channel)
    },
    [setTestChannel]
  )

  const setThemeWithApi = useCallback(
    (theme: ThemeMode) => {
      setTheme(theme)
      window.api.setTheme(theme)
    },
    [setTheme]
  )

  return {
    // 状态
    language,
    theme,
    compactMode,
    userTheme,
    windowStyle,
    messageStyle,
    videoListViewMode,
    playback,
    autoCheckUpdate,
    testPlan,
    testChannel,
    enableDeveloperMode,
    launchOnBoot,
    launchToTray,
    trayOnClose,
    tray,

    // 原始actions（稳定引用）
    setLanguage,
    setUserTheme,
    setMessageStyle,
    setVideoListViewMode,
    setPlayback,

    // 复合操作
    setLaunch,
    setTray,

    // 带API调用的actions
    setAutoCheckUpdate: setAutoCheckUpdateWithApi,
    setTestPlan: setTestPlanWithApi,
    setTestChannel: setTestChannelWithApi,
    setTheme: setThemeWithApi,
    setCompactMode,
    setWindowStyle,

    // Playback settings
    setDefaultVolume,
    setDefaultPlaybackSpeed,
    setDefaultSubtitleBackgroundType,
    setDefaultSubtitleDisplayMode,
    setDefaultFavoriteRates
  }
}

export function useMessageStyle() {
  const messageStyle = useSettingsStore((state) => state.messageStyle)
  const isBubbleStyle = messageStyle === 'bubble'

  return {
    isBubbleStyle
  }
}

export const getStoreSetting = (key: keyof SettingsState) => {
  return useSettingsStore.getState()[key]
}

export const useEnableDeveloperMode = () => {
  const enableDeveloperMode = useSettingsStore((state) => state.enableDeveloperMode)
  const setEnableDeveloperMode = useSettingsStore((state) => state.setEnableDeveloperMode)

  const setEnableDeveloperModeWithApi = useCallback(
    (enabled: boolean) => {
      setEnableDeveloperMode(enabled)
      window.api.config.set('enableDeveloperMode', enabled)
    },
    [setEnableDeveloperMode]
  )

  return {
    enableDeveloperMode,
    setEnableDeveloperMode: setEnableDeveloperModeWithApi
  }
}

export const getEnableDeveloperMode = () => {
  return useSettingsStore.getState().enableDeveloperMode
}

export const useNavbarPosition = () => {
  // const navbarPosition = useSettingsStore((state) => state.navbarPosition)
  const navbarPosition = 'left'

  return {
    navbarPosition,
    isLeftNavbar: navbarPosition === 'left'
    // isTopNavbar: navbarPosition === 'top',
    // setNavbarPosition: (position: 'left' | 'top') => dispatch(setNavbarPosition(position))
  }
}
