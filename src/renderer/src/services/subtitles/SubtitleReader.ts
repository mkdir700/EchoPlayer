import { loggerService } from '@logger'
import type { SubtitleItem } from '@types'
import { SubtitleFormat } from '@types'
import subsrt from 'subsrt-ts'

// 字符脚本类型（顶层声明，便于类内复用与扩展）
type Script =
  | 'Han'
  | 'Latin'
  | 'Hiragana'
  | 'Katakana'
  | 'Hangul'
  | 'Cyrillic'
  | 'Arabic'
  | 'Devanagari'
  | 'Other'

/**
 * 渲染进程字幕读取与解析中间层
 * - 统一文件读取、格式检测与解析
 * - 支持 JSON/SRT/VTT/ASS/SSA
 * - 输出与现有 SubtitleItem 结构保持兼容
 */
export class SubtitleReaderError extends Error {
  public code: 'READ_FAILED' | 'UNSUPPORTED_FORMAT' | 'PARSE_FAILED' | 'INVALID_CONTENT'
  public cause?: unknown
  constructor(message: string, code: SubtitleReaderError['code'], cause?: unknown) {
    super(message)
    this.name = 'SubtitleReaderError'
    this.code = code
    this.cause = cause
  }
}

export class SubtitleReader {
  private logger = loggerService.withContext('SubtitleReader')
  private context?: string

  static create(context?: string) {
    return new SubtitleReader(context)
  }

  constructor(context?: string) {
    this.context = context
  }

  /**
   * 从文件读取并解析为标准 SubtitleItem 列表
   */
  async readFromFile(filePath: string): Promise<SubtitleItem[]> {
    try {
      this.logger.info('开始读取字幕文件', { filePath, context: this.context })
      const content = await window.api.file.readFromPath(filePath)
      if (!content || content.trim() === '') {
        this.logger.warn('读取到空的字幕内容', { filePath })
        throw new SubtitleReaderError('字幕文件为空或无法读取', 'READ_FAILED')
      }

      const format = this.detectFormatByPathOrContent(filePath, content)
      this.logger.info('检测到字幕格式', { filePath, format })

      const items = await this.parse(content, format)
      const normalized = this.normalize(items)

      this.logger.info('字幕解析完成', { filePath, count: normalized.length, format })
      return normalized
    } catch (e: any) {
      if (e instanceof SubtitleReaderError) {
        throw e
      }
      this.logger.error('读取或解析字幕失败', { filePath, error: e })
      throw new SubtitleReaderError('读取或解析字幕失败', 'PARSE_FAILED', e)
    }
  }

  /**
   * 基于扩展名 + 内容启发式检测格式
   */
  detectFormatByPathOrContent(filePath: string, content: string): SubtitleFormat {
    const lower = filePath.toLowerCase()
    const ext = lower.includes('.') ? lower.split('.').pop() : ''
    if (ext === 'json') return SubtitleFormat.JSON
    if (ext === 'srt') return SubtitleFormat.SRT
    if (ext === 'vtt') return SubtitleFormat.VTT
    if (ext === 'ass') return SubtitleFormat.ASS
    if (ext === 'ssa') return SubtitleFormat.SSA

    // 启发式：优先识别 VTT/ASS/SRT/JSON
    const head = content.slice(0, 2048)
    if (/WEBVTT/i.test(head)) return SubtitleFormat.VTT
    if (/(\[Script Info\]|\[V4\+ Styles\]|\[Events\])/i.test(content)) return SubtitleFormat.ASS
    if (/-->/.test(content) && /\d{2}:\d{2}:\d{2}/.test(content)) return SubtitleFormat.SRT

    try {
      JSON.parse(content)
      return SubtitleFormat.JSON
    } catch {
      // ignore
    }

    throw new SubtitleReaderError('无法识别的字幕格式', 'UNSUPPORTED_FORMAT')
  }

