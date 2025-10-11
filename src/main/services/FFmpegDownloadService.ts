import { spawn } from 'child_process'
// import * as crypto from 'crypto' // TODO: 将来用于 SHA256 校验
import { app } from 'electron'
import * as fs from 'fs'
import * as https from 'https'
import * as path from 'path'

import { loggerService } from './LoggerService'

const logger = loggerService.withContext('FFmpegDownloadService')

// 支持的平台类型
export type Platform = 'win32' | 'darwin' | 'linux'
export type Arch = 'x64' | 'arm64'

// FFmpeg 版本配置接口
export interface FFmpegVersion {
  version: string
  platform: Platform
  arch: Arch
  url: string
  sha256?: string
  size: number
  extractPath?: string // 解压后的相对路径
}

// 下载进度接口
export interface DownloadProgress {
  percent: number
  downloaded: number
  total: number
  speed: number
  remainingTime: number
  status: 'downloading' | 'extracting' | 'verifying' | 'completed' | 'error'
}

// 下载状态枚举
export enum DownloadStatus {
  NOT_STARTED = 'not_started',
  DOWNLOADING = 'downloading',
  EXTRACTING = 'extracting',
  VERIFYING = 'verifying',
  COMPLETED = 'completed',
  ERROR = 'error',
  CANCELLED = 'cancelled'
}

// FFmpeg 配置 - 使用稳定版本
const FFMPEG_VERSIONS: Record<Platform, Record<Arch, FFmpegVersion>> = {
  win32: {
    x64: {
      version: 'latest',
      platform: 'win32',
      arch: 'x64',
      url: 'https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip',
      size: 89 * 1024 * 1024, // 约 89MB
      extractPath: 'ffmpeg-master-latest-win64-gpl/bin/ffmpeg.exe'
    },
    arm64: {
      version: 'latest',
      platform: 'win32',
      arch: 'arm64',
      url: 'https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-winarm64-gpl.zip',
      size: 85 * 1024 * 1024, // 约 85MB
      extractPath: 'ffmpeg-master-latest-winarm64-gpl/bin/ffmpeg.exe'
    }
  },
  darwin: {
    x64: {
      version: 'latest',
      platform: 'darwin',
      arch: 'x64',
      url: 'https://evermeet.cx/ffmpeg/ffmpeg-8.0.zip',
      size: 67 * 1024 * 1024, // 约 67MB
      extractPath: 'ffmpeg'
    },
    arm64: {
      version: 'latest',
      platform: 'darwin',
      arch: 'arm64',
      url: 'https://evermeet.cx/ffmpeg/ffmpeg-8.0.zip',
      size: 67 * 1024 * 1024, // 约 67MB
      extractPath: 'ffmpeg'
    }
  },
  linux: {
    x64: {
      version: 'latest',
      platform: 'linux',
      arch: 'x64',
      url: 'https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz',
      size: 35 * 1024 * 1024, // 约 35MB
      extractPath: 'ffmpeg-*-amd64-static/ffmpeg'
    },
    arm64: {
      version: 'latest',
      platform: 'linux',
      arch: 'arm64',
      url: 'https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-arm64-static.tar.xz',
      size: 33 * 1024 * 1024, // 约 33MB
      extractPath: 'ffmpeg-*-arm64-static/ffmpeg'
    }
  }
}

