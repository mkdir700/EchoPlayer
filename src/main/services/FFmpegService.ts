import { PathConverter } from '@shared/utils/PathConverter'
import { PerformanceMonitor } from '@shared/utils/PerformanceMonitor'
import { spawn } from 'child_process'
import { app } from 'electron'
import * as fs from 'fs'
import * as path from 'path'

import { ffmpegDownloadService } from './FFmpegDownloadService'
import { loggerService } from './LoggerService'

const logger = loggerService.withContext('FFmpegService')

class FFmpegService {
  private forceKillTimeout: NodeJS.Timeout | null = null // 强制终止超时句柄

  // FFmpeg 可用性缓存
  private static ffmpegAvailabilityCache: { [key: string]: boolean } = {}
  private static ffmpegCacheTimestamp: { [key: string]: number } = {}
  private static readonly CACHE_TTL = 30 * 1000 // 缓存30秒

  // FFmpeg 预热状态
  private static isWarmedUp = false
  private static warmupPromise: Promise<boolean> | null = null

  // FFmpeg 下载 URL（跨平台）
  private readonly FFMPEG_EXEC_NAMES = {
    win32: {
      executable: 'ffmpeg.exe'
    },
    darwin: {
      executable: 'ffmpeg'
    },
    linux: {
      executable: 'ffmpeg'
    }
  }

  constructor() {
    // 构造函数可以用于初始化操作
  }

  // 获取内置 FFmpeg 路径
  private getBundledFFmpegPath(): string | null {
    try {
      const platform = process.platform
      const arch = process.arch
      const platformKey = `${platform}-${arch}`

      const executableName =
        this.FFMPEG_EXEC_NAMES[platform as keyof typeof this.FFMPEG_EXEC_NAMES]?.executable ||
        'ffmpeg'

      // 生产环境：从应用安装目录获取
      if (app.isPackaged) {
        const resourcesPath = process.resourcesPath
        const ffmpegPath = path.join(resourcesPath, 'ffmpeg', platformKey, executableName)

        if (fs.existsSync(ffmpegPath)) {
          logger.info('找到打包的 FFmpeg', { path: ffmpegPath })
          return ffmpegPath
        }
      } else {
        // 开发环境：从项目目录获取
        const appPath = app.getAppPath()
        const ffmpegPath = path.join(appPath, 'resources', 'ffmpeg', platformKey, executableName)

        if (fs.existsSync(ffmpegPath)) {
          logger.info('找到开发环境 FFmpeg', { path: ffmpegPath })
          return ffmpegPath
        }

        // 也尝试从构建输出目录查找
        const outFfmpegPath = path.join(
          appPath,
          'out',
          'resources',
          'ffmpeg',
          platformKey,
          executableName
        )
        if (fs.existsSync(outFfmpegPath)) {
          logger.info('找到构建输出 FFmpeg', { path: outFfmpegPath })
          return outFfmpegPath
        }
      }

      logger.warn('未找到内置 FFmpeg', {
        platform,
        arch,
        platformKey,
        executableName,
        isPackaged: app.isPackaged,
        searchPaths: app.isPackaged
          ? [path.join(process.resourcesPath, 'ffmpeg', platformKey, executableName)]
          : [
              path.join(app.getAppPath(), 'resources', 'ffmpeg', platformKey, executableName),
              path.join(app.getAppPath(), 'out', 'resources', 'ffmpeg', platformKey, executableName)
            ]
      })

      return null
    } catch (error) {
      logger.error(
        '获取内置 FFmpeg 路径失败:',
        error instanceof Error ? error : new Error(String(error))
      )
      return null
    }
  }

  // 获取 FFmpeg 可执行文件路径
  public getFFmpegPath(): string {
    // 1. 优先使用内置的 FFmpeg（向后兼容）
    const bundledPath = this.getBundledFFmpegPath()
    if (bundledPath) {
      return bundledPath
    }

    // 2. 检查动态下载的 FFmpeg
    if (ffmpegDownloadService.checkFFmpegExists()) {
      const downloadedPath = ffmpegDownloadService.getFFmpegPath()
      logger.info('使用动态下载的 FFmpeg', { downloadedPath })
      return downloadedPath
    }

    // 3. 降级到系统 FFmpeg
    const platform = process.platform as keyof typeof this.FFMPEG_EXEC_NAMES
    const executable = this.FFMPEG_EXEC_NAMES[platform]?.executable || 'ffmpeg'

    logger.info('使用系统 FFmpeg', { executable })
    return executable
  }

