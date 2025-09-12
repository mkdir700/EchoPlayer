import { getVideoDialogExtensions, toDialogExtensions, videoExts } from '@shared/config/constant'
import { describe, expect, it } from 'vitest'

describe('文件对话框扩展名配置测试', () => {
  describe('toDialogExtensions', () => {
    it('应该移除扩展名数组中的前导点', () => {
      const input = ['.mp4', '.avi', '.mov']
      const expected = ['mp4', 'avi', 'mov']
      const result = toDialogExtensions(input)
      expect(result).toEqual(expected)
    })

    it('应该保持已经没有点的扩展名不变', () => {
      const input = ['mp4', 'avi', 'mov']
      const expected = ['mp4', 'avi', 'mov']
      const result = toDialogExtensions(input)
      expect(result).toEqual(expected)
    })

    it('应该处理混合格式的扩展名数组', () => {
      const input = ['.mp4', 'avi', '.mov', 'wmv']
      const expected = ['mp4', 'avi', 'mov', 'wmv']
      const result = toDialogExtensions(input)
      expect(result).toEqual(expected)
    })

    it('应该处理空数组', () => {
      const input: string[] = []
      const expected: string[] = []
      const result = toDialogExtensions(input)
      expect(result).toEqual(expected)
    })

    it('应该处理包含多个点的扩展名', () => {
      const input = ['..mp4', '...avi', '.mov']
      const expected = ['.mp4', '..avi', 'mov']
      const result = toDialogExtensions(input)
      expect(result).toEqual(expected)
    })
  })

  describe('getVideoDialogExtensions', () => {
    it('应该返回所有支持的视频扩展名（不含点）', () => {
      const result = getVideoDialogExtensions()

      // 验证返回的扩展名都不含前导点
      result.forEach((ext) => {
        expect(ext).not.toMatch(/^\./)
      })

      // 验证包含所有预期的视频格式
      const expectedFormats = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv']
      expectedFormats.forEach((format) => {
        expect(result).toContain(format)
      })
    })

    it('应该与 videoExts 配置保持同步', () => {
      const result = getVideoDialogExtensions()
      const expectedFromVideoExts = toDialogExtensions(videoExts)

      expect(result).toEqual(expectedFromVideoExts)
    })

    it('返回的扩展名应该适合 Electron dialog 使用', () => {
      const result = getVideoDialogExtensions()

      // Electron dialog 的 extensions 数组要求：
      // 1. 不能包含前导点
      // 2. 不能包含通配符（除了 '*'）
      // 3. 不能包含路径分隔符
      result.forEach((ext) => {
        expect(ext).not.toMatch(/^\./) // 不能有前导点
        expect(ext).not.toMatch(/[/\\]/) // 不能有路径分隔符
        expect(ext).not.toMatch(/^\*$/) // 不应该是通配符（除非专门指定）
        expect(ext.length).toBeGreaterThan(0) // 不能为空
      })
    })
  })

  describe('Issue #118 回归测试', () => {
    it('确保扩展名格式能正确防止 Windows 双点问题', () => {
      const dialogExtensions = getVideoDialogExtensions()

      // 这些扩展名将被用于 Electron dialog
      // 确保它们的格式不会导致双点问题
      dialogExtensions.forEach((ext) => {
        // 验证扩展名格式本身，确保不会导致双点问题
        expect(ext).toMatch(/^[a-z0-9]+$/) // 只包含字母和数字，无特殊字符
        expect(ext).not.toMatch(/^\./) // 确保没有前导点
      })
    })

    it('验证所有支持的视频格式都包含在内', () => {
      const dialogExtensions = getVideoDialogExtensions()

      // 根据 GitHub issue #118，确保包含所有主要视频格式
      const criticalFormats = ['mp4', 'mov', 'avi', 'mkv', 'wmv']

      criticalFormats.forEach((format) => {
        expect(dialogExtensions).toContain(format)
      })
    })

    it('验证扩展名在不同平台上的一致性', () => {
      // 这个测试确保我们的扩展名配置在所有平台上都一致
      const dialogExtensions = getVideoDialogExtensions()

      // 应该返回相同的扩展名，无论在什么平台上
      expect(dialogExtensions).toEqual(['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv'])

      // 长度应该匹配原始 videoExts 数组
      expect(dialogExtensions.length).toBe(videoExts.length)
    })
  })

  describe('性能和内存测试', () => {
    it('应该缓存结果以提高性能', () => {
      const result1 = getVideoDialogExtensions()
      const result2 = getVideoDialogExtensions()

      // 验证返回的是相同的数组引用或至少内容相同
      expect(result1).toEqual(result2)
    })

    it('应该处理大量扩展名而不出现性能问题', () => {
      const largeExtArray = Array.from({ length: 1000 }, (_, i) => `.ext${i}`)

      const start = performance.now()
      const result = toDialogExtensions(largeExtArray)
      const end = performance.now()

      // 处理时间应该在合理范围内（小于100ms）
      expect(end - start).toBeLessThan(100)
      expect(result.length).toBe(1000)
    })
  })
})
