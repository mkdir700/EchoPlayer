// don't reorder this file, it's used to initialize the app data dir and
// other which should be run before the main process is ready
// eslint-disable-next-line
import './bootstrap'

import '@main/config'

import { loggerService } from '@logger'
import { electronApp, optimizer } from '@electron-toolkit/utils'
import { replaceDevtoolsFont } from '@main/utils/windowUtil'
import { app } from 'electron'
import installExtension, { REDUX_DEVTOOLS } from 'electron-devtools-installer'

import { isDev, isLinux, isWin, isWSL } from './constant'
import { registerIpc } from './ipc'
import { configManager } from './services/ConfigManager'
import { mediaServerService } from './services/MediaServerService'
import { pythonVenvService } from './services/PythonVenvService'
import { registerShortcuts } from './services/ShortcutService'
import { sentryService } from './services/SentryService'
import { TrayService } from './services/TrayService'
import { windowService } from './services/WindowService'
import { initDatabase } from './db/init'

const logger = loggerService.withContext('MainEntry')

// 初始化 Sentry（必须在 app.whenReady() 之前）
// 同步初始化，确保在 ready 事件前完成
try {
  sentryService.init()
} catch (error) {
  logger.warn('Failed to initialize Sentry:', { error })
}

/**
 * Disable hardware acceleration if setting is enabled or in WSL environment
 */
const disableHardwareAcceleration = configManager.getDisableHardwareAcceleration()
if (disableHardwareAcceleration || isWSL) {
  app.disableHardwareAcceleration()
}

if (isWSL) {
  app.commandLine.appendSwitch('disable-gpu')
  logger.info('WSL environment detected, hardware acceleration disabled')
}

/**
 * Disable chromium's window animations
 * main purpose for this is to avoid the transparent window flashing when it is shown
 * (especially on Windows for SelectionAssistant Toolbar)
 * Know Issue: https://github.com/electron/electron/issues/12130#issuecomment-627198990
 */
if (isWin) {
  app.commandLine.appendSwitch('wm-window-animations-disabled')
}

/**
 * Enable GlobalShortcutsPortal for Linux Wayland Protocol
 * see: https://www.electronjs.org/docs/latest/api/global-shortcut
 */
if (isLinux && process.env.XDG_SESSION_TYPE === 'wayland') {
  app.commandLine.appendSwitch('enable-features', 'GlobalShortcutsPortal')
}

// Enable features for unresponsive renderer js call stacks
app.commandLine.appendSwitch('enable-features', 'DocumentPolicyIncludeJSCallStacksInCrashReports')
app.on('web-contents-created', (_, webContents) => {
  webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Document-Policy': ['include-js-call-stacks-in-crash-reports']
      }
    })
  })

  webContents.on('unresponsive', async () => {
    // Interrupt execution and collect call stack from unresponsive renderer
    logger.error('Renderer unresponsive start')
    const callStack = await webContents.mainFrame.collectJavaScriptCallStack()
    logger.error(`Renderer unresponsive js call stack\n ${callStack}`)
  })
})

// in production mode, handle uncaught exception and unhandled rejection globally
if (!isDev) {
  // handle uncaught exception
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error)
  })

  // handle unhandled rejection
  process.on('unhandledRejection', (reason, promise) => {
    logger.error(`Unhandled Rejection at: ${promise} reason: ${reason}`)
  })
}

// Check for single instance lock
if (!app.requestSingleInstanceLock()) {
  app.quit()
  process.exit(0)
} else {
  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.

  app.whenReady().then(async () => {
    // Set app user model id for windows
    electronApp.setAppUserModelId(import.meta.env.VITE_MAIN_BUNDLE_ID || 'cc.echoplayer.app')

    // Initialize database
    try {
      await initDatabase()
    } catch (error) {
      logger.error('Failed to initialize database:', { error })
      // Continue app initialization even if database fails
    }

    // Mac: Hide dock icon before window creation when launch to tray is set
    const isLaunchToTray = configManager.getLaunchToTray()
    if (isLaunchToTray) {
      app.dock?.hide()
    }

    const mainWindow = windowService.createMainWindow()
    new TrayService()

    // nodeTraceService.init()

    app.on('activate', function () {
      const mainWindow = windowService.getMainWindow()
      if (!mainWindow || mainWindow.isDestroyed()) {
        windowService.createMainWindow()
      } else {
        windowService.showMainWindow()
      }
    })

    registerShortcuts(mainWindow)

    registerIpc(mainWindow, app)

    replaceDevtoolsFont(mainWindow)

    // 自动启动 Media Server (如果环境已安装)
    try {
      const venvInfo = await pythonVenvService.checkVenvInfo()
      if (venvInfo.exists) {
        logger.info('检测到 Media Server 环境已安装,尝试自动启动...')
        const startResult = await mediaServerService.start()
        if (startResult) {
          logger.info('Media Server 自动启动成功')
        } else {
          logger.warn('Media Server 自动启动失败')
        }
      } else {
        logger.info('Media Server 环境未安装,跳过自动启动')
      }
    } catch (error) {
      logger.error('Media Server 自动启动异常:', { error })
    }

    // Setup deep link for AppImage on Linux
    // await setupAppImageDeepLink()

    if (isDev) {
      installExtension([REDUX_DEVTOOLS])
        .then((name) => logger.info(`Added Extension:  ${name}`))
        .catch((err) => logger.error('An error occurred: ', err))

      mainWindow.webContents.openDevTools()
    }
  })

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  app.on('before-quit', () => {
    app.isQuitting = true
  })

  app.on('will-quit', async () => {
    // Close database connections
    try {
      const { closeDatabase } = await import('./db/index')
      closeDatabase()
      logger.info('Database connections closed')
    } catch (error) {
      logger.error('Error closing database connections:', { error })
    }

    // finish the logger
    logger.finish()
  })

  // In this file you can include the rest of your app"s specific main process
  // code. You can also put them in separate files and require them here.
}
