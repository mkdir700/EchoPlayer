import type { TranscodeOptions, TranscodeProgress } from '@types'
import { ChildProcess, spawn } from 'child_process'
import * as fs from 'fs'
import { createWriteStream } from 'fs'
import * as https from 'https'
import * as path from 'path'

import { getDataPath } from '../utils'
import { loggerService } from './LoggerService'

const logger = loggerService.withContext('FFmpegService')

class FFmpegService {
  // 类属性用于管理正在进行的转码进程
  private currentTranscodeProcess: ChildProcess | null = null
  private isTranscodeCancelled = false // 标记转码是否被用户主动取消
  private forceKillTimeout: NodeJS.Timeout | null = null // 强制终止超时句柄

  // FFmpeg 下载 URL（跨平台）
  private readonly FFMPEG_DOWNLOAD_URLS = {
    win32: {
      url: 'https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip',
      executable: 'ffmpeg.exe'
    },
    darwin: {
      url: 'https://evermeet.cx/ffmpeg/ffmpeg-6.1.zip',
      executable: 'ffmpeg'
    },
    linux: {
      url: 'https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz',
      executable: 'ffmpeg'
    }
  }

  constructor() {
    // 构造函数可以用于初始化操作
  }

  // 生成输出文件路径

  // 备用方法，暂时未使用
  /* private generateOutputPath(inputPath: string, outputFormat: string = 'mp4'): string {
    // 转换file://URL为本地路径
    const localInputPath = this.convertFileUrlToLocalPath(inputPath)

    // 获取原视频文件的目录
    const inputDir = path.dirname(localInputPath)

    // 从本地路径提取文件名，确保已解码
    const localFileName = path.basename(localInputPath)
    const originalName = path.parse(localFileName).name

    // 生成时间戳
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')

    // 生成输出文件名
    const outputFilename = `${originalName}_transcoded_${timestamp}.${outputFormat}`

    // 将输出文件放在原视频的同目录下
    const outputPath = path.join(inputDir, outputFilename)

    logger.info('生成输出路径', {
      输入路径: inputPath,
      本地输入路径: localInputPath,
      输入目录: inputDir,
      本地文件名: localFileName,
      原始文件名: originalName,
      输出文件名: outputFilename,
      输出路径: outputPath
    })

    return outputPath
  } */

  // 将file://URL转换为本地文件路径
  private convertFileUrlToLocalPath(inputPath: string): string {
    // 如果是file://URL，需要转换为本地路径
    if (inputPath.startsWith('file://')) {
      try {
        const url = new URL(inputPath)
        let localPath = decodeURIComponent(url.pathname)

        // Windows路径处理：移除开头的斜杠
        if (process.platform === 'win32' && localPath.startsWith('/')) {
          localPath = localPath.substring(1)
        }

        // 添加详细的调试信息
        logger.info('🔄 URL路径转换详情', {
          原始路径: inputPath,
          'URL.pathname': url.pathname,
          解码前路径: url.pathname,
          解码后路径: localPath,
          平台: process.platform,
          文件是否存在: fs.existsSync(localPath)
        })

        // 额外验证：尝试列出目录内容来确认文件是否真的存在
        if (!fs.existsSync(localPath)) {
          const dirPath = path.dirname(localPath)
          const fileName = path.basename(localPath)

          logger.info('🔍 文件不存在，检查目录内容', {
            目录路径: dirPath,
            期望文件名: fileName,
            目录是否存在: fs.existsSync(dirPath)
          })

          if (fs.existsSync(dirPath)) {
            try {
              const filesInDir = fs.readdirSync(dirPath)
              logger.info('📁 目录中的文件', {
                目录路径: dirPath,
                文件列表: filesInDir,
                文件数量: filesInDir.length
              })

              // 查找可能的匹配文件（大小写不敏感匹配）
              const matchingFiles = filesInDir.filter(
                (file) =>
                  file.toLowerCase().includes('老友记') ||
                  file.toLowerCase().includes('h265') ||
                  file.toLowerCase().includes(fileName.toLowerCase())
              )

              if (matchingFiles.length > 0) {
                logger.info('🎯 找到可能匹配的文件', { matchingFiles })
              }
            } catch (error) {
              logger.error(
                '无法读取目录内容:',
                error instanceof Error ? error : new Error(String(error))
              )
            }
          }
        }

        return localPath
      } catch (error) {
        logger.error('URL路径转换失败:', error instanceof Error ? error : new Error(String(error)))
        // 如果转换失败，返回原路径
        return inputPath
      }
    }

    // 如果不是file://URL，直接返回
    return inputPath
  }

