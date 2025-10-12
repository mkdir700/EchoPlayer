import { IpcChannel } from '@shared/IpcChannel'
import { ChildProcess, spawn } from 'child_process'
import { app, BrowserWindow } from 'electron'
import { createServer } from 'net'
import * as path from 'path'

import { getDataPath } from '../utils'
import { FFmpegDownloadService } from './FFmpegDownloadService'
import FFmpegService from './FFmpegService'
import { loggerService } from './LoggerService'
import { pythonVenvService } from './PythonVenvService'
import { uvBootstrapperService } from './UvBootstrapperService'

const logger = loggerService.withContext('MediaServerService')

/**
 * Media Server 状态
 */
export type MediaServerStatus =
  | 'stopped' // 已停止
  | 'starting' // 正在启动
  | 'running' // 运行中
  | 'stopping' // 正在停止
  | 'error' // 错误

/**
 * Media Server 信息
 */
export interface MediaServerInfo {
  status: MediaServerStatus
  pid?: number
  port?: number
  startTime?: number
  uptime?: number
  error?: string
}

/**
 * Media Server 配置
 */
export interface MediaServerConfig {
  // 基础配置
  port?: number
  host?: string
  logLevel?: 'debug' | 'info' | 'warning' | 'error'
  debug?: boolean

  // 路径配置
  sessionsRoot?: string
  hlsSegmentCacheRoot?: string // HLS 分片缓存根目录
  audioCacheRoot?: string

  // HLS 配置
  hlsTime?: number // HLS 分片时长（秒）
  hlsListSize?: number // HLS 播放列表大小
  gopSeconds?: number // GOP 时长（秒）

  // 并发控制
  maxConcurrent?: number // 最大并发转码数
  sessionTtl?: number // 会话 TTL（秒）

  // FFmpeg 配置
  ffmpegPath?: string
  ffprobePath?: string
  preferHw?: boolean // 优先使用硬件加速

  // 性能配置
  seekBuffer?: number // seek 前置缓冲时间
  sessionReuseTolerance?: number // 会话复用容差时间
  cleanupInterval?: number // 清理检查间隔

  // 混合转码配置
  enableHybridMode?: boolean // 启用混合转码模式
  audioPreprocessorConcurrent?: number // 音频预处理器并发数
  audioTrackTtlHours?: number // 音频轨道 TTL（小时）
}

/**
 * Media Server 管理服务
 * 负责启动、停止和监控 Media Server 进程
 */
export class MediaServerService {
  private process: ChildProcess | null = null
  private status: MediaServerStatus = 'stopped'
  private startTime: number | null = null
  private port: number | null = null // 当前使用的端口，启动时动态分配
  private lastError: string | null = null
  private healthCheckInterval: NodeJS.Timeout | null = null
  private restartAttempts = 0
  private readonly MAX_RESTART_ATTEMPTS = 3
  private readonly MIN_PORT = 8765 // 端口范围最小值
  private readonly MAX_PORT = 8865 // 端口范围最大值
  private readonly ffmpegService: FFmpegService
  private readonly ffmpegDownloadService: FFmpegDownloadService

  constructor() {
    this.ffmpegService = new FFmpegService()
    this.ffmpegDownloadService = new FFmpegDownloadService()
    logger.info('MediaServerService 初始化完成')

    // 监听应用退出事件
    app.on('before-quit', async () => {
      await this.stop()
    })
  }