  // 检查是否正在使用内置 FFmpeg
  public isUsingBundledFFmpeg(): boolean {
    return this.getBundledFFmpegPath() !== null
  }

  // 检查是否正在使用动态下载的 FFmpeg
  public isUsingDownloadedFFmpeg(): boolean {
    return !this.isUsingBundledFFmpeg() && ffmpegDownloadService.checkFFmpegExists()
  }

  // 获取 FFmpeg 信息
  public getFFmpegInfo(): {
    path: string
    isBundled: boolean
    isDownloaded: boolean
    isSystemFFmpeg: boolean
    platform: string
    arch: string
    version?: string
    needsDownload: boolean
  } {
    const bundledPath = this.getBundledFFmpegPath()
    const isDownloaded = ffmpegDownloadService.checkFFmpegExists()
    const isBundled = bundledPath !== null
    const isSystemFFmpeg = !isBundled && !isDownloaded

    return {
      path: this.getFFmpegPath(),
      isBundled,
      isDownloaded,
      isSystemFFmpeg,
      platform: process.platform,
      arch: process.arch,
      version: ffmpegDownloadService.getFFmpegVersion()?.version,
      needsDownload: !isBundled && !isDownloaded
    }
  }

  // 获取 FFprobe 路径
  public getFFprobePath(): string {
    try {
      return ffmpegDownloadService.getFFprobePath()
    } catch (error) {
      logger.warn('获取下载的 FFprobe 路径失败，使用系统 FFprobe', {
        error: error instanceof Error ? error.message : String(error)
      })
      // 降级到系统 FFprobe
      return 'ffprobe'
    }
  }

  // 快速检查 FFmpeg 是否存在（文件系统级别检查）
  public async fastCheckFFmpegExists(): Promise<boolean> {
    const startTime = Date.now()
    const ffmpegPath = this.getFFmpegPath()

    try {
      // 检查文件是否存在并获取文件信息
      const stats = await fs.promises.stat(ffmpegPath)

      // 检查是否为文件（非目录）
      if (!stats.isFile()) {
        logger.info('⚡ 快速检查: FFmpeg 路径不是文件', { ffmpegPath })
        return false
      }

      // 检查是否有执行权限 (Unix/Linux/macOS)
      if (process.platform !== 'win32') {
        const hasExecutePermission = (stats.mode & 0o111) !== 0
        if (!hasExecutePermission) {
          logger.info('⚡ 快速检查: FFmpeg 没有执行权限', {
            ffmpegPath,
            mode: stats.mode.toString(8)
          })
          return false
        }
      }

      const totalTime = Date.now() - startTime
      logger.info(`⚡ 快速检查 FFmpeg 通过，耗时: ${totalTime}ms`, {
        ffmpegPath,
        文件大小: `${Math.round((stats.size / 1024 / 1024) * 100) / 100}MB`,
        执行权限: process.platform !== 'win32' ? 'yes' : 'n/a'
      })

      return true
    } catch (error) {
      const totalTime = Date.now() - startTime
      logger.warn(`⚡ 快速检查 FFmpeg 失败，耗时: ${totalTime}ms`, {
        ffmpegPath,
        error: error instanceof Error ? error.message : String(error)
      })
      return false
    }
  }

  // 检查 FFmpeg 是否存在（带缓存的完整检查）
  public async checkFFmpegExists(useCache = true): Promise<boolean> {
    const startTime = Date.now()
    const ffmpegPath = this.getFFmpegPath()

    // 检查缓存
    if (useCache) {
      const cached = FFmpegService.ffmpegAvailabilityCache[ffmpegPath]
      const cacheTime = FFmpegService.ffmpegCacheTimestamp[ffmpegPath]

      if (cached !== undefined && cacheTime && Date.now() - cacheTime < FFmpegService.CACHE_TTL) {
        logger.info('📋 使用缓存的 FFmpeg 可用性结果', {
          ffmpegPath,
          cached,
          缓存时间: `${Date.now() - cacheTime}ms前`
        })
        return cached
      }
    }

    logger.info('🔍 开始检查 FFmpeg 是否存在', {
      ffmpegPath,
      platform: process.platform,
      useCache
    })

    try {
      const fastCheckPassed = await this.fastCheckFFmpegExists()
      if (!fastCheckPassed) {
        // 快速检查失败，直接缓存结果并返回
        FFmpegService.ffmpegAvailabilityCache[ffmpegPath] = false
        FFmpegService.ffmpegCacheTimestamp[ffmpegPath] = Date.now()

        const totalTime = Date.now() - startTime
        logger.warn(`❌ FFmpeg 快速检查失败，总耗时: ${totalTime}ms`, { ffmpegPath })
        return false
      }
      return true
    } catch (error) {
      const totalTime = Date.now() - startTime

      // 缓存异常结果
      FFmpegService.ffmpegAvailabilityCache[ffmpegPath] = false
      FFmpegService.ffmpegCacheTimestamp[ffmpegPath] = Date.now()

      logger.warn(`FFmpeg 检查异常，耗时: ${totalTime}ms`, {
        ffmpegPath,
        error: error instanceof Error ? error.message : String(error),
        总耗时: `${totalTime}ms`
      })
      return false
    }
  }

