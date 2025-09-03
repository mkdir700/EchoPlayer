/**
 * SubtitleOverlay UI状态管理 Store（重构版）
 *
 * 重构后只管理字幕覆盖层的UI交互状态：
 * - 拖拽、调整尺寸等交互状态
 * - 悬停、边界显示等视觉状态
 * - 容器边界信息和响应式计算
 * - 文本选择状态
 *
 * 配置数据（显示模式、背景样式、位置、尺寸）现在存储在VideoProjectStore中
 * 使用 Zustand + Immer（不再持久化）
 */

import { loggerService } from '@logger'
import { SubtitleBackgroundType, SubtitleDisplayMode } from '@types'
import { Draft } from 'immer'
import { create, StateCreator } from 'zustand'

import { MiddlewarePresets } from '../infrastructure'
import { SubtitleOverlayConfig } from './player.store'

const logger = loggerService.withContext('SubtitleOverlayStore')

/**
 * 位置信息
 */
export interface Position {
  /** X 坐标（像素或百分比） */
  x: number
  /** Y 坐标（像素或百分比） */
  y: number
}

/**
 * 尺寸信息
 */
export interface Size {
  /** 宽度（像素或百分比） */
  width: number
  /** 高度（像素或百分比） */
  height: number
}

/**
 * SubtitleOverlay UI状态接口
 * 只包含UI交互状态，不包含配置数据
 */
export interface SubtitleOverlayState {
  /** 是否正在拖拽移动 */
  isDragging: boolean

  /** 是否正在调整尺寸 */
  isResizing: boolean

  /** 是否显示边界线（悬停时） */
  showBoundaries: boolean

  /** 是否悬停状态 */
  isHovered: boolean

  /** 是否显示控制按钮 */
  isControlsVisible: boolean

  /** 选中的文本 */
  selectedText: string

  /** 容器边界信息 */
  containerBounds: { width: number; height: number }

  /** 当前加载的配置（来自视频项目） */
  currentConfig: SubtitleOverlayConfig | null

  /** 当前配置对应的视频ID */
  currentVideoId: number | null
}

/**
 * SubtitleOverlay UI操作接口
 */
export interface SubtitleOverlayActions {
  // === 配置管理 ===
  /** 加载视频的字幕配置 */
  loadConfigForVideo: (videoId: number) => Promise<void>

  /** 保存当前配置到视频项目 */
  saveCurrentConfig: () => Promise<void>

  /** 更新当前配置 */
  updateConfig: (patch: Partial<SubtitleOverlayConfig>) => void

  /** 重置配置到默认值 */
  resetToDefaults: (videoId: number) => Promise<void>

  // === UI交互状态控制 ===
  /** 开始拖拽 */
  startDragging: () => void

  /** 停止拖拽 */
  stopDragging: () => void

  /** 开始调整尺寸 */
  startResizing: () => void

  /** 停止调整尺寸 */
  stopResizing: () => void

  /** 设置悬停状态 */
  setHovered: (isHovered: boolean) => void

  /** 设置选中文本 */
  setSelectedText: (text: string) => void

  // === 显示模式控制（操作当前配置） ===
  /** 设置显示模式 */
  setDisplayMode: (mode: SubtitleDisplayMode) => void

  /** 切换到下一个显示模式 */
  toggleDisplayMode: () => void

  // === 背景样式控制（操作当前配置） ===
  /** 设置背景类型 */
  setBackgroundType: (type: SubtitleBackgroundType) => void

  /** 设置透明度 */
  setOpacity: (opacity: number) => void

  // === 位置控制（操作当前配置） ===
  /** 设置位置 */
  setPosition: (position: Position) => void

  /** 更新位置（相对移动） */
  updatePosition: (deltaX: number, deltaY: number) => void

  // === 尺寸控制（操作当前配置） ===
  /** 设置尺寸 */
  setSize: (size: Size) => void

  /** 更新尺寸（相对调整） */
  updateSize: (deltaWidth: number, deltaHeight: number) => void

  // === 响应式处理 ===
  /** 更新容器边界 */
  updateContainerBounds: (bounds: { width: number; height: number }) => void

  /** 计算最佳位置 */
  calculateOptimalPosition: (videoDimensions: { width: number; height: number }) => void

  /** 适应容器尺寸变化 */
  adaptToContainerResize: (newBounds: { width: number; height: number }) => void

  /** 智能避让冲突区域 */
  avoidCollision: (
    conflictAreas: Array<{ x: number; y: number; width: number; height: number }>
  ) => void
}

