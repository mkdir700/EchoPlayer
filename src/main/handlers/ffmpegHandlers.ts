import { ipcMain, app } from 'electron'
import { spawn, ChildProcess } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'
import * as https from 'https'
import { createWriteStream } from 'fs'
import { Logger } from '../utils/logger'
import { getAppConfig } from './store'
import type { ApiResponse, TranscodeProgress, TranscodeOptions } from '../../types/shared'

// 全局变量用于管理正在进行的转码进程 / Global variable to manage ongoing transcoding processes
let currentTranscodeProcess: ChildProcess | null = null
let isTranscodeCancelled = false // 标记转码是否被用户主动取消 / Flag to mark if transcoding was cancelled by user
let forceKillTimeout: NodeJS.Timeout | null = null // 强制终止超时句柄 / Force kill timeout handle

// FFmpeg 下载 URL（跨平台）/ FFmpeg download URLs (cross-platform)
const FFMPEG_DOWNLOAD_URLS = {
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

// 获取用户数据目录 / Get user data directory
function getUserDataDirectory(): string {
  try {
    // 从应用配置中获取用户设置的数据目录
    const appConfig = getAppConfig()
    return appConfig.dataDirectory
  } catch (error) {
    // 如果读取配置失败，使用默认目录
    Logger.warn('获取用户配置的数据目录失败，使用默认目录:', error)
    return path.join(app.getPath('userData'), 'data')
  }
}

// 生成输出文件路径 / Generate output file path
function generateOutputPath(inputPath: string, outputFormat: string = 'mp4'): string {
  // 转换file://URL为本地路径 / Convert file:// URL to local path
  const localInputPath = convertFileUrlToLocalPath(inputPath)

  // 获取原视频文件的目录 / Get directory of original video file
  const inputDir = path.dirname(localInputPath)

  // 从本地路径提取文件名，确保已解码 / Extract filename from local path to ensure it's decoded
  const localFileName = path.basename(localInputPath)
  const originalName = path.parse(localFileName).name

  // 生成时间戳 / Generate timestamp
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')

  // 生成输出文件名 / Generate output filename
  const outputFilename = `${originalName}_transcoded_${timestamp}.${outputFormat}`

  // 将输出文件放在原视频的同目录下 / Place output file in same directory as original video
  const outputPath = path.join(inputDir, outputFilename)

  Logger.info('生成输出路径', {
    输入路径: inputPath,
    本地输入路径: localInputPath,
    输入目录: inputDir,
    本地文件名: localFileName,
    原始文件名: originalName,
    输出文件名: outputFilename,
    输出路径: outputPath
  })

  return outputPath
}

// 将file://URL转换为本地文件路径 / Convert file:// URL to local file path
function convertFileUrlToLocalPath(inputPath: string): string {
  // 如果是file://URL，需要转换为本地路径
  if (inputPath.startsWith('file://')) {
    try {
      const url = new URL(inputPath)
      let localPath = decodeURIComponent(url.pathname)

      // Windows路径处理：移除开头的斜杠
      if (process.platform === 'win32' && localPath.startsWith('/')) {
        localPath = localPath.substring(1)
      }

      // 添加详细的调试信息 / Add detailed debug information
      Logger.info('🔄 URL路径转换详情', {
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

        Logger.info('🔍 文件不存在，检查目录内容', {
          目录路径: dirPath,
          期望文件名: fileName,
          目录是否存在: fs.existsSync(dirPath)
        })

        if (fs.existsSync(dirPath)) {
          try {
            const filesInDir = fs.readdirSync(dirPath)
            Logger.info('📁 目录中的文件', {
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
              Logger.info('🎯 找到可能匹配的文件', { matchingFiles })
            }
          } catch (error) {
            Logger.error(
              '无法读取目录内容:',
              error instanceof Error ? error : new Error(String(error))
            )
          }
        }
      }

      return localPath
    } catch (error) {
      Logger.error('URL路径转换失败:', error instanceof Error ? error : new Error(String(error)))
      // 如果转换失败，返回原路径
      return inputPath
    }
  }

  // 如果不是file://URL，直接返回
  return inputPath
}

// 解压 ZIP 文件 / Extract ZIP file
async function extractZipFile(zipPath: string, extractDir: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (process.platform === 'win32') {
      // Windows 使用 PowerShell 的 Expand-Archive 命令 / Use PowerShell's Expand-Archive on Windows
      const powershellCommand = `Expand-Archive -Path "${zipPath}" -DestinationPath "${extractDir}" -Force`
      const powershell = spawn('powershell.exe', ['-Command', powershellCommand], {
        windowsHide: true
      })

      powershell.stdout.on('data', (data) => {
        Logger.info('PowerShell 解压输出:', data.toString())
      })

      powershell.stderr.on('data', (data) => {
        Logger.warn('PowerShell 解压警告:', data.toString())
      })

      powershell.on('close', (code) => {
        if (code === 0) {
          Logger.info('ZIP 解压成功 (PowerShell)')
          resolve()
        } else {
          reject(new Error(`PowerShell 解压失败，退出代码: ${code}`))
        }
      })

      powershell.on('error', (error) => {
        reject(new Error(`PowerShell 解压命令执行失败: ${error.message}`))
      })
    } else {
      // macOS/Linux 使用 unzip 命令 / Use unzip command on macOS/Linux
      const unzip = spawn('unzip', ['-o', zipPath, '-d', extractDir])

      unzip.stdout.on('data', (data) => {
        Logger.info('解压输出:', data.toString())
      })

      unzip.stderr.on('data', (data) => {
        Logger.warn('解压警告:', data.toString())
      })

      unzip.on('close', (code) => {
        if (code === 0) {
          Logger.info('ZIP 解压成功')
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

// 解压 TAR.XZ 文件 / Extract TAR.XZ file
async function extractTarFile(tarPath: string, extractDir: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const tar = spawn('tar', ['-xJf', tarPath, '-C', extractDir])

    tar.stdout.on('data', (data) => {
      Logger.info('解压输出:', data.toString())
    })

    tar.stderr.on('data', (data) => {
      Logger.warn('解压警告:', data.toString())
    })

    tar.on('close', (code) => {
      if (code === 0) {
        Logger.info('TAR.XZ 解压成功')
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

// 查找并移动可执行文件 / Find and move executable file
async function findAndMoveExecutable(extractDir: string, executableName: string): Promise<void> {
  const targetPath = getFFmpegPath()

  try {
    // 递归查找可执行文件 / Recursively find executable file
    const foundPath = await findExecutableRecursively(extractDir, executableName)

    if (!foundPath) {
      throw new Error(`在解压目录中未找到可执行文件: ${executableName}`)
    }

    Logger.info('找到可执行文件', { foundPath, targetPath })

    // 移动文件到目标位置 / Move file to target location
    await fs.promises.copyFile(foundPath, targetPath)

    // 设置执行权限 / Set executable permissions
    await fs.promises.chmod(targetPath, 0o755)

    Logger.info('FFmpeg 可执行文件安装完成', { targetPath })
  } catch (error) {
    Logger.error(
      '查找或移动可执行文件失败:',
      error instanceof Error ? error : new Error(String(error))
    )
    throw error
  }
}

// 递归查找可执行文件 / Recursively find executable file
async function findExecutableRecursively(
  dir: string,
  executableName: string
): Promise<string | null> {
  try {
    const items = await fs.promises.readdir(dir, { withFileTypes: true })

    for (const item of items) {
      const fullPath = path.join(dir, item.name)

      if (item.isDirectory()) {
        // 递归搜索子目录 / Recursively search subdirectories
        const found = await findExecutableRecursively(fullPath, executableName)
        if (found) return found
      } else if (item.isFile() && item.name === executableName) {
        // 找到目标文件 / Found target file
        return fullPath
      }
    }

    return null
  } catch (error) {
    Logger.error(`搜索目录失败: ${dir}`, error instanceof Error ? error : new Error(String(error)))
    return null
  }
}

// 获取 FFmpeg 可执行文件路径 / Get FFmpeg executable path
function getFFmpegPath(): string {
  const dataDir = getUserDataDirectory()
  const platform = process.platform as keyof typeof FFMPEG_DOWNLOAD_URLS
  const executable = FFMPEG_DOWNLOAD_URLS[platform]?.executable || 'ffmpeg'
  return path.join(dataDir, 'ffmpeg', executable)
}

// 检查 FFmpeg 是否存在 / Check if FFmpeg exists
async function checkFFmpegExists(): Promise<boolean> {
  const ffmpegPath = getFFmpegPath()
  const dataDir = getUserDataDirectory()
  const ffmpegDir = path.join(dataDir, 'ffmpeg')

  Logger.info('检查 FFmpeg 是否存在', {
    ffmpegPath,
    dataDir,
    ffmpegDir,
    platform: process.platform
  })

  try {
    // 检查目录是否存在
    const dirExists = await fs.promises
      .access(ffmpegDir, fs.constants.F_OK)
      .then(() => true)
      .catch(() => false)
    Logger.info('FFmpeg 目录检查结果', { ffmpegDir, dirExists })

    if (dirExists) {
      // 列出目录中的文件
      try {
        const files = await fs.promises.readdir(ffmpegDir)
        Logger.info('FFmpeg 目录内容', { files })
      } catch (error) {
        Logger.error(
          '读取 FFmpeg 目录失败',
          error instanceof Error ? error : new Error(String(error))
        )
      }
    }

    // 检查可执行文件
    await fs.promises.access(ffmpegPath, fs.constants.F_OK | fs.constants.X_OK)
    Logger.info('FFmpeg 可执行文件存在', { ffmpegPath })
    return true
  } catch (error) {
    Logger.warn('FFmpeg 可执行文件不存在', {
      ffmpegPath,
      error: error instanceof Error ? error.message : String(error)
    })
    return false
  }
}

// 获取 FFmpeg 版本信息 / Get FFmpeg version info
async function getFFmpegVersion(): Promise<string | null> {
  const ffmpegPath = getFFmpegPath()

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

// 下载 FFmpeg / Download FFmpeg
async function downloadFFmpeg(onProgress?: (progress: number) => void): Promise<boolean> {
  const platform = process.platform as keyof typeof FFMPEG_DOWNLOAD_URLS
  const downloadInfo = FFMPEG_DOWNLOAD_URLS[platform]

  if (!downloadInfo) {
    throw new Error(`不支持的平台: ${platform}`)
  }

  const dataDir = getUserDataDirectory()
  const ffmpegDir = path.join(dataDir, 'ffmpeg')

  // 确保目录存在 / Ensure directory exists
  await fs.promises.mkdir(ffmpegDir, { recursive: true })

  const downloadPath = path.join(ffmpegDir, `ffmpeg-download.${downloadInfo.url.split('.').pop()}`)

  try {
    Logger.info('开始下载 FFmpeg...', { url: downloadInfo.url, path: downloadPath })

    // 下载文件，支持重定向 / Download file with redirect support
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
                'User-Agent': 'EchoLab/1.0.0 (Electron FFmpeg Downloader)'
              }
            },
            (response) => {
              // 处理重定向 / Handle redirects
              if (response.statusCode === 301 || response.statusCode === 302) {
                const redirectUrl = response.headers.location
                if (redirectUrl) {
                  Logger.info(`处理重定向: ${response.statusCode}`, {
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

              // 检查最终响应状态 / Check final response status
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

              Logger.info('开始接收文件数据', {
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
                    Logger.debug('下载进度更新', {
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
                Logger.info('文件下载完成', {
                  finalSize: downloadedSize,
                  expectedSize: totalSize
                })
                resolve()
              })

              fileStream.on('error', (error) => {
                cleanup()
                Logger.error('文件写入错误:', error)
                reject(error)
              })

              response.on('error', (error) => {
                cleanup()
                Logger.error('响应流错误:', error)
                reject(error)
              })
            }
          )
          .on('error', (error) => {
            cleanup()
            Logger.error('请求错误:', error)
            reject(error)
          })
          .on('timeout', () => {
            cleanup()
            request.destroy()
            reject(new Error('连接超时: 请检查网络连接'))
          })
      }

      // 开始下载 / Start download
      downloadFile(downloadInfo.url)
    })

    Logger.info('FFmpeg 下载完成', {
      downloadPath,
      ffmpegDir,
      platform,
      targetExecutable: getFFmpegPath()
    })

    // 检查下载的文件是否存在
    const downloadedFileExists = await fs.promises
      .access(downloadPath, fs.constants.F_OK)
      .then(() => true)
      .catch(() => false)
    Logger.info('下载文件检查结果', { downloadPath, exists: downloadedFileExists })

    if (!downloadedFileExists) {
      throw new Error('下载的文件不存在')
    }

    // 获取下载文件的信息
    try {
      const stats = await fs.promises.stat(downloadPath)
      Logger.info('下载文件信息', {
        size: stats.size,
        isFile: stats.isFile(),
        path: downloadPath
      })
    } catch (error) {
      Logger.error(
        '获取下载文件信息失败',
        error instanceof Error ? error : new Error(String(error))
      )
    }

    // 实现解压逻辑（根据平台和文件格式）/ Implement extraction logic
    Logger.info('开始解压 FFmpeg...', { downloadPath, ffmpegDir })

    try {
      if (platform === 'darwin' || platform === 'win32') {
        // 解压 ZIP 文件 / Extract ZIP file
        await extractZipFile(downloadPath, ffmpegDir)
      } else if (platform === 'linux') {
        // 解压 TAR.XZ 文件 / Extract TAR.XZ file
        await extractTarFile(downloadPath, ffmpegDir)
      }

      Logger.info('FFmpeg 解压完成', { ffmpegDir })

      // 查找解压后的可执行文件 / Find extracted executable
      await findAndMoveExecutable(ffmpegDir, downloadInfo.executable)
    } catch (error) {
      Logger.error('解压 FFmpeg 失败:', error instanceof Error ? error : new Error(String(error)))
      throw error
    }

    return true
  } catch (error) {
    Logger.error('下载 FFmpeg 失败:', error instanceof Error ? error : new Error(String(error)))
    throw error
  }
}

// 解析 FFmpeg 进度输出 / Parse FFmpeg progress output
// 解析 FFmpeg 输出中的视频信息 / Parse video info from FFmpeg output
function parseFFmpegVideoInfo(output: string): {
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
      Logger.error('❌ 未找到视频流信息')
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

    Logger.info('🎬 解析的视频信息', {
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
    Logger.error('解析 FFmpeg 输出失败:', error instanceof Error ? error : new Error(String(error)))
    return null
  }
}

function parseFFmpegProgress(line: string, duration?: number): Partial<TranscodeProgress> | null {
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

// 获取视频信息 / Get video information
async function getVideoInfo(inputPath: string): Promise<{
  duration: number
  videoCodec: string
  audioCodec: string
  resolution: string
  bitrate: string
} | null> {
  const ffmpegPath = getFFmpegPath()

  // 转换file://URL为本地路径 / Convert file:// URL to local path
  const localInputPath = convertFileUrlToLocalPath(inputPath)

  // 添加详细调试信息 / Add detailed debug information
  Logger.info('🔍 getVideoInfo 调试信息', {
    原始输入路径: inputPath,
    转换后本地路径: localInputPath,
    FFmpeg路径: ffmpegPath,
    文件存在性: fs.existsSync(localInputPath)
  })

  // 检查文件是否存在 / Check if file exists
  if (!fs.existsSync(localInputPath)) {
    Logger.error(`❌ 文件不存在: ${localInputPath}`)
    return null
  }

  // 使用 FFmpeg 获取视频信息，仅指定输入文件即可
  const args = ['-i', localInputPath]

  Logger.info('🚀 启动 FFmpeg 命令获取视频信息', {
    command: ffmpegPath,
    args: args,
    fullCommand: `"${ffmpegPath}" ${args.map((arg) => `"${arg}"`).join(' ')}`
  })

  return new Promise((resolve) => {
    const ffmpeg = spawn(ffmpegPath, args)

    let errorOutput = ''

    // FFmpeg 输出视频信息到 stderr
    ffmpeg.stderr.on('data', (data) => {
      errorOutput += data.toString()
    })

    ffmpeg.on('close', (code) => {
      Logger.info('📊 FFmpeg 执行结果', {
        exitCode: code,
        hasErrorOutput: errorOutput.length > 0,
        errorOutputLength: errorOutput.length
      })

      // FFmpeg 返回 1 是正常的（因为没有输出文件），视频信息在 stderr 中
      if (code === 1) {
        // code 1 是正常的（因为没有指定输出文件）
        try {
          // 解析 FFmpeg 输出中的视频信息
          const info = parseFFmpegVideoInfo(errorOutput)

          if (info) {
            Logger.info('✅ 成功获取视频信息', info)
            resolve(info)
          } else {
            Logger.error('❌ 无法解析视频信息')
            resolve(null)
          }
        } catch (error) {
          Logger.error(
            `❌ 解析视频信息失败: ${error instanceof Error ? error.message : String(error)}`
          )
          resolve(null)
        }
      } else {
        Logger.error(
          `❌ FFmpeg 执行失败: 退出代码 ${code}, 错误输出: ${errorOutput.substring(0, 500)}, 命令: "${ffmpegPath}" ${args.map((arg) => `"${arg}"`).join(' ')}`
        )
        resolve(null)
      }
    })

    ffmpeg.on('error', (error) => {
      Logger.error(
        `❌ FFmpeg 进程启动失败: ${error.message}, FFmpeg路径: ${ffmpegPath}, 参数: ${args.join(' ')}`
      )
      resolve(null)
    })
  })
}

// 转码视频 / Transcode video
async function transcodeVideo(
  inputPath: string,
  outputPath: string,
  options: TranscodeOptions = {},
  onProgress?: (progress: TranscodeProgress) => void
): Promise<boolean> {
  const ffmpegPath = getFFmpegPath()

  // 转换file://URL为本地路径 / Convert file:// URL to local path
  const localInputPath = convertFileUrlToLocalPath(inputPath)
  const localOutputPath = convertFileUrlToLocalPath(outputPath)

  // 确保输出目录存在 / Ensure output directory exists
  const outputDir = path.dirname(localOutputPath)
  try {
    await fs.promises.mkdir(outputDir, { recursive: true })
    Logger.info('输出目录已创建', { outputDir })
  } catch (error) {
    Logger.error('创建输出目录失败:', error instanceof Error ? error : new Error(String(error)))
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

  // 构建 FFmpeg 命令 / Build FFmpeg command
  const args = ['-i', localInputPath, '-y'] // -y 覆盖输出文件

  // 视频编码参数 / Video encoding parameters
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

  // 音频编码参数 / Audio encoding parameters
  if (audioCodec === 'copy') {
    args.push('-c:a', 'copy')
  } else {
    args.push('-c:a', audioCodec)
    args.push('-b:a', audioBitrate)
  }

  // 进度报告 / Progress reporting
  args.push('-progress', 'pipe:1')
  args.push(localOutputPath)

  // 获取视频信息用于计算进度 / Get video info for progress calculation
  const videoInfo = await getVideoInfo(inputPath)
  const duration = videoInfo?.duration || 0

  return new Promise((resolve, reject) => {
    Logger.info('开始转码...', {
      原始输入路径: inputPath,
      本地输入路径: localInputPath,
      原始输出路径: outputPath,
      本地输出路径: localOutputPath,
      命令参数: args
    })

    const ffmpeg = spawn(ffmpegPath, args)
    currentTranscodeProcess = ffmpeg // 保存当前转码进程引用 / Save current transcoding process reference
    isTranscodeCancelled = false // 重置取消标志 / Reset cancellation flag
    let hasError = false

    ffmpeg.stdout.on('data', (data) => {
      const lines = data.toString().split('\n')
      for (const line of lines) {
        if (line.includes('progress=')) {
          const progress = parseFFmpegProgress(line, duration)
          if (progress && onProgress) {
            onProgress(progress as TranscodeProgress)
          }
        }
      }
    })

    ffmpeg.stderr.on('data', (data) => {
      const line = data.toString()
      Logger.debug('FFmpeg stderr:', line)

      // 解析进度信息（有些信息在 stderr 中）
      const progress = parseFFmpegProgress(line, duration)
      if (progress && onProgress) {
        onProgress(progress as TranscodeProgress)
      }
    })

    ffmpeg.on('close', (code) => {
      currentTranscodeProcess = null // 清除进程引用 / Clear process reference

      // 清理强制终止超时 / Clear force kill timeout
      if (forceKillTimeout) {
        clearTimeout(forceKillTimeout)
        forceKillTimeout = null
      }

      if (code === 0 && !hasError) {
        Logger.info('转码完成')
        resolve(true)
      } else if (isTranscodeCancelled && (code === 255 || code === 130 || code === 143)) {
        // 用户主动取消转码，退出代码255(SIGTERM)、130(SIGINT)、143(SIGTERM)都是正常的
        Logger.info('转码已被用户取消', { exitCode: code })
        isTranscodeCancelled = false // 重置标志
        reject(new Error('转码已被用户取消'))
      } else {
        const errorMessage = `转码失败，退出代码: ${code}`
        Logger.error(errorMessage)
        reject(new Error(errorMessage))
      }
    })

    ffmpeg.on('error', (error) => {
      hasError = true
      currentTranscodeProcess = null // 清除进程引用 / Clear process reference

      // 清理强制终止超时 / Clear force kill timeout
      if (forceKillTimeout) {
        clearTimeout(forceKillTimeout)
        forceKillTimeout = null
      }

      Logger.error('FFmpeg 进程错误:', error)
      reject(error)
    })
  })
}

// 取消当前转码进程 / Cancel current transcoding process
function cancelTranscode(): boolean {
  if (currentTranscodeProcess && !currentTranscodeProcess.killed) {
    Logger.info('正在取消转码进程...', { pid: currentTranscodeProcess.pid })

    try {
      // 设置取消标志 / Set cancellation flag
      isTranscodeCancelled = true

      // 清理之前的强制终止超时（如果存在）/ Clear previous force kill timeout if exists
      if (forceKillTimeout) {
        clearTimeout(forceKillTimeout)
        forceKillTimeout = null
      }

      // 尝试优雅地终止进程 / Try to terminate process gracefully
      currentTranscodeProcess.kill('SIGTERM')

      // 如果优雅终止失败，强制终止 / Force kill if graceful termination fails
      forceKillTimeout = setTimeout(() => {
        if (currentTranscodeProcess && !currentTranscodeProcess.killed) {
          Logger.warn('优雅终止失败，强制终止转码进程', { pid: currentTranscodeProcess.pid })
          currentTranscodeProcess.kill('SIGKILL')
        }
        forceKillTimeout = null
      }, 5000) // 5秒后强制终止

      Logger.info('转码取消信号已发送')
      return true
    } catch (error) {
      Logger.error('取消转码进程失败:', error instanceof Error ? error : new Error(String(error)))
      isTranscodeCancelled = false // 重置标志
      return false
    }
  } else {
    Logger.warn('没有正在运行的转码进程需要取消')
    return false
  }
}

// 设置 FFmpeg 相关的 IPC 处理器 / Setup FFmpeg-related IPC handlers
export function setupFFmpegHandlers(): void {
  // 检查 FFmpeg 是否存在
  ipcMain.handle('ffmpeg:check-exists', async (): Promise<boolean> => {
    try {
      return await checkFFmpegExists()
    } catch (error) {
      Logger.error(
        '检查 FFmpeg 存在性失败:',
        error instanceof Error ? error : new Error(String(error))
      )
      return false
    }
  })

  // 获取 FFmpeg 版本信息
  ipcMain.handle('ffmpeg:get-version', async (): Promise<string | null> => {
    try {
      return await getFFmpegVersion()
    } catch (error) {
      Logger.error(
        '获取 FFmpeg 版本失败:',
        error instanceof Error ? error : new Error(String(error))
      )
      return null
    }
  })

  // 下载 FFmpeg
  ipcMain.handle('ffmpeg:download', async (event): Promise<ApiResponse> => {
    try {
      const success = await downloadFFmpeg((progress) => {
        // 发送下载进度到渲染进程 / Send download progress to renderer process
        event.sender.send('ffmpeg:download-progress', progress)
      })

      return { success }
    } catch (error) {
      Logger.error('下载 FFmpeg 失败:', error instanceof Error ? error : new Error(String(error)))
      return {
        success: false,
        error: error instanceof Error ? error.message : '下载失败'
      }
    }
  })

  // 获取视频信息
  ipcMain.handle('ffmpeg:get-video-info', async (_, inputPath: string) => {
    try {
      return await getVideoInfo(inputPath)
    } catch (error) {
      Logger.error('获取视频信息失败:', error instanceof Error ? error : new Error(String(error)))
      return null
    }
  })

  // 转码视频
  ipcMain.handle(
    'ffmpeg:transcode',
    async (
      event,
      inputPath: string,
      outputPath?: string,
      options: TranscodeOptions = {}
    ): Promise<ApiResponse & { outputPath?: string }> => {
      try {
        // 如果没有提供输出路径，自动生成一个
        const finalOutputPath = outputPath || generateOutputPath(inputPath, 'mp4')

        const success = await transcodeVideo(inputPath, finalOutputPath, options, (progress) => {
          // 发送转码进度到渲染进程 / Send transcode progress to renderer process
          event.sender.send('ffmpeg:transcode-progress', progress)
        })

        // 转换本地路径为file://URL格式，确保中文文件名正确显示
        let fileUrl: string
        try {
          // 确保路径格式正确：移除多余的斜杠，处理中文字符
          const normalizedPath = finalOutputPath.replace(/\\/g, '/').replace(/^\/+/, '/')

          // 使用 file:// 协议构造 URL，自动处理编码
          if (process.platform === 'win32') {
            // Windows: file:///C:/path/to/file
            fileUrl = new URL(`file:///${normalizedPath}`).href
          } else {
            // macOS/Linux: file:///path/to/file
            fileUrl = new URL(`file://${normalizedPath}`).href
          }

          Logger.info('转码完成，返回文件URL', {
            本地路径: finalOutputPath,
            标准化路径: normalizedPath,
            'file://URL': fileUrl
          })
        } catch (urlError) {
          // 如果 URL 构造失败，降级使用简单的 file:// 拼接
          Logger.warn('URL 构造失败，使用降级方案', {
            路径: finalOutputPath,
            错误: urlError instanceof Error ? urlError.message : String(urlError)
          })

          const normalizedPath = finalOutputPath.replace(/\\/g, '/')
          fileUrl = `file://${normalizedPath.startsWith('/') ? '' : '/'}${normalizedPath}`

          Logger.info('使用降级方案生成文件URL', {
            本地路径: finalOutputPath,
            'file://URL': fileUrl
          })
        }

        return { success, outputPath: fileUrl }
      } catch (error) {
        Logger.error('转码失败:', error instanceof Error ? error : new Error(String(error)))
        return {
          success: false,
          error: error instanceof Error ? error.message : '转码失败'
        }
      }
    }
  )

  // 获取 FFmpeg 路径
  ipcMain.handle('ffmpeg:get-path', (): string => {
    return getFFmpegPath()
  })

  // 获取用户数据目录
  ipcMain.handle('ffmpeg:get-data-directory', (): string => {
    return getUserDataDirectory()
  })

  // 取消转码 / Cancel transcoding
  ipcMain.handle('ffmpeg:cancel-transcode', (): boolean => {
    return cancelTranscode()
  })
}