  // 清除 FFmpeg 可用性缓存
  public static clearFFmpegCache(ffmpegPath?: string): void {
    if (ffmpegPath) {
      delete FFmpegService.ffmpegAvailabilityCache[ffmpegPath]
      delete FFmpegService.ffmpegCacheTimestamp[ffmpegPath]
      logger.info('清除指定路径的 FFmpeg 缓存', { ffmpegPath })
    } else {
      FFmpegService.ffmpegAvailabilityCache = {}
      FFmpegService.ffmpegCacheTimestamp = {}
      logger.info('清除所有 FFmpeg 缓存')
    }
  }

  // 获取缓存状态信息
  public static getCacheInfo(): {
    cachedPaths: string[]
    cacheCount: number
    oldestCache?: { path: string; ageMs: number }
  } {
    const paths = Object.keys(FFmpegService.ffmpegAvailabilityCache)
    const now = Date.now()

    let oldestCache: { path: string; ageMs: number } | undefined

    for (const path of paths) {
      const age = now - (FFmpegService.ffmpegCacheTimestamp[path] || 0)
      if (!oldestCache || age > oldestCache.ageMs) {
        oldestCache = { path, ageMs: age }
      }
    }

    return {
      cachedPaths: paths,
      cacheCount: paths.length,
      oldestCache
    }
  }

  // 获取 FFmpeg 版本信息
  public async getFFmpegVersion(): Promise<string | null> {
    const ffmpegPath = this.getFFmpegPath()

    return new Promise((resolve) => {
      const ffmpeg = spawn(ffmpegPath, ['-version'])
      let output = ''

      ffmpeg.stdout.on('data', (data) => {
        output += data.toString()
      })

      ffmpeg.on('close', (code) => {
        if (code === 0) {
          const versionMatch = output.match(/ffmpeg version (\S+)/)
          resolve(versionMatch ? versionMatch[1] : 'unknown')
        } else {
          resolve(null)
        }
      })

      ffmpeg.on('error', () => {
        resolve(null)
      })
    })
  }

