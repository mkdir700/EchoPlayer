/**
 * 音频预处理服务
 * 负责从视频中提取音频轨道，转换为适合 ASR 的格式
 */

import { spawn } from 'child_process'
import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'

import FFmpegService from '../FFmpegService'
import { loggerService } from '../LoggerService'

const logger = loggerService.withContext('AudioPreprocessor')

export interface AudioExtractOptions {
  /** 采样率（Hz），默认 16000 */
  sampleRate?: number
  /** 声道数，默认 1 (mono)，FFmpeg 会自动混音 */
  channels?: number
  /** 输出格式，默认 'wav' */
  format?: 'wav' | 'mp3'
}

export interface AudioExtractResult {
  /** 是否成功 */
  success: boolean
  /** 输出音频文件路径 */
  audioPath?: string
  /** 音频时长（秒） */
  duration?: number
  /** 错误信息 */
  error?: string
}

class AudioPreprocessor {
  private ffmpegService: FFmpegService

  constructor() {
    this.ffmpegService = new FFmpegService()
  }

  /**
   * 从视频中提取音频轨道（简化版：直接拷贝音频流）
   */
  public async extractAudioTrack(
    videoPath: string,
    outputDir: string,
    options: AudioExtractOptions = {}
  ): Promise<AudioExtractResult> {
    const { sampleRate = 16000, channels = 1, format = 'wav' } = options

    const startTime = Date.now()
    logger.info('开始提取音频轨道', {
      videoPath,
      sampleRate,
      channels
    })

    try {
      // 验证输入文件
      if (!fs.existsSync(videoPath)) {
        logger.error('视频文件不存在', { videoPath })
        return { success: false, error: '视频文件不存在' }
      }

      // 创建输出目录
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true })
      }

      // 生成输出文件路径
      const outputPath = path.join(outputDir, `audio.${format}`)

      // 构建 FFmpeg 命令
      const ffmpegPath = this.ffmpegService.getFFmpegPath()
      const args = this.buildFFmpegArgs(videoPath, outputPath, sampleRate, channels)

      logger.debug('执行 FFmpeg 命令', { ffmpegPath, args })

      // 执行提取
      const { success, duration, error } = await this.runFFmpegExtract(ffmpegPath, args)

      if (!success) {
        return { success: false, error: error || 'FFmpeg 提取失败' }
      }

      // 验证输出文件
      if (!fs.existsSync(outputPath)) {
        return { success: false, error: '输出文件未生成' }
      }

      const totalTime = Date.now() - startTime
      logger.info('音频提取成功', {
        outputPath,
        duration,
        totalTime: `${totalTime}ms`
      })

      return {
        success: true,
        audioPath: outputPath,
        duration
      }
    } catch (error) {
      const totalTime = Date.now() - startTime
      const errorMsg = error instanceof Error ? error.message : String(error)
      logger.error('音频提取失败', { error: errorMsg, totalTime: `${totalTime}ms` })
      return { success: false, error: errorMsg }
    }
  }

  /**
   * 构建 FFmpeg 参数
   */
  private buildFFmpegArgs(
    inputPath: string,
    outputPath: string,
    sampleRate: number,
    channels: number
  ): string[] {
    // 简化的 FFmpeg 命令：直接提取第一个音频流并转换格式
    const args: string[] = [
      '-i',
      inputPath,
      '-vn', // 禁用视频
      '-map',
      '0:a:0', // 选择第一个音频流
      '-ar',
      String(sampleRate), // 采样率
      '-ac',
      String(channels), // 声道数（FFmpeg 会自动混音）
      '-c:a',
      'pcm_s16le', // WAV 格式使用 PCM 编码
      '-y', // 覆盖输出文件
      outputPath
    ]

    return args
  }

  /**
   * 执行 FFmpeg 提取命令
   */
  private async runFFmpegExtract(
    ffmpegPath: string,
    args: string[]
  ): Promise<{ success: boolean; duration?: number; error?: string }> {
    return new Promise((resolve) => {
      const ffmpeg = spawn(ffmpegPath, args)

      let stderrOutput = ''
      let duration: number | undefined

      ffmpeg.stderr?.on('data', (data) => {
        const output = data.toString()
        stderrOutput += output

        // 尝试解析音频时长
        const durationMatch = output.match(/Duration: (\d{2}):(\d{2}):(\d{2})\.(\d{2})/)
        if (durationMatch && !duration) {
          const hours = parseInt(durationMatch[1], 10)
          const minutes = parseInt(durationMatch[2], 10)
          const seconds = parseInt(durationMatch[3], 10)
          const centiseconds = parseInt(durationMatch[4], 10)
          duration = hours * 3600 + minutes * 60 + seconds + centiseconds / 100
        }
      })

      const timeoutHandle = setTimeout(
        () => {
          if (ffmpeg && !ffmpeg.killed) {
            ffmpeg.kill('SIGKILL')
          }
          logger.error('FFmpeg 提取超时')
          resolve({ success: false, error: 'FFmpeg 提取超时' })
        },
        5 * 60 * 1000
      ) // 5 分钟超时

      ffmpeg.on('close', (code) => {
        clearTimeout(timeoutHandle)

        if (code === 0) {
          logger.debug('FFmpeg 提取成功', { code, duration })
          resolve({ success: true, duration })
        } else {
          logger.error('FFmpeg 提取失败', {
            code,
            error: stderrOutput.slice(-500)
          })
          resolve({ success: false, error: `FFmpeg 退出码: ${code}` })
        }
      })

      ffmpeg.on('error', (error) => {
        clearTimeout(timeoutHandle)
        logger.error('FFmpeg 进程错误', { error: error.message })
        resolve({ success: false, error: error.message })
      })
    })
  }

  /**
   * 创建临时目录
   */
  public createTempDir(prefix: string = 'asr-audio-'): string {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), prefix))
    logger.debug('创建临时目录', { tempDir })
    return tempDir
  }

  /**
   * 清理临时目录
   */
  public async cleanupTempDir(dirPath: string): Promise<void> {
    try {
      if (fs.existsSync(dirPath)) {
        await fs.promises.rm(dirPath, { recursive: true, force: true })
        logger.info('清理临时目录成功', { dirPath })
      }
    } catch (error) {
      logger.error('清理临时目录失败', {
        dirPath,
        error: error instanceof Error ? error.message : String(error)
      })
    }
  }
}

export default AudioPreprocessor
