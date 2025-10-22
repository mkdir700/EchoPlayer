/**
 * ASR 字幕生成主服务
 * 简化版：直接上传完整音频到 Deepgram，无需分段
 */

import type {
  ASRErrorCode,
  ASRGenerateOptions,
  ASRProgress,
  ASRResult,
  ASRSubtitleItem,
  DeepgramResponse,
  DeepgramUtterance,
  DeepgramWord,
  TranslationOptions
} from '@shared/types'
import { ASRProgressStage } from '@shared/types'
import { app } from 'electron'
import * as fs from 'fs'
import * as path from 'path'
import { v4 as uuidv4 } from 'uuid'

import { db } from '../db/dao'
import DeepgramTranscriber from './asr/DeepgramTranscriber'
import SubtitleFormatter from './asr/SubtitleFormatter'
import AudioPreprocessor from './audio/AudioPreprocessor'
import { configManager } from './ConfigManager'
import { loggerService } from './LoggerService'
import { subtitleTranslationService } from './SubtitleTranslationService'

const logger = loggerService.withContext('ASRSubtitleService')

export type ASRProgressCallback = (progress: ASRProgress) => void

class ASRSubtitleService {
  private audioPreprocessor: AudioPreprocessor
  private subtitleFormatter: SubtitleFormatter

  // 当前运行的任务
  private activeTasks: Map<string, { transcriber: DeepgramTranscriber; cancelled: boolean }> =
    new Map()

  constructor() {
    this.audioPreprocessor = new AudioPreprocessor()
    this.subtitleFormatter = new SubtitleFormatter()

    logger.info('ASR 字幕服务初始化完成')
  }

  /**
   * 创建持久化字幕文件路径
   */
  private async createPersistentSubtitlePath(
    videoId: string,
    taskId: string,
    outputFormat: string
  ): Promise<string> {
    const userDataPath = app.getPath('userData')
    const subtitlesDir = path.join(userDataPath, 'subtitles', videoId)

    // 确保目录存在（异步操作）
    try {
      await fs.promises.access(subtitlesDir)
    } catch {
      await fs.promises.mkdir(subtitlesDir, { recursive: true })
      logger.debug('创建字幕目录', { subtitlesDir })
    }

    return path.join(subtitlesDir, `${taskId}.${outputFormat}`)
  }

