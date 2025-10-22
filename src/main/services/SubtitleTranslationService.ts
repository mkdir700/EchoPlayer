/**
 * 字幕翻译服务
 * 使用 Zhipu AI 进行字幕翻译
 */

import { createOpenAI } from '@ai-sdk/openai'
import type {
  TranslationBatchResult,
  TranslationOptions,
  TranslationProgress,
  TranslationResult
} from '@shared/types'
import { generateText } from 'ai'

import { db } from '../db/dao'
import { configManager } from './ConfigManager'
import { loggerService } from './LoggerService'

const logger = loggerService.withContext('SubtitleTranslationService')

export type TranslationProgressCallback = (progress: TranslationProgress) => void

class SubtitleTranslationService {
  private client: ReturnType<typeof createOpenAI> | null = null
  private model: string = 'glm-4.5-flash'
  private baseUrl = 'https://open.bigmodel.cn/api/paas/v4'

  constructor() {
    this.initializeLLMClient()
    logger.info('字幕翻译服务初始化完成')
  }

  /**
   * 初始化 Zhipu 客户端
   */
  private initializeLLMClient(): void {
    const apiKey = configManager.getZhipuApiKey()
    if (apiKey) {
      this.client = createOpenAI({
        apiKey,
        baseURL: this.baseUrl,
        name: 'zhipu'
      })
      logger.debug('Zhipu 客户端初始化成功')
    } else {
      logger.warn('Zhipu API Key 未配置，翻译服务不可用')
    }
  }

  /**
   * 重新初始化 Zhipu 客户端（用于配置更新后）
   */
  public reinitializeClient(): void {
    this.initializeLLMClient()
  }

  /**
   * 检查翻译服务是否可用
   */
  public isServiceAvailable(): boolean {
    return !!this.client
  }

  /**
   * 构建翻译提示词（统一使用批量格式）
   */
  private buildTranslationPrompt(
    subtitles: Array<{ text: string; index: number }>,
    videoFilename?: string
  ): string {
    const count = subtitles.length

    let prompt = `请将以下${count}条字幕翻译成自然流畅的中文，保持上下文的连贯性和一致性：\n\n`

    // 添加视频文件名作为上下文
    if (videoFilename) {
      prompt += `视频文件：${videoFilename}\n\n`
    }

    prompt += `字幕列表：\n`
    subtitles.forEach((subtitle, index) => {
      prompt += `${index + 1}. ${subtitle.text}\n`
    })

    prompt += `\n请以JSON格式返回翻译结果，格式如下：\n`
    if (count === 1) {
      prompt += `{\n  "translations": [\n    "字幕的中文翻译"\n  ]\n}\n\n`
    } else {
      prompt += `{\n  "translations": [\n    "第1条字幕的中文翻译",\n    "第2条字幕的中文翻译",\n    "第3条字幕的中文翻译"\n  ]\n}\n\n`
    }

    prompt += `要求：\n1. 翻译要准确、自然、符合中文表达习惯\n2. 保留原文的情感色彩和语境\n3. 保持整个序列的翻译风格一致\n4. 如果有专业术语，请使用对应的中文专业词汇\n5. 只返回JSON格式的翻译结果，不要包含其他内容`

    return prompt
  }

