import { Arch, Platform } from '@shared/types/system'
import { spawn } from 'child_process'
import { app } from 'electron'
import * as fs from 'fs'
import * as path from 'path'

import { loggerService } from './LoggerService'

const logger = loggerService.withContext('UvBootstrapperService')

// uv 版本配置接口
export interface UvVersion {
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

// uv 安装信息接口
export interface UvInstallationInfo {
  exists: boolean
  path?: string
  version?: string
  isSystem: boolean
  isDownloaded: boolean
}

// PyPI 镜像源配置
export interface PyPiMirror {
  name: string
  url: string
  testUrl: string
  location: string
}

// uv 配置 - 基于官方 GitHub Releases
const UV_VERSIONS: Record<Platform, Record<Arch, UvVersion>> = {
  win32: {
    x64: {
      version: 'latest',
      platform: 'win32',
      arch: 'x64',
      url: 'https://github.com/astral-sh/uv/releases/latest/download/uv-x86_64-pc-windows-msvc.zip',
      size: 15 * 1024 * 1024, // 约 15MB
      extractPath: 'uv.exe'
    },
    arm64: {
      version: 'latest',
      platform: 'win32',
      arch: 'arm64',
      url: 'https://github.com/astral-sh/uv/releases/latest/download/uv-aarch64-pc-windows-msvc.zip',
      size: 15 * 1024 * 1024, // 约 15MB
      extractPath: 'uv.exe'
    }
  },
  darwin: {
    x64: {
      version: 'latest',
      platform: 'darwin',
      arch: 'x64',
      url: 'https://github.com/astral-sh/uv/releases/latest/download/uv-x86_64-apple-darwin.tar.gz',
      size: 12 * 1024 * 1024, // 约 12MB
      extractPath: 'uv'
    },
    arm64: {
      version: 'latest',
      platform: 'darwin',
      arch: 'arm64',
      url: 'https://github.com/astral-sh/uv/releases/latest/download/uv-aarch64-apple-darwin.tar.gz',
      size: 12 * 1024 * 1024, // 约 12MB
      extractPath: 'uv'
    }
  },
  linux: {
    x64: {
      version: 'latest',
      platform: 'linux',
      arch: 'x64',
      url: 'https://github.com/astral-sh/uv/releases/latest/download/uv-x86_64-unknown-linux-gnu.tar.gz',
      size: 12 * 1024 * 1024, // 约 12MB
      extractPath: 'uv'
    },
    arm64: {
      version: 'latest',
      platform: 'linux',
      arch: 'arm64',
      url: 'https://github.com/astral-sh/uv/releases/latest/download/uv-aarch64-unknown-linux-gnu.tar.gz',
      size: 12 * 1024 * 1024, // 约 12MB
      extractPath: 'uv'
    }
  }
}

// PyPI 镜像源配置
const PYPI_MIRRORS: PyPiMirror[] = [
  {
    name: 'tsinghua',
    url: 'https://pypi.tuna.tsinghua.edu.cn/simple/',
    testUrl: 'https://pypi.tuna.tsinghua.edu.cn/simple/pip/',
    location: '中国'
  },
  {
    name: 'aliyun',
    url: 'https://mirrors.aliyun.com/pypi/simple/',
    testUrl: 'https://mirrors.aliyun.com/pypi/simple/pip/',
    location: '中国'
  },
  {
    name: 'douban',
    url: 'https://pypi.douban.com/simple/',
    testUrl: 'https://pypi.douban.com/simple/pip/',
    location: '中国'
  },
  {
    name: 'official',
    url: 'https://pypi.org/simple/',
    testUrl: 'https://pypi.org/simple/pip/',
    location: '全球'
  }
]

export class UvBootstrapperService {
  private downloadProgress = new Map<string, DownloadProgress>()
  private downloadController = new Map<string, AbortController>()
  private readonly binariesDir: string
  private fastestMirror: PyPiMirror | null = null
  private mirrorTestPromise: Promise<PyPiMirror> | null = null

