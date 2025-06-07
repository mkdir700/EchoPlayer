import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { devtools, persist, createJSONStorage } from 'zustand/middleware'
import { electronStorage } from '../customStorage'

// 单个视频的配置接口 / Single video configuration interface
export interface VideoConfig {
  isSubtitleLayoutLocked: boolean // 字幕布局锁定状态 / Subtitle layout lock state
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

  // 清除指定视频的配置 / Clear configuration for specific video
  clearVideoConfig: (fileId: string) => void

  // 清除所有配置 / Clear all configurations
  clearAllConfigs: () => void
}

// 组合类型 / Combined type
export type VideoConfigStore = VideoConfigState & VideoConfigActions

// 默认配置 / Default configuration
const defaultVideoConfig: VideoConfig = {
  isSubtitleLayoutLocked: false
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
        version: 1, // 版本号，用于后续迁移 / Version number for future migrations
        migrate: (persistedState, version) => {
          // 处理版本迁移 / Handle version migrations
          if (version === 0) {
            // 从版本 0 迁移到版本 1 的逻辑
            console.log('🔄 执行视频配置存储从 v0 到 v1 的迁移')
          }
          return persistedState
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
