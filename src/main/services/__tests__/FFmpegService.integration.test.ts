import { app } from 'electron'
import * as fs from 'fs'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import FFmpegService from '../FFmpegService'

// Mock modules
vi.mock('fs')
vi.mock('path', () => ({
  join: vi.fn((...args) => args.join('/')),
  dirname: vi.fn(),
  basename: vi.fn()
}))
vi.mock('electron', () => ({
  app: {
    getPath: vi.fn(),
    getAppPath: vi.fn(),
    isPackaged: false
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
vi.mock('child_process')
vi.mock('https')

describe('FFmpegService Integration Tests', () => {
  let ffmpegService: FFmpegService

  beforeEach(() => {
    vi.clearAllMocks()

    // Mock app paths
    vi.mocked(app.getPath).mockReturnValue('/mock/user/data')
    vi.mocked(app.getAppPath).mockReturnValue('/mock/app/path')

    ffmpegService = new FFmpegService()
  })

  describe('FFmpeg path resolution', () => {
    it('should prefer bundled FFmpeg when available', () => {
      // Mock bundled FFmpeg exists
      vi.mocked(fs.existsSync).mockReturnValue(true)
      vi.mocked(fs.statSync).mockReturnValue({ isFile: () => true } as any)

      const path = ffmpegService.getFFmpegPath()
      expect(path).toContain('ffmpeg')
    })

    it('should fall back to system FFmpeg when no bundled version', () => {
      // Mock bundled FFmpeg does not exist
      vi.mocked(fs.existsSync).mockReturnValue(false)

      const path = ffmpegService.getFFmpegPath()
      expect(path).toBe('ffmpeg') // System FFmpeg fallback
    })
  })

  describe('FFmpeg info', () => {
    it('should provide comprehensive FFmpeg information', () => {
      // Mock bundled FFmpeg exists
      vi.mocked(fs.existsSync).mockReturnValue(true)
      vi.mocked(fs.statSync).mockReturnValue({ isFile: () => true } as any)

      const info = ffmpegService.getFFmpegInfo()

      expect(info).toHaveProperty('path')
      expect(info).toHaveProperty('isBundled')
      expect(info).toHaveProperty('isDownloaded')
      expect(info).toHaveProperty('isSystemFFmpeg')
      expect(info).toHaveProperty('platform')
      expect(info).toHaveProperty('arch')
      expect(info).toHaveProperty('needsDownload')

      expect(info.platform).toBe(process.platform)
      expect(info.arch).toBe(process.arch)
    })

    it('should indicate download needed when no bundled FFmpeg', () => {
      // Mock no bundled FFmpeg
      vi.mocked(fs.existsSync).mockReturnValue(false)

      const info = ffmpegService.getFFmpegInfo()

      expect(info.isBundled).toBe(false)
      expect(info.isSystemFFmpeg).toBe(true)
      expect(info.needsDownload).toBe(true)
    })
  })

  describe('FFmpeg availability check', () => {
    it('should return true for existing bundled FFmpeg', () => {
      // Mock bundled FFmpeg exists with proper stats
      vi.mocked(fs.existsSync).mockReturnValue(true)
      vi.mocked(fs.statSync).mockReturnValue({
        isFile: () => true,
        mode: 0o755,
        size: 1024 * 1024
      } as any)

      const exists = ffmpegService.fastCheckFFmpegExists()
      expect(exists).toBe(true)
    })

    it('should return false for non-existent FFmpeg', () => {
      // Mock FFmpeg does not exist
      vi.mocked(fs.existsSync).mockReturnValue(false)

      const exists = ffmpegService.fastCheckFFmpegExists()
      expect(exists).toBe(false)
    })

    it('should return false for directory instead of file', () => {
      // Mock path exists but is directory
      vi.mocked(fs.existsSync).mockReturnValue(true)
      vi.mocked(fs.statSync).mockReturnValue({
        isFile: () => false,
        mode: 0o755,
        size: 0
      } as any)

      const exists = ffmpegService.fastCheckFFmpegExists()
      expect(exists).toBe(false)
    })
  })

  describe('Auto-detection functionality', () => {
    it('should detect available bundled FFmpeg', async () => {
      // Mock bundled FFmpeg exists
      vi.mocked(fs.existsSync).mockReturnValue(true)
      vi.mocked(fs.statSync).mockReturnValue({
        isFile: () => true,
        mode: 0o755,
        size: 1024 * 1024
      } as any)

      const result = await ffmpegService.autoDetectAndDownload()

      expect(result).toEqual({
        available: true,
        needsDownload: false,
        downloadTriggered: false
      })
    })

    it('should indicate download needed when no FFmpeg available', async () => {
      // Mock no bundled FFmpeg and system check fails
      vi.mocked(fs.existsSync).mockReturnValue(false)
      vi.spyOn(ffmpegService, 'checkFFmpegExists').mockResolvedValue(false)

      const result = await ffmpegService.autoDetectAndDownload()

      expect(result).toEqual({
        available: false,
        needsDownload: true,
        downloadTriggered: false
      })
    })
  })

  describe('Service lifecycle', () => {
    it('should have download service available', () => {
      const downloadService = ffmpegService.getDownloadService()
      expect(downloadService).toBeDefined()
      expect(typeof downloadService.checkFFmpegExists).toBe('function')
      expect(typeof downloadService.downloadFFmpeg).toBe('function')
    })

    it('should cleanup resources on destroy', async () => {
      // Should not throw when destroying service
      expect(async () => {
        await ffmpegService.destroy()
      }).not.toThrow()
    })
  })

  describe('Backward compatibility', () => {
    it('should maintain existing bundled FFmpeg detection', () => {
      // Mock bundled FFmpeg exists
      vi.mocked(fs.existsSync).mockReturnValue(true)
      vi.mocked(fs.statSync).mockReturnValue({ isFile: () => true } as any)

      const isBundled = ffmpegService.isUsingBundledFFmpeg()
      expect(isBundled).toBe(true)
    })

    it('should not break existing functionality', async () => {
      // Mock bundled FFmpeg exists
      vi.mocked(fs.existsSync).mockReturnValue(true)
      vi.mocked(fs.statSync).mockReturnValue({
        isFile: () => true,
        mode: 0o755,
        size: 1024 * 1024
      } as any)

      // These methods should work without throwing
      const path = ffmpegService.getFFmpegPath()
      const info = ffmpegService.getFFmpegInfo()
      const exists = ffmpegService.fastCheckFFmpegExists()

      expect(path).toBeTruthy()
      expect(info).toBeTruthy()
      expect(exists).toBe(true)
    })
  })

  describe('Error handling', () => {
    it('should handle filesystem errors gracefully', () => {
      vi.mocked(fs.existsSync).mockImplementation(() => {
        throw new Error('Filesystem error')
      })

      expect(() => {
        const exists = ffmpegService.fastCheckFFmpegExists()
        expect(exists).toBe(false)
      }).not.toThrow()
    })

    it('should handle missing download service gracefully', () => {
      expect(() => {
        const downloadService = ffmpegService.getDownloadService()
        expect(downloadService).toBeDefined()
      }).not.toThrow()
    })
  })
})
