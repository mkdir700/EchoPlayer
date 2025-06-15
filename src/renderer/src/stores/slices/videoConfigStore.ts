import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { devtools, persist, createJSONStorage } from 'zustand/middleware'
import { electronStorage } from '../customStorage'
import { VideoPlaybackSettings, SubtitleDisplaySettings, LoopSettings } from '@types_/shared'
import { VOLUME_SETTINGS, PLAYBACK_RATES } from '../../constants'

// 单个视频的配置接口 / Single video configuration interface
export interface VideoConfig {
  isSubtitleLayoutLocked: boolean // 字幕布局锁定状态 / Subtitle layout lock state
  // 播放设置 / Playback settings
  displayMode: VideoPlaybackSettings['displayMode'] // 字幕显示模式 / Subtitle display mode
  volume: VideoPlaybackSettings['volume'] // 音量设置 / Volume setting
  playbackRate: VideoPlaybackSettings['playbackRate'] // 播放速度 / Playback rate
  isSingleLoop: VideoPlaybackSettings['isSingleLoop'] // 单句循环（保持向后兼容）/ Single loop (backward compatibility)
  loopSettings: LoopSettings // 新的循环设置 / New loop settings
  isAutoPause: VideoPlaybackSettings['isAutoPause'] // 自动暂停 / Auto pause
  subtitleDisplay: SubtitleDisplaySettings // 字幕显示配置 / Subtitle display settings
  selectedPlaybackRates: number[] // 用户选择的播放速度选项 / User selected playback rate options
}

// 视频配置状态接口 / Video config state interface
export interface VideoConfigState {
  configs: Record<string, VideoConfig> // 以 fileId 为键的配置映射 / Configuration map keyed by fileId
}

// 视频配置操作接口 / Video config actions interface
export interface VideoConfigActions {
  // 获取指定视频的配置 / Get configuration for specific video
  getVideoConfig: (fileId: string) => VideoConfig

  // 设置指定视频的字幕布局锁定状态 / Set subtitle layout lock state for specific video
  setSubtitleLayoutLocked: (fileId: string, locked: boolean) => void

  // 播放设置相关操作 / Playback settings related actions
  setDisplayMode: (fileId: string, mode: VideoPlaybackSettings['displayMode']) => void
  setVolume: (fileId: string, volume: VideoPlaybackSettings['volume']) => void
  setPlaybackRate: (fileId: string, rate: VideoPlaybackSettings['playbackRate']) => void
  setIsSingleLoop: (fileId: string, loop: VideoPlaybackSettings['isSingleLoop']) => void
  setLoopSettings: (fileId: string, settings: LoopSettings) => void
  setIsAutoPause: (fileId: string, pause: VideoPlaybackSettings['isAutoPause']) => void
  setSubtitleDisplay: (fileId: string, settings: SubtitleDisplaySettings) => void

  // 播放速度选项管理 / Playback rate options management
  setSelectedPlaybackRates: (fileId: string, rates: number[]) => void

  // 批量设置播放配置 / Batch set playback settings
  setPlaybackSettings: (
    fileId: string,
    settings: Partial<Omit<VideoConfig, 'isSubtitleLayoutLocked'>>
  ) => void

  // 清除指定视频的配置 / Clear configuration for specific video
  clearVideoConfig: (fileId: string) => void

  // 清除所有配置 / Clear all configurations
  clearAllConfigs: () => void
}

// 组合类型 / Combined type
export type VideoConfigStore = VideoConfigState & VideoConfigActions

// 默认配置 / Default configuration
const defaultVideoConfig: VideoConfig = {
  isSubtitleLayoutLocked: false,
  displayMode: 'bilingual',
  volume: VOLUME_SETTINGS.DEFAULT,
  playbackRate: PLAYBACK_RATES.DEFAULT,
  isSingleLoop: false,
  loopSettings: {
    count: -1 // 默认无限循环 / Default infinite loop
  },
  isAutoPause: false,
  subtitleDisplay: {
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
  },
  selectedPlaybackRates: [0.75, 1, 1.25, 1.5, 2] // 默认选择的播放速度选项 / Default selected playback rate options
}

// 初始状态 / Initial state
const initialState: VideoConfigState = {
  configs: {}
}

/**
 * Video Configuration Store for managing per-video settings
 *
 * 视频配置存储，用于管理每个视频的独立设置
 *
 * Uses Zustand with Immer for immutable state updates, DevTools for debugging,
 * and Persist middleware with custom Electron storage engine for user data directory persistence.
 *
 * 使用 Zustand + Immer 进行不可变状态更新，DevTools 用于调试，
 * 持久化中间件配合自定义 Electron 存储引擎将数据保存到用户数据目录。
 */
