/**
 * 字幕格式化服务
 * 负责将字幕数据格式化并导出为 SRT/VTT 文件
 */

import type { ASRSubtitleItem } from '@shared/types'
import * as fs from 'fs'
import { convert } from 'subsrt-ts'

import { loggerService } from '../LoggerService'

const logger = loggerService.withContext('SubtitleFormatter')

export interface FormatOptions {
  /** 单条字幕最大时长（秒） */
  maxDuration?: number
  /** 单行最大字符数 */
  maxCharsPerLine?: number
}

class SubtitleFormatter {
  /**
   * 格式化字幕
   * 确保符合时长和字符数限制
   */
  public formatSubtitles(items: ASRSubtitleItem[], options: FormatOptions = {}): ASRSubtitleItem[] {
    const { maxDuration = 8, maxCharsPerLine = 42 } = options

    logger.info('开始格式化字幕', {
      itemCount: items.length,
      maxDuration,
      maxCharsPerLine
    })

    const formatted: ASRSubtitleItem[] = []

    for (const item of items) {
      // 检查是否需要拆分
      const duration = item.endTime - item.startTime
      const text = item.text

      if (duration <= maxDuration && text.length <= maxCharsPerLine) {
        // 不需要拆分
        formatted.push({
          ...item,
          text,
          index: formatted.length
        })
      } else {
        // 需要拆分
        const split = this.splitSubtitle(item, maxDuration, maxCharsPerLine)
        formatted.push(...split.map((s, i) => ({ ...s, index: formatted.length + i })))
      }
    }

    logger.info('字幕格式化完成', { outputCount: formatted.length })

    return formatted
  }

  /**
   * 拆分过长的字幕
   */
  private splitSubtitle(
    item: ASRSubtitleItem,
    _maxDuration: number,
    maxCharsPerLine: number
  ): ASRSubtitleItem[] {
    const result: ASRSubtitleItem[] = []

    // 如果有单词级时间戳，使用精确拆分
    if (item.words && item.words.length > 0) {
      return this.splitSubtitleWithWordTimestamps(item, maxCharsPerLine)
    }

    // 降级：按文本估算拆分
    const words = item.text.split(/\s+/)
    const duration = item.endTime - item.startTime
    const avgTimePerChar = duration / item.text.length

    let currentWords: string[] = []
    let currentChars = 0
    let segmentStart = item.startTime

    for (const word of words) {
      const wordLength = word.length + 1 // +1 for space

      if (currentChars + wordLength > maxCharsPerLine && currentWords.length > 0) {
        // 创建一个字幕段
        const text = currentWords.join(' ')
        const estimatedDuration = text.length * avgTimePerChar
        const segmentEnd = Math.min(segmentStart + estimatedDuration, item.endTime)

        result.push({
          index: 0, // 稍后重新索引
          startTime: segmentStart,
          endTime: segmentEnd,
          text
        })

        // 重置
        currentWords = [word]
        currentChars = wordLength
        segmentStart = segmentEnd
      } else {
        currentWords.push(word)
        currentChars += wordLength
      }
    }

    // 处理剩余的词
    if (currentWords.length > 0) {
      const text = currentWords.join(' ')
      result.push({
        index: 0,
        startTime: segmentStart,
        endTime: item.endTime,
        text
      })
    }

    return result
  }

  /**
   * 使用单词级时间戳精确拆分字幕
   */
  private splitSubtitleWithWordTimestamps(
    item: ASRSubtitleItem,
    maxCharsPerLine: number
  ): ASRSubtitleItem[] {
    const result: ASRSubtitleItem[] = []
    const words = item.words!

    let currentWords: typeof words = []
    let currentChars = 0

    for (let i = 0; i < words.length; i++) {
      const word = words[i]
      const wordText = word.punctuated_word || word.word
      const wordLength = wordText.length + 1 // +1 for space

      if (currentChars + wordLength > maxCharsPerLine && currentWords.length > 0) {
        // 创建一个字幕段（使用精确的单词时间戳）
        const text = currentWords.map((w) => w.punctuated_word || w.word).join(' ')
        const segmentStart = currentWords[0].start
        const segmentEnd = currentWords[currentWords.length - 1].end

        result.push({
          index: 0, // 稍后重新索引
          startTime: segmentStart,
          endTime: segmentEnd,
          text,
          words: currentWords
        })

        // 重置
        currentWords = [word]
        currentChars = wordLength
      } else {
        currentWords.push(word)
        currentChars += wordLength
      }
    }

    // 处理剩余的词
    if (currentWords.length > 0) {
      const text = currentWords.map((w) => w.punctuated_word || w.word).join(' ')
      const segmentStart = currentWords[0].start
      const segmentEnd = currentWords[currentWords.length - 1].end

      result.push({
        index: 0,
        startTime: segmentStart,
        endTime: segmentEnd,
        text,
        words: currentWords
      })
    }

    logger.debug('使用单词级时间戳拆分字幕', {
      originalLength: item.text.length,
      segmentCount: result.length
    })

    return result
  }

  /**
   * 导出为 SRT 格式
   */
  public async exportToSRT(items: ASRSubtitleItem[], outputPath: string): Promise<void> {
    logger.info('导出 SRT 文件', { outputPath, itemCount: items.length })

    try {
      // 生成 SRT 内容
      let srtContent = ''

      for (const item of items) {
        srtContent += `${item.index + 1}\n`
        srtContent += `${this.formatTime(item.startTime)} --> ${this.formatTime(item.endTime)}\n`
        srtContent += `${item.text}\n\n`
      }

      // 写入文件
      await fs.promises.writeFile(outputPath, srtContent, 'utf-8')

      logger.info('SRT 文件导出成功', { outputPath })
    } catch (error) {
      logger.error('SRT 文件导出失败', {
        error: error instanceof Error ? error.message : String(error)
      })
      throw error
    }
  }

  /**
   * 导出为 VTT 格式
   */
  public async exportToVTT(items: ASRSubtitleItem[], outputPath: string): Promise<void> {
    logger.info('导出 VTT 文件', { outputPath, itemCount: items.length })

    try {
      // 先生成 SRT 格式
      const srtItems = items.map((item) => ({
        index: item.index + 1,
        start: this.formatTime(item.startTime),
        end: this.formatTime(item.endTime),
        text: item.text
      }))

      const srtContent = srtItems
        .map((item) => `${item.index}\n${item.start} --> ${item.end}\n${item.text}\n`)
        .join('\n')

      // 转换为 VTT
      const vttContent = convert(srtContent, { from: 'srt', to: 'vtt' })

      // 写入文件
      await fs.promises.writeFile(outputPath, vttContent, 'utf-8')

      logger.info('VTT 文件导出成功', { outputPath })
    } catch (error) {
      logger.error('VTT 文件导出失败', {
        error: error instanceof Error ? error.message : String(error)
      })
      throw error
    }
  }

  /**
   * 格式化时间为 SRT 格式 (HH:MM:SS,mmm)
   */
  private formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    const millis = Math.floor((seconds % 1) * 1000)

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(millis).padStart(3, '0')}`
  }
}

export default SubtitleFormatter
