import { isWin } from '@main/constant'
import { generateUserAgent } from '@main/utils/systemInfo'
import { FeedUrl, UpgradeChannel } from '@shared/config/constant'
import { IpcChannel } from '@shared/IpcChannel'
import { CancellationToken, UpdateInfo } from 'builder-util-runtime'
import { app, BrowserWindow, dialog } from 'electron'
import logger from 'electron-log'
import {
  AppUpdater as _AppUpdater,
  autoUpdater,
  NsisUpdater,
  UpdateCheckResult
} from 'electron-updater'
import path from 'path'

import icon from '../../../build/icon.png?asset'
import { configManager } from './ConfigManager'

export default class AppUpdater {
  autoUpdater: _AppUpdater = autoUpdater
  private releaseInfo: UpdateInfo | undefined
  private cancellationToken: CancellationToken = new CancellationToken()
  private updateCheckResult: UpdateCheckResult | null = null

  constructor(mainWindow: BrowserWindow) {
    logger.transports.file.level = 'info'

    autoUpdater.logger = logger
    autoUpdater.forceDevUpdateConfig = !app.isPackaged
    autoUpdater.autoDownload = configManager.getAutoUpdate()
    autoUpdater.autoInstallOnAppQuit = configManager.getAutoUpdate()
    autoUpdater.requestHeaders = {
      ...autoUpdater.requestHeaders,
      'User-Agent': generateUserAgent()
    }

    autoUpdater.on('error', (error) => {
      // 简单记录错误信息和时间戳
      logger.error('更新异常', {
        message: error.message,
        stack: error.stack,
        time: new Date().toISOString()
      })
      mainWindow.webContents.send(IpcChannel.UpdateError, error)
    })

    autoUpdater.on('update-available', (releaseInfo: UpdateInfo) => {
      logger.info('检测到新版本', releaseInfo)
      mainWindow.webContents.send(IpcChannel.UpdateAvailable, releaseInfo)
    })

    // 检测到不需要更新时
    autoUpdater.on('update-not-available', () => {
      mainWindow.webContents.send(IpcChannel.UpdateNotAvailable)
    })

    // 更新下载进度
    autoUpdater.on('download-progress', (progress) => {
      mainWindow.webContents.send(IpcChannel.DownloadProgress, progress)
    })

    // 当需要更新的内容下载完成后
    autoUpdater.on('update-downloaded', (releaseInfo: UpdateInfo) => {
      mainWindow.webContents.send(IpcChannel.UpdateDownloaded, releaseInfo)
      this.releaseInfo = releaseInfo
      logger.info('下载完成', releaseInfo)
    })

    if (isWin) {
      ;(autoUpdater as NsisUpdater).installDirectory = path.dirname(app.getPath('exe'))
    }

    this.autoUpdater = autoUpdater
  }

  private async _getPreReleaseVersionFromGithub(
    channel: UpgradeChannel
  ): Promise<GithubReleaseInfo | null> {
    try {
      logger.info('get pre release version from github', channel)
      const responses = await fetch(
        'https://api.github.com/repos/mkdir700/EchoPlayer/releases?per_page=20',
        {
          headers: {
            Accept: 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28',
            'Accept-Language': 'en-US,en;q=0.9'
          }
        }
      )
      const data = (await responses.json()) as GithubReleaseInfo[]

      // 过滤出匹配渠道的预发布版本
      const matchingReleases = data.filter((item: GithubReleaseInfo) => {
        return item.prerelease && item.tag_name.includes(`-${channel}.`)
      })

      if (matchingReleases.length === 0) {
        logger.info('No matching pre-release found for channel:', channel)
        return null
      }

      // 按发布时间排序，获取最新的版本
      const release = matchingReleases.sort(
        (a, b) =>
          new Date(b.published_at || '').getTime() - new Date(a.published_at || '').getTime()
      )[0]

      logger.info('Latest release info for channel', channel, ':', release)
      return release
    } catch (error) {
      logger.error('Failed to get latest not draft version from github:', error)
      return null
    }
  }

  private async _getIpCountry() {
    try {
      // add timeout using AbortController
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)

      const ipinfo = await fetch('https://ipinfo.io/json', {
        signal: controller.signal,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9'
        }
      })