  /**
   * 构建 Python 程序的环境变量
   * @param config MediaServer 配置
   * @param port 端口号
   * @returns 包含所有配置的环境变量对象
   */
  private buildPythonEnv(config?: MediaServerConfig, port?: number): NodeJS.ProcessEnv {
    const env: NodeJS.ProcessEnv = {
      ...process.env,
      PYTHONUNBUFFERED: '1' // 禁用 Python 输出缓冲
    }

    // 基础配置
    if (config?.host) env.HOST = config.host
    if (port) env.PORT = port.toString()
    if (config?.debug !== undefined) env.DEBUG = config.debug.toString()

    // 路径配置
    if (config?.sessionsRoot) env.SESSIONS_ROOT = config.sessionsRoot
    if (config?.hlsSegmentCacheRoot) env.HLS_SEGMENT_CACHE_ROOT = config.hlsSegmentCacheRoot
    if (config?.audioCacheRoot) env.AUDIO_CACHE_ROOT = config.audioCacheRoot

    // HLS 配置
    if (config?.hlsTime) env.HLS_TIME = config.hlsTime.toString()
    if (config?.hlsListSize) env.HLS_LIST_SIZE = config.hlsListSize.toString()
    if (config?.gopSeconds) env.GOP_SECONDS = config.gopSeconds.toString()

    // 并发控制
    if (config?.maxConcurrent) env.MAX_CONCURRENT = config.maxConcurrent.toString()
    if (config?.sessionTtl) env.SESSION_TTL = config.sessionTtl.toString()

    // FFmpeg 配置
    if (config?.ffmpegPath) env.FFMPEG_PATH = config.ffmpegPath
    if (config?.ffprobePath) env.FFPROBE_PATH = config.ffprobePath
    if (config?.preferHw !== undefined) env.PREFER_HW = config.preferHw.toString()

    // 性能配置
    if (config?.seekBuffer) env.SEEK_BUFFER = config.seekBuffer.toString()
    if (config?.sessionReuseTolerance) {
      env.SESSION_REUSE_TOLERANCE = config.sessionReuseTolerance.toString()
    }
    if (config?.cleanupInterval) env.CLEANUP_INTERVAL = config.cleanupInterval.toString()

    // 混合转码配置
    if (config?.enableHybridMode !== undefined) {
      env.ENABLE_HYBRID_MODE = config.enableHybridMode.toString()
    }
    if (config?.audioPreprocessorConcurrent) {
      env.AUDIO_PREPROCESSOR_CONCURRENT = config.audioPreprocessorConcurrent.toString()
    }
    if (config?.audioTrackTtlHours) {
      env.AUDIO_TRACK_TTL_HOURS = config.audioTrackTtlHours.toString()
    }

    return env
  }

  /**
   * 查找可用端口
   * @param preferredPort 优先使用的端口
   * @returns 可用的端口号
   */
  private async findAvailablePort(preferredPort?: number): Promise<number> {
    // 如果指定了优先端口，先尝试该端口
    if (preferredPort && (await this.isPortAvailable(preferredPort))) {
      return preferredPort
    }

    // 随机选择起始端口，避免总是从同一个端口开始
    const startPort = Math.floor(Math.random() * (this.MAX_PORT - this.MIN_PORT)) + this.MIN_PORT

    // 从随机起始位置开始查找
    for (let i = 0; i < this.MAX_PORT - this.MIN_PORT; i++) {
      const port =
        this.MIN_PORT + ((startPort - this.MIN_PORT + i) % (this.MAX_PORT - this.MIN_PORT))
      if (await this.isPortAvailable(port)) {
        return port
      }
    }

    throw new Error(`无法在端口范围 ${this.MIN_PORT}-${this.MAX_PORT} 内找到可用端口`)
  }

  /**
   * 检查端口是否可用
   */
  private isPortAvailable(port: number): Promise<boolean> {
    return new Promise((resolve) => {
      const server = createServer()

      server.once('error', (err: NodeJS.ErrnoException) => {
        if (err.code === 'EADDRINUSE') {
          resolve(false)
        } else {
          resolve(false)
        }
      })

      server.once('listening', () => {
        server.close()
        resolve(true)
      })

      server.listen(port, '127.0.0.1')
    })
  }

