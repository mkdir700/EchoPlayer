/**
 * Integration tests for autoUpdater configuration functionality
 * autoUpdater 配置功能的集成测试
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'

// Mock electron modules
const mockApp = {
  getVersion: vi.fn()
}

const mockAutoUpdater = {
  channel: '',
  autoDownload: true,
  autoInstallOnAppQuit: true,
  setFeedURL: vi.fn(),
  checkForUpdates: vi.fn(),
  on: vi.fn(),
  forceDevUpdateConfig: false
}

const mockLogger = {
  info: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  transports: {
    file: {
      level: 'debug'
    }
  }
}

const mockConf = vi.fn().mockImplementation(() => ({
  get: vi.fn().mockReturnValue({
    autoUpdate: true,
    lastChecked: 0,
    updateChannel: 'stable'
  }),
  set: vi.fn()
}))

const mockIs = {
  dev: false
}

vi.mock('electron', () => ({
  app: mockApp,
  BrowserWindow: vi.fn(),
  ipcMain: {
    handle: vi.fn()
  }
}))

vi.mock('electron-updater', () => ({
  autoUpdater: mockAutoUpdater
}))

vi.mock('electron-log', () => ({
  default: mockLogger
}))

vi.mock('electron-conf/main', () => ({
  Conf: mockConf
}))

vi.mock('@electron-toolkit/utils', () => ({
  is: mockIs
}))

describe('AutoUpdater Configuration Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset autoUpdater state
    mockAutoUpdater.channel = ''
    mockAutoUpdater.autoDownload = true
    mockAutoUpdater.autoInstallOnAppQuit = true
    mockAutoUpdater.forceDevUpdateConfig = false
    mockIs.dev = false
  })

  afterEach(() => {
    vi.resetModules()
  })

  describe('Channel Configuration', () => {
    it('should configure autoUpdater channel based on version', async () => {
      // Mock different version scenarios
      const testCases = [
        { version: '1.0.0', expectedChannel: 'stable' },
        { version: '1.0.0-alpha.1', expectedChannel: 'alpha' },
        { version: '1.0.0-beta.1', expectedChannel: 'beta' },
        { version: '1.0.0-dev.1', expectedChannel: 'dev' }
      ]

      for (const { version, expectedChannel } of testCases) {
        mockApp.getVersion.mockReturnValue(version)

        // Import and test the configuration function
        const { setupUpdateHandlers } = await import('../../main/handlers/updateHandlers')

        // Create a mock window
        const mockWindow = {
          isDestroyed: () => false,
          webContents: {
            send: vi.fn()
          }
        } as unknown as Electron.BrowserWindow

        // Setup handlers which should configure autoUpdater
        setupUpdateHandlers(mockWindow)

        // Verify that autoUpdater.channel was set correctly
        expect(mockAutoUpdater.channel).toBe(expectedChannel)

        // Verify logging
        expect(mockLogger.info).toHaveBeenCalledWith(
          'AutoUpdater 配置完成:',
          expect.objectContaining({
            channel: expectedChannel,
            version: version
          })
        )
      }
    })

    it('should handle user-set channel preferences', async () => {
      // Mock user setting a specific channel
      const mockConfInstance = {
        get: vi.fn().mockReturnValue({
          autoUpdate: true,
          lastChecked: 0,
          updateChannel: 'beta' // User explicitly set beta
        }),
        set: vi.fn()
      }
      mockConf.mockReturnValue(mockConfInstance)

      // Set version that would normally detect as stable
      mockApp.getVersion.mockReturnValue('1.0.0')

      const { setupUpdateHandlers } = await import('../../main/handlers/updateHandlers')

      const mockWindow = {
        isDestroyed: () => false,
        webContents: { send: vi.fn() }
      } as unknown as Electron.BrowserWindow

      setupUpdateHandlers(mockWindow)

      // Should use user-set channel instead of auto-detected
      expect(mockAutoUpdater.channel).toBe('beta')
    })

    it('should prioritize auto-detected channel over default user setting', async () => {
      // Mock default user setting (stable)
      const mockConfInstance = {
        get: vi.fn().mockReturnValue({
          autoUpdate: true,
          lastChecked: 0,
          updateChannel: 'stable' // Default setting
        }),
        set: vi.fn()
      }
      mockConf.mockReturnValue(mockConfInstance)

      // Set version that auto-detects as alpha
      mockApp.getVersion.mockReturnValue('1.0.0-alpha.1')

      const { setupUpdateHandlers } = await import('../../main/handlers/updateHandlers')

      const mockWindow = {
        isDestroyed: () => false,
        webContents: { send: vi.fn() }
      } as unknown as Electron.BrowserWindow

      setupUpdateHandlers(mockWindow)

      // Should use auto-detected channel
      expect(mockAutoUpdater.channel).toBe('alpha')
    })
  })

  describe('Development Mode Configuration', () => {
    it('should configure local update server in development mode', async () => {
      mockIs.dev = true
      mockApp.getVersion.mockReturnValue('1.0.0-dev.1')

      const { setupUpdateHandlers } = await import('../../main/handlers/updateHandlers')

      const mockWindow = {
        isDestroyed: () => false,
        webContents: { send: vi.fn() }
      } as unknown as Electron.BrowserWindow

      setupUpdateHandlers(mockWindow)

      // Should set forceDevUpdateConfig
      expect(mockAutoUpdater.forceDevUpdateConfig).toBe(true)

      // Should call setFeedURL with local server
      expect(mockAutoUpdater.setFeedURL).toHaveBeenCalledWith({
        provider: 'generic',
        url: 'http://localhost:8384',
        channel: 'latest'
      })

      // Should log development mode setup
      expect(mockLogger.info).toHaveBeenCalledWith('开发模式：设置更新源为 http://localhost:8384')
    })

    it('should not configure local server in production mode', async () => {
      mockIs.dev = false
      mockApp.getVersion.mockReturnValue('1.0.0')

      const { setupUpdateHandlers } = await import('../../main/handlers/updateHandlers')

      const mockWindow = {
        isDestroyed: () => false,
        webContents: { send: vi.fn() }
      } as unknown as Electron.BrowserWindow

      setupUpdateHandlers(mockWindow)

      // Should not set forceDevUpdateConfig
      expect(mockAutoUpdater.forceDevUpdateConfig).toBe(false)

      // Should not call setFeedURL
      expect(mockAutoUpdater.setFeedURL).not.toHaveBeenCalled()

      // Should log production mode
      expect(mockLogger.info).toHaveBeenCalledWith('生产环境: 使用 GitHub 发布，渠道: stable')
    })
  })

  describe('Basic AutoUpdater Settings', () => {
    it('should configure basic autoUpdater settings correctly', async () => {
      mockApp.getVersion.mockReturnValue('1.0.0')

      const { setupUpdateHandlers } = await import('../../main/handlers/updateHandlers')

      const mockWindow = {
        isDestroyed: () => false,
        webContents: { send: vi.fn() }
      } as unknown as Electron.BrowserWindow

      setupUpdateHandlers(mockWindow)

      // Should disable auto download and auto install
      expect(mockAutoUpdater.autoDownload).toBe(false)
      expect(mockAutoUpdater.autoInstallOnAppQuit).toBe(false)
    })
  })
})