      clearTimeout(timeoutId)
      const data = await ipinfo.json()
      return data.country || 'CN'
    } catch (error) {
      logger.error('Failed to get ipinfo:', error)
      return 'CN'
    }
  }

  public setAutoUpdate(isActive: boolean) {
    autoUpdater.autoDownload = isActive
    autoUpdater.autoInstallOnAppQuit = isActive
  }

  private _getChannelByVersion(version: string) {
    if (version.includes(`-${UpgradeChannel.BETA}.`)) {
      return UpgradeChannel.BETA
    }
    if (version.includes(`-${UpgradeChannel.ALPHA}.`)) {
      return UpgradeChannel.ALPHA
    }
    return UpgradeChannel.LATEST
  }

  private _getTestChannel(): UpgradeChannel {
    const currentChannel = this._getChannelByVersion(app.getVersion())
    const savedChannel = configManager.getTestChannel()

    if (currentChannel === UpgradeChannel.LATEST) {
      return savedChannel || UpgradeChannel.ALPHA
    }

    if (savedChannel === currentChannel) {
      return savedChannel
    }

    // if the upgrade channel is not equal to the current channel, use the latest channel
    return UpgradeChannel.LATEST
  }

  private async _setFeedUrl(
    channel: UpgradeChannel,
    testPlan: boolean,
    release: GithubReleaseInfo | null = null
  ) {
    logger.info('Setting feed URL - testPlan:', testPlan)

    // 获取IP地址归属地
    const ipCountry = await this._getIpCountry()
    logger.info('Detected IP country:', ipCountry)
    const isChinaUser = ipCountry.toLowerCase() === 'cn'

    if (channel === UpgradeChannel.LATEST) {
      this.autoUpdater.channel = UpgradeChannel.LATEST
      if (isChinaUser) {
        this.autoUpdater.setFeedURL(FeedUrl.PRODUCTION)
        logger.info('Using production releases for CN user')
      } else {
        this.autoUpdater.setFeedURL(FeedUrl.GITHUB_LATEST)
        logger.info('Using GitHub latest releases for test plan')
      }
      return
    }

    if (testPlan && release) {
      if (isChinaUser) {
        // 为中国用户使用对应的预发布渠道
        const chineseFeedUrl = channel === UpgradeChannel.ALPHA ? FeedUrl.CN_ALPHA : FeedUrl.CN_BETA
        this.autoUpdater.setFeedURL(chineseFeedUrl)
        this.autoUpdater.channel = channel
        logger.info(`Using Chinese pre-release URL: ${chineseFeedUrl} with channel: ${channel}`)
      } else {
        const preReleaseUrl = `https://github.com/mkdir700/EchoPlayer/releases/download/${release.tag_name}`
        if (preReleaseUrl) {
          this.autoUpdater.setFeedURL(preReleaseUrl)
          this.autoUpdater.channel = channel
          logger.info(`Using pre-release URL: ${preReleaseUrl} with channel: ${channel}`)
          return
        }

        // if no prerelease url, use lowest prerelease version to avoid error
        logger.warn('No prerelease URL found, falling back to lowest prerelease version')
        this.autoUpdater.setFeedURL(FeedUrl.PRERELEASE_LOWEST)
        this.autoUpdater.channel = UpgradeChannel.LATEST
      }
      return
    }

    // Production mode
    this.autoUpdater.channel = UpgradeChannel.LATEST
    this.autoUpdater.setFeedURL(FeedUrl.PRODUCTION)
    logger.info('Using production feed URL')

    logger.info('Detected IP country:', ipCountry)
    if (ipCountry.toLowerCase() !== 'cn') {
      this.autoUpdater.setFeedURL(FeedUrl.GITHUB_LATEST)
      logger.info('Using GitHub releases for non-CN region')
    }
  }

  public async downloadUpdate() {
    if (!this.updateCheckResult?.isUpdateAvailable) {
      logger.warn('No update available to download')
      return false
    }

    try {
      logger.info('Starting manual download of update')
      await this.autoUpdater.downloadUpdate(this.cancellationToken)
      return true
    } catch (error) {
      logger.error('Failed to download update:', error)
      return false
    }
  }

  public cancelDownload() {
    this.cancellationToken.cancel()
    this.cancellationToken = new CancellationToken()
    if (this.autoUpdater.autoDownload) {
      this.updateCheckResult?.cancellationToken?.cancel()
    }
  }

  public async checkForUpdates() {
    if (isWin && 'PORTABLE_EXECUTABLE_DIR' in process.env) {
      return {
        currentVersion: app.getVersion(),
        updateInfo: null
      }
    }

    const channel = this._getTestChannel()
    const releaseInfo = await this._getPreReleaseVersionFromGithub(channel)
    const testPlan = configManager.getTestPlan()
    logger.info('Check for updates - testPlan:', testPlan, 'releaseInfo:', releaseInfo)

    await this._setFeedUrl(channel, testPlan, releaseInfo)

    // disable downgrade after change the channel
    this.autoUpdater.allowDowngrade = false

    // github and gitcode don't support multiple range download
    this.autoUpdater.disableDifferentialDownload = true

    try {
      this.updateCheckResult = await this.autoUpdater.checkForUpdates()
      if (this.updateCheckResult?.isUpdateAvailable && !this.autoUpdater.autoDownload) {
        // 如果 autoDownload 为 false，则需要再调用下面的函数触发下
        // do not use await, because it will block the return of this function
        logger.info('downloadUpdate manual by check for updates', this.cancellationToken)
        this.autoUpdater.downloadUpdate(this.cancellationToken)
      }

      const updateInfo = this.updateCheckResult?.updateInfo
      if (updateInfo && !updateInfo.releaseNotes) {
        updateInfo.releaseNotes = releaseInfo?.body || 'No release notes available'
      }

      return {
        currentVersion: this.autoUpdater.currentVersion,
        updateInfo: this.updateCheckResult?.updateInfo
      }
    } catch (error) {
      logger.error('Failed to check for update:', error)
      return {
        currentVersion: app.getVersion(),
        updateInfo: null
      }
    }
  }

  public async showUpdateDialog(mainWindow: BrowserWindow) {
    if (!this.releaseInfo) {
      return
    }

    dialog
      .showMessageBox({
        type: 'info',
        title: 'Update available',
        icon,
        message: `A new version (${this.releaseInfo.version}) is available. Do you want to install it now?\n\nYou can view the release notes in Settings > About.`,
        buttons: ['Later', 'Install'],
        defaultId: 1,
        cancelId: 0
      })
      .then(({ response }) => {
        if (response === 1) {
          app.isQuitting = true
          setImmediate(() => autoUpdater.quitAndInstall())
        } else {
          mainWindow.webContents.send(IpcChannel.UpdateDownloadedCancelled)
        }
      })
  }
}
interface GithubReleaseInfo {
  id: number
  tag_name: string
  name: string
  body: string
  draft: boolean
  prerelease: boolean
  created_at: string
  published_at: string | null
  html_url: string
  assets: Array<{
    id: number
    name: string
    browser_download_url: string
    content_type: string
    size: number
    download_count: number
    created_at: string
  }>
}
