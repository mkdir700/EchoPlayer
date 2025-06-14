import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { devtools, persist, createJSONStorage } from 'zustand/middleware'
import { appConfigUpdateNotificationStorage } from '../adapters/appConfigStorage'
import type {
  UpdateNotificationStore,
  UpdateNotificationState,
  RedDotType,
  RedDotState
} from '../types'

// Storage keys are now handled by Zustand persist middleware
// 存储键名现在由 Zustand persist 中间件处理

/**
 * Default state for update notification store
 * 更新通知存储的默认状态
 */
const initialState: UpdateNotificationState = {
  // Version information - 版本信息
  currentVersion: '',
  latestVersion: null,
  lastChecked: null,
  lastSeenVersion: null,
  skippedVersions: [], // 用户跳过的版本列表 / List of versions skipped by user

  // Red dots management - 红点管理
  redDots: {},

  // Update status - 更新状态
  isCheckingForUpdates: false,
  hasNewVersion: false,

  // Settings - 设置
  autoCheckEnabled: true,
  checkInterval: 24 * 60 * 60 * 1000 // 24小时 / 24 hours
}

/**
 * Utility functions for version comparison and red dot management
 * 版本比较和红点管理的工具函数
 */

/**
 * Compare two semantic versions
 * 比较两个语义化版本
 * @param current - Current version
 * @param latest - Latest version
 * @returns true if latest > current
 */
function compareVersions(current: string, latest: string): boolean {
  if (!current || !latest) return false

  const currentParts = current.replace(/^v/, '').split('.').map(Number)
  const latestParts = latest.replace(/^v/, '').split('.').map(Number)

  for (let i = 0; i < Math.max(currentParts.length, latestParts.length); i++) {
    const currentPart = currentParts[i] || 0
    const latestPart = latestParts[i] || 0

    if (latestPart > currentPart) return true
    if (latestPart < currentPart) return false
  }

  console.log('compareVersions', current, latest, false)

  return false
}

// Red dot IDs are now managed directly in the store actions
// 红点ID现在直接在store操作中管理

/**
 * Update Notification Store for managing update-related state and red dots
 * 更新通知存储，用于管理更新相关状态和红点
 *
 * Features:
 * - Centralized red dot state management / 集中的红点状态管理
 * - Version tracking and comparison / 版本跟踪和比较
 * - Cross-component state synchronization / 跨组件状态同步
 * - Persistent storage integration / 持久化存储集成
 * - IPC communication with main process / 与主进程的IPC通信
 */