// FFprobe 配置（与 FFmpeg 使用相同的包，只是提取不同的可执行文件）
const FFPROBE_VERSIONS: Record<Platform, Record<Arch, FFmpegVersion>> = {
  win32: {
    x64: {
      version: 'latest',
      platform: 'win32',
      arch: 'x64',
      url: 'https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip',
      size: 89 * 1024 * 1024,
      extractPath: 'ffmpeg-master-latest-win64-gpl/bin/ffprobe.exe'
    },
    arm64: {
      version: 'latest',
      platform: 'win32',
      arch: 'arm64',
      url: 'https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-winarm64-gpl.zip',
      size: 85 * 1024 * 1024,
      extractPath: 'ffmpeg-master-latest-winarm64-gpl/bin/ffprobe.exe'
    }
  },
  darwin: {
    x64: {
      version: 'latest',
      platform: 'darwin',
      arch: 'x64',
      url: 'https://evermeet.cx/ffprobe/ffprobe-8.0.zip',
      size: 65 * 1024 * 1024,
      extractPath: 'ffprobe'
    },
    arm64: {
      version: 'latest',
      platform: 'darwin',
      arch: 'arm64',
      url: 'https://evermeet.cx/ffprobe/ffprobe-8.0.zip',
      size: 65 * 1024 * 1024,
      extractPath: 'ffprobe'
    }
  },
  linux: {
    x64: {
      version: 'latest',
      platform: 'linux',
      arch: 'x64',
      url: 'https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz',
      size: 35 * 1024 * 1024,
      extractPath: 'ffmpeg-*-amd64-static/ffprobe'
    },
    arm64: {
      version: 'latest',
      platform: 'linux',
      arch: 'arm64',
      url: 'https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-arm64-static.tar.xz',
      size: 33 * 1024 * 1024,
      extractPath: 'ffmpeg-*-arm64-static/ffprobe'
    }
  }
}

// 中国区专供的 FFmpeg 配置
const CHINA_FFMPEG_VERSIONS: Record<Platform, Record<Arch, FFmpegVersion>> = {
  win32: {
    x64: {
      version: 'latest',
      platform: 'win32',
      arch: 'x64',
      url: 'https://gitcode.com/mkdir700/echoplayer-ffmpeg/releases/download/v0.0.0/win32-x64.zip',
      size: 60 * 1024 * 1024,
      extractPath: 'win32-x64/ffmpeg.exe'
    },
    arm64: {
      version: 'latest',
      platform: 'win32',
      arch: 'arm64',
      url: 'https://gitcode.com/mkdir700/echoplayer-ffmpeg/releases/download/v0.0.0/win32-arm64.zip',
      size: 45 * 1024 * 1024,
      extractPath: 'win32-arm64/ffmpeg.exe'
    }
  },
  darwin: {
    x64: {
      version: 'latest',
      platform: 'darwin',
      arch: 'x64',
      url: 'https://gitcode.com/mkdir700/echoplayer-ffmpeg/releases/download/v0.0.0/darwin-x64.zip',
      size: 24 * 1024 * 1024,
      extractPath: 'darwin-x64/ffmpeg'
    },
    arm64: {
      version: 'latest',
      platform: 'darwin',
      arch: 'arm64',
      url: 'https://gitcode.com/mkdir700/echoplayer-ffmpeg/releases/download/v0.0.0/darwin-arm64.zip',
      size: 24 * 1024 * 1024,
      extractPath: 'darwin-arm64/ffmpeg'
    }
  },
  linux: {
    x64: {
      version: 'latest',
      platform: 'linux',
      arch: 'x64',
      url: 'https://gitcode.com/mkdir700/echoplayer-ffmpeg/releases/download/v0.0.0/linux-x64.zip',
      size: 28 * 1024 * 1024,
      extractPath: 'linux-x64/ffmpeg'
    },
    arm64: {
      version: 'latest',
      platform: 'linux',
      arch: 'arm64',
      url: 'https://gitcode.com/mkdir700/echoplayer-ffmpeg/releases/download/v0.0.0/linux-arm64.zip',
      size: 24 * 1024 * 1024,
      extractPath: 'linux-arm64/ffmpeg'
    }
  }
}

