/**
 * FFmpeg 本地客户端 / FFmpeg Native Client
 * 用于与主进程的本地 FFmpeg 进行通信 / Used to communicate with native FFmpeg in main process
 */

import type { ApiResponse } from '../../../types/shared'

// 转码进度接口 / Transcoding progress interface
export interface TranscodeProgress {
  progress: number // 0-100
  time: string
  speed: string
  fps: string
  bitrate: string
  eta?: string
}

// 转码选项接口 / Transcoding options interface
export interface TranscodeOptions {
  videoCodec?: 'libx264' | 'libx265' | 'copy'
  audioCodec?: 'aac' | 'ac3' | 'copy'
  videoBitrate?: string
  audioBitrate?: string
  crf?: number
  preset?:
    | 'ultrafast'
    | 'superfast'
    | 'veryfast'
    | 'faster'
    | 'fast'
    | 'medium'
    | 'slow'
    | 'slower'
    | 'veryslow'
  outputFormat?: 'mp4' | 'mkv' | 'webm'
}

// 视频信息接口 / Video info interface
export interface VideoInfo {
  duration: number
  videoCodec: string
  audioCodec: string
  resolution: string
  bitrate: string
}

/**
 * FFmpeg 本地客户端类 / FFmpeg Native Client Class
 */
export class FFmpegNativeClient {
  /**
   * 检查 FFmpeg 是否存在 / Check if FFmpeg exists
   */
  async checkExists(): Promise<boolean> {
    try {
      return await window.api.ffmpeg.checkExists()
    } catch (error) {
      console.error('检查 FFmpeg 存在性失败:', error)
      return false
    }
  }

  /**
   * 获取 FFmpeg 版本信息 / Get FFmpeg version info
   */
  async getVersion(): Promise<string | null> {
    try {
      return await window.api.ffmpeg.getVersion()
    } catch (error) {
      console.error('获取 FFmpeg 版本失败:', error)
      return null
    }
  }

  /**
   * 下载 FFmpeg / Download FFmpeg
   * @param onProgress 进度回调函数 / Progress callback function
   */
  async download(onProgress?: (progress: number) => void): Promise<ApiResponse> {
    try {
      // 监听下载进度事件 / Listen to download progress events
      const removeListener = onProgress
        ? ((): (() => void) => {
            const handleProgress = (_: unknown, progress: number): void => {
              onProgress(progress)
            }
            window.electron.ipcRenderer.on('ffmpeg:download-progress', handleProgress)
            return () => {
              window.electron.ipcRenderer.removeListener('ffmpeg:download-progress', handleProgress)
            }
          })()
        : null

      const result = await window.api.ffmpeg.download()

      // 清理监听器 / Clean up listener
      if (removeListener) {
        removeListener()
      }

      return result
    } catch (error) {
      console.error('下载 FFmpeg 失败:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '下载失败'
      }
    }
  }

  /**
   * 获取视频信息 / Get video information
   * @param videoPath 视频文件路径 / Video file path
   */
  async getVideoInfo(videoPath: string): Promise<VideoInfo | null> {
    try {
      return await window.api.ffmpeg.getVideoInfo(videoPath)
    } catch (error) {
      console.error('获取视频信息失败:', error)
      return null
    }
  }

  /**
   * 转码视频 / Transcode video
   * @param inputPath 输入文件路径 / Input file path
   * @param outputPath 输出文件路径（可选，会自动生成）/ Output file path (optional, will be auto-generated)
   * @param options 转码选项 / Transcoding options
   * @param onProgress 进度回调函数 / Progress callback function
   */
  async transcode(
    inputPath: string,
    outputPath?: string,
    options: TranscodeOptions = {},
    onProgress?: (progress: TranscodeProgress) => void
  ): Promise<ApiResponse & { outputPath?: string }> {
    try {
      // 监听转码进度事件 / Listen to transcode progress events
      const removeListener = onProgress
        ? (() => {
            const handleProgress = (_: unknown, progress: TranscodeProgress): void => {
              onProgress(progress)
            }
            window.electron.ipcRenderer.on('ffmpeg:transcode-progress', handleProgress)
            return () => {
              window.electron.ipcRenderer.removeListener(
                'ffmpeg:transcode-progress',
                handleProgress
              )
            }
          })()
        : null

      const result = await window.api.ffmpeg.transcode(inputPath, outputPath, options)

      // 清理监听器 / Clean up listener
      if (removeListener) {
        removeListener()
      }

      return result
    } catch (error) {
      console.error('转码失败:', error)
      const errorMessage = error instanceof Error ? error.message : '转码失败'

      // 检查是否是用户取消转码，在错误信息中添加特殊标记 / Check if it's user cancellation, add special marker to error message
      const isCancelled = errorMessage.includes('转码已被用户取消')

      return {
        success: false,
        error: isCancelled ? `[CANCELLED]${errorMessage}` : errorMessage
      }
    }
  }

