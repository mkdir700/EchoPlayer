import { loggerService } from '@logger'
import { SettingsState, useSettingsStore } from '@renderer/state/stores/settings.store'
import { UpgradeChannel } from '@shared/config/constant'
import { ThemeMode } from '@types'

const logger = loggerService.withContext('useSettings')

export function useSettings() {
  const settings = useSettingsStore((state) => state)

  logger.debug('⚙️ [useSettings] 当前设置:', {
    theme: settings.theme,
    compactMode: settings.compactMode,
    language: settings.language,
    timestamp: Date.now()
  })

  return {
    ...settings,

    setLaunch(
      isLaunchOnBoot: boolean | undefined,
      isLaunchToTray: boolean | undefined = undefined
    ) {
      if (isLaunchOnBoot !== undefined) {
        useSettingsStore.getState().setLaunchOnBoot(isLaunchOnBoot)
        window.api.setLaunchOnBoot(isLaunchOnBoot)
      }

      if (isLaunchToTray !== undefined) {
        useSettingsStore.getState().setLaunchToTray(isLaunchToTray)
        window.api.setLaunchToTray(isLaunchToTray)
      }
    },

    setTray(isShowTray: boolean | undefined, isTrayOnClose: boolean | undefined = undefined) {
      if (isShowTray !== undefined) {
        useSettingsStore.getState().setShowTray(isShowTray)
        window.api.setTray(isShowTray)
      }
      if (isTrayOnClose !== undefined) {
        useSettingsStore.getState().setTrayOnClose(isTrayOnClose)
        window.api.setTrayOnClose(isTrayOnClose)
      }
    },

    setAutoCheckUpdate(isAutoUpdate: boolean) {
      useSettingsStore.getState().setAutoCheckUpdate(isAutoUpdate)
      window.api.setAutoUpdate(isAutoUpdate)
    },

    setTestPlan(isTestPlan: boolean) {
      useSettingsStore.getState().setTestPlan(isTestPlan)
      window.api.setTestPlan(isTestPlan)
    },

    setTestChannel(channel: UpgradeChannel) {
      useSettingsStore.getState().setTestChannel(channel)
      window.api.setTestChannel(channel)
    },

    setTheme(theme: ThemeMode) {
      useSettingsStore.getState().setTheme(theme)
      window.api.setTheme(theme)
    },

    setCompactMode(compactMode: boolean) {
      useSettingsStore.getState().setCompactMode(compactMode)
    },

    setWindowStyle(windowStyle: 'transparent' | 'opaque') {
      useSettingsStore.getState().setWindowStyle(windowStyle)
    }
  }
}

export function useMessageStyle() {
  const { messageStyle } = useSettings()
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

  return {
    enableDeveloperMode,
    setEnableDeveloperMode: (enableDeveloperMode: boolean) => {
      useSettingsStore.getState().setEnableDeveloperMode(enableDeveloperMode)
      window.api.config.set('enableDeveloperMode', enableDeveloperMode)
    }
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