// 中国区专供的 FFprobe 配置
const CHINA_FFPROBE_VERSIONS: Record<Platform, Record<Arch, FFmpegVersion>> = {
  win32: {
    x64: {
      version: 'latest',
      platform: 'win32',
      arch: 'x64',
      url: 'https://gitcode.com/mkdir700/echoplayer-ffprobe/releases/download/v0.0.0/win32-x64.zip',
      size: 60 * 1024 * 1024,
      extractPath: 'win32-x64/ffprobe.exe'
    },
    arm64: {
      version: 'latest',
      platform: 'win32',
      arch: 'arm64',
      url: 'https://gitcode.com/mkdir700/echoplayer-ffprobe/releases/download/v0.0.0/win32-arm64.zip',
      size: 45 * 1024 * 1024,
      extractPath: 'win32-arm64/ffprobe.exe'
    }
  },
  darwin: {
    x64: {
      version: 'latest',
      platform: 'darwin',
      arch: 'x64',
      url: 'https://gitcode.com/mkdir700/echoplayer-ffprobe/releases/download/v0.0.0/darwin-x64.zip',
      size: 24 * 1024 * 1024,
      extractPath: 'darwin-x64/ffprobe'
    },
    arm64: {
      version: 'latest',
      platform: 'darwin',
      arch: 'arm64',
      url: 'https://gitcode.com/mkdir700/echoplayer-ffprobe/releases/download/v0.0.0/darwin-arm64.zip',
      size: 24 * 1024 * 1024,
      extractPath: 'darwin-arm64/ffprobe'
    }
  },
  linux: {
    x64: {
      version: 'latest',
      platform: 'linux',
      arch: 'x64',
      url: 'https://gitcode.com/mkdir700/echoplayer-ffprobe/releases/download/v0.0.0/linux-x64.zip',
      size: 28 * 1024 * 1024,
      extractPath: 'linux-x64/ffprobe'
    },
    arm64: {
      version: 'latest',
      platform: 'linux',
      arch: 'arm64',
      url: 'https://gitcode.com/mkdir700/echoplayer-ffprobe/releases/download/v0.0.0/linux-arm64.zip',
      size: 24 * 1024 * 1024,
      extractPath: 'linux-arm64/ffprobe'
    }
  }
}

export class FFmpegDownloadService {
  private downloadProgress = new Map<string, DownloadProgress>()
  private downloadController = new Map<string, AbortController>()
  private readonly ffmpegBinariesDir: string
  private readonly ffprobeBinariesDir: string
  private useChinaMirror: boolean = false
  private regionDetectionPromise: Promise<void> | null = null

  constructor() {
    const baseBinariesDir = path.join(app.getPath('userData'), 'binaries')
    this.ffmpegBinariesDir = path.join(baseBinariesDir, 'ffmpeg')
    this.ffprobeBinariesDir = path.join(baseBinariesDir, 'ffprobe')

    this.ensureDir(baseBinariesDir)
    this.ensureDir(this.ffmpegBinariesDir)
    this.ensureDir(this.ffprobeBinariesDir)
    // 异步检测地区并设置镜像源（不阻塞初始化）
    this.regionDetectionPromise = this.detectRegionAndSetMirror()
  }

  /**
   * 通过 IP 地理位置检测用户地区并设置镜像源
   */
  private async detectRegionAndSetMirror(): Promise<void> {
    try {
      const country = await this.getIpCountry()

      // 中国大陆、香港、澳门、台湾用户都使用中国镜像源
      const chineseRegions = ['cn', 'hk', 'mo', 'tw']
      this.useChinaMirror = chineseRegions.includes(country?.toLowerCase() || '')

      logger.info('通过IP检测地区，设置镜像源', {
        country,
        useChinaMirror: this.useChinaMirror
      })
    } catch (error) {
      logger.warn('无法检测用户地区，使用默认镜像源', { error })
      this.useChinaMirror = true // 检测失败时默认使用中国镜像源
    }
  }

