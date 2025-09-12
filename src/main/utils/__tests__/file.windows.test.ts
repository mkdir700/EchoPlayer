import * as path from 'path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { getFileExt } from '../file'

// Mock process.platform for Windows testing
const originalPlatform = process.platform

describe('Windows 文件扩展名处理测试', () => {
  beforeEach(() => {
    // Mock Windows platform
    Object.defineProperty(process, 'platform', {
      value: 'win32',
      configurable: true
    })
  })

  afterEach(() => {
    // Restore original platform
    Object.defineProperty(process, 'platform', {
      value: originalPlatform,
      configurable: true
    })
  })

  describe('getFileExt - Windows 路径处理', () => {
    it('应该正确处理 Windows 反斜杠路径', () => {
      const testCases = [
        { input: 'C:\\Users\\user\\Videos\\video.mp4', expected: '.mp4' },
        { input: 'C:\\path\\to\\file.mov', expected: '.mov' },
        { input: 'D:\\media\\test.avi', expected: '.avi' },
        { input: '\\\\server\\share\\video.wmv', expected: '.wmv' },
        { input: 'C:\\folder\\file.mkv', expected: '.mkv' }
      ]

      testCases.forEach(({ input, expected }) => {
        const result = getFileExt(input)
        expect(result).toBe(expected)
      })
    })

    it('应该正确处理混合路径分隔符', () => {
      const testCases = [
        { input: 'C:\\Users/user\\Videos/video.mp4', expected: '.mp4' },
        { input: 'C:/Users\\user/Videos\\video.mov', expected: '.mov' },
        { input: 'C:\\folder/subfolder\\file.flv', expected: '.flv' }
      ]

      testCases.forEach(({ input, expected }) => {
        const result = getFileExt(input)
        expect(result).toBe(expected)
      })
    })

    it('应该处理 Windows 驱动器路径前的斜杠', () => {
      const testCases = [
        { input: '/C:/Users/user/video.mp4', expected: '.mp4' },
        { input: '/D:/media/file.mov', expected: '.mov' },
        { input: '/E:/data/test.avi', expected: '.avi' }
      ]

      testCases.forEach(({ input, expected }) => {
        const result = getFileExt(input)
        expect(result).toBe(expected)
      })
    })

    it('应该修复双点扩展名问题 (GitHub Issue #118)', () => {
      // 模拟可能导致双点的路径情况
      const testCases = [
        { input: 'C:\\Users\\user\\video.mp4', expected: '.mp4', description: '标准路径' },
        {
          input: 'C:\\folder\\.hidden\\video.mp4',
          expected: '.mp4',
          description: '包含隐藏文件夹'
        },
        {
          input: 'C:\\path\\file.name.with.dots.mp4',
          expected: '.mp4',
          description: '文件名包含多个点'
        },
        {
          input: 'C:\\Users\\user\\My.Videos\\test.mov',
          expected: '.mov',
          description: '目录名包含点'
        }
      ]

      testCases.forEach(({ input, expected }) => {
        const result = getFileExt(input)
        expect(result).toBe(expected)
        // 确保不会出现双点
        expect(result).not.toMatch(/^\.\..+/)
        // 确保只有一个前导点
        if (result.startsWith('.')) {
          expect(result.match(/^\./g)?.length).toBe(1)
        }
      })
    })

    it('应该处理边缘情况', () => {
      const testCases = [
        { input: '', expected: '', description: '空字符串' },
        { input: 'C:\\noext', expected: '', description: '无扩展名' },
        { input: 'C:\\folder\\', expected: '', description: '目录路径' },
        { input: 'C:\\file.', expected: '', description: '扩展名为空' },
        {
          input: '   C:\\Users\\user\\video.mp4   ',
          expected: '.mp4',
          description: '带空格的路径'
        },
        {
          input: 'C:\\Users\\user\\video.MP4',
          expected: '.mp4',
          description: '大写扩展名应转为小写'
        }
      ]

      testCases.forEach(({ input, expected }) => {
        const result = getFileExt(input)
        expect(result).toBe(expected)
      })
    })

    it('应该与 path.extname 的结果进行对比验证', () => {
      const testPaths = [
        'C:\\Users\\user\\video.mp4',
        'C:/Users/user/video.mov',
        '/C:/data/test.avi'
      ]

      testPaths.forEach((testPath) => {
        const ourResult = getFileExt(testPath)
        const pathResult = path.extname(testPath.replace(/\\/g, '/'))

        // 对于正常路径，两种方法应该得到相同结果
        if (!testPath.startsWith('/C:')) {
          expect(ourResult.toLowerCase()).toBe(pathResult.toLowerCase())
        }

        // 确保我们的方法总是返回小写
        if (ourResult) {
          expect(ourResult).toBe(ourResult.toLowerCase())
        }
      })
    })

    it('应该正确识别所有支持的视频格式', () => {
      const videoFormats = ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.mkv']

      videoFormats.forEach((format) => {
        const testPath = `C:\\Users\\user\\video${format}`
        const result = getFileExt(testPath)
        expect(result).toBe(format)
      })
    })
  })

  describe('路径安全性验证', () => {
    it('应该拒绝包含路径分隔符的扩展名', () => {
      const maliciousPaths = [
        'C:\\folder\\file.exe/malicious',
        'C:\\folder\\file.txt\\..\\malicious',
        'C:\\folder\\file.mp4/../../../etc/passwd'
      ]

      maliciousPaths.forEach((maliciousPath) => {
        const result = getFileExt(maliciousPath)
        // 确保扩展名不包含路径分隔符
        if (result) {
          expect(result).not.toMatch(/[/\\]/)
        }
      })
    })

    it('应该处理超长路径', () => {
      const longPath = 'C:\\' + 'very\\'.repeat(100) + 'long\\path\\video.mp4'
      const result = getFileExt(longPath)
      expect(result).toBe('.mp4')
    })
  })
})

describe('跨平台兼容性测试', () => {
  it('macOS 路径应该正常工作', () => {
    Object.defineProperty(process, 'platform', {
      value: 'darwin',
      configurable: true
    })

    const macPaths = [
      '/Users/user/Videos/video.mp4',
      '/Volumes/External/video.mov',
      '/Applications/Video Player.app/Contents/Resources/sample.avi'
    ]

    macPaths.forEach((macPath) => {
      const result = getFileExt(macPath)
      const expected = path.extname(macPath).toLowerCase()
      expect(result).toBe(expected)
    })

    // Restore Windows for other tests
    Object.defineProperty(process, 'platform', {
      value: 'win32',
      configurable: true
    })
  })

  it('Linux 路径应该正常工作', () => {
    Object.defineProperty(process, 'platform', {
      value: 'linux',
      configurable: true
    })

    const linuxPaths = [
      '/home/user/videos/video.mp4',
      '/media/usb/video.mov',
      '/tmp/test video with spaces.avi'
    ]

    linuxPaths.forEach((linuxPath) => {
      const result = getFileExt(linuxPath)
      const expected = path.extname(linuxPath).toLowerCase()
      expect(result).toBe(expected)
    })

    // Restore Windows for other tests
    Object.defineProperty(process, 'platform', {
      value: 'win32',
      configurable: true
    })
  })
})