  /**
   * 翻译字幕（统一处理单条和批量）
   */
  private async translate(
    subtitles: Array<{ text: string; index: number }>,
    options: TranslationOptions,
    videoFilename?: string,
    retryCount: number = 0
  ): Promise<TranslationResult[]> {
    try {
      if (!this.client) {
        throw new Error('Zhipu 客户端未初始化')
      }

      const prompt = this.buildTranslationPrompt(subtitles, videoFilename)

      logger.debug('开始翻译字幕', {
        count: subtitles.length,
        firstText: subtitles[0]?.text?.substring(0, 50)
      })

      const { text: aiGeneratedText } = await generateText({
        model: this.client.chat(this.model),
        prompt: prompt,
        temperature: 0.3
      })

      const responseText = aiGeneratedText.trim()
      if (!responseText) {
        throw new Error('翻译结果为空')
      }

      // 解析JSON响应
      let translations: string[]
      try {
        const parsed = JSON.parse(responseText)
        translations = parsed.translations || []
      } catch (parseError) {
        logger.warn('JSON解析失败，尝试提取翻译内容', {
          error: parseError instanceof Error ? parseError.message : String(parseError),
          response: responseText.substring(0, 200)
        })

        // 如果JSON解析失败，尝试简单的文本提取
        translations = this.extractTranslationsFromText(responseText, subtitles.length)
      }

      if (translations.length !== subtitles.length) {
        throw new Error(
          `翻译数量不匹配，期望 ${subtitles.length} 条，实际 ${translations.length} 条`
        )
      }

      logger.debug('翻译成功', {
        count: subtitles.length,
        firstOriginal: subtitles[0]?.text?.substring(0, 30),
        firstTranslated: translations[0]?.substring(0, 30)
      })

      // 返回翻译结果
      return subtitles.map((subtitle, index) => ({
        originalText: subtitle.text,
        translatedText: translations[index] || '',
        sourceLanguage: options.sourceLanguage || 'auto',
        targetLanguage: options.targetLanguage,
        success: true
      }))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      const maxRetries = 3
      const retryDelay = 1000 // 1秒基础延迟

      // 判断是否应该重试
      const shouldRetry =
        retryCount < maxRetries &&
        (errorMessage.includes('network') ||
          errorMessage.includes('timeout') ||
          errorMessage.includes('rate limit') ||
          errorMessage.includes('quota') ||
          errorMessage.includes('ECONNRESET') ||
          errorMessage.includes('ETIMEDOUT'))

      if (shouldRetry) {
        const nextRetryCount = retryCount + 1
        const delay = retryDelay * Math.pow(2, retryCount) // 指数退避

        logger.warn(`翻译失败，将在 ${delay}ms 后进行第 ${nextRetryCount} 次重试`, {
          count: subtitles.length,
          error: errorMessage,
          retryCount: nextRetryCount
        })

        // 等待重试延迟
        await new Promise((resolve) => setTimeout(resolve, delay))

        // 递归重试
        return this.translate(subtitles, options, videoFilename, nextRetryCount)
      }

      // 重试次数用完或不可重试的错误，返回失败结果
      logger.error('翻译最终失败', {
        count: subtitles.length,
        error: errorMessage,
        retryCount
      })

      return subtitles.map((subtitle) => ({
        originalText: subtitle.text,
        translatedText: '',
        sourceLanguage: options.sourceLanguage || 'auto',
        targetLanguage: options.targetLanguage,
        success: false,
        error: errorMessage
      }))
    }
  }

  /**
   * 从文本中提取翻译内容（JSON解析失败时的备用方案）
   */
  private extractTranslationsFromText(text: string, expectedCount: number): string[] {
    const translations: string[] = []

    // 尝试按行分割并提取引号内容
    const lines = text.split('\n')
    for (const line of lines) {
      const match = line.match(/"([^"]+)"/)
      if (match && translations.length < expectedCount) {
        translations.push(match[1])
      }
    }

