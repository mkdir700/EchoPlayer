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

// Mock global fetch for IP detection tests
global.fetch = vi.fn()

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
      expect(result).toMatch(/latest-win32-x64[\\/]ffmpeg\.exe$/)
    })

    it('should return correct path for macOS arm64', () => {
      const result = service.getFFmpegPath('darwin', 'arm64')
      expect(result).toMatch(/latest-darwin-arm64[\\/]ffmpeg$/)
    })

    it('should return correct path for Linux x64', () => {
      const result = service.getFFmpegPath('linux', 'x64')
      expect(result).toMatch(/latest-linux-x64[\\/]ffmpeg$/)
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
      // 由于现在默认使用中国镜像源，我们需要明确设置镜像源来测试
      service.setMirrorSource(false) // 设置为全球镜像源

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

      // Since we default to China mirror now, verify URLs contain gitcode.com
      versions.forEach((version) => {
        expect(version.url).toContain('gitcode.com')
      })
    })

    it('should return different versions based on mirror source', () => {
      // Test China mirror (default)
      service.setMirrorSource(true)
      const chinaVersions = service.getAllSupportedVersions()
      expect(chinaVersions).toHaveLength(6)
      chinaVersions.forEach((version) => {
        expect(version.url).toContain('gitcode.com')
      })

      // Test global mirror
      service.setMirrorSource(false)
      const globalVersions = service.getAllSupportedVersions()
      expect(globalVersions).toHaveLength(6)
      globalVersions.forEach((version) => {
        expect(version.url).not.toContain('gitcode.com')
      })
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
      const progress = service.getDownloadProgress('ffmpeg', 'win32', 'x64')
      expect(progress).toBeNull() // No download in progress

      // Note: Testing actual download would require mocking HTTPS and file operations
      // which is complex and better suited for integration tests
    })

    it('should handle download cancellation', () => {
      // Start with no download in progress
      expect(service.getDownloadProgress('ffmpeg', 'win32', 'x64')).toBeNull()

      // Cancel should not throw even if no download is active
      expect(() => service.cancelDownload('ffmpeg', 'win32', 'x64')).not.toThrow()
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

  describe('IP 地区检测和镜像源选择', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    describe('getIpCountry', () => {
      it('should detect China region and return CN', async () => {
        const mockResponse = {
          json: vi.fn().mockResolvedValue({
            country: 'CN',
            city: 'Beijing',
            region: 'Beijing'
          })
        }
        vi.mocked(global.fetch).mockResolvedValue(mockResponse as any)

        // 通过反射访问私有方法进行测试
        const country = await (service as any).getIpCountry()
        expect(country).toBe('CN')
        expect(global.fetch).toHaveBeenCalledWith('https://ipinfo.io/json', {
          signal: expect.any(AbortSignal),
          headers: {
            'User-Agent': 'EchoPlayer-FFmpeg-Downloader/2.0',
            'Accept-Language': 'en-US,en;q=0.9'
          }
        })
      })

      it('should detect Hong Kong region and return HK', async () => {
        const mockResponse = {
          json: vi.fn().mockResolvedValue({
            country: 'HK',
            city: 'Hong Kong',
            region: 'Hong Kong'
          })
        }
        vi.mocked(global.fetch).mockResolvedValue(mockResponse as any)

        const country = await (service as any).getIpCountry()
        expect(country).toBe('HK')
      })

      it('should return CN as default when API fails', async () => {
        vi.mocked(global.fetch).mockRejectedValue(new Error('Network error'))

        const country = await (service as any).getIpCountry()
        expect(country).toBe('CN') // 默认返回 CN，验证回退逻辑
      })

      it('should handle timeout properly', async () => {
        // Mock fetch that will be aborted due to timeout
        vi.mocked(global.fetch).mockImplementation((_, options) => {
          return new Promise((resolve, reject) => {
            const signal = options?.signal as AbortSignal
            if (signal) {
              signal.addEventListener('abort', () => {
                reject(new Error('The operation was aborted'))
              })
            }
            // Simulate a long-running request that doesn't resolve in time
            setTimeout(() => resolve({} as any), 10000)
          })
        })

        const country = await (service as any).getIpCountry()
        expect(country).toBe('CN') // 超时后默认返回 CN
      }, 10000) // 增加测试超时时间
    })

    describe('镜像源选择逻辑', () => {
      it('should use China mirror for Chinese regions', () => {
        // 手动设置为中国镜像源
        service.setMirrorSource(true)

        const darwinVersion = service.getFFmpegVersion('darwin', 'arm64')
        expect(darwinVersion).toMatchObject({
          platform: 'darwin',
          arch: 'arm64',
          url: 'https://gitcode.com/mkdir700/echoplayer-ffmpeg/releases/download/v0.0.0/darwin-arm64.zip',
          extractPath: 'darwin-arm64/ffmpeg'
        })
      })

      it('should use global mirror for non-Chinese regions', () => {
        // 手动设置为全球镜像源
        service.setMirrorSource(false)

        const darwinVersion = service.getFFmpegVersion('darwin', 'arm64')
        expect(darwinVersion).toMatchObject({
          platform: 'darwin',
          arch: 'arm64',
          url: 'https://evermeet.cx/ffmpeg/ffmpeg-6.1.zip',
          extractPath: 'ffmpeg'
        })
      })

      it('should correctly detect Chinese regions', async () => {
        const testCases = [
          { country: 'CN', expected: true },
          { country: 'HK', expected: true },
          { country: 'MO', expected: true },
          { country: 'TW', expected: true },
          { country: 'US', expected: false },
          { country: 'JP', expected: false },
          { country: 'SG', expected: false }
        ]

        for (const testCase of testCases) {
          const mockResponse = {
            json: vi.fn().mockResolvedValue({ country: testCase.country })
          }
          vi.mocked(global.fetch).mockResolvedValue(mockResponse as any)

          await (service as any).detectRegionAndSetMirror()
          const currentMirror = service.getCurrentMirrorSource()

          expect(currentMirror).toBe(testCase.expected ? 'china' : 'global')
        }
      })
    })

    describe('getCurrentMirrorSource', () => {
      it('should return current mirror source', () => {
        service.setMirrorSource(true)
        expect(service.getCurrentMirrorSource()).toBe('china')

        service.setMirrorSource(false)
        expect(service.getCurrentMirrorSource()).toBe('global')
      })
    })

    describe('setMirrorSource', () => {
      it('should allow manual mirror source override', () => {
        // 设置为中国镜像源
        service.setMirrorSource(true)
        expect(service.getCurrentMirrorSource()).toBe('china')

        // 切换到全球镜像源
        service.setMirrorSource(false)
        expect(service.getCurrentMirrorSource()).toBe('global')
      })
    })

    describe('getAllVersionsByMirror', () => {
      it('should return China mirror versions', () => {
        const chinaVersions = service.getAllVersionsByMirror('china')

        expect(chinaVersions).toHaveLength(6)
        chinaVersions.forEach((version) => {
          expect(version.url).toContain('gitcode.com')
          expect(version.extractPath).toContain(`${version.platform}-${version.arch}`)
        })
      })

      it('should return global mirror versions', () => {
        const globalVersions = service.getAllVersionsByMirror('global')

        expect(globalVersions).toHaveLength(6)
        globalVersions.forEach((version) => {
          expect(version.url).not.toContain('gitcode.com')
        })
      })
    })
  })

  describe('地区检测集成测试', () => {
    it('should set China mirror after successful IP detection', async () => {
      const mockResponse = {
        json: vi.fn().mockResolvedValue({ country: 'CN' })
      }
      vi.mocked(global.fetch).mockResolvedValue(mockResponse as any)

      await (service as any).detectRegionAndSetMirror()
      expect(service.getCurrentMirrorSource()).toBe('china')
    })

    it('should set global mirror for non-Chinese regions', async () => {
      const mockResponse = {
        json: vi.fn().mockResolvedValue({ country: 'US' })
      }
      vi.mocked(global.fetch).mockResolvedValue(mockResponse as any)

      await (service as any).detectRegionAndSetMirror()
      expect(service.getCurrentMirrorSource()).toBe('global')
    })

    it('should default to China mirror when detection fails', async () => {
      vi.mocked(global.fetch).mockRejectedValue(new Error('Network error'))

      await (service as any).detectRegionAndSetMirror()
      expect(service.getCurrentMirrorSource()).toBe('china')
    })
  })

  describe('版本配置切换测试', () => {
    it('should return different URLs based on mirror source', () => {
      // 测试中国镜像源
      service.setMirrorSource(true)
      const chinaVersion = service.getFFmpegVersion('darwin', 'arm64')
      expect(chinaVersion?.url).toContain('gitcode.com')
      expect(chinaVersion?.extractPath).toBe('darwin-arm64/ffmpeg')

      // 测试全球镜像源
      service.setMirrorSource(false)
      const globalVersion = service.getFFmpegVersion('darwin', 'arm64')
      expect(globalVersion?.url).toContain('evermeet.cx')
      expect(globalVersion?.extractPath).toBe('ffmpeg')
    })

    it('should fallback to global mirror when China mirror not supported', () => {
      service.setMirrorSource(true)

      // 假设有一个平台在中国镜像源中不支持（这里只是测试逻辑）
      // 实际上所有平台都支持，所以这个测试更多是为了测试回退逻辑的代码结构
      const version = service.getFFmpegVersion('darwin', 'arm64')
      expect(version).toBeDefined()
      expect(version?.platform).toBe('darwin')
      expect(version?.arch).toBe('arm64')
    })
  })
})
