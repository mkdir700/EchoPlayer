import { LoopMode } from '@types'
import { afterEach, beforeEach, describe, expect, it, type Mocked, vi } from 'vitest'

import { PlayerOrchestrator, StateUpdater, VideoController } from '../PlayerOrchestrator'

describe('PlayerOrchestrator - 播放/暂停可靠性测试', () => {
  let orchestrator: PlayerOrchestrator
  let mockVideoController: Mocked<VideoController>
  let mockStateUpdater: Mocked<StateUpdater>
  let mockClockScheduler: any

  const context = {
    currentTime: 10,
    duration: 100,
    paused: true, // 初始状态为暂停
    playbackRate: 1,
    activeCueIndex: -1,
    subtitles: [],
    loopEnabled: false,
    loopMode: LoopMode.SINGLE,
    loopCount: -1,
    loopRemainingCount: -1,
    autoPauseEnabled: false,
    pauseOnSubtitleEnd: false,
    resumeEnabled: false,
    resumeDelay: 5000,
    volume: 1
  }

  afterEach(() => {
    vi.restoreAllMocks()
  })

  beforeEach(() => {
    // Mock console methods to avoid test output pollution
    vi.spyOn(console, 'debug').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})

    // 创建 mock VideoController
    mockVideoController = {
      play: vi.fn().mockResolvedValue(undefined),
      pause: vi.fn(),
      seek: vi.fn(),
      setPlaybackRate: vi.fn(),
      setVolume: vi.fn(),
      setMuted: vi.fn(),
      getCurrentTime: vi.fn().mockReturnValue(10),
      getDuration: vi.fn().mockReturnValue(100),
      isPaused: vi.fn().mockReturnValue(true), // 初始状态为暂停
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

    // 访问私有的 clockScheduler 进行 mock
    const scheduler = (orchestrator as any).clockScheduler
    if (scheduler) {
      mockClockScheduler = scheduler
      vi.spyOn(scheduler, 'getState').mockReturnValue('paused')
      vi.spyOn(scheduler, 'pause').mockImplementation(() => {})
      vi.spyOn(scheduler, 'resume').mockImplementation(() => {})
    }
  })

  describe('requestTogglePlay - 使用内部状态修复', () => {
    it('应该使用内部上下文状态而非视频元素状态来判断播放/暂停', async () => {
      // 设置场景：内部状态为暂停，但视频元素状态为播放（状态不同步）
      orchestrator.updateContext({ paused: true })
      mockVideoController.isPaused.mockReturnValue(false) // 视频元素状态不同步

      await orchestrator.requestTogglePlay()

      // 应该根据内部状态(true)执行播放操作，而不是根据视频元素状态(false)
      expect(mockVideoController.play).toHaveBeenCalled()
      expect(mockVideoController.pause).not.toHaveBeenCalled()
    })

    it('应该正确处理内部状态为播放时的切换', async () => {
      // 设置场景：内部状态为播放
      orchestrator.updateContext({ paused: false })
      mockVideoController.isPaused.mockReturnValue(true) // 视频元素状态不同步

      await orchestrator.requestTogglePlay()

      // 应该根据内部状态(false)执行暂停操作
      expect(mockVideoController.pause).toHaveBeenCalled()
      expect(mockVideoController.play).not.toHaveBeenCalled()
    })

    it('应该处理播放操作失败的情况', async () => {
      const playError = new Error('DOMException: play() failed')
      mockVideoController.play.mockRejectedValue(playError)
      orchestrator.updateContext({ paused: true })

      // 不应该抛出异常
      await expect(orchestrator.requestTogglePlay()).resolves.toBeUndefined()

      // 应该记录错误并尝试同步状态
      expect(mockVideoController.play).toHaveBeenCalled()
    })

    it('应该在播放失败后验证状态并尝试同步', async () => {
      orchestrator.updateContext({ paused: true })
      mockVideoController.isPaused.mockReturnValue(true)

      await orchestrator.requestTogglePlay()

      // 使用 setTimeout 模拟延迟验证
      await new Promise((resolve) => setTimeout(resolve, 150))

      // 验证播放调用确实发生了
      expect(mockVideoController.play).toHaveBeenCalled()
    })
  })

  describe('syncPlaybackState - 状态同步修复', () => {
    it('应该检测到内部状态与视频元素状态不一致', () => {
      // 设置不一致的状态
      orchestrator.updateContext({ paused: true }) // 内部状态：暂停
      mockVideoController.isPaused.mockReturnValue(false) // 视频状态：播放

      // 调用私有方法进行状态同步测试
      const syncMethod = (orchestrator as any).syncPlaybackState.bind(orchestrator)
      syncMethod()

      // 应该同步内部状态到视频元素的实际状态
      const newContext = orchestrator.getContext()
      expect(newContext.paused).toBe(false) // 应该被同步为播放状态
      expect(mockStateUpdater.setPlaying).toHaveBeenCalledWith(true)
    })

    it('应该同步ClockScheduler状态', () => {
      // 设置状态不一致
      orchestrator.updateContext({ paused: false }) // 内部状态：播放
      mockVideoController.isPaused.mockReturnValue(true) // 视频状态：暂停

      if (mockClockScheduler) {
        mockClockScheduler.getState.mockReturnValue('running') // 调度器状态：运行中
      }

      // 调用状态同步
      const syncMethod = (orchestrator as any).syncPlaybackState.bind(orchestrator)
      syncMethod()

      // 应该同步调度器状态
      if (mockClockScheduler) {
        expect(mockClockScheduler.pause).toHaveBeenCalled()
      }
    })

    it('当状态一致时不应该进行不必要的同步操作', () => {
      // 设置一致的状态
      orchestrator.updateContext({ paused: true })
      mockVideoController.isPaused.mockReturnValue(true)

      const syncMethod = (orchestrator as any).syncPlaybackState.bind(orchestrator)
      syncMethod()

      // 不应该调用状态更新方法
      expect(mockStateUpdater.setPlaying).not.toHaveBeenCalled()
    })
  })

  describe('requestPlay - 乐观更新和验证', () => {
    it('应该立即更新内部状态（乐观更新）', async () => {
      orchestrator.updateContext({ paused: true })

      // 让play()调用需要一些时间
      mockVideoController.play.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 50))
      )

      const playPromise = orchestrator.requestPlay()

      // play()调用完成前，内部状态应该已经更新
      const contextDuringPlay = orchestrator.getContext()
      expect(contextDuringPlay.paused).toBe(false)

      await playPromise
    })

    it('应该在播放失败时回滚乐观更新', async () => {
      orchestrator.updateContext({ paused: true })
      const playError = new Error('Play failed')
      mockVideoController.play.mockRejectedValue(playError)

      await orchestrator.requestPlay()

      // 状态应该被回滚到暂停
      const finalContext = orchestrator.getContext()
      expect(finalContext.paused).toBe(true)
    })

    it('应该在延迟验证中检测播放失败', async () => {
      orchestrator.updateContext({ paused: true })
      mockVideoController.isPaused.mockReturnValue(true) // 播放后仍然是暂停状态

      await orchestrator.requestPlay()

      // 等待延迟验证执行
      await new Promise((resolve) => setTimeout(resolve, 200))

      // 应该尝试重试播放
      expect(mockVideoController.play).toHaveBeenCalledTimes(2) // 一次正常调用，一次重试
    })
  })

  describe('requestPause - 状态验证', () => {
    it('应该立即更新内部状态', () => {
      orchestrator.updateContext({ paused: false })

      orchestrator.requestPause()

      // 内部状态应该立即更新
      const context = orchestrator.getContext()
      expect(context.paused).toBe(true)
    })

    it('应该在延迟验证中检测暂停失败', async () => {
      orchestrator.updateContext({ paused: false })
      mockVideoController.isPaused.mockReturnValue(false) // 暂停后仍然是播放状态

      orchestrator.requestPause()

      // 等待延迟验证
      await new Promise((resolve) => setTimeout(resolve, 100))

      // 应该尝试重试暂停
      expect(mockVideoController.pause).toHaveBeenCalledTimes(2)
    })
  })

  describe('错误恢复和边界情况', () => {
    it('应该处理videoController未连接的情况', async () => {
      const orphanOrchestrator = new PlayerOrchestrator(context)

      // 不应该抛出异常
      await expect(orphanOrchestrator.requestTogglePlay()).resolves.toBeUndefined()
      await expect(orphanOrchestrator.requestPlay()).resolves.toBeUndefined()
      expect(() => orphanOrchestrator.requestPause()).not.toThrow()
    })

    it('应该处理同步状态时videoController为null的情况', () => {
      const orphanOrchestrator = new PlayerOrchestrator(context)
      const syncMethod = (orphanOrchestrator as any).syncPlaybackState.bind(orphanOrchestrator)

      // 不应该抛出异常
      expect(() => syncMethod()).not.toThrow()
    })

    it('应该处理连续快速的播放/暂停切换', async () => {
      orchestrator.updateContext({ paused: true })

      // 快速连续调用
      const promise1 = orchestrator.requestTogglePlay()
      const promise2 = orchestrator.requestTogglePlay()
      const promise3 = orchestrator.requestTogglePlay()

      await Promise.all([promise1, promise2, promise3])

      // 应该至少有一次播放调用
      expect(mockVideoController.play).toHaveBeenCalled()
    })

    it('应该处理play()返回rejected Promise的情况', async () => {
      const notAllowedError = new DOMException('play() failed', 'NotAllowedError')
      mockVideoController.play.mockRejectedValue(notAllowedError)
      orchestrator.updateContext({ paused: true })

      // 不应该抛出未捕获的异常
      await expect(orchestrator.requestTogglePlay()).resolves.toBeUndefined()

      // 状态应该被正确恢复
      const context = orchestrator.getContext()
      expect(context.paused).toBe(true)
    })
  })

  describe('实际使用场景模拟', () => {
    it('应该正确处理用户快捷键触发的播放/暂停', async () => {
      // 模拟用户按下空格键时的状态
      orchestrator.updateContext({ paused: true, currentTime: 30.5 })
      mockVideoController.getCurrentTime.mockReturnValue(30.5)

      await orchestrator.requestTogglePlay()

      expect(mockVideoController.play).toHaveBeenCalled()

      // 模拟播放成功后再次按空格暂停
      orchestrator.updateContext({ paused: false })
      await orchestrator.requestTogglePlay()

      expect(mockVideoController.pause).toHaveBeenCalled()
    })

    it('应该正确处理浏览器自动暂停后的恢复播放', async () => {
      // 模拟浏览器自动暂停（例如标签页失去焦点）
      orchestrator.updateContext({ paused: false }) // 内部认为还在播放
      mockVideoController.isPaused.mockReturnValue(true) // 但实际已暂停

      // 用户尝试恢复播放
      await orchestrator.requestTogglePlay()

      // 应该调用暂停（因为内部状态为播放）
      expect(mockVideoController.pause).toHaveBeenCalled()

      // 然后状态同步应该修正这个问题
      const syncMethod = (orchestrator as any).syncPlaybackState.bind(orchestrator)
      syncMethod()

      const newContext = orchestrator.getContext()
      expect(newContext.paused).toBe(true) // 状态已同步
    })

    it('应该处理网络问题导致的播放失败', async () => {
      const networkError = new DOMException('Network error', 'NetworkError')
      mockVideoController.play.mockRejectedValue(networkError)
      orchestrator.updateContext({ paused: true })

      await orchestrator.requestPlay()

      // 状态应该被回滚
      const context = orchestrator.getContext()
      expect(context.paused).toBe(true)
    })
  })
})
