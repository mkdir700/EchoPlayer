import { app, BrowserWindow, ipcMain } from 'electron'
import { autoUpdater, UpdateInfo } from 'electron-updater'
import Logger from 'electron-log'
import { Conf } from 'electron-conf/main'
import type { UpdateSettings, UpdateStatus } from '../../types/shared'
import { is } from '@electron-toolkit/utils'
import { getUpdateChannel, getVersionInfo } from '../utils/version-parser'

// 创建更新设置存储
const updateStore = new Conf({
  name: 'echolab-update-settings',
  defaults: {
    updateSettings: {
      autoUpdate: true,
      lastChecked: 0,
      updateChannel: 'stable'
    }
  }
})

// 获取更新设置
function getUpdateSettings(): UpdateSettings {
  return updateStore.get('updateSettings') as UpdateSettings
}

// 保存更新设置
function saveUpdateSettings(settings: Partial<UpdateSettings>): void {
  const currentSettings = getUpdateSettings()
  updateStore.set('updateSettings', { ...currentSettings, ...settings })
}

// 配置日志
Logger.transports.file.level = 'debug'
autoUpdater.logger = Logger

// 自动更新的定时器
let autoUpdateTimer: NodeJS.Timeout | null = null

/**
 * 获取有效的更新渠道
 * Get effective update channel
 *
 * 优先使用用户手动设置的渠道，如果没有设置则使用基于版本自动检测的渠道
 * Prioritize user-set channel, fallback to auto-detected channel based on version
 */
function getEffectiveUpdateChannel(): string {
  const currentVersion = app.getVersion()
  const detectedChannel = getUpdateChannel(currentVersion)
  const settings = getUpdateSettings()

  // 如果用户设置了渠道且不是默认的stable，使用用户设置
  // If user has set a channel and it's not the default stable, use user setting
  const userChannel = settings.updateChannel
  const effectiveChannel = userChannel && userChannel !== 'stable' ? userChannel : detectedChannel

  Logger.info('渠道选择逻辑:', {
    currentVersion,
    detectedChannel,
    userSetChannel: userChannel,
    effectiveChannel
  })

  return effectiveChannel
}

/**
 * 配置 autoUpdater 的更新渠道
 * Configure autoUpdater update channel
 *
 * 根据当前版本和用户设置动态设置更新渠道
 * Dynamically set update channel based on current version and user settings
 */
function configureAutoUpdater(): void {
  // 获取有效的更新渠道
  const effectiveChannel = getEffectiveUpdateChannel()

  // 设置 autoUpdater 的渠道
  // electron-updater 会根据这个渠道查找对应的更新文件
  autoUpdater.channel = effectiveChannel

  Logger.info(`AutoUpdater 配置完成:`, {
    channel: effectiveChannel,
    version: app.getVersion()
  })

  // 在生产环境中，electron-updater 会自动使用 GitHub 发布
  // 由于 electron-builder.yml 中设置了 generateUpdatesFilesForAllChannels: true
  // electron-updater 会查找带有对应渠道标签的发布版本
  if (!is.dev) {
    Logger.info(`生产环境: 使用 GitHub 发布，渠道: ${effectiveChannel}`)
  }
}

