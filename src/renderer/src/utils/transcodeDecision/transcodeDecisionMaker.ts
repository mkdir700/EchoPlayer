/**
 * Transcode Decision Layer / 转码决策层
 * 根据视频兼容性和文件信息智能决定转码策略
 * Intelligently decide transcoding strategy based on video compatibility and file info
 */

import { ffmpegNativeClient, type TranscodeOptions, type VideoInfo } from '../ffmpegNativeClient'
import {
  checkCodecSupport,
  checkAudioCodecSupport,
  getAudioCodecSupport,
  supportsH265
} from '../videoCompatibility'

// 转码策略枚举 / Transcoding strategy enum
export enum TranscodeStrategy {
  NOT_NEEDED = 'not_needed', // 不需要转码 / No transcoding needed
  AUDIO_ONLY = 'audio_only', // 仅转码音频 / Audio transcoding only
  VIDEO_ONLY = 'video_only', // 仅转码视频 / Video transcoding only
  FULL_TRANSCODE = 'full_transcode', // 完整转码 / Full transcoding
  CONTAINER_ONLY = 'container_only' // 仅改变容器格式 / Container format change only
}

// 转码决策结果 / Transcoding decision result
export interface TranscodeDecision {
  strategy: TranscodeStrategy
  reason: string[]
  options: TranscodeOptions
  estimatedTime?: number // 预估转码时间（秒）/ Estimated transcoding time (seconds)
  outputFormat: 'mp4' | 'mkv' | 'webm'
  priority: 'low' | 'medium' | 'high' // 转码优先级 / Transcoding priority
}

// 视频兼容性检查结果 / Video compatibility check result
export interface VideoCompatibility {
  canPlayVideo: boolean
  canPlayAudio: boolean
  videoCodecSupported: boolean
  audioCodecSupported: boolean
  containerSupported: boolean
  issues: string[]
}

/**
 * 转码决策器类 / Transcoding Decision Maker Class
 */
export class TranscodeDecisionMaker {
  /**
   * 检查视频兼容性 / Check video compatibility
   * @param videoInfo 视频信息 / Video information
   * @param filePath 文件路径 / File path
   */
  private checkVideoCompatibility(videoInfo: VideoInfo, filePath: string): VideoCompatibility {
    const issues: string[] = []

    // 检查容器格式 / Check container format
    const fileExtension = filePath.toLowerCase().split('.').pop() || ''
    const containerSupported = ['mp4', 'webm', 'ogg', 'mkv'].includes(fileExtension)

    // 添加调试日志 / Add debug logging
    console.log('🔍 视频兼容性检查 - 容器格式:', { filePath, fileExtension, containerSupported })

    if (!containerSupported) {
      issues.push(`容器格式 ${fileExtension.toUpperCase()} 不被 Web 环境支持，建议转换为 MP4`)
    }

    // 检查视频编解码器 / Check video codec
    const videoCodec = videoInfo.videoCodec.toLowerCase()
    let videoCodecSupported = true

    console.log('🔍 视频兼容性检查 - 视频编解码器:', { videoCodec })

    if (videoCodec.includes('hevc') || videoCodec.includes('h265') || videoCodec.includes('265')) {
      videoCodecSupported = supportsH265()
      console.log('🔍 H.265/HEVC 支持检查结果:', { videoCodecSupported })
      if (!videoCodecSupported) {
        issues.push('H.265/HEVC 视频编码不被当前环境支持')
      }
    } else if (videoCodec.includes('av1')) {
      const av1Support = checkCodecSupport('video/mp4; codecs="av01.0.05M.08"')
      videoCodecSupported = av1Support.supported
      if (!videoCodecSupported) {
        issues.push('AV1 视频编码不被当前环境支持')
      }
    } else if (videoCodec.includes('vp9')) {
      const vp9Support = checkCodecSupport('video/webm; codecs="vp9"')
      videoCodecSupported = vp9Support.supported
      if (!videoCodecSupported) {
        issues.push('VP9 视频编码不被当前环境支持')
      }
    }

    // 检查音频编解码器 / Check audio codec
    const audioCodec = videoInfo.audioCodec.toLowerCase()
    const audioSupport = getAudioCodecSupport()
    let audioCodecSupported = true

    console.log('🔍 视频兼容性检查 - 音频编解码器:', { audioCodec, audioSupport })

    if (audioCodec.includes('ac-3') || audioCodec.includes('ac3')) {
      audioCodecSupported = audioSupport.ac3
      console.log('🔍 AC3 支持检查结果:', { audioCodecSupported })
      if (!audioCodecSupported) {
        issues.push('AC3 音频编码不被当前环境支持')
      }
    } else if (audioCodec.includes('dts')) {
      audioCodecSupported = audioSupport.dts
      if (!audioCodecSupported) {
        issues.push('DTS 音频编码不被当前环境支持')
      }
    } else if (audioCodec.includes('truehd') || audioCodec.includes('mlp')) {
      audioCodecSupported = false // TrueHD 通常不被 web 环境支持
      issues.push('TrueHD 音频编码不被当前环境支持')
    } else if (audioCodec.includes('pcm')) {
      // 检查 PCM 支持 / Check PCM support
      const pcmSupport = checkAudioCodecSupport('audio/wav')
      audioCodecSupported = pcmSupport.supported
      if (!audioCodecSupported) {
        issues.push('PCM 音频编码不被当前环境支持')
      }
    }

    // 检查是否有音频轨道 / Check if audio track exists
    const hasAudio = videoInfo.audioCodec && videoInfo.audioCodec !== 'none'

    const compatibility = {
      canPlayVideo: videoCodecSupported, // 视频编码支持性，与容器无关
      canPlayAudio: audioCodecSupported && Boolean(hasAudio),
      videoCodecSupported,
      audioCodecSupported: audioCodecSupported && Boolean(hasAudio),
      containerSupported,
      issues
    }

    // 添加详细的调试日志
    console.log('🔍 视频兼容性检查结果:', {
      compatibility,
      videoInfo,
      filePath,
      checks: {
        hasAudio,
        videoCodecSupported,
        audioCodecSupported,
        containerSupported
      }
    })

    return compatibility
  }

