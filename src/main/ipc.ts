import fs from 'node:fs'

import { UpgradeChannel } from '@shared/config/constant'
import { IpcChannel } from '@shared/IpcChannel'
import { Notification, Shortcut, ThemeMode } from '@types'
import {
  BrowserWindow,
  dialog,
  ipcMain,
  session,
  shell,
  systemPreferences,
  webContents
} from 'electron'
import { arch } from 'os'
import path from 'path'

import { isLinux, isMac, isPortable, isWin } from './constant'
import appService from './services/AppService'
import AppUpdater from './services/AppUpdater'
import { configManager } from './services/ConfigManager'
import DictionaryService from './services/DictionaryService'
import FFmpegService from './services/FFmpegService'
import FileStorage from './services/FileStorage'
import { loggerService } from './services/LoggerService'
import NotificationService from './services/NotificationService'
import { registerShortcuts, unregisterAllShortcuts } from './services/ShortcutService'
import { themeService } from './services/ThemeService'
import { calculateDirectorySize, getResourcePath } from './utils'
import { getCacheDir, getConfigDir, getFilesDir, hasWritePermission } from './utils/file'
import { updateAppDataConfig } from './utils/init'

const logger = loggerService.withContext('IPC')

const fileManager = new FileStorage()
const dictionaryService = new DictionaryService()
const ffmpegService = new FFmpegService()

