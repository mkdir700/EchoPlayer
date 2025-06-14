import * as React from 'react'
import { useEffect, useState, useCallback, useRef } from 'react'
import { UpdatePromptDialog } from './UpdatePromptDialog'
import { UpdateStatus, isMandatoryUpdate } from '../../../types/update'
import { useUpdateNotificationStore } from '@renderer/stores/slices/updateNotificationStore'

/**
 * UpdateNotification component that manages update status and displays the UpdatePromptDialog
 * 管理更新状态并显示 UpdatePromptDialog 的更新通知组件
 */
const UpdateNotification: React.FC = () => {
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  // 会话级抑制机制：记录在当前会话中被用户主动关闭的更新版本
  // Session-level suppression: track update versions dismissed by user in current session
  const suppressedVersionsRef = useRef<Set<string>>(new Set())

  // 获取跳过版本的方法 / Get skip version methods
  const { skipVersion, isVersionSkipped } = useUpdateNotificationStore()

  // 跟踪是否是用户主动检查更新 / Track if it's user-initiated update check
  const isUserInitiatedCheckRef = useRef(false)

  // 检查是否应该显示更新对话框（只对用户主动检查生效）
  // Check if update dialog should be shown (only for user-initiated checks)
  const shouldShowUpdateDialog = useCallback(
    (status: UpdateStatus): boolean => {
      const version = status.info?.version

      // 检查是否为强制更新
      const isUpdateMandatory = isMandatoryUpdate(status)

      // 强制更新总是显示
      if (isUpdateMandatory) {
        console.log(`版本 ${version} 是强制更新，显示对话框`)
        return (
          status.status === 'available' ||
          status.status === 'downloaded' ||
          status.status === 'error'
        )
      }

      // 如果是用户主动检查，忽略跳过状态和会话级抑制
      // If it's user-initiated check, ignore skip status and session suppression
      if (isUserInitiatedCheckRef.current) {
        console.log(`用户主动检查更新，忽略跳过状态和会话级抑制，显示对话框`)
        return (
          status.status === 'available' ||
          status.status === 'downloaded' ||
          status.status === 'error'
        )
      }

      // 对于自动检查，检查版本是否被用户跳过
      // For automatic checks, check if version is skipped by user
      if (version && isVersionSkipped(version)) {
        console.log(`版本 ${version} 已被用户跳过，不显示对话框`)
        return false
      }

      // 检查版本是否被会话级抑制（仅对自动检查生效）
      if (version && suppressedVersionsRef.current.has(version)) {
        console.log(`版本 ${version} 在当前会话中已被抑制，跳过显示更新对话框`)
        return false
      }

      // 对于自动检查（非用户主动检查），不显示对话框，只显示红点
      // For automatic checks (non-user-initiated), don't show dialog, only show red dot
      console.log('自动检查发现更新，不显示对话框，仅通过红点提示')
      return false
    },
    [isVersionSkipped]
  )

  useEffect(() => {
    // 监听来自主进程的更新状态消息 / Listen for update status messages from main process
    window.electron.ipcRenderer.on('update-status', (_event, status: UpdateStatus) => {
      console.log('收到更新状态:', status)
      setUpdateStatus(status)

      // 如果是检查状态，说明用户主动检查更新，设置标志并清除会话级抑制
      // If it's checking status, user initiated update check, set flag and clear session suppression
      if (status.status === 'checking') {
        console.log('用户主动检查更新，设置标志并清除会话级抑制')
        isUserInitiatedCheckRef.current = true
        suppressedVersionsRef.current.clear()
      } else if (status.status === 'not-available' || status.status === 'error') {
        // 只在检查完成且无更新或出错时重置用户主动检查标志
        // Only reset user-initiated check flag when check is complete and no update or error
        console.log('更新检查完成，重置用户主动检查标志')
        isUserInitiatedCheckRef.current = false
      }
      // 对于 'available' 和 'downloaded' 状态，保持用户主动检查标志，以便正确显示对话框
      // For 'available' and 'downloaded' status, keep user-initiated check flag to properly show dialog

      // 只对用户主动检查显示对话框（silent: false 的情况）
      // Only show dialog for user-initiated checks (silent: false cases)
      if (shouldShowUpdateDialog(status)) {
        setIsModalOpen(true)
      }
    })

    // 移除启动时的自动更新检查，改为非侵入式的后台检查
    // Remove startup auto-update check, replaced with non-intrusive background checks
    // checkForUpdates(true) - 已移除 / Removed

    // 清理函数 / Cleanup function
    return () => {
      window.electron.ipcRenderer.removeAllListeners('update-status')
    }
  }, [shouldShowUpdateDialog])

  // 检查更新 / Check for updates
  const checkForUpdates = async (silent = false): Promise<void> => {
    try {
      const result = await window.api.update.checkForUpdates({ silent })
      console.log('检查更新结果:', result)
    } catch (error) {
      console.error('检查更新失败:', error)
    }
  }

  // 下载更新 / Download update
  const downloadUpdate = async (): Promise<void> => {
    try {
      await window.api.update.downloadUpdate()
    } catch (error) {
      console.error('下载更新失败:', error)
    }
  }

  // 安装更新 / Install update
  const installUpdate = (): void => {
    window.api.update.installUpdate()
  }

  // 处理用户主动关闭更新对话框 - 会话级抑制 / Handle user dismissal - session-level suppression
  const handleDismiss = (): void => {
    const version = updateStatus?.info?.version
    if (version) {
      // 将版本添加到会话级抑制列表 / Add version to session-level suppression list
      suppressedVersionsRef.current.add(version)
      console.log(`版本 ${version} 已添加到会话级抑制列表`)
    }

    // 关闭对话框 / Close dialog
    setIsModalOpen(false)
  }

  // 处理下载动作 / Handle download action
  const handleDownload = (): void => {
    downloadUpdate()
    // 下载开始后不关闭对话框，让用户看到进度 / Don't close dialog after download starts, let user see progress
  }

  // 处理安装动作 / Handle install action
  const handleInstall = (): void => {
    installUpdate()
    // 安装后应用会重启，所以不需要关闭对话框 / App will restart after install, so no need to close dialog
  }

  // 处理重试动作 / Handle retry action
  const handleRetry = (): void => {
    checkForUpdates(false) // 非静默模式重新检查 / Re-check in non-silent mode
  }

  // 处理跳过版本动作 / Handle skip version action
  const handleSkipVersion = (): void => {
    const version = updateStatus?.info?.version
    if (version) {
      // 将版本添加到跳过列表 / Add version to skip list
      skipVersion(version)
      console.log(`版本 ${version} 已被跳过`)

      // 关闭对话框 / Close dialog
      setIsModalOpen(false)
    }
  }

  return (
    <UpdatePromptDialog
      isVisible={isModalOpen}
      updateStatus={updateStatus}
      onDownload={handleDownload}
      onInstall={handleInstall}
      onRetry={handleRetry}
      onDismiss={handleDismiss}
      onSkipVersion={handleSkipVersion}
    />
  )
}

export default UpdateNotification