  /**
   * 估算转码时间 / Estimate transcoding time
   * @param duration 视频时长（秒）/ Video duration (seconds)
   * @param strategy 转码策略 / Transcoding strategy
   * @param resolution 视频分辨率 / Video resolution
   */
  private estimateTranscodingTime(
    duration: number,
    strategy: TranscodeStrategy,
    resolution: string
  ): number {
    const baseFactor = duration / 60 // 基础系数：每分钟 / Base factor: per minute

    // 分辨率系数 / Resolution factor
    let resolutionFactor = 1
    if (resolution.includes('4K') || resolution.includes('3840')) {
      resolutionFactor = 4
    } else if (resolution.includes('1440') || resolution.includes('2K')) {
      resolutionFactor = 2.5
    } else if (resolution.includes('1080')) {
      resolutionFactor = 2
    } else if (resolution.includes('720')) {
      resolutionFactor = 1.5
    }

    // 策略系数 / Strategy factor
    let strategyFactor = 1
    switch (strategy) {
      case TranscodeStrategy.AUDIO_ONLY:
        strategyFactor = 0.1 // 音频转码很快 / Audio transcoding is fast
        break
      case TranscodeStrategy.VIDEO_ONLY:
        strategyFactor = 0.8 // 视频转码较慢 / Video transcoding is slower
        break
      case TranscodeStrategy.FULL_TRANSCODE:
        strategyFactor = 1 // 完整转码最慢 / Full transcoding is slowest
        break
      case TranscodeStrategy.CONTAINER_ONLY:
        strategyFactor = 0.05 // 容器转换很快 / Container conversion is very fast
        break
      default:
        strategyFactor = 0
    }

    return Math.ceil(baseFactor * resolutionFactor * strategyFactor)
  }

  /**
   * 生成转码选项 / Generate transcoding options
   * @param strategy 转码策略 / Transcoding strategy
   * @param videoInfo 视频信息 / Video information
   */
  private generateTranscodeOptions(
    strategy: TranscodeStrategy,
    videoInfo: VideoInfo
  ): TranscodeOptions {
    const options: TranscodeOptions = {}

    switch (strategy) {
      case TranscodeStrategy.AUDIO_ONLY:
        options.videoCodec = 'copy'
        options.audioCodec = 'aac'
        options.audioBitrate = this.getOptimalAudioBitrate(videoInfo)
        options.outputFormat = 'mp4'
        break

      case TranscodeStrategy.VIDEO_ONLY:
        options.videoCodec = 'libx264'
        options.audioCodec = 'copy'
        options.crf = this.getOptimalCRF(videoInfo)
        options.preset = this.getOptimalPreset(videoInfo)
        options.outputFormat = 'mp4'
        break

      case TranscodeStrategy.FULL_TRANSCODE:
        options.videoCodec = 'libx264'
        options.audioCodec = 'aac'
        options.crf = this.getOptimalCRF(videoInfo)
        options.preset = this.getOptimalPreset(videoInfo)
        options.audioBitrate = this.getOptimalAudioBitrate(videoInfo)
        options.outputFormat = 'mp4'
        break

      case TranscodeStrategy.CONTAINER_ONLY:
        options.videoCodec = 'copy'
        options.audioCodec = 'copy'
        options.outputFormat = 'mp4'
        break
    }

    return options
  }