  /**
   * 启动 Media Server
   */
  public async start(config?: MediaServerConfig): Promise<boolean> {
    try {
      // 检查是否已在运行
      if (this.status === 'running' || this.status === 'starting') {
        logger.warn('Media Server 已在运行或正在启动')
        return false
      }

      this.status = 'starting'
      this.lastError = null

      // 构建默认缓存路径
      const dataPath = getDataPath()
      const mediaServerCachePath = path.join(dataPath, 'MediaServerCache')

      // 合并默认配置
      const finalConfig: MediaServerConfig = {
        host: '127.0.0.1',
        logLevel: 'info',
        debug: false,
        sessionsRoot: path.join(mediaServerCachePath, 'sessions'),
        hlsSegmentCacheRoot: path.join(mediaServerCachePath, 'hls-segments'),
        audioCacheRoot: path.join(mediaServerCachePath, 'audio-cache'),
        ...config
      }

      // 如果用户没有指定 ffmpegPath，则自动获取
      if (!finalConfig.ffmpegPath) {
        const ffmpegPath = this.ffmpegService.getFFmpegPath()
        const ffmpegInfo = this.ffmpegService.getFFmpegInfo()

        logger.info('自动获取 FFmpeg 路径', {
          path: ffmpegPath,
          isBundled: ffmpegInfo.isBundled,
          isDownloaded: ffmpegInfo.isDownloaded,
          isSystemFFmpeg: ffmpegInfo.isSystemFFmpeg,
          version: ffmpegInfo.version
        })

        finalConfig.ffmpegPath = ffmpegPath
      }

      if (!finalConfig.ffprobePath) {
        const ffprobePath = this.ffmpegDownloadService.getFFprobePath()
        logger.info('自动获取 FFprobe 路径', { ffprobePath })
        finalConfig.ffprobePath = ffprobePath
      }

      logger.info('开始启动 Media Server', { config: finalConfig })

      // 1. 检查 UV 是否可用
      const uvInfo = await uvBootstrapperService.checkUvInstallation()
      if (!uvInfo.exists) {
        throw new Error('UV 不可用，请先安装 UV')
      }

      // 2. 检查 Python 环境
      const venvInfo = await pythonVenvService.checkVenvInfo()
      if (!venvInfo.exists) {
        throw new Error('Python 环境不存在，请先初始化环境')
      }

      // 3. 获取 UV 路径
      const uvPath = await uvBootstrapperService.getAvailableUvPath()
      if (!uvPath) {
        throw new Error('无法获取 UV 路径')
      }

      // 4. 查找可用端口
      const port = await this.findAvailablePort(finalConfig.port)
      logger.info('找到可用端口', { port })

      // 5. 构建启动命令
      const mediaServerPath = pythonVenvService.getMediaServerPath()
      const { host, logLevel } = finalConfig

      // 使用 uv run 运行 Python 脚本
      // 假设 media-server 的入口文件是 main.py
      const args = [
        'run',
        'python',
        '-m',
        'uvicorn',
        'app.main:app', // 假设 FastAPI 应用在 app/main.py 的 app 对象
        '--host',
        host!,
        '--port',
        port.toString(),
        '--log-level',
        logLevel!
      ]

      logger.info('启动 Media Server 进程', {
        uvPath,
        args,
        cwd: mediaServerPath
      })

      // 5. 启动进程
      this.process = spawn(uvPath, args, {
        cwd: mediaServerPath,
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: process.platform === 'win32',
        env: this.buildPythonEnv(finalConfig, port)
      })

      // 6. 监听进程输出
      this.process.stdout?.on('data', (data) => {
        const output = data.toString().trim()
        if (output) {
          logger.info('Media Server 输出', { output })
        }
      })

      this.process.stderr?.on('data', (data) => {
        const output = data.toString().trim()
        if (output) {
          logger.warn('Media Server', { output })
        }
      })

      // 7. 监听进程退出
      this.process.on('exit', (code, signal) => {
        logger.warn('Media Server 进程退出', { code, signal })

        const previousPort = this.port

        this.status = 'stopped'
        this.process = null
        this.startTime = null
        this.port = null

        // 通知前端端口已失效
        if (previousPort !== null) {
          this.notifyPortChanged(null)
        }

        // 如果是异常退出，尝试重启
        if (code !== 0 && this.restartAttempts < this.MAX_RESTART_ATTEMPTS) {
          this.restartAttempts++
          logger.info('尝试重启 Media Server', {
            attempt: this.restartAttempts,
            maxAttempts: this.MAX_RESTART_ATTEMPTS
          })

          setTimeout(() => {
            this.start(finalConfig).catch((error) => {
              logger.error('重启 Media Server 失败', { error })
            })
          }, 2000 * this.restartAttempts) // 递增延迟
        } else if (this.restartAttempts >= this.MAX_RESTART_ATTEMPTS) {
          logger.error('Media Server 重启次数过多，停止重启')
          this.lastError = '服务异常退出次数过多'
          this.status = 'error'
        }
      })

      this.process.on('error', (error) => {
        logger.error('Media Server 进程错误', { error })
        this.lastError = error.message
        this.status = 'error'
      })

      // 8. 等待服务启动
      await this.waitForServer(port, 10000) // 10 秒超时

      this.status = 'running'
      this.startTime = Date.now()
      this.port = port
      this.restartAttempts = 0 // 重置重启计数

      // 9. 启动健康检查
      this.startHealthCheck()

      logger.info('Media Server 启动成功', {
        pid: this.process.pid,
        port,
        host
      })

      // 10. 通知所有渲染进程端口已变更
      this.notifyPortChanged(port)

      return true
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      this.lastError = errorMessage
      this.status = 'error'

      logger.error('启动 Media Server 失败', {
        error: errorMessage
      })

      // 清理进程
      if (this.process) {
        this.process.kill()
        this.process = null
      }

      return false
    }
  }

