#!/usr/bin/env tsx

import { spawn } from 'child_process'
import * as crypto from 'crypto'
import * as fs from 'fs'
import * as https from 'https'
import * as path from 'path'

interface PlatformConfig {
  url: string
  executable: string
  extractPath?: string // 解压后的相对路径
  skipExtraction?: boolean // 跳过解压（对于单文件下载）
}

interface FFmpegDownloadConfig {
  [platform: string]: {
    [arch: string]: PlatformConfig
  }
}

// FFmpeg 下载配置 - 使用 GPL 版本获得完整功能
const FFMPEG_CONFIG: FFmpegDownloadConfig = {
  win32: {
    x64: {
      url: 'https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip',
      executable: 'ffmpeg.exe',
      extractPath: 'ffmpeg-master-latest-win64-gpl/bin/ffmpeg.exe'
    },
    arm64: {
      url: 'https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-winarm64-gpl.zip',
      executable: 'ffmpeg.exe',
      extractPath: 'ffmpeg-master-latest-winarm64-gpl/bin/ffmpeg.exe'
    }
  },
  darwin: {
    x64: {
      url: 'https://evermeet.cx/ffmpeg/ffmpeg-6.1.zip',
      executable: 'ffmpeg',
      extractPath: 'ffmpeg'
    },
    arm64: {
      url: 'https://evermeet.cx/ffmpeg/ffmpeg-6.1.zip', // 通用二进制文件
      executable: 'ffmpeg',
      extractPath: 'ffmpeg'
    }
  },
  linux: {
    x64: {
      url: 'https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz',
      executable: 'ffmpeg',
      extractPath: 'ffmpeg-*-amd64-static/ffmpeg'
    },
    arm64: {
      url: 'https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-arm64-static.tar.xz',
      executable: 'ffmpeg',
      extractPath: 'ffmpeg-*-arm64-static/ffmpeg'
    }
  }
}

class FFmpegDownloader {
  private readonly outputDir: string
  private readonly cacheDir: string

  constructor(outputDir: string = 'resources/ffmpeg') {
    this.outputDir = path.resolve(outputDir)
    this.cacheDir = path.resolve('.ffmpeg-cache')
  }

  // 确保目录存在
  private ensureDir(dir: string): void {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
  }

  // 计算文件哈希用于缓存
  private getFileHash(filePath: string): string {
    if (!fs.existsSync(filePath)) return ''
    const fileBuffer = fs.readFileSync(filePath)
    return crypto.createHash('md5').update(fileBuffer).digest('hex')
  }

  // 获取缓存文件路径
  private getCachePath(platform: string, arch: string): string {
    const config = FFMPEG_CONFIG[platform]?.[arch]
    if (!config) throw new Error(`不支持的平台: ${platform}-${arch}`)

    const filename = path.basename(config.url)
    return path.join(this.cacheDir, `${platform}-${arch}-${filename}`)
  }

