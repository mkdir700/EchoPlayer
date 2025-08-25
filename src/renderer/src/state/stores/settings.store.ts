import { loggerService } from '@logger'
import { UpgradeChannel } from '@shared/config/constant'
import {
  LanguageVarious,
  LoopMode,
  SubtitleBackgroundType,
  SubtitleDisplayMode,
  ThemeMode
} from '@types'
import { create, StateCreator } from 'zustand'

import { MiddlewarePresets } from '../infrastructure'

const logger = loggerService.withContext('SettingsStore')

export const DEFAULT_SUBTITLE_DISPLAY_MODE: SubtitleDisplayMode = SubtitleDisplayMode.BILINGUAL

export type UserTheme = {
  colorPrimary: string
  colorSuccess: string
  colorWarning: string
  colorError: string
  borderRadius: 'small' | 'medium' | 'large'
}

export interface SettingsState {
  language: LanguageVarious
  theme: ThemeMode
  compactMode: boolean
  userTheme: UserTheme
  windowStyle: 'transparent' | 'opaque'
  messageStyle: 'plain' | 'bubble'
  videoListViewMode: 'grid' | 'list'
  playback: {
    defaultVolume: number
    defaultPlaybackSpeed: number
    defaultSubtitleDisplayMode: SubtitleDisplayMode
    defaultSubtitleBackgroundType: SubtitleBackgroundType
    /** 循环“默认设置”（全局偏好，右键菜单可调整；用于初始化新视频时的默认值） */
    defaultLoopMode: LoopMode
    defaultLoopCount: number // -1=无限；1-99
  }
  autoCheckUpdate: boolean
  testPlan: boolean
  testChannel: UpgradeChannel
  enableDeveloperMode: boolean
  launchOnBoot: boolean
  launchToTray: boolean
  trayOnClose: boolean
  tray: boolean
}

type Actions = {
  setLanguage: (language: LanguageVarious) => void
  setTheme: (theme: ThemeMode) => void
  setCompactMode: (compactMode: boolean) => void
  setUserTheme: (userTheme: UserTheme) => void
  setWindowStyle: (windowStyle: 'transparent' | 'opaque') => void
  setMessageStyle: (messageStyle: 'plain' | 'bubble') => void
  setVideoListViewMode: (mode: 'grid' | 'list') => void
  setPlayback: (playback: SettingsState['playback']) => void
  setLaunchOnBoot: (isLaunchOnBoot: boolean) => void
  setLaunchToTray: (isLaunchToTray: boolean) => void
  setShowTray: (isShowTray: boolean) => void
  setTrayOnClose: (isTrayOnClose: boolean) => void
  setAutoCheckUpdate: (autoCheckUpdate: boolean) => void
  setTestPlan: (testPlan: boolean) => void
  setTestChannel: (testChannel: UpgradeChannel) => void
  setEnableDeveloperMode: (enableDeveloperMode: boolean) => void
  setDefaultPlaybackSpeed: (speed: number) => void
  setDefaultVolume: (volume: number) => void
  setDefaultSubtitleDisplayMode: (mode: SubtitleDisplayMode) => void
  setDefaultSubtitleBackgroundType: (type: SubtitleBackgroundType) => void
  // 循环默认设置（全局偏好）
  setDefaultLoopMode: (mode: LoopMode) => void
  setDefaultLoopCount: (count: number) => void // -1=∞；1-99
}

export type SettingsStore = SettingsState & Actions

