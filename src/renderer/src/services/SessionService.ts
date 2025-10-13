import { loggerService } from '@logger'
import { IpcChannel } from '@shared/IpcChannel'

const logger = loggerService.withContext('SessionService')

// 监听 Media Server 端口变更事件
if (typeof window !== 'undefined' && window.electron?.ipcRenderer) {
  window.electron.ipcRenderer.on(
    IpcChannel.MediaServer_PortChanged,
    (_event: any, newPort: number | null) => {
      if (newPort === null) {
        logger.info('收到 Media Server 停止通知，清空端口缓存')
      } else {
        logger.info('收到 Media Server 端口变更通知', { newPort })
      }
      SessionService.resetPort()
    }
  )
}

/**
 * 会话创建请求参数
 */
export interface SessionCreateRequest {
  file_path: string
  initial_time?: number
  video_codec?: string
  video_preset?: string
  video_bitrate?: string
  hls_time?: number
  window_duration?: number
}

/**
 * 会话创建响应
 */
export interface SessionCreateResponse {
  success: boolean
  session_id: string
  playlist_url: string
  asset_hash: string
  profile_hash: string
  initial_windows_loaded: number
}

/**
 * 会话信息响应
 */
export interface SessionInfoResponse {
  session_id: string
  file_path: string
  asset_hash: string
  profile_hash: string
  status: string
  created_at: number
  last_access: number
  expires_at: number
  current_time: number
  duration: number
  loaded_windows: number[]
  preloading_windows: number[]
  playlist_url: string
  total_segments: number
  total_duration: number
}

/**
 * 会话跳转请求参数
 */
export interface SessionSeekRequest {
  time_seconds: number
}

/**
 * 会话跳转响应
 */
export interface SessionSeekResponse {
  success: boolean
  old_time: number
  new_time: number
  playlist_updated: boolean
  windows_loaded: number
}

/**
 * 会话时间更新请求参数
 */
export interface SessionUpdateTimeRequest {
  current_time: number
}

/**
 * 会话时间更新响应
 */
export interface SessionUpdateTimeResponse {
  success: boolean
  windows_preloaded: number
}

/**
 * 会话删除响应
 */
export interface SessionDeleteResponse {
  success: boolean
  session_id: string
}

/**
 * 音频进度信息
 */
export interface AudioProgressInfo {
  status: string
  progress_percent: number
  processed_time: number
  total_duration: number
  transcode_speed: number
  eta_seconds: number
  error_message: string | null
}

/**
 * 会话进度响应
 */
export interface SessionProgressResponse {
  session_id: string
  status: string
  progress_percent: number
  progress_stage: string
  error_message: string | null
  is_ready: boolean
  playlist_url: string | null
  audio_progress: AudioProgressInfo | null
}

/**
 * 会话错误类型
 */
export class SessionError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly originalError?: unknown
  ) {
    super(message)
    this.name = 'SessionError'
  }
}

/**
 * 会话服务
 *
 * 与后端会话 API 集成，提供跨窗口连续播放功能
 */
export class SessionService {
  /** 后端 API 端口（动态获取） */
  private static mediaServerPort: number | null = null

  /** 请求超时时间（毫秒） */
  private static readonly REQUEST_TIMEOUT = 30000

  /** 最大重试次数 */
  private static readonly MAX_RETRIES = 3

  /** 初始重试延迟（毫秒） */
  private static readonly INITIAL_RETRY_DELAY = 1000

  /** 活跃的会话请求缓存，用于去重 */
  private static readonly activeRequests = new Map<string, Promise<any>>()

  /**
   * 获取后端 API 基础 URL
   */
  private static async getApiBaseUrl(): Promise<string> {
    // 如果尚未获取端口，先获取一次
    if (this.mediaServerPort === null) {
      try {
        this.mediaServerPort = await window.api.mediaServer.getPort()
        if (this.mediaServerPort === null) {
          throw new Error('Media Server 未运行或端口未分配')
        }
        logger.debug('获取 Media Server 端口', { port: this.mediaServerPort })
      } catch (error) {
        logger.error('获取 Media Server 端口失败', { error })
        throw new SessionError('无法获取 Media Server 端口，请确保服务已启动')
      }
    }

    return `http://127.0.0.1:${this.mediaServerPort}/api/v1/session`
  }

