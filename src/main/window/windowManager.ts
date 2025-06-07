import { BrowserWindow, shell } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import icon from '../../../resources/icon.png?asset'
import { getAppConfig } from '../handlers/storeHandlers'

export function createWindow(): BrowserWindow {
  // 获取应用配置 / Get application configuration
  const appConfig = getAppConfig()
  const { useWindowFrame = false } = appConfig || {}

  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 768,
    height: 600,
    minWidth: 768,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    frame: useWindowFrame, // 控制是否显示系统窗口框架 / Control whether to show system window frame
    fullscreenable: true, // 允许全屏模式 / Allow fullscreen mode
    maximizable: true, // 保持可最大化 / Keep maximizable
    titleBarStyle: useWindowFrame ? 'default' : 'hidden', // 隐藏标题栏，交通灯按钮位置通过trafficLightPosition控制 / Hide title bar, control traffic light position via trafficLightPosition
    // macOS 交通灯按钮位置自定义 / macOS traffic light position customization
    trafficLightPosition:
      process.platform === 'darwin' && !useWindowFrame ? { x: 10, y: 10 } : undefined,
    titleBarOverlay: useWindowFrame
      ? false
      : {
          height: 49 // 自定义标题栏高度 / Custom title bar height
        },
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false, // 允许加载本地文件
      allowRunningInsecureContent: true,
      experimentalFeatures: true,
      // 启用媒体相关功能
      plugins: true,
      webgl: true,
      // 允许文件访问
      additionalArguments: ['--enable-features=VaapiVideoDecoder', '--disable-web-security']
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()

    // 调试信息：输出窗口配置 / Debug info: output window configuration
    if (is.dev) {
      console.log('🪟 窗口配置 / Window Configuration:')
      console.log('  - useWindowFrame:', useWindowFrame)
      console.log('  - platform:', process.platform)
      console.log('  - titleBarStyle:', useWindowFrame ? 'default' : 'hidden')
      console.log(
        '  - trafficLightPosition:',
        process.platform === 'darwin' && !useWindowFrame ? { x: 15, y: 8 } : 'undefined'
      )
    }

    // 只在开发模式且非测试环境下打开 DevTools
    if (is.dev && process.env.NODE_ENV !== 'test') {
      // 在单独的窗口中打开 DevTools
      mainWindow.webContents.openDevTools({ mode: 'detach' })
    }
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return mainWindow
}
