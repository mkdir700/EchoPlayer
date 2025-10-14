import { spawn } from 'child_process'
import * as fs from 'fs'
import { createRequire } from 'module'
import * as path from 'path'
import { PassThrough } from 'stream'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import type { DownloadProgress } from '../UvBootstrapperService'
import { UvBootstrapperService } from '../UvBootstrapperService'

const require = createRequire(import.meta.url)
const https = require('https') as typeof import('https')

type RegionDetectionService = {
  getCountry: (forceRefresh?: boolean) => Promise<string>
  isChinaCountry: (country?: string | null) => boolean
  isChinaUser: (forceRefresh?: boolean) => Promise<boolean>
  clearCache: () => void
}

const mockGetCountry = vi.fn<RegionDetectionService['getCountry']>()
const mockIsChinaCountry = vi
  .fn<RegionDetectionService['isChinaCountry']>()
  .mockImplementation((country?: string | null) =>
    ['cn', 'hk', 'mo', 'tw'].includes((country || '').toLowerCase())
  )
const mockIsChinaUser = vi.fn<RegionDetectionService['isChinaUser']>()
const mockClearCache = vi.fn<RegionDetectionService['clearCache']>()

const mockLogger = vi.hoisted(() => ({
  info: vi.fn(),
  debug: vi.fn(),
  warn: vi.fn(),
  error: vi.fn()
}))

// Mock dependencies
vi.mock('fs')
vi.mock('child_process')
vi.mock('electron', () => ({
  app: {
    getPath: vi.fn(() => '/mock/userData'),
    isPackaged: false,
    getAppPath: vi.fn(() => '/mock/app')
  }
}))

vi.mock('../LoggerService', () => ({
  loggerService: {
    withContext: vi.fn(() => mockLogger)
  }
}))
vi.mock('../RegionDetectionService', () => ({
  regionDetectionService: {
    getCountry: (...args: Parameters<RegionDetectionService['getCountry']>) =>
      mockGetCountry(...args),
    isChinaCountry: (...args: Parameters<RegionDetectionService['isChinaCountry']>) =>
      mockIsChinaCountry(...args),
    isChinaUser: (...args: Parameters<RegionDetectionService['isChinaUser']>) =>
      mockIsChinaUser(...args),
    clearCache: (...args: Parameters<RegionDetectionService['clearCache']>) =>
      mockClearCache(...args)
  }
}))

let httpsGetSpy: ReturnType<typeof vi.fn>

const mockFs = vi.mocked(fs)
const mockSpawn = vi.mocked(spawn)

