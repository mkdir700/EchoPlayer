/**
 * Deepgram 转写服务
 * 负责调用 Deepgram API 进行语音转文本
 */

import type { AudioSegment, DeepgramResponse, TranscriptSegment } from '@shared/types'
import * as fs from 'fs'
import { promises as fsPromises } from 'fs'
import type { ClientRequest } from 'http'
import https from 'https'
import PQueue from 'p-queue'
import * as path from 'path'

import { loggerService } from '../LoggerService'

const logger = loggerService.withContext('DeepgramTranscriber')

export interface DeepgramOptions {
  /** API Key */
  apiKey: string
  /** 模型选择 */
  model?: 'nova-2' | 'nova-3'
  /** 语言 */
  language?: string
  /** 是否启用智能格式化 */
  smartFormat?: boolean
  /** 是否启用句段检测 */
  utterances?: boolean
  /** 句段结束静音时长（毫秒） */
  utteranceEndMs?: number
  /** 提示文本（前文上下文） */
  prompt?: string
}

export interface TranscriptionProgress {
  /** 已完成的段数 */
  completed: number
  /** 总段数 */
  total: number
  /** 当前段索引 */
  current: number
}

class DeepgramTranscriber {
  private queue: PQueue
  private activeRequests: Set<ClientRequest> = new Set()
  private abortController: AbortController = new AbortController()
  private currentRequestAbortController: AbortController | null = null

  constructor(concurrency: number = 3) {
    this.queue = new PQueue({ concurrency })
    logger.info('Deepgram 转写器初始化', { concurrency })
  }

  /**
   * 重置取消状态（用于开始新的转写任务）
   */
  private resetCancellationState(): void {
    if (this.abortController.signal.aborted) {
      this.abortController = new AbortController()
    }
    this.currentRequestAbortController = null
  }

  /**
   * 批量转写多个音频段
   */
  public async transcribeSegments(
    segments: AudioSegment[],
    options: DeepgramOptions,
    onProgress?: (progress: TranscriptionProgress) => void
  ): Promise<TranscriptSegment[]> {
    logger.info('开始批量转写', { segmentCount: segments.length })

    // 重置取消状态，准备新的转写任务
    this.resetCancellationState()

    const results: TranscriptSegment[] = []
    let completed = 0

    // 上一段的末尾文本（用作提示）
    let previousTranscript = ''

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i]

      // 添加到队列
      const promise = this.queue.add(async () => {
        try {
          // 携带上一段末尾文本作为提示
          const promptText =
            previousTranscript.length > 200 ? previousTranscript.slice(-200) : previousTranscript

          const response = await this.transcribeSingleSegment(segment.filePath, {
            ...options,
            prompt: promptText
          })

          completed++
          onProgress?.({ completed, total: segments.length, current: i })

          // 更新上一段文本
          if (response.results.channels[0]?.alternatives[0]?.transcript) {
            const fullTranscript = response.results.channels[0].alternatives[0].transcript
            previousTranscript = fullTranscript
          }

          return {
            audioSegment: segment,
            response,
            success: true
          } as TranscriptSegment
        } catch (error) {
          completed++
          onProgress?.({ completed, total: segments.length, current: i })

          logger.error('段转写失败', {
            index: segment.index,
            error: error instanceof Error ? error.message : String(error)
          })

          return {
            audioSegment: segment,
            success: false,
            error: error instanceof Error ? error.message : String(error)
          } as TranscriptSegment
        }
      })

