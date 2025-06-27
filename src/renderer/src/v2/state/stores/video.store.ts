/**
 * V2 视频状态存储 / V2 Video State Store
 *
 * 管理视频相关的状态，包括当前视频信息、最近播放列表、视频加载状态等
 * Manages video-related state including current video info, recent plays, video loading state, etc.
 */

import { create } from 'zustand'
import { V2MiddlewarePresets, StateDebug, StateValidation } from '../infrastructure'
import { logger } from '@renderer/utils/logger'

// 导入类型定义 / Import type definitions
import type {
  VideoInfo,
  RecentPlayItem,
  VideoPlaybackSettings,
  VideoUIConfig
} from '../../infrastructure/types/domain/video.types'
import { VideoLoadingStage } from '../../infrastructure/types/domain/video.types'
/**
 * 当前视频状态接口 / Current Video State Interface
 */
export interface CurrentVideoState {
  fileId: string
  filePath: string
  fileName: string
  duration: number
  currentTime: number
  isPlaying: boolean
  volume: number
  playbackRate: number
  videoInfo?: VideoInfo
}

/**
 * 视频加载状态接口 / Video Loading State Interface
 */
export interface VideoLoadingState {
  isLoading: boolean
  stage: VideoLoadingStage
  progress: number
  error: string | null
  loadingStartTime?: number
}

/**
 * 视频状态接口 / Video State Interface
 */
export interface VideoState {
  // 当前视频信息 / Current video information
  currentVideo: CurrentVideoState | null

  // 最近播放列表 / Recent plays list
  recentPlays: RecentPlayItem[]

  // 视频加载状态 / Video loading state
  loadingState: VideoLoadingState

  // 视频播放设置缓存 / Video playback settings cache
  playbackSettingsCache: Record<string, VideoPlaybackSettings>

  // UI配置缓存 / UI config cache
  uiConfigCache: Record<string, VideoUIConfig>
}

/**
 * 视频操作接口 / Video Actions Interface
 */
export interface VideoActions {
  // 视频加载操作 / Video loading operations
  loadVideo: (filePath: string, generateThumbnail?: boolean) => Promise<void>
  clearVideo: () => void
  setVideoInfo: (videoInfo: VideoInfo) => void

  // 播放控制操作 / Playback control operations
  setCurrentTime: (time: number) => void
  setIsPlaying: (isPlaying: boolean) => void
  setVolume: (volume: number) => void
  setPlaybackRate: (rate: number) => void

  // 加载状态操作 / Loading state operations
  setLoadingState: (state: Partial<VideoLoadingState>) => void
  setLoadingStage: (stage: VideoLoadingStage, progress?: number) => void
  setLoadingError: (error: string | null) => void

  // 最近播放操作 / Recent plays operations
  addRecentPlay: (item: RecentPlayItem) => void
  updateRecentPlay: (fileId: string, updates: Partial<RecentPlayItem>) => void
  removeRecentPlay: (fileId: string) => void
  clearRecentPlays: () => void
  getRecentPlayByPath: (filePath: string) => RecentPlayItem | null

  // 设置缓存操作 / Settings cache operations
  setPlaybackSettings: (fileId: string, settings: VideoPlaybackSettings) => void
  getPlaybackSettings: (fileId: string) => VideoPlaybackSettings | null
  setUIConfig: (fileId: string, config: VideoUIConfig) => void
  getUIConfig: (fileId: string) => VideoUIConfig | null

  // 工具方法 / Utility methods
  validateState: () => { isValid: boolean; errors: string[] }
  resetToDefaults: () => void
}

/**
 * 视频存储类型 / Video Store Type
 */
export type VideoStore = VideoState & VideoActions

/**
 * 默认视频加载状态 / Default video loading state
 */
const defaultLoadingState: VideoLoadingState = {
  isLoading: false,
  stage: VideoLoadingStage.IDLE,
  progress: 0,
  error: null
}

/**
 * 初始状态 / Initial state
 */
const initialState: VideoState = {
  currentVideo: null,
  recentPlays: [],
  loadingState: defaultLoadingState,
  playbackSettingsCache: {},
  uiConfigCache: {}
}

/**
 * 状态验证规则 / State validation rules
 */
