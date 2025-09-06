import { NotificationService } from '@renderer/services/NotificationService'
import useRuntimeStore from '@renderer/state/stores/runtime'
import { uuid } from '@renderer/utils'
import { IpcChannel } from '@shared/IpcChannel'
import type { ProgressInfo, UpdateInfo } from 'builder-util-runtime'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

export default function useUpdateHandler() {
  const { t } = useTranslation()
  const notificationService = NotificationService.getInstance()
  const setUpdateState = useRuntimeStore((s) => s.setUpdateState)

  useEffect(() => {
    if (!window.electron) return

    const ipcRenderer = window.electron.ipcRenderer

    const removers = [
      ipcRenderer.on(IpcChannel.UpdateNotAvailable, () => {
        setUpdateState({ checking: false })
        if (window.location.hash.includes('settings/about')) {
          window.message.success(t('settings.about.updateNotAvailable'))
        }
      }),
      ipcRenderer.on(IpcChannel.UpdateAvailable, (_, releaseInfo: UpdateInfo) => {
        notificationService.send({
          id: uuid(),
          type: 'info',
          title: t('button.update_available'),
          message: t('button.update_available', { version: releaseInfo.version }),
          timestamp: Date.now(),
          source: 'update',
          channel: 'system'
        })
        setUpdateState({
          checking: false,
          downloading: false, // 不自动开始下载，等待用户选择
          info: releaseInfo,
          available: true
        })
      }),
      ipcRenderer.on(IpcChannel.DownloadUpdate, () => {
        setUpdateState({
          checking: false,
          downloading: true
        })
      }),
      ipcRenderer.on(IpcChannel.DownloadProgress, (_, progress: ProgressInfo) => {
        setUpdateState({
          downloading: progress.percent < 100,
          downloadProgress: progress.percent
        })
      }),
      ipcRenderer.on(IpcChannel.UpdateDownloaded, (_, releaseInfo: UpdateInfo) => {
        setUpdateState({
          downloading: false,
          info: releaseInfo,
          downloaded: true
        })
      }),
      ipcRenderer.on(IpcChannel.UpdateError, (_, error) => {
        setUpdateState({
          checking: false,
          downloading: false,
          downloadProgress: 0
        })
        if (window.location.hash.includes('settings/about')) {
          window.modal.info({
            title: t('settings.about.updateError'),
            content: error?.message || t('settings.about.updateError'),
            icon: null
          })
        }
      })
    ]
    return () => removers.forEach((remover) => remover())
  }, [setUpdateState, notificationService, t])
}
