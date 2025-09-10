import { SubtitleFormat } from '@types'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { SubtitleReader, SubtitleReaderError } from '../SubtitleReader'

// Mock window.api.file.readFromPath
const mockReadFromPath = vi.fn()
vi.stubGlobal('window', {
  api: {
    file: {
      readFromPath: mockReadFromPath
    }
  }
})

describe('SubtitleReader - ASS字幕解析修复测试', () => {
  let reader: SubtitleReader

  beforeEach(() => {
    reader = SubtitleReader.create('test')
    mockReadFromPath.mockReset()
  })

  describe('ASS样式标记清理回归测试', () => {
    it('应该清理缺少开头大括号的样式标记（关键修复）', () => {
      // 这是导致问题的核心场景：\\3c&HFF8000&\\fnKaiTi}从侧面下的雨
      const stripASSTagsPrivate = (reader as any).stripAssTags.bind(reader)

      const input = '\\\\3c&HFF8000&\\\\fnKaiTi}从侧面下的雨'
      const result = stripASSTagsPrivate(input)

      // 关键是确保样式标记被清理，文本内容保留
      expect(result).not.toContain('\\\\3c')
      expect(result).not.toContain('\\\\fn')
      expect(result).not.toContain('&HFF8000&')
      expect(result).not.toContain('}')
      expect(result).toContain('从侧面下的雨')
    })

    it('应该清理所有真实的ASS字幕残留标记', () => {
      const stripASSTagsPrivate = (reader as any).stripAssTags.bind(reader)

      const cases = [
        '\\\\3c&HFF8000&\\\\fnKaiTi}从侧面下的雨',
        '\\\\3c&HFF8000&\\\\fnKaiTi}我们经历了各种各样的雨',
        '\\\\3c&HFF8000&\\\\fnKaiTi}象小针样的雨',
        '\\\\3c&HFF8000&\\\\fnKaiTi}还有倾盆大雨',
        '\\\\3c&HFF8000&\\\\fnKaiTi}从下往上的雨',
        '\\\\3c&HFF8000&\\\\fnKaiTi}连晚上也下雨'
      ]

      cases.forEach((input) => {
        const result = stripASSTagsPrivate(input)

        // 确保样式标记被完全清理
        expect(result).not.toContain('\\\\3c')
        expect(result).not.toContain('\\\\fn')
        expect(result).not.toContain('&HFF8000&')
        expect(result).not.toContain('}')

        // 确保中文内容被保留
        expect(result.trim().length).toBeGreaterThan(0)
        expect(result).toMatch(/雨/)
      })
    })

    it('应该清理完整的ASS样式标记', () => {
      const stripASSTagsPrivate = (reader as any).stripAssTags.bind(reader)

      const input = '{\\\\3c&HFF8000&\\\\fnKaiTi}从侧面下的雨'
      const result = stripASSTagsPrivate(input)

      expect(result).toContain('从侧面下的雨')
      expect(result).not.toContain('\\\\3c')
      expect(result).not.toContain('\\\\fn')
    })
  })

  describe('脚本检测测试', () => {
    it('应该正确检测脚本类型', () => {
      const detectScriptPrivate = (reader as any).detectScript.bind(reader)

      expect(detectScriptPrivate('Hello world')).toBe('Latin')
      expect(detectScriptPrivate('你好世界')).toBe('Han')
      expect(detectScriptPrivate('Hello 你好')).toBe('Latin') // 拉丁字母优先级高
    })
  })

  describe('格式检测测试', () => {
    it('应该正确检测ASS格式', () => {
      const detectFormatPrivate = (reader as any).detectFormatByPathOrContent.bind(reader)

      expect(detectFormatPrivate('/path/to/test.ass', '')).toBe(SubtitleFormat.ASS)

      const assContent = '[Script Info]\\n[V4+ Styles]\\n[Events]'
      expect(detectFormatPrivate('/path/to/test.txt', assContent)).toBe(SubtitleFormat.ASS)
    })
  })

  describe('错误处理测试', () => {
    it('应该处理空文件', async () => {
      mockReadFromPath.mockResolvedValue('')

      await expect(reader.readFromFile('/path/to/empty.ass')).rejects.toThrow(SubtitleReaderError)
    })

    it('应该处理文件读取失败', async () => {
      mockReadFromPath.mockRejectedValue(new Error('File not found'))

      await expect(reader.readFromFile('/path/to/nonexistent.ass')).rejects.toThrow(
        SubtitleReaderError
      )
    })
  })
})
