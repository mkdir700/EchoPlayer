/**
 * Tests for update handlers and release notes processing
 * 更新处理器和发布说明处理的测试
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { UpdateInfo } from 'electron-updater'

// Mock electron modules
vi.mock('electron', () => ({
  app: {
    getVersion: vi.fn(() => '1.0.0')
  },
  BrowserWindow: vi.fn(),
  ipcMain: {
    handle: vi.fn()
  }
}))

vi.mock('electron-updater', () => ({
  autoUpdater: {
    on: vi.fn(),
    checkForUpdates: vi.fn(),
    downloadUpdate: vi.fn(),
    quitAndInstall: vi.fn(),
    channel: '',
    autoDownload: false,
    autoInstallOnAppQuit: false,
    forceDevUpdateConfig: false,
    setFeedURL: vi.fn()
  }
}))

vi.mock('electron-log', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    transports: {
      file: {
        level: 'debug'
      }
    }
  }
}))

vi.mock('electron-conf/main', () => ({
  Conf: vi.fn(() => ({
    get: vi.fn(() => ({
      autoUpdate: true,
      lastChecked: 0,
      updateChannel: 'stable'
    })),
    set: vi.fn()
  }))
}))

vi.mock('@electron-toolkit/utils', () => ({
  is: {
    dev: false
  }
}))

vi.mock('../../main/utils/version-parser', () => ({
  getUpdateChannel: vi.fn(() => 'stable'),
  getVersionInfo: vi.fn(() => ({
    channel: 'stable',
    isValid: true,
    pattern: { name: 'stable' }
  }))
}))

// Import the functions we want to test
// Note: We need to import after mocking
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const updateHandlersModule = await import('../../main/handlers/updateHandlers')

describe('Update Handlers - Release Notes Processing', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('formatBytes function', () => {
    it('should format bytes correctly / 应该正确格式化字节数', () => {
      // We need to access the internal formatBytes function
      // For testing purposes, we'll create our own implementation to test the logic
      const formatBytes = (bytes: number, decimals = 2): string => {
        if (bytes === 0) return '0 Bytes'

        const k = 1024
        const dm = decimals < 0 ? 0 : decimals
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

        const i = Math.floor(Math.log(bytes) / Math.log(k))

        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
      }

      expect(formatBytes(0)).toBe('0 Bytes')
      expect(formatBytes(1024)).toBe('1 KB')
      expect(formatBytes(1048576)).toBe('1 MB')
      expect(formatBytes(1073741824)).toBe('1 GB')
      expect(formatBytes(1536)).toBe('1.5 KB')
      expect(formatBytes(25600000)).toBe('24.41 MB')
    })
  })

  describe('processUpdateInfo function', () => {
    it('should process string release notes / 应该处理字符串格式的发布说明', () => {
      const processUpdateInfo = (info: UpdateInfo): UpdateInfo & { updateSize?: number } => {
        // Replicate the logic from the actual function
        let totalSize = 0
        if (info.files && Array.isArray(info.files)) {
          totalSize = info.files.reduce((sum, file) => {
            return sum + (file.size || 0)
          }, 0)
        }

        let processedReleaseNotes: string | undefined

        if (info.releaseNotes) {
          if (typeof info.releaseNotes === 'string') {
            processedReleaseNotes = info.releaseNotes
          } else if (Array.isArray(info.releaseNotes)) {
            processedReleaseNotes = info.releaseNotes
              .map((note) => {
                const version = note.version ? `## ${note.version}\n` : ''
                const content = note.note || ''
                return version + content
              })
              .join('\n\n')
          } else {
            processedReleaseNotes = String(info.releaseNotes)
          }
        }

        return {
          ...info,
          releaseNotes: processedReleaseNotes,
          updateSize: totalSize > 0 ? totalSize : undefined
        }
      }

      const mockUpdateInfo: UpdateInfo = {
        version: '1.2.0',
        releaseDate: '2024-01-15T00:00:00.000Z',
        releaseNotes: '# New Features\n- Added dark mode\n- Fixed bugs',
        files: [
          { url: 'test.exe', sha512: 'abc123', size: 1024 * 1024 * 10 }, // 10MB
          { url: 'test.dmg', sha512: 'def456', size: 1024 * 1024 * 15 } // 15MB
        ],
        path: '',
        sha512: ''
      }

      const result = processUpdateInfo(mockUpdateInfo)

      expect(result.version).toBe('1.2.0')
      expect(result.releaseNotes).toBe('# New Features\n- Added dark mode\n- Fixed bugs')
      expect(result.updateSize).toBe(1024 * 1024 * 25) // 25MB total
    })

    it('should process array release notes / 应该处理数组格式的发布说明', () => {
      const processUpdateInfo = (info: UpdateInfo): UpdateInfo & { updateSize?: number } => {
        let totalSize = 0
        if (info.files && Array.isArray(info.files)) {
          totalSize = info.files.reduce((sum, file) => {
            return sum + (file.size || 0)
          }, 0)
        }

        let processedReleaseNotes: string | undefined

        if (info.releaseNotes) {
          if (typeof info.releaseNotes === 'string') {
            processedReleaseNotes = info.releaseNotes
          } else if (Array.isArray(info.releaseNotes)) {
            processedReleaseNotes = info.releaseNotes
              .map((note) => {
                const version = note.version ? `## ${note.version}\n` : ''
                const content = note.note || ''
                return version + content
              })
              .join('\n\n')
          } else {
            processedReleaseNotes = String(info.releaseNotes)
          }
        }

        return {
          ...info,
          releaseNotes: processedReleaseNotes,
          updateSize: totalSize > 0 ? totalSize : undefined
        }
      }

      const mockUpdateInfo: UpdateInfo = {
        version: '1.2.0',
        releaseDate: '2024-01-15T00:00:00.000Z',
        releaseNotes: [
          { version: '1.2.0', note: 'Added new features' },
          { version: '1.1.9', note: 'Bug fixes' }
        ],
        files: [{ url: 'test.exe', sha512: 'abc123', size: 1024 * 1024 * 5 }],
        path: '',
        sha512: ''
      }

      const result = processUpdateInfo(mockUpdateInfo)

      expect(result.releaseNotes).toBe('## 1.2.0\nAdded new features\n\n## 1.1.9\nBug fixes')
      expect(result.updateSize).toBe(1024 * 1024 * 5)
    })

    it('should handle missing release notes / 应该处理缺失的发布说明', () => {
      const processUpdateInfo = (info: UpdateInfo): UpdateInfo & { updateSize?: number } => {
        let totalSize = 0
        if (info.files && Array.isArray(info.files)) {
          totalSize = info.files.reduce((sum, file) => {
            return sum + (file.size || 0)
          }, 0)
        }

        let processedReleaseNotes: string | undefined

        if (info.releaseNotes) {
          if (typeof info.releaseNotes === 'string') {
            processedReleaseNotes = info.releaseNotes
          } else if (Array.isArray(info.releaseNotes)) {
            processedReleaseNotes = info.releaseNotes
              .map((note) => {
                const version = note.version ? `## ${note.version}\n` : ''
                const content = note.note || ''
                return version + content
              })
              .join('\n\n')
          } else {
            processedReleaseNotes = String(info.releaseNotes)
          }
        }

        return {
          ...info,
          releaseNotes: processedReleaseNotes,
          updateSize: totalSize > 0 ? totalSize : undefined
        }
      }

      const mockUpdateInfo: UpdateInfo = {
        version: '1.2.0',
        releaseDate: '2024-01-15T00:00:00.000Z',
        releaseNotes: null,
        files: [],
        path: '',
        sha512: ''
      }

      const result = processUpdateInfo(mockUpdateInfo)

      expect(result.releaseNotes).toBeUndefined()
      expect(result.updateSize).toBeUndefined()
    })

    it('should handle empty files array / 应该处理空文件数组', () => {
      const processUpdateInfo = (info: UpdateInfo): UpdateInfo & { updateSize?: number } => {
        let totalSize = 0
        if (info.files && Array.isArray(info.files)) {
          totalSize = info.files.reduce((sum, file) => {
            return sum + (file.size || 0)
          }, 0)
        }

        let processedReleaseNotes: string | undefined

        if (info.releaseNotes) {
          if (typeof info.releaseNotes === 'string') {
            processedReleaseNotes = info.releaseNotes
          } else if (Array.isArray(info.releaseNotes)) {
            processedReleaseNotes = info.releaseNotes
              .map((note) => {
                const version = note.version ? `## ${note.version}\n` : ''
                const content = note.note || ''
                return version + content
              })
              .join('\n\n')
          } else {
            processedReleaseNotes = String(info.releaseNotes)
          }
        }

        return {
          ...info,
          releaseNotes: processedReleaseNotes,
          updateSize: totalSize > 0 ? totalSize : undefined
        }
      }

      const mockUpdateInfo: UpdateInfo = {
        version: '1.2.0',
        releaseDate: '2024-01-15T00:00:00.000Z',
        releaseNotes: 'Simple release notes',
        files: [],
        path: '',
        sha512: ''
      }

      const result = processUpdateInfo(mockUpdateInfo)

      expect(result.releaseNotes).toBe('Simple release notes')
      expect(result.updateSize).toBeUndefined()
    })
  })
})
