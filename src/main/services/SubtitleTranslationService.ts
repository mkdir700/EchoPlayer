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

    let sceneContext = ''

    // 添加视频文件名作为上下文
    if (videoFilename) {
      sceneContext += `Video file: ${videoFilename}\n`
    }

    sceneContext += `Subtitle list:\n`
    subtitles.forEach((subtitle, index) => {
      sceneContext += `${index + 1}. ${subtitle.text}\n`
    })

    let prompt = `You are a professional subtitle translator.\n`
    prompt += `Translate the following dialogue into natural Chinese that fits the character's tone,\n`
    prompt += `context, and scene emotion. Keep brevity and timing in mind.\n\n`
    prompt += `Input:\n${sceneContext}`

    prompt += `\nPlease return the translation results in JSON format as follows:\n`
    if (count === 1) {
      prompt += `{\n  "translations": [\n    "Chinese translation of the subtitle"\n  ]\n}\n\n`
    } else {
      prompt += `{\n  "translations": [\n    "Chinese translation of subtitle 1",\n    "Chinese translation of subtitle 2",\n    "Chinese translation of subtitle 3"\n  ]\n}\n\n`
    }

    prompt += `Requirements:\n`
    prompt += `1. Translation should be accurate, natural, and conform to Chinese expression habits\n`
    prompt += `2. Preserve the emotional tone and context of the original text\n`
    prompt += `3. Maintain consistent translation style throughout the sequence\n`
    prompt += `4. Use appropriate Chinese professional terminology for technical terms\n`
    prompt += `5. Only return JSON format translation results, do not include other content`

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
   * 翻译单个字幕
   */
  public async translateSingleSubtitle(
    subtitleId: string,
    text: string,
    options: any
  ): Promise<TranslationResult> {
    if (!this.client) {
      throw new Error('翻译服务不可用，请检查 Zhipu API Key 配置')
    }

    logger.info('开始翻译单个字幕', { subtitleId, text: text.substring(0, 50) })

    try {
      // 获取字幕的上下文信息
      const contextSubtitles = await this.getSubtitleContext(subtitleId, options.videoId)

      // 构建包含上下文的提示词
      const contextualPrompt = this.buildContextualTranslationPrompt(
        text,
        contextSubtitles,
        options.videoFilename
      )

      logger.debug('使用上下文进行翻译', {
        subtitleId,
        contextCount: contextSubtitles.contextSubtitles.length,
        targetIndex: contextSubtitles.contextStartIndex
      })

      // 使用上下文提示词进行翻译
      const translationResults = await this.translateWithContext(text, contextualPrompt, options)

      if (translationResults.length === 0) {
        throw new Error('翻译结果为空')
      }

      const result = translationResults[0]

      // 如果翻译成功，立即更新数据库
      if (result.success) {
        try {
          await db.subtitleLibrary.updateSubtitleTranslation(subtitleId, result.translatedText)
          logger.info('单条字幕翻译并更新数据库成功', { subtitleId })
        } catch (error) {
          logger.error('更新字幕翻译到数据库失败', {
            subtitleId,
            error: error instanceof Error ? error.message : String(error)
          })
          throw new Error(
            `翻译成功但更新数据库失败: ${error instanceof Error ? error.message : String(error)}`
          )
        }
      }

      return result
    } catch (error) {
      logger.error('翻译单个字幕失败', {
        subtitleId,
        error: error instanceof Error ? error.message : String(error)
      })
      throw error
    }
  }

  /**
   * 获取字幕的上下文信息
   */
  private async getSubtitleContext(
    subtitleId: string,
    videoId?: number
  ): Promise<{
    contextSubtitles: Array<{ text: string; index: number }>
    contextStartIndex: number
  }> {
    if (!videoId) {
      return {
        contextSubtitles: [],
        contextStartIndex: 0
      }
    }

    try {
      const allSubtitles = await db.subtitleLibrary.getSubtitlesByVideoId(videoId)
      const targetIndex = allSubtitles.findIndex((sub) => sub.id === subtitleId)

      if (targetIndex === -1) {
        logger.warn('未找到目标字幕', { subtitleId, videoId })
        return {
          contextSubtitles: [],
          contextStartIndex: 0
        }
      }

      // 获取前后各10句字幕作为上下文
      const contextStart = Math.max(0, targetIndex - 10)
      const contextEnd = Math.min(allSubtitles.length - 1, targetIndex + 10)

      const contextSubtitles: Array<{ text: string; index: number }> = []

      for (let i = contextStart; i <= contextEnd; i++) {
        if (i !== targetIndex) {
          contextSubtitles.push({
            text: allSubtitles[i].text,
            index: i
          })
        }
      }

      return {
        contextSubtitles,
        contextStartIndex: targetIndex
      }
    } catch (error) {
      logger.error('获取字幕上下文失败', {
        subtitleId,
        videoId,
        error: error instanceof Error ? error.message : String(error)
      })
      return {
        contextSubtitles: [],
        contextStartIndex: 0
      }
    }
  }

  /**
   * 构建包含上下文的翻译提示词
   */
  private buildContextualTranslationPrompt(
    targetText: string,
    contextInfo: {
      contextSubtitles: Array<{ text: string; index: number }>
      contextStartIndex: number
    },
    videoFilename?: string
  ): string {
    let sceneContext = ''

    // 添加视频文件名作为上下文
    if (videoFilename) {
      sceneContext += `Video file: ${videoFilename}\n`
    }

    // 添加上下文信息
    if (contextInfo.contextSubtitles.length > 0) {
      sceneContext += `Context subtitles (for understanding scene and context):\n`

      const sortedContext = contextInfo.contextSubtitles.sort((a, b) => a.index - b.index)

      sortedContext.forEach((subtitle, idx) => {
        const position = subtitle.index < contextInfo.contextStartIndex ? 'Previous' : 'Following'
        sceneContext += `${position} ${idx + 1}: ${subtitle.text}\n`
      })

      sceneContext += `\n`
    }

    let prompt = `You are a professional subtitle translator.\n`
    prompt += `Translate the following dialogue into natural Chinese that fits the character's tone,\n`
    prompt += `context, and scene emotion. Keep brevity and timing in mind.\n\n`
    prompt += `Input:\n${sceneContext}`
    prompt += `Current line: "${targetText}"\n\n`

    prompt += `Requirements:\n`
    prompt += `1. Translation should be accurate, natural, and conform to Chinese expression habits\n`
    prompt += `2. Combine context understanding to maintain translation coherence and consistency\n`
    prompt += `3. Preserve the emotional tone and context of the original text\n`
    prompt += `4. Use appropriate Chinese professional terminology for technical terms\n`
    prompt += `5. Only return the translation result, do not include other content\n\n`

    prompt += `Output:`

    return prompt
  }

  /**
   * 使用上下文进行翻译
   */
  private async translateWithContext(
    text: string,
    contextualPrompt: string,
    options: any
  ): Promise<TranslationResult[]> {
    try {
      if (!this.client) {
        throw new Error('Zhipu 客户端未初始化')
      }

      logger.debug('开始使用上下文翻译字幕', {
        text: text.substring(0, 50)
      })

      const { text: aiGeneratedText } = await generateText({
        model: this.client.chat(this.model),
        prompt: contextualPrompt,
        temperature: 0.3
      })

      const responseText = aiGeneratedText.trim()
      if (!responseText) {
        throw new Error('翻译结果为空')
      }

      logger.debug('上下文翻译成功', {
        original: text.substring(0, 30),
        translated: responseText.substring(0, 30)
      })

      return [
        {
          originalText: text,
          translatedText: responseText,
          sourceLanguage: options.sourceLanguage || 'auto',
          targetLanguage: options.targetLanguage,
          success: true
        }
      ]
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)

      logger.error('上下文翻译失败', {
        text: text.substring(0, 50),
        error: errorMessage
      })

      return [
        {
          originalText: text,
          sourceLanguage: options.sourceLanguage || 'auto',
          targetLanguage: options.targetLanguage,
          success: false,
          error: errorMessage
        }
      ]
    }
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
