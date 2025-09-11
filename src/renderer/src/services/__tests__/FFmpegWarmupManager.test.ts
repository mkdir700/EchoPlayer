import { beforeEach, describe, expect, it, vi } from 'vitest'

import { FFmpegWarmupManager, ffmpegWarmupManager } from '../FFmpegWarmupManager'

// Mock window.api
const mockApi = {
  ffmpeg: {
    warmup: vi.fn(),
    getWarmupStatus: vi.fn()
  }
}

Object.defineProperty(window, 'api', {
  value: mockApi,
  writable: true
})

describe('FFmpegWarmupManager', () => {
  beforeEach(() => {
    // 重置模拟函数
    vi.clearAllMocks()

    // 重置管理器状态
    ffmpegWarmupManager.reset()
  })

  it('should be a singleton', () => {
    const instance1 = FFmpegWarmupManager.getInstance()
    const instance2 = FFmpegWarmupManager.getInstance()
    expect(instance1).toBe(instance2)
    expect(instance1).toBe(ffmpegWarmupManager)
  })

  it('should start with correct initial state', () => {
    const state = ffmpegWarmupManager.getCurrentState()
    expect(state.isWarming).toBe(false)
    expect(state.isComplete).toBe(false)
    expect(state.hasError).toBe(false)
  })

  it('should notify subscribers of state changes', () => {
    const callback = vi.fn()

    // 订阅状态变化
    const unsubscribe = ffmpegWarmupManager.subscribe(callback)

    // 应该立即收到当前状态
    expect(callback).toHaveBeenCalledTimes(1)
    expect(callback).toHaveBeenCalledWith({
      isWarming: false,
      isComplete: false,
      hasError: false
    })

    // 清理订阅
    unsubscribe()
  })

  it('should handle successful warmup', async () => {
    mockApi.ffmpeg.warmup.mockResolvedValue(true)
    const callback = vi.fn()

    ffmpegWarmupManager.subscribe(callback)

    const result = await ffmpegWarmupManager.startWarmup()

    expect(result).toBe(true)
    expect(mockApi.ffmpeg.warmup).toHaveBeenCalledTimes(1)

    // 验证状态变化序列
    expect(callback).toHaveBeenCalledWith(
      expect.objectContaining({ isWarming: false, isComplete: false })
    )
    expect(callback).toHaveBeenCalledWith(
      expect.objectContaining({ isWarming: true, isComplete: false })
    )
    expect(callback).toHaveBeenCalledWith(
      expect.objectContaining({
        isWarming: false,
        isComplete: true,
        hasError: false,
        duration: expect.any(Number)
      })
    )
  })

  it('should handle failed warmup', async () => {
    mockApi.ffmpeg.warmup.mockResolvedValue(false)
    const callback = vi.fn()

    ffmpegWarmupManager.subscribe(callback)

    const result = await ffmpegWarmupManager.startWarmup()

    expect(result).toBe(false)
    expect(mockApi.ffmpeg.warmup).toHaveBeenCalledTimes(1)

    // 验证最终状态
    const finalState = ffmpegWarmupManager.getCurrentState()
    expect(finalState.isComplete).toBe(true)
    expect(finalState.hasError).toBe(true)
    expect(finalState.errorMessage).toBe('FFmpeg 预热失败')
  })

  it('should handle warmup exception', async () => {
    const error = new Error('Network error')
    mockApi.ffmpeg.warmup.mockRejectedValue(error)

    const result = await ffmpegWarmupManager.startWarmup()

    expect(result).toBe(false)

    const finalState = ffmpegWarmupManager.getCurrentState()
    expect(finalState.hasError).toBe(true)
    expect(finalState.errorMessage).toBe('Network error')
  })

  it('should reuse existing warmup promise', async () => {
    mockApi.ffmpeg.warmup.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(true), 100))
    )

    // 同时开始多个预热
    const promises = [
      ffmpegWarmupManager.startWarmup(),
      ffmpegWarmupManager.startWarmup(),
      ffmpegWarmupManager.startWarmup()
    ]

    const results = await Promise.all(promises)

    // 应该只调用一次 API
    expect(mockApi.ffmpeg.warmup).toHaveBeenCalledTimes(1)
    // 所有 Promise 都应该返回成功
    expect(results).toEqual([true, true, true])
  })

  it('should return immediately if already completed successfully', async () => {
    // 先完成一次预热
    mockApi.ffmpeg.warmup.mockResolvedValue(true)
    await ffmpegWarmupManager.startWarmup()

    // 再次调用应该立即返回，不再调用 API
    const result = await ffmpegWarmupManager.startWarmup()

    expect(result).toBe(true)
    expect(mockApi.ffmpeg.warmup).toHaveBeenCalledTimes(1) // 只调用一次
  })

  it('should check remote status correctly', async () => {
    mockApi.ffmpeg.getWarmupStatus.mockResolvedValue({
      isWarmedUp: true,
      isWarming: false
    })

    const callback = vi.fn()
    ffmpegWarmupManager.subscribe(callback)

    await ffmpegWarmupManager.checkRemoteStatus()

    expect(mockApi.ffmpeg.getWarmupStatus).toHaveBeenCalledTimes(1)

    const finalState = ffmpegWarmupManager.getCurrentState()
    expect(finalState.isComplete).toBe(true)
    expect(finalState.hasError).toBe(false)
  })
})