  /**
   * 解析为 SubtitleItem[]
   */
  async parse(content: string, format: SubtitleFormat): Promise<SubtitleItem[]> {
    switch (format) {
      case SubtitleFormat.JSON:
        return this.parseJSON(content)
      case SubtitleFormat.SRT:
      case SubtitleFormat.VTT:
      case SubtitleFormat.ASS:
      case SubtitleFormat.SSA:
        try {
          return this.parseWithSubsrt(content, format)
        } catch (e) {
          this.logger.warn('subsrt 解析失败，回退到内置解析器', { format, error: e })
          // 回退到原有解析逻辑，增强鲁棒性
          if (format === SubtitleFormat.SRT) return this.parseSRT(content)
          if (format === SubtitleFormat.VTT) return this.parseVTT(content)
          return this.parseASS(content)
        }
      default:
        throw new SubtitleReaderError('不支持的字幕格式', 'UNSUPPORTED_FORMAT')
    }
  }

  private toSubsrtFormat(format: SubtitleFormat): string {
    switch (format) {
      case SubtitleFormat.SRT:
        return 'srt'
      case SubtitleFormat.VTT:
        return 'vtt'
      case SubtitleFormat.ASS:
        return 'ass'
      case SubtitleFormat.SSA:
        return 'ssa'
      default:
        return 'srt'
    }
  }

  private parseWithSubsrt(content: string, format: SubtitleFormat): SubtitleItem[] {
    const fmt = this.toSubsrtFormat(format)
    const cues: any[] = subsrt.parse(content, { format: fmt })
    const items = cues.map((c, i) => {
      let text = String(c.text ?? '')
      if (format === SubtitleFormat.ASS || format === SubtitleFormat.SSA) {
        text = this.stripAssTags(text)
      } else if (format === SubtitleFormat.SRT || format === SubtitleFormat.VTT) {
        text = this.stripTags(text)
      }

      const { originalText, translatedText } = this.splitBilingualText(text)

      return {
        id: String(i),
        startTime: Number(c.start) / 1000,
        endTime: Number(c.end) / 1000,
        originalText,
        ...(translatedText ? { translatedText } : {})
      } as SubtitleItem
    })
    return items
  }

  private normalize(list: SubtitleItem[]): SubtitleItem[] {
    return list
      .filter(
        (it) =>
          typeof it.startTime === 'number' &&
          typeof it.endTime === 'number' &&
          !Number.isNaN(it.startTime) &&
          !Number.isNaN(it.endTime)
      )
      .map((it, idx) => ({
        id: String((it as any).id ?? idx),
        startTime: it.startTime,
        endTime: it.endTime,
        originalText: (it.originalText ?? '').toString(),
        translatedText: typeof it.translatedText === 'string' ? it.translatedText : undefined
      }))
  }

  // ---------- JSON ----------
  private async parseJSON(content: string): Promise<SubtitleItem[]> {
    try {
      const parsed = JSON.parse(content)
      if (!Array.isArray(parsed)) return []
      return parsed
        .filter((it: any) => typeof it.startTime === 'number' && typeof it.endTime === 'number')
        .map((it: any, idx: number) => {
          const originalText =
            typeof it.originalText === 'string'
              ? it.originalText
              : typeof it.text === 'string'
                ? it.text
                : typeof it.englishText === 'string'
                  ? it.englishText
                  : ''
          const translatedText =
            typeof it.translatedText === 'string'
              ? it.translatedText
              : typeof it.chineseText === 'string'
                ? it.chineseText
                : undefined
          return {
            id: String(it.id ?? idx),
            startTime: it.startTime,
            endTime: it.endTime,
            originalText,
            translatedText
          }
        })
    } catch (e) {
      this.logger.error('JSON 字幕解析失败', { error: e })
      throw new SubtitleReaderError('JSON 字幕解析失败', 'PARSE_FAILED', e)
    }
  }

  // ---------- SRT ----------
  private async parseSRT(content: string): Promise<SubtitleItem[]> {
    const blocks = content
      .replace(/\r/g, '')
      .trim()
      .split(/\n\s*\n/)
    const items: SubtitleItem[] = []

    for (let i = 0; i < blocks.length; i++) {
      const lines = blocks[i].split(/\n/).map((l) => l.trim())
      if (lines.length < 2) continue
      // 可能第一行是编号，第二行是时间
      const timeLine = /-->/.test(lines[0]) ? lines[0] : lines[1]
      const m = timeLine.match(/(\d{2}:\d{2}:\d{2}[,.]\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}[,.]\d{3})/)
      if (!m) continue
      const startTime = this.parseClockTime(m[1])
      const endTime = this.parseClockTime(m[2])
      const textLines = /-->/.test(lines[0]) ? lines.slice(1) : lines.slice(2)
      const text = this.stripTags(textLines.join('\n'))
      items.push({ id: String(i), startTime, endTime, originalText: text })
    }

