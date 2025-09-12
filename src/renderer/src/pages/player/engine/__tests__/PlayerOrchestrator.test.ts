import { LoopMode } from '@types'
import { beforeEach, describe, expect, it, type Mocked, vi } from 'vitest'

import { PlayerOrchestrator, StateUpdater, VideoController } from '../PlayerOrchestrator'

describe('PlayerOrchestrator - 命令系统测试', () => {
  let orchestrator: PlayerOrchestrator
  let mockVideoController: Mocked<VideoController>
  let mockStateUpdater: Mocked<StateUpdater>
  const context = {
    currentTime: 10,
    duration: 100,
    paused: false,
    playbackRate: 1.25,
    activeCueIndex: 2,
    subtitles: [
      { id: '1', startTime: 0, endTime: 5, originalText: '字幕1' },
      { id: '2', startTime: 5, endTime: 10, originalText: '字幕2' },
      { id: '3', startTime: 10, endTime: 15, originalText: '字幕3' }
    ],
    loopEnabled: true,
    loopMode: LoopMode.SINGLE,
    loopCount: 3,
    loopRemainingCount: 2,
    autoPauseEnabled: false,
    pauseOnSubtitleEnd: false,
    resumeEnabled: false,
    resumeDelay: 3000
  }

  beforeEach(() => {
    // 创建 mock VideoController
    mockVideoController = {
      play: vi.fn().mockResolvedValue(undefined),
      pause: vi.fn(),
      seek: vi.fn(),
      setPlaybackRate: vi.fn(),
      setVolume: vi.fn(),
      setMuted: vi.fn(),
      getCurrentTime: vi.fn().mockReturnValue(0),
      getDuration: vi.fn().mockReturnValue(100),
      isPaused: vi.fn().mockReturnValue(true),
      getPlaybackRate: vi.fn().mockReturnValue(1),
      getVolume: vi.fn().mockReturnValue(1),
      isMuted: vi.fn().mockReturnValue(false)
    }

    // 创建 mock StateUpdater
    mockStateUpdater = {
      setCurrentTime: vi.fn(),
      setDuration: vi.fn(),
      setPlaying: vi.fn(),
      updateLoopRemaining: vi.fn(),
      // 新增的状态同步方法
      setPlaybackRate: vi.fn(),
      setVolume: vi.fn(),
      setMuted: vi.fn(),
      setSeeking: vi.fn(),
      setEnded: vi.fn(),
      updateUIState: vi.fn()
    }

    // 初始化 orchestrator
    orchestrator = new PlayerOrchestrator({ ...context })

    orchestrator.connectVideoController(mockVideoController)
    orchestrator.connectStateUpdater(mockStateUpdater)
  })

  describe('统一命令 API', () => {
    it('should handle requestPlay command', async () => {
      await orchestrator.requestPlay()
      expect(mockVideoController.play).toHaveBeenCalled()
    })

    it('should handle requestPause command', () => {
      orchestrator.requestPause()
      expect(mockVideoController.pause).toHaveBeenCalled()
    })

    it('should handle requestTogglePlay command when paused', async () => {
      // 修复：设置内部上下文状态为暂停，这是新的逻辑依赖
      orchestrator.updateContext({ paused: true })
      await orchestrator.requestTogglePlay()
      expect(mockVideoController.play).toHaveBeenCalled()
    })

    it('should handle requestTogglePlay command when playing', async () => {
      // 修复：设置内部上下文状态为播放，这是新的逻辑依赖
      orchestrator.updateContext({ paused: false })
      await orchestrator.requestTogglePlay()
      expect(mockVideoController.pause).toHaveBeenCalled()
    })

    it('should handle requestSeek command', () => {
      const seekTime = 30.5
      orchestrator.requestSeek(seekTime)
      expect(mockVideoController.seek).toHaveBeenCalledWith(seekTime)
    })

    it('should handle requestSeekBy command for forward seek', () => {
      mockVideoController.getCurrentTime.mockReturnValue(20)
      orchestrator.requestSeekBy(10)
      expect(mockVideoController.seek).toHaveBeenCalledWith(30)
    })

    it('should handle requestSeekBy command for backward seek', () => {
      mockVideoController.getCurrentTime.mockReturnValue(20)
      orchestrator.requestSeekBy(-5)
      expect(mockVideoController.seek).toHaveBeenCalledWith(15)
    })

    it('should clamp seek time to valid range', () => {
      mockVideoController.getCurrentTime.mockReturnValue(5)
      mockVideoController.getDuration.mockReturnValue(100)

      // 测试负数时间被钳制为 0
      orchestrator.requestSeekBy(-10)
      expect(mockVideoController.seek).toHaveBeenCalledWith(0)
    })

    it('should handle requestSetPlaybackRate command', () => {
      const rate = 1.5
      orchestrator.requestSetPlaybackRate(rate)
      expect(mockVideoController.setPlaybackRate).toHaveBeenCalledWith(rate)
    })

    it('should handle requestSetVolume command', () => {
      const volume = 0.7
      orchestrator.requestSetVolume(volume)
      expect(mockVideoController.setVolume).toHaveBeenCalledWith(volume)
    })

    it('should handle requestToggleMute command when not muted', () => {
      mockVideoController.isMuted.mockReturnValue(false)
      orchestrator.requestToggleMute()
      expect(mockVideoController.setMuted).toHaveBeenCalledWith(true)
    })

    it('should handle requestToggleMute command when muted', () => {
      mockVideoController.isMuted.mockReturnValue(true)
      orchestrator.requestToggleMute()
      expect(mockVideoController.setMuted).toHaveBeenCalledWith(false)
    })
  })

  describe('状态查询方法', () => {
    it('should return current volume', () => {
      mockVideoController.getVolume.mockReturnValue(0.8)
      expect(orchestrator.getCurrentVolume()).toBe(0.8)
    })

    it('should return muted status', () => {
      mockVideoController.isMuted.mockReturnValue(true)
      expect(orchestrator.isMuted()).toBe(true)
    })

    it('should return video controller connection status', () => {
      expect(orchestrator.isVideoControllerConnected()).toBe(true)

      // 测试未连接状态
      const newOrchestrator = new PlayerOrchestrator(context)
      expect(newOrchestrator.isVideoControllerConnected()).toBe(false)
    })
  })

  describe('错误处理', () => {
    it('should handle play failure gracefully', async () => {
      const error = new Error('Play failed')
      mockVideoController.play.mockRejectedValue(error)

      // 应该不会抛出异常
      await expect(orchestrator.requestPlay()).resolves.toBeUndefined()
    })

    it('should handle commands when video controller not connected', () => {
      const newOrchestrator = new PlayerOrchestrator({ ...context })

      // 应该不会抛出异常
      expect(() => newOrchestrator.requestPause()).not.toThrow()
      expect(() => newOrchestrator.requestSeek(10)).not.toThrow()
      expect(() => newOrchestrator.requestSetVolume(0.5)).not.toThrow()
    })
  })

  describe('媒体事件处理', () => {
    it('should handle timeupdate events', () => {
      const currentTime = 45.2
      orchestrator.onTimeUpdate(currentTime)
      expect(mockStateUpdater.setCurrentTime).toHaveBeenCalledWith(currentTime)
    })

    it('should handle duration change events', () => {
      const duration = 120.5
      orchestrator.onDurationChange(duration)
      expect(mockStateUpdater.setDuration).toHaveBeenCalledWith(duration)
    })
  })

  describe('上下文更新', () => {
    it('should update playback context', () => {
      expect(() => orchestrator.updateContext(context)).not.toThrow()
    })
  })

  describe('状态同步测试', () => {
    it('should sync playback rate to state manager when calling requestSetPlaybackRate', () => {
      const rate = 1.5
      orchestrator.requestSetPlaybackRate(rate)

      expect(mockVideoController.setPlaybackRate).toHaveBeenCalledWith(rate)
      expect(mockStateUpdater.setPlaybackRate).toHaveBeenCalledWith(rate)
    })

    it('should sync volume to state manager when calling requestSetVolume', () => {
      const volume = 0.7
      orchestrator.requestSetVolume(volume)

      expect(mockVideoController.setVolume).toHaveBeenCalledWith(volume)
      expect(mockStateUpdater.setVolume).toHaveBeenCalledWith(volume)
    })

    it('should sync muted state to state manager when calling requestToggleMute', () => {
      mockVideoController.isMuted.mockReturnValue(false)
      orchestrator.requestToggleMute()

      expect(mockVideoController.setMuted).toHaveBeenCalledWith(true)
      expect(mockStateUpdater.setMuted).toHaveBeenCalledWith(true)
    })

    it('should sync seeking state during seek events', () => {
      orchestrator.onSeeking()
      expect(mockStateUpdater.setSeeking).toHaveBeenCalledWith(true)

      const seekTime = 30
      orchestrator.onSeeked(seekTime)
      expect(mockStateUpdater.setSeeking).toHaveBeenCalledWith(false)
    })

    it('should sync ended state when video ends', () => {
      orchestrator.onEnded()
      expect(mockStateUpdater.setEnded).toHaveBeenCalledWith(true)
    })

    it('should sync playback rate when playback rate changes', () => {
      const rate = 2.0
      orchestrator.onPlaybackRateChange(rate)
      expect(mockStateUpdater.setPlaybackRate).toHaveBeenCalledWith(rate)
    })

    it('should clamp and sync playback rate values', () => {
      // 测试超出范围的值被钳制
      orchestrator.requestSetPlaybackRate(5.0) // 超过最大值 4
      expect(mockVideoController.setPlaybackRate).toHaveBeenCalledWith(4)
      expect(mockStateUpdater.setPlaybackRate).toHaveBeenCalledWith(4)

      orchestrator.requestSetPlaybackRate(0.1) // 低于最小值 0.25
      expect(mockVideoController.setPlaybackRate).toHaveBeenCalledWith(0.25)
      expect(mockStateUpdater.setPlaybackRate).toHaveBeenCalledWith(0.25)
    })

    it('should clamp and sync volume values', () => {
      // 测试超出范围的值被钳制
      orchestrator.requestSetVolume(1.5) // 超过最大值 1
      expect(mockVideoController.setVolume).toHaveBeenCalledWith(1)
      expect(mockStateUpdater.setVolume).toHaveBeenCalledWith(1)

      orchestrator.requestSetVolume(-0.5) // 低于最小值 0
      expect(mockVideoController.setVolume).toHaveBeenCalledWith(0)
      expect(mockStateUpdater.setVolume).toHaveBeenCalledWith(0)
    })
  })
})
