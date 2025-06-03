import { BrowserWindow, shell } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import icon from '../../../resources/icon.png?asset'

export function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 768,
    height: 600,
    minWidth: 768,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
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
}
