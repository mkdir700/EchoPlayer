import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { FFmpegNativeClient } from '../../renderer/src/utils/ffmpegNativeClient'

describe('FFmpegNativeClient', () => {
  let client: FFmpegNativeClient
  let originalPlatform: string

  beforeEach(() => {
    client = new FFmpegNativeClient()
    originalPlatform = process.platform

    // Mock console methods to avoid noise in test output
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    // Restore original platform
    Object.defineProperty(process, 'platform', {
      value: originalPlatform,
      writable: true
    })
    vi.restoreAllMocks()
  })

  describe('generateTranscodedPath', () => {
    it('should correctly decode Chinese filename from file:// URL', async () => {
      const originalPath =
        'file:///Users/mark/Movies/%E8%80%81%E5%8F%8B%E8%AE%B0.H265.1080P.SE01.01.mkv'
      const result = await client.generateTranscodedPath(originalPath)

      expect(result).toMatch(/^file:\/\/\/Users\/mark\/Movies\//)
      expect(result).toMatch(/_transcoded_\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z\.mp4$/)

      // The filename should be encoded but the original should be decoded internally
      const decodedUrl = decodeURIComponent(result)
      expect(decodedUrl).toContain('老友记.H265.1080P.SE01.01_transcoded_')
    })

    it('should preserve directory structure with subdirectories', async () => {
      const originalPath =
        'file:///Users/mark/Movies/SE01/%E8%80%81%E5%8F%8B%E8%AE%B0.H265.1080P.SE01.01.mkv'
      const result = await client.generateTranscodedPath(originalPath)

      expect(result).toMatch(/^file:\/\/\/Users\/mark\/Movies\/SE01\//)
      expect(result).toMatch(/_transcoded_\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z\.mp4$/)
    })

    it('should handle multiple levels of subdirectories', async () => {
      const originalPath =
        'file:///Users/mark/Movies/TV/老友记/Season01/%E8%80%81%E5%8F%8B%E8%AE%B0.S01E01.mkv'
      const result = await client.generateTranscodedPath(originalPath)

      expect(result).toMatch(/^file:\/\/\/Users\/mark\/Movies\/TV\//)
      expect(result).toContain('%E8%80%81%E5%8F%8B%E8%AE%B0') // Should be encoded in URL
    })

    it('should handle English filenames correctly', async () => {
      const originalPath = 'file:///Users/mark/Movies/Friends.S01E01.1080p.mkv'
      const result = await client.generateTranscodedPath(originalPath)

      expect(result).toMatch(/^file:\/\/\/Users\/mark\/Movies\//)
      expect(result).toContain('Friends.S01E01.1080p_transcoded_')
      expect(result).toMatch(/\.mp4$/)
    })

    it('should handle files with special characters', async () => {
      const originalPath = 'file:///Users/mark/Movies/Video%20%26%20Audio%20%5BTest%5D.mkv'
      const result = await client.generateTranscodedPath(originalPath)

      expect(result).toMatch(/^file:\/\/\/Users\/mark\/Movies\//)
      expect(result).toMatch(/_transcoded_\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z\.mp4$/)

      // Should handle URL encoding properly
      const decodedUrl = decodeURIComponent(result)
      expect(decodedUrl).toContain('Video & Audio [Test]_transcoded_')
    })

    it('should handle root directory files', async () => {
      const originalPath = 'file:///test.mkv'
      const result = await client.generateTranscodedPath(originalPath)

      expect(result).toMatch(
        /^file:\/\/\/test_transcoded_\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z\.mp4$/
      )
    })

    it('should handle local paths (non-file:// URLs)', async () => {
      const originalPath = '/Users/mark/Movies/test.mkv'
      const result = await client.generateTranscodedPath(originalPath)

      expect(result).toMatch(
        /^\/Users\/mark\/Movies\/test_transcoded_\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z\.mp4$/
      )
    })

    it('should handle Windows local paths', async () => {
      // Mock Windows platform
      Object.defineProperty(process, 'platform', {
        value: 'win32',
        writable: true
      })

      const originalPath = 'C:\\Users\\mark\\Movies\\test.mkv'
      const result = await client.generateTranscodedPath(originalPath)

      expect(result).toMatch(
        /^C:\\Users\\mark\\Movies\\test_transcoded_\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z\.mp4$/
      )
    })

    it('should handle Windows file:// URLs', async () => {
      // Mock Windows platform
      Object.defineProperty(process, 'platform', {
        value: 'win32',
        writable: true
      })

      const originalPath = 'file:///C:/Users/mark/Movies/test.mkv'
      const result = await client.generateTranscodedPath(originalPath)

      expect(result).toMatch(/^file:\/\/\/C:\/Users\/mark\/Movies\//)
      expect(result).toContain('test_transcoded_')
    })

    it('should remove file extension correctly', async () => {
      const testCases = [
        'file:///Users/mark/Movies/test.mkv',
        'file:///Users/mark/Movies/test.mp4',
        'file:///Users/mark/Movies/test.avi',
        'file:///Users/mark/Movies/test.mov',
        'file:///Users/mark/Movies/test.m4v'
      ]

      for (const originalPath of testCases) {
        const result = await client.generateTranscodedPath(originalPath)
        expect(result).toContain('test_transcoded_')
        expect(result).not.toContain('.mkv')
        expect(result).not.toContain('.avi')
        expect(result).not.toContain('.mov')
        expect(result).not.toContain('.m4v')
        expect(result).toMatch(/\.mp4$/)
      }
    })

    it('should handle files with multiple dots in name', async () => {
      const originalPath = 'file:///Users/mark/Movies/My.Video.File.v2.0.mkv'
      const result = await client.generateTranscodedPath(originalPath)

      expect(result).toContain('My.Video.File.v2.0_transcoded_')
      expect(result).toMatch(/\.mp4$/)
      expect(result).not.toContain('.mkv')
    })

    it('should handle malformed URLs gracefully', async () => {
      const originalPath = 'file://invalid-url-format'
      const result = await client.generateTranscodedPath(originalPath)

      // Should fallback to traditional path splitting
      expect(result).toBeTruthy()
      expect(result).toMatch(/_transcoded_\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z\.mp4$/)
    })

    it('should generate unique timestamps for consecutive calls', async () => {
      const originalPath = 'file:///Users/mark/Movies/test.mkv'

      const result1 = await client.generateTranscodedPath(originalPath)

      // Wait a small amount to ensure different timestamp
      await new Promise((resolve) => setTimeout(resolve, 1))

      const result2 = await client.generateTranscodedPath(originalPath)

      expect(result1).not.toBe(result2)

      // Extract timestamps
      const timestamp1 = result1.match(
        /_transcoded_(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z)\.mp4$/
      )?.[1]
      const timestamp2 = result2.match(
        /_transcoded_(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z)\.mp4$/
      )?.[1]

      expect(timestamp1).toBeTruthy()
      expect(timestamp2).toBeTruthy()
      expect(timestamp1).not.toBe(timestamp2)
    })

    it('should handle empty or invalid filenames', async () => {
      const testCases = [
        'file:///Users/mark/Movies/',
        'file:///Users/mark/Movies',
        '/Users/mark/Movies/',
        ''
      ]

      for (const originalPath of testCases) {
        const result = await client.generateTranscodedPath(originalPath)
        expect(result).toBeTruthy()
        expect(result).toMatch(/_transcoded_\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z\.mp4$/)
      }
    })

    it('should preserve complex Chinese directory structures', async () => {
      const originalPath =
        'file:///Users/mark/电影/老友记/第一季/%E8%80%81%E5%8F%8B%E8%AE%B0.S01E01.mkv'
      const result = await client.generateTranscodedPath(originalPath)

      expect(result).toMatch(/^file:\/\/\/Users\/mark\//)
      // The Chinese characters in path should be properly encoded
      expect(result).toContain('%E7%94%B5%E5%BD%B1') // 电影
      expect(result).toContain('%E8%80%81%E5%8F%8B%E8%AE%B0') // 老友记
      expect(result).toContain('%E7%AC%AC%E4%B8%80%E5%AD%A3') // 第一季
    })

    it('should handle URL encoding edge cases', async () => {
      // Test with already URL-encoded path that contains Chinese characters
      const originalPath = 'file:///Users/mark/Movies/%E8%80%81%E5%8F%8B%E8%AE%B0%20%5B2024%5D.mkv'
      const result = await client.generateTranscodedPath(originalPath)

      expect(result).toMatch(/^file:\/\/\/Users\/mark\/Movies\//)

      // Decode to verify the internal processing
      const decodedResult = decodeURIComponent(result)
      expect(decodedResult).toContain('老友记 [2024]_transcoded_')
    })
  })
})