  // uv 可用性缓存
  private static uvAvailabilityCache: { [key: string]: UvInstallationInfo } = {}
  private static uvCacheTimestamp: { [key: string]: number } = {}
  private static readonly CACHE_TTL = 30 * 1000 // 缓存30秒

  constructor() {
    // uv 存储在 userData/binaries/uv/ 目录
    this.binariesDir = path.join(app.getPath('userData'), 'binaries', 'uv')
    this.ensureDir(this.binariesDir)

    logger.info('UvBootstrapperService 初始化完成', {
      binariesDir: this.binariesDir,
      platform: process.platform,
      arch: process.arch
    })
  }

  /**
   * 获取 uv 在本地的存储路径
   */
  public getUvPath(platform = process.platform as Platform, arch = process.arch as Arch): string {
    const version = this.getUvVersion(platform, arch)
    if (!version) {
      throw new Error(`不支持的平台: ${platform}-${arch}`)
    }

    const platformDir = `${version.version}-${platform}-${arch}`
    const executableName = platform === 'win32' ? 'uv.exe' : 'uv'
    return path.join(this.binariesDir, platformDir, executableName)
  }

  /**
   * 获取下载的 uv 路径（如果存在）
   */
  private getDownloadedUvPath(
    platform = process.platform as Platform,
    arch = process.arch as Arch
  ): string | null {
    try {
      const uvPath = this.getUvPath(platform, arch)
      return fs.existsSync(uvPath) && fs.statSync(uvPath).isFile() ? uvPath : null
    } catch {
      return null
    }
  }

  /**
   * 检查系统 PATH 中的 uv
   */
  private async checkSystemUv(): Promise<{ path?: string; version?: string }> {
    try {
      const result = await this.executeCommand('uv', ['--version'])
      const versionMatch = result.match(/uv (\S+)/)
      const version = versionMatch ? versionMatch[1] : 'unknown'

      // 获取 uv 的实际路径
      const pathResult =
        process.platform === 'win32'
          ? await this.executeCommand('where', ['uv'])
          : await this.executeCommand('which', ['uv'])

      const uvPath = pathResult.trim().split('\n')[0]

      logger.info('检测到系统 uv', { path: uvPath, version })
      return { path: uvPath, version }
    } catch (error) {
      logger.debug('系统中未找到 uv', {
        error: error instanceof Error ? error.message : String(error)
      })
      return {}
    }
  }