  // 下载文件
  private async downloadFile(
    url: string,
    outputPath: string,
    onProgress?: (progress: number) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const file = fs.createWriteStream(outputPath)
      let downloadedSize = 0
      let totalSize = 0

      const download = (currentUrl: string, redirectCount = 0): void => {
        if (redirectCount > 5) {
          reject(new Error('重定向次数过多'))
          return
        }

        const request = https.get(
          currentUrl,
          {
            headers: {
              'User-Agent': 'EchoPlayer-FFmpeg-Downloader/1.0'
            },
            timeout: 30000
          },
          (response) => {
            // 处理重定向
            if (response.statusCode === 301 || response.statusCode === 302) {
              const redirectUrl = response.headers.location
              if (redirectUrl) {
                console.log(`重定向到: ${redirectUrl}`)
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
              downloadedSize += chunk.length
              if (onProgress && totalSize > 0) {
                onProgress((downloadedSize / totalSize) * 100)
              }
            })

            response.pipe(file)

            file.on('finish', () => {
              file.close()
              resolve()
            })

            file.on('error', (err) => {
              fs.unlink(outputPath, () => {}) // 清理失败的文件
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
      }

      download(url)
    })
  }

  // 解压 ZIP 文件
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

  // 解压 TAR.XZ 文件
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

  // 递归查找文件
  private async findFile(dir: string, pattern: string): Promise<string | null> {
    try {
      const items = await fs.promises.readdir(dir, { withFileTypes: true })

      for (const item of items) {
        const fullPath = path.join(dir, item.name)

        if (item.isDirectory()) {
          const found = await this.findFile(fullPath, pattern)
          if (found) return found
        } else if (item.isFile()) {
          if (pattern.includes('*')) {
            // 简单的通配符匹配
            const regex = new RegExp(pattern.replace(/\*/g, '.*'))
            if (regex.test(item.name)) {
              return fullPath
            }
          } else if (item.name === pattern) {
            return fullPath
          }
        }
      }

      return null
    } catch (error) {
      console.error(`搜索文件失败: ${error}`)
      return null
    }
  }

  // 下载并安装 FFmpeg
  public async downloadFFmpeg(platform?: string, arch?: string): Promise<void> {
    const targetPlatform = platform || process.platform
    const targetArch = arch || process.arch

    console.log(`开始下载 FFmpeg ${targetPlatform}-${targetArch}...`)

    const config = FFMPEG_CONFIG[targetPlatform]?.[targetArch]
    if (!config) {
      throw new Error(`不支持的平台: ${targetPlatform}-${targetArch}`)
    }

    this.ensureDir(this.cacheDir)
    this.ensureDir(this.outputDir)

    const cachePath = this.getCachePath(targetPlatform, targetArch)
    const outputPlatformDir = path.join(this.outputDir, `${targetPlatform}-${targetArch}`)
    const finalBinaryPath = path.join(outputPlatformDir, config.executable)

    // 检查是否已存在
    if (fs.existsSync(finalBinaryPath)) {
      console.log(`FFmpeg 已存在: ${finalBinaryPath}`)
      return
    }

    this.ensureDir(outputPlatformDir)

    // 检查缓存
    if (!fs.existsSync(cachePath)) {
      console.log(`下载 ${config.url}...`)
      let lastLoggedProgress = -1
      await this.downloadFile(config.url, cachePath, (progress) => {
        const currentProgress = Math.floor(progress / 10) * 10 // 取整到10的倍数
        if (currentProgress !== lastLoggedProgress && currentProgress >= lastLoggedProgress + 10) {
          process.stdout.write(`\r下载进度: ${currentProgress}%`)
          lastLoggedProgress = currentProgress
        }
      })
      console.log('\n下载完成')
    } else {
      console.log('使用缓存文件')
    }

    // 解压并安装
    console.log('解压中...')
    const tempExtractDir = path.join(this.cacheDir, `extract-${targetPlatform}-${targetArch}`)
    this.ensureDir(tempExtractDir)

    try {
      if (cachePath.endsWith('.zip')) {
        await this.extractZip(cachePath, tempExtractDir)
      } else if (cachePath.endsWith('.tar.xz')) {
        await this.extractTarXz(cachePath, tempExtractDir)
      }

      // 查找可执行文件
      let executablePath: string | null = null

      if (config.extractPath) {
        if (config.extractPath.includes('*')) {
          // 通配符搜索
          executablePath = await this.findFile(tempExtractDir, path.basename(config.extractPath))
        } else {
          const fullPath = path.join(tempExtractDir, config.extractPath)
          if (fs.existsSync(fullPath)) {
            executablePath = fullPath
          }
        }
      }

      if (!executablePath) {
        throw new Error(`找不到可执行文件: ${config.extractPath || config.executable}`)
      }

      // 复制到目标位置
      fs.copyFileSync(executablePath, finalBinaryPath)

      // 设置执行权限（Unix 系统）
      if (targetPlatform !== 'win32') {
        fs.chmodSync(finalBinaryPath, 0o755)
      }

      console.log(`FFmpeg 安装完成: ${finalBinaryPath}`)

      // 清理临时目录
      fs.rmSync(tempExtractDir, { recursive: true, force: true })
    } catch (error) {
      // 清理临时目录
      if (fs.existsSync(tempExtractDir)) {
        fs.rmSync(tempExtractDir, { recursive: true, force: true })
      }
      throw error
    }
  }

  // 下载所有支持的平台
  public async downloadAllPlatforms(): Promise<void> {
    console.log('开始下载所有平台的 FFmpeg...')

    for (const [platform, archConfigs] of Object.entries(FFMPEG_CONFIG)) {
      for (const arch of Object.keys(archConfigs)) {
        try {
          await this.downloadFFmpeg(platform, arch)
        } catch (error) {
          console.error(`下载 ${platform}-${arch} 失败:`, error)
        }
      }
    }

    console.log('所有平台下载完成')
  }

  // 仅下载当前平台
  public async downloadCurrentPlatform(): Promise<void> {
    await this.downloadFFmpeg()
  }

  // 清理缓存
  public cleanCache(): void {
    if (fs.existsSync(this.cacheDir)) {
      fs.rmSync(this.cacheDir, { recursive: true, force: true })
      console.log('缓存已清理')
    }
  }
}

// CLI 入口
async function main() {
  const args = process.argv.slice(2)
  const command = args[0] || 'current'

  const downloader = new FFmpegDownloader()

  try {
    switch (command) {
      case 'all':
        await downloader.downloadAllPlatforms()
        break
      case 'current':
        await downloader.downloadCurrentPlatform()
        break
      case 'clean':
        downloader.cleanCache()
        break
      case 'platform': {
        const platform = args[1]
        const arch = args[2]
        if (!platform || !arch) {
          console.error('用法: tsx download-ffmpeg.ts platform <platform> <arch>')
          process.exit(1)
        }
        await downloader.downloadFFmpeg(platform, arch)
        break
      }
      default:
        console.log(`
使用方法:
  tsx scripts/download-ffmpeg.ts [command]

命令:
  current   - 下载当前平台的 FFmpeg (默认)
  all       - 下载所有支持平台的 FFmpeg
  clean     - 清理下载缓存
  platform <platform> <arch> - 下载指定平台的 FFmpeg

支持的平台:
  win32: x64, arm64
  darwin: x64, arm64
  linux: x64, arm64
        `)
    }
  } catch (error) {
    console.error('错误:', error)
    process.exit(1)
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main()
}

export { FFmpegDownloader }
