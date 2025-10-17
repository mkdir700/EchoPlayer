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

      // 验证日志记录
      expect(mockLogger.info).toHaveBeenCalledWith('清理临时字幕文件完成', { count: 3 })
    })

    it('should handle case when no temporary subtitle files exist', async () => {
      // 执行清理（没有创建任何临时文件）
      await service.cleanupTempFiles()

      // 验证日志记录
      expect(mockLogger.info).toHaveBeenCalledWith('未找到临时字幕文件可清理')
    })

    it('should match correct file patterns', async () => {
      // 创建各种格式的临时字幕文件
      const validFiles = [
        'subtitle_1234567890_abc123.srt', // SRT
        'subtitle_9876543210_xyz789.ass', // ASS
        'subtitle_1111111111_def456.vtt', // VTT
        'subtitle_2222222222_ghi789.sup', // SUP
        'subtitle_3333333333_jkl012.sub' // SUB
      ]

      const invalidFiles = [
        'subtitle_1234567890.srt', // 缺少随机字符串
        'subtitle_abc123.srt', // 时间戳不是数字
        'sub_1234567890_abc123.srt', // 前缀不匹配
        'subtitle_1234567890_abc123.txt', // 扩展名不匹配
        'subtitle_1234567890_ABC123.srt' // 随机字符串包含大写字母（不匹配）
      ]

      // 创建文件
      for (const file of [...validFiles, ...invalidFiles]) {
        const filePath = path.join(tempDir, file)
        fs.writeFileSync(filePath, 'test')
        testFiles.push(filePath)
      }

      // 执行清理
      await service.cleanupTempFiles()

      // 验证有效文件被删除
      for (const file of validFiles) {
        const filePath = path.join(tempDir, file)
        expect(fs.existsSync(filePath)).toBe(false)
      }

      // 验证无效文件未被删除
      for (const file of invalidFiles) {
        const filePath = path.join(tempDir, file)
        expect(fs.existsSync(filePath)).toBe(true)
      }

      expect(mockLogger.info).toHaveBeenCalledWith('清理临时字幕文件完成', { count: 5 })
    })
  })

  describe('cleanupTempFile', () => {
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

    it('should return false when file does not exist', async () => {
      const nonExistentFile = path.join(tempDir, 'non_existent_file.srt')

      // 执行清理
      const result = await service.cleanupTempFile(nonExistentFile)

      // 验证返回 false
      expect(result).toBe(false)
    })
  })
})
