import { spawn } from 'child_process'
import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'

import FFmpegService from './FFmpegService'
import { loggerService } from './LoggerService'

const logger = loggerService.withContext('SubtitleExtractorService')

export interface ExtractSubtitleOptions {
  videoPath: string
  streamIndex: number
  outputFormat?: 'srt' | 'ass' | 'vtt'
  subtitleCodec?: string
}

export interface ExtractSubtitleResult {
  success: boolean
  outputPath?: string
  error?: string
}

class SubtitleExtractorService {
  private ffmpegService: FFmpegService

  constructor() {
    this.ffmpegService = new FFmpegService()
  }

  /**
   * 从视频文件中提取字幕轨道
   */
  public async extractSubtitle(options: ExtractSubtitleOptions): Promise<ExtractSubtitleResult> {
    const startTime = Date.now()
    logger.info('🎬 开始提取字幕轨道', {
      videoPath: options.videoPath,
      streamIndex: options.streamIndex,
      subtitleCodec: options.subtitleCodec,
      outputFormat: options.outputFormat
    })

    try {
      // 验证输入
      if (!options.videoPath) {
        logger.error('❌ 视频文件路径为空', { videoPath: options.videoPath })
        return {
          success: false,
          error: '视频文件不存在'
        }
      }

      try {
        await fs.promises.access(options.videoPath, fs.constants.F_OK)
      } catch {
        logger.error('❌ 视频文件不存在', { videoPath: options.videoPath })
        return {
          success: false,
          error: '视频文件不存在'
        }
      }

      // 根据源字幕格式确定输出格式
      const outputFormat = this.getOutputFormatFromCodec(
        options.subtitleCodec,
        options.outputFormat
      )

      // 生成临时输出文件路径
      const outputPath = this.generateTempSubtitlePath(outputFormat)

      // 使用 FFmpeg 提取字幕
      const success = await this.runFFmpegExtract(
        options.videoPath,
        options.streamIndex,
        outputPath,
        options.subtitleCodec
      )

      if (!success) {
        logger.error('❌ FFmpeg 提取字幕失败')
        return {
          success: false,
          error: 'FFmpeg 提取字幕失败'
        }
      }

      // 验证输出文件
      try {
        await fs.promises.access(outputPath, fs.constants.F_OK)
      } catch {
        logger.error('❌ 输出文件不存在', { outputPath })
        return {
          success: false,
          error: '输出文件生成失败'
        }
      }

      const totalTime = Date.now() - startTime
      logger.info('✅ 成功提取字幕轨道', {
        outputPath,
        duration: `${totalTime}ms`
      })

      return {
        success: true,
        outputPath
      }
    } catch (error) {
      const totalTime = Date.now() - startTime
      const errorMsg = error instanceof Error ? error.message : String(error)
      logger.error(`❌ 提取字幕失败，耗时: ${totalTime}ms`, {
        error: errorMsg
      })
      return {
        success: false,
        error: errorMsg
      }
    }
  }

  /**
   * 使用 FFmpeg 提取字幕轨道
   */
  private async runFFmpegExtract(
    videoPath: string,
    streamIndex: number,
    outputPath: string,
    subtitleCodec?: string
  ): Promise<boolean> {
    return new Promise((resolve) => {
      const ffmpegPath = this.ffmpegService.getFFmpegPath()
      const args = ['-i', videoPath, '-map', `0:${streamIndex}`, '-c', 'copy', outputPath]
      const fullCommand = `${ffmpegPath} ${args.map((arg) => (arg.includes(' ') ? `"${arg}"` : arg)).join(' ')}`

      logger.debug('🎬 执行 FFmpeg 提取命令', {
        ffmpegPath,
        videoPath,
        streamIndex,
        subtitleCodec,
        outputPath,
        command: fullCommand
      })

      const ffmpeg = spawn(ffmpegPath, args)

      let errorOutput = ''

      ffmpeg.stderr?.on('data', (data) => {
        errorOutput += data.toString()
      })

      const timeoutHandle = setTimeout(() => {
        if (ffmpeg && !ffmpeg.killed) {
          ffmpeg.kill('SIGKILL')
        }
        logger.error('⏰ FFmpeg 提取超时')
        resolve(false)
      }, 30000)

      ffmpeg.on('close', (code) => {
        clearTimeout(timeoutHandle)

        if (code === 0) {
          logger.debug('✅ FFmpeg 提取成功', { code })
          resolve(true)
        } else {
          logger.error('❌ FFmpeg 提取失败', {
            code,
            error: errorOutput.slice(0, 500)
          })
          resolve(false)
        }
      })

      ffmpeg.on('error', (error) => {
        clearTimeout(timeoutHandle)
        logger.error('❌ FFmpeg 进程错误', {
          error: error.message
        })
        resolve(false)
      })
    })
  }

