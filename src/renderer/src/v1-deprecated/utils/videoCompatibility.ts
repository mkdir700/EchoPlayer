/**
 * Video compatibility detection and helper utilities
 * 视频兼容性检测和辅助工具
 */

export interface VideoCodecSupport {
  name: string
  mimeType: string
  supported: boolean
  supportLevel: 'probably' | 'maybe' | 'not-supported'
}

export interface AudioCodecSupport {
  name: string
  mimeType: string
  supported: boolean
  supportLevel: 'probably' | 'maybe' | 'not-supported'
}

export interface VideoCompatibilityReport {
  userAgent: string
  platform: string
  isElectron: boolean
  basicFormats: VideoCodecSupport[]
  advancedCodecs: VideoCodecSupport[]
  audioCodecs: AudioCodecSupport[]
  recommendations: string[]
}

/**
 * Check if a specific video codec is supported
 * 检查特定视频编解码器是否支持
 */
export function checkCodecSupport(mimeType: string): VideoCodecSupport {
  const video = document.createElement('video')
  const canPlay = video.canPlayType(mimeType)

  let supported = false
  let supportLevel: 'probably' | 'maybe' | 'not-supported' = 'not-supported'

  if (canPlay === 'probably') {
    supported = true
    supportLevel = 'probably'
  } else if (canPlay === 'maybe') {
    supported = true
    supportLevel = 'maybe'
  }

  return {
    name: mimeType,
    mimeType,
    supported,
    supportLevel
  }
}

/**
 * Check if a specific audio codec is supported
 * 检查特定音频编解码器是否支持
 */
export function checkAudioCodecSupport(mimeType: string): AudioCodecSupport {
  const audio = document.createElement('audio')
  const canPlay = audio.canPlayType(mimeType)

  let supported = false
  let supportLevel: 'probably' | 'maybe' | 'not-supported' = 'not-supported'

  if (canPlay === 'probably') {
    supported = true
    supportLevel = 'probably'
  } else if (canPlay === 'maybe') {
    supported = true
    supportLevel = 'maybe'
  }

  return {
    name: mimeType,
    mimeType,
    supported,
    supportLevel
  }
}

/**
 * Generate a comprehensive video compatibility report
 * 生成全面的视频兼容性报告
 */
export function generateCompatibilityReport(): VideoCompatibilityReport {
  const basicFormats = [
    'video/mp4',
    'video/mp4; codecs="avc1.42E01E"', // H.264 Baseline
    'video/mp4; codecs="avc1.4D401E"', // H.264 Main
    'video/mp4; codecs="avc1.64001E"', // H.264 High
    'video/webm',
    'video/webm; codecs="vp8"',
    'video/webm; codecs="vp9"',
    'video/ogg',
    'video/ogg; codecs="theora"'
  ].map(checkCodecSupport)

  const advancedCodecs = [
    'video/mp4; codecs="hev1.1.6.L93.B0"', // H.265/HEVC Main Profile
    'video/mp4; codecs="hvc1.1.6.L93.B0"', // H.265/HEVC Main Profile (alternative)
    'video/mp4; codecs="av01.0.05M.08"', // AV1
    'video/webm; codecs="av01.0.05M.08"', // AV1 in WebM
    'video/mp4; codecs="vp09.00.10.08"', // VP9 Profile 0
    'video/mp4; codecs="dvh1.05.06"' // Dolby Vision
  ].map(checkCodecSupport)

  // 添加音频编解码器检测
  const audioCodecs = [
    'audio/mp4; codecs="mp4a.40.2"', // AAC-LC
    'audio/mp4; codecs="mp4a.40.5"', // AAC-HE
    'audio/mp4; codecs="mp4a.40.29"', // AAC-HE v2
    'audio/mp4; codecs="ac-3"', // AC3/Dolby Digital
    'audio/mp4; codecs="ec-3"', // EAC3/Dolby Digital Plus
    'audio/mp4; codecs="dtsc"', // DTS
    'audio/mp4; codecs="dtsh"', // DTS-HD
    'audio/mp4; codecs="dtsl"', // DTS-Lossless
    'audio/webm; codecs="vorbis"', // Vorbis
    'audio/webm; codecs="opus"', // Opus
    'audio/ogg; codecs="vorbis"', // Ogg Vorbis
    'audio/ogg; codecs="flac"', // FLAC
    'audio/mpeg', // MP3
    'audio/wav', // PCM/WAV
    'audio/x-m4a; codecs="alac"' // Apple Lossless
  ].map(checkAudioCodecSupport)

  const recommendations = generateRecommendations(basicFormats, advancedCodecs, audioCodecs)

  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    isElectron: typeof window.process !== 'undefined',
    basicFormats,
    advancedCodecs,
    audioCodecs,
    recommendations
  }
}