  /**
   * 生成字幕（简化版）
   */
  public async generateSubtitle(
    options: ASRGenerateOptions,
    progressCallback?: ASRProgressCallback
  ): Promise<ASRResult> {
    const taskId = uuidv4()
    const startTime = Date.now()

    logger.info('开始生成 ASR 字幕', {
      taskId,
      videoPath: options.videoPath,
      language: options.language
    })

    // 创建临时目录
    const tempDir = this.audioPreprocessor.createTempDir(`asr-${taskId}-`)

    try {
      // 检查 API Key
      const apiKey = configManager.getDeepgramApiKey()
      if (!apiKey) {
        throw new Error('NO_API_KEY')
      }

      // 获取配置
      const language = options.language || configManager.getASRDefaultLanguage()
      const model = (options.model || configManager.getASRModel()) as 'nova-2' | 'nova-3'
      const outputFormat = options.outputFormat || 'srt'

      // 阶段 1: 初始化
      this.reportProgress(taskId, ASRProgressStage.Initializing, 0, progressCallback)

      // 阶段 2: 提取音频
      this.reportProgress(taskId, ASRProgressStage.ExtractingAudio, 5, progressCallback)
      logger.info('开始提取音频')

      const extractResult = await this.audioPreprocessor.extractAudioTrack(
        options.videoPath,
        tempDir,
        {
          sampleRate: 16000,
          channels: 1
        }
      )

      if (!extractResult.success || !extractResult.audioPath) {
        throw new Error('AUDIO_EXTRACTION_FAILED')
      }

      const audioDuration = extractResult.duration || 0
      logger.info('音频提取成功', { duration: audioDuration })

      // 阶段 3: 转写完整音频
      this.reportProgress(taskId, ASRProgressStage.Transcribing, 15, progressCallback)
      logger.info('开始转写音频')

      const transcriber = new DeepgramTranscriber(1)
      this.activeTasks.set(taskId, { transcriber, cancelled: false })

      const deepgramResponse = await transcriber.transcribeFile(extractResult.audioPath, {
        apiKey,
        model,
        language,
        smartFormat: true,
        utterances: true,
        utteranceEndMs: 1000
      })

      // 检查是否被取消
      if (this.activeTasks.get(taskId)?.cancelled) {
        throw new Error('TASK_CANCELLED')
      }

      logger.info('音频转写完成')

      // 再次检查是否被取消（在转写完成后）
      if (this.activeTasks.get(taskId)?.cancelled) {
        throw new Error('TASK_CANCELLED')
      }

      // 阶段 4: 提取字幕数据
      this.reportProgress(taskId, ASRProgressStage.Formatting, 85, progressCallback)
      logger.info('开始格式化字幕')

      // 检查是否被取消（在格式化前）
      if (this.activeTasks.get(taskId)?.cancelled) {
        throw new Error('TASK_CANCELLED')
      }

      // 从 Deepgram 响应中提取字幕
      const rawSubtitles = this.extractSubtitlesFromResponse(deepgramResponse)
      const formattedSubtitles = rawSubtitles
      // 格式化字幕（如需要可以启用）
      // const formattedSubtitles = this.subtitleFormatter.formatSubtitles(rawSubtitles, {
      //   maxDuration: 8,
      //   maxCharsPerLine: 42
      // })

      // 检查是否被取消（在提取完成后）
      if (this.activeTasks.get(taskId)?.cancelled) {
        throw new Error('TASK_CANCELLED')
      }

      // 阶段 5: 导出文件
      this.reportProgress(taskId, ASRProgressStage.Saving, 90, progressCallback)
      logger.info('开始导出字幕文件')

      // 检查是否被取消（在导出前）
      if (this.activeTasks.get(taskId)?.cancelled) {
        throw new Error('TASK_CANCELLED')
      }

      // 直接生成到持久化目录
      const outputPath = await this.createPersistentSubtitlePath(
        String(options.videoId),
        taskId,
        outputFormat
      )
      if (outputFormat === 'srt') {
        await this.subtitleFormatter.exportToSRT(formattedSubtitles, outputPath)
      } else {
        await this.subtitleFormatter.exportToVTT(formattedSubtitles, outputPath)
      }

      // 检查是否被取消（在导出完成后）
      if (this.activeTasks.get(taskId)?.cancelled) {
        throw new Error('TASK_CANCELLED')
      }

      // 阶段 6: 保存到数据库
      this.reportProgress(taskId, ASRProgressStage.Saving, 95, progressCallback)
      logger.info('开始保存字幕到数据库')

      // 转换 ASRSubtitleItem 到 SubtitleItem 格式
      const subtitleItems = formattedSubtitles.map((item) => ({
        id: `${taskId}-${item.index}`,
        startTime: item.startTime,
        endTime: item.endTime,
        originalText: item.text,
        translatedText: undefined,
        words: item.words // 保存单词级时间戳
      }))

      // 保存到数据库
      let subtitleLibraryId: number | undefined
      try {
        const result = await db.subtitleLibrary.addSubtitle({
          videoId: options.videoId,
          filePath: outputPath, // 直接使用持久化路径
          subtitles: JSON.stringify(subtitleItems),
          parsed_at: Date.now()
        })
        subtitleLibraryId = result.id
        logger.info('字幕保存到数据库成功', { subtitleLibraryId })
      } catch (error) {
        logger.error('保存字幕到数据库失败', {
          error: error instanceof Error ? error.message : String(error)
        })
        // 不抛出错误，继续返回结果
      }

      // 启动后台翻译任务
      this.startBackgroundTranslation(options.videoId, options.videoPath)

      // 完成
      const processingTime = (Date.now() - startTime) / 1000
      this.reportProgress(taskId, ASRProgressStage.Complete, 100, progressCallback)

      logger.info('ASR 字幕生成完成', {
        taskId,
        subtitleCount: formattedSubtitles.length,
        processingTime: `${processingTime.toFixed(2)}s`,
        subtitleLibraryId
      })

      // 清理任务
      this.activeTasks.delete(taskId)

      return {
        success: true,
        subtitles: formattedSubtitles,
        outputPath,
        subtitleLibraryId,
        stats: {
          duration: audioDuration,
          processingTime,
          segmentCount: 1,
          subtitleCount: formattedSubtitles.length
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      const errorCode = this.getErrorCode(errorMessage)

      // 如果是用户取消，使用 info 级别日志
      if (errorCode === 'TASK_CANCELLED') {
        logger.info('用户取消了 ASR 字幕生成', { taskId })
      } else {
        logger.error('ASR 字幕生成失败', {
          taskId,
          error: errorMessage
        })
      }

      this.reportProgress(taskId, ASRProgressStage.Failed, 0, progressCallback)
      this.activeTasks.delete(taskId)

      return {
        success: false,
        error: errorMessage,
        errorCode
      }
    } finally {
      // 清理临时目录
      try {
        await this.audioPreprocessor.cleanupTempDir(tempDir)
        logger.debug('临时目录清理成功', { tempDir })
      } catch (error) {
        logger.error('临时目录清理失败', {
          tempDir,
          error: error instanceof Error ? error.message : String(error)
        })
      }
    }
  }

  /**
   * 从 Deepgram 响应中提取字幕
   */
  private extractSubtitlesFromResponse(response?: DeepgramResponse): ASRSubtitleItem[] {
    const subtitles: ASRSubtitleItem[] = []

    try {
      // 处理响应为空的情况
      if (!response) {
        logger.warn('Deepgram 响应为空，无法提取字幕')
        return subtitles
      }

      // 优先使用 utterances（句段）
      const channel = response.results?.channels?.[0]
      const utterances = channel?.utterances as DeepgramUtterance[] | undefined

      if (utterances && utterances.length > 0) {
        logger.info('使用 utterances 提取字幕', { count: utterances.length })

        utterances.forEach((utterance, index) => {
          subtitles.push({
            index,
            startTime: utterance.start,
            endTime: utterance.end,
            text: utterance.transcript,
            words: utterance.words // 保存单词级时间戳
          })
        })
      } else {
        // 降级：使用 words（词级）智能分段
        const words = channel?.alternatives?.[0]?.words as DeepgramWord[] | undefined
        if (words && words.length > 0) {
          logger.info('使用 words 提取字幕（智能分段）', { count: words.length })
          const grouped = this.groupWordsIntoSentences(words)
          subtitles.push(...grouped)
        }
      }

      logger.info('字幕提取完成', { count: subtitles.length })
    } catch (error) {
      logger.error('提取字幕失败', {
        error: error instanceof Error ? error.message : String(error)
      })
      throw new Error('SUBTITLE_EXTRACTION_FAILED')
    }

    return subtitles
  }

  /**
   * 将单词智能分组为句子
   * 基于标点符号、停顿时长和时长限制
   */
  private groupWordsIntoSentences(words: DeepgramWord[]): ASRSubtitleItem[] {
    const sentences: ASRSubtitleItem[] = []
    let currentWords: DeepgramWord[] = []
    let sentenceStartTime = 0

    for (let i = 0; i < words.length; i++) {
      const word = words[i]
      const nextWord = words[i + 1]

      // 初始化句子开始时间
      if (currentWords.length === 0) {
        sentenceStartTime = word.start
      }

      currentWords.push(word)

      // 判断是否应该结束当前句子
      const shouldBreak = this.shouldBreakSentence(
        word,
        nextWord,
        sentenceStartTime,
        i === words.length - 1
      )

      if (shouldBreak) {
        // 创建字幕条目
        const text = currentWords.map((w) => w.punctuated_word || w.word).join(' ')
        sentences.push({
          index: sentences.length,
          startTime: sentenceStartTime,
          endTime: word.end,
          text,
          words: currentWords
        })

        currentWords = []
      }
    }

    logger.info('智能分段完成', {
      totalWords: words.length,
      sentenceCount: sentences.length,
      avgWordsPerSentence: (words.length / sentences.length).toFixed(1)
    })

    return sentences
  }

  /**
   * 判断是否应该在当前位置断句
   * 策略：句末标点优先，信任 Deepgram 的标点识别
   */
  private shouldBreakSentence(
    currentWord: DeepgramWord,
    nextWord: DeepgramWord | undefined,
    sentenceStartTime: number,
    isLastWord: boolean
  ): boolean {
    // 1. 最后一个单词，必须断句
    if (isLastWord) {
      return true
    }

    // 2. 检测句末标点符号 (., !, ?, 。, ！, ？) - 直接断句
    const punctuatedWord = currentWord.punctuated_word || currentWord.word
    const hasSentenceEndingPunctuation = /[.!?。！？]$/.test(punctuatedWord)

    if (hasSentenceEndingPunctuation) {
      logger.debug('断句：句末标点', {
        word: punctuatedWord
      })
      return true
    }

    // 3. 计算停顿时长（下一个单词的开始时间 - 当前单词的结束时间）
    const pauseDuration = nextWord ? nextWord.start - currentWord.end : 0

    // 4. 停顿时间 > 800ms：长停顿，可能是句子边界
    if (pauseDuration > 0.8) {
      logger.debug('断句：长停顿', {
        word: punctuatedWord,
        pauseDuration: pauseDuration.toFixed(3)
      })
      return true
    }

    // 5. 计算当前句子的时长
    const sentenceDuration = currentWord.end - sentenceStartTime

    // 6. 句子时长 > 8 秒：强制断句，避免过长
    if (sentenceDuration > 8) {
      // 如果有标点符号（逗号、分号、冒号），优先在标点处断句
      if (/[,;:，；：]$/.test(punctuatedWord)) {
        logger.debug('断句：超时 + 标点', {
          word: punctuatedWord,
          duration: sentenceDuration.toFixed(2)
        })
        return true
      }
      // 如果有停顿，在停顿处断句
      if (pauseDuration > 0.2) {
        logger.debug('断句：超时 + 短停顿', {
          word: punctuatedWord,
          duration: sentenceDuration.toFixed(2)
        })
        return true
      }
    }

    // 7. 句子时长 > 10 秒：强制断句（无论是否有标点）
    if (sentenceDuration > 10) {
      logger.debug('断句：强制超时', {
        word: punctuatedWord,
        duration: sentenceDuration.toFixed(2)
      })
      return true
    }

    return false
  }

  /**
   * 取消任务
   */
  public async cancelTask(taskId: string): Promise<boolean> {
    const task = this.activeTasks.get(taskId)
    if (!task) {
      return false
    }

    logger.info('取消 ASR 任务', { taskId })
    task.cancelled = true
    await task.transcriber.cancelAll()
    this.activeTasks.delete(taskId)

    return true
  }

  /**
   * 验证 API Key
   */
  public async validateApiKey(apiKey: string): Promise<{ valid: boolean; error?: string }> {
    logger.info('验证 Deepgram API Key')

    try {
      const transcriber = new DeepgramTranscriber(1)
      const result = await transcriber.validateApiKey(apiKey)
      return result
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'API Key 验证失败'
      }
    }
  }

  /**
   * 报告进度
   */
  private reportProgress(
    taskId: string,
    stage: ASRProgressStage,
    percent: number,
    callback?: ASRProgressCallback,
    current?: number,
    total?: number
  ): void {
    if (callback) {
      callback({
        taskId,
        stage,
        percent: Math.round(percent),
        current,
        total
      })
    }
  }

  /**
   * 启动后台翻译任务
   */
  private async startBackgroundTranslation(videoId: number, videoPath: string): Promise<void> {
    try {
      // 检查是否配置了 Zhipu API Key
      const zhipuApiKey = configManager.getZhipuApiKey()
      if (!zhipuApiKey) {
        logger.debug('未配置 Zhipu API Key，跳过翻译任务')
        return
      }

      // 检查翻译服务是否可用
      if (!subtitleTranslationService.isServiceAvailable()) {
        logger.warn('翻译服务不可用，跳过翻译任务')
        return
      }

      // 提取视频文件名作为上下文
      const videoFilename = path.basename(videoPath, path.extname(videoPath))

      logger.info('启动后台翻译任务', { videoId, videoFilename })

      // 异步启动翻译任务，不阻塞主流程
      this.translateSubtitlesInBackground(videoId, videoFilename).catch((error) => {
        logger.error('后台翻译任务失败', {
          videoId,
          error: error instanceof Error ? error.message : String(error)
        })
      })
    } catch (error) {
      logger.error('启动后台翻译任务失败', {
        videoId,
        error: error instanceof Error ? error.message : String(error)
      })
    }
  }

  /**
   * 后台翻译字幕的具体实现
   */
  private async translateSubtitlesInBackground(
    videoId: number,
    videoFilename: string
  ): Promise<void> {
    try {
      const translationOptions: TranslationOptions = {
        targetLanguage: 'zh-CN', // 当前版本仅支持翻译为中文
        batchSize: 15,
        maxConcurrency: 2,
        videoFilename
      }

      const result = await subtitleTranslationService.translateSubtitles(
        videoId,
        translationOptions
      )

      logger.info('后台翻译任务完成', {
        videoId,
        successCount: result.successCount,
        failureCount: result.failureCount,
        processingTime: `${(result.processingTime / 1000).toFixed(2)}s`
      })

      // 如果有翻译失败的情况，记录详细信息
      if (result.failureCount > 0) {
        const failedTranslations = result.results.filter((r) => !r.success)
        logger.warn('部分字幕翻译失败', {
          videoId,
          failureCount: result.failureCount,
          errors: failedTranslations.map((r) => r.error).filter(Boolean)
        })
      }
    } catch (error) {
      logger.error('后台翻译任务执行失败', {
        videoId,
        error: error instanceof Error ? error.message : String(error)
      })
      throw error
    }
  }

  /**
   * 获取错误代码
   */
  private getErrorCode(errorMessage: string): ASRErrorCode {
    if (errorMessage.includes('NO_API_KEY')) return 'NO_API_KEY'
    if (errorMessage.includes('API Key 无效')) return 'INVALID_API_KEY'
    if (errorMessage.includes('配额')) return 'QUOTA_EXCEEDED'
    if (errorMessage.includes('网络')) return 'NETWORK_ERROR'
    if (errorMessage.includes('AUDIO_EXTRACTION_FAILED')) return 'AUDIO_EXTRACTION_FAILED'
    if (errorMessage.includes('TASK_CANCELLED')) return 'TASK_CANCELLED'
    if (errorMessage.includes('REQUEST_CANCELLED')) return 'TASK_CANCELLED'
    return 'UNKNOWN_ERROR'
  }
}

export default ASRSubtitleService
