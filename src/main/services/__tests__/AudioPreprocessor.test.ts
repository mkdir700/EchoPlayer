import { describe, expect, it } from 'vitest'

import { parseFFmpegDuration } from '../audio/AudioPreprocessor'

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