export function setupUpdateHandlers(mainWindow: BrowserWindow): void {
  // 发送状态到窗口
  function sendStatusToWindow(status: UpdateStatus): void {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('update-status', status)
    }
  }

  // 设置 autoUpdater 基础配置
  autoUpdater.autoDownload = false // 禁用自动下载，让用户决定是否下载
  autoUpdater.autoInstallOnAppQuit = false // 禁用自动安装，让用户决定何时安装

  // 配置更新渠道
  configureAutoUpdater()

  // 开发模式下，设置本地更新源
  if (is.dev) {
    const localUpdateUrl = 'http://localhost:8384' // 假设你的本地服务器跑在 8384 端口
    Logger.info(`开发模式：设置更新源为 ${localUpdateUrl}`)

    // 强制在开发模式下启用更新检查
    autoUpdater.forceDevUpdateConfig = true

    autoUpdater.setFeedURL({
      provider: 'generic',
      url: localUpdateUrl,
      // 为了简化初次测试，我们先使用 'latest'，不根据应用内设置的 channel 动态改变
      // 你需要确保本地服务器的 manifest 文件名是 'latest.yml' (或者对应平台的 'latest-mac.yml' 等)
      channel: 'latest'
    })
  }

  // 获取应用版本
  ipcMain.handle('get-app-version', (): string => {
    return app.getVersion()
  })

  // 获取当前版本的更新渠道信息
  ipcMain.handle('get-version-info', () => {
    const currentVersion = app.getVersion()
    const versionInfo = getVersionInfo(currentVersion)

    Logger.info('版本信息:', {
      version: currentVersion,
      detectedChannel: versionInfo.channel,
      isValid: versionInfo.isValid,
      pattern: versionInfo.pattern?.name
    })

    return versionInfo
  })

  // 获取当前版本的自动检测渠道
  ipcMain.handle('get-auto-detected-channel', (): string => {
    const currentVersion = app.getVersion()
    const detectedChannel = getUpdateChannel(currentVersion)

    Logger.info(`自动检测到的更新渠道: ${detectedChannel} (基于版本: ${currentVersion})`)

    return detectedChannel
  })

  // 获取有效的更新渠道（考虑用户设置和自动检测）
  ipcMain.handle('get-effective-update-channel', (): string => {
    return getEffectiveUpdateChannel()
  })

  // 获取更新设置
  ipcMain.handle('get-update-settings', (): UpdateSettings => {
    return getUpdateSettings()
  })

  // 保存更新设置
  ipcMain.handle(
    'save-update-settings',
    (_event, settings: Partial<UpdateSettings>): UpdateSettings => {
      saveUpdateSettings(settings)
      return getUpdateSettings()
    }
  )

  // 检查更新
  ipcMain.handle(
    'check-for-updates',
    async (_event, options: { silent?: boolean } = {}): Promise<UpdateStatus> => {
      try {
        // 保存最后检查时间
        saveUpdateSettings({ lastChecked: Date.now() })

        // 重新配置 autoUpdater 渠道（以防用户在运行时更改了设置）
        // Reconfigure autoUpdater channel (in case user changed settings at runtime)
        configureAutoUpdater()

        // 获取有效的更新渠道用于日志记录
        const effectiveChannel = getEffectiveUpdateChannel()

        Logger.info(`使用更新渠道: ${effectiveChannel}`)

        Logger.info('正在检查更新...')

        if (!options.silent) {
          sendStatusToWindow({
            status: 'checking'
          })
        }

        const checkResult = await autoUpdater.checkForUpdates()
        Logger.info('更新检查结果:', checkResult)

        // 检查结果可能为null
        if (!checkResult) {
          throw new Error('更新检查失败，未收到有效响应')
        }

        if (checkResult.updateInfo.version !== app.getVersion()) {
          // 有可用的更新
          Logger.info('发现新版本:', checkResult.updateInfo.version)

          if (!options.silent) {
            sendStatusToWindow({
              status: 'available',
              info: checkResult.updateInfo
            })
          }

          return {
            status: 'available',
            info: checkResult.updateInfo
          }
        } else {
          // 无可用的更新
          Logger.info('当前已是最新版本')

          if (!options.silent) {
            sendStatusToWindow({
              status: 'not-available',
              info: checkResult.updateInfo
            })
          }

          return {
            status: 'not-available',
            info: checkResult.updateInfo
          }
        }
      } catch (error) {
        Logger.error('检查更新时出错:', error)

        if (!options.silent) {
          sendStatusToWindow({
            status: 'error',
            error: String(error)
          })
        }

        return {
          status: 'error',
          error: error instanceof Error ? error.message : '未知错误'
        }
      }
    }
  )

  // 下载更新
  ipcMain.handle('download-update', async (): Promise<UpdateStatus> => {
    try {
      sendStatusToWindow({
        status: 'downloading',
        progress: { percent: 0, bytesPerSecond: 0, total: 0, transferred: 0 }
      })

      await autoUpdater.downloadUpdate()

      return {
        status: 'downloaded'
      }
    } catch (error) {
      Logger.error('下载更新失败:', error)
      sendStatusToWindow({
        status: 'error',
        error: error instanceof Error ? error.message : '未知错误'
      })
      return {
        status: 'error',
        error: error instanceof Error ? error.message : '未知错误'
      }
    }
  })

  // 安装更新
  ipcMain.handle('install-update', (): void => {
    autoUpdater.quitAndInstall(false, true)
  })

  // 启用或禁用自动更新
  ipcMain.handle('enable-auto-update', async (_event, enable: boolean): Promise<void> => {
    saveUpdateSettings({ autoUpdate: enable })

    // 清除现有的定时器
    if (autoUpdateTimer) {
      clearInterval(autoUpdateTimer)
      autoUpdateTimer = null
    }

    if (enable) {
      // 启动自动更新检查
      startAutoUpdateSchedule()
    }

    Logger.info(`自动更新已${enable ? '启用' : '禁用'}`)
  })

  // 设置更新渠道
  ipcMain.handle(
    'set-update-channel',
    (_event, channel: 'stable' | 'beta' | 'alpha'): UpdateSettings => {
      saveUpdateSettings({ updateChannel: channel })

      // 重新配置 autoUpdater 以使用新的渠道设置
      // Reconfigure autoUpdater to use the new channel setting
      configureAutoUpdater()

      Logger.info(`更新渠道已设置为: ${channel}`)

      return getUpdateSettings()
    }
  )

  // 启动自动更新检查计划
  function startAutoUpdateSchedule(): void {
    const settings = getUpdateSettings()
    if (!settings.autoUpdate) return

    // 首次启动后5分钟检查一次更新
    setTimeout(
      () => {
        // 在自动检查前重新配置渠道
        configureAutoUpdater()
        autoUpdater.checkForUpdates().catch((err) => {
          Logger.error('自动检查更新失败:', err)
        })
      },
      5 * 60 * 1000
    ) // 5 分钟

    // 之后每4小时检查一次更新
    autoUpdateTimer = setInterval(
      () => {
        const currentSettings = getUpdateSettings()
        if (currentSettings.autoUpdate) {
          // 在自动检查前重新配置渠道
          configureAutoUpdater()
          autoUpdater.checkForUpdates().catch((err) => {
            Logger.error('自动检查更新失败:', err)
          })
        }
      },
      4 * 60 * 60 * 1000
    ) // 4 小时
  }

  // 监听更新事件
  autoUpdater.on('checking-for-update', () => {
    Logger.info('开始检查更新')
    sendStatusToWindow({ status: 'checking' })
  })

  autoUpdater.on('update-available', (info: UpdateInfo) => {
    Logger.info('发现可用更新:', info.version)
    sendStatusToWindow({ status: 'available', info })
  })

  autoUpdater.on('update-not-available', (info: UpdateInfo) => {
    Logger.info('当前为最新版本:', info.version)
    sendStatusToWindow({ status: 'not-available', info })
  })

  autoUpdater.on('download-progress', (progressObj) => {
    Logger.info('下载进度:', `${Math.round(progressObj.percent)}%`)
    sendStatusToWindow({
      status: 'downloading',
      progress: progressObj
    })
  })

  autoUpdater.on('update-downloaded', (info: UpdateInfo) => {
    Logger.info('更新下载完成:', info.version)
    sendStatusToWindow({ status: 'downloaded', info })
  })

  autoUpdater.on('error', (err: Error) => {
    Logger.error('更新错误:', err.message)
    sendStatusToWindow({
      status: 'error',
      error: err.message
    })
  })

  // 应用启动时检查自动更新设置
  const settings = getUpdateSettings()
  if (settings.autoUpdate) {
    startAutoUpdateSchedule()
  }

  Logger.info('更新处理器已初始化')
}