  /**
   * 获取最优音频码率 / Get optimal audio bitrate
   */
  private getOptimalAudioBitrate(videoInfo: VideoInfo): string {
    // 根据原始码率和质量要求决定 / Decide based on original bitrate and quality requirements
    const bitrate = parseInt(videoInfo.bitrate) || 0

    if (bitrate > 10000000) {
      // > 10 Mbps，高质量视频 / High quality video
      return '192k'
    } else if (bitrate > 5000000) {
      // > 5 Mbps，中等质量 / Medium quality
      return '128k'
    } else {
      return '96k' // 低质量或未知 / Low quality or unknown
    }
  }

  /**
   * 获取最优 CRF 值 / Get optimal CRF value
   */
  private getOptimalCRF(videoInfo: VideoInfo): number {
    // 根据分辨率和原始质量决定 / Decide based on resolution and original quality
    if (videoInfo.resolution.includes('4K') || videoInfo.resolution.includes('3840')) {
      return 20 // 4K 视频使用更低的 CRF 保持质量 / Use lower CRF for 4K to maintain quality
    } else if (videoInfo.resolution.includes('1080')) {
      return 23 // 1080p 标准质量 / Standard quality for 1080p
    } else {
      return 25 // 720p 及以下可以使用稍高的 CRF / Slightly higher CRF for 720p and below
    }
  }

  /**
   * 获取最优预设 / Get optimal preset
   */
  private getOptimalPreset(videoInfo: VideoInfo): TranscodeOptions['preset'] {
    const duration = videoInfo.duration

    if (duration > 7200) {
      // > 2 小时，使用慢速预设获得更好压缩 / > 2 hours, use slow preset for better compression
      return 'slow'
    } else if (duration > 3600) {
      // > 1 小时，平衡速度和质量 / > 1 hour, balance speed and quality
      return 'medium'
    } else {
      return 'fast' // 短视频使用快速预设 / Use fast preset for short videos
    }
  }

  /**
   * 主要决策方法 / Main decision method
   * @param filePath 视频文件路径 / Video file path
   * @param videoInfo 视频信息 / Video information
   */
  async makeDecision(filePath: string, videoInfo?: VideoInfo): Promise<TranscodeDecision> {
    // 获取视频信息 / Get video information
    const info = videoInfo || (await ffmpegNativeClient.getVideoInfo(filePath))

    if (!info) {
      return {
        strategy: TranscodeStrategy.FULL_TRANSCODE,
        reason: ['无法获取视频信息，建议完整转码以确保兼容性'],
        options: this.generateTranscodeOptions(TranscodeStrategy.FULL_TRANSCODE, {
          duration: 0,
          videoCodec: 'unknown',
          audioCodec: 'unknown',
          resolution: '1920x1080',
          bitrate: '5000000'
        }),
        outputFormat: 'mp4',
        priority: 'high'
      }
    }

    // 检查兼容性 / Check compatibility
    const compatibility = this.checkVideoCompatibility(info, filePath)
    const reasons: string[] = [...compatibility.issues]

    // 智能决策逻辑 / Intelligent decision logic
    let strategy: TranscodeStrategy
    let priority: 'low' | 'medium' | 'high' = 'low'

    // 分析各种兼容性组合情况
    const needsVideoTranscode = !compatibility.videoCodecSupported
    const needsAudioTranscode = !compatibility.audioCodecSupported
    const needsContainerChange = !compatibility.containerSupported

    // 输出决策分析日志
    console.log('🎯 转码决策分析:', {
      filePath,
      videoCodec: info.videoCodec,
      audioCodec: info.audioCodec,
      needsVideoTranscode,
      needsAudioTranscode,
      needsContainerChange,
      videoCodecSupported: compatibility.videoCodecSupported,
      audioCodecSupported: compatibility.audioCodecSupported,
      containerSupported: compatibility.containerSupported
    })

    if (!needsVideoTranscode && !needsAudioTranscode) {
      // 视频和音频编码都兼容 / Both video and audio codecs are compatible
      if (needsContainerChange) {
        strategy = TranscodeStrategy.CONTAINER_ONLY
        reasons.push('编解码器兼容，仅需改变容器格式为 MP4')
        priority = 'low'
      } else {
        strategy = TranscodeStrategy.NOT_NEEDED
        reasons.push('视频完全兼容，无需转码')
      }
    } else if (!needsVideoTranscode && needsAudioTranscode) {
      // 视频兼容，音频需要转码 / Video compatible, audio needs transcoding
      strategy = TranscodeStrategy.AUDIO_ONLY
      reasons.push('视频编码兼容，仅需转码音频为 AAC 格式')
      if (needsContainerChange) {
        reasons.push('同时会将容器格式转换为 MP4')
      }
      priority = 'medium'
    } else if (needsVideoTranscode && !needsAudioTranscode) {
      // 音频兼容，视频需要转码 / Audio compatible, video needs transcoding
      strategy = TranscodeStrategy.VIDEO_ONLY
      reasons.push('音频编码兼容，仅需转码视频为 H.264 格式')
      if (needsContainerChange) {
        reasons.push('同时会将容器格式转换为 MP4')
      }
      priority = 'medium'
    } else {
      // 视频和音频都需要转码 / Both video and audio need transcoding
      strategy = TranscodeStrategy.FULL_TRANSCODE
      reasons.push('视频和音频编码都需要转码，将转换为 H.264+AAC')
      if (needsContainerChange) {
        reasons.push('同时会将容器格式转换为 MP4')
      }
      priority = 'high'
    }

    // 生成转码选项 / Generate transcoding options
    const options = this.generateTranscodeOptions(strategy, info)

    // 估算转码时间 / Estimate transcoding time
    const estimatedTime =
      strategy === TranscodeStrategy.NOT_NEEDED
        ? 0
        : this.estimateTranscodingTime(info.duration, strategy, info.resolution)

    return {
      strategy,
      reason: reasons,
      options,
      estimatedTime,
      outputFormat: options.outputFormat || 'mp4',
      priority
    }
  }