  // 解压 ZIP 文件
  private async extractZipFile(zipPath: string, extractDir: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (process.platform === 'win32') {
        // Windows 使用 PowerShell 的 Expand-Archive 命令
        const powershellCommand = `Expand-Archive -Path "${zipPath}" -DestinationPath "${extractDir}" -Force`
        const powershell = spawn('powershell.exe', ['-Command', powershellCommand], {
          windowsHide: true
        })

        powershell.stdout.on('data', (data) => {
          logger.info('PowerShell 解压输出:', data.toString())
        })

        powershell.stderr.on('data', (data) => {
          logger.warn('PowerShell 解压警告:', data.toString())
        })

        powershell.on('close', (code) => {
          if (code === 0) {
            logger.info('ZIP 解压成功 (PowerShell)')
            resolve()
          } else {
            reject(new Error(`PowerShell 解压失败，退出代码: ${code}`))
          }
        })

        powershell.on('error', (error) => {
          reject(new Error(`PowerShell 解压命令执行失败: ${error.message}`))
        })
      } else {
        // macOS/Linux 使用 unzip 命令
        const unzip = spawn('unzip', ['-o', zipPath, '-d', extractDir])

        unzip.stdout.on('data', (data) => {
          logger.info('解压输出:', data.toString())
        })

        unzip.stderr.on('data', (data) => {
          logger.warn('解压警告:', data.toString())
        })

        unzip.on('close', (code) => {
          if (code === 0) {
            logger.info('ZIP 解压成功')
            resolve()
          } else {
            reject(new Error(`解压失败，退出代码: ${code}`))
          }
        })

        unzip.on('error', (error) => {
          reject(new Error(`解压命令执行失败: ${error.message}`))
        })
      }
    })
  }

  // 解压 TAR.XZ 文件
  private async extractTarFile(tarPath: string, extractDir: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const tar = spawn('tar', ['-xJf', tarPath, '-C', extractDir])

      tar.stdout.on('data', (data) => {
        logger.info('解压输出:', data.toString())
      })

      tar.stderr.on('data', (data) => {
        logger.warn('解压警告:', data.toString())
      })

      tar.on('close', (code) => {
        if (code === 0) {
          logger.info('TAR.XZ 解压成功')
          resolve()
        } else {
          reject(new Error(`解压失败，退出代码: ${code}`))
        }
      })

      tar.on('error', (error) => {
        reject(new Error(`解压命令执行失败: ${error.message}`))
      })
    })
  }

  // 查找并移动可执行文件
  private async findAndMoveExecutable(extractDir: string, executableName: string): Promise<void> {
    const targetPath = this.getFFmpegPath()

    try {
      // 递归查找可执行文件
      const foundPath = await this.findExecutableRecursively(extractDir, executableName)

      if (!foundPath) {
        throw new Error(`在解压目录中未找到可执行文件: ${executableName}`)
      }

      logger.info('找到可执行文件', { foundPath, targetPath })

      // 移动文件到目标位置
      await fs.promises.copyFile(foundPath, targetPath)

      // 设置执行权限
      await fs.promises.chmod(targetPath, 0o755)

      logger.info('FFmpeg 可执行文件安装完成', { targetPath })
    } catch (error) {
      logger.error(
        '查找或移动可执行文件失败:',
        error instanceof Error ? error : new Error(String(error))
      )
      throw error
    }
  }

  // 递归查找可执行文件
  private async findExecutableRecursively(
    dir: string,
    executableName: string
  ): Promise<string | null> {
    try {
      const items = await fs.promises.readdir(dir, { withFileTypes: true })

      for (const item of items) {
        const fullPath = path.join(dir, item.name)

        if (item.isDirectory()) {
          // 递归搜索子目录
          const found = await this.findExecutableRecursively(fullPath, executableName)
          if (found) return found
        } else if (item.isFile() && item.name === executableName) {
          // 找到目标文件
          return fullPath
        }
      }

      return null
    } catch (error) {
      logger.error(
        `搜索目录失败: ${dir}`,
        error instanceof Error ? error : new Error(String(error))
      )
      return null
    }
  }

  // 获取 FFmpeg 可执行文件路径
  public getFFmpegPath(): string {
    // TODO: 实现 FFmpeg 的下载和安装流程
    // 当前直接使用系统环境中的 FFmpeg 命令行工具
    // 后续需要：
    // 1. 检查系统是否已安装 FFmpeg
    // 2. 如果没有安装，提供下载和安装功能
    // 3. 支持自动下载适合当前平台的 FFmpeg 二进制文件
    // 4. 提供 FFmpeg 版本管理和更新功能

    const platform = process.platform as keyof typeof this.FFMPEG_DOWNLOAD_URLS
    const executable = this.FFMPEG_DOWNLOAD_URLS[platform]?.executable || 'ffmpeg'

    // 暂时直接返回系统命令，假设 FFmpeg 已在 PATH 中
    return executable
  }

  // 检查 FFmpeg 是否存在
  public async checkFFmpegExists(): Promise<boolean> {
    const startTime = Date.now()
    const ffmpegPath = this.getFFmpegPath()

    logger.info('🔍 开始检查 FFmpeg 是否存在', {
      ffmpegPath,
      platform: process.platform
    })

    try {
      // TODO: 当前直接检查系统 FFmpeg，后续需要支持本地安装的 FFmpeg
      // 使用 spawn 来检查 FFmpeg 是否可用
      return new Promise((resolve) => {
        const spawnStartTime = Date.now()
        const ffmpeg = spawn(ffmpegPath, ['-version'])

        ffmpeg.on('close', (code) => {
          const spawnEndTime = Date.now()
          const totalTime = spawnEndTime - startTime
          const spawnTime = spawnEndTime - spawnStartTime

          const exists = code === 0
          if (exists) {
            logger.info(`✅ 系统 FFmpeg 可用，检查耗时: ${totalTime}ms`, {
              ffmpegPath,
              spawn耗时: `${spawnTime}ms`,
              总耗时: `${totalTime}ms`
            })
          } else {
            logger.warn(`⚠️ 系统 FFmpeg 不可用，检查耗时: ${totalTime}ms`, {
              ffmpegPath,
              exitCode: code,
              spawn耗时: `${spawnTime}ms`,
              总耗时: `${totalTime}ms`
            })
          }
          resolve(exists)
        })

        ffmpeg.on('error', (error) => {
          const totalTime = Date.now() - startTime
          logger.warn(`❌ FFmpeg 检查失败，耗时: ${totalTime}ms`, {
            ffmpegPath,
            error: error.message,
            总耗时: `${totalTime}ms`
          })
          resolve(false)
        })
      })
    } catch (error) {
      const totalTime = Date.now() - startTime
      logger.warn(`FFmpeg 检查异常，耗时: ${totalTime}ms`, {
        ffmpegPath,
        error: error instanceof Error ? error.message : String(error),
        总耗时: `${totalTime}ms`
      })
      return false
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

  // 下载 FFmpeg
  public async downloadFFmpeg(onProgress?: (progress: number) => void): Promise<boolean> {
    const platform = process.platform as keyof typeof this.FFMPEG_DOWNLOAD_URLS
    const downloadInfo = this.FFMPEG_DOWNLOAD_URLS[platform]

    if (!downloadInfo) {
      throw new Error(`不支持的平台: ${platform}`)
    }

    const dataDir = getDataPath()
    const ffmpegDir = path.join(dataDir, 'ffmpeg')

    // 确保目录存在
    await fs.promises.mkdir(ffmpegDir, { recursive: true })

    const downloadPath = path.join(
      ffmpegDir,
      `ffmpeg-download.${downloadInfo.url.split('.').pop()}`
    )

    try {
      logger.info('开始下载 FFmpeg...', { url: downloadInfo.url, path: downloadPath })

      // 下载文件，支持重定向
      await new Promise<void>((resolve, reject) => {
        const downloadTimeout = setTimeout(
          () => {
            reject(new Error('下载超时: 请检查网络连接'))
          },
          30 * 60 * 1000
        ) // 30分钟超时

        const cleanup = (): void => {
          if (downloadTimeout) {
            clearTimeout(downloadTimeout)
          }
        }

        const downloadFile = (url: string, maxRedirects: number = 5): void => {
          if (maxRedirects <= 0) {
            cleanup()
            reject(new Error('下载失败: 重定向次数过多'))
            return
          }

          const request = https
            .get(
              url,
              {
                timeout: 30000, // 30秒连接超时
                headers: {
                  'User-Agent': 'EchoPlayer/1.0.0 (Electron FFmpeg Downloader)'
                }
              },
              (response) => {
                // 处理重定向
                if (response.statusCode === 301 || response.statusCode === 302) {
                  const redirectUrl = response.headers.location
                  if (redirectUrl) {
                    logger.info(`处理重定向: ${response.statusCode}`, {
                      from: url,
                      to: redirectUrl,
                      remainingRedirects: maxRedirects - 1
                    })
                    downloadFile(redirectUrl, maxRedirects - 1)
                    return
                  } else {
                    cleanup()
                    reject(new Error(`下载失败: HTTP ${response.statusCode} 但未提供重定向地址`))
                    return
                  }
                }

                // 检查最终响应状态
                if (response.statusCode !== 200) {
                  cleanup()
                  reject(
                    new Error(
                      `下载失败: HTTP ${response.statusCode} - ${response.statusMessage || '未知错误'}`
                    )
                  )
                  return
                }

                const totalSize = parseInt(response.headers['content-length'] || '0', 10)
                let downloadedSize = 0

                logger.info('开始接收文件数据', {
                  contentLength: totalSize,
                  contentType: response.headers['content-type']
                })

                const fileStream = createWriteStream(downloadPath)

                response.on('data', (chunk) => {
                  downloadedSize += chunk.length
                  if (onProgress && totalSize > 0) {
                    const progress = (downloadedSize / totalSize) * 100
                    onProgress(progress)

                    // 每10%记录一次日志
                    if (Math.floor(progress) % 10 === 0 && Math.floor(progress) !== 0) {
                      logger.debug('下载进度更新', {
                        progress: `${Math.floor(progress)}%`,
                        downloaded: `${Math.round(downloadedSize / 1024 / 1024)}MB`,
                        total: `${Math.round(totalSize / 1024 / 1024)}MB`
                      })
                    }
                  }
                })

                response.pipe(fileStream)

                fileStream.on('finish', () => {
                  fileStream.close()
                  cleanup()
                  logger.info('文件下载完成', {
                    finalSize: downloadedSize,
                    expectedSize: totalSize
                  })
                  resolve()
                })

                fileStream.on('error', (error) => {
                  cleanup()
                  logger.error('文件写入错误:', error)
                  reject(error)
                })

                response.on('error', (error) => {
                  cleanup()
                  logger.error('响应流错误:', error)
                  reject(error)
                })
              }
            )
            .on('error', (error) => {
              cleanup()
              logger.error('请求错误:', error)
              reject(error)
            })
            .on('timeout', () => {
              cleanup()
              request.destroy()
              reject(new Error('连接超时: 请检查网络连接'))
            })
        }

        // 开始下载
        downloadFile(downloadInfo.url)
      })

      logger.info('FFmpeg 下载完成', {
        downloadPath,
        ffmpegDir,
        platform,
        targetExecutable: this.getFFmpegPath()
      })

      // 检查下载的文件是否存在
      const downloadedFileExists = await fs.promises
        .access(downloadPath, fs.constants.F_OK)
        .then(() => true)
        .catch(() => false)
      logger.info('下载文件检查结果', { downloadPath, exists: downloadedFileExists })

      if (!downloadedFileExists) {
        throw new Error('下载的文件不存在')
      }

      // 获取下载文件的信息
      try {
        const stats = await fs.promises.stat(downloadPath)
        logger.info('下载文件信息', {
          size: stats.size,
          isFile: stats.isFile(),
          path: downloadPath
        })
      } catch (error) {
        logger.error(
          '获取下载文件信息失败',
          error instanceof Error ? error : new Error(String(error))
        )
      }

      // 实现解压逻辑（根据平台和文件格式）
      logger.info('开始解压 FFmpeg...', { downloadPath, ffmpegDir })

      try {
        if (platform === 'darwin' || platform === 'win32') {
          // 解压 ZIP 文件
          await this.extractZipFile(downloadPath, ffmpegDir)
        } else if (platform === 'linux') {
          // 解压 TAR.XZ 文件
          await this.extractTarFile(downloadPath, ffmpegDir)
        }

        logger.info('FFmpeg 解压完成', { ffmpegDir })

        // 查找解压后的可执行文件
        await this.findAndMoveExecutable(ffmpegDir, downloadInfo.executable)
      } catch (error) {
        logger.error('解压 FFmpeg 失败:', error instanceof Error ? error : new Error(String(error)))
        throw error
      }

      return true
    } catch (error) {
      logger.error('下载 FFmpeg 失败:', error instanceof Error ? error : new Error(String(error)))
      throw error
    }
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

  // 解析 FFmpeg 进度输出
  private parseFFmpegProgress(line: string, duration?: number): Partial<TranscodeProgress> | null {
    // frame=  123 fps= 25 q=28.0 size=    1024kB time=00:00:04.92 bitrate=1703.5kbits/s speed=   1x
    const fpsMatch = line.match(/fps=\s*([\d.]+)/)
    const timeMatch = line.match(/time=(\d{2}):(\d{2}):(\d{2})\.(\d{2})/)
    const bitrateMatch = line.match(/bitrate=\s*([\d.]+\w+\/s)/)
    const speedMatch = line.match(/speed=\s*([\d.]+x)/)

    if (!timeMatch) return null

    const currentTime =
      parseInt(timeMatch[1]) * 3600 +
      parseInt(timeMatch[2]) * 60 +
      parseInt(timeMatch[3]) +
      parseInt(timeMatch[4]) / 100
    const progress = duration ? Math.min((currentTime / duration) * 100, 100) : 0

    return {
      progress,
      time: `${timeMatch[1]}:${timeMatch[2]}:${timeMatch[3]}`,
      fps: fpsMatch ? fpsMatch[1] : '0',
      bitrate: bitrateMatch ? bitrateMatch[1] : '0kb/s',
      speed: speedMatch ? speedMatch[1] : '0x'
    }
  }

  // 获取视频信息
  public async getVideoInfo(inputPath: string): Promise<{
    duration: number
    videoCodec: string
    audioCodec: string
    resolution: string
    bitrate: string
  } | null> {
    const startTime = Date.now()
    logger.info('🎬 开始获取视频信息', { inputPath })

    const ffmpegPath = this.getFFmpegPath()

    // 转换file://URL为本地路径
    const pathConvertStartTime = Date.now()
    const localInputPath = this.convertFileUrlToLocalPath(inputPath)
    const pathConvertEndTime = Date.now()
    logger.info(`🔄 路径转换耗时: ${pathConvertEndTime - pathConvertStartTime}ms`, {
      原始输入路径: inputPath,
      转换后本地路径: localInputPath
    })

    // 检查文件是否存在
    const fileCheckStartTime = Date.now()
    const fileExists = fs.existsSync(localInputPath)
    const fileCheckEndTime = Date.now()
    logger.info(`📁 文件存在性检查耗时: ${fileCheckEndTime - fileCheckStartTime}ms`, {
      FFmpeg路径: ffmpegPath,
      文件存在性: fileExists
    })

    if (!fileExists) {
      logger.error(`❌ 文件不存在: ${localInputPath}`)
      return null
    }

    // 使用 FFmpeg 获取视频信息，仅指定输入文件即可
    const args = ['-i', localInputPath]

    logger.info('🚀 启动 FFmpeg 命令获取视频信息', {
      command: ffmpegPath,
      args: args,
      fullCommand: `"${ffmpegPath}" ${args.map((arg) => `"${arg}"`).join(' ')}`
    })

    return new Promise((resolve) => {
      const ffmpegStartTime = Date.now()
      const ffmpeg = spawn(ffmpegPath, args)

      let errorOutput = ''

      // FFmpeg 输出视频信息到 stderr
      ffmpeg.stderr.on('data', (data) => {
        errorOutput += data.toString()
      })

      ffmpeg.on('close', (code) => {
        const ffmpegEndTime = Date.now()
        const ffmpegDuration = ffmpegEndTime - ffmpegStartTime

        logger.info('📊 FFmpeg 执行结果', {
          exitCode: code,
          hasErrorOutput: errorOutput.length > 0,
          errorOutputLength: errorOutput.length,
          ffmpeg执行耗时: `${ffmpegDuration}ms`
        })

        // FFmpeg 返回 1 是正常的（因为没有输出文件），视频信息在 stderr 中
        if (code === 1) {
          // code 1 是正常的（因为没有指定输出文件）
          try {
            const parseStartTime = Date.now()
            // 解析 FFmpeg 输出中的视频信息
            const info = this.parseFFmpegVideoInfo(errorOutput)
            const parseEndTime = Date.now()

            logger.info(`🔍 视频信息解析耗时: ${parseEndTime - parseStartTime}ms`)

            if (info) {
              const totalTime = Date.now() - startTime
              logger.info(`✅ 成功获取视频信息，总耗时: ${totalTime}ms`, {
                ...info,
                性能统计: {
                  路径转换: `${pathConvertEndTime - pathConvertStartTime}ms`,
                  文件检查: `${fileCheckEndTime - fileCheckStartTime}ms`,
                  FFmpeg执行: `${ffmpegDuration}ms`,
                  信息解析: `${parseEndTime - parseStartTime}ms`,
                  总耗时: `${totalTime}ms`
                }
              })
              resolve(info)
            } else {
              logger.error('❌ 无法解析视频信息')
              resolve(null)
            }
          } catch (error) {
            logger.error(
              `❌ 解析视频信息失败: ${error instanceof Error ? error.message : String(error)}`
            )
            resolve(null)
          }
        } else {
          logger.error(
            `❌ FFmpeg 执行失败: 退出代码 ${code}, 错误输出: ${errorOutput.substring(0, 500)}, 命令: "${ffmpegPath}" ${args.map((arg) => `"${arg}"`).join(' ')}`
          )
          resolve(null)
        }
      })

      ffmpeg.on('error', (error) => {
        logger.error(
          `❌ FFmpeg 进程启动失败: ${error.message}, FFmpeg路径: ${ffmpegPath}, 参数: ${args.join(' ')}`
        )
        resolve(null)
      })
    })
  }

  // 转码视频
  public async transcodeVideo(
    inputPath: string,
    outputPath: string,
    options: TranscodeOptions = {},
    onProgress?: (progress: TranscodeProgress) => void
  ): Promise<boolean> {
    const ffmpegPath = this.getFFmpegPath()

    // 转换file://URL为本地路径
    const localInputPath = this.convertFileUrlToLocalPath(inputPath)
    const localOutputPath = this.convertFileUrlToLocalPath(outputPath)

    // 确保输出目录存在
    const outputDir = path.dirname(localOutputPath)
    try {
      await fs.promises.mkdir(outputDir, { recursive: true })
      logger.info('输出目录已创建', { outputDir })
    } catch (error) {
      logger.error('创建输出目录失败:', error instanceof Error ? error : new Error(String(error)))
      throw new Error(`无法创建输出目录: ${outputDir}`)
    }

    const {
      videoCodec = 'libx264',
      audioCodec = 'aac',
      videoBitrate,
      audioBitrate = '128k',
      crf = 23,
      preset = 'fast'
    } = options

    // 构建 FFmpeg 命令
    const args = ['-i', localInputPath, '-y'] // -y 覆盖输出文件

    // 视频编码参数
    if (videoCodec === 'copy') {
      args.push('-c:v', 'copy')
    } else {
      args.push('-c:v', videoCodec)
      if (videoCodec === 'libx264' || videoCodec === 'libx265') {
        args.push('-crf', crf.toString())
        args.push('-preset', preset)
      }
      if (videoBitrate) {
        args.push('-b:v', videoBitrate)
      }
    }

    // 音频编码参数
    if (audioCodec === 'copy') {
      args.push('-c:a', 'copy')
    } else {
      args.push('-c:a', audioCodec)
      args.push('-b:a', audioBitrate)
    }

    // 进度报告
    args.push('-progress', 'pipe:1')
    args.push(localOutputPath)

    // 获取视频信息用于计算进度
    const videoInfo = await this.getVideoInfo(inputPath)
    const duration = videoInfo?.duration || 0

    return new Promise((resolve, reject) => {
      logger.info('开始转码...', {
        原始输入路径: inputPath,
        本地输入路径: localInputPath,
        原始输出路径: outputPath,
        本地输出路径: localOutputPath,
        命令参数: args
      })

      const ffmpeg = spawn(ffmpegPath, args)
      this.currentTranscodeProcess = ffmpeg // 保存当前转码进程引用
      this.isTranscodeCancelled = false // 重置取消标志
      let hasError = false

      ffmpeg.stdout.on('data', (data) => {
        const lines = data.toString().split('\n')
        for (const line of lines) {
          if (line.includes('progress=')) {
            const progress = this.parseFFmpegProgress(line, duration)
            if (progress && onProgress) {
              onProgress(progress as TranscodeProgress)
            }
          }
        }
      })

      ffmpeg.stderr.on('data', (data) => {
        const line = data.toString()
        logger.debug('FFmpeg stderr:', line)

        // 解析进度信息（有些信息在 stderr 中）
        const progress = this.parseFFmpegProgress(line, duration)
        if (progress && onProgress) {
          onProgress(progress as TranscodeProgress)
        }
      })

      ffmpeg.on('close', (code) => {
        this.currentTranscodeProcess = null // 清除进程引用

        // 清理强制终止超时
        if (this.forceKillTimeout) {
          clearTimeout(this.forceKillTimeout)
          this.forceKillTimeout = null
        }

        if (code === 0 && !hasError) {
          logger.info('转码完成')
          resolve(true)
        } else if (this.isTranscodeCancelled && (code === 255 || code === 130 || code === 143)) {
          // 用户主动取消转码，退出代码255(SIGTERM)、130(SIGINT)、143(SIGTERM)都是正常的
          logger.info('转码已被用户取消', { exitCode: code })
          this.isTranscodeCancelled = false // 重置标志
          reject(new Error('转码已被用户取消'))
        } else {
          const errorMessage = `转码失败，退出代码: ${code}`
          logger.error(errorMessage)
          reject(new Error(errorMessage))
        }
      })

      ffmpeg.on('error', (error) => {
        hasError = true
        this.currentTranscodeProcess = null // 清除进程引用

        // 清理强制终止超时
        if (this.forceKillTimeout) {
          clearTimeout(this.forceKillTimeout)
          this.forceKillTimeout = null
        }

        logger.error('FFmpeg 进程错误:', error)
        reject(error)
      })
    })
  }

  // 取消当前转码进程
  public cancelTranscode(): boolean {
    if (this.currentTranscodeProcess && !this.currentTranscodeProcess.killed) {
      logger.info('正在取消转码进程...', { pid: this.currentTranscodeProcess.pid })

      try {
        // 设置取消标志
        this.isTranscodeCancelled = true

        // 清理之前的强制终止超时（如果存在）
        if (this.forceKillTimeout) {
          clearTimeout(this.forceKillTimeout)
          this.forceKillTimeout = null
        }

        // 尝试优雅地终止进程
        this.currentTranscodeProcess.kill('SIGTERM')

        // 如果优雅终止失败，强制终止
        this.forceKillTimeout = setTimeout(() => {
          if (this.currentTranscodeProcess && !this.currentTranscodeProcess.killed) {
            logger.warn('优雅终止失败，强制终止转码进程', { pid: this.currentTranscodeProcess.pid })
            this.currentTranscodeProcess.kill('SIGKILL')
          }
          this.forceKillTimeout = null
        }, 5000) // 5秒后强制终止

        logger.info('转码取消信号已发送')
        return true
      } catch (error) {
        logger.error('取消转码进程失败:', error instanceof Error ? error : new Error(String(error)))
        this.isTranscodeCancelled = false // 重置标志
        return false
      }
    } else {
      logger.warn('没有正在运行的转码进程需要取消')
      return false
    }
  }
}

export default FFmpegService
