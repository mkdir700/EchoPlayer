import { loggerService } from '@logger'

import { TranscodeCacheManager } from './TranscodeCacheManager'

const logger = loggerService.withContext('TranscodeService')

/**
 * 转码请求参数
 */
export interface TranscodeRequest {
  /** 视频文件路径 */
  filePath: string
  /** 目标时间点（秒） */
  timeSeconds: number
  /** 可选的转码配置 */
  options?: {
    videoCodec?: string
    videoPreset?: string
    videoBitrate?: string
    hlsTime?: number
    windowDuration?: number
  }
}

/**
 * 转码响应结果
 */
export interface TranscodeResult {
  /** 是否成功 */
  success: boolean
  /** HLS 播放列表 URL */
  playlistUrl: string
  /** 窗口ID */
  windowId: number
  /** 资产哈希 */
  assetHash: string
  /** 配置哈希 */
  profileHash: string
  /** 是否命中缓存 */
  cached: boolean
  /** 转码耗时（秒，缓存命中时为 null） */
  transcodeTime: number | null
}

/**
 * 窗口状态信息
 */
export interface WindowStatus {
  /** 窗口ID */
  windowId: number
  /** 资产哈希 */
  assetHash: string
  /** 配置哈希 */
  profileHash: string
  /** 状态 */
  status: string
  /** 创建时间 */
  createdAt: number
  /** 处理时长 */
  durationSeconds: number
  /** 是否已缓存 */
  cached: boolean
  /** 文件大小 */
  fileSizeBytes: number
  /** 播放列表 URL */
  playlistUrl: string | null
}

/**
 * 转码错误类型
 */
export class TranscodeError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly originalError?: unknown
  ) {
    super(message)
    this.name = 'TranscodeError'
  }
}

/**
 * 转码服务 API 客户端
 *
 * 封装与后端 FastAPI 转码服务的通信，提供：
 * - 转码请求和状态查询
 * - 指数退避重试机制
 * - 并发请求管理和去重
 * - 完整的错误处理和日志记录
 */
export class TranscodeService {
  /** 后端 API 基础 URL */
  private static readonly API_BASE_URL = 'http://localhost:8799/api/v1/jit'

  /** 最大重试次数 */
  private static readonly MAX_RETRIES = 3

  /** 初始重试延迟（毫秒） */
  private static readonly INITIAL_RETRY_DELAY = 1000

  /** 请求超时时间（毫秒） */
  private static readonly REQUEST_TIMEOUT = 30000

  /** 正在进行的请求缓存，用于去重 */
  private static readonly activeRequests = new Map<string, Promise<TranscodeResult>>()

  /**
   * 生成请求的唯一键，用于去重
   */
  private static generateRequestKey(request: TranscodeRequest): string {
    const { filePath, timeSeconds, options = {} } = request
    const optionsKey = JSON.stringify(options)
    return `${filePath}:${timeSeconds}:${optionsKey}`
  }

  /**
   * 指数退避延迟
   */
  private static async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  /**
   * 计算重试延迟时间
   */
  private static calculateRetryDelay(attempt: number): number {
    return this.INITIAL_RETRY_DELAY * Math.pow(2, attempt) + Math.random() * 1000
  }