describe('UvBootstrapperService', () => {
  let service: UvBootstrapperService

  beforeAll(() => {
    httpsGetSpy = vi.fn()
    ;(https as any).get = httpsGetSpy
  })

  beforeEach(() => {
    vi.clearAllMocks()
    mockGetCountry.mockResolvedValue('US')
    mockIsChinaCountry.mockImplementation((country?: string | null) =>
      ['cn', 'hk', 'mo', 'tw'].includes((country || '').toLowerCase())
    )
    mockIsChinaUser.mockResolvedValue(false)
    mockClearCache.mockImplementation(() => {})
    httpsGetSpy.mockReset()
    service = new UvBootstrapperService()
  })

  afterEach(async () => {
    await service.destroy()
  })

  describe('constructor', () => {
    it('should initialize with correct binaries directory', () => {
      expect(mockFs.mkdirSync).toHaveBeenCalledWith(path.join('/mock/userData', 'binaries', 'uv'), {
        recursive: true
      })
    })
  })

  describe('getUvPath', () => {
    it('should return correct path for win32-x64', () => {
      const originalPlatform = process.platform
      const originalArch = process.arch

      Object.defineProperty(process, 'platform', { value: 'win32' })
      Object.defineProperty(process, 'arch', { value: 'x64' })

      const result = service.getUvPath()
      const version = service.getUvVersion('win32', 'x64')
      expect(version).not.toBeNull()
      expect(result).toContain(`${version?.version}-win32-x64`)
      expect(result).toContain('uv.exe')

      Object.defineProperty(process, 'platform', { value: originalPlatform })
      Object.defineProperty(process, 'arch', { value: originalArch })
    })

    it('should return correct path for darwin-arm64', () => {
      const originalPlatform = process.platform
      const originalArch = process.arch

      Object.defineProperty(process, 'platform', { value: 'darwin' })
      Object.defineProperty(process, 'arch', { value: 'arm64' })

      const result = service.getUvPath()
      const version = service.getUvVersion('darwin', 'arm64')
      expect(version).not.toBeNull()
      expect(result).toContain(`${version?.version}-darwin-arm64`)
      expect(result).toContain('uv')

      Object.defineProperty(process, 'platform', { value: originalPlatform })
      Object.defineProperty(process, 'arch', { value: originalArch })
    })

    it('should throw error for unsupported platform', () => {
      expect(() => service.getUvPath('unsupported' as any, 'x64')).toThrow(
        '不支持的平台: unsupported-x64'
      )
    })
  })

  describe('checkUvInstallation', () => {
    it('should return downloaded uv info when downloaded version exists', async () => {
      mockFs.existsSync.mockReturnValue(true)
      mockFs.statSync.mockReturnValue({ isFile: () => true } as any)

      // Mock executeCommand for version check
      const mockChild = {
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        on: vi.fn((event, callback) => {
          if (event === 'close') {
            callback(0)
          }
        })
      }
      mockSpawn.mockReturnValue(mockChild as any)

      const result = await service.checkUvInstallation(false)

      expect(result.exists).toBe(true)
      expect(result.isDownloaded).toBe(true)
      expect(result.isSystem).toBe(false)
    })

    it('should return system uv info when only system version exists', async () => {
      mockFs.existsSync.mockReturnValue(false)

      // Mock system uv check
      const mockChild = {
        stdout: { on: vi.fn((_event, callback) => callback('uv 0.1.0\n')) },
        stderr: { on: vi.fn() },
        on: vi.fn((event, callback) => {
          if (event === 'close') {
            callback(0)
          }
        })
      }
      mockSpawn.mockReturnValue(mockChild as any)

      const result = await service.checkUvInstallation(false)

      expect(result.exists).toBe(true)
      expect(result.isDownloaded).toBe(false)
      expect(result.isSystem).toBe(true)
    })

    it('should return not exists when no uv found', async () => {
      mockFs.existsSync.mockReturnValue(false)

      // Mock system uv check failure
      const mockChild = {
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        on: vi.fn((event, callback) => {
          if (event === 'close') {
            callback(1)
          }
          if (event === 'error') {
            callback(new Error('Command not found'))
          }
        })
      }
      mockSpawn.mockReturnValue(mockChild as any)

      const result = await service.checkUvInstallation(false)

      expect(result.exists).toBe(false)
      expect(result.isDownloaded).toBe(false)
      expect(result.isSystem).toBe(false)
    })
  })

  describe('getUvVersion', () => {
    it('should return correct version config for supported platforms', () => {
      const win32Config = service.getUvVersion('win32', 'x64')
      expect(win32Config).toMatchObject({
        platform: 'win32',
        arch: 'x64',
        extractPath: 'uv.exe'
      })
      expect(win32Config?.url).toContain('uv-x86_64-pc-windows-msvc.zip')

      const darwinConfig = service.getUvVersion('darwin', 'arm64')
      expect(darwinConfig).toMatchObject({
        platform: 'darwin',
        arch: 'arm64',
        extractPath: 'uv'
      })
      expect(darwinConfig?.url).toContain('uv-aarch64-apple-darwin.tar.gz')
    })

    it('should return null for unsupported platform', () => {
      const result = service.getUvVersion('unsupported' as any, 'x64')
      expect(result).toBeNull()
    })

    it('should use China-specific download source when region detected as Chinese', async () => {
      mockGetCountry.mockResolvedValueOnce('CN')
      mockIsChinaCountry.mockReturnValueOnce(true)

      await (service as any).detectRegionAndSetMirror()
      const chinaConfig = service.getUvVersion('darwin', 'arm64')

      expect(chinaConfig?.url).toContain('gitcode.com')
    })
  })

  describe('checkVenvExists', () => {
    it('should return true when venv exists on Windows', () => {
      const originalPlatform = process.platform
      Object.defineProperty(process, 'platform', { value: 'win32' })

      mockFs.existsSync.mockReturnValue(true)

      const result = service.checkVenvExists('/test/project')
      expect(result).toBe(true)
      expect(mockFs.existsSync).toHaveBeenCalledWith(
        path.join('/test/project', '.venv', 'Scripts/python.exe')
      )

      Object.defineProperty(process, 'platform', { value: originalPlatform })
    })

    it('should return true when venv exists on Unix', () => {
      const originalPlatform = process.platform
      Object.defineProperty(process, 'platform', { value: 'darwin' })

      mockFs.existsSync.mockReturnValue(true)

      const result = service.checkVenvExists('/test/project')
      expect(result).toBe(true)
      expect(mockFs.existsSync).toHaveBeenCalledWith(
        path.join('/test/project', '.venv', 'bin/python')
      )

      Object.defineProperty(process, 'platform', { value: originalPlatform })
    })

    it('should return false when venv does not exist', () => {
      mockFs.existsSync.mockReturnValue(false)

      const result = service.checkVenvExists('/test/project')
      expect(result).toBe(false)
    })
  })

  describe('getPyPiMirrors', () => {
    it('should return array of PyPI mirrors', () => {
      const mirrors = service.getPyPiMirrors()
      expect(Array.isArray(mirrors)).toBe(true)
      expect(mirrors.length).toBeGreaterThan(0)
      expect(mirrors[0]).toHaveProperty('name')
      expect(mirrors[0]).toHaveProperty('url')
      expect(mirrors[0]).toHaveProperty('testUrl')
      expect(mirrors[0]).toHaveProperty('location')
    })

    it('should include official PyPI mirror', () => {
      const mirrors = service.getPyPiMirrors()
      const officialMirror = mirrors.find((m) => m.name === 'official')
      expect(officialMirror).toBeDefined()
      expect(officialMirror?.url).toBe('https://pypi.org/simple/')
    })
  })

  describe('setFastestMirror', () => {
    it('should set fastest mirror manually', () => {
      const mirror = {
        name: 'test',
        url: 'https://test.com/simple/',
        testUrl: 'https://test.com/simple/pip/',
        location: '测试'
      }

      service.setFastestMirror(mirror)
      // This is a private property, so we can't directly test it
      // but we can test the behavior in other methods
    })
  })

  describe('clearMirrorCache', () => {
    it('should clear mirror cache', () => {
      service.clearMirrorCache()
      // This method clears private properties, so we can't directly test it
      // but we can test the behavior in other methods
    })
  })

  describe('clearUvCache', () => {
    it('should clear UV cache for specific platform', () => {
      UvBootstrapperService.clearUvCache('win32', 'x64')
      // Static method that clears cache
    })

    it('should clear all UV cache', () => {
      UvBootstrapperService.clearUvCache()
      // Static method that clears all cache
    })
  })

  describe('getProjectInfo', () => {
    it('should return project info with basic checks', async () => {
      mockFs.existsSync.mockImplementation((filePath) => {
        const path = String(filePath)
        if (path.includes('pyproject.toml')) return true
        if (path.includes('uv.lock')) return true
        if (path.includes('python')) return true
        return false
      })

      const result = await service.getProjectInfo('/test/project')

      expect(result).toEqual({
        hasVenv: true,
        pyprojectExists: true,
        lockfileExists: true,
        pythonVersion: undefined // Python version requires uv, so undefined in this test
      })
    })

    it('should handle missing project files', async () => {
      mockFs.existsSync.mockReturnValue(false)

      const result = await service.getProjectInfo('/test/project')

      expect(result).toEqual({
        hasVenv: false,
        pyprojectExists: false,
        lockfileExists: false,
        pythonVersion: undefined
      })
    })
  })

  describe('downloadUv', () => {
    beforeEach(() => {
      vi.clearAllMocks()
      httpsGetSpy.mockReset()
      mockSpawn.mockReset()
      // Mock fs operations
      mockFs.existsSync.mockImplementation((targetPath) => {
        const pathStr = String(targetPath)
        const isExtractedUv =
          pathStr.includes('.temp') && (pathStr.endsWith('uv') || pathStr.endsWith('uv.exe'))

        return isExtractedUv ? true : false
      })
      mockFs.mkdirSync.mockImplementation(() => undefined)
      mockFs.copyFileSync.mockImplementation(() => undefined)
      mockFs.chmodSync.mockImplementation(() => undefined)
      mockFs.rmSync.mockImplementation(() => undefined)
      const mockWriteStream = {
        close: vi.fn(),
        destroy: vi.fn(),
        write: vi.fn(() => true),
        end: vi.fn(() => undefined),
        emit: vi.fn(() => true),
        addListener: vi.fn(function (this: any) {
          return this
        }),
        removeListener: vi.fn(function (this: any) {
          return this
        }),
        on: vi.fn(function (this: any, event, callback) {
          if (event === 'finish') {
            setTimeout(callback, 1200)
          }
          return this
        }),
        once: vi.fn(function (this: any, event, callback) {
          if (event === 'finish') {
            setTimeout(callback, 1200)
          }
          return this
        })
      }
      mockFs.createWriteStream.mockReturnValue(mockWriteStream as any)
    })

    describe('Windows platform', () => {
      it('should download uv for win32-x64 successfully', async () => {
        const originalPlatform = process.platform
        Object.defineProperty(process, 'platform', { value: 'win32' })

        try {
          const progressCallback = vi.fn()

          // Mock https module
          const mockRequest = {
            on: vi.fn(),
            destroy: vi.fn()
          }

          const mockResponse = {
            statusCode: 200,
            headers: { 'content-length': '15728640' },
            on: vi.fn(function (this: any, event, callback) {
              if (event === 'data') {
                setTimeout(() => callback(Buffer.alloc(1024)), 10)
              }
              return this
            }),
            pipe: vi.fn()
          }

          httpsGetSpy.mockImplementation((_url, _options, callback) => {
            setTimeout(() => callback(mockResponse), 10)
            return mockRequest
          })

          // Mock PowerShell unzip for Windows
          const mockChild = {
            on: vi.fn((event, callback) => {
              if (event === 'close') {
                setTimeout(() => callback(0), 10)
              }
            })
          }
          mockSpawn.mockReturnValue(mockChild as any)

          const result = await service.downloadUv('win32', 'x64', progressCallback)

          expect(mockLogger.error).not.toHaveBeenCalled()
          expect(httpsGetSpy).toHaveBeenCalled()
          expect(progressCallback).toHaveBeenCalled()
          expect(mockSpawn).toHaveBeenCalledWith(
            'powershell',
            expect.arrayContaining(['-Command']),
            expect.any(Object)
          )
          expect(result).toBe(true)
        } finally {
          Object.defineProperty(process, 'platform', { value: originalPlatform })
        }
      })

      it('should download uv for win32-arm64 successfully', async () => {
        const originalPlatform = process.platform
        Object.defineProperty(process, 'platform', { value: 'win32' })

        try {
          const mockRequest = { on: vi.fn(), destroy: vi.fn() }
          const mockResponse = {
            statusCode: 200,
            headers: { 'content-length': '15728640' },
            on: vi.fn(function (this: any, event, callback) {
              if (event === 'data') {
                setTimeout(() => callback(Buffer.alloc(1024)), 10)
              }
              return this
            }),
            pipe: vi.fn()
          }

          httpsGetSpy.mockImplementation((_url, _options, callback) => {
            setTimeout(() => callback(mockResponse), 10)
            return mockRequest
          })

          const mockChild = {
            on: vi.fn((event, callback) => {
              if (event === 'close') callback(0)
            })
          }
          mockSpawn.mockReturnValue(mockChild as any)

          const result = await service.downloadUv('win32', 'arm64')
          expect(result).toBe(true)
        } finally {
          Object.defineProperty(process, 'platform', { value: originalPlatform })
        }
      })
    })

    describe('macOS platform', () => {
      it('should download uv for darwin-x64 and set execute permissions', async () => {
        const progressCallback = vi.fn()

        const mockRequest = { on: vi.fn(), destroy: vi.fn() }
        const mockResponse = {
          statusCode: 200,
          headers: { 'content-length': '12582912' },
          on: vi.fn(function (this: any, event, callback) {
            if (event === 'data') {
              setTimeout(() => callback(Buffer.alloc(1024)), 10)
            }
            return this
          }),
          pipe: vi.fn()
        }

        httpsGetSpy.mockImplementation((_url, _options, callback) => {
          setTimeout(() => callback(mockResponse), 10)
          return mockRequest
        })

        // Mock tar extraction
        const mockChild = {
          on: vi.fn((event, callback) => {
            if (event === 'close') callback(0)
          })
        }
        mockSpawn.mockReturnValue(mockChild as any)

        const result = await service.downloadUv('darwin', 'x64', progressCallback)

        expect(result).toBe(true)
        expect(mockFs.chmodSync).toHaveBeenCalledWith(expect.stringContaining('uv'), 0o755)
        expect(mockSpawn).toHaveBeenCalledWith('tar', expect.any(Array), expect.any(Object))
      })

      it('should download uv for darwin-arm64 and set execute permissions', async () => {
        const mockRequest = { on: vi.fn(), destroy: vi.fn() }
        const mockResponse = {
          statusCode: 200,
          headers: { 'content-length': '12582912' },
          on: vi.fn(function (this: any) {
            return this
          }),
          pipe: vi.fn()
        }

        httpsGetSpy.mockImplementation((_url, _options, callback) => {
          setTimeout(() => callback(mockResponse), 10)
          return mockRequest
        })

        const mockChild = {
          on: vi.fn((event, callback) => {
            if (event === 'close') callback(0)
          })
        }
        mockSpawn.mockReturnValue(mockChild as any)

        const result = await service.downloadUv('darwin', 'arm64')
        expect(result).toBe(true)
        expect(mockFs.chmodSync).toHaveBeenCalledWith(expect.stringContaining('uv'), 0o755)
      })
    })

    describe('Linux platform', () => {
      it('should download uv for linux-x64 and set execute permissions', async () => {
        const mockRequest = { on: vi.fn(), destroy: vi.fn() }
        const mockResponse = {
          statusCode: 200,
          headers: { 'content-length': '12582912' },
          on: vi.fn(function (this: any, event, callback) {
            if (event === 'data') {
              setTimeout(() => callback(Buffer.alloc(1024)), 10)
            }
            return this
          }),
          pipe: vi.fn()
        }

        httpsGetSpy.mockImplementation((_url, _options, callback) => {
          setTimeout(() => callback(mockResponse), 10)
          return mockRequest
        })

        const mockChild = {
          on: vi.fn((event, callback) => {
            if (event === 'close') callback(0)
          })
        }
        mockSpawn.mockReturnValue(mockChild as any)

        const result = await service.downloadUv('linux', 'x64')
        expect(result).toBe(true)
        expect(mockFs.chmodSync).toHaveBeenCalledWith(expect.stringContaining('uv'), 0o755)
      })

      it('should download uv for linux-arm64 and set execute permissions', async () => {
        const mockRequest = { on: vi.fn(), destroy: vi.fn() }
        const mockResponse = {
          statusCode: 200,
          headers: { 'content-length': '12582912' },
          on: vi.fn(function (this: any) {
            return this
          }),
          pipe: vi.fn()
        }

        httpsGetSpy.mockImplementation((_url, _options, callback) => {
          setTimeout(() => callback(mockResponse), 10)
          return mockRequest
        })

        const mockChild = {
          on: vi.fn((event, callback) => {
            if (event === 'close') callback(0)
          })
        }
        mockSpawn.mockReturnValue(mockChild as any)

        const result = await service.downloadUv('linux', 'arm64')
        expect(result).toBe(true)
        expect(mockFs.chmodSync).toHaveBeenCalledWith(expect.stringContaining('uv'), 0o755)
      })
    })

    describe('Download error handling', () => {
      it('should handle HTTP 302 redirect successfully', async () => {
        const mockRedirectResponse = {
          statusCode: 302,
          headers: { location: 'https://github.com/redirect-url' }
        }

        const mockFinalResponse = {
          statusCode: 200,
          headers: { 'content-length': '12582912' },
          pipe: vi.fn(),
          on: vi.fn((event, callback) => {
            if (event === 'data') {
              // 模拟数据分块传输
              setTimeout(() => callback(Buffer.alloc(1024)), 10)
            } else if (event === 'end') {
              setTimeout(() => callback(), 20)
            }
            return mockFinalResponse
          }),
          destroy: vi.fn()
        }

        let callCount = 0
        const mockRequest = { on: vi.fn(), destroy: vi.fn() }

        httpsGetSpy.mockImplementation((_url, _options, callback) => {
          callCount++
          if (callCount === 1) {
            setTimeout(() => callback(mockRedirectResponse), 10)
          } else {
            setTimeout(() => callback(mockFinalResponse), 10)
          }
          return mockRequest
        })

        const mockChild = {
          on: vi.fn((event, callback) => {
            if (event === 'close') callback(0)
          })
        }
        mockSpawn.mockReturnValue(mockChild as any)

        const result = await service.downloadUv('darwin', 'arm64')
        expect(result).toBe(true)
      })

      it('should fail when too many redirects (>5)', async () => {
        const mockRedirectResponse = {
          statusCode: 302,
          headers: { location: 'https://redirect.com' }
        }

        const mockRequest = { on: vi.fn(), destroy: vi.fn() }

        httpsGetSpy.mockImplementation((_url, _options, callback) => {
          setTimeout(() => callback(mockRedirectResponse), 10)
          return mockRequest
        })

        const result = await service.downloadUv('darwin', 'arm64')
        expect(result).toBe(false)
      })

      it('should handle HTTP 404 error', async () => {
        const mockResponse = {
          statusCode: 404,
          headers: {}
        }

        const mockRequest = { on: vi.fn(), destroy: vi.fn() }

        httpsGetSpy.mockImplementation((_url, _options, callback) => {
          setTimeout(() => callback(mockResponse), 10)
          return mockRequest
        })

        const result = await service.downloadUv('darwin', 'arm64')
        expect(result).toBe(false)
      })

      it('should handle extraction failure', async () => {
        const mockRequest = { on: vi.fn(), destroy: vi.fn() }
        const mockResponse = {
          statusCode: 200,
          headers: { 'content-length': '12582912' },
          pipe: vi.fn(),
          on: vi.fn((event, callback) => {
            if (event === 'data') {
              setTimeout(() => callback(Buffer.alloc(1024)), 10)
            } else if (event === 'end') {
              setTimeout(() => callback(), 20)
            }
            return mockResponse
          }),
          destroy: vi.fn()
        }

        httpsGetSpy.mockImplementation((_url, _options, callback) => {
          setTimeout(() => callback(mockResponse), 10)
          return mockRequest
        })

        // Mock spawn to fail extraction
        const mockChild = {
          on: vi.fn((event, callback) => {
            if (event === 'close') {
              setTimeout(() => callback(1), 10) // Exit code 1 = failure
            }
          })
        }
        mockSpawn.mockReturnValue(mockChild as any)

        const result = await service.downloadUv('darwin', 'arm64')
        expect(result).toBe(false)
      })

      it('should skip download if uv already exists', async () => {
        mockFs.existsSync.mockReturnValue(true)
        mockFs.statSync.mockReturnValue({ isFile: () => true } as any)

        const mockChild = {
          stdout: { on: vi.fn() },
          stderr: { on: vi.fn() },
          on: vi.fn((event, callback) => {
            if (event === 'close') callback(0)
          })
        }
        mockSpawn.mockReturnValue(mockChild as any)

        const result = await service.downloadUv('darwin', 'arm64')
        expect(result).toBe(true)
      })

      it('should return false for unsupported platform', async () => {
        const result = await service.downloadUv('unsupported' as any, 'x64')
        expect(result).toBe(false)
      })

      it('should handle download already in progress', async () => {
        const mockRequest = { on: vi.fn(), destroy: vi.fn() }
        const mockResponse = {
          statusCode: 200,
          headers: { 'content-length': '12582912' },
          pipe: vi.fn(),
          on: vi.fn((event, callback) => {
            if (event === 'data') {
              setTimeout(() => callback(Buffer.alloc(1024)), 10)
            } else if (event === 'end') {
              setTimeout(() => callback(), 20)
            }
            return mockResponse
          }),
          destroy: vi.fn()
        }

        httpsGetSpy.mockImplementation((_url, _options, callback) => {
          setTimeout(() => callback(mockResponse), 10)
          return mockRequest
        })

        const mockChild = {
          on: vi.fn((event, callback) => {
            if (event === 'close') {
              setTimeout(() => callback(0), 1000) // Long delay
            }
          })
        }
        mockSpawn.mockReturnValue(mockChild as any)

        // Start first download
        const download1 = service.downloadUv('darwin', 'arm64')

        // Try to start second download immediately
        const download2 = service.downloadUv('darwin', 'arm64')

        const result2 = await download2
        expect(result2).toBe(false) // Should fail because download in progress

        await download1 // Clean up
      })

      it('should handle missing executable after extraction', async () => {
        const mockRequest = { on: vi.fn(), destroy: vi.fn() }
        const mockResponse = {
          statusCode: 200,
          headers: { 'content-length': '12582912' },
          pipe: vi.fn(),
          on: vi.fn((event, callback) => {
            if (event === 'data') {
              setTimeout(() => callback(Buffer.alloc(1024)), 10)
            } else if (event === 'end') {
              setTimeout(() => callback(), 20)
            }
            return mockResponse
          }),
          destroy: vi.fn()
        }

        httpsGetSpy.mockImplementation((_url, _options, callback) => {
          setTimeout(() => callback(mockResponse), 10)
          return mockRequest
        })

        const mockChild = {
          on: vi.fn((event, callback) => {
            if (event === 'close') callback(0)
          })
        }
        mockSpawn.mockReturnValue(mockChild as any)

        // Mock that extracted file doesn't exist
        mockFs.existsSync.mockImplementation((path) => {
          const pathStr = String(path)
          if (pathStr.includes('uv.exe') || pathStr.endsWith('uv')) {
            return false
          }
          return false
        })

        const result = await service.downloadUv('darwin', 'arm64')
        expect(result).toBe(false)
      })
    })

    describe('Progress tracking', () => {
      it('should report download progress with correct status transitions', async () => {
        const statusSequence: string[] = []
        const progressCallback = vi.fn((progress: DownloadProgress) => {
          statusSequence.push(progress.status)
        })
        const mockRequest = { on: vi.fn(), destroy: vi.fn() }
        const mockResponse = new PassThrough()
        ;(mockResponse as any).statusCode = 200
        ;(mockResponse as any).headers = { 'content-length': '10240' }

        httpsGetSpy.mockImplementation((_url, _options, callback) => {
          setTimeout(() => {
            callback(mockResponse)
            setTimeout(() => {
              mockResponse.write(Buffer.alloc(5120))
              setTimeout(() => {
                mockResponse.write(Buffer.alloc(5120))
                mockResponse.end()
              }, 1100)
            }, 10)
          }, 10)
          return mockRequest
        })

        const immediateCloseChild = {
          on: vi.fn((event, callback) => {
            if (event === 'close') {
              callback(0)
            }
          })
        }
        const slowCloseChild = {
          on: vi.fn((event, callback) => {
            if (event === 'close') {
              setTimeout(() => callback(0), 2000)
            }
          })
        }
        mockSpawn
          .mockReturnValueOnce(immediateCloseChild as any)
          .mockReturnValueOnce(immediateCloseChild as any)
          .mockReturnValue(slowCloseChild as any)

        await service.downloadUv('darwin', 'arm64', progressCallback)

        expect(progressCallback).toHaveBeenCalled()
        expect(mockLogger.error).not.toHaveBeenCalled()
        expect(statusSequence).toContain('downloading')
        expect(statusSequence).toContain('extracting')
        expect(statusSequence).toContain('completed')
      })

      it('should calculate download speed and remaining time', async () => {
        const progressSnapshots: DownloadProgress[] = []
        const progressCallback = vi.fn((progress: DownloadProgress) => {
          progressSnapshots.push({ ...progress })
        })

        const mockRequest = { on: vi.fn(), destroy: vi.fn() }
        const mockResponse = new PassThrough()
        ;(mockResponse as any).statusCode = 200
        ;(mockResponse as any).headers = { 'content-length': '20480' }

        httpsGetSpy.mockImplementation((_url, _options, callback) => {
          setTimeout(() => {
            callback(mockResponse)
            setTimeout(() => {
              mockResponse.write(Buffer.alloc(10240))
              setTimeout(() => {
                mockResponse.write(Buffer.alloc(10240))
                mockResponse.end()
              }, 1100)
            }, 10)
          }, 10)
          return mockRequest
        })

        const immediateCloseChild = {
          on: vi.fn((event, callback) => {
            if (event === 'close') callback(0)
          })
        }
        mockSpawn
          .mockReturnValueOnce(immediateCloseChild as any)
          .mockReturnValueOnce(immediateCloseChild as any)
          .mockReturnValue(immediateCloseChild as any)

        await service.downloadUv('darwin', 'arm64', progressCallback)

        expect(mockLogger.error).not.toHaveBeenCalled()
        const progressWithSpeed = progressSnapshots.find((snapshot) => snapshot.speed > 0)
        expect(progressWithSpeed).toBeDefined()
        expect(progressWithSpeed!).toHaveProperty('remainingTime')
      })
    })

    describe('Download cancellation', () => {
      it('should cancel download when requested', async () => {
        const mockRequest = { on: vi.fn(), destroy: vi.fn() }
        const mockResponse = {
          statusCode: 200,
          headers: { 'content-length': '12582912' },
          pipe: vi.fn(),
          on: vi.fn((event, callback) => {
            if (event === 'data') {
              setTimeout(() => callback(Buffer.alloc(1024)), 10)
            } else if (event === 'end') {
              setTimeout(() => callback(), 20)
            }
            return mockResponse
          }),
          destroy: vi.fn()
        }

        httpsGetSpy.mockImplementation((_url, _options, callback) => {
          setTimeout(() => callback(mockResponse), 10)
          return mockRequest
        })

        // Start download
        const downloadPromise = service.downloadUv('darwin', 'arm64')

        // Cancel immediately
        setTimeout(() => {
          service.cancelDownload('darwin', 'arm64')
        }, 20)

        const result = await downloadPromise
        expect(result).toBe(false)
      })

      it('should get download progress', async () => {
        const mockRequest = { on: vi.fn(), destroy: vi.fn() }
        const mockResponse = {
          statusCode: 200,
          headers: { 'content-length': '12582912' },
          pipe: vi.fn(),
          on: vi.fn((event, callback) => {
            if (event === 'data') {
              setTimeout(() => callback(Buffer.alloc(1024)), 10)
            } else if (event === 'end') {
              setTimeout(() => callback(), 20)
            }
            return mockResponse
          }),
          destroy: vi.fn()
        }

        httpsGetSpy.mockImplementation((_url, _options, callback) => {
          setTimeout(() => callback(mockResponse), 10)
          return mockRequest
        })

        const mockChild = {
          on: vi.fn((event, callback) => {
            if (event === 'close') {
              setTimeout(() => callback(0), 100)
            }
          })
        }
        mockSpawn.mockReturnValue(mockChild as any)

        // Start download
        const downloadPromise = service.downloadUv('darwin', 'arm64')

        // Check progress while downloading
        const progressCheck = new Promise<void>((resolve) => {
          setTimeout(() => {
            try {
              const progress = service.getDownloadProgress('darwin', 'arm64')
              expect(progress).toBeDefined()
              expect(progress!.status).toBe('downloading')
            } finally {
              resolve()
            }
          }, 300)
        })

        await Promise.all([downloadPromise, progressCheck])
      })
    })
  })
})