  /**
   * 重置端口缓存（用于 Media Server 重启时）
   */
  public static resetPort(): void {
    logger.debug('重置 Media Server 端口缓存')
    this.mediaServerPort = null
  }

  /**
   * 构建完整的播放列表 URL
   * @param sessionId 会话ID
   * @returns 完整的播放列表 URL
   */
  public static async getPlaylistUrl(sessionId: string): Promise<string> {
    const apiBaseUrl = await this.getApiBaseUrl()
    return `${apiBaseUrl}/${sessionId}/playlist.m3u8`
  }

  /**
   * 生成请求的唯一键，用于去重
   */
  private static generateRequestKey(endpoint: string, params?: any): string {
    const paramsKey = params ? JSON.stringify(params) : ''
    return `${endpoint}:${paramsKey}`
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
    const apiBaseUrl = await this.getApiBaseUrl()
    const url = `${apiBaseUrl}${endpoint}`

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.REQUEST_TIMEOUT)

    try {
      logger.debug('发起会话 API 请求', { url, method: options.method || 'GET' })

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
        logger.error('会话 API 请求失败', {
          url,
          status: response.status,
          statusText: response.statusText,
          error: errorText
        })

        throw new SessionError(
          `会话 API 请求失败: ${response.status} ${response.statusText}`,
          response.status,
          errorText
        )
      }

      const data = await response.json()
      logger.debug('会话 API 请求成功', { url, data })

