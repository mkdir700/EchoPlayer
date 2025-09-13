import { app } from 'electron'
import * as fs from 'fs'
import * as path from 'path'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { FFmpegDownloadService } from '../FFmpegDownloadService'

// Mock modules
vi.mock('fs')
vi.mock('path')
vi.mock('electron', () => ({
  app: {
    getPath: vi.fn()
  }
}))
vi.mock('../LoggerService', () => ({
  loggerService: {
    withContext: () => ({
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn()
    })
  }
}))
vi.mock('https')
vi.mock('child_process')

describe('FFmpegDownloadService', () => {
  let service: FFmpegDownloadService
  const mockUserDataPath = '/mock/user/data'

  beforeEach(() => {
    vi.clearAllMocks()

    // Mock app.getPath
    vi.mocked(app.getPath).mockReturnValue(mockUserDataPath)

    // Mock fs.existsSync
    vi.mocked(fs.existsSync).mockReturnValue(true)

    // Mock fs.mkdirSync
    vi.mocked(fs.mkdirSync).mockReturnValue(undefined)

    // Mock path.join to return predictable paths
    vi.mocked(path.join).mockImplementation((...args) => args.join('/'))

    service = new FFmpegDownloadService()
  })

  describe('getFFmpegPath', () => {
    it('should return correct path for Windows x64', () => {
      const result = service.getFFmpegPath('win32', 'x64')
      expect(result).toMatch(/6\.1-win32-x64[\\/]ffmpeg\.exe$/)
    })

    it('should return correct path for macOS arm64', () => {
      const result = service.getFFmpegPath('darwin', 'arm64')
      expect(result).toMatch(/6\.1-darwin-arm64[\\/]ffmpeg$/)
    })

    it('should return correct path for Linux x64', () => {
      const result = service.getFFmpegPath('linux', 'x64')
      expect(result).toMatch(/6\.1-linux-x64[\\/]ffmpeg$/)
    })

    it('should throw error for unsupported platform', () => {
      expect(() => service.getFFmpegPath('unsupported' as any, 'x64')).toThrow('不支持的平台')
    })
  })

  describe('checkFFmpegExists', () => {
    it('should return true when FFmpeg file exists', () => {
      // Mock path.join to return a predictable path
      vi.mocked(path.join).mockReturnValue('/mock/ffmpeg/path')

      // Mock fs.existsSync to return true
      vi.mocked(fs.existsSync).mockReturnValue(true)

      // Mock fs.statSync to return a file
      vi.mocked(fs.statSync).mockReturnValue({ isFile: () => true } as any)

      const result = service.checkFFmpegExists('win32', 'x64')
      expect(result).toBe(true)
    })

    it('should return false when FFmpeg file does not exist', () => {
      vi.mocked(fs.existsSync).mockReturnValue(false)

      const result = service.checkFFmpegExists('win32', 'x64')
      expect(result).toBe(false)
    })

    it('should return false when path exists but is not a file', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true)
      vi.mocked(fs.statSync).mockReturnValue({ isFile: () => false } as any)

      const result = service.checkFFmpegExists('win32', 'x64')
      expect(result).toBe(false)
    })
  })

  describe('getFFmpegVersion', () => {
    it('should return version config for supported platforms', () => {
      const winVersion = service.getFFmpegVersion('win32', 'x64')
      expect(winVersion).toMatchObject({
        version: '6.1',
        platform: 'win32',
        arch: 'x64',
        url: expect.stringContaining('ffmpeg-master-latest-win64-gpl.zip')
      })

      const macVersion = service.getFFmpegVersion('darwin', 'arm64')
      expect(macVersion).toMatchObject({
        version: '6.1',
        platform: 'darwin',
        arch: 'arm64',
        url: expect.stringContaining('ffmpeg-6.1.zip')
      })
    })

    it('should return null for unsupported platform', () => {
      const result = service.getFFmpegVersion('unsupported' as any, 'x64')
      expect(result).toBeNull()
    })
  })

  describe('getAllSupportedVersions', () => {
    it('should return all supported platform configurations', () => {
      const versions = service.getAllSupportedVersions()

      expect(versions).toHaveLength(6) // win32 (x64, arm64), darwin (x64, arm64), linux (x64, arm64)

      // Check that each version has required properties
      versions.forEach((version) => {
        expect(version).toHaveProperty('version')
        expect(version).toHaveProperty('platform')
        expect(version).toHaveProperty('arch')
        expect(version).toHaveProperty('url')
        expect(version).toHaveProperty('size')
      })

      // Check specific platforms exist
      const platforms = versions.map((v) => `${v.platform}-${v.arch}`)
      expect(platforms).toContain('win32-x64')
      expect(platforms).toContain('darwin-arm64')
      expect(platforms).toContain('linux-x64')
    })
  })

  describe('removeFFmpeg', () => {
    it('should successfully remove existing FFmpeg directory', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true)
      vi.mocked(fs.rmSync).mockReturnValue(undefined)

      const result = service.removeFFmpeg('win32', 'x64')
      expect(result).toBe(true)
      expect(fs.rmSync).toHaveBeenCalledWith(expect.stringMatching(/6\.1-win32-x64$/), {
        recursive: true,
        force: true
      })
    })

    it('should return false when FFmpeg directory does not exist', () => {
      vi.mocked(fs.existsSync).mockReturnValue(false)

      const result = service.removeFFmpeg('win32', 'x64')
      expect(result).toBe(false)
      expect(fs.rmSync).not.toHaveBeenCalled()
    })

    it('should handle errors gracefully', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true)
      vi.mocked(fs.rmSync).mockImplementation(() => {
        throw new Error('Permission denied')
      })

      const result = service.removeFFmpeg('win32', 'x64')
      expect(result).toBe(false)
    })
  })

  describe('cleanupTempFiles', () => {
    it('should remove temporary directory if it exists', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true)
      vi.mocked(fs.rmSync).mockReturnValue(undefined)

      service.cleanupTempFiles()

      expect(fs.rmSync).toHaveBeenCalledWith(expect.stringMatching(/[\\/]\.temp$/), {
        recursive: true,
        force: true
      })
    })

    it('should do nothing if temporary directory does not exist', () => {
      vi.mocked(fs.existsSync).mockReturnValue(false)

      service.cleanupTempFiles()

      expect(fs.rmSync).not.toHaveBeenCalled()
    })
  })

  describe('download progress tracking', () => {
    it('should track download progress correctly', () => {
      const progress = service.getDownloadProgress('win32', 'x64')
      expect(progress).toBeNull() // No download in progress

      // Note: Testing actual download would require mocking HTTPS and file operations
      // which is complex and better suited for integration tests
    })

    it('should handle download cancellation', () => {
      // Start with no download in progress
      expect(service.getDownloadProgress('win32', 'x64')).toBeNull()

      // Cancel should not throw even if no download is active
      expect(() => service.cancelDownload('win32', 'x64')).not.toThrow()
    })
  })

  describe('error handling', () => {
    it('should handle invalid platform gracefully in getFFmpegPath', () => {
      expect(() => service.getFFmpegPath('invalid' as any, 'x64')).toThrow()
    })

    it('should return null for invalid platform in getFFmpegVersion', () => {
      const result = service.getFFmpegVersion('invalid' as any, 'x64')
      expect(result).toBeNull()
    })

    it('should handle filesystem errors in checkFFmpegExists', () => {
      vi.mocked(fs.existsSync).mockImplementation(() => {
        throw new Error('Filesystem error')
      })

      const result = service.checkFFmpegExists('win32', 'x64')
      expect(result).toBe(false)
    })
  })
})