  /**
   * 根据字幕编解码器确定输出格式
   */
  private getOutputFormatFromCodec(subtitleCodec?: string, fallbackFormat?: string): string {
    // 编解码器到文件格式的映射
    const codecToFormat: Record<string, string> = {
      subrip: 'srt',
      ass: 'ass',
      ssa: 'ass',
      webvtt: 'vtt',
      vtt: 'vtt',
      mov_text: 'srt',
      hdmv_pgs_subtitle: 'sup',
      dvb_subtitle: 'sub',
      xsub: 'sub'
    }

    if (subtitleCodec && codecToFormat[subtitleCodec]) {
      const format = codecToFormat[subtitleCodec]
      logger.debug('📄 根据编解码器确定输出格式', {
        subtitleCodec,
        outputFormat: format
      })
      return format
    }

    // 如果编解码器不在映射表中，使用 fallback 格式或默认 srt
    const defaultFormat = fallbackFormat || 'srt'
    logger.debug('📄 使用默认输出格式', {
      subtitleCodec,
      defaultFormat
    })
    return defaultFormat
  }

  /**
   * 生成临时字幕文件路径
   */
  private generateTempSubtitlePath(format: string): string {
    const tempDir = os.tmpdir()
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(7)
    const fileName = `subtitle_${timestamp}_${randomStr}.${format}`
    return path.join(tempDir, fileName)
  }

  /**
   * 清理临时字幕文件
   */
  public async cleanupTempFile(filePath: string): Promise<boolean> {
    try {
      await fs.promises.unlink(filePath)
      logger.info('🧹 清理临时字幕文件', { filePath })
      return true
    } catch (error) {
      const nodeError = error as NodeJS.ErrnoException
      if (nodeError?.code === 'ENOENT') {
        return false
      }
      logger.error('清理临时字幕文件失败', {
        filePath,
        error: error instanceof Error ? error.message : String(error)
      })
      return false
    }
  }

  /**
   * 清理所有临时字幕文件
   * 扫描系统临时目录中的所有 subtitle_* 格式的临时文件并清理
   */
  public cleanupTempFiles(): void {
    try {
      const tempDir = os.tmpdir()
      const files = fs.readdirSync(tempDir)

      // 匹配临时字幕文件的模式：subtitle_<timestamp>_<random>.<ext>
      const subtitlePattern = /^subtitle_\d+_[a-z0-9]+\.(srt|ass|vtt|sup|sub)$/

      let cleanedCount = 0
      for (const file of files) {
        if (subtitlePattern.test(file)) {
          const filePath = path.join(tempDir, file)
          try {
            fs.unlinkSync(filePath)
            cleanedCount++
            logger.debug('清理临时字幕文件', { filePath })
          } catch (error) {
            // 跳过无法删除的文件（可能正在被使用）
            logger.debug('无法清理临时字幕文件（可能正在使用）', {
              filePath,
              error: error instanceof Error ? error.message : String(error)
            })
          }
        }
      }

      if (cleanedCount > 0) {
        logger.info('清理临时字幕文件完成', { count: cleanedCount })
      } else {
        logger.info('未找到临时字幕文件可清理')
      }
    } catch (error) {
      logger.error('清理临时字幕文件失败', {
        error: error instanceof Error ? error.message : String(error)
      })
    }
  }
}

export default SubtitleExtractorService