  /**
   * 获取 FFmpeg 可执行文件路径 / Get FFmpeg executable path
   */
  async getPath(): Promise<string> {
    try {
      return await window.api.ffmpeg.getPath()
    } catch (error) {
      console.error('获取 FFmpeg 路径失败:', error)
      return ''
    }
  }

  /**
   * 获取用户数据目录 / Get user data directory
   */
  async getDataDirectory(): Promise<string> {
    try {
      return await window.api.ffmpeg.getDataDirectory()
    } catch (error) {
      console.error('获取用户数据目录失败:', error)
      return ''
    }
  }

  /**
   * 检测视频是否需要转码 / Detect if video needs transcoding
   * @param videoPath 视频文件路径 / Video file path
   */
  async needsTranscoding(videoPath: string): Promise<{
    needsVideoTranscode: boolean
    needsAudioTranscode: boolean
    reason: string[]
  }> {
    try {
      const info = await this.getVideoInfo(videoPath)
      if (!info) {
        return {
          needsVideoTranscode: true,
          needsAudioTranscode: true,
          reason: ['无法获取视频信息，建议转码以确保兼容性']
        }
      }

      const reasons: string[] = []
      let needsVideoTranscode = false
      let needsAudioTranscode = false

      // 检查视频编解码器 / Check video codec
      const videoCodec = info.videoCodec.toLowerCase()
      if (
        videoCodec.includes('hevc') ||
        videoCodec.includes('h265') ||
        videoCodec.includes('265')
      ) {
        needsVideoTranscode = true
        reasons.push('视频使用 H.265/HEVC 编码，需要转换为 H.264')
      }

      // 检查音频编解码器 / Check audio codec
      const audioCodec = info.audioCodec.toLowerCase()
      if (
        audioCodec.includes('ac-3') ||
        audioCodec.includes('ac3') ||
        audioCodec.includes('dts') ||
        audioCodec.includes('truehd')
      ) {
        needsAudioTranscode = true
        reasons.push('音频使用 AC3/DTS/TrueHD 编码，需要转换为 AAC')
      }

      return {
        needsVideoTranscode,
        needsAudioTranscode,
        reason: reasons
      }
    } catch (error) {
      console.error('检测转码需求失败:', error)
      return {
        needsVideoTranscode: true,
        needsAudioTranscode: true,
        reason: ['检测失败，建议转码以确保兼容性']
      }
    }
  }

  /**
   * 生成转码后的文件路径 / Generate transcoded file path
   * @param originalPath 原始文件路径 / Original file path
   */
  async generateTranscodedPath(originalPath: string): Promise<string> {
    // 转换file://URL为本地路径，并获取目录 / Convert file:// URL to local path and get directory
    let inputDir: string
    let fileName: string

    if (originalPath.startsWith('file://')) {
      try {
        const url = new URL(originalPath)

        // 从URL中获取编码的路径部分
        const encodedPathParts = url.pathname.split('/').filter((part) => part.length > 0)
        const encodedFileName = encodedPathParts.pop() || 'video'

        // 解码文件名
        try {
          fileName = decodeURIComponent(encodedFileName)
          console.log('🎯 渲染进程文件名解码成功', {
            编码前: encodedFileName,
            解码后: fileName
          })
        } catch (error) {
          console.warn('⚠️ 渲染进程文件名解码失败，使用原始文件名', { encodedFileName, error })
          fileName = encodedFileName
        }

        // 构建目录的file://URL（保持原始编码）
        if (encodedPathParts.length > 0) {
          inputDir = `file:///${encodedPathParts.join('/')}`
        } else {
          inputDir = 'file:///'
        }

        console.log('🎯 渲染进程路径解析', {
          原始URL: originalPath,
          'URL.pathname': url.pathname,
          编码路径部分: encodedPathParts,
          编码文件名: encodedFileName,
          解码文件名: fileName,
          输入目录URL: inputDir
        })
      } catch (error) {
        console.error('⚠️ URL解析失败，使用传统方法', { originalPath, error })
        // 如果解析失败，使用传统方法
        const pathParts = originalPath.split('/')
        fileName = pathParts.pop() || 'video'
        inputDir = pathParts.slice(0, -1).join('/')
      }
    } else {
      // 本地路径处理
      const pathSeparator = originalPath.includes('\\') ? '\\' : '/'
      const pathParts = originalPath.split(pathSeparator)
      fileName = pathParts.pop() || 'video'
      inputDir = pathParts.join(pathSeparator)
    }

    const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '')
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')

