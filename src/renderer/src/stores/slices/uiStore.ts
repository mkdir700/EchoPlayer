import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { devtools } from 'zustand/middleware'
import type { UIStore, UIState } from '../types'

// Default state
const initialState: UIState = {
  fullscreen: {
    isFullscreen: false,
    isInFullscreenMode: false
  },
  showPlayPageHeader: true,
  showSubtitleList: true,
  sidebarWidth: 400,
  showControls: false,
  isDragging: false,
  isSubtitleLayoutLocked: false,
  autoResumeAfterWordCard: true // 默认开启查词后自动恢复播放 / Default enabled auto resume after word card
}

/**
 * UI Store for managing application UI state including fullscreen mode, layout visibility, etc.
 *
 * Uses Zustand with Immer for immutable state updates and DevTools for debugging.
 */
export const useUIStore = create<UIStore>()(
  devtools(
    immer((set) => ({
      ...initialState,

      // Fullscreen actions
      toggleFullscreen: () =>
        set((state) => {
          state.fullscreen.isFullscreen = !state.fullscreen.isFullscreen
          state.fullscreen.isInFullscreenMode = state.fullscreen.isFullscreen
          // 根据全屏状态调整UI显示
          state.showPlayPageHeader = !state.fullscreen.isFullscreen
          state.showSubtitleList = !state.fullscreen.isFullscreen
        }),

      setFullscreen: (isFullscreen) =>
        set((state) => {
          state.fullscreen.isFullscreen = isFullscreen
          state.fullscreen.isInFullscreenMode = isFullscreen
          // 根据全屏状态调整UI显示
          state.showPlayPageHeader = !isFullscreen
          state.showSubtitleList = !isFullscreen
        }),

      enterFullscreenMode: () =>
        set((state) => {
          state.fullscreen.isInFullscreenMode = true
          state.showPlayPageHeader = false
          state.showSubtitleList = false
        }),

      exitFullscreenMode: () =>
        set((state) => {
          state.fullscreen.isInFullscreenMode = false
          state.showPlayPageHeader = true
          state.showSubtitleList = true
        }),

      // Layout actions
      togglePlayPageHeader: () =>
        set((state) => {
          state.showPlayPageHeader = !state.showPlayPageHeader
        }),

      toggleSubtitleList: () =>
        set((state) => {
          state.showSubtitleList = !state.showSubtitleList
        }),

      setSidebarWidth: (width) =>
        set((state) => {
          state.sidebarWidth = Math.max(200, Math.min(800, width))
        }),

      setShowControls: (show) =>
        set((state) => {
          state.showControls = show
        }),

      setIsDragging: (isDragging) =>
        set((state) => {
          state.isDragging = isDragging
        }),

      setSubtitleLayoutLocked: (locked) =>
        set((state) => {
          state.isSubtitleLayoutLocked = locked
        }),

      setAutoResumeAfterWordCard: (enabled) =>
        set((state) => {
          state.autoResumeAfterWordCard = enabled
        })
    })),
    { name: 'ui-store' }
  )
)

// Selector for subtitle layout lock state - 字幕布局锁定状态选择器
export const useSubtitleLayoutLocked = (): boolean =>
  useUIStore((state) => state.isSubtitleLayoutLocked)
