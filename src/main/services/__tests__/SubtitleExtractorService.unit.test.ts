import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

// 首先取消全局的 fs mock
vi.unmock('node:fs')
vi.unmock('node:fs/promises')

// 然后导入真实的 fs
import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'

const mockLogger = {
  info: vi.fn(),
  debug: vi.fn(),
  warn: vi.fn(),
  error: vi.fn()
}

vi.mock('../LoggerService', () => ({
  loggerService: {
    withContext: () => mockLogger
  }
}))

describe('SubtitleExtractorService', () => {
  let SubtitleExtractorService: any
  let service: any
  let tempDir: string
  let testFiles: string[] = []

  beforeAll(async () => {
    // 动态导入服务
    const module = await import('../SubtitleExtractorService')
    SubtitleExtractorService = module.default
  })

  beforeEach(() => {
    service = new SubtitleExtractorService()
    tempDir = os.tmpdir()
    testFiles = []
    vi.clearAllMocks()
  })

  afterEach(() => {
    // 清理测试创建的临时文件
    for (const file of testFiles) {
      try {
        if (fs.existsSync(file)) {
          fs.unlinkSync(file)
        }
      } catch (error) {
        // 忽略清理错误
      }
    }
    testFiles = []
  })

  describe('cleanupTempFiles', () => {
    it('should cleanup temporary subtitle files matching the pattern', async () => {
      // 创建符合模式的临时字幕文件
      const subtitleFiles = [
        path.join(tempDir, 'subtitle_1234567890_abc123.srt'),
        path.join(tempDir, 'subtitle_9876543210_xyz789.ass'),
        path.join(tempDir, 'subtitle_1111111111_def456.vtt')
      ]

      for (const file of subtitleFiles) {
        fs.writeFileSync(file, 'test content')
        testFiles.push(file)
      }

      // 创建不符合模式的文件（不应该被删除）
      const otherFile = path.join(tempDir, 'other_file.txt')
      fs.writeFileSync(otherFile, 'other content')
      testFiles.push(otherFile)

      // 验证文件存在
      for (const file of subtitleFiles) {
        expect(fs.existsSync(file)).toBe(true)
      }
      expect(fs.existsSync(otherFile)).toBe(true)

      // 执行清理
      await service.cleanupTempFiles()

      // 验证符合模式的文件被删除
      for (const file of subtitleFiles) {
        expect(fs.existsSync(file)).toBe(false)
      }

      // 验证不符合模式的文件未被删除
      expect(fs.existsSync(otherFile)).toBe(true)

      // 验证日志记录 - 检查是否调用了正确的日志方法
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringMatching(/清理临时字幕文件完成/),
        expect.objectContaining({ count: expect.any(Number) })
      )
    })

    it('should handle case when no temporary subtitle files exist', async () => {
      // 执行清理（没有创建任何临时文件）
      await service.cleanupTempFiles()

      // 验证日志记录
      expect(mockLogger.info).toHaveBeenCalledWith('未找到临时字幕文件可清理')
    })

    it('should match correct file patterns', async () => {
      // 测试正则表达式模式
      const subtitlePattern = /^subtitle_\d+_[a-z0-9]+\.(srt|ass|vtt|sup|sub)$/

      // 验证正则表达式匹配规则
      expect(subtitlePattern.test('subtitle_1234567890_abc123.srt')).toBe(true)
      expect(subtitlePattern.test('subtitle_9876543210_xyz789.ass')).toBe(true)
      expect(subtitlePattern.test('subtitle_1111111111_def456.vtt')).toBe(true)

      // 验证正则表达式不匹配规则
      expect(subtitlePattern.test('subtitle_1234567890_ABC123.srt')).toBe(false) // 大写字母
      expect(subtitlePattern.test('subtitle_1234567890.srt')).toBe(false) // 缺少随机字符串
      expect(subtitlePattern.test('other_file.srt')).toBe(false) // 不同前缀
    })
  })

  describe('cleanupTempFile', () => {
    it('should return false when file does not exist', async () => {
      // 使用一个更独特的文件名来避免冲突
      const nonExistentFile = path.join(tempDir, `non_existent_file_${Date.now()}.srt`)

      // 验证文件确实不存在
      expect(fs.existsSync(nonExistentFile)).toBe(false)

      // 执行清理
      const result = await service.cleanupTempFile(nonExistentFile)

      // 验证返回 false
      expect(result).toBe(false)
    })

    it('should cleanup a specific temporary file', async () => {
      // 创建临时文件
      const tempFile = path.join(tempDir, 'test_subtitle.srt')
      fs.writeFileSync(tempFile, 'test content')
      testFiles.push(tempFile)

      // 验证文件存在
      expect(fs.existsSync(tempFile)).toBe(true)

      // 执行清理
      const result = await service.cleanupTempFile(tempFile)

      // 验证文件被删除
      expect(result).toBe(true)
      expect(fs.existsSync(tempFile)).toBe(false)
      expect(mockLogger.info).toHaveBeenCalledWith('🧹 清理临时字幕文件', { filePath: tempFile })
    })
  })
})
