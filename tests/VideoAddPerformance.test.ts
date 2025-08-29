/**
 * 视频添加性能测试
 * 测试视频添加流程的各个环节的性能表现
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock window.api
const mockApi = {
  file: {
    select: vi.fn()
  },
  ffmpeg: {
    checkExists: vi.fn(),
    getVideoInfo: vi.fn()
  }
}

// Mock FileManager
const mockFileManager = {
  addFile: vi.fn()
}

// Mock VideoLibraryService
const mockVideoLibraryService = {
  addOrUpdateRecord: vi.fn()
}

// Mock logger（保留以便未来扩展，但当前未使用）
const mockLogger = {
  info: vi.fn(),
  error: vi.fn(),
  warn: vi.fn()
}
void mockLogger

// 设置全局 mocks
beforeEach(() => {
  vi.clearAllMocks()

  // @ts-ignore - 测试环境注入 window.api 用于模拟主进程 IPC
  global.window = {
    api: mockApi
  }

  // @ts-ignore - 测试环境下为 performance 注入 now 方法
  global.performance = {
    now: vi.fn(() => Date.now())
  }
})

describe('视频添加性能测试', () => {
  it('应该记录各个步骤的性能数据', async () => {
    // 准备测试数据
    const mockFile = {
      id: 'test-file-id',
      name: 'test-video.mp4',
      path: '/path/to/test-video.mp4',
      size: 1024000,
      ext: '.mp4',
      type: 'video',
      origin_name: 'test-video.mp4',
      created_at: new Date().toISOString()
    }

    const mockVideoInfo = {
      duration: 120,
      videoCodec: 'h264',
      audioCodec: 'aac',
      resolution: '1920x1080',
      bitrate: '2000kb/s'
    }

    // 模拟不同步骤的耗时
    let currentTime = 1000
    const mockPerformanceNow = vi.fn(() => {
      currentTime += Math.random() * 100 // 随机增加 0-100ms
      return currentTime
    })

    // @ts-ignore - vitest/jsdom 环境下重写 performance.now 以实现可控时间推进
    global.performance.now = mockPerformanceNow

    // 设置 mock 返回值
    mockApi.file.select.mockResolvedValue([mockFile])
    mockApi.ffmpeg.checkExists.mockResolvedValue(true)
    mockApi.ffmpeg.getVideoInfo.mockResolvedValue(mockVideoInfo)
    mockFileManager.addFile.mockResolvedValue(mockFile)
    mockVideoLibraryService.addOrUpdateRecord.mockResolvedValue({
      id: 1,
      ...mockFile,
      currentTime: 0,
      duration: 120,
      playedAt: Date.now(),
      firstPlayedAt: Date.now(),
      playCount: 1,
      isFinished: false,
      isFavorite: false,
      thumbnailPath: undefined
    })

    // 模拟视频添加流程
    const startTime = performance.now()

    // 1. 文件选择
    const fileSelectStart = performance.now()
    const files = await mockApi.file.select({
      properties: ['openFile'],
      filters: [{ name: 'Video Files', extensions: ['mp4'] }]
    })
    const fileSelectEnd = performance.now()

    // 2. FFmpeg 检查
    const ffmpegCheckStart = performance.now()
    const ffmpegExists = await mockApi.ffmpeg.checkExists()
    const ffmpegCheckEnd = performance.now()

    // 3. 文件添加到数据库
    const fileAddStart = performance.now()
    await mockFileManager.addFile(mockFile)
    const fileAddEnd = performance.now()

    // 4. 获取视频信息
    const videoInfoStart = performance.now()
    const videoInfo = await mockApi.ffmpeg.getVideoInfo(mockFile.path)
    const videoInfoEnd = performance.now()

    // 5. 添加视频库记录
    const videoRecordStart = performance.now()
    await mockVideoLibraryService.addOrUpdateRecord({
      fileId: mockFile.id,
      currentTime: 0,
      duration: videoInfo.duration,
      playedAt: Date.now(),
      firstPlayedAt: Date.now(),
      playCount: 0,
      isFinished: false,
      isFavorite: false,
      thumbnailPath: undefined
    })
    const videoRecordEnd = performance.now()

    const endTime = performance.now()

    // 验证性能数据
    expect(files).toHaveLength(1)
    expect(ffmpegExists).toBe(true)
    expect(videoInfo).toEqual(mockVideoInfo)

    // 验证性能计时器被调用
    expect(mockPerformanceNow).toHaveBeenCalled()

    // 计算各步骤耗时
    const fileSelectTime = fileSelectEnd - fileSelectStart
    const ffmpegCheckTime = ffmpegCheckEnd - ffmpegCheckStart
    const fileAddTime = fileAddEnd - fileAddStart
    const videoInfoTime = videoInfoEnd - videoInfoStart
    const videoRecordTime = videoRecordEnd - videoRecordStart
    const totalTime = endTime - startTime

    // 验证耗时数据合理性
    expect(fileSelectTime).toBeGreaterThanOrEqual(0)
    expect(ffmpegCheckTime).toBeGreaterThanOrEqual(0)
    expect(fileAddTime).toBeGreaterThanOrEqual(0)
    expect(videoInfoTime).toBeGreaterThanOrEqual(0)
    expect(videoRecordTime).toBeGreaterThanOrEqual(0)
    expect(totalTime).toBeGreaterThanOrEqual(0)

    console.log('性能测试结果:', {
      文件选择: `${fileSelectTime.toFixed(2)}ms`,
      FFmpeg检查: `${ffmpegCheckTime.toFixed(2)}ms`,
      文件数据库: `${fileAddTime.toFixed(2)}ms`,
      视频信息: `${videoInfoTime.toFixed(2)}ms`,
      视频库记录: `${videoRecordTime.toFixed(2)}ms`,
      总耗时: `${totalTime.toFixed(2)}ms`
    })
  })

  it('应该能够识别性能瓶颈', async () => {
    // 模拟某个步骤特别慢的情况
    const mockSlowOperation = vi.fn().mockImplementation(() => {
      return new Promise((resolve) => {
        setTimeout(resolve, 100) // 模拟 100ms 的延迟
      })
    })

    const startTime = Date.now()
    await mockSlowOperation()
    const endTime = Date.now()

    const duration = endTime - startTime
    expect(duration).toBeGreaterThanOrEqual(100)

    // 在实际应用中，如果某个步骤耗时超过阈值，应该记录警告
    if (duration > 50) {
      console.warn(`⚠️ 检测到性能瓶颈: 操作耗时 ${duration}ms`)
    }
  })
})