  /**
   * 获取用户IP对应的国家代码
   */
  private async getIpCountry(): Promise<string> {
    try {
      // 使用 AbortController 设置 5 秒超时
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)

      const response = await fetch('https://ipinfo.io/json', {
        signal: controller.signal,
        headers: {
          'User-Agent': 'EchoPlayer-FFmpeg-Downloader/2.0',
          'Accept-Language': 'en-US,en;q=0.9'
        }
      })

      clearTimeout(timeoutId)
      const data = await response.json()
      return data.country || 'CN' // 默认返回 CN，这样中国用户即使检测失败也能使用中国镜像源
    } catch (error) {
      logger.warn('获取IP地理位置失败，默认使用中国镜像源', { error })
      return 'CN' // 默认返回 CN
    }
  }

  /**
   * 手动设置镜像源
   */
  public setMirrorSource(useChina: boolean): void {
    this.useChinaMirror = useChina
    logger.info('手动设置镜像源', { useChinaMirror: this.useChinaMirror })
  }

  /**
   * 获取当前使用的镜像源
   */
  public getCurrentMirrorSource(): 'china' | 'global' {
    return this.useChinaMirror ? 'china' : 'global'
  }

  /**
   * 获取 FFmpeg 在本地的存储路径
   */
  public getFFmpegPath(
    platform = process.platform as Platform,
    arch = process.arch as Arch
  ): string {
    const version = this.getFFmpegVersion(platform, arch)
    if (!version) {
      throw new Error(`不支持的平台: ${platform}-${arch}`)
    }

    const platformDir = `${version.version}-${platform}-${arch}`
    const executableName = platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg'
    return path.join(this.ffmpegBinariesDir, platformDir, executableName)
  }

  /**
   * 获取 FFprobe 在本地的存储路径
   */
  public getFFprobePath(
    platform = process.platform as Platform,
    arch = process.arch as Arch
  ): string {
    const version = this.getFFprobeVersion(platform, arch)
    if (!version) {
      throw new Error(`不支持的平台: ${platform}-${arch}`)
    }

    const platformDir = `${version.version}-${platform}-${arch}`
    const executableName = platform === 'win32' ? 'ffprobe.exe' : 'ffprobe'
    return path.join(this.ffprobeBinariesDir, platformDir, executableName)
  }

  /**
   * 检查 FFmpeg 是否已下载
   */
  public checkFFmpegExists(
    platform = process.platform as Platform,
    arch = process.arch as Arch
  ): boolean {
    try {
      const ffmpegPath = this.getFFmpegPath(platform, arch)
      return fs.existsSync(ffmpegPath) && fs.statSync(ffmpegPath).isFile()
    } catch {
      return false
    }
  }

  /**
   * 检查 FFprobe 是否已下载
   */
  public checkFFprobeExists(
    platform = process.platform as Platform,
    arch = process.arch as Arch
  ): boolean {
    try {
      const ffprobePath = this.getFFprobePath(platform, arch)
      return fs.existsSync(ffprobePath) && fs.statSync(ffprobePath).isFile()
    } catch {
      return false
    }
  }

  /**
   * 获取 FFmpeg 版本配置
   */
  public getFFmpegVersion(
    platform = process.platform as Platform,
    arch = process.arch as Arch
  ): FFmpegVersion | null {
    // 优先使用中国镜像源（如果启用）
    if (this.useChinaMirror) {
      const chinaVersion = CHINA_FFMPEG_VERSIONS[platform]?.[arch]
      if (chinaVersion) {
        return chinaVersion
      }
      logger.warn('中国镜像源不支持当前平台，回退到全球镜像源', { platform, arch })
    }

    // 回退到全球镜像源
    return FFMPEG_VERSIONS[platform]?.[arch] || null
  }

  /**
   * 获取 FFprobe 版本配置
   */
  public getFFprobeVersion(
    platform = process.platform as Platform,
    arch = process.arch as Arch
  ): FFmpegVersion | null {
    // 优先使用中国镜像源（如果启用）
    if (this.useChinaMirror) {
      const chinaVersion = CHINA_FFPROBE_VERSIONS[platform]?.[arch]
      if (chinaVersion) {
        return chinaVersion
      }
      logger.warn('中国镜像源不支持当前平台，回退到全球镜像源', { platform, arch })
    }

    // 回退到全球镜像源
    return FFPROBE_VERSIONS[platform]?.[arch] || null
  }

  /**
   * 获取所有支持的平台配置
   */
  public getAllSupportedVersions(): FFmpegVersion[] {
    const versions: FFmpegVersion[] = []

    // 添加当前镜像源的版本
    const currentVersions = this.useChinaMirror ? CHINA_FFMPEG_VERSIONS : FFMPEG_VERSIONS
    for (const platformConfigs of Object.values(currentVersions)) {
      for (const version of Object.values(platformConfigs)) {
        versions.push(version)
      }
    }

    return versions
  }

  /**
   * 获取指定镜像源的所有支持版本
   */
  public getAllVersionsByMirror(mirrorType: 'china' | 'global'): FFmpegVersion[] {
    const versions: FFmpegVersion[] = []
    const versionConfigs = mirrorType === 'china' ? CHINA_FFMPEG_VERSIONS : FFMPEG_VERSIONS

    for (const platformConfigs of Object.values(versionConfigs)) {
      for (const version of Object.values(platformConfigs)) {
        versions.push(version)
      }
    }

    return versions
  }

  /**
   * 开始下载 FFmpeg
   */
  public async downloadFFmpeg(
    platform = process.platform as Platform,
    arch = process.arch as Arch,
    onProgress?: (progress: DownloadProgress) => void
  ): Promise<boolean> {
    const key = `ffmpeg-${platform}-${arch}`

    // 检查是否已存在
    if (this.checkFFmpegExists(platform, arch)) {
      logger.info('FFmpeg 已存在，跳过下载', { platform, arch })
      return true
    }

    // 检查是否正在下载
    if (this.downloadProgress.has(key)) {
      logger.warn('FFmpeg 正在下载中', { platform, arch })
      return false
    }

    // 尝试下载（如果中国镜像源失败会自动回退）
    return await this.downloadBinaryWithFallback('ffmpeg', platform, arch, onProgress)
  }

  /**
   * 开始下载 FFprobe
   */
  public async downloadFFprobe(
    platform = process.platform as Platform,
    arch = process.arch as Arch,
    onProgress?: (progress: DownloadProgress) => void
  ): Promise<boolean> {
    const key = `ffprobe-${platform}-${arch}`

    // 检查是否已存在
    if (this.checkFFprobeExists(platform, arch)) {
      logger.info('FFprobe 已存在，跳过下载', { platform, arch })
      return true
    }

    // 检查是否正在下载
    if (this.downloadProgress.has(key)) {
      logger.warn('FFprobe 正在下载中', { platform, arch })
      return false
    }

    // 尝试下载（如果中国镜像源失败会自动回退）
    return await this.downloadBinaryWithFallback('ffprobe', platform, arch, onProgress)
  }

  /**
   * 带回退机制的下载方法（统一处理 ffmpeg 和 ffprobe）
   */
  private async downloadBinaryWithFallback(
    binaryType: 'ffmpeg' | 'ffprobe',
    platform: Platform,
    arch: Arch,
    onProgress?: (progress: DownloadProgress) => void
  ): Promise<boolean> {
    // 等待地区检测完成（最多等待 10 秒）
    if (this.regionDetectionPromise) {
      try {
        await Promise.race([
          this.regionDetectionPromise,
          new Promise((_, reject) => setTimeout(() => reject(new Error('地区检测超时')), 10000))
        ])
      } catch (error) {
        logger.warn('地区检测超时或失败，使用当前镜像源设置', { error })
      }
    }

    // 首先尝试当前镜像源
    const version =
      binaryType === 'ffmpeg'
        ? this.getFFmpegVersion(platform, arch)
        : this.getFFprobeVersion(platform, arch)
    if (!version) {
      logger.error('不支持的平台', { platform, arch, binaryType })
      return false
    }

    logger.info(`开始下载 ${binaryType}`, {
      platform,
      arch,
      version: version.version,
      mirrorSource: this.getCurrentMirrorSource(),
      url: version.url
    })

    // 尝试下载
    let success = await this.performDownload(binaryType, platform, arch, version, onProgress)

    // 如果使用中国镜像源失败，自动回退到全球镜像源
    if (!success && this.useChinaMirror) {
      logger.warn(`中国镜像源下载失败，尝试回退到全球镜像源`, { platform, arch, binaryType })

      const globalVersion =
        binaryType === 'ffmpeg'
          ? FFMPEG_VERSIONS[platform]?.[arch]
          : FFPROBE_VERSIONS[platform]?.[arch]
      if (globalVersion) {
        logger.info('使用全球镜像源重新下载', {
          platform,
          arch,
          binaryType,
          url: globalVersion.url
        })
        success = await this.performDownload(binaryType, platform, arch, globalVersion, onProgress)
      }
    }

    return success
  }

  /**
   * 执行实际的下载操作
   */
  private async performDownload(
    binaryType: 'ffmpeg' | 'ffprobe',
    platform: Platform,
    arch: Arch,
    version: FFmpegVersion,
    onProgress?: (progress: DownloadProgress) => void
  ): Promise<boolean> {
    const key = `${binaryType}-${platform}-${arch}`
    const controller = new AbortController()
    this.downloadController.set(key, controller)

    const progress: DownloadProgress = {
      percent: 0,
      downloaded: 0,
      total: version.size,
      speed: 0,
      remainingTime: 0,
      status: 'downloading'
    }

    this.downloadProgress.set(key, progress)

    try {
      // 创建目标目录
      const platformDir = `${version.version}-${platform}-${arch}`
      const baseDir = this.getBinariesDir(binaryType)
      const targetDir = path.join(baseDir, platformDir)
      const tempDir = path.join(baseDir, '.temp', key)

      this.ensureDir(targetDir)
      this.ensureDir(tempDir)

      // 下载文件
      const downloadPath = path.join(tempDir, path.basename(version.url))
      await this.downloadFile(
        version.url,
        downloadPath,
        (percent, downloaded, total, speed) => {
          progress.percent = percent
          progress.downloaded = downloaded
          progress.total = total
          progress.speed = speed
          progress.remainingTime = speed > 0 ? (total - downloaded) / speed : 0
          onProgress?.(progress)
        },
        controller.signal
      )

      // 解压文件
      progress.status = 'extracting'
      progress.percent = 90
      onProgress?.(progress)

      await this.extractFile(downloadPath, tempDir)

      // 移动到目标位置
      const executableName =
        platform === 'win32' ? (binaryType === 'ffmpeg' ? 'ffmpeg.exe' : 'ffprobe.exe') : binaryType
      const finalPath = path.join(targetDir, executableName)

      let extractedPath: string
      if (version.extractPath?.includes('*')) {
        extractedPath = await this.findFile(tempDir, path.basename(version.extractPath))
        if (!extractedPath) {
          throw new Error('未找到可执行文件')
        }
      } else {
        extractedPath = path.join(tempDir, version.extractPath || executableName)
      }

      fs.copyFileSync(extractedPath, finalPath)

      // 设置执行权限
      if (platform !== 'win32') {
        fs.chmodSync(finalPath, 0o755)
      }

      // 完成
      progress.status = 'completed'
      progress.percent = 100
      onProgress?.(progress)

      logger.info(`${binaryType} 下载完成`, { platform, arch, finalPath, binaryType })

      // 清理临时文件
      this.cleanupTempDir(tempDir)

      return true
    } catch (error) {
      progress.status = 'error'
      onProgress?.(progress)

      logger.error(`${binaryType} 下载失败`, {
        platform,
        arch,
        binaryType,
        error: error instanceof Error ? error.message : String(error)
      })

      return false
    } finally {
      this.downloadProgress.delete(key)
      this.downloadController.delete(key)
    }
  }

  /**
   * 取消下载
   */
  public cancelDownload(
    binaryType: 'ffmpeg' | 'ffprobe',
    platform = process.platform as Platform,
    arch = process.arch as Arch
  ): void {
    const key = `${binaryType}-${platform}-${arch}`
    const controller = this.downloadController.get(key)
    if (controller) {
      controller.abort()
      logger.info(`取消 ${binaryType} 下载`, { platform, arch, binaryType })
    }
  }

  /**
   * 获取下载进度
   */
  public getDownloadProgress(
    binaryType: 'ffmpeg' | 'ffprobe',
    platform = process.platform as Platform,
    arch = process.arch as Arch
  ): DownloadProgress | null {
    const key = `${binaryType}-${platform}-${arch}`
    return this.downloadProgress.get(key) || null
  }

  /**
   * 删除已下载的 FFmpeg
   */
  public removeFFmpeg(
    platform = process.platform as Platform,
    arch = process.arch as Arch
  ): boolean {
    try {
      const version = this.getFFmpegVersion(platform, arch)
      if (!version) return false

      const platformDir = `${version.version}-${platform}-${arch}`
      const targetDir = path.join(this.ffmpegBinariesDir, platformDir)

      if (fs.existsSync(targetDir)) {
        fs.rmSync(targetDir, { recursive: true, force: true })
        logger.info('删除 FFmpeg 成功', { platform, arch })
        return true
      }

      return false
    } catch (error) {
      logger.error('删除 FFmpeg 失败', {
        platform,
        arch,
        error: error instanceof Error ? error.message : String(error)
      })
      return false
    }
  }

  /**
   * 删除已下载的 FFprobe
   */
  public removeFFprobe(
    platform = process.platform as Platform,
    arch = process.arch as Arch
  ): boolean {
    try {
      const version = this.getFFprobeVersion(platform, arch)
      if (!version) return false

      const platformDir = `${version.version}-${platform}-${arch}`
      const targetDir = path.join(this.ffprobeBinariesDir, platformDir)

      if (fs.existsSync(targetDir)) {
        fs.rmSync(targetDir, { recursive: true, force: true })
        logger.info('删除 FFprobe 成功', { platform, arch })
        return true
      }

      return false
    } catch (error) {
      logger.error('删除 FFprobe 失败', {
        platform,
        arch,
        error: error instanceof Error ? error.message : String(error)
      })
      return false
    }
  }

  /**
   * 清理所有临时文件
   */
  public cleanupTempFiles(): void {
    const tempDirs = [
      { dir: path.join(this.ffmpegBinariesDir, '.temp'), binaryType: 'ffmpeg' as const },
      { dir: path.join(this.ffprobeBinariesDir, '.temp'), binaryType: 'ffprobe' as const }
    ]

    let cleaned = false
    for (const { dir, binaryType } of tempDirs) {
      if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true })
        logger.info('清理临时文件完成', { binaryType })
        cleaned = true
      }
    }

    if (!cleaned) {
      logger.info('未找到临时文件可清理')
    }
  }

  // 私有方法

  private ensureDir(dir: string): void {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
  }

  private getBinariesDir(binaryType: 'ffmpeg' | 'ffprobe'): string {
    return binaryType === 'ffmpeg' ? this.ffmpegBinariesDir : this.ffprobeBinariesDir
  }

  private async downloadFile(
    url: string,
    outputPath: string,
    onProgress?: (percent: number, downloaded: number, total: number, speed: number) => void,
    signal?: AbortSignal
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const file = fs.createWriteStream(outputPath)
      let downloadedSize = 0
      let totalSize = 0
      const startTime = Date.now()
      let lastTime = startTime
      let lastDownloaded = 0

      const download = (currentUrl: string, redirectCount = 0): void => {
        if (redirectCount > 5) {
          reject(new Error('重定向次数过多'))
          return
        }

        const request = https.get(
          currentUrl,
          {
            headers: {
              'User-Agent': 'EchoPlayer-FFmpeg-Downloader/2.0'
            },
            timeout: 30000
          },
          (response) => {
            // 处理重定向
            if (response.statusCode === 301 || response.statusCode === 302) {
              const redirectUrl = response.headers.location
              if (redirectUrl) {
                download(redirectUrl, redirectCount + 1)
                return
              }
            }

            if (response.statusCode !== 200) {
              reject(new Error(`下载失败: HTTP ${response.statusCode}`))
              return
            }

            totalSize = parseInt(response.headers['content-length'] || '0', 10)

            response.on('data', (chunk) => {
              if (signal?.aborted) {
                response.destroy()
                file.destroy()
                fs.unlink(outputPath, () => {})
                reject(new Error('下载已取消'))
                return
              }

              downloadedSize += chunk.length

              // 计算下载速度
              const now = Date.now()
              if (now - lastTime > 1000) {
                // 每秒更新一次
                const timeDiff = (now - lastTime) / 1000
                const sizeDiff = downloadedSize - lastDownloaded
                const speed = sizeDiff / timeDiff

                if (onProgress && totalSize > 0) {
                  onProgress((downloadedSize / totalSize) * 100, downloadedSize, totalSize, speed)
                }

                lastTime = now
                lastDownloaded = downloadedSize
              }
            })

            response.pipe(file)

            file.on('finish', () => {
              file.close()
              resolve()
            })

            file.on('error', (err) => {
              fs.unlink(outputPath, () => {})
              reject(err)
            })

            response.on('error', reject)
          }
        )

        request.on('error', reject)
        request.on('timeout', () => {
          request.destroy()
          reject(new Error('下载超时'))
        })

        // 监听取消信号
        signal?.addEventListener('abort', () => {
          request.destroy()
        })
      }

      download(url)
    })
  }

  private async extractFile(archivePath: string, extractDir: string): Promise<void> {
    if (archivePath.endsWith('.zip')) {
      await this.extractZip(archivePath, extractDir)
    } else if (archivePath.endsWith('.tar.xz')) {
      await this.extractTarXz(archivePath, extractDir)
    } else {
      throw new Error('不支持的压缩格式')
    }
  }

  private async extractZip(zipPath: string, extractDir: string): Promise<void> {
    return new Promise((resolve, reject) => {
      let command: string
      let args: string[]

      if (process.platform === 'win32') {
        command = 'powershell'
        args = [
          '-Command',
          `Expand-Archive -Path "${zipPath}" -DestinationPath "${extractDir}" -Force`
        ]
      } else {
        command = 'unzip'
        args = ['-o', zipPath, '-d', extractDir]
      }

      const child = spawn(command, args, { stdio: 'pipe' })

      child.on('close', (code) => {
        if (code === 0) {
          resolve()
        } else {
          reject(new Error(`解压失败，退出代码: ${code}`))
        }
      })

      child.on('error', reject)
    })
  }

  private async extractTarXz(tarPath: string, extractDir: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const child = spawn('tar', ['-xJf', tarPath, '-C', extractDir], { stdio: 'pipe' })

      child.on('close', (code) => {
        if (code === 0) {
          resolve()
        } else {
          reject(new Error(`解压失败，退出代码: ${code}`))
        }
      })

      child.on('error', reject)
    })
  }

  private async findFile(dir: string, pattern: string): Promise<string> {
    const items = await fs.promises.readdir(dir, { withFileTypes: true })

    for (const item of items) {
      const fullPath = path.join(dir, item.name)

      if (item.isDirectory()) {
        try {
          const found = await this.findFile(fullPath, pattern)
          if (found) return found
        } catch {
          // 继续搜索其他目录
        }
      } else if (item.isFile()) {
        if (pattern.includes('*')) {
          const regex = new RegExp(pattern.replace(/\*/g, '.*'))
          if (regex.test(item.name)) {
            return fullPath
          }
        } else if (item.name === pattern) {
          return fullPath
        }
      }
    }

    throw new Error(`未找到文件: ${pattern}`)
  }

  private cleanupTempDir(tempDir: string): void {
    try {
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true })
      }
    } catch (error) {
      logger.warn('清理临时目录失败', {
        tempDir,
        error: error instanceof Error ? error.message : String(error)
      })
    }
  }
}

// 导出单例实例
export const ffmpegDownloadService = new FFmpegDownloadService()
