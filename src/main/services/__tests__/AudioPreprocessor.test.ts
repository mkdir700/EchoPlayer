import { beforeEach, describe, expect, it, vi } from 'vitest'

// 取消全局 fs mock，因为我们需要真实的文件系统操作
vi.unmock('node:fs')
vi.unmock('node:fs/promises')

import AudioPreprocessor, { parseFFmpegDuration } from '../audio/AudioPreprocessor'

describe('parseFFmpegDuration', () => {
  it('should parse duration with two-digit centiseconds', () => {
    const mockOutput = 'Duration: 01:23:45.67'
    const result = parseFFmpegDuration(mockOutput)
    expect(result).toBe(1 * 3600 + 23 * 60 + 45 + 67 / 100) // 5025.67
  })

  it('should parse duration with single-digit milliseconds', () => {
    const mockOutput = 'Duration: 02:34:56.7'
    const result = parseFFmpegDuration(mockOutput)
    expect(result).toBe(2 * 3600 + 34 * 60 + 56 + 7 / 10) // 9296.7
  })

  it('should parse duration with three-digit milliseconds', () => {
    const mockOutput = 'Duration: 00:12:34.567'
    const result = parseFFmpegDuration(mockOutput)
    expect(result).toBe(0 * 3600 + 12 * 60 + 34 + 567 / 1000) // 754.567
  })

  it('should parse duration without fractional part', () => {
    const mockOutput = 'Duration: 03:45:00'
    const result = parseFFmpegDuration(mockOutput)
    expect(result).toBe(3 * 3600 + 45 * 60 + 0) // 13500
  })

  it('should handle edge cases with zero values', () => {
    const mockOutput = 'Duration: 00:00:00.00'
    const result = parseFFmpegDuration(mockOutput)
    expect(result).toBe(0)
  })

  it('should handle malformed duration gracefully', () => {
    const mockOutput = 'Duration: XX:YY:ZZ.invalid'
    const result = parseFFmpegDuration(mockOutput)
    expect(result).toBeNull()
  })

  it('should extract duration from complex FFmpeg output', () => {
    const complexOutput = `
      Input #0, mp3, from 'test.mp3':
        Metadata:
          title           : Test Audio
          artist          : Test Artist
        Duration: 00:01:23.456, bitrate: 128 kb/s
        Stream #0:0: Audio: mp3, 44100 Hz, stereo, fltp, 128 kb/s
    `
    const result = parseFFmpegDuration(complexOutput)
    expect(result).toBe(0 * 3600 + 1 * 60 + 23 + 456 / 1000) // 83.456
  })

  it('should handle maximum valid hour values', () => {
    const mockOutput = 'Duration: 99:59:59.999'
    const result = parseFFmpegDuration(mockOutput)
    expect(result).toBe(99 * 3600 + 59 * 60 + 59 + 999 / 1000) // 359999.999
  })
})

describe('AudioPreprocessor', () => {
  let audioPreprocessor: AudioPreprocessor

  beforeEach(() => {
    audioPreprocessor = new AudioPreprocessor()
  })

  describe('buildFFmpegArgs', () => {
    // 由于 buildFFmpegArgs 是私有方法，我们通过测试 extractAudioTrack 的行为来间接测试它
    // 这里我们主要关注格式参数是否正确传递和处理

    it('should handle MP3 format correctly', async () => {
      // 由于这是一个集成测试，需要真实的文件和 FFmpeg，我们主要测试逻辑是否正确
      // 创建一个临时目录用于测试
      const tempDir = audioPreprocessor.createTempDir('test-')

      try {
        // 验证 options 参数能够正确传递 format
        // 由于 buildFFmpegArgs 是私有的，我们通过反射来测试它
        const buildFFmpegArgsMethod = (audioPreprocessor as any).buildFFmpegArgs

        if (buildFFmpegArgsMethod) {
          // 测试 MP3 格式
          const mp3Args = buildFFmpegArgsMethod.call(
            audioPreprocessor,
            '/test/input.mp4',
            '/test/output.mp3',
            16000,
            1,
            'mp3'
          )

          // 验证 MP3 格式使用了正确的编解码器
          expect(mp3Args).toContain('libmp3lame')
          expect(mp3Args).toContain('-b:a')
          expect(mp3Args).toContain('128k')
          expect(mp3Args).not.toContain('pcm_s16le')
        }
      } finally {
        // 清理临时目录
        await audioPreprocessor.cleanupTempDir(tempDir)
      }
    })

    it('should handle WAV format correctly', async () => {
      const tempDir = audioPreprocessor.createTempDir('test-')

      try {
        const buildFFmpegArgsMethod = (audioPreprocessor as any).buildFFmpegArgs

        if (buildFFmpegArgsMethod) {
          // 测试 WAV 格式
          const wavArgs = buildFFmpegArgsMethod.call(
            audioPreprocessor,
            '/test/input.mp4',
            '/test/output.wav',
            16000,
            1,
            'wav'
          )

          // 验证 WAV 格式使用了正确的编解码器
          expect(wavArgs).toContain('pcm_s16le')
          expect(wavArgs).not.toContain('libmp3lame')
          expect(wavArgs).not.toContain('-b:a')
        }
      } finally {
        await audioPreprocessor.cleanupTempDir(tempDir)
      }
    })

    it('should use WAV as default format', async () => {
      const tempDir = audioPreprocessor.createTempDir('test-')

      try {
        const buildFFmpegArgsMethod = (audioPreprocessor as any).buildFFmpegArgs

        if (buildFFmpegArgsMethod) {
          // 测试默认格式（不传递 format 参数）
          const defaultArgs = buildFFmpegArgsMethod.call(
            audioPreprocessor,
            '/test/input.mp4',
            '/test/output.wav',
            16000,
            1
          )

          // 验证默认使用 PCM 编解码器
          expect(defaultArgs).toContain('pcm_s16le')
          expect(defaultArgs).not.toContain('libmp3lame')
        }
      } finally {
        await audioPreprocessor.cleanupTempDir(tempDir)
      }
    })
  })
})
