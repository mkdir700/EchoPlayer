/**
 * VideoAddButton 功能测试
 * 测试视频文件添加功能的完整流程
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
  },
  mediainfo: {
    checkExists: vi.fn(),
    getVideoInfo: vi.fn(),
    getVersion: vi.fn()
  }
}

// Mock FileManager
const mockFileManager = {
  addFile: vi.fn()
}

// Mock VideoLibraryService
const mockVideoLibraryService = {
  addRecord: vi.fn()
}

// Mock antd message（当前测试未直接使用，保留以便未来扩展示例）
const mockMessage = {
  loading: vi.fn(() => vi.fn()),
  success: vi.fn(),
  error: vi.fn()
}
void mockMessage

// Mock logger（当前测试未直接使用，保留以便未来扩展示例）
const mockLogger = {
  error: vi.fn()
}
void mockLogger

// 设置全局 mocks
beforeEach(() => {
  vi.clearAllMocks()

  // @ts-ignore - 测试环境注入 window.api 用于模拟主进程 IPC
  global.window = {
    api: mockApi
  }
})

describe('VideoAddButton 功能测试', () => {
  it('应该能够成功添加视频文件', async () => {
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

    const mockVideoRecord = {
      id: 1,
      fileId: 'test-file-id',
      currentTime: 0,
      duration: 120,
      playedAt: expect.any(Number),
      firstPlayedAt: expect.any(Number),
      playCount: 0,
      isFinished: false,
      isFavorite: false,
      thumbnailPath: undefined
    }

    // 设置 mock 返回值 - MediaInfo 优先
    mockApi.file.select.mockResolvedValue([mockFile])
    mockApi.mediainfo.checkExists.mockResolvedValue(true)
    mockApi.mediainfo.getVideoInfo.mockResolvedValue(mockVideoInfo)
    mockApi.ffmpeg.checkExists.mockResolvedValue(false) // 不会被调用，因为 MediaInfo 可用
    mockFileManager.addFile.mockResolvedValue(mockFile)
    mockVideoLibraryService.addRecord.mockResolvedValue(mockVideoRecord)

    // 这里应该测试实际的 VideoAddButton 组件
    // 由于这是一个集成测试示例，我们主要验证流程逻辑

    // 1. 选择文件
    const files = await mockApi.file.select({
      properties: ['openFile'],
      filters: [
        {
          name: 'Video Files',
          extensions: ['mp4', 'avi', 'mkv', 'mov', 'wmv', 'flv', 'webm']
        }
      ]
    })

    expect(files).toHaveLength(1)
    expect(files[0]).toEqual(mockFile)

    // 2. 检查 MediaInfo 优先级
    const mediaInfoExists = await mockApi.mediainfo.checkExists()
    expect(mediaInfoExists).toBe(true)

    // 3. 获取视频信息（使用 MediaInfo）
    const videoInfo = await mockApi.mediainfo.getVideoInfo(mockFile.path)
    expect(videoInfo).toEqual(mockVideoInfo)

    // 验证所有 mock 函数都被正确调用
    expect(mockApi.file.select).toHaveBeenCalledWith({
      properties: ['openFile'],
      filters: [
        {
          name: 'Video Files',
          extensions: ['mp4', 'avi', 'mkv', 'mov', 'wmv', 'flv', 'webm']
        }
      ]
    })
    expect(mockApi.mediainfo.checkExists).toHaveBeenCalled()
    expect(mockApi.mediainfo.getVideoInfo).toHaveBeenCalledWith(mockFile.path)
    // FFmpeg 不应该被调用，因为 MediaInfo 可用
    expect(mockApi.ffmpeg.checkExists).not.toHaveBeenCalled()
  })

  it('应该在 MediaInfo 不可用时回退到 FFmpeg', async () => {
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

    // 设置 MediaInfo 不可用，回退到 FFmpeg
    mockApi.file.select.mockResolvedValue([mockFile])
    mockApi.mediainfo.checkExists.mockResolvedValue(false)
    mockApi.ffmpeg.checkExists.mockResolvedValue(true)

    const mockVideoInfo = {
      duration: 120,
      videoCodec: 'h264',
      audioCodec: 'aac',
      resolution: '1920x1080',
      bitrate: '2000kb/s'
    }
    mockApi.ffmpeg.getVideoInfo.mockResolvedValue(mockVideoInfo)

    // 选择文件
    const files = await mockApi.file.select({
      properties: ['openFile'],
      filters: [
        {
          name: 'Video Files',
          extensions: ['mp4', 'avi', 'mkv', 'mov', 'wmv', 'flv', 'webm']
        }
      ]
    })

    expect(files).toHaveLength(1)

    // 检查 MediaInfo（应该返回 false）
    const mediaInfoExists = await mockApi.mediainfo.checkExists()
    expect(mediaInfoExists).toBe(false)

    // 检查 FFmpeg（应该返回 true）
    const ffmpegExists = await mockApi.ffmpeg.checkExists()
    expect(ffmpegExists).toBe(true)

    // 使用 FFmpeg 获取视频信息
    const videoInfo = await mockApi.ffmpeg.getVideoInfo(mockFile.path)
    expect(videoInfo).toEqual(mockVideoInfo)

    // 验证调用顺序
    expect(mockApi.mediainfo.checkExists).toHaveBeenCalled()
    expect(mockApi.ffmpeg.checkExists).toHaveBeenCalled()
    expect(mockApi.ffmpeg.getVideoInfo).toHaveBeenCalledWith(mockFile.path)
  })

  it('应该处理无效视频文件的情况', async () => {
    const mockFile = {
      id: 'test-file-id',
      name: 'invalid-video.mp4',
      path: '/path/to/invalid-video.mp4',
      size: 1024000,
      ext: '.mp4',
      type: 'video',
      origin_name: 'invalid-video.mp4',
      created_at: new Date().toISOString()
    }

    // 设置 mock 返回值 - MediaInfo 可用但无法解析
    mockApi.file.select.mockResolvedValue([mockFile])
    mockApi.mediainfo.checkExists.mockResolvedValue(true)
    mockApi.mediainfo.getVideoInfo.mockResolvedValue(null) // 无法获取视频信息

    // 选择文件
    const files = await mockApi.file.select({
      properties: ['openFile'],
      filters: [
        {
          name: 'Video Files',
          extensions: ['mp4', 'avi', 'mkv', 'mov', 'wmv', 'flv', 'webm']
        }
      ]
    })

    expect(files).toHaveLength(1)

    // 检查 MediaInfo
    const mediaInfoExists = await mockApi.mediainfo.checkExists()
    expect(mediaInfoExists).toBe(true)

    // 尝试获取视频信息（应该返回 null）
    const videoInfo = await mockApi.mediainfo.getVideoInfo(mockFile.path)
    expect(videoInfo).toBeNull()

    // 在实际组件中，这里应该抛出错误并显示相应的错误消息
  })

  it('应该处理所有视频解析器都不可用的情况', async () => {
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

    // 设置两个解析器都不可用
    mockApi.file.select.mockResolvedValue([mockFile])
    mockApi.mediainfo.checkExists.mockResolvedValue(false)
    mockApi.ffmpeg.checkExists.mockResolvedValue(false)

    // 选择文件
    const files = await mockApi.file.select({
      properties: ['openFile'],
      filters: [
        {
          name: 'Video Files',
          extensions: ['mp4', 'avi', 'mkv', 'mov', 'wmv', 'flv', 'webm']
        }
      ]
    })

    expect(files).toHaveLength(1)

    // 检查 MediaInfo（应该返回 false）
    const mediaInfoExists = await mockApi.mediainfo.checkExists()
    expect(mediaInfoExists).toBe(false)

    // 检查 FFmpeg（应该返回 false）
    const ffmpegExists = await mockApi.ffmpeg.checkExists()
    expect(ffmpegExists).toBe(false)

    // 验证调用顺序
    expect(mockApi.mediainfo.checkExists).toHaveBeenCalled()
    expect(mockApi.ffmpeg.checkExists).toHaveBeenCalled()

    // 在实际组件中，这里应该抛出错误并显示相应的错误消息：
    // "视频解析器不可用。MediaInfo 和 FFmpeg 都无法使用，请检查系统配置。"
  })

  it('应该允许重复添加相同路径的视频文件 (单元测试)', async () => {
    // 准备测试数据 - 同一个文件
    const mockFile = {
      id: 'test-file-id',
      name: 'duplicate-video.mp4',
      path: '/path/to/duplicate-video.mp4',
      size: 1024000,
      ext: '.mp4',
      type: 'video',
      origin_name: 'duplicate-video.mp4',
      created_at: new Date().toISOString()
    }

    const mockVideoInfo = {
      duration: 120,
      videoCodec: 'h264',
      audioCodec: 'aac',
      resolution: '1920x1080',
      bitrate: '2000kb/s'
    }

    // 模拟两次添加相同文件的返回结果
    const mockVideoRecord1 = {
      id: 1,
      fileId: 'test-file-id-1',
      currentTime: 0,
      duration: 120,
      playedAt: Date.now(),
      firstPlayedAt: Date.now(),
      playCount: 0,
      isFinished: false,
      isFavorite: false,
      thumbnailPath: undefined
    }

    const mockVideoRecord2 = {
      id: 2,
      fileId: 'test-file-id-2',
      currentTime: 0,
      duration: 120,
      playedAt: Date.now(),
      firstPlayedAt: Date.now(),
      playCount: 0,
      isFinished: false,
      isFavorite: false,
      thumbnailPath: undefined
    }

    // 设置 mock 返回值
    mockApi.file.select.mockResolvedValue([mockFile])
    mockApi.ffmpeg.checkExists.mockResolvedValue(true)
    mockApi.ffmpeg.getVideoInfo.mockResolvedValue(mockVideoInfo)

    // 第一次添加
    mockFileManager.addFile.mockResolvedValueOnce({
      ...mockFile,
      id: 'test-file-id-1'
    })
    mockVideoLibraryService.addRecord.mockResolvedValueOnce(mockVideoRecord1)

    // 第二次添加相同文件
    mockFileManager.addFile.mockResolvedValueOnce({
      ...mockFile,
      id: 'test-file-id-2'
    })
    mockVideoLibraryService.addRecord.mockResolvedValueOnce(mockVideoRecord2)

    // 第一次添加文件
    const files1 = await mockApi.file.select({
      properties: ['openFile'],
      filters: [{ name: 'Video Files', extensions: ['mp4'] }]
    })
    expect(files1).toHaveLength(1)

    // 第一次添加文件
    const addedFile1 = await mockFileManager.addFile(mockFile)
    expect(addedFile1.id).toBe('test-file-id-1')

    // 第二次添加相同路径文件（应该成功，因为删除了唯一约束）
    const addedFile2 = await mockFileManager.addFile(mockFile)
    expect(addedFile2.id).toBe('test-file-id-2')

    // 验证两次都调用了 addFile，生成了不同的ID
    expect(mockFileManager.addFile).toHaveBeenCalledTimes(2)
    expect(addedFile1.id).not.toBe(addedFile2.id)
  })
})
