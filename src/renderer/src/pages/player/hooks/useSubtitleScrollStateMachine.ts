import type { RefObject } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { VirtuosoHandle } from 'react-virtuoso'

/**
 * 字幕滚动状态枚举
 */
export enum SubtitleScrollState {
  /** 锁定到当前字幕（自动跟随播放进度） */
  LOCKED_TO_CURRENT = 'locked_to_current',
  /** 用户浏览模式（用户手动滚动后） */
  USER_BROWSING = 'user_browsing',
  /** 过渡状态（即将自动回到当前字幕） */
  TRANSITIONING = 'transitioning',
  /** 禁用状态（初始化等） */
  DISABLED = 'disabled'
}

/**
 * 触发状态转换的事件类型
 */
export enum ScrollTrigger {
  /** 用户手动滚动 */
  USER_MANUAL_SCROLL = 'user_manual_scroll',
  /** 用户点击字幕项 */
  USER_CLICK_ITEM = 'user_click_item',
  /** 用户点击"回到当前"按钮 */
  USER_CLICK_RETURN = 'user_click_return',
  /** 自动超时触发 */
  AUTO_TIMEOUT = 'auto_timeout',
  /** 播放进度更新 */
  PLAYBACK_PROGRESS = 'playback_progress',
  /** 初始加载完成 */
  INITIAL_LOAD = 'initial_load'
}

/**
 * 滚动配置参数
 */
export const SCROLL_CONFIG = {
  /** 用户停止交互后自动回到当前字幕的延迟时间（毫秒） */
  AUTO_RETURN_DELAY: 3000,
  /** 状态转换动画时长（毫秒） */
  TRANSITION_DURATION: 500,
  /** 滚动行为类型 */
  SCROLL_BEHAVIOR: 'smooth' as ScrollBehavior,
  /** 当前字幕在视口中的位置阈值 */
  CENTER_THRESHOLD: 0.3,
  /** 视口缓冲区大小（行数） */
  VIEWPORT_BUFFER: 2
} as const

/**
 * 状态机内部状态接口
 */
interface StateMachineState {
  /** 当前滚动状态 */
  scrollState: SubtitleScrollState
  /** 最后一次用户交互时间戳 */
  lastUserInteraction: number
  /** 最后记录的滚动位置 */
  lastScrollPosition: number
  /** 当前字幕是否在视口内 */
  isInViewport: boolean
  /** 是否正在执行程序化滚动 */
  isProgrammaticScroll: boolean
}

/**
 * 状态转换规则定义
 */
const STATE_TRANSITIONS: Record<
  SubtitleScrollState,
  Partial<Record<ScrollTrigger, SubtitleScrollState>>
> = {
  [SubtitleScrollState.DISABLED]: {
    [ScrollTrigger.INITIAL_LOAD]: SubtitleScrollState.LOCKED_TO_CURRENT
  },
  [SubtitleScrollState.LOCKED_TO_CURRENT]: {
    [ScrollTrigger.USER_MANUAL_SCROLL]: SubtitleScrollState.USER_BROWSING,
    [ScrollTrigger.USER_CLICK_ITEM]: SubtitleScrollState.USER_BROWSING
  },
  [SubtitleScrollState.USER_BROWSING]: {
    [ScrollTrigger.AUTO_TIMEOUT]: SubtitleScrollState.TRANSITIONING,
    [ScrollTrigger.USER_CLICK_RETURN]: SubtitleScrollState.LOCKED_TO_CURRENT,
    [ScrollTrigger.USER_MANUAL_SCROLL]: SubtitleScrollState.USER_BROWSING // 重置定时器
  },
  [SubtitleScrollState.TRANSITIONING]: {
    [ScrollTrigger.PLAYBACK_PROGRESS]: SubtitleScrollState.LOCKED_TO_CURRENT,
    [ScrollTrigger.USER_MANUAL_SCROLL]: SubtitleScrollState.USER_BROWSING,
    [ScrollTrigger.USER_CLICK_ITEM]: SubtitleScrollState.USER_BROWSING
  }
}

/**
 * 字幕滚动状态机类
 */