export type SubtitleOverlayStore = SubtitleOverlayState & SubtitleOverlayActions

/**
 * 初始UI状态配置（不包含配置数据）
 */
const initialState: SubtitleOverlayState = {
  // UI交互状态
  isDragging: false,
  isResizing: false,
  showBoundaries: false,
  isHovered: false,
  isControlsVisible: false,
  selectedText: '',
  containerBounds: { width: 800, height: 600 },

  // 当前配置（来自视频项目）
  currentConfig: null,
  currentVideoId: null
}

/**
 * 显示模式循环顺序
 */
const DISPLAY_MODE_CYCLE: SubtitleDisplayMode[] = [
  SubtitleDisplayMode.NONE,
  SubtitleDisplayMode.ORIGINAL,
  SubtitleDisplayMode.TRANSLATED,
  SubtitleDisplayMode.BILINGUAL
]

/**
 * 创建 SubtitleOverlay Store
 */
const createSubtitleOverlayStore: StateCreator<
  SubtitleOverlayStore,
  [['zustand/immer', never]],
  [],
  SubtitleOverlayStore
> = (set, get) => {
  return {
    ...initialState,

    // === 配置管理 ===
    loadConfigForVideo: async (videoId) => {
      try {
        const config = await getSubtitleOverlayConfig(videoId)
        set((state: Draft<SubtitleOverlayStore>) => {
          state.currentConfig = config
          state.currentVideoId = videoId
        })
        logger.info('加载视频字幕配置', { videoId, config })
      } catch (error) {
        logger.error('加载字幕配置失败', { videoId, error })
      }
    },

    saveCurrentConfig: async () => {
      const state = get()
      if (state.currentVideoId && state.currentConfig) {
        try {
          await updateSubtitleOverlayConfig(state.currentVideoId, state.currentConfig)
        } catch (error) {
          logger.error('保存字幕配置失败', { videoId: state.currentVideoId, error })
        }
      }
    },

    updateConfig: (patch) =>
      set((state: Draft<SubtitleOverlayStore>) => {
        if (state.currentConfig) {
          // 深度合并配置
          Object.assign(state.currentConfig, {
            ...patch,
            backgroundStyle: {
              ...state.currentConfig.backgroundStyle,
              ...(patch.backgroundStyle ?? {})
            },
            position: {
              ...state.currentConfig.position,
              ...(patch.position ?? {})
            },
            size: {
              ...state.currentConfig.size,
              ...(patch.size ?? {})
            }
          })
          // 自动保存
          const actions = get()
          actions.saveCurrentConfig()
        }
      }),

    resetToDefaults: async (videoId) => {
      try {
        const newConfig = await resetSubtitleOverlayConfig(videoId)
        set((state: Draft<SubtitleOverlayStore>) => {
          state.currentConfig = newConfig
          state.currentVideoId = videoId
        })
      } catch (error) {
        logger.error('重置字幕配置失败', { videoId, error })
      }
    },

    // === UI交互状态控制 ===
    startDragging: () =>
      set((state: Draft<SubtitleOverlayStore>) => {
        state.isDragging = true
        state.showBoundaries = true
        logger.debug('开始拖拽覆盖层')
      }),

    stopDragging: () =>
      set((state: Draft<SubtitleOverlayStore>) => {
        state.isDragging = false
        state.showBoundaries = false
        logger.debug('停止拖拽覆盖层')
      }),

    startResizing: () =>
      set((state: Draft<SubtitleOverlayStore>) => {
        state.isResizing = true
        state.showBoundaries = true
        logger.debug('开始调整覆盖层尺寸')
      }),

    stopResizing: () =>
      set((state: Draft<SubtitleOverlayStore>) => {
        state.isResizing = false
        state.showBoundaries = false
        logger.debug('停止调整覆盖层尺寸')
      }),

    setHovered: (isHovered) =>
      set((state: Draft<SubtitleOverlayStore>) => {
        state.isHovered = isHovered
        state.isControlsVisible = isHovered || state.isDragging || state.isResizing
      }),

    setSelectedText: (text) =>
      set((state: Draft<SubtitleOverlayStore>) => {
        state.selectedText = text
        logger.debug('设置选中文本', { textLength: text.length })
      }),

    // === 显示模式控制（操作当前配置） ===
    setDisplayMode: (mode) => {
      const actions = get()
      actions.updateConfig({ displayMode: mode })
      logger.debug('设置字幕显示模式', { mode })
    },

    toggleDisplayMode: () => {
      const state = get()
      if (state.currentConfig) {
        const currentIndex = DISPLAY_MODE_CYCLE.indexOf(state.currentConfig.displayMode)
        const nextIndex = (currentIndex + 1) % DISPLAY_MODE_CYCLE.length
        const newMode = DISPLAY_MODE_CYCLE[nextIndex]

        const actions = get()
        actions.updateConfig({ displayMode: newMode })
        logger.debug('切换字幕显示模式', {
          from: state.currentConfig.displayMode,
          to: newMode
        })
      }
    },

    // === 背景样式控制（操作当前配置） ===
    setBackgroundType: (type) => {
      const state = get()
      if (state.currentConfig) {
        // 根据类型设置默认透明度
        let opacity = state.currentConfig.backgroundStyle.opacity
        switch (type) {
          case SubtitleBackgroundType.TRANSPARENT:
            opacity = 0.1
            break
          case SubtitleBackgroundType.BLUR:
            opacity = 0.8
            break
          case SubtitleBackgroundType.SOLID_BLACK:
          case SubtitleBackgroundType.SOLID_GRAY:
            opacity = 0.7
            break
        }

        const actions = get()
        actions.updateConfig({
          backgroundStyle: { type, opacity }
        })
        logger.debug('设置背景类型', { type, opacity })
      }
    },

    setOpacity: (opacity) => {
      const clampedOpacity = Math.max(0.1, Math.min(1.0, opacity))
      const state = get()
      if (state.currentConfig) {
        const actions = get()
        actions.updateConfig({
          backgroundStyle: {
            ...state.currentConfig.backgroundStyle,
            opacity: clampedOpacity
          }
        })
        logger.debug('设置透明度', { opacity: clampedOpacity })
      }
    },

    // === 位置控制（操作当前配置） ===
    setPosition: (position) => {
      const clampedPosition = {
        x: Math.max(0, Math.min(100, position.x)),
        y: Math.max(0, Math.min(100, position.y))
      }
      const actions = get()
      actions.updateConfig({ position: clampedPosition })
      logger.debug('设置覆盖层位置', { position: clampedPosition })
    },

    updatePosition: (deltaX, deltaY) => {
      const state = get()
      if (state.currentConfig) {
        const newPosition = {
          x: Math.max(0, Math.min(100, state.currentConfig.position.x + deltaX)),
          y: Math.max(0, Math.min(100, state.currentConfig.position.y + deltaY))
        }
        const actions = get()
        actions.updateConfig({ position: newPosition })
        logger.debug('更新覆盖层位置', { deltaX, deltaY, newPosition })
      }
    },

    // === 尺寸控制（操作当前配置） ===
    setSize: (size) => {
      const clampedSize = {
        width: Math.max(10, Math.min(100, size.width)),
        height: Math.max(5, Math.min(50, size.height))
      }
      const actions = get()
      actions.updateConfig({ size: clampedSize })
      logger.debug('设置覆盖层尺寸', { size: clampedSize })
    },

    updateSize: (deltaWidth, deltaHeight) => {
      const state = get()
      if (state.currentConfig) {
        const newSize = {
          width: Math.max(10, Math.min(100, state.currentConfig.size.width + deltaWidth)),
          height: Math.max(5, Math.min(50, state.currentConfig.size.height + deltaHeight))
        }
        const actions = get()
        actions.updateConfig({ size: newSize })
        logger.debug('更新覆盖层尺寸', { deltaWidth, deltaHeight, newSize })
      }
    },

    // === 响应式处理 ===
    updateContainerBounds: (bounds) =>
      set((state: Draft<SubtitleOverlayStore>) => {
        state.containerBounds = bounds
        logger.debug('更新容器边界', { bounds })
      }),

    calculateOptimalPosition: (videoDimensions) => {
      const state = get()
      if (!state.currentConfig || state.currentConfig.isInitialized) return

      const { width, height } = videoDimensions
      const aspectRatio = width / height

      // 定义多种定位策略
      const positioningStrategies = [
        {
          name: 'bottom-center',
          condition: () => aspectRatio > 1.3,
          position: { x: 10, y: 75 },
          size: { width: 80, height: 20 }
        },
        {
          name: 'bottom-wide',
          condition: () => aspectRatio > 2.0,
          position: { x: 15, y: 78 },
          size: { width: 70, height: 18 }
        },
        {
          name: 'middle-bottom',
          condition: () => aspectRatio <= 1.3 && aspectRatio > 0.8,
          position: { x: 5, y: 70 },
          size: { width: 90, height: 22 }
        },
        {
          name: 'vertical-bottom',
          condition: () => aspectRatio <= 0.8,
          position: { x: 3, y: 65 },
          size: { width: 94, height: 25 }
        }
      ]

      const strategy = positioningStrategies.find((s) => s.condition()) || positioningStrategies[0]

      const actions = get()
      actions.updateConfig({
        position: strategy.position,
        size: strategy.size,
        isInitialized: true
      })

      logger.info('计算最佳字幕位置', {
        videoDimensions,
        aspectRatio,
        strategy: strategy.name,
        position: strategy.position,
        size: strategy.size
      })
    },

    adaptToContainerResize: (newBounds) =>
      set((state: Draft<SubtitleOverlayStore>) => {
        const oldBounds = state.containerBounds
        state.containerBounds = newBounds

        if (!state.currentConfig) return

        const widthRatio = newBounds.width / Math.max(oldBounds.width, 1)
        const heightRatio = newBounds.height / Math.max(oldBounds.height, 1)

        if (Math.abs(widthRatio - 1) > 0.2 || Math.abs(heightRatio - 1) > 0.2) {
          const adjustedPosition = {
            x: Math.max(
              0,
              Math.min(100 - state.currentConfig.size.width, state.currentConfig.position.x)
            ),
            y: Math.max(0, Math.min(100 - 15, state.currentConfig.position.y))
          }

          const newAspectRatio = newBounds.width / newBounds.height
          const newSize = { ...state.currentConfig.size }

          if (newAspectRatio > 2.5 && newSize.width > 80) {
            newSize.width = Math.min(newSize.width, 70)
            adjustedPosition.x = Math.max(15, adjustedPosition.x)
          } else if (newAspectRatio < 1.0 && newSize.width < 85) {
            newSize.width = Math.max(newSize.width, 85)
            adjustedPosition.x = Math.max(0, Math.min(15, adjustedPosition.x))
          }

          const actions = get()
          actions.updateConfig({
            position: adjustedPosition,
            size: newSize
          })

          logger.info('适应容器尺寸变化', {
            oldBounds,
            newBounds,
            widthRatio,
            heightRatio,
            newPosition: adjustedPosition,
            newSize
          })
        }
      }),

    avoidCollision: (conflictAreas) => {
      const state = get()
      if (conflictAreas.length === 0 || !state.currentConfig) return

      const currentBounds = {
        x: state.currentConfig.position.x,
        y: state.currentConfig.position.y,
        width: state.currentConfig.size.width,
        height: 15
      }

      const hasCollision = conflictAreas.some((area) => {
        return !(
          currentBounds.x + currentBounds.width < area.x ||
          area.x + area.width < currentBounds.x ||
          currentBounds.y + currentBounds.height < area.y ||
          area.y + area.height < currentBounds.y
        )
      })

      if (!hasCollision) return

      const candidates = [
        { x: 10, y: 80 },
        { x: 10, y: 60 },
        { x: 5, y: 75 },
        { x: 25, y: 75 },
        { x: 40, y: 85 }
      ]

      for (const candidate of candidates) {
        const candidateBounds = {
          ...candidate,
          width: state.currentConfig.size.width,
          height: 15
        }

        const hasConflict = conflictAreas.some((area) => {
          return !(
            candidateBounds.x + candidateBounds.width < area.x ||
            area.x + area.width < candidateBounds.x ||
            candidateBounds.y + candidateBounds.height < area.y ||
            area.y + area.height < candidateBounds.y
          )
        })

        if (!hasConflict) {
          const actions = get()
          actions.updateConfig({ position: candidate })
          logger.info('避让冲突区域，移动到新位置', {
            oldPosition: currentBounds,
            newPosition: candidate,
            conflictAreas
          })
          break
        }
      }
    }
  }
}

/**
 * SubtitleOverlay Store 实例
 * 重构后只使用基础中间件（Immer + DevTools），不再持久化
 * 配置数据现在存储在 VideoProjectStore 中
 */
export const useSubtitleOverlayStore = create<SubtitleOverlayStore>()(
  MiddlewarePresets.temporary<SubtitleOverlayStore>('subtitle-overlay')(createSubtitleOverlayStore)
)

export default useSubtitleOverlayStore