  /**
   * 检查 uv 安装情况（带缓存）
   */
  public async checkUvInstallation(useCache = true): Promise<UvInstallationInfo> {
    const startTime = Date.now()
    const cacheKey = `${process.platform}-${process.arch}`

    // 检查缓存
    if (useCache) {
      const cached = UvBootstrapperService.uvAvailabilityCache[cacheKey]
      const cacheTime = UvBootstrapperService.uvCacheTimestamp[cacheKey]

      if (cached && cacheTime && Date.now() - cacheTime < UvBootstrapperService.CACHE_TTL) {
        logger.debug('使用缓存的 uv 安装信息', {
          cached,
          缓存时间: `${Date.now() - cacheTime}ms前`
        })
        return cached
      }
    }

    logger.info('开始检查 uv 安装情况', { platform: process.platform, arch: process.arch })

    try {
      // 1. 检查下载的 uv
      const downloadedPath = this.getDownloadedUvPath()
      if (downloadedPath) {
        const version = await this.getUvVersionFromPath(downloadedPath)
        const info: UvInstallationInfo = {
          exists: true,
          path: downloadedPath,
          version,
          isSystem: false,
          isDownloaded: true
        }

        // 缓存结果
        UvBootstrapperService.uvAvailabilityCache[cacheKey] = info
        UvBootstrapperService.uvCacheTimestamp[cacheKey] = Date.now()

        const duration = Date.now() - startTime
        logger.info(`✅ 找到下载的 uv，耗时: ${duration}ms`, { path: downloadedPath, version })
        return info
      }

      // 2. 检查系统 uv
      const systemUv = await this.checkSystemUv()
      if (systemUv.path) {
        const info: UvInstallationInfo = {
          exists: true,
          path: systemUv.path,
          version: systemUv.version,
          isSystem: true,
          isDownloaded: false
        }

        // 缓存结果
        UvBootstrapperService.uvAvailabilityCache[cacheKey] = info
        UvBootstrapperService.uvCacheTimestamp[cacheKey] = Date.now()

        const duration = Date.now() - startTime
        logger.info(`✅ 找到系统 uv，耗时: ${duration}ms`, {
          path: systemUv.path,
          version: systemUv.version
        })
        return info
      }

      // 3. 未找到 uv
      const info: UvInstallationInfo = {
        exists: false,
        isSystem: false,
        isDownloaded: false
      }

      // 缓存结果
      UvBootstrapperService.uvAvailabilityCache[cacheKey] = info
      UvBootstrapperService.uvCacheTimestamp[cacheKey] = Date.now()

      const duration = Date.now() - startTime
      logger.warn(`❌ 未找到 uv，耗时: ${duration}ms`)
      return info
    } catch (error) {
      const duration = Date.now() - startTime
      logger.error(`uv 检查异常，耗时: ${duration}ms`, {
        error: error instanceof Error ? error.message : String(error)
      })

      const info: UvInstallationInfo = {
        exists: false,
        isSystem: false,
        isDownloaded: false
      }

      // 缓存异常结果
      UvBootstrapperService.uvAvailabilityCache[cacheKey] = info
      UvBootstrapperService.uvCacheTimestamp[cacheKey] = Date.now()

      return info
    }
  }

  /**
   * 获取 uv 版本配置
   */
  public getUvVersion(
    platform = process.platform as Platform,
    arch = process.arch as Arch
  ): UvVersion | null {
    return UV_VERSIONS[platform]?.[arch] || null
  }

  /**
   * 从路径获取 uv 版本
   */
  private async getUvVersionFromPath(uvPath: string): Promise<string> {
    try {
      const result = await this.executeCommand(uvPath, ['--version'])
      const versionMatch = result.match(/uv (\S+)/)
      return versionMatch ? versionMatch[1] : 'unknown'
    } catch {
      return 'unknown'
    }
  }