  /**
   * 发起 HTTP 请求的基础方法
   */
  private static async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.API_BASE_URL}${endpoint}`

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.REQUEST_TIMEOUT)

    try {
      logger.debug('发起 API 请求', { url, method: options.method || 'GET' })

      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text()
        logger.error('API 请求失败', {
          url,
          status: response.status,
          statusText: response.statusText,
          error: errorText
        })

        throw new TranscodeError(
          `API 请求失败: ${response.status} ${response.statusText}`,
          response.status,
          errorText
        )
      }

      const data = await response.json()
      logger.debug('API 请求成功', { url, data })

      return data as T
    } catch (error) {
      clearTimeout(timeoutId)

      if (error instanceof TranscodeError) {
        throw error
      }

      const errorMessage = error instanceof Error ? error.message : String(error)
      logger.error('网络请求失败', { url, error: errorMessage })

      throw new TranscodeError(`网络请求失败: ${errorMessage}`, undefined, error)
    }
  }

  /**
   * 带重试的 API 请求
   */
  private static async makeRequestWithRetry<T>(
    endpoint: string,
    options: RequestInit = {},
    maxRetries: number = this.MAX_RETRIES
  ): Promise<T> {
    let lastError: Error

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await this.makeRequest<T>(endpoint, options)
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))

        // 如果是客户端错误（4xx）或最后一次尝试，直接抛出错误
        if (error instanceof TranscodeError) {
          if (error.statusCode && error.statusCode >= 400 && error.statusCode < 500) {
            throw error
          }
        }

        if (attempt === maxRetries) {
          logger.error('重试次数已用完，请求最终失败', {
            endpoint,
            attempts: attempt + 1,
            error: lastError.message
          })
          throw lastError
        }

        // 计算延迟并等待
        const delay = this.calculateRetryDelay(attempt)
        logger.warn('请求失败，准备重试', {
          endpoint,
          attempt: attempt + 1,
          maxRetries: maxRetries + 1,
          delayMs: delay,
          error: lastError.message
        })

        await this.delay(delay)
      }
    }

    throw lastError!
  }

  /**
   * 请求转码
   *
   * @param request 转码请求参数
   * @returns 转码结果 Promise
   */
  public static async requestTranscode(request: TranscodeRequest): Promise<TranscodeResult> {
    logger.info('开始转码请求', { request })

    // 检查本地缓存
    const cacheManager = TranscodeCacheManager.getInstance()
    const cachedResult = await cacheManager.get(request.filePath, request.timeSeconds)

    if (cachedResult) {
      logger.info('命中本地转码缓存', {
        filePath: request.filePath,
        timeSeconds: request.timeSeconds,
        accessCount: cachedResult.accessCount
      })

      return {
        ...cachedResult.transcodeResult,
        success: true
      }
    }

    // 检查是否有相同的请求正在进行（去重）
    const requestKey = this.generateRequestKey(request)

    if (this.activeRequests.has(requestKey)) {
      logger.debug('发现相同的转码请求正在进行，复用现有请求', { requestKey })
      return this.activeRequests.get(requestKey)!
    }

    // 构建请求体
    const requestBody = {
      file_path: request.filePath,
      time_seconds: request.timeSeconds,
      ...request.options
    }

    // 创建请求 Promise 并缓存
    const requestPromise = this.makeRequestWithRetry<any>('/transcode', {
      method: 'POST',
      body: JSON.stringify(requestBody)
    })
      .then((response) => {
        // 转换响应格式以匹配接口
        const result: TranscodeResult = {
          success: response.success,
          playlistUrl: response.playlist_url,
          windowId: response.window_id,
          assetHash: response.asset_hash,
          profileHash: response.profile_hash,
          cached: response.cached,
          transcodeTime: response.transcode_time
        }

        logger.info('转码请求成功完成', {
          filePath: request.filePath,
          timeSeconds: request.timeSeconds,
          cached: result.cached,
          transcodeTime: result.transcodeTime
        })

        // 保存到本地缓存（异步，不阻塞返回）
        cacheManager
          .set(request.filePath, request.timeSeconds, {
            playlistUrl: result.playlistUrl,
            windowId: result.windowId,
            assetHash: result.assetHash,
            profileHash: result.profileHash,
            cached: result.cached,
            transcodeTime: result.transcodeTime
          })
          .then(() => {
            logger.debug('转码结果已保存到本地缓存', { filePath: request.filePath })
          })
          .catch((cacheError) => {
            logger.warn('保存转码结果到缓存失败', {
              filePath: request.filePath,
              error: cacheError
            })
            // 缓存失败不影响转码结果返回
          })

        return result
      })
      .catch((error) => {
        logger.error('转码请求失败', {
          filePath: request.filePath,
          timeSeconds: request.timeSeconds,
          error: error instanceof Error ? error.message : String(error)
        })
        throw error
      })
      .finally(() => {
        // 请求完成后清理缓存
        this.activeRequests.delete(requestKey)
      })

    this.activeRequests.set(requestKey, requestPromise)
    return requestPromise
  }

  /**
   * 查询窗口状态
   *
   * @param assetHash 资产哈希
   * @param profileHash 配置哈希
   * @param windowId 窗口ID
   * @returns 窗口状态信息
   */
  public static async getWindowStatus(
    assetHash: string,
    profileHash: string,
    windowId: number
  ): Promise<WindowStatus> {
    logger.debug('查询窗口状态', { assetHash, profileHash, windowId })

    const windowIdPadded = windowId.toString().padStart(6, '0')
    const endpoint = `/window/${assetHash}/${profileHash}/${windowIdPadded}/status`

    try {
      const response = await this.makeRequest<any>(endpoint)

      const status: WindowStatus = {
        windowId: response.window_id,
        assetHash: response.asset_hash,
        profileHash: response.profile_hash,
        status: response.status,
        createdAt: response.created_at,
        durationSeconds: response.duration_seconds,
        cached: response.cached,
        fileSizeBytes: response.file_size_bytes,
        playlistUrl: response.playlist_url
      }

      logger.debug('窗口状态查询成功', { status })
      return status
    } catch (error) {
      logger.error('窗口状态查询失败', {
        assetHash,
        profileHash,
        windowId,
        error: error instanceof Error ? error.message : String(error)
      })
      throw error
    }
  }

  /**
   * 获取缓存统计信息
   *
   * @returns 缓存统计
   */
  public static async getCacheStats(): Promise<any> {
    logger.debug('获取缓存统计信息')

    try {
      const stats = await this.makeRequest<any>('/cache/stats')
      logger.debug('缓存统计获取成功', { stats })
      return stats
    } catch (error) {
      logger.error('获取缓存统计失败', {
        error: error instanceof Error ? error.message : String(error)
      })
      throw error
    }
  }

  /**
   * 清理缓存
   *
   * @param strategy 清理策略
   * @param options 清理选项
   * @returns 清理结果
   */
  public static async cleanupCache(
    strategy: 'lru' | 'age' | 'pattern',
    options: {
      maxAgeHours?: number
      assetHash?: string
    } = {}
  ): Promise<any> {
    logger.info('开始缓存清理', { strategy, options })

    const requestBody = {
      strategy,
      ...options
    }

    try {
      const result = await this.makeRequest<any>('/cache/cleanup', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      })

      logger.info('缓存清理完成', { result })
      return result
    } catch (error) {
      logger.error('缓存清理失败', {
        strategy,
        options,
        error: error instanceof Error ? error.message : String(error)
      })
      throw error
    }
  }

  /**
   * 获取当前活跃的请求数量（用于监控）
   */
  public static getActiveRequestCount(): number {
    return this.activeRequests.size
  }

  /**
   * 获取本地缓存统计信息
   */
  public static getLocalCacheStats() {
    const cacheManager = TranscodeCacheManager.getInstance()
    return cacheManager.getStats()
  }

  /**
   * 清理本地缓存
   */
  public static clearLocalCache(): void {
    const cacheManager = TranscodeCacheManager.getInstance()
    cacheManager.clear()
    logger.info('本地转码缓存已清理')
  }

  /**
   * 更新缓存配置
   */
  public static updateCacheConfig(config: {
    maxEntries?: number
    ttl?: number
    cleanupInterval?: number
  }): void {
    const cacheManager = TranscodeCacheManager.getInstance()
    cacheManager.updateConfig(config)
    logger.info('转码缓存配置已更新', { config })
  }

  /**
   * 清理所有活跃的请求（用于应用关闭时的清理）
   */
  public static clearActiveRequests(): void {
    logger.debug('清理所有活跃的转码请求', {
      activeCount: this.activeRequests.size
    })
    this.activeRequests.clear()
  }
}

export default TranscodeService