      if (promise) {
        results.push((await promise) as TranscriptSegment)
      }
    }

    // 等待所有任务完成
    await this.queue.onIdle()

    const successCount = results.filter((r) => r.success).length
    logger.info('批量转写完成', {
      total: results.length,
      success: successCount,
      failed: results.length - successCount
    })

    return results
  }

  /**
   * 转写单个音频段
   */
  private async transcribeSingleSegment(
    audioPath: string,
    options: DeepgramOptions,
    retries: number = 3
  ): Promise<DeepgramResponse> {
    const {
      apiKey,
      model = 'nova-3',
      language = 'en',
      smartFormat = true,
      utterances = true,
      utteranceEndMs = 1000,
      prompt
    } = options

    let lastError: Error | null = null

    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        // 在重试前检查是否被取消
        if (this.abortController.signal.aborted) {
          logger.debug('检测到请求被取消，停止重试')
          throw new Error('REQUEST_CANCELLED')
        }

        if (attempt > 0) {
          // 指数退避
          const delay = Math.pow(2, attempt) * 1000
          logger.debug('重试前等待', { attempt, delay })
          await new Promise((resolve) => setTimeout(resolve, delay))

          // 等待后再次检查取消状态
          if (this.abortController.signal.aborted) {
            logger.debug('等待期间检测到取消，停止重试')
            throw new Error('REQUEST_CANCELLED')
          }
        }

        logger.debug('调用 Deepgram API', { audioPath, model, language, attempt })

        const response = await this.callDeepgramAPI(audioPath, {
          apiKey,
          model,
          language,
          smartFormat,
          utterances,
          utteranceEndMs,
          prompt
        })

        logger.debug('Deepgram API 调用成功', { audioPath })
        return response
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))

        // 如果是请求取消错误，直接抛出，不重试
        if (
          lastError.message === 'REQUEST_CANCELLED' ||
          lastError.message.includes('socket hang up') ||
          lastError.message.includes('请求被中断') ||
          lastError.message.includes('socket was destroyed')
        ) {
          logger.info('用户取消了 ASR 任务，停止处理', { error: lastError.message })
          throw new Error('REQUEST_CANCELLED')
        }

        logger.warn('Deepgram API 调用失败', {
          attempt: attempt + 1,
          maxRetries: retries,
          error: lastError.message
        })
      }
    }

    throw lastError || new Error('Deepgram API 调用失败')
  }

  /**
   * 调用 Deepgram API
   */
  private async callDeepgramAPI(
    audioPath: string,
    options: DeepgramOptions
  ): Promise<DeepgramResponse> {
    // 构建查询参数
    const queryParams = new URLSearchParams({
      model: options.model || 'nova-3',
      smart_format: String(options.smartFormat !== false),
      punctuate: 'true',
      utterances: String(options.utterances !== false),
      utterance_end_ms: String(options.utteranceEndMs || 1000)
    })

    // 处理语言参数：如果是 'auto'，使用 detect_language；否则使用 language
    if (options.language === 'auto') {
      queryParams.append('detect_language', 'true')
    } else if (options.language) {
      queryParams.append('language', options.language)
    }

    const url = `https://api.deepgram.com/v1/listen?${queryParams.toString()}`

    // 获取音频文件的 MIME 类型
    const ext = path.extname(audioPath).toLowerCase()
    const mimeTypes: Record<string, string> = {
      '.wav': 'audio/wav',
      '.mp3': 'audio/mpeg',
      '.m4a': 'audio/mp4',
      '.flac': 'audio/flac',
      '.ogg': 'audio/ogg',
      '.opus': 'audio/opus',
      '.webm': 'audio/webm'
    }
    const contentType = mimeTypes[ext] || 'audio/wav'

    // 获取文件大小（用于 Content-Length）
    const stats = await fsPromises.stat(audioPath)
    const fileSize = stats.size

    // 创建读取流
    const readStream = fs.createReadStream(audioPath)

    return new Promise<DeepgramResponse>((resolve, reject) => {
      // 发送请求
      const req = https.request(
        url,
        {
          method: 'POST',
          headers: {
            'Content-Type': contentType,
            'Content-Length': fileSize,
            Authorization: `Token ${options.apiKey}`
          }
        },
        (res) => {
          let responseData = ''

          res.on('data', (chunk) => {
            responseData += chunk.toString()
          })

          res.on('end', () => {
            // 请求完成后从活动请求列表中移除
            this.activeRequests.delete(req)

            if (res.statusCode === 200) {
              try {
                const parsed = JSON.parse(responseData) as DeepgramResponse
                resolve(parsed)
              } catch (error) {
                reject(new Error(`解析 Deepgram 响应失败: ${error}`))
              }
            } else if (res.statusCode === 401) {
              reject(new Error('API Key 无效'))
            } else if (res.statusCode === 402) {
              reject(new Error('API 配额不足'))
            } else if (res.statusCode === 429) {
              reject(new Error('API 调用频率超限'))
            } else {
              reject(new Error(`Deepgram API 错误 (${res.statusCode}): ${responseData}`))
            }
          })
        }
      )

      // 将请求添加到活动请求列表
      this.activeRequests.add(req)

      // 请求错误处理
      req.on('error', (error) => {
        this.activeRequests.delete(req)
        readStream.destroy()
        reject(new Error(`网络错误: ${error.message}`))
      })

      // 设置超时（10分钟，符合 Deepgram 文档的最大处理时间）
      req.setTimeout(10 * 60 * 1000, () => {
        this.activeRequests.delete(req)
        readStream.destroy()
        req.destroy()
        reject(new Error('请求超时（超过10分钟）'))
      })

      // 读取流错误处理
      readStream.on('error', (error) => {
        this.activeRequests.delete(req)
        req.destroy()
        reject(new Error(`读取音频文件失败: ${error.message}`))
      })

      // 将读取流管道连接到请求
      readStream.pipe(req)
    })
  }

  /**
   * 转写完整音频文件
   */
  public async transcribeFile(
    audioPath: string,
    options: DeepgramOptions
  ): Promise<DeepgramResponse> {
    logger.info('开始转写完整音频文件', { audioPath })

    try {
      const response = await this.transcribeSingleSegment(audioPath, options)
      logger.info('音频文件转写成功', { audioPath })
      return response
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)

      // 如果是用户取消，使用 info 级别日志
      if (errorMessage === 'REQUEST_CANCELLED') {
        logger.info('用户取消了音频文件转写', { audioPath })
      } else {
        logger.error('音频文件转写失败', {
          audioPath,
          error: errorMessage
        })
      }

      throw error
    }
  }

  /**
   * 验证 API Key
   */
  public async validateApiKey(apiKey: string): Promise<{ valid: boolean; error?: string }> {
    try {
      logger.info('验证 Deepgram API Key')

      if (!apiKey || apiKey.length < 10) {
        return { valid: false, error: 'API Key 格式无效' }
      }

      // 调用 Deepgram 官方验证端点
      const result = await this.makeValidationRequest(apiKey)
      return result
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'API Key 验证失败'
      }
    }
  }

  /**
   * 发送验证请求到 Deepgram API
   */
  private makeValidationRequest(apiKey: string): Promise<{ valid: boolean; error?: string }> {
    return new Promise((resolve) => {
      const requestOptions = {
        hostname: 'api.deepgram.com',
        port: 443,
        path: '/v1/auth/token',
        method: 'GET',
        headers: {
          Authorization: `Token ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 8000 // 8秒超时
      }

      const req = https.request(requestOptions, (res) => {
        let responseBody = ''

        res.on('data', (chunk) => {
          responseBody += chunk
        })

        res.on('end', () => {
          // 根据状态码返回相应结果
          if (res.statusCode === 200) {
            logger.info('API Key 验证成功')
            resolve({ valid: true })
          } else if (res.statusCode === 401) {
            try {
              const errorData = JSON.parse(responseBody)
              const errorCode = errorData.err_code || 'UNKNOWN'

              if (errorCode === 'INVALID_AUTH') {
                resolve({ valid: false, error: 'API Key 无效' })
              } else if (errorCode === 'INSUFFICIENT_PERMISSIONS') {
                resolve({ valid: false, error: 'API Key 权限不足' })
              } else {
                resolve({ valid: false, error: 'API Key 认证失败' })
              }
            } catch {
              resolve({ valid: false, error: 'API Key 认证失败' })
            }
          } else if (res.statusCode === 403) {
            resolve({ valid: false, error: 'API Key 权限不足或访问被拒绝' })
          } else {
            logger.warn('API Key 验证收到意外状态码', {
              statusCode: res.statusCode,
              body: responseBody
            })
            resolve({
              valid: false,
              error: `验证失败 (HTTP ${res.statusCode})`
            })
          }
        })
      })

      req.on('error', (error) => {
        logger.error('API Key 验证请求失败', { error: error.message })
        resolve({
          valid: false,
          error: '网络连接失败，请检查网络设置'
        })
      })

      req.on('timeout', () => {
        req.destroy()
        logger.error('API Key 验证请求超时')
        resolve({
          valid: false,
          error: '验证请求超时，请稍后重试'
        })
      })

      req.end()
    })
  }

  /**
   * 取消所有待处理的任务
   */
  public async cancelAll(): Promise<void> {
    // 设置取消标志
    this.abortController.abort()

    // 如果有当前请求的控制器，也取消它
    if (this.currentRequestAbortController) {
      this.currentRequestAbortController.abort()
    }

    // 清空队列，防止新任务开始
    this.queue.clear()

    // 中断所有正在进行的 HTTP 请求
    const requestCount = this.activeRequests.size
    for (const req of this.activeRequests) {
      try {
        req.destroy()
      } catch (error) {
        logger.warn('中断请求失败', {
          error: error instanceof Error ? error.message : String(error)
        })
      }
    }
    this.activeRequests.clear()

    // 等待队列空闲
    await this.queue.onIdle()

    logger.info('已取消所有转写任务', {
      cancelledRequests: requestCount,
      queuedTasks: this.queue.size
    })
  }
}

export default DeepgramTranscriber
