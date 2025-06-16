import { useState, useEffect, useCallback } from 'react'

interface UpdateNotificationState {
  /**
   * 是否有新版本可用 / Whether a new version is available
   */
  hasNewVersion: boolean
  /**
   * 当前版本 / Current version
   */
  currentVersion: string
  /**
   * 最新版本 / Latest version
   */
  latestVersion: string | null
  /**
   * 上次检查时间 / Last check time
   */
  lastChecked: number | null
  /**
   * 用户上次查看的版本 / Last version seen by user
   */
  lastSeenVersion: string | null
  /**
   * 检查更新 / Check for updates
   */
  checkForUpdates: () => Promise<string | null>
  /**
   * 标记用户已查看更新 / Mark user has seen the update
   */
  markUpdateAsSeen: () => void
  /**
   * 刷新状态 / Refresh state
   */
  refreshState: () => void
}

const STORAGE_KEYS = {
  LAST_SEEN_VERSION: 'echolab_last_seen_version',
  LAST_CHECK_TIME: 'echolab_last_check_time',
  LATEST_VERSION: 'echolab_latest_version'
} as const

/**
 * 更新通知管理Hook / Update Notification Management Hook
 *
 * 管理应用版本更新通知的状态和逻辑。
 * 提供版本检测、红点显示控制和用户交互处理功能。
 *
 * Manages the state and logic for app version update notifications.
 * Provides version detection, red dot display control, and user interaction handling.
 *
 * Features:
 * - 版本检测和比较 / Version detection and comparison
 * - 本地存储管理 / Local storage management
 * - 红点显示逻辑 / Red dot display logic
 * - 用户交互处理 / User interaction handling
 *
 * @returns 更新通知状态和控制方法 / Update notification state and control methods
 */
export function useUpdateNotification(): UpdateNotificationState {
  const [state, setState] = useState<UpdateNotificationState>({
    // 状态 / State
    hasNewVersion: false,
    currentVersion: '',
    latestVersion: null,
    lastChecked: null,
    lastSeenVersion: null,

    // 方法 / Methods
    checkForUpdates: () => Promise.resolve(null),
    markUpdateAsSeen: () => {},
    refreshState: () => {}
  })

  // 从本地存储加载状态 / Load state from local storage
  const loadStoredState = useCallback(() => {
    try {
      const lastSeenVersion = localStorage.getItem(STORAGE_KEYS.LAST_SEEN_VERSION)
      const lastCheckTime = localStorage.getItem(STORAGE_KEYS.LAST_CHECK_TIME)
      const latestVersion = localStorage.getItem(STORAGE_KEYS.LATEST_VERSION)

      setState((prev) => ({
        ...prev,
        lastSeenVersion,
        lastChecked: lastCheckTime ? parseInt(lastCheckTime, 10) : null,
        latestVersion
      }))
    } catch (error) {
      console.warn('加载更新通知状态失败:', error)
    }
  }, [])

  // 获取当前应用版本 / Get current app version
  const getCurrentVersion = useCallback(async () => {
    try {
      const version = await window.api.update.getAppVersion()
      setState((prev) => ({ ...prev, currentVersion: version }))
      return version
    } catch (error) {
      console.warn('获取当前版本失败:', error)
      return ''
    }
  }, [])

  // 检查是否有新版本 / Check if there's a new version
  const checkForUpdates = useCallback(async (): Promise<string | null> => {
    try {
      // 调用实际的版本检查API / Call the actual version check API
      const updateResult = await window.api.update.checkForUpdates({ silent: true })

      if (updateResult && updateResult.info && updateResult.info.version) {
        const latestVersion = updateResult.info.version
        const currentTime = Date.now()

        // 保存到本地存储 / Save to local storage
        localStorage.setItem(STORAGE_KEYS.LATEST_VERSION, latestVersion)
        localStorage.setItem(STORAGE_KEYS.LAST_CHECK_TIME, currentTime.toString())

        setState((prev) => ({
          ...prev,
          latestVersion,
          lastChecked: currentTime
        }))

        return latestVersion
      }
    } catch (error) {
      console.warn('检查更新失败:', error)
    }
    return null
  }, [])

  // 比较版本号 / Compare version numbers
  const compareVersions = useCallback((current: string, latest: string): boolean => {
    if (!current || !latest) return false

    // 简单的版本比较逻辑，可以根据需要改进
    // Simple version comparison logic, can be improved as needed
    const currentParts = current.split('.').map(Number)
    const latestParts = latest.split('.').map(Number)

    for (let i = 0; i < Math.max(currentParts.length, latestParts.length); i++) {
      const currentPart = currentParts[i] || 0
      const latestPart = latestParts[i] || 0

      if (latestPart > currentPart) return true
      if (latestPart < currentPart) return false
    }

    return false
  }, [])

  // 更新hasNewVersion状态 / Update hasNewVersion state
  const updateNewVersionStatus = useCallback(() => {
    setState((prev) => {
      const { currentVersion, latestVersion, lastSeenVersion } = prev

      if (!currentVersion || !latestVersion) {
        return { ...prev, hasNewVersion: false }
      }

      const hasNewerVersion = compareVersions(currentVersion, latestVersion)
      const hasNotSeenLatest = !lastSeenVersion || compareVersions(lastSeenVersion, latestVersion)

      return {
        ...prev,
        hasNewVersion: hasNewerVersion && hasNotSeenLatest
      }
    })
  }, [compareVersions])

  // 标记用户已查看更新 / Mark user has seen the update
  const markUpdateAsSeen = useCallback(() => {
    setState((prev) => {
      const { latestVersion } = prev
      if (latestVersion) {
        localStorage.setItem(STORAGE_KEYS.LAST_SEEN_VERSION, latestVersion)
        return {
          ...prev,
          lastSeenVersion: latestVersion,
          hasNewVersion: false
        }
      }
      return prev
    })
  }, [])

  // 初始化 / Initialize
  useEffect(() => {
    loadStoredState()
    getCurrentVersion()

    // 初始化时检查一次更新 / Check for updates on initialization
    const initialCheck = async (): Promise<void> => {
      try {
        await checkForUpdates()
      } catch (error) {
        console.warn('初始化检查更新失败:', error)
      }
    }

    // 延迟5秒后进行初始检查，避免影响应用启动性能
    // Delay initial check by 5 seconds to avoid affecting app startup performance
    const timer = setTimeout(initialCheck, 5000)

    return () => clearTimeout(timer)
  }, [loadStoredState, getCurrentVersion, checkForUpdates])

  // 监听状态变化，更新hasNewVersion / Listen to state changes, update hasNewVersion
  useEffect(() => {
    updateNewVersionStatus()
  }, [state.currentVersion, state.latestVersion, state.lastSeenVersion, updateNewVersionStatus])

  return {
    // 状态 / State
    hasNewVersion: state.hasNewVersion,
    currentVersion: state.currentVersion,
    latestVersion: state.latestVersion,
    lastChecked: state.lastChecked,
    lastSeenVersion: state.lastSeenVersion,

    // 方法 / Methods
    checkForUpdates,
    markUpdateAsSeen,
    refreshState: loadStoredState
  }
}