      return data as T
    } catch (error) {
      clearTimeout(timeoutId)

      if (error instanceof SessionError) {
        throw error
      }

      const errorMessage = error instanceof Error ? error.message : String(error)
      logger.error('会话网络请求失败', { url, error: errorMessage })

      throw new SessionError(`会话网络请求失败: ${errorMessage}`, undefined, error)
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
        if (error instanceof SessionError) {
          if (error.statusCode && error.statusCode >= 400 && error.statusCode < 500) {
            throw error
          }
        }

        if (attempt === maxRetries) {
          logger.error('会话请求重试次数已用完，请求最终失败', {
            endpoint,
            attempts: attempt + 1,
            error: lastError.message
          })
          throw lastError
        }

        // 计算延迟并等待
        const delay = this.calculateRetryDelay(attempt)
        logger.warn('会话请求失败，准备重试', {
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
   * 创建新的播放会话
   *
   * @param request 会话创建请求参数
   * @returns 会话创建响应
   */
  public static async createSession(request: SessionCreateRequest): Promise<SessionCreateResponse> {
    logger.info('开始创建播放会话', { request })

    // 检查是否有相同的请求正在进行（去重）
    const requestKey = this.generateRequestKey('/create', request)

    if (this.activeRequests.has(requestKey)) {
      logger.debug('发现相同的会话创建请求正在进行，复用现有请求', { requestKey })
      return this.activeRequests.get(requestKey)!
    }

    // 创建请求 Promise 并缓存
    const requestPromise = this.makeRequestWithRetry<SessionCreateResponse>('/create', {
      method: 'POST',
      body: JSON.stringify(request)
    })
      .then((response) => {
        logger.info('会话创建成功', {
          sessionId: response.session_id,
          playlistUrl: response.playlist_url,
          initialWindowsLoaded: response.initial_windows_loaded
        })

        return response
      })
      .catch((error) => {
        logger.error('会话创建失败', {
          filePath: request.file_path,
          initialTime: request.initial_time,
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
   * 获取会话播放列表
   *
   * @param sessionId 会话ID
   * @returns 播放列表内容（m3u8格式）
   */
  public static async getSessionPlaylist(sessionId: string): Promise<string> {
    logger.debug('获取会话播放列表', { sessionId })

    try {
      const apiBaseUrl = await this.getApiBaseUrl()
      const response = await fetch(`${apiBaseUrl}/${sessionId}/playlist.m3u8`, {
        headers: {
          Accept: 'application/vnd.apple.mpegurl'
        }
      })

      if (!response.ok) {
        throw new SessionError(
          `获取播放列表失败: ${response.status} ${response.statusText}`,
          response.status
        )
      }

      const playlistContent = await response.text()
      logger.debug('播放列表获取成功', { sessionId, contentLength: playlistContent.length })

      return playlistContent
    } catch (error) {
      logger.error('获取播放列表失败', {
        sessionId,
        error: error instanceof Error ? error.message : String(error)
      })
      throw error
    }
  }

  /**
   * 获取会话信息
   *
   * @param sessionId 会话ID
   * @returns 会话信息
   */
  public static async getSessionInfo(sessionId: string): Promise<SessionInfoResponse> {
    logger.debug('获取会话信息', { sessionId })

    try {
      const response = await this.makeRequest<SessionInfoResponse>(`/${sessionId}/info`)

      logger.debug('会话信息获取成功', { sessionId, response })
      return response
    } catch (error) {
      logger.error('获取会话信息失败', {
        sessionId,
        error: error instanceof Error ? error.message : String(error)
      })
      throw error
    }
  }

  /**
   * 会话内跳转
   *
   * @param sessionId 会话ID
   * @param request 跳转请求参数
   * @returns 跳转响应
   */
  public static async seekSession(
    sessionId: string,
    request: SessionSeekRequest
  ): Promise<SessionSeekResponse> {
    logger.info('开始会话跳转', { sessionId, request })

    try {
      const response = await this.makeRequestWithRetry<SessionSeekResponse>(`/${sessionId}/seek`, {
        method: 'POST',
        body: JSON.stringify(request)
      })

      logger.info('会话跳转成功', {
        sessionId,
        oldTime: response.old_time,
        newTime: response.new_time,
        playlistUpdated: response.playlist_updated,
        windowsLoaded: response.windows_loaded
      })

      return response
    } catch (error) {
      logger.error('会话跳转失败', {
        sessionId,
        timeSeconds: request.time_seconds,
        error: error instanceof Error ? error.message : String(error)
      })
      throw error
    }
  }

  /**
   * 更新会话播放时间
   *
   * @param sessionId 会话ID
   * @param request 时间更新请求参数
   * @returns 时间更新响应
   */
  public static async updateSessionTime(
    sessionId: string,
    request: SessionUpdateTimeRequest
  ): Promise<SessionUpdateTimeResponse> {
    logger.debug('更新会话播放时间', { sessionId, request })

    try {
      const response = await this.makeRequest<SessionUpdateTimeResponse>(
        `/${sessionId}/update-time`,
        {
          method: 'POST',
          body: JSON.stringify(request)
        }
      )

      logger.debug('会话时间更新成功', {
        sessionId,
        currentTime: request.current_time,
        windowsPreloaded: response.windows_preloaded
      })

      return response
    } catch (error) {
      logger.error('会话时间更新失败', {
        sessionId,
        currentTime: request.current_time,
        error: error instanceof Error ? error.message : String(error)
      })
      throw error
    }
  }

  /**
   * 删除会话
   *
   * @param sessionId 会话ID
   * @returns 删除响应
   */
  public static async deleteSession(sessionId: string): Promise<SessionDeleteResponse> {
    logger.info('删除会话', { sessionId })

    try {
      const response = await this.makeRequest<SessionDeleteResponse>(`/${sessionId}`, {
        method: 'DELETE'
      })

      logger.info('会话删除成功', { sessionId })
      return response
    } catch (error) {
      logger.error('会话删除失败', {
        sessionId,
        error: error instanceof Error ? error.message : String(error)
      })
      throw error
    }
  }

  /**
   * 获取会话创建进度
   *
   * @param sessionId 会话ID
   * @returns 会话进度响应
   */
  public static async getSessionProgress(sessionId: string): Promise<SessionProgressResponse> {
    logger.debug('获取会话进度', { sessionId })

    try {
      const response = await this.makeRequest<SessionProgressResponse>(`/${sessionId}/progress`)

      logger.debug('会话进度获取成功', {
        sessionId,
        status: response.status,
        progress: response.progress_percent,
        stage: response.progress_stage,
        isReady: response.is_ready
      })

      return response
    } catch (error) {
      // 如果是 HTTP 425 (Too Early)，这是正常的进行中状态，不记录为错误
      if (error instanceof SessionError && error.statusCode === 425) {
        logger.debug('会话尚未就绪 (HTTP 425)', { sessionId })
        throw error
      }

      logger.error('获取会话进度失败', {
        sessionId,
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
   * 清理所有活跃的请求（用于应用关闭时的清理）
   */
  public static clearActiveRequests(): void {
    logger.debug('清理所有活跃的会话请求', {
      activeCount: this.activeRequests.size
    })
    this.activeRequests.clear()
  }
}

export default SessionService
