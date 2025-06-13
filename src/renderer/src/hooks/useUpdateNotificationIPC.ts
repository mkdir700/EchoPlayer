import { useEffect, useCallback } from 'react'
import { useUpdateNotificationStore } from '@renderer/stores'
import type { UpdateStatus } from '@types_/shared'

/**
 * Hook for integrating UpdateNotificationStore with IPC communication
 * 用于集成UpdateNotificationStore与IPC通信的Hook
 *
 * This hook establishes the bridge between the main process update events
 * and the centralized update notification state management.
 *
 * 此Hook建立主进程更新事件与集中式更新通知状态管理之间的桥梁。
 *
 * Features:
 * - Listens to 'update-status' IPC events from main process
 * - Synchronizes update status with UpdateNotificationStore
 * - Handles automatic red dot management based on update status
 * - Provides centralized update state across all components
 *
 * 功能特性:
 * - 监听来自主进程的'update-status' IPC事件
 * - 将更新状态与UpdateNotificationStore同步
 * - 基于更新状态自动管理红点
 * - 为所有组件提供集中的更新状态
 */
export function useUpdateNotificationIPC(): void {
  const {
    setLatestVersion,
    setLastChecked,
    setIsCheckingForUpdates,
    showRedDot,
    hideRedDot,
    initialize
  } = useUpdateNotificationStore()

  /**
   * Handle update status from main process
   * 处理来自主进程的更新状态
   */
  const handleUpdateStatus = useCallback(
    (status: UpdateStatus) => {
      console.log('收到更新状态 (IPC):', status)

      // Update checking status
      setIsCheckingForUpdates(status.status === 'checking')

      // Handle different update statuses
      switch (status.status) {
        case 'checking':
          // Show checking indicator, hide previous red dots
          hideRedDot('update_available')
          hideRedDot('update_error')
          break

        case 'available':
          // New version available
          if (status.info?.version) {
            console.log(`[IPC] 收到新版本信息: ${status.info.version}`)

            // Get current state to debug
            const currentState = useUpdateNotificationStore.getState()
            console.log(`[IPC] 当前状态:`, {
              currentVersion: currentState.currentVersion,
              latestVersion: currentState.latestVersion,
              lastSeenVersion: currentState.lastSeenVersion,
              hasNewVersion: currentState.hasNewVersion
            })

            setLatestVersion(status.info.version)
            setLastChecked(Date.now())

            // Check state after setLatestVersion
            const afterSetState = useUpdateNotificationStore.getState()
            console.log(`[IPC] setLatestVersion后状态:`, {
              currentVersion: afterSetState.currentVersion,
              latestVersion: afterSetState.latestVersion,
              lastSeenVersion: afterSetState.lastSeenVersion,
              hasNewVersion: afterSetState.hasNewVersion
            })

            // Show update available red dot (backup mechanism)
            showRedDot('update_available', 'update', {
              priority: 8,
              metadata: {
                version: status.info.version,
                releaseNotes: status.info.releaseNotes,
                releaseDate: status.info.releaseDate
              }
            })

            console.log(`[IPC] 已显示红点，发现新版本: ${status.info.version}`)
          }
          break

        case 'not-available':
          // No update available
          setLastChecked(Date.now())
          hideRedDot('update_available')
          hideRedDot('update_error')
          hideRedDot('update_ready')
          hideRedDot('update_downloading')
          console.log('当前已是最新版本')
          break

        case 'downloaded':
          // Update downloaded, ready to install
          if (status.info?.version) {
            // Update red dot to indicate ready to install
            showRedDot('update_ready', 'update', {
              priority: 9,
              metadata: {
                version: status.info.version,
                action: 'install'
              }
            })

            // Hide the "available" red dot
            hideRedDot('update_available')

            console.log(`更新已下载完成: ${status.info.version}`)
          }
          break

        case 'downloading':
          // Update is downloading
          if (status.progress && status.progress.percent !== undefined) {
            // Update red dot with download progress
            showRedDot('update_downloading', 'update', {
              priority: 7,
              metadata: {
                progress: status.progress.percent,
                action: 'downloading'
              }
            })

            console.log(`下载进度: ${Math.round(status.progress.percent)}%`)
          }
          break

        case 'error':
          // Update check or download error
          hideRedDot('update_available')
          hideRedDot('update_downloading')

          showRedDot('update_error', 'update', {
            priority: 6,
            metadata: {
              error: status.error,
              action: 'retry'
            },
            expiresAt: Date.now() + 30 * 60 * 1000 // Expire after 30 minutes
          })

          console.error('更新错误:', status.error)
          break

        default:
          console.warn('未知的更新状态:', status.status)
      }
    },
    [setLatestVersion, setLastChecked, setIsCheckingForUpdates, showRedDot, hideRedDot]
  )

  /**
   * Setup IPC listeners and initialize store
   * 设置IPC监听器并初始化存储
   */
  useEffect(() => {
    // Initialize the store
    initialize()

    // Setup IPC listener for update status
    const handleIpcUpdateStatus = (_event: unknown, status: UpdateStatus): void => {
      handleUpdateStatus(status)
    }

    // Register IPC listener
    window.electron.ipcRenderer.on('update-status', handleIpcUpdateStatus)

    console.log('UpdateNotificationIPC: IPC监听器已设置')

    // Cleanup function
    return () => {
      window.electron.ipcRenderer.removeAllListeners('update-status')
      console.log('UpdateNotificationIPC: IPC监听器已清理')
    }
  }, [initialize, handleUpdateStatus])

  /**
   * Periodic cleanup of expired red dots
   * 定期清理过期的红点
   */
  useEffect(() => {
    const { clearExpiredRedDots } = useUpdateNotificationStore.getState()

    // Clean up expired red dots every 5 minutes
    const cleanupInterval = setInterval(
      () => {
        clearExpiredRedDots()
      },
      5 * 60 * 1000
    )

    return () => {
      clearInterval(cleanupInterval)
    }
  }, [])
}