/**
 * Generate recommendations based on codec support
 * 基于编解码器支持情况生成建议
 */
function generateRecommendations(
  basicFormats: VideoCodecSupport[],
  advancedCodecs: VideoCodecSupport[],
  audioCodecs: AudioCodecSupport[]
): string[] {
  const recommendations: string[] = []

  // Check H.265 support
  const h265Support = advancedCodecs.find(
    (codec) => codec.mimeType.includes('hev1') || codec.mimeType.includes('hvc1')
  )

  if (!h265Support?.supported) {
    recommendations.push(
      '当前环境不支持 H.265/HEVC 编解码器。建议将视频转换为 H.264 格式以获得最佳兼容性。'
    )
    recommendations.push(
      '推荐使用 FFmpeg 转换命令: ffmpeg -i input.mp4 -c:v libx264 -crf 23 -c:a aac output.mp4'
    )
  }

  // Check basic H.264 support
  const h264Support = basicFormats.find((codec) => codec.mimeType.includes('avc1'))

  if (!h264Support?.supported) {
    recommendations.push('当前环境对 H.264 支持有限。建议检查系统编解码器安装情况。')
  }

  // Check audio codec support
  const aacSupport = audioCodecs.find((codec) => codec.mimeType.includes('mp4a.40.2'))
  const ac3Support = audioCodecs.find((codec) => codec.mimeType.includes('ac-3'))
  const dtsSupport = audioCodecs.find((codec) => codec.mimeType.includes('dtsc'))

  if (!aacSupport?.supported) {
    recommendations.push('当前环境不支持 AAC 音频编解码器，这可能导致大部分视频没有声音。')
  }

  if (!ac3Support?.supported) {
    recommendations.push(
      '当前环境不支持 AC3/Dolby Digital 音频编解码器。MKV 视频中的 AC3 音轨将无法播放。'
    )
    recommendations.push(
      '针对 MKV + AC3 音频问题，建议转换音频格式: ffmpeg -i input.mkv -c:v copy -c:a aac output.mp4'
    )
  }

  if (!dtsSupport?.supported) {
    recommendations.push('当前环境不支持 DTS 音频编解码器。MKV 视频中的 DTS 音轨将无法播放。')
    recommendations.push(
      '针对 MKV + DTS 音频问题，建议转换音频格式: ffmpeg -i input.mkv -c:v copy -c:a aac output.mp4'
    )
  }

  // Special recommendations for H.265 MKV with audio issues
  if (h265Support?.supported) {
    recommendations.push(
      '检测到 H.265 视频支持。如果 MKV 视频有画面无声音，通常是音频编解码器问题：'
    )
    recommendations.push('1. 检查视频的音频编码格式 (通常是 AC3、DTS 或其他非标准编码)')
    recommendations.push(
      '2. 建议重新编码音频为 AAC: ffmpeg -i input.mkv -c:v copy -c:a aac -b:a 128k output.mp4'
    )
    recommendations.push(
      '3. 或者保留 H.265 但转换容器: ffmpeg -i input.mkv -c:v copy -c:a aac output.mp4'
    )
  }

  // Check WebM support
  const webmSupport = basicFormats.find((codec) => codec.mimeType === 'video/webm')

  if (webmSupport?.supported) {
    recommendations.push('WebM 格式受支持，可以考虑使用 VP8/VP9 编码的 WebM 作为备选方案。')
  }

  return recommendations
}

/**
 * Print compatibility report to console
 * 将兼容性报告打印到控制台
 */
export function printCompatibilityReport(): void {
  const report = generateCompatibilityReport()

  console.log('\n=== 视频兼容性报告 ===\n')

  console.log('环境信息:')
  console.log(`- 用户代理: ${report.userAgent}`)
  console.log(`- 平台: ${report.platform}`)
  console.log(`- Electron环境: ${report.isElectron ? '是' : '否'}\n`)

  console.log('视频格式支持:')
  report.basicFormats.forEach((format) => {
    const status = format.supported ? '✓' : '✗'
    const level = format.supportLevel !== 'not-supported' ? ` (${format.supportLevel})` : ''
    console.log(`- ${format.mimeType}: ${status}${level}`)
  })

  console.log('\n高级视频编解码器支持:')
  report.advancedCodecs.forEach((codec) => {
    const status = codec.supported ? '✓' : '✗'
    const level = codec.supportLevel !== 'not-supported' ? ` (${codec.supportLevel})` : ''
    console.log(`- ${codec.mimeType}: ${status}${level}`)
  })

  console.log('\n音频编解码器支持:')
  report.audioCodecs.forEach((codec) => {
    const status = codec.supported ? '✓' : '✗'
    const level = codec.supportLevel !== 'not-supported' ? ` (${codec.supportLevel})` : ''
    console.log(`- ${codec.mimeType}: ${status}${level}`)
  })

  if (report.recommendations.length > 0) {
    console.log('\n建议:')
    report.recommendations.forEach((rec, index) => {
      console.log(`${index + 1}. ${rec}`)
    })
  }

  console.log('\n详细格式检测:')
  const detailedFormats = [
    'video/mp4',
    'video/mp4; codecs="avc1.42E01E"',
    'video/mp4; codecs="hev1.1.6.L93.B0"',
    'video/webm',
    'video/webm; codecs="vp8"',
    'video/webm; codecs="vp9"',
    'video/ogg',
    'video/avi',
    'video/quicktime'
  ]

  const video = document.createElement('video')
  detailedFormats.forEach((format) => {
    const support = video.canPlayType(format)
    const status = support === 'probably' ? 'probably' : support === 'maybe' ? 'maybe' : '不支持'
    console.log(`- ${format}: ${status}`)
  })
}