class SubtitleScrollStateMachine {
  private state: StateMachineState
  private timers: Map<string, NodeJS.Timeout> = new Map()
  private onStateChangeCallback?: (newState: SubtitleScrollState) => void

  constructor() {
    this.state = {
      scrollState: SubtitleScrollState.DISABLED,
      lastUserInteraction: 0,
      lastScrollPosition: 0,
      isInViewport: true,
      isProgrammaticScroll: false
    }
  }

  /**
   * 设置状态变化回调
   */
  setOnStateChange(callback: (newState: SubtitleScrollState) => void): void {
    this.onStateChangeCallback = callback
  }

  /**
   * 获取当前状态
   */
  getCurrentState(): SubtitleScrollState {
    return this.state.scrollState
  }

  /**
   * 检查是否可以执行状态转换
   */
  canTransition(trigger: ScrollTrigger): boolean {
    const currentState = this.state.scrollState
    return !!STATE_TRANSITIONS[currentState]?.[trigger]
  }

  /**
   * 执行状态转换
   */
  transition(trigger: ScrollTrigger): boolean {
    const currentState = this.state.scrollState
    const nextState = STATE_TRANSITIONS[currentState]?.[trigger]

    if (!nextState) {
      return false // 无效转换
    }

    // 处理特殊的转换逻辑
    this.handleSpecialTransition(trigger)

    // 更新状态
    const oldState = this.state.scrollState
    this.state.scrollState = nextState
    this.state.lastUserInteraction = Date.now()

    // 处理状态变化的副作用
    this.handleStateChange(oldState, nextState, trigger)

    // 通知外部状态变化
    this.onStateChangeCallback?.(nextState)

    return true
  }

  /**
   * 启动自动回到当前字幕的定时器
   */
  startAutoReturnTimer(): void {
    this.clearTimer('autoReturn')

    const timer = setTimeout(() => {
      if (this.state.scrollState === SubtitleScrollState.USER_BROWSING) {
        this.transition(ScrollTrigger.AUTO_TIMEOUT)
      }
    }, SCROLL_CONFIG.AUTO_RETURN_DELAY)

    this.timers.set('autoReturn', timer)
  }

  /**
   * 清除指定的定时器
   */
  clearTimer(name: string): void {
    const timer = this.timers.get(name)
    if (timer) {
      clearTimeout(timer)
      this.timers.delete(name)
    }
  }

  /**
   * 清除所有定时器
   */
  clearAllTimers(): void {
    for (const timer of this.timers.values()) {
      clearTimeout(timer)
    }
    this.timers.clear()
  }

  /**
   * 设置程序化滚动标志
   */
  setProgrammaticScroll(isProgrammatic: boolean): void {
    this.state.isProgrammaticScroll = isProgrammatic
  }

  /**
   * 获取程序化滚动状态
   */
  isProgrammaticScroll(): boolean {
    return this.state.isProgrammaticScroll
  }

  /**
   * 处理特殊转换逻辑
   */
  private handleSpecialTransition(trigger: ScrollTrigger): void {
    switch (trigger) {
      case ScrollTrigger.USER_MANUAL_SCROLL:
        // 用户手动滚动时清除所有定时器
        this.clearAllTimers()
        break
      case ScrollTrigger.USER_CLICK_RETURN:
        // 用户主动点击回到当前时清除定时器
        this.clearAllTimers()
        break
    }
  }

  /**
   * 处理状态变化的副作用
   */
  private handleStateChange(
    _oldState: SubtitleScrollState,
    newState: SubtitleScrollState,
    trigger: ScrollTrigger
  ): void {
    switch (newState) {
      case SubtitleScrollState.USER_BROWSING:
        // 进入浏览模式时启动自动回到当前的定时器
        if (trigger === ScrollTrigger.USER_MANUAL_SCROLL) {
          this.startAutoReturnTimer()
        }
        break

      case SubtitleScrollState.TRANSITIONING:
        // 过渡状态，准备滚动回当前字幕
        break

      case SubtitleScrollState.LOCKED_TO_CURRENT:
        // 锁定到当前字幕，清除所有定时器
        this.clearAllTimers()
        break
    }
  }

  /**
   * 销毁状态机
   */
  destroy(): void {
    this.clearAllTimers()
    this.onStateChangeCallback = undefined
  }
}