  /**
   * 停止 Media Server
   */
  public async stop(): Promise<boolean> {
    try {
      if (this.status === 'stopped') {
        logger.info('Media Server 已停止')
        return true
      }

      if (!this.process) {
        this.status = 'stopped'
        return true
      }

      this.status = 'stopping'
      logger.info('正在停止 Media Server', { pid: this.process.pid })

      // 停止健康检查
      this.stopHealthCheck()

      // 优雅关闭
      return new Promise<boolean>((resolve) => {
        if (!this.process) {
          this.status = 'stopped'
          resolve(true)
          return
        }

        const pid = this.process.pid

        // 设置超时强制终止
        const forceKillTimer = setTimeout(() => {
          if (this.process && !this.process.killed) {
            logger.warn('强制终止 Media Server', { pid })
            this.process.kill('SIGKILL')
          }
        }, 5000) // 5 秒后强制终止

        // 监听退出
        this.process.once('exit', () => {
          clearTimeout(forceKillTimer)

          const previousPort = this.port

          this.status = 'stopped'
          this.process = null
          this.startTime = null
          this.port = null

          // 通知前端端口已失效
          if (previousPort !== null) {
            this.notifyPortChanged(null)
          }

          logger.info('Media Server 已停止', { pid })
          resolve(true)
        })

        // 发送 SIGTERM 信号
        this.process.kill('SIGTERM')
      })
    } catch (error) {
      logger.error('停止 Media Server 失败', {
        error: error instanceof Error ? error.message : String(error)
      })
      return false
    }
  }

  /**
   * 重启 Media Server
   */
  public async restart(config?: MediaServerConfig): Promise<boolean> {
    logger.info('重启 Media Server')

    await this.stop()

    // 等待一小段时间确保进程完全退出
    await new Promise((resolve) => setTimeout(resolve, 1000))

    return await this.start(config)
  }

  /**
   * 获取 Media Server 状态信息
   */
  public getInfo(): MediaServerInfo {
    const info: MediaServerInfo = {
      status: this.status,
      pid: this.process?.pid
    }

    if (this.port !== null) {
      info.port = this.port
    }

    if (this.startTime) {
      info.startTime = this.startTime
      info.uptime = Date.now() - this.startTime
    }

    if (this.lastError) {
      info.error = this.lastError
    }

    return info
  }

  /**
   * 获取当前 Media Server 使用的端口
   * @returns 端口号，如果服务未运行则返回 null
   */
  public getPort(): number | null {
    return this.port
  }

  /**
   * 等待服务器启动
   */
  private async waitForServer(port: number, timeout: number): Promise<void> {
    const startTime = Date.now()
    const checkInterval = 500 // 每 500ms 检查一次

    while (Date.now() - startTime < timeout) {
      try {
        const isReachable = await this.checkServerHealth(port)
        if (isReachable) {
          logger.debug('Media Server 已就绪')
          return
        }
      } catch (error) {
        // 继续等待
      }

      await new Promise((resolve) => setTimeout(resolve, checkInterval))
    }

    throw new Error('等待 Media Server 启动超时')
  }

  /**
   * 检查服务器健康状态
   */
  private async checkServerHealth(port?: number): Promise<boolean> {
    try {
      const targetPort = port ?? this.port
      if (targetPort === null) {
        return false
      }

      const response = await fetch(`http://127.0.0.1:${targetPort}/api/v1/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(2000) // 2 秒超时
      })

      return response.ok
    } catch (error) {
      return false
    }
  }

  /**
   * 启动健康检查
   */
  private startHealthCheck(): void {
    this.stopHealthCheck()

    this.healthCheckInterval = setInterval(async () => {
      if (this.status !== 'running') {
        return
      }

      const isHealthy = await this.checkServerHealth()

      if (!isHealthy) {
        logger.warn('Media Server 健康检查失败')
        // 可以在这里触发重启逻辑
      }
    }, 30000) // 每 30 秒检查一次
  }

  /**
   * 停止健康检查
   */
  private stopHealthCheck(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval)
      this.healthCheckInterval = null
    }
  }

  /**
   * 通知所有渲染进程端口已变更
   */
  private notifyPortChanged(port: number | null): void {
    const windows = BrowserWindow.getAllWindows()
    windows.forEach((window) => {
      window.webContents.send(IpcChannel.MediaServer_PortChanged, port)
    })
    logger.debug('已通知所有渲染进程端口变更', { port, windowCount: windows.length })
  }

  /**
   * 清理资源
   */
  public async destroy(): Promise<void> {
    logger.info('销毁 MediaServerService')
    await this.stop()
    this.stopHealthCheck()
  }
}

// 导出单例实例
export const mediaServerService = new MediaServerService()