  /**
   * 批量决策 / Batch decision making
   * @param filePaths 文件路径数组 / Array of file paths
   */
  async makeBatchDecisions(filePaths: string[]): Promise<Map<string, TranscodeDecision>> {
    const decisions = new Map<string, TranscodeDecision>()

    // 并行处理多个文件 / Process multiple files in parallel
    const promises = filePaths.map(async (filePath) => {
      try {
        const decision = await this.makeDecision(filePath)
        decisions.set(filePath, decision)
      } catch (error) {
        console.error(`处理文件 ${filePath} 时出错:`, error)
        // 设置默认的安全决策 / Set default safe decision
        decisions.set(filePath, {
          strategy: TranscodeStrategy.FULL_TRANSCODE,
          reason: ['处理失败，使用安全的完整转码策略'],
          options: this.generateTranscodeOptions(TranscodeStrategy.FULL_TRANSCODE, {
            duration: 0,
            videoCodec: 'unknown',
            audioCodec: 'unknown',
            resolution: '1920x1080',
            bitrate: '5000000'
          }),
          outputFormat: 'mp4',
          priority: 'high'
        })
      }
    })

    await Promise.all(promises)
    return decisions
  }

  /**
   * 获取转码建议摘要 / Get transcoding recommendation summary
   * @param decisions 决策结果映射 / Decision results map
   */
  getRecommendationSummary(decisions: Map<string, TranscodeDecision>): {
    totalFiles: number
    noTranscodeNeeded: number
    audioOnlyTranscode: number
    videoOnlyTranscode: number
    fullTranscode: number
    containerOnly: number
    totalEstimatedTime: number
    highPriorityCount: number
  } {
    let noTranscodeNeeded = 0
    let audioOnlyTranscode = 0
    let videoOnlyTranscode = 0
    let fullTranscode = 0
    let containerOnly = 0
    let totalEstimatedTime = 0
    let highPriorityCount = 0

    for (const decision of Array.from(decisions.values())) {
      switch (decision.strategy) {
        case TranscodeStrategy.NOT_NEEDED:
          noTranscodeNeeded++
          break
        case TranscodeStrategy.AUDIO_ONLY:
          audioOnlyTranscode++
          break
        case TranscodeStrategy.VIDEO_ONLY:
          videoOnlyTranscode++
          break
        case TranscodeStrategy.FULL_TRANSCODE:
          fullTranscode++
          break
        case TranscodeStrategy.CONTAINER_ONLY:
          containerOnly++
          break
      }

      totalEstimatedTime += decision.estimatedTime || 0

      if (decision.priority === 'high') {
        highPriorityCount++
      }
    }

    return {
      totalFiles: decisions.size,
      noTranscodeNeeded,
      audioOnlyTranscode,
      videoOnlyTranscode,
      fullTranscode,
      containerOnly,
      totalEstimatedTime,
      highPriorityCount
    }
  }
}

// 导出全局单例 / Export global singleton
export const transcodeDecisionMaker = new TranscodeDecisionMaker()