export const useVideoConfigStore = create<VideoConfigStore>()(
  devtools(
    persist(
      immer((set, get) => ({
        ...initialState,

        getVideoConfig: (fileId: string) => {
          const state = get()
          return state.configs[fileId] || { ...defaultVideoConfig }
        },

        setSubtitleLayoutLocked: (fileId: string, locked: boolean) =>
          set((state) => {
            if (!state.configs[fileId]) {
              state.configs[fileId] = { ...defaultVideoConfig }
            }
            state.configs[fileId].isSubtitleLayoutLocked = locked
          }),

        setDisplayMode: (fileId: string, mode: VideoPlaybackSettings['displayMode']) =>
          set((state) => {
            if (!state.configs[fileId]) {
              state.configs[fileId] = { ...defaultVideoConfig }
            }
            state.configs[fileId].displayMode = mode
          }),

        setVolume: (fileId: string, volume: VideoPlaybackSettings['volume']) =>
          set((state) => {
            if (!state.configs[fileId]) {
              state.configs[fileId] = { ...defaultVideoConfig }
            }
            state.configs[fileId].volume = volume
          }),

        setPlaybackRate: (fileId: string, rate: VideoPlaybackSettings['playbackRate']) =>
          set((state) => {
            if (!state.configs[fileId]) {
              state.configs[fileId] = { ...defaultVideoConfig }
            }
            state.configs[fileId].playbackRate = rate
          }),

        setIsSingleLoop: (fileId: string, loop: VideoPlaybackSettings['isSingleLoop']) =>
          set((state) => {
            if (!state.configs[fileId]) {
              state.configs[fileId] = { ...defaultVideoConfig }
            }
            state.configs[fileId].isSingleLoop = loop
          }),

        setLoopSettings: (fileId: string, settings: LoopSettings) =>
          set((state) => {
            if (!state.configs[fileId]) {
              state.configs[fileId] = { ...defaultVideoConfig }
            }
            state.configs[fileId].loopSettings = settings
          }),

        setIsAutoPause: (fileId: string, pause: VideoPlaybackSettings['isAutoPause']) =>
          set((state) => {
            if (!state.configs[fileId]) {
              state.configs[fileId] = { ...defaultVideoConfig }
            }
            state.configs[fileId].isAutoPause = pause
          }),

        setSubtitleDisplay: (fileId: string, settings: SubtitleDisplaySettings) =>
          set((state) => {
            if (!state.configs[fileId]) {
              state.configs[fileId] = { ...defaultVideoConfig }
            }
            state.configs[fileId].subtitleDisplay = settings
          }),

        setSelectedPlaybackRates: (fileId: string, rates: number[]) =>
          set((state) => {
            if (!state.configs[fileId]) {
              state.configs[fileId] = { ...defaultVideoConfig }
            }
            state.configs[fileId].selectedPlaybackRates = rates
          }),

        setPlaybackSettings: (
          fileId: string,
          settings: Partial<Omit<VideoConfig, 'isSubtitleLayoutLocked'>>
        ) =>
          set((state) => {
            if (!state.configs[fileId]) {
              state.configs[fileId] = { ...defaultVideoConfig }
            }
            const config = state.configs[fileId]
            if (settings.displayMode !== undefined) config.displayMode = settings.displayMode
            if (settings.volume !== undefined) config.volume = settings.volume
            if (settings.playbackRate !== undefined) config.playbackRate = settings.playbackRate
            if (settings.isSingleLoop !== undefined) config.isSingleLoop = settings.isSingleLoop
            if (settings.isAutoPause !== undefined) config.isAutoPause = settings.isAutoPause
            if (settings.subtitleDisplay !== undefined)
              config.subtitleDisplay = settings.subtitleDisplay
          }),

        clearVideoConfig: (fileId: string) =>
          set((state) => {
            delete state.configs[fileId]
          }),

        clearAllConfigs: () =>
          set((state) => {
            state.configs = {}
          })
      })),
      {
        name: 'echolab-video-config-storage', // 唯一的存储名称 / Unique storage name
        storage: createJSONStorage(() => electronStorage), // 使用自定义 Electron 存储 / Use custom Electron storage
        partialize: (state) => ({
          configs: state.configs // 只持久化配置数据，不持久化方法 / Only persist config data, not methods
        }),
        version: 2, // 增加版本号，因为接口发生了变化 / Increment version due to interface changes
        migrate: (persistedState: unknown, version) => {
          // 处理版本迁移 / Handle version migrations
          if (version === 0 || version === 1) {
            // 从版本 0/1 迁移到版本 2 的逻辑
            console.log('🔄 执行视频配置存储从 v' + version + ' 到 v2 的迁移')
            const newState: VideoConfigState = { configs: {} }

            // 如果有旧的配置数据，尝试保留字幕布局锁定状态
            if (
              persistedState &&
              typeof persistedState === 'object' &&
              'configs' in persistedState
            ) {
              const oldState = persistedState as {
                configs: Record<string, { isSubtitleLayoutLocked?: boolean }>
              }
              Object.keys(oldState.configs).forEach((fileId) => {
                const oldConfig = oldState.configs[fileId]
                newState.configs[fileId] = {
                  ...defaultVideoConfig,
                  // 保留旧的字幕布局锁定状态
                  isSubtitleLayoutLocked: oldConfig.isSubtitleLayoutLocked || false
                }
              })
            }

            return newState
          }
          return persistedState as VideoConfigState
        },
        onRehydrateStorage: () => {
          console.log('🔄 VideoConfig store hydration started')
          return (state, error) => {
            if (error) {
              console.error('❌ VideoConfig store hydration failed:', error)
            } else {
              console.log(
                '✅ VideoConfig store hydration finished:',
                state?.configs ? Object.keys(state.configs).length : 0,
                'configs loaded'
              )
            }
          }
        }
      }
    ),
    { name: 'video-config-store' }
  )
)