/**
 * Hook返回的接口
 */
export interface UseSubtitleScrollStateMachineReturn {
  /** 当前滚动状态 */
  scrollState: SubtitleScrollState
  /** 是否显示"回到当前"按钮 */
  showReturnButton: boolean
  /** 是否正在自动滚动跟随 */
  isAutoScrolling: boolean
  /** 是否正在过渡状态 */
  isTransitioning: boolean
  /** 处理用户手动滚动 */
  handleUserScroll: () => void
  /** 处理用户点击"回到当前"按钮 */
  handleReturnClick: () => void
  /** 处理用户点击字幕项 */
  handleItemClick: (index: number) => void
  /** 处理Virtuoso范围变化 */
  handleRangeChanged: (range: { startIndex: number; endIndex: number }) => void
  /** 执行自动滚动到当前字幕 */
  scrollToCurrentSubtitle: (immediate?: boolean) => void
  /** 初始化状态机（首次加载完成） */
  initialize: () => void
}

/**
 * 字幕列表滚动状态机Hook
 */
export function useSubtitleScrollStateMachine(
  currentSubtitleIndex: number,
  totalSubtitles: number,
  virtuosoRef: RefObject<VirtuosoHandle>,
  onSeekToSubtitle?: (index: number) => void
): UseSubtitleScrollStateMachineReturn {
  // 状态机实例
  const stateMachineRef = useRef<SubtitleScrollStateMachine | undefined>(undefined)
  const [scrollState, setScrollState] = useState<SubtitleScrollState>(SubtitleScrollState.DISABLED)

  // 滚动相关的引用
  const resetProgrammaticTimerRef = useRef<NodeJS.Timeout | null>(null)
  const lastCurrentIndexRef = useRef<number>(-1)
  const suppressUserScrollRef = useRef(false)

  // 初始化状态机
  useEffect(() => {
    if (!stateMachineRef.current) {
      stateMachineRef.current = new SubtitleScrollStateMachine()
      stateMachineRef.current.setOnStateChange(setScrollState)
    }

    return () => {
      stateMachineRef.current?.destroy()
    }
  }, [])

  // 监听当前字幕变化，触发播放进度更新
  useEffect(() => {
    const stateMachine = stateMachineRef.current
    if (!stateMachine) return

    // 只有在索引真正变化时才触发
    if (currentSubtitleIndex !== lastCurrentIndexRef.current) {
      lastCurrentIndexRef.current = currentSubtitleIndex

      if (currentSubtitleIndex >= 0) {
        stateMachine.transition(ScrollTrigger.PLAYBACK_PROGRESS)
      }
    }
  }, [currentSubtitleIndex])

  // 计算滚动位置和对齐方式
  const calculateScrollAlignment = useCallback(
    (
      targetIndex: number,
      isLargeJump: boolean = false
    ): { align: 'start' | 'center' | 'end'; behavior: 'auto' | 'smooth' } => {
      const total = totalSubtitles
      const threshold = 3

      let align: 'start' | 'center' | 'end'

      if (targetIndex === 0) {
        align = 'start'
      } else if (targetIndex >= total - threshold) {
        align = 'end'
      } else {
        align = 'center'
      }

      return {
        align,
        behavior: isLargeJump ? 'auto' : 'smooth'
      }
    },
    [totalSubtitles]
  )

  // 执行滚动到指定字幕
  const executeScrollToIndex = useCallback(
    (targetIndex: number, immediate: boolean = false) => {
      const virtuoso = virtuosoRef.current
      if (!virtuoso || targetIndex < 0 || targetIndex >= totalSubtitles) return

      const stateMachine = stateMachineRef.current
      if (!stateMachine) return

      // 计算是否为大跳转
      const indexJump = Math.abs(targetIndex - lastCurrentIndexRef.current)
      const isLargeJump = immediate || indexJump > 5

      const { align, behavior } = calculateScrollAlignment(targetIndex, isLargeJump)

      // 设置程序化滚动标志
      stateMachine.setProgrammaticScroll(true)
      suppressUserScrollRef.current = true

      // 清除之前的重置定时器
      if (resetProgrammaticTimerRef.current) {
        clearTimeout(resetProgrammaticTimerRef.current)
      }

      // 执行滚动
      virtuoso.scrollToIndex({
        index: targetIndex,
        align,
        behavior: immediate ? 'auto' : behavior
      })

      // 设置重置程序化滚动标志的定时器
      resetProgrammaticTimerRef.current = setTimeout(() => {
        stateMachine.setProgrammaticScroll(false)
        suppressUserScrollRef.current = false
      }, 300)
    },
    [virtuosoRef, totalSubtitles, calculateScrollAlignment]
  )

  // 滚动到当前字幕
  const scrollToCurrentSubtitle = useCallback(
    (immediate: boolean = false) => {
      if (currentSubtitleIndex >= 0) {
        executeScrollToIndex(currentSubtitleIndex, immediate)
      }
    },
    [currentSubtitleIndex, executeScrollToIndex]
  )

  // 处理用户手动滚动
  const handleUserScroll = useCallback(() => {
    const stateMachine = stateMachineRef.current
    if (!stateMachine || suppressUserScrollRef.current) return

    if (stateMachine.isProgrammaticScroll()) return

    stateMachine.transition(ScrollTrigger.USER_MANUAL_SCROLL)
  }, [])

  // 处理用户点击回到当前按钮
  const handleReturnClick = useCallback(() => {
    const stateMachine = stateMachineRef.current
    if (!stateMachine) return

    stateMachine.transition(ScrollTrigger.USER_CLICK_RETURN)
    scrollToCurrentSubtitle(true) // 立即滚动
  }, [scrollToCurrentSubtitle])

  // 处理用户点击字幕项
  const handleItemClick = useCallback(
    (index: number) => {
      const stateMachine = stateMachineRef.current
      if (!stateMachine) return

      // 先切换到用户浏览状态
      stateMachine.transition(ScrollTrigger.USER_CLICK_ITEM)

      // 执行跳转到指定时间
      onSeekToSubtitle?.(index)
    },
    [onSeekToSubtitle]
  )

  // 处理Virtuoso范围变化
  const handleRangeChanged = useCallback(
    (range: { startIndex: number; endIndex: number }) => {
      const stateMachine = stateMachineRef.current
      if (!stateMachine || stateMachine.isProgrammaticScroll()) return

      const { startIndex, endIndex } = range
      const currentIndex = currentSubtitleIndex

      // 检查当前字幕是否在可见范围内
      const isCurrentInView = currentIndex >= startIndex && currentIndex <= endIndex

      if (
        !isCurrentInView &&
        stateMachine.getCurrentState() === SubtitleScrollState.LOCKED_TO_CURRENT
      ) {
        // 如果当前字幕不在可见范围但状态是锁定的，触发用户滚动
        handleUserScroll()
      }
    },
    [currentSubtitleIndex, handleUserScroll]
  )

  // 初始化状态机
  const initialize = useCallback(() => {
    const stateMachine = stateMachineRef.current
    if (!stateMachine) return

    stateMachine.transition(ScrollTrigger.INITIAL_LOAD)
  }, [])

  // 当状态变为LOCKED_TO_CURRENT或TRANSITIONING时，执行自动滚动
  useEffect(() => {
    if (
      scrollState === SubtitleScrollState.LOCKED_TO_CURRENT ||
      scrollState === SubtitleScrollState.TRANSITIONING
    ) {
      scrollToCurrentSubtitle(scrollState === SubtitleScrollState.TRANSITIONING)
    }
  }, [scrollState, scrollToCurrentSubtitle])

  // 计算派生状态
  const showReturnButton = scrollState === SubtitleScrollState.USER_BROWSING
  const isAutoScrolling = scrollState === SubtitleScrollState.LOCKED_TO_CURRENT
  const isTransitioning = scrollState === SubtitleScrollState.TRANSITIONING

  return {
    scrollState,
    showReturnButton,
    isAutoScrolling,
    isTransitioning,
    handleUserScroll,
    handleReturnClick,
    handleItemClick,
    handleRangeChanged,
    scrollToCurrentSubtitle,
    initialize
  }
}

export { SubtitleScrollStateMachine }