    // 构建输出文件的file://URL
    let outputPath: string
    if (inputDir.startsWith('file://')) {
      // 如果inputDir是file://URL，直接拼接
      const separator = inputDir.endsWith('/') ? '' : '/'
      outputPath = `${inputDir}${separator}${encodeURIComponent(`${nameWithoutExt}_transcoded_${timestamp}.mp4`)}`
    } else {
      // 如果是本地路径，使用路径分隔符
      const pathSeparator = inputDir.includes('\\') ? '\\' : '/'
      outputPath = `${inputDir}${pathSeparator}${nameWithoutExt}_transcoded_${timestamp}.mp4`
    }

    console.log('✅ 渲染进程生成输出路径', {
      原始路径: originalPath,
      输入目录: inputDir,
      解码文件名: fileName,
      不含扩展名: nameWithoutExt,
      输出文件名: `${nameWithoutExt}_transcoded_${timestamp}.mp4`,
      最终输出路径: outputPath
    })

    return outputPath
  }

  /**
   * 快速转码 H.265 到 H.264 / Quick transcode H.265 to H.264
   */
  async quickTranscodeH265ToH264(
    inputPath: string,
    outputPath?: string,
    onProgress?: (progress: TranscodeProgress) => void
  ): Promise<ApiResponse & { outputPath?: string }> {
    const finalOutputPath = outputPath || (await this.generateTranscodedPath(inputPath))

    return this.transcode(
      inputPath,
      finalOutputPath,
      {
        videoCodec: 'libx264',
        audioCodec: 'aac',
        crf: 23,
        preset: 'fast',
        audioBitrate: '128k',
        outputFormat: 'mp4'
      },
      onProgress
    )
  }

  /**
   * 快速转码音频到 AAC / Quick transcode audio to AAC
   */
  async quickTranscodeAudioToAAC(
    inputPath: string,
    outputPath?: string,
    onProgress?: (progress: TranscodeProgress) => void
  ): Promise<ApiResponse & { outputPath?: string }> {
    const finalOutputPath = outputPath || (await this.generateTranscodedPath(inputPath))

    return this.transcode(
      inputPath,
      finalOutputPath,
      {
        videoCodec: 'copy', // 保持视频不变 / Keep video unchanged
        audioCodec: 'aac',
        audioBitrate: '128k',
        outputFormat: 'mp4'
      },
      onProgress
    )
  }

  /**
   * 完整转码（视频+音频） / Complete transcoding (video + audio)
   */
  async completeTranscode(
    inputPath: string,
    outputPath?: string,
    onProgress?: (progress: TranscodeProgress) => void
  ): Promise<ApiResponse & { outputPath?: string }> {
    const finalOutputPath = outputPath || (await this.generateTranscodedPath(inputPath))

    return this.transcode(
      inputPath,
      finalOutputPath,
      {
        videoCodec: 'libx264',
        audioCodec: 'aac',
        crf: 23,
        preset: 'fast',
        audioBitrate: '128k',
        outputFormat: 'mp4'
      },
      onProgress
    )
  }

  /**
   * 取消转码 / Cancel transcoding
   */
  async cancelTranscode(): Promise<boolean> {
    try {
      return await window.api.ffmpeg.cancelTranscode()
    } catch (error) {
      console.error('取消转码失败:', error)
      return false
    }
  }
}

// 导出全局单例 / Export global singleton
export const ffmpegNativeClient = new FFmpegNativeClient()