  /**
   * 执行命令行命令
   */
  private async executeCommand(command: string, args: string[], cwd?: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const child = spawn(command, args, {
        cwd,
        stdio: 'pipe',
        shell: process.platform === 'win32'
      })

      let stdout = ''
      let stderr = ''

      child.stdout?.on('data', (data) => {
        stdout += data.toString()
      })

      child.stderr?.on('data', (data) => {
        stderr += data.toString()
      })

      child.on('close', (code) => {
        if (code === 0) {
          resolve(stdout.trim())
        } else {
          reject(
            new Error(
              `命令执行失败: ${command} ${args.join(' ')}\n退出代码: ${code}\n错误输出: ${stderr}`
            )
          )
        }
      })

      child.on('error', (error) => {
        reject(error)
      })
    })
  }

  /**
   * 清除 uv 可用性缓存
   */
  public static clearUvCache(platform?: string, arch?: string): void {
    const cacheKey = platform && arch ? `${platform}-${arch}` : null

    if (cacheKey) {
      delete UvBootstrapperService.uvAvailabilityCache[cacheKey]
      delete UvBootstrapperService.uvCacheTimestamp[cacheKey]
      logger.info('清除指定平台的 uv 缓存', { platform, arch })
    } else {
      UvBootstrapperService.uvAvailabilityCache = {}
      UvBootstrapperService.uvCacheTimestamp = {}
      logger.info('清除所有 uv 缓存')
    }
  }

  /**
   * 确保目录存在
   */
  private ensureDir(dir: string): void {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
  }

  /**
   * 下载 uv 二进制文件
   */
  public async downloadUv(
    platform = process.platform as Platform,
    arch = process.arch as Arch,
    onProgress?: (progress: DownloadProgress) => void
  ): Promise<boolean> {
    const key = `${platform}-${arch}`

    // 检查目标平台的缓存二进制
    const downloadedPath = this.getDownloadedUvPath(platform, arch)
    if (downloadedPath) {
      logger.info('uv 已存在，跳过下载', { platform, arch, path: downloadedPath })
      return true
    }

    // 仅当请求的平台与当前进程一致时，才额外使用缓存的系统检测结果
    if (platform === process.platform && arch === process.arch) {
      const installation = await this.checkUvInstallation()
      if (installation.exists && installation.isDownloaded) {
        logger.info('uv 已存在，跳过下载', { platform, arch, path: installation.path })
        return true
      }
    }

    // 检查是否正在下载
    if (this.downloadProgress.has(key) || this.downloadController.has(key)) {
      logger.warn('uv 正在下载中', { platform, arch })
      return false
    }

    const version = this.getUvVersion(platform, arch)
    if (!version) {
      logger.error('不支持的平台', { platform, arch })
      return false
    }

    logger.info('开始下载 uv', {
      platform,
      arch,
      version: version.version,
      url: version.url
    })

    return await this.performDownload(platform, arch, version, onProgress)
  }

  /**
   * 执行实际的下载操作
   */
  private async performDownload(
    platform: Platform,
    arch: Arch,
    version: UvVersion,
    onProgress?: (progress: DownloadProgress) => void
  ): Promise<boolean> {
    const key = `${platform}-${arch}`
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

    const platformDir = `${version.version}-${platform}-${arch}`
    const targetDir = path.join(this.binariesDir, platformDir)
    const tempDir = path.join(this.binariesDir, '.temp', key)

    try {
      // 创建目标目录
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
      const executableName = platform === 'win32' ? 'uv.exe' : 'uv'
      const finalPath = path.join(targetDir, executableName)

      const relativeExecutablePath = version.extractPath || executableName
      let extractedPath = path.join(tempDir, relativeExecutablePath)
      const searchedPaths = [extractedPath]

      if (!fs.existsSync(extractedPath)) {
        const archiveFileName = path.basename(version.url)
        const archiveBaseName = archiveFileName
          .replace(/\.tar\.gz$/i, '')
          .replace(/\.tgz$/i, '')
          .replace(/\.zip$/i, '')

        const candidates = [
          path.join(tempDir, archiveBaseName, relativeExecutablePath),
          path.join(tempDir, archiveBaseName, executableName)
        ]

        searchedPaths.push(...candidates)

        const foundCandidate = candidates.find((candidate) => fs.existsSync(candidate))

        if (foundCandidate) {
          extractedPath = foundCandidate
          logger.debug('uv 可执行文件位于嵌套目录中', {
            platform,
            arch,
            extractedPath
          })
        }
      }

      if (!fs.existsSync(extractedPath)) {
        throw new Error(`未找到可执行文件: ${searchedPaths.join(', ')}`)
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

      logger.info('uv 下载完成', { platform, arch, finalPath })

      // 清除缓存以便重新检测
      UvBootstrapperService.clearUvCache(platform, arch)

      return true
    } catch (error) {
      progress.status = 'error'
      onProgress?.(progress)

      logger.error('uv 下载失败', {
        platform,
        arch,
        error: error instanceof Error ? error.message : String(error)
      })

      return false
    } finally {
      this.downloadProgress.delete(key)
      this.downloadController.delete(key)
      this.cleanupTempDir(tempDir)
    }
  }

  /**
   * 下载文件
   */
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

        const https = require('https')
        const request = https.get(
          currentUrl,
          {
            headers: {
              'User-Agent': 'EchoPlayer-Uv-Downloader/2.0'
            },
            timeout: 30000
          },
          (response: any) => {
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

            response.on('data', (chunk: Buffer) => {
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

            file.on('error', (err: Error) => {
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

  /**
   * 解压文件
   */
  private async extractFile(archivePath: string, extractDir: string): Promise<void> {
    if (archivePath.endsWith('.zip')) {
      await this.extractZip(archivePath, extractDir)
    } else if (archivePath.endsWith('.tar.gz')) {
      await this.extractTarGz(archivePath, extractDir)
    } else {
      throw new Error('不支持的压缩格式')
    }
  }

  /**
   * 解压 ZIP 文件
   */
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

  /**
   * 解压 TAR.GZ 文件
   */
  private async extractTarGz(tarPath: string, extractDir: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const child = spawn('tar', ['-xzf', tarPath, '-C', extractDir], { stdio: 'pipe' })

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

  /**
   * 获取下载进度
   */
  public getDownloadProgress(
    platform = process.platform as Platform,
    arch = process.arch as Arch
  ): DownloadProgress | null {
    const key = `${platform}-${arch}`
    return this.downloadProgress.get(key) || null
  }

  /**
   * 取消下载
   */
  public cancelDownload(
    platform = process.platform as Platform,
    arch = process.arch as Arch
  ): void {
    const key = `${platform}-${arch}`
    const controller = this.downloadController.get(key)
    if (controller) {
      controller.abort()
      logger.info('取消 uv 下载', { platform, arch })
    }
  }

  /**
   * 清理临时目录
   */
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

  /**
   * 获取可用的 uv 路径（优先下载版本，然后系统版本）
   */
  public async getAvailableUvPath(): Promise<string | null> {
    const installation = await this.checkUvInstallation()
    return installation.exists ? installation.path || null : null
  }

  /**
   * 执行 uv 命令
   */
  private async executeUv(args: string[], cwd?: string): Promise<string> {
    const uvPath = await this.getAvailableUvPath()
    if (!uvPath) {
      throw new Error('uv 不可用，请先安装 uv')
    }

    logger.debug('执行 uv 命令', { uvPath, args: args.slice(0, 3), cwd })
    return await this.executeCommand(uvPath, args, cwd)
  }

  /**
   * 创建 Python 项目
   */
  public async initProject(projectPath: string): Promise<boolean> {
    try {
      logger.info('初始化 Python 项目', { projectPath })

      // 确保项目目录存在
      this.ensureDir(projectPath)

      // 使用 uv init 初始化项目
      await this.executeUv(['init', '--app'], projectPath)

      logger.info('Python 项目初始化成功', { projectPath })
      return true
    } catch (error) {
      logger.error('Python 项目初始化失败', {
        projectPath,
        error: error instanceof Error ? error.message : String(error)
      })
      return false
    }
  }

  /**
   * 创建虚拟环境
   */
  public async createVenv(projectPath: string, pythonVersion?: string): Promise<boolean> {
    try {
      logger.info('创建虚拟环境', { projectPath, pythonVersion })

      const args = ['venv']
      if (pythonVersion) {
        args.push('--python', pythonVersion)
      }

      await this.executeUv(args, projectPath)

      logger.info('虚拟环境创建成功', { projectPath })
      return true
    } catch (error) {
      logger.error('虚拟环境创建失败', {
        projectPath,
        pythonVersion,
        error: error instanceof Error ? error.message : String(error)
      })
      return false
    }
  }

  /**
   * 检查虚拟环境是否存在
   */
  public checkVenvExists(projectPath: string): boolean {
    const venvPath = path.join(projectPath, '.venv')
    const pythonPath = path.join(
      venvPath,
      process.platform === 'win32' ? 'Scripts/python.exe' : 'bin/python'
    )
    return fs.existsSync(pythonPath)
  }

  /**
   * 安装 Python 包
   */
  public async installPackage(
    projectPath: string,
    packageName: string,
    version?: string,
    pypiMirror?: string
  ): Promise<boolean> {
    try {
      logger.info('安装 Python 包', { projectPath, packageName, version, pypiMirror })

      const args = ['add']

      // 使用指定镜像源
      if (pypiMirror) {
        args.push('--index-url', pypiMirror)
      }

      // 添加包名（可能包含版本）
      if (version) {
        args.push(`${packageName}==${version}`)
      } else {
        args.push(packageName)
      }

      await this.executeUv(args, projectPath)

      logger.info('Python 包安装成功', { projectPath, packageName, version })
      return true
    } catch (error) {
      logger.error('Python 包安装失败', {
        projectPath,
        packageName,
        version,
        error: error instanceof Error ? error.message : String(error)
      })
      return false
    }
  }

  /**
   * 从 requirements.txt 安装依赖
   */
  public async installDependencies(projectPath: string, pypiMirror?: string): Promise<boolean> {
    try {
      logger.info('安装项目依赖', { projectPath, pypiMirror })

      const args = ['sync']

      // 使用指定镜像源
      if (pypiMirror) {
        args.push('--index-url', pypiMirror)
      }

      await this.executeUv(args, projectPath)

      logger.info('项目依赖安装成功', { projectPath })
      return true
    } catch (error) {
      logger.error('项目依赖安装失败', {
        projectPath,
        error: error instanceof Error ? error.message : String(error)
      })
      return false
    }
  }

  /**
   * 运行 Python 脚本
   */
  public async runPython(
    projectPath: string,
    scriptPath: string,
    args: string[] = []
  ): Promise<string> {
    try {
      logger.info('运行 Python 脚本', { projectPath, scriptPath, args })

      const uvArgs = ['run', 'python', scriptPath, ...args]
      const result = await this.executeUv(uvArgs, projectPath)

      logger.info('Python 脚本运行成功', { projectPath, scriptPath })
      return result
    } catch (error) {
      logger.error('Python 脚本运行失败', {
        projectPath,
        scriptPath,
        args,
        error: error instanceof Error ? error.message : String(error)
      })
      throw error
    }
  }

  /**
   * 获取项目信息
   */
  public async getProjectInfo(projectPath: string): Promise<{
    hasVenv: boolean
    pyprojectExists: boolean
    lockfileExists: boolean
    pythonVersion?: string
  }> {
    const hasVenv = this.checkVenvExists(projectPath)
    const pyprojectExists = fs.existsSync(path.join(projectPath, 'pyproject.toml'))
    const lockfileExists = fs.existsSync(path.join(projectPath, 'uv.lock'))

    let pythonVersion: string | undefined

    if (hasVenv) {
      try {
        const result = await this.executeUv(['run', 'python', '--version'], projectPath)
        const versionMatch = result.match(/Python (\S+)/)
        pythonVersion = versionMatch ? versionMatch[1] : undefined
      } catch (error) {
        logger.warn('获取 Python 版本失败', { error })
      }
    }

    return {
      hasVenv,
      pyprojectExists,
      lockfileExists,
      pythonVersion
    }
  }

  /**
   * 测试镜像源响应时间
   */
  private async testMirrorSpeed(mirror: PyPiMirror): Promise<number> {
    const startTime = Date.now()
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000) // 5秒超时

    try {
      const response = await fetch(mirror.testUrl, {
        method: 'HEAD',
        signal: controller.signal,
        headers: {
          'User-Agent': 'EchoPlayer-PyPI-Tester/2.0',
          Accept: 'text/html,application/xhtml+xml'
        }
      })

      clearTimeout(timeoutId)

      if (response.ok) {
        const responseTime = Date.now() - startTime
        logger.debug('镜像源测试成功', { name: mirror.name, responseTime, status: response.status })
        return responseTime
      } else {
        logger.debug('镜像源测试失败', { name: mirror.name, status: response.status })
        return Infinity
      }
    } catch (error) {
      clearTimeout(timeoutId)
      logger.debug('镜像源测试异常', {
        name: mirror.name,
        error: error instanceof Error ? error.message : String(error)
      })
      return Infinity
    }
  }

  /**
   * 选择最快的 PyPI 镜像源
   */
  public async selectFastestMirror(): Promise<PyPiMirror> {
    if (this.fastestMirror) {
      logger.debug('使用缓存的最快镜像源', { name: this.fastestMirror.name })
      return this.fastestMirror
    }

    if (this.mirrorTestPromise) {
      logger.debug('等待正在进行的镜像源测试...')
      return await this.mirrorTestPromise
    }

    this.mirrorTestPromise = this.performMirrorTest()
    try {
      const result = await this.mirrorTestPromise
      this.fastestMirror = result
      return result
    } finally {
      this.mirrorTestPromise = null
    }
  }

  /**
   * 执行镜像源测试
   */
  private async performMirrorTest(): Promise<PyPiMirror> {
    logger.info('开始测试 PyPI 镜像源速度...')

    const testPromises = PYPI_MIRRORS.map(async (mirror) => {
      const responseTime = await this.testMirrorSpeed(mirror)
      return { mirror, responseTime }
    })

    try {
      const results = await Promise.all(testPromises)

      // 按响应时间排序
      results.sort((a, b) => a.responseTime - b.responseTime)

      const fastest = results[0]
      if (fastest.responseTime === Infinity) {
        logger.warn('所有镜像源都不可用，使用官方源')
        return PYPI_MIRRORS.find((m) => m.name === 'official') || PYPI_MIRRORS[0]
      }

      logger.info('选择最快的 PyPI 镜像源', {
        name: fastest.mirror.name,
        location: fastest.mirror.location,
        responseTime: `${fastest.responseTime}ms`,
        url: fastest.mirror.url
      })

      return fastest.mirror
    } catch (error) {
      logger.error('镜像源测试失败，使用官方源', {
        error: error instanceof Error ? error.message : String(error)
      })
      return PYPI_MIRRORS.find((m) => m.name === 'official') || PYPI_MIRRORS[0]
    }
  }

  /**
   * 获取 PyPI 镜像源列表
   */
  public getPyPiMirrors(): PyPiMirror[] {
    return [...PYPI_MIRRORS]
  }

  /**
   * 手动设置 PyPI 镜像源
   */
  public setFastestMirror(mirror: PyPiMirror): void {
    this.fastestMirror = mirror
    logger.info('手动设置 PyPI 镜像源', { name: mirror.name, url: mirror.url })
  }

  /**
   * 清除镜像源缓存
   */
  public clearMirrorCache(): void {
    this.fastestMirror = null
    this.mirrorTestPromise = null
    logger.info('清除 PyPI 镜像源缓存')
  }

  /**
   * 使用最佳镜像源安装包
   */
  public async installPackageWithBestMirror(
    projectPath: string,
    packageName: string,
    version?: string
  ): Promise<boolean> {
    try {
      const fastestMirror = await this.selectFastestMirror()
      return await this.installPackage(projectPath, packageName, version, fastestMirror.url)
    } catch (error) {
      logger.warn('使用最佳镜像源安装失败，尝试默认源', {
        packageName,
        error: error instanceof Error ? error.message : String(error)
      })
      return await this.installPackage(projectPath, packageName, version)
    }
  }

  /**
   * 使用最佳镜像源安装依赖
   */
  public async installDependenciesWithBestMirror(projectPath: string): Promise<boolean> {
    try {
      const fastestMirror = await this.selectFastestMirror()
      return await this.installDependencies(projectPath, fastestMirror.url)
    } catch (error) {
      logger.warn('使用最佳镜像源安装依赖失败，尝试默认源', {
        projectPath,
        error: error instanceof Error ? error.message : String(error)
      })
      return await this.installDependencies(projectPath)
    }
  }

  /**
   * 销毁服务，清理资源
   */
  public async destroy(): Promise<void> {
    logger.info('销毁 UvBootstrapperService')

    // 取消所有下载
    for (const [key, controller] of this.downloadController) {
      controller.abort()
      logger.debug('取消下载', { key })
    }

    // 清理缓存
    UvBootstrapperService.clearUvCache()

    logger.info('UvBootstrapperService 已销毁')
  }
}

// 导出单例实例
export const uvBootstrapperService = new UvBootstrapperService()
