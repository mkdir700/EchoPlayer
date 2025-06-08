import { app, BrowserWindow } from 'electron'
import { electronApp, optimizer } from '@electron-toolkit/utils'
import { createWindow } from './window/windowManager'
import { setupFileSystemHandlers, setupDictionaryHandlers, setupStoreHandlers } from './handlers'
import { setupLogHandlers } from './handlers/logHandlers'
import { setupUpdateHandlers } from './handlers/updateHandlers'
import { setupWindowHandlers, setMainWindow } from './handlers/windowHandlers'
import { setupFFmpegHandlers } from './handlers/ffmpegHandlers'
import { Logger } from './utils/logger'

// 🔥 关键修复：命令行参数必须在 app.whenReady() 之前设置！
// 启用 H.265/HEVC 支持的关键配置
app.commandLine.appendSwitch('disable-web-security')
app.commandLine.appendSwitch('allow-file-access-from-files')
app.commandLine.appendSwitch('enable-local-file-accesses')
app.commandLine.appendSwitch('disable-site-isolation-trials')

// 启用硬件加速和视频解码
app.commandLine.appendSwitch('enable-gpu-rasterization')
app.commandLine.appendSwitch('enable-zero-copy')
app.commandLine.appendSwitch('enable-hardware-overlays')
app.commandLine.appendSwitch('enable-oop-rasterization')
app.commandLine.appendSwitch('enable-accelerated-video-decode')
app.commandLine.appendSwitch('enable-accelerated-video-encode')

// 启用 H.265/HEVC 相关特性
app.commandLine.appendSwitch(
  'enable-features',
  'VaapiVideoDecoder,VaapiVideoEncoder,PlatformHEVCDecoderSupport,MediaFoundationH264Encoding,MediaFoundationH265Encoding'
)

// Windows 特定的 H.265 支持
if (process.platform === 'win32') {
  app.commandLine.appendSwitch('enable-media-foundation-video-capture')
  app.commandLine.appendSwitch('enable-win32-keyboard-lock')
  // 强制使用 Media Foundation 进行视频解码
  app.commandLine.appendSwitch('enable-features', 'MediaFoundationVideoCapture')
}

// macOS 特定的 H.265 支持
if (process.platform === 'darwin') {
  app.commandLine.appendSwitch('enable-features', 'VideoToolboxVP9Decoder,VideoToolboxH264Decoder')
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // 初始化日志系统
  Logger.appStart()

  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // 文件系统相关的 IPC 处理器
  setupFileSystemHandlers()

  // 设置词典服务相关的 IPC 处理器
  setupDictionaryHandlers()

  // 设置存储相关的 IPC 处理器
  setupStoreHandlers()

  // 设置日志相关的 IPC 处理器
  setupLogHandlers()

  // 设置窗口相关的 IPC 处理器
  setupWindowHandlers()

  // 设置 FFmpeg 相关的 IPC 处理器 / Setup FFmpeg-related IPC handlers
  setupFFmpegHandlers()

  // 创建主窗口
  const mainWindow = createWindow()

  // 设置主窗口引用
  setMainWindow(mainWindow)

  // 设置更新处理器
  setupUpdateHandlers(mainWindow)

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  Logger.appShutdown()
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// 应用即将退出时的清理
app.on('before-quit', () => {
  Logger.appShutdown()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