    // 如果提取数量不够，尝试按数字序号分割
    if (translations.length < expectedCount) {
      const numberedLines = text.split(/\d+\.\s*/)
      for (let i = 1; i < numberedLines.length && translations.length < expectedCount; i++) {
        const cleaned = numberedLines[i].trim().replace(/^["']|["']$/g, '')
        if (cleaned) {
          translations.push(cleaned)
        }
      }
    }

    return translations
  }

  /**
   * 批量翻译字幕
   */
  public async translateSubtitles(
    videoId: string | number,
    options: TranslationOptions,
    progressCallback?: TranslationProgressCallback
  ): Promise<TranslationBatchResult> {
    const startTime = Date.now()

    if (!this.client) {
      throw new Error('翻译服务不可用，请检查 Zhipu API Key 配置')
    }

    logger.info('开始批量翻译字幕', { videoId, targetLanguage: options.targetLanguage })

    try {
      // 获取未翻译的字幕
      const subtitles = await db.subtitleLibrary.getSubtitlesByVideoId(videoId as number)
      const untranslatedSubtitles = subtitles.filter((subtitle) => !subtitle.translatedText)

      if (untranslatedSubtitles.length === 0) {
        logger.info('没有需要翻译的字幕')
        return {
          results: [],
          successCount: 0,
          failureCount: 0,
          processingTime: Date.now() - startTime
        }
      }

      logger.info('找到需要翻译的字幕', { count: untranslatedSubtitles.length })

      const batchSize = options.batchSize || 15
      const maxConcurrency = options.maxConcurrency || 2
      const totalBatches = Math.ceil(untranslatedSubtitles.length / batchSize)

      let successCount = 0
      let failureCount = 0
      const allResults: TranslationResult[] = []

      // 分批处理
      for (let i = 0; i < totalBatches; i += maxConcurrency) {
        const batchPromises: Promise<TranslationResult[]>[] = []

        // 创建并发批次
        for (let j = i; j < Math.min(i + maxConcurrency, totalBatches); j++) {
          const batchStart = j * batchSize
          const batchEnd = Math.min(batchStart + batchSize, untranslatedSubtitles.length)
          const batch = untranslatedSubtitles.slice(batchStart, batchEnd)

          const batchPromise = this.processBatch(
            batch,
            options,
            j + 1,
            totalBatches,
            progressCallback
          )

          batchPromises.push(batchPromise)
        }

        // 等待当前批次组完成
        const batchResults = await Promise.all(batchPromises)

        // 合并结果
        for (const results of batchResults) {
          allResults.push(...results)

          // 统计成功/失败数量
          results.forEach((result) => {
            if (result.success) {
              successCount++
            } else {
              failureCount++
            }
          })
        }
      }

      logger.info('字幕翻译完成', {
        total: untranslatedSubtitles.length,
        success: successCount,
        failure: failureCount,
        processingTime: Date.now() - startTime
      })

      return {
        results: allResults,
        successCount,
        failureCount,
        processingTime: Date.now() - startTime
      }
    } catch (error) {
      logger.error('批量翻译失败', {
        videoId,
        error: error instanceof Error ? error.message : String(error)
      })
      throw error
    }
  }

  /**
   * 处理单个批次
   */
  private async processBatch(
    batch: Array<{ id: string; text: string; startTime: number; endTime: number }>,
    options: TranslationOptions,
    batchNumber: number,
    totalBatches: number,
    progressCallback?: TranslationProgressCallback
  ): Promise<TranslationResult[]> {
    logger.debug('处理翻译批次', {
      batchNumber,
      totalBatches,
      batchSize: batch.length
    })

    // 准备字幕数据
    const subtitlesForTranslation = batch.map((subtitle, index) => ({
      text: subtitle.text,
      index
    }))

    // 使用统一的翻译方法
    const translationResults = await this.translate(
      subtitlesForTranslation,
      options,
      options.videoFilename
    )

    const results: TranslationResult[] = []

    // 处理翻译结果并更新数据库
    for (let i = 0; i < batch.length; i++) {
      const subtitle = batch[i]
      const result = translationResults[i]

      results.push(result)

      // 如果翻译成功，立即更新数据库
      if (result.success) {
        try {
          await db.subtitleLibrary.updateSubtitleTranslation(subtitle.id, result.translatedText)
        } catch (error) {
          logger.error('更新字幕翻译失败', {
            subtitleId: subtitle.id,
            error: error instanceof Error ? error.message : String(error)
          })
        }
      }

      // 更新进度
      if (progressCallback) {
        progressCallback({
          currentBatch: batchNumber,
          totalBatches,
          currentBatchProgress: i + 1,
          currentBatchSize: batch.length,
          overallProgress: Math.round(
            (((batchNumber - 1) * (options.batchSize || 15) + i + 1) /
              (totalBatches * (options.batchSize || 15))) *
              100
          )
        })
      }
    }

    return results
  }

  /**
   * 验证 API Key 是否有效
   */
  public async validateApiKey(apiKey: string): Promise<boolean> {
    try {
      const testClient = createOpenAI({
        apiKey,
        baseURL: this.baseUrl,
        name: 'zhipu'
      })

      const { text } = await generateText({
        model: testClient.chat(this.model),
        prompt: '请回复"API Key验证成功"',
        temperature: 0.1
      })

      // 只要请求成功且返回了内容，就认为 API Key 有效
      return !!text && text.trim().length > 0
    } catch (error) {
      logger.error('API Key 验证失败', { error })
      return false
    }
  }
}

export const subtitleTranslationService = new SubtitleTranslationService()