const stateValidationRules = {
  currentVideo: (value: unknown): value is CurrentVideoState | null =>
    value === null || (typeof value === 'object' && value !== null && 'fileId' in value),
  recentPlays: (value: unknown): value is RecentPlayItem[] => Array.isArray(value),
  loadingState: (value: unknown): value is VideoLoadingState =>
    typeof value === 'object' && value !== null && 'isLoading' in value,
  playbackSettingsCache: (value: unknown): value is Record<string, VideoPlaybackSettings> =>
    typeof value === 'object' && value !== null,
  uiConfigCache: (value: unknown): value is Record<string, VideoUIConfig> =>
    typeof value === 'object' && value !== null
}

/**
 * V2 视频状态存储 / V2 Video State Store
 *
 * 使用 Zustand + Immer + 持久化中间件管理视频状态
 * Uses Zustand + Immer + persistence middleware to manage video state
 */
export const useVideoStore = create<VideoStore>()(
  V2MiddlewarePresets.persistent('video-store', {
    // 选择性持久化：只持久化最近播放列表和设置缓存 / Selective persistence: only persist recent plays and settings cache
    partialize: (state: VideoStore) => ({
      recentPlays: state.recentPlays,
      playbackSettingsCache: state.playbackSettingsCache,
      uiConfigCache: state.uiConfigCache
    }),
    version: 1
  })(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (set: any, get: () => VideoStore): VideoStore => ({
      ...initialState,

      // 视频加载操作 / Video loading operations
      loadVideo: async (filePath: string, generateThumbnail = true) => {
        const startTime = Date.now()

        try {
          // 开始加载 / Start loading
          set((state: VideoStore) => {
            state.loadingState = {
              isLoading: true,
              stage: VideoLoadingStage.LOADING_METADATA,
              progress: 0,
              error: null,
              loadingStartTime: startTime
            }
          })

          StateDebug.logStateChange('VideoStore', 'loadVideo:start', get().loadingState, {
            isLoading: true,
            stage: VideoLoadingStage.LOADING_METADATA,
            progress: 0,
            error: null
          })

          // 模拟加载过程（实际实现中会调用 API）
          // Simulate loading process (actual implementation would call API)

          // 1. 加载元数据 / Load metadata
          set((state: VideoStore) => {
            state.loadingState.stage = VideoLoadingStage.LOADING_VIDEO
            state.loadingState.progress = 30
          })

          // 2. 加载视频 / Load video
          set((state: VideoStore) => {
            state.loadingState.stage = VideoLoadingStage.PROCESSING_THUMBNAIL
            state.loadingState.progress = 70
          })

          // 3. 处理缩略图 / Process thumbnail
          if (generateThumbnail) {
            set((state: VideoStore) => {
              state.loadingState.progress = 90
            })
          }

          // 4. 完成加载 / Complete loading
          const fileName = filePath.split('/').pop() || 'Unknown'
          const fileId = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`

          set((state: VideoStore) => {
            state.currentVideo = {
              fileId,
              filePath,
              fileName,
              duration: 0,
              currentTime: 0,
              isPlaying: false,
              volume: 1,
              playbackRate: 1
            }
            state.loadingState = {
              isLoading: false,
              stage: VideoLoadingStage.READY,
              progress: 100,
              error: null
            }
          })

          logger.info(`✅ 视频加载成功: ${fileName}`, {
            filePath,
            duration: Date.now() - startTime
          })
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '未知错误'

          set((state: VideoStore) => {
            state.loadingState = {
              isLoading: false,
              stage: VideoLoadingStage.ERROR,
              progress: 0,
              error: errorMessage
            }
          })

          logger.error(`❌ 视频加载失败: ${filePath}`, error)
          throw error
        }
      },

      clearVideo: () => {
        set((state: VideoStore) => {
          state.currentVideo = null
          state.loadingState = defaultLoadingState
        })

        StateDebug.logStateChange('VideoStore', 'clearVideo', get().currentVideo, null)
      },

      setVideoInfo: (videoInfo: VideoInfo) => {
        set((state: VideoStore) => {
          if (state.currentVideo) {
            state.currentVideo.videoInfo = videoInfo
            state.currentVideo.duration = videoInfo.duration
          }
        })
      },

      // 播放控制操作 / Playback control operations
      setCurrentTime: (time: number) => {
        set((state: VideoStore) => {
          if (state.currentVideo) {
            state.currentVideo.currentTime = Math.max(0, time)
          }
        })
      },

      setIsPlaying: (isPlaying: boolean) => {
        set((state: VideoStore) => {
          if (state.currentVideo) {
            state.currentVideo.isPlaying = isPlaying
          }
        })
      },

      setVolume: (volume: number) => {
        set((state: VideoStore) => {
          if (state.currentVideo) {
            state.currentVideo.volume = Math.max(0, Math.min(1, volume))
          }
        })
      },

      setPlaybackRate: (rate: number) => {
        set((state: VideoStore) => {
          if (state.currentVideo) {
            state.currentVideo.playbackRate = Math.max(0.25, Math.min(4, rate))
          }
        })
      },

      // 加载状态操作 / Loading state operations
      setLoadingState: (newState: Partial<VideoLoadingState>) => {
        set((state: VideoStore) => {
          Object.assign(state.loadingState, newState)
        })
      },

      setLoadingStage: (stage: VideoLoadingStage, progress = 0) => {
        set((state: VideoStore) => {
          state.loadingState.stage = stage
          state.loadingState.progress = progress
        })
      },

      setLoadingError: (error: string | null) => {
        set((state: VideoStore) => {
          state.loadingState.error = error
          if (error) {
            state.loadingState.stage = VideoLoadingStage.ERROR
            state.loadingState.isLoading = false
          }
        })
      },

      // 最近播放操作实现将在下一部分继续...
      addRecentPlay: (item: RecentPlayItem) => {
        set((state: VideoStore) => {
          // 移除已存在的相同文件 / Remove existing same file
          const existingIndex = state.recentPlays.findIndex(
            (play: RecentPlayItem) => play.videoInfo.filePath === item.videoInfo.filePath
          )

          if (existingIndex >= 0) {
            state.recentPlays.splice(existingIndex, 1)
          }

          // 添加到列表开头 / Add to beginning of list
          state.recentPlays.unshift(item)

          // 限制列表长度 / Limit list length
          if (state.recentPlays.length > 50) {
            state.recentPlays.splice(50)
          }
        })
      },

      updateRecentPlay: (fileId: string, updates: Partial<RecentPlayItem>) => {
        set((state: VideoStore) => {
          const index = state.recentPlays.findIndex(
            (play: RecentPlayItem) => play.videoInfo.id === fileId
          )

          if (index >= 0) {
            Object.assign(state.recentPlays[index], updates)
          }
        })
      },

      removeRecentPlay: (fileId: string) => {
        set((state: VideoStore) => {
          const index = state.recentPlays.findIndex(
            (play: RecentPlayItem) => play.videoInfo.id === fileId
          )

          if (index >= 0) {
            state.recentPlays.splice(index, 1)
          }
        })
      },

      clearRecentPlays: () => {
        set((state: VideoStore) => {
          state.recentPlays.splice(0)
        })
      },

      getRecentPlayByPath: (filePath: string) => {
        const state = get()
        return (
          state.recentPlays.find((play: RecentPlayItem) => play.videoInfo.filePath === filePath) ||
          null
        )
      },

      // 设置缓存操作 / Settings cache operations
      setPlaybackSettings: (fileId: string, settings: VideoPlaybackSettings) => {
        set((state: VideoStore) => {
          state.playbackSettingsCache[fileId] = settings
        })
      },

      getPlaybackSettings: (fileId: string) => {
        const state = get()
        return state.playbackSettingsCache[fileId] || null
      },

      setUIConfig: (fileId: string, config: VideoUIConfig) => {
        set((state: VideoStore) => {
          state.uiConfigCache[fileId] = config
        })
      },

      getUIConfig: (fileId: string) => {
        const state = get()
        return state.uiConfigCache[fileId] || null
      },

      // 工具方法 / Utility methods
      validateState: () => {
        const state = get()
        const { isValid, invalidKeys } = StateValidation.validateStateTypes(
          state as unknown as Record<string, unknown>,
          stateValidationRules
        )

        return {
          isValid,
          errors: invalidKeys.map((key) => `Invalid state for key: ${key}`)
        }
      },

      resetToDefaults: () => {
        set(() => ({ ...initialState }))
        logger.info('🔄 视频状态已重置为默认值')
      }
    })
  )
)