  // 解析 FFmpeg 输出中的视频信息
  private parseFFmpegVideoInfo(output: string): {
    duration: number
    videoCodec: string
    audioCodec: string
    resolution: string
    bitrate: string
  } | null {
    try {
      // 解析视频流信息
      const videoMatch = output.match(/Stream #\d+:\d+.*?: Video: (\w+).*?, (\d+x\d+)/)
      const audioMatch = output.match(/Stream #\d+:\d+.*?: Audio: (\w+)/)
      const durationMatch = output.match(/Duration: (\d{2}):(\d{2}):(\d{2})\.(\d{2})/)
      const bitrateMatch = output.match(/bitrate: (\d+) kb\/s/)

      if (!videoMatch) {
        logger.error('❌ 未找到视频流信息')
        return null
      }

      const videoCodec = videoMatch[1] || 'unknown'
      const resolution = videoMatch[2] || '0x0'
      const audioCodec = audioMatch ? audioMatch[1] : 'unknown'

      let duration = 0
      if (durationMatch) {
        const hours = parseInt(durationMatch[1], 10)
        const minutes = parseInt(durationMatch[2], 10)
        const seconds = parseInt(durationMatch[3], 10)
        const centiseconds = parseInt(durationMatch[4], 10)
        duration = hours * 3600 + minutes * 60 + seconds + centiseconds / 100
      }

      const bitrate = bitrateMatch ? bitrateMatch[1] + '000' : '0' // 转换为 bits/s

      logger.info('🎬 解析的视频信息', {
        videoCodec,
        audioCodec,
        resolution,
        duration,
        bitrate
      })

      return {
        duration,
        videoCodec,
        audioCodec,
        resolution,
        bitrate
      }
    } catch (error) {
      logger.error(
        '解析 FFmpeg 输出失败:',
        error instanceof Error ? error : new Error(String(error))
      )
      return null
    }
  }

  // 获取视频信息 - 使用 FFprobe 替换 FFmpeg
  public async getVideoInfo(inputPath: string): Promise<{
    duration: number
    videoCodec: string
    audioCodec: string
    resolution: string
    bitrate: string
  } | null> {
    const pm = new PerformanceMonitor('GetVideoInfo')
    logger.info('🎬 开始获取视频信息', { inputPath })

    try {
      // 转换路径
      pm.startTiming('convertToLocalPath')
      const pathResult = PathConverter.convertToLocalPath(inputPath)
      pm.endTiming('convertToLocalPath')

      if (!pathResult.isValid) {
        logger.error(`❌ 路径转换失败: ${pathResult.error}`)
        return null
      }

      const localInputPath = pathResult.localPath

      // 检查文件是否存在
      try {
        await fs.promises.access(localInputPath, fs.constants.F_OK)
      } catch {
        logger.error(`❌ 文件不存在: ${localInputPath}`)
        return null
      }

      // 执行 FFmpeg 命令
      pm.startTiming(this.executeFFmpegDirect)
      const args = ['-i', localInputPath]
      const result = await this.executeFFmpegDirect(args, 15000)
      pm.endTiming(this.executeFFmpegDirect)

      // 解析 FFmpeg 输出中的视频信息
      const info = this.parseFFmpegVideoInfo(result)

      const report = pm.finish()
      if (info) {
        logger.info(`✅ 使用 FFmpeg fallback 成功获取视频信息`, { info, report })
        return info
      } else {
        logger.error('❌ 无法解析视频信息')
        return null
      }
    } catch (error) {
      const report = pm.finish()
      logger.error(`❌ 获取视频信息失败`, {
        inputPath,
        report,
        error: error instanceof Error ? error.message : String(error)
      })
      return null
    }
  }

  /**
   * 直接执行 FFmpeg
   */
  private async executeFFmpegDirect(args: string[], timeout: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const ffmpegPath = this.getFFmpegPath()
      const ffmpegInfo = this.getFFmpegInfo()

      logger.info('🎬 执行 FFmpeg 命令', {
        ffmpegPath,
        args: args.slice(0, 3), // 只显示前3个参数避免日志过长
        isSystemFFmpeg: ffmpegInfo.isSystemFFmpeg,
        needsDownload: ffmpegInfo.needsDownload
      })

      const ffmpeg = spawn(ffmpegPath, args)

      let output = ''
      let hasTimedOut = false

      const timeoutHandle = setTimeout(() => {
        hasTimedOut = true
        if (ffmpeg && !ffmpeg.killed) {
          ffmpeg.kill('SIGKILL')
        }
        reject(new Error(`FFmpeg direct execution timeout after ${timeout}ms`))
      }, timeout)

      ffmpeg.stderr?.on('data', (data) => {
        output += data.toString()
      })

      ffmpeg.stdout?.on('data', (data) => {
        output += data.toString()
      })

      ffmpeg.on('close', (code) => {
        clearTimeout(timeoutHandle)

        if (hasTimedOut) {
          return
        }

        if (code === 0 || code === 1) {
          // code 1 也可能是正常的
          resolve(output)
        } else {
          reject(new Error(`FFmpeg failed with exit code ${code}: ${output.substring(0, 500)}`))
        }
      })

      ffmpeg.on('error', (error) => {
        clearTimeout(timeoutHandle)
        if (!hasTimedOut) {
          // 检查是否是 ENOENT 错误（文件不存在）
          if ((error as any).code === 'ENOENT') {
            const errorMessage = ffmpegInfo.needsDownload
              ? `FFmpeg 未找到。您需要下载 FFmpeg 才能处理视频文件。\n\n建议操作：\n1. 打开应用设置\n2. 在 "插件管理" 中下载 FFmpeg\n3. 或手动安装系统 FFmpeg\n\n技术信息：${error.message}`
              : `FFmpeg 不可用：${error.message}\n\n请检查 FFmpeg 安装或联系技术支持。`

            logger.error('❌ FFmpeg 执行失败 - 文件不存在', {
              ffmpegPath,
              needsDownload: ffmpegInfo.needsDownload,
              isSystemFFmpeg: ffmpegInfo.isSystemFFmpeg,
              platform: process.platform,
              error: error.message
            })

            reject(new Error(errorMessage))
          } else {
            reject(error)
          }
        }
      })
    })
  }