const initialState: SettingsState = {
  language: 'zh-CN',
  theme: ThemeMode.system,
  compactMode: false,
  userTheme: {
    colorPrimary: '#1677ff',
    colorSuccess: '#52c41a',
    colorWarning: '#faad14',
    colorError: '#ff4d4f',
    borderRadius: 'medium'
  },
  windowStyle: 'transparent',
  messageStyle: 'bubble',
  videoListViewMode: 'grid',
  playback: {
    defaultPlaybackSpeed: 1.0,
    defaultSubtitleDisplayMode: DEFAULT_SUBTITLE_DISPLAY_MODE,
    defaultVolume: 1.0,
    defaultSubtitleBackgroundType: SubtitleBackgroundType.BLUR,
    defaultLoopCount: -1,
    defaultLoopMode: LoopMode.SINGLE
  },
  autoCheckUpdate: true,
  testPlan: false,
  testChannel: UpgradeChannel.LATEST,
  enableDeveloperMode: false,
  launchOnBoot: false,
  launchToTray: false,
  trayOnClose: false,
  tray: false
}

// 添加初始状态日志
logger.info('🚀 [SettingsStore] Store 初始化:', {
  initialState: {
    theme: initialState.theme,
    compactMode: initialState.compactMode,
    language: initialState.language
  },
  timestamp: Date.now()
})

const createSettingsStore: StateCreator<
  SettingsStore,
  [['zustand/immer', never]],
  [],
  SettingsStore
> = (set) => ({
  ...initialState,

  setLanguage: (language) => set({ language }),
  setTheme: (theme) => set({ theme }),
  setCompactMode: (compactMode) => set({ compactMode }),
  setUserTheme: (userTheme) => set({ userTheme }),
  setWindowStyle: (windowStyle) => set({ windowStyle }),
  setMessageStyle: (messageStyle) => set({ messageStyle }),
  setVideoListViewMode: (mode) => set({ videoListViewMode: mode }),
  setPlayback: (playback) => set({ playback }),
  setAutoCheckUpdate: (autoCheckUpdate) => set({ autoCheckUpdate }),
  setTestPlan: (testPlan) => set({ testPlan }),
  setTestChannel: (testChannel) => set({ testChannel }),
  setEnableDeveloperMode: (enableDeveloperMode) => set({ enableDeveloperMode }),
  setLaunchOnBoot: (isLaunchOnBoot) => set({ launchOnBoot: isLaunchOnBoot }),
  setLaunchToTray: (isLaunchToTray) => set({ launchToTray: isLaunchToTray }),
  setShowTray: (isShowTray) => set({ tray: isShowTray }),
  setTrayOnClose: (isTrayOnClose) => set({ trayOnClose: isTrayOnClose }),
  setDefaultPlaybackSpeed: (speed) =>
    set((state) => ({
      playback: { ...state.playback, defaultPlaybackSpeed: speed }
    })),
  setDefaultVolume: (volume) =>
    set((state) => ({
      playback: { ...state.playback, defaultVolume: volume }
    })),
  setDefaultSubtitleDisplayMode: (mode) =>
    set((state) => ({
      playback: { ...state.playback, defaultSubtitleDisplayMode: mode }
    })),
  setDefaultSubtitleBackgroundType: (type) =>
    set((state) => ({
      playback: { ...state.playback, defaultSubtitleBackgroundType: type }
    })),
  // 循环默认设置（全局偏好）
  setDefaultLoopMode: (mode) =>
    set((state) => ({
      playback: { ...state.playback, defaultLoopMode: mode }
    })),
  setDefaultLoopCount: (count) =>
    set((state) => {
      const clamped = count === -1 ? -1 : Math.max(1, Math.min(99, Math.floor(count)))
      return { playback: { ...state.playback, defaultLoopCount: clamped } }
    })
})

export const useSettingsStore = create<SettingsStore>()(
  MiddlewarePresets.persistent('settings', {
    partialize: (state: SettingsStore) => ({
      language: state.language,
      theme: state.theme,
      compactMode: state.compactMode,
      userTheme: state.userTheme,
      windowStyle: state.windowStyle,
      messageStyle: state.messageStyle,
      videoListViewMode: state.videoListViewMode,
      playback: state.playback,
      enableDeveloperMode: state.enableDeveloperMode
    }),
    version: 1
  })(createSettingsStore)
)
