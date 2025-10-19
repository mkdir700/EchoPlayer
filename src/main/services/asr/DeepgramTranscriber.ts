/**
 * Deepgram 转写服务
 * 负责调用 Deepgram API 进行语音转文本
 */

import type { AudioSegment, DeepgramResponse, TranscriptSegment } from '@shared/types'
import * as fs from 'fs'
import { promises as fsPromises } from 'fs'
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

  constructor(concurrency: number = 3) {
    this.queue = new PQueue({ concurrency })
    logger.info('Deepgram 转写器初始化', { concurrency })
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
        if (attempt > 0) {
          // 指数退避
          const delay = Math.pow(2, attempt) * 1000
          logger.debug('重试前等待', { attempt, delay })
          await new Promise((resolve) => setTimeout(resolve, delay))
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

      // 请求错误处理
      req.on('error', (error) => {
        readStream.destroy()
        reject(new Error(`网络错误: ${error.message}`))
      })

      // 设置超时（10分钟，符合 Deepgram 文档的最大处理时间）
      req.setTimeout(10 * 60 * 1000, () => {
        readStream.destroy()
        req.destroy()
        reject(new Error('请求超时（超过10分钟）'))
      })

      // 读取流错误处理
      readStream.on('error', (error) => {
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
      logger.error('音频文件转写失败', {
        audioPath,
        error: error instanceof Error ? error.message : String(error)
      })
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
    this.queue.clear()
    await this.queue.onIdle()
    logger.info('已取消所有待处理的转写任务')
  }
}

export default DeepgramTranscriber