  /**
   * FFmpeg 预热
   * 在应用启动时执行简单命令来预加载 FFmpeg 并初始化编解码器
   */
  public async warmupFFmpeg(): Promise<boolean> {
    // 如果已经预热过了，直接返回
    if (FFmpegService.isWarmedUp) {
      logger.info('🔥 FFmpeg 已预热，跳过')
      return true
    }

    // 如果正在预热中，等待结果
    if (FFmpegService.warmupPromise) {
      logger.info('🔥 FFmpeg 正在预热中，等待结果...')
      return await FFmpegService.warmupPromise
    }

    // 开始预热
    FFmpegService.warmupPromise = this._performWarmup()

    try {
      const result = await FFmpegService.warmupPromise
      FFmpegService.isWarmedUp = result
      return result
    } catch (error) {
      logger.error('FFmpeg 预热失败:', { error })
      return false
    } finally {
      FFmpegService.warmupPromise = null
    }
  }

  /**
   * 执行实际的预热操作
   */
  private async _performWarmup(): Promise<boolean> {
    const startTime = Date.now()
    logger.info('🔥 开始 FFmpeg 预热...')

    try {
      // 首先检查 FFmpeg 是否可用
      const isAvailable = await this.checkFFmpegExists(false) // 不使用缓存
      if (!isAvailable) {
        logger.error('🔥 FFmpeg 预热失败: FFmpeg 不可用')
        return false
      }

      // 执行简单的版本查询命令来预热 FFmpeg
      // 这会加载所有必要的动态库和初始化编解码器
      const args = ['-version']
      const output = await this.executeFFmpegDirect(args, 10000)

      const duration = Date.now() - startTime
      logger.info(`🔥 FFmpeg 预热成功，耗时: ${duration}ms`, {
        duration: `${duration}ms`,
        outputPreview: output.substring(0, 200) + '...'
      })

      return true
    } catch (error) {
      const duration = Date.now() - startTime
      logger.error(`🔥 FFmpeg 预热失败，耗时: ${duration}ms`, {
        duration: `${duration}ms`,
        error: error instanceof Error ? error.message : String(error)
      })
      return false
    }
  }

  /**
   * 重置预热状态（用于测试或手动重置）
   */
  public static resetWarmupState(): void {
    FFmpegService.isWarmedUp = false
    FFmpegService.warmupPromise = null
    logger.info('🔥 FFmpeg 预热状态已重置')
  }

  /**
   * 检查预热状态
   */
  public static getWarmupStatus(): { isWarmedUp: boolean; isWarming: boolean } {
    return {
      isWarmedUp: FFmpegService.isWarmedUp,
      isWarming: FFmpegService.warmupPromise !== null
    }
  }

  /**
   * 自动检测并下载 FFmpeg
   * 如果没有内置版本且本地也没有下载版本，则触发下载
   */
  public async autoDetectAndDownload(): Promise<{
    available: boolean
    needsDownload: boolean
    downloadTriggered: boolean
  }> {
    const info = this.getFFmpegInfo()

    // 如果已有可用的 FFmpeg（内置或下载版本），直接返回
    if (info.isBundled || info.isDownloaded) {
      return {
        available: true,
        needsDownload: false,
        downloadTriggered: false
      }
    }

    // 检查系统 FFmpeg
    if (await this.checkFFmpegExists()) {
      return {
        available: true,
        needsDownload: false,
        downloadTriggered: false
      }
    }

    // 需要下载
    logger.info('检测到需要下载 FFmpeg', {
      platform: process.platform,
      arch: process.arch
    })

    return {
      available: false,
      needsDownload: true,
      downloadTriggered: false
    }
  }

  /**
   * 获取动态下载服务实例
   */
  public getDownloadService() {
    return ffmpegDownloadService
  }

  /**
   * 销毁服务，清理资源
   */
  public async destroy(): Promise<void> {
    logger.info('销毁 FFmpeg 服务')

    // 清理超时句柄
    if (this.forceKillTimeout) {
      clearTimeout(this.forceKillTimeout)
      this.forceKillTimeout = null
    }

    // 重置预热状态
    FFmpegService.resetWarmupState()

    // 清理下载服务的临时文件
    ffmpegDownloadService.cleanupTempFiles()

    logger.info('FFmpeg 服务已销毁')
  }
}

export default FFmpegService