/**
 * Diagnose specific video file audio issues
 * 诊断特定视频文件的音频问题
 */
export function diagnoseAudioIssues(fileName: string): string[] {
  const issues: string[] = []
  const report = generateCompatibilityReport()

  const fileExt = fileName.toLowerCase().split('.').pop()

  if (fileExt === 'mkv') {
    issues.push('🎯 MKV 容器格式检测到')

    // Check common audio codecs in MKV
    const aacSupport = report.audioCodecs.find((codec) => codec.mimeType.includes('mp4a.40.2'))
    const ac3Support = report.audioCodecs.find((codec) => codec.mimeType.includes('ac-3'))
    const dtsSupport = report.audioCodecs.find((codec) => codec.mimeType.includes('dtsc'))

    if (!ac3Support?.supported) {
      issues.push('❌ AC3 音频编解码器不支持 - MKV 中常见的音频格式')
      issues.push('💡 建议转换音频: ffmpeg -i input.mkv -c:v copy -c:a aac output.mp4')
    }

    if (!dtsSupport?.supported) {
      issues.push('❌ DTS 音频编解码器不支持 - MKV 中常见的音频格式')
      issues.push('💡 建议转换音频: ffmpeg -i input.mkv -c:v copy -c:a aac output.mp4')
    }

    if (aacSupport?.supported) {
      issues.push('✅ AAC 音频编解码器支持良好')
    }
  }

  return issues
}

/**
 * Check if current environment supports H.265/HEVC
 * 检查当前环境是否支持 H.265/HEVC
 */
export function supportsH265(): boolean {
  const h265Formats = ['video/mp4; codecs="hev1.1.6.L93.B0"', 'video/mp4; codecs="hvc1.1.6.L93.B0"']

  return h265Formats.some((format) => {
    const support = checkCodecSupport(format)
    return support.supported
  })
}

/**
 * Check audio codec support for common formats
 * 检查常见音频格式的编解码器支持
 */
export function getAudioCodecSupport(): {
  aac: boolean
  ac3: boolean
  dts: boolean
  opus: boolean
  vorbis: boolean
} {
  const report = generateCompatibilityReport()

  return {
    aac:
      report.audioCodecs.find((codec) => codec.mimeType.includes('mp4a.40.2'))?.supported || false,
    ac3: report.audioCodecs.find((codec) => codec.mimeType.includes('ac-3'))?.supported || false,
    dts: report.audioCodecs.find((codec) => codec.mimeType.includes('dtsc'))?.supported || false,
    opus: report.audioCodecs.find((codec) => codec.mimeType.includes('opus'))?.supported || false,
    vorbis:
      report.audioCodecs.find((codec) => codec.mimeType.includes('vorbis'))?.supported || false
  }
}

/**
 * Get recommended video settings for current environment
 * 获取当前环境推荐的视频设置
 */
export function getRecommendedVideoSettings(): {
  preferredFormat: string
  fallbackFormats: string[]
  conversionCommand?: string
} {
  const h265Supported = supportsH265()
  const audioSupport = getAudioCodecSupport()

  if (h265Supported && audioSupport.aac) {
    return {
      preferredFormat: 'H.265/HEVC + AAC (MP4)',
      fallbackFormats: ['H.264 + AAC (MP4)', 'VP9 + Opus (WebM)', 'VP8 + Vorbis (WebM)']
    }
  }

  return {
    preferredFormat: 'H.264 + AAC (MP4)',
    fallbackFormats: ['VP9 + Opus (WebM)', 'VP8 + Vorbis (WebM)'],
    conversionCommand: 'ffmpeg -i input.mkv -c:v libx264 -crf 23 -c:a aac output.mp4'
  }
}