// 选择器：获取指定视频的字幕布局锁定状态 / Selector: Get subtitle layout lock state for specific video
export const useSubtitleLayoutLocked = (fileId: string): boolean =>
  useVideoConfigStore((state) => state.getVideoConfig(fileId).isSubtitleLayoutLocked)

// 选择器：获取设置字幕布局锁定状态的函数 / Selector: Get function to set subtitle layout lock state
export const useSetSubtitleLayoutLocked = (): ((fileId: string, locked: boolean) => void) =>
  useVideoConfigStore((state) => state.setSubtitleLayoutLocked)

// 播放设置相关选择器 / Playback settings related selectors
export const useDisplayMode = (fileId: string): VideoPlaybackSettings['displayMode'] =>
  useVideoConfigStore((state) => state.getVideoConfig(fileId).displayMode)

export const useVolume = (fileId: string): VideoPlaybackSettings['volume'] =>
  useVideoConfigStore((state) => state.getVideoConfig(fileId).volume)

export const usePlaybackRate = (fileId: string): VideoPlaybackSettings['playbackRate'] =>
  useVideoConfigStore((state) => state.getVideoConfig(fileId).playbackRate)

export const useIsSingleLoop = (fileId: string): VideoPlaybackSettings['isSingleLoop'] =>
  useVideoConfigStore((state) => state.getVideoConfig(fileId).isSingleLoop)

export const useLoopSettings = (fileId: string): LoopSettings =>
  useVideoConfigStore((state) => state.getVideoConfig(fileId).loopSettings)

export const useIsAutoPause = (fileId: string): VideoPlaybackSettings['isAutoPause'] =>
  useVideoConfigStore((state) => state.getVideoConfig(fileId).isAutoPause)

export const useSubtitleDisplay = (fileId: string): SubtitleDisplaySettings =>
  useVideoConfigStore((state) => state.getVideoConfig(fileId).subtitleDisplay)

// 设置函数选择器 / Setter function selectors
export const useSetDisplayMode = (): ((
  fileId: string,
  mode: VideoPlaybackSettings['displayMode']
) => void) => useVideoConfigStore((state) => state.setDisplayMode)

export const useSetVolume = (): ((
  fileId: string,
  volume: VideoPlaybackSettings['volume']
) => void) => useVideoConfigStore((state) => state.setVolume)

export const useSetPlaybackRate = (): ((
  fileId: string,
  rate: VideoPlaybackSettings['playbackRate']
) => void) => useVideoConfigStore((state) => state.setPlaybackRate)

export const useSetIsSingleLoop = (): ((
  fileId: string,
  loop: VideoPlaybackSettings['isSingleLoop']
) => void) => useVideoConfigStore((state) => state.setIsSingleLoop)

export const useSetLoopSettings = (): ((fileId: string, settings: LoopSettings) => void) =>
  useVideoConfigStore((state) => state.setLoopSettings)

export const useSetIsAutoPause = (): ((
  fileId: string,
  pause: VideoPlaybackSettings['isAutoPause']
) => void) => useVideoConfigStore((state) => state.setIsAutoPause)

export const useSetSubtitleDisplay = (): ((
  fileId: string,
  settings: SubtitleDisplaySettings
) => void) => useVideoConfigStore((state) => state.setSubtitleDisplay)

export const useSetPlaybackSettings = (): ((
  fileId: string,
  settings: Partial<Omit<VideoConfig, 'isSubtitleLayoutLocked'>>
) => void) => useVideoConfigStore((state) => state.setPlaybackSettings)

// 播放速度选项相关 hooks / Playback rate options related hooks
export const useSelectedPlaybackRates = (fileId: string): number[] =>
  useVideoConfigStore((state) => state.getVideoConfig(fileId).selectedPlaybackRates)

export const useSetSelectedPlaybackRates = (): ((fileId: string, rates: number[]) => void) =>
  useVideoConfigStore((state) => state.setSelectedPlaybackRates)