    return items
  }

  // ---------- VTT ----------
  private async parseVTT(content: string): Promise<SubtitleItem[]> {
    const cleaned = content.replace(/\r/g, '').replace(/^WEBVTT[^\n]*\n/, '')
    const blocks = cleaned.trim().split(/\n\s*\n/)
    const items: SubtitleItem[] = []

    for (let i = 0; i < blocks.length; i++) {
      const lines = blocks[i].split(/\n/)
      // 跳过 NOTE/STYLE/REGION 等块
      if (/^(NOTE|STYLE|REGION)/i.test(lines[0])) continue

      let timeIdx = 0
      if (!/-->/.test(lines[0]) && lines.length > 1 && /-->/.test(lines[1])) {
        timeIdx = 1 // 第一行是 cue id
      }
      if (!/-->/.test(lines[timeIdx])) continue
      const m = lines[timeIdx].match(
        /(\d{2}:\d{2}:\d{2}\.\d{3}|\d{2}:\d{2}\.\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}\.\d{3}|\d{2}:\d{2}\.\d{3})/
      )
      if (!m) continue
      const startTime = this.parseClockTime(m[1])
      const endTime = this.parseClockTime(m[2])
      const text = this.stripTags(lines.slice(timeIdx + 1).join('\n'))
      items.push({ id: String(i), startTime, endTime, originalText: text })
    }

    return items
  }

  // ---------- ASS/SSA ----------
  private async parseASS(content: string): Promise<SubtitleItem[]> {
    const lines = content.replace(/\r/g, '').split(/\n/)
    let inEvents = false
    let formatCols: string[] = []
    let startIdx = -1
    let endIdx = -1
    let textIdx = -1

    const items: SubtitleItem[] = []

    for (const line of lines) {
      if (/^\s*\[Events\]\s*$/i.test(line)) {
        inEvents = true
        continue
      }
      if (!inEvents) continue

      const fmtMatch = line.match(/^\s*Format\s*:\s*(.*)$/i)
      if (fmtMatch) {
        formatCols = fmtMatch[1].split(',').map((s) => s.trim().toLowerCase())
        startIdx = formatCols.indexOf('start')
        endIdx = formatCols.indexOf('end')
        textIdx = formatCols.indexOf('text')
        continue
      }

      const diaMatch = line.match(/^\s*Dialogue\s*:\s*(.*)$/i)
      if (diaMatch && startIdx >= 0 && endIdx >= 0 && textIdx >= 0) {
        // 将对话字段按 format 拆分：前 (textIdx) 个逗号严格拆分，其余为文本
        const raw = diaMatch[1]
        const parts: string[] = []
        let cur = ''
        let commaCount = 0
        for (let i = 0; i < raw.length; i++) {
          const ch = raw[i]
          if (ch === ',' && commaCount < formatCols.length - 1) {
            parts.push(cur)
            cur = ''
            commaCount++
          } else {
            cur += ch
          }
        }
        parts.push(cur)
        if (parts.length < formatCols.length) continue

        const start = parts[startIdx].trim()
        const end = parts[endIdx].trim()
        let text = parts.slice(textIdx).join(',') // 若 text 内仍有逗号，合并回去
        text = this.stripAssTags(text)

        const startTime = this.parseAssTime(start)
        const endTime = this.parseAssTime(end)
        if (Number.isNaN(startTime) || Number.isNaN(endTime)) continue

        items.push({ id: String(items.length), startTime, endTime, originalText: text })
      }
    }

    return items
  }

  // 多脚本识别 + 原文优先策略（可扩展到多语言）
  private readonly preferredOriginalScripts: Script[] = [
    'Latin',
    'Han',
    'Hiragana',
    'Katakana',
    'Hangul',
    'Cyrillic',
    'Arabic',
    'Devanagari',
    'Other'
  ]

  private detectScript(s: string): Script {
    const counts: Record<Script, number> = {
      Han: 0,
      Latin: 0,
      Hiragana: 0,
      Katakana: 0,
      Hangul: 0,
      Cyrillic: 0,
      Arabic: 0,
      Devanagari: 0,
      Other: 0
    }
    for (const ch of s) {
      const code = ch.codePointAt(0) ?? 0
      if (code >= 0x4e00 && code <= 0x9fff) counts.Han++
      else if ((code >= 0x0041 && code <= 0x007a) || (code >= 0x00c0 && code <= 0x024f))
        counts.Latin++
      else if (code >= 0x3040 && code <= 0x309f) counts.Hiragana++
      else if (code >= 0x30a0 && code <= 0x30ff) counts.Katakana++
      else if (code >= 0xac00 && code <= 0xd7af) counts.Hangul++
      else if (code >= 0x0400 && code <= 0x04ff) counts.Cyrillic++
      else if (code >= 0x0600 && code <= 0x06ff) counts.Arabic++
      else if (code >= 0x0900 && code <= 0x097f) counts.Devanagari++
      else counts.Other++
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0] as Script
  }

  private splitBilingualText(text: string): { originalText: string; translatedText?: string } {
    const trimmed = text.trim()
    if (!trimmed) return { originalText: '' }

    const lines = trimmed
      .split(/\n+/)
      .map((l) => l.trim())
      .filter(Boolean)

    const pickByScript = (parts: string[]) => {
      const scored = parts.map((p) => ({ text: p, script: this.detectScript(p) }))
      const hit = this.preferredOriginalScripts.find((scr) => scored.some((x) => x.script === scr))
      if (hit) {
        const orig = scored.find((x) => x.script === hit)!.text
        const rest = scored
          .filter((x) => x.text !== orig)
          .map((x) => x.text)
          .join('\n')
        return rest ? { originalText: orig, translatedText: rest } : { originalText: orig }
      }
      return { originalText: parts[0], translatedText: parts.slice(1).join('\n') }
    }

    if (lines.length >= 2) {
      return pickByScript(lines)
    }

    // 单行混排：尝试按常见分隔符拆分
    const segs = trimmed
      .split(/\s*[/|:\-—–•]\s*/)
      .map((s) => s.trim())
      .filter(Boolean)
    if (segs.length >= 2) {
      return pickByScript(segs)
    }

    return { originalText: trimmed }
  }

  // ---------- helpers ----------

  private parseClockTime(s: string): number {
    // 支持 00:00:01,000 | 00:00:01.000 | 00:01.000
    const withHours = s.match(/^(\d{2}):(\d{2}):(\d{2})[.,](\d{3})$/)
    if (withHours) {
      const h = Number(withHours[1])
      const m = Number(withHours[2])
      const sec = Number(withHours[3])
      const ms = Number(withHours[4])
      return h * 3600 + m * 60 + sec + ms / 1000
    }
    const withoutHours = s.match(/^(\d{2}):(\d{2})[.,](\d{3})$/)
    if (withoutHours) {
      const m = Number(withoutHours[1])
      const sec = Number(withoutHours[2])
      const ms = Number(withoutHours[3])
      return m * 60 + sec + ms / 1000
    }
    return NaN
  }

  private parseAssTime(s: string): number {
    // h:mm:ss.cs  (centiseconds)
    const m = s.match(/^(\d+):(\d{2}):(\d{2})[.,](\d{2})$/)
    if (!m) return NaN
    const h = Number(m[1])
    const min = Number(m[2])
    const sec = Number(m[3])
    const cs = Number(m[4])
    return h * 3600 + min * 60 + sec + cs / 100
  }

  private stripTags(s: string): string {
    return s.replace(/<[^>]*>/g, '').trim()
  }

  private stripAssTags(s: string): string {
    // 去掉样式 {\i1} 等；将 \N 转换为换行
    return s
      .replace(/\{[^}]*\}/g, '')
      .replace(/\\N/g, '\n')
      .trim()
  }
}