export function registerIpc(mainWindow: BrowserWindow, app: Electron.App) {
  const appUpdater = new AppUpdater(mainWindow)
  const notificationService = new NotificationService(mainWindow)

  ipcMain.handle(IpcChannel.App_Info, () => ({
    version: app.getVersion(),
    isPackaged: app.isPackaged,
    appPath: app.getAppPath(),
    filesPath: getFilesDir(),
    configPath: getConfigDir(),
    appDataPath: app.getPath('userData'),
    resourcesPath: getResourcePath(),
    logsPath: logger.getLogsDir(),
    arch: arch(),
    isPortable: isWin && 'PORTABLE_EXECUTABLE_DIR' in process.env,
    installPath: path.dirname(app.getPath('exe'))
  }))

  ipcMain.handle(IpcChannel.App_Reload, () => mainWindow.reload())
  ipcMain.handle(IpcChannel.Open_Website, (_, url: string) => shell.openExternal(url))
  // 在文件管理器中显示文件 / Show file in file manager
  ipcMain.handle(IpcChannel.ShowItemInFolder, async (_, filePath: string): Promise<boolean> => {
    try {
      let localPath = filePath

      // 如果是file://URL，需要转换为本地路径
      if (filePath.startsWith('file://')) {
        const url = new URL(filePath)
        localPath = decodeURIComponent(url.pathname)

        // Windows路径处理：移除开头的斜杠
        if (process.platform === 'win32' && localPath.startsWith('/')) {
          localPath = localPath.substring(1)
        }

        console.log('URL路径转换:', {
          原始URL: filePath,
          转换后路径: localPath
        })
      }

      shell.showItemInFolder(localPath)
      console.log('在文件管理器中显示文件:', localPath)
      return true
    } catch (error) {
      console.error('显示文件位置失败:', error)
      return false
    }
  })
  ipcMain.handle(IpcChannel.App_ShowUpdateDialog, () => appUpdater.showUpdateDialog(mainWindow))

  // Language
  ipcMain.handle(IpcChannel.App_SetLanguage, (_, language) => {
    configManager.setLanguage(language)
  })

  // spell check
  ipcMain.handle(IpcChannel.App_SetEnableSpellCheck, (_, isEnable: boolean) => {
    // disable spell check for all webviews
    const webviews = webContents.getAllWebContents()
    webviews.forEach((webview) => {
      webview.session.setSpellCheckerEnabled(isEnable)
    })
  })

  // spell check languages
  ipcMain.handle(IpcChannel.App_SetSpellCheckLanguages, (_, languages: string[]) => {
    if (languages.length === 0) {
      return
    }
    const windows = BrowserWindow.getAllWindows()
    windows.forEach((window) => {
      window.webContents.session.setSpellCheckerLanguages(languages)
    })
    configManager.set('spellCheckLanguages', languages)
  })

  // launch on boot
  ipcMain.handle(IpcChannel.App_SetLaunchOnBoot, (_, isLaunchOnBoot: boolean) => {
    appService.setAppLaunchOnBoot(isLaunchOnBoot)
  })

  // launch to tray
  ipcMain.handle(IpcChannel.App_SetLaunchToTray, (_, isActive: boolean) => {
    configManager.setLaunchToTray(isActive)
  })

  // tray
  ipcMain.handle(IpcChannel.App_SetTray, (_, isActive: boolean) => {
    configManager.setTray(isActive)
  })

  // to tray on close
  ipcMain.handle(IpcChannel.App_SetTrayOnClose, (_, isActive: boolean) => {
    configManager.setTrayOnClose(isActive)
  })

  // auto update
  ipcMain.handle(IpcChannel.App_SetAutoUpdate, (_, isActive: boolean) => {
    appUpdater.setAutoUpdate(isActive)
    configManager.setAutoUpdate(isActive)
  })

  ipcMain.handle(IpcChannel.App_SetTestPlan, async (_, isActive: boolean) => {
    logger.info(`set test plan: ${isActive}`)
    if (isActive !== configManager.getTestPlan()) {
      appUpdater.cancelDownload()
      configManager.setTestPlan(isActive)
    }
  })

  ipcMain.handle(IpcChannel.App_SetTestChannel, async (_, channel: UpgradeChannel) => {
    logger.info(`set test channel: ${channel}`)
    if (channel !== configManager.getTestChannel()) {
      appUpdater.cancelDownload()
      configManager.setTestChannel(channel)
    }
  })

  //only for mac
  if (isMac) {
    ipcMain.handle(IpcChannel.App_MacIsProcessTrusted, (): boolean => {
      return systemPreferences.isTrustedAccessibilityClient(false)
    })

    //return is only the current state, not the new state
    ipcMain.handle(IpcChannel.App_MacRequestProcessTrust, (): boolean => {
      return systemPreferences.isTrustedAccessibilityClient(true)
    })
  }

  ipcMain.handle(IpcChannel.Config_Set, (_, key: string, value: any, isNotify: boolean = false) => {
    configManager.set(key, value, isNotify)
  })

  ipcMain.handle(IpcChannel.Config_Get, (_, key: string) => {
    return configManager.get(key)
  })

  // theme
  ipcMain.handle(IpcChannel.App_SetTheme, (_, theme: ThemeMode) => {
    themeService.setTheme(theme)
  })

  // ipcMain.handle(IpcChannel.App_HandleZoomFactor, (_, delta: number, reset: boolean = false) => {
  //   const windows = BrowserWindow.getAllWindows()
  //   handleZoomFactor(windows, delta, reset)
  //   return configManager.getZoomFactor()
  // })

  // clear cache
  ipcMain.handle(IpcChannel.App_ClearCache, async () => {
    const sessions = [session.defaultSession, session.fromPartition('persist:webview')]

    try {
      await Promise.all(
        sessions.map(async (session) => {
          await session.clearCache()
          await session.clearStorageData({
            storages: [
              'cookies',
              'filesystem',
              'shadercache',
              'websql',
              'serviceworkers',
              'cachestorage'
            ]
          })
        })
      )
      await fileManager.clearTemp()
      // do not clear logs for now
      // TODO clear logs
      // await fs.writeFileSync(log.transports.file.getFile().path, '')
      return { success: true }
    } catch (error: any) {
      logger.error('Failed to clear cache:', error)
      return { success: false, error: error.message }
    }
  })

  // get cache size
  ipcMain.handle(IpcChannel.App_GetCacheSize, async () => {
    const cachePath = getCacheDir()
    logger.info(`Calculating cache size for path: ${cachePath}`)

    try {
      const sizeInBytes = await calculateDirectorySize(cachePath)
      const sizeInMB = (sizeInBytes / (1024 * 1024)).toFixed(2)
      return `${sizeInMB}`
    } catch (error: any) {
      logger.error(`Failed to calculate cache size for ${cachePath}: ${error.message}`)
      return '0'
    }
  })

  let preventQuitListener: ((event: Electron.Event) => void) | null = null
  ipcMain.handle(IpcChannel.App_SetStopQuitApp, (_, stop: boolean = false, reason: string = '') => {
    if (stop) {
      // Only add listener if not already added
      if (!preventQuitListener) {
        preventQuitListener = (event: Electron.Event) => {
          event.preventDefault()
          notificationService.sendNotification({
            title: reason,
            message: reason
          } as Notification)
        }
        app.on('before-quit', preventQuitListener)
      }
    } else {
      // Remove listener if it exists
      if (preventQuitListener) {
        app.removeListener('before-quit', preventQuitListener)
        preventQuitListener = null
      }
    }
  })

  // Select app data path
  ipcMain.handle(IpcChannel.App_Select, async (_, options: Electron.OpenDialogOptions) => {
    try {
      const { canceled, filePaths } = await dialog.showOpenDialog(options)
      if (canceled || filePaths.length === 0) {
        return null
      }
      return filePaths[0]
    } catch (error: any) {
      logger.error('Failed to select app data path:', error)
      return null
    }
  })

  ipcMain.handle(IpcChannel.App_HasWritePermission, async (_, filePath: string) => {
    return hasWritePermission(filePath)
  })

  // Set app data path
  ipcMain.handle(IpcChannel.App_SetAppDataPath, async (_, filePath: string) => {
    updateAppDataConfig(filePath)
    app.setPath('userData', filePath)
  })

  ipcMain.handle(IpcChannel.App_GetDataPathFromArgs, () => {
    return process.argv
      .slice(1)
      .find((arg) => arg.startsWith('--new-data-path='))
      ?.split('--new-data-path=')[1]
  })

  ipcMain.handle(IpcChannel.App_FlushAppData, () => {
    BrowserWindow.getAllWindows().forEach((w) => {
      w.webContents.session.flushStorageData()
      w.webContents.session.cookies.flushStore()

      w.webContents.session.closeAllConnections()
    })

    session.defaultSession.flushStorageData()
    session.defaultSession.cookies.flushStore()
    session.defaultSession.closeAllConnections()
  })

  ipcMain.handle(IpcChannel.App_IsNotEmptyDir, async (_, path: string) => {
    return fs.readdirSync(path).length > 0
  })

  // Copy user data to new location
  ipcMain.handle(
    IpcChannel.App_Copy,
    async (_, oldPath: string, newPath: string, occupiedDirs: string[] = []) => {
      try {
        await fs.promises.cp(oldPath, newPath, {
          recursive: true,
          filter: (src) => {
            if (occupiedDirs.some((dir) => src.startsWith(path.resolve(dir)))) {
              return false
            }
            return true
          }
        })
        return { success: true }
      } catch (error: any) {
        logger.error('Failed to copy user data:', error)
        return { success: false, error: error.message }
      }
    }
  )

  // Relaunch app
  ipcMain.handle(IpcChannel.App_RelaunchApp, (_, options?: Electron.RelaunchOptions) => {
    // Fix for .AppImage
    if (isLinux && process.env.APPIMAGE) {
      logger.info(`Relaunching app with options: ${process.env.APPIMAGE}`, options)
      // On Linux, we need to use the APPIMAGE environment variable to relaunch
      // https://github.com/electron-userland/electron-builder/issues/1727#issuecomment-769896927
      options = options || {}
      options.execPath = process.env.APPIMAGE
      options.args = options.args || []
      options.args.unshift('--appimage-extract-and-run')
    }

    if (isWin && isPortable) {
      options = options || {}
      options.execPath = process.env.PORTABLE_EXECUTABLE_FILE
      options.args = options.args || []
    }

    app.relaunch(options)
    app.exit(0)
  })

  // check for update
  ipcMain.handle(IpcChannel.App_CheckForUpdate, async () => {
    return await appUpdater.checkForUpdates()
  })

  // notification
  ipcMain.handle(IpcChannel.Notification_Send, async (_, notification: Notification) => {
    await notificationService.sendNotification(notification)
  })
  ipcMain.handle(IpcChannel.Notification_OnClick, (_, notification: Notification) => {
    mainWindow.webContents.send('notification-click', notification)
  })

  // zip
  // ipcMain.handle(IpcChannel.Zip_Compress, (_, text: string) => compress(text))
  // ipcMain.handle(IpcChannel.Zip_Decompress, (_, text: Buffer) => decompress(text))

  // system
  ipcMain.handle(IpcChannel.System_GetDeviceType, () =>
    isMac ? 'mac' : isWin ? 'windows' : 'linux'
  )
  ipcMain.handle(IpcChannel.System_GetHostname, () => require('os').hostname())
  ipcMain.handle(IpcChannel.System_ToggleDevTools, (e) => {
    const win = BrowserWindow.fromWebContents(e.sender)
    win && win.webContents.toggleDevTools()
  })

  // file
  ipcMain.handle(IpcChannel.File_Open, fileManager.open.bind(fileManager))
  ipcMain.handle(IpcChannel.File_OpenPath, fileManager.openPath.bind(fileManager))
  ipcMain.handle(IpcChannel.File_Save, fileManager.save.bind(fileManager))
  ipcMain.handle(IpcChannel.File_Select, fileManager.selectFile.bind(fileManager))
  ipcMain.handle(IpcChannel.File_Upload, fileManager.uploadFile.bind(fileManager))
  ipcMain.handle(IpcChannel.File_Clear, fileManager.clear.bind(fileManager))
  ipcMain.handle(IpcChannel.File_Read, fileManager.readFile.bind(fileManager))
  ipcMain.handle(IpcChannel.File_Delete, fileManager.deleteFile.bind(fileManager))
  ipcMain.handle(IpcChannel.File_DeleteDir, fileManager.deleteDir.bind(fileManager))
  ipcMain.handle(IpcChannel.File_Get, fileManager.getFile.bind(fileManager))
  ipcMain.handle(IpcChannel.File_SelectFolder, fileManager.selectFolder.bind(fileManager))
  ipcMain.handle(IpcChannel.File_CreateTempFile, fileManager.createTempFile.bind(fileManager))
  ipcMain.handle(IpcChannel.File_Write, fileManager.writeFile.bind(fileManager))
  ipcMain.handle(IpcChannel.File_WriteWithId, fileManager.writeFileWithId.bind(fileManager))
  ipcMain.handle(IpcChannel.File_SaveImage, fileManager.saveImage.bind(fileManager))
  ipcMain.handle(IpcChannel.File_Base64Image, fileManager.base64Image.bind(fileManager))
  ipcMain.handle(IpcChannel.File_SaveBase64Image, fileManager.saveBase64Image.bind(fileManager))
  ipcMain.handle(IpcChannel.File_Base64File, fileManager.base64File.bind(fileManager))
  ipcMain.handle(IpcChannel.File_Download, fileManager.downloadFile.bind(fileManager))
  ipcMain.handle(IpcChannel.File_Copy, fileManager.copyFile.bind(fileManager))
  ipcMain.handle(IpcChannel.File_BinaryImage, fileManager.binaryImage.bind(fileManager))
  ipcMain.handle(IpcChannel.File_ReadFromPath, fileManager.readFileFromPath.bind(fileManager))
  ipcMain.handle(IpcChannel.File_ListDirectory, fileManager.listDirectory.bind(fileManager))
  ipcMain.handle(
    IpcChannel.File_OpenWithRelativePath,
    fileManager.openFileWithRelativePath.bind(fileManager)
  )

  // dictionary
  ipcMain.handle(IpcChannel.Dictionary_Eudic, async (_, word: string) => {
    return await dictionaryService.queryEudic(_, word)
  })

  // FFmpeg
  ipcMain.handle(IpcChannel.Ffmpeg_CheckExists, async () => {
    return await ffmpegService.checkFFmpegExists()
  })
  ipcMain.handle(IpcChannel.Ffmpeg_GetVersion, async () => {
    return await ffmpegService.getFFmpegVersion()
  })
  ipcMain.handle(IpcChannel.Ffmpeg_Download, async (_, onProgress?: (progress: number) => void) => {
    return await ffmpegService.downloadFFmpeg(onProgress)
  })
  ipcMain.handle(IpcChannel.Ffmpeg_GetVideoInfo, async (_, inputPath: string) => {
    return await ffmpegService.getVideoInfo(inputPath)
  })
  ipcMain.handle(
    IpcChannel.Ffmpeg_Transcode,
    async (_, inputPath: string, outputPath: string, options: any) => {
      return await ffmpegService.transcodeVideo(inputPath, outputPath, options)
    }
  )
  ipcMain.handle(IpcChannel.Ffmpeg_CancelTranscode, () => {
    return ffmpegService.cancelTranscode()
  })
  ipcMain.handle(IpcChannel.Ffmpeg_GetPath, async () => {
    return ffmpegService.getFFmpegPath()
  })

  // shortcuts
  ipcMain.handle(IpcChannel.Shortcuts_Update, (_, shortcuts: Shortcut[]) => {
    configManager.setShortcuts(shortcuts)
    // Refresh shortcuts registration
    if (mainWindow) {
      unregisterAllShortcuts()
      registerShortcuts(mainWindow)
    }
  })
}