export const useUpdateNotificationStore = create<UpdateNotificationStore>()(
  devtools(
    persist(
      immer((set, get) => ({
        ...initialState,

        // Version management - 版本管理
        setCurrentVersion: (version: string) =>
          set((state) => {
            state.currentVersion = version
            // Update hasNewVersion when current version changes
            state.hasNewVersion = state.latestVersion
              ? compareVersions(version, state.latestVersion) &&
                (!state.lastSeenVersion ||
                  compareVersions(state.lastSeenVersion, state.latestVersion)) &&
                !state.skippedVersions.includes(state.latestVersion) // 检查版本是否被跳过 / Check if version is skipped
              : false
          }),

        setLatestVersion: (version: string | null) =>
          set((state) => {
            state.latestVersion = version
            // Update hasNewVersion when latest version changes
            state.hasNewVersion =
              version && state.currentVersion
                ? compareVersions(state.currentVersion, version) &&
                  (!state.lastSeenVersion || compareVersions(state.lastSeenVersion, version)) &&
                  !state.skippedVersions.includes(version) // 检查版本是否被跳过 / Check if version is skipped
                : false

            // Show update red dot if new version is available
            if (state.hasNewVersion && version) {
              const redDotId = 'update_available'
              state.redDots[redDotId] = {
                id: redDotId,
                type: 'update',
                visible: true,
                priority: 8,
                createdAt: Date.now(),
                metadata: { version }
              }
            }
          }),

        setLastChecked: (timestamp: number) =>
          set((state) => {
            state.lastChecked = timestamp
          }),

        setLastSeenVersion: (version: string) =>
          set((state) => {
            state.lastSeenVersion = version
            // Hide update red dot when user has seen the latest version
            state.hasNewVersion = state.latestVersion
              ? compareVersions(version, state.latestVersion) &&
                !state.skippedVersions.includes(state.latestVersion) // 检查版本是否被跳过 / Check if version is skipped
              : false

            if (!state.hasNewVersion) {
              // Clear update-related red dots
              Object.keys(state.redDots).forEach((id) => {
                if (state.redDots[id].type === 'update') {
                  state.redDots[id].visible = false
                }
              })
            }
          }),

        skipVersion: (version: string) =>
          set((state) => {
            // Add version to skipped list if not already present
            // 如果版本不在跳过列表中，则添加到列表中
            if (!state.skippedVersions.includes(version)) {
              state.skippedVersions.push(version)
            }

            // If the skipped version is the current latest version, hide update notifications
            // 如果跳过的版本是当前最新版本，隐藏更新通知
            if (state.latestVersion === version) {
              state.hasNewVersion = false

              // Clear update-related red dots
              Object.keys(state.redDots).forEach((id) => {
                if (state.redDots[id].type === 'update') {
                  state.redDots[id].visible = false
                }
              })
            }
          }),

        isVersionSkipped: (version: string) => {
          const state = get()
          return state.skippedVersions.includes(version)
        },

        // Update checking - 更新检查
        setIsCheckingForUpdates: (checking: boolean) =>
          set((state) => {
            state.isCheckingForUpdates = checking
          }),

        checkForUpdates: async () => {
          try {
            set((draft) => {
              draft.isCheckingForUpdates = true
            })

            // Call the actual update check API
            const updateResult = await window.api.update.checkForUpdates({ silent: true })

            if (updateResult && updateResult.info && updateResult.info.version) {
              const latestVersion = updateResult.info.version
              const currentTime = Date.now()

              set((draft) => {
                draft.latestVersion = latestVersion
                draft.lastChecked = currentTime

                // Update hasNewVersion
                draft.hasNewVersion = draft.currentVersion
                  ? compareVersions(draft.currentVersion, latestVersion) &&
                    (!draft.lastSeenVersion ||
                      compareVersions(draft.lastSeenVersion, latestVersion)) &&
                    !draft.skippedVersions.includes(latestVersion) // 检查版本是否被跳过 / Check if version is skipped
                  : false

                // Show red dot if new version is available
                if (draft.hasNewVersion) {
                  const redDotId = 'update_available'
                  draft.redDots[redDotId] = {
                    id: redDotId,
                    type: 'update',
                    visible: true,
                    priority: 8,
                    createdAt: Date.now(),
                    metadata: { version: latestVersion }
                  }
                }
              })
            }
          } catch (error) {
            console.warn('检查更新失败:', error)
          } finally {
            set((draft) => {
              draft.isCheckingForUpdates = false
            })
          }
        },

        markUpdateAsSeen: () => {
          const state = get()
          if (state.latestVersion) {
            set((draft) => {
              draft.lastSeenVersion = state.latestVersion!
              draft.hasNewVersion = false

              // Clear update-related red dots
              Object.keys(draft.redDots).forEach((id) => {
                if (draft.redDots[id].type === 'update') {
                  draft.redDots[id].visible = false
                }
              })
            })
          }
        },

        // Red dots management - 红点管理
        showRedDot: (id: string, type: RedDotType, options = {}) =>
          set((state) => {
            state.redDots[id] = {
              id,
              type,
              visible: true,
              priority: 5,
              createdAt: Date.now(),
              ...options
            }
          }),

        hideRedDot: (id: string) =>
          set((state) => {
            if (state.redDots[id]) {
              state.redDots[id].visible = false
            }
          }),

        clearRedDot: (id: string) =>
          set((state) => {
            delete state.redDots[id]
          }),

        clearAllRedDots: () =>
          set((state) => {
            state.redDots = {}
          }),

        clearExpiredRedDots: () =>
          set((state) => {
            const now = Date.now()
            Object.keys(state.redDots).forEach((id) => {
              const redDot = state.redDots[id]
              if (redDot.expiresAt && redDot.expiresAt < now) {
                delete state.redDots[id]
              }
            })
          }),

        // Red dot queries - 红点查询
        isRedDotVisible: (id: string) => {
          const state = get()
          return state.redDots[id]?.visible || false
        },

        getRedDotsByType: (type: RedDotType) => {
          const state = get()
          return Object.values(state.redDots).filter((redDot) => redDot.type === type)
        },

        hasVisibleRedDots: () => {
          const state = get()
          return Object.values(state.redDots).some((redDot) => redDot.visible)
        },

        // Settings - 设置
        setAutoCheckEnabled: (enabled: boolean) =>
          set((state) => {
            state.autoCheckEnabled = enabled
          }),

        setCheckInterval: (interval: number) =>
          set((state) => {
            state.checkInterval = interval
          }),

        // Initialization - 初始化
        initialize: async () => {
          try {
            // Get current version from main process
            const currentVersion = await window.api.window.getVersion()

            set((draft) => {
              draft.currentVersion = currentVersion
            })

            // Load stored data and perform initial update check
            const state = get()

            // Always perform initial update check on app startup
            // 应用启动时总是执行初始更新检查
            const now = Date.now()
            const shouldCheck = !state.lastChecked || now - state.lastChecked > state.checkInterval

            if (shouldCheck || state.autoCheckEnabled) {
              // Delay initial check to avoid affecting app startup
              // 延迟初始检查以避免影响应用启动性能
              setTimeout(() => {
                console.log('执行应用启动时的自动更新检查')
                state.checkForUpdates()
              }, 3000) // 减少延迟到3秒
            }

            // Clear expired red dots
            state.clearExpiredRedDots()
          } catch (error) {
            console.warn('初始化更新通知存储失败:', error)
          }
        },

        reset: () => set(() => ({ ...initialState }))
      })),
      {
        name: 'update-notification-config',
        storage: createJSONStorage(() => appConfigUpdateNotificationStorage),
        partialize: (state) => ({
          // Persist only necessary data to app config
          // 只持久化必要数据到 app config
          currentVersion: state.currentVersion,
          latestVersion: state.latestVersion,
          lastChecked: state.lastChecked,
          lastSeenVersion: state.lastSeenVersion,
          skippedVersions: state.skippedVersions, // 持久化跳过的版本列表 / Persist skipped versions list
          autoCheckEnabled: state.autoCheckEnabled,
          checkInterval: state.checkInterval
          // 注意：红点状态不持久化，因为它们是会话级的 / Note: red dot states are not persisted as they are session-level
        })
      }
    ),
    { name: 'update-notification-store' }
  )
)

// Selector hooks for better performance
export const useHasNewVersion = (): boolean =>
  useUpdateNotificationStore((state) => state.hasNewVersion)
export const useIsCheckingForUpdates = (): boolean =>
  useUpdateNotificationStore((state) => state.isCheckingForUpdates)
export const useUpdateRedDots = (): RedDotState[] =>
  useUpdateNotificationStore((state) =>
    Object.values(state.redDots).filter((redDot) => redDot.type === 'update' && redDot.visible)
  )
export const useHasVisibleRedDots = (): boolean =>
  useUpdateNotificationStore((state) => state.hasVisibleRedDots())
export const useIsShowRedDot = (id: string): boolean =>
  useUpdateNotificationStore((state) => state.isRedDotVisible(id))
