/**
 * Loop Toggle Hook - Simplified Architecture
 * 循环切换 Hook - 简化架构
 *
 * 架构简化：
 * - 整合状态管理和播放逻辑 / Integrate state management and playback logic
 * - 减少hook层次和参数传递 / Reduce hook layers and parameter passing
 * - 保持关注点分离和可测试性 / Maintain separation of concerns and testability
 * - 优化性能和依赖管理 / Optimize performance and dependency management
 */

import { useReducer, useEffect, useCallback, useMemo, useRef } from 'react'
import {
  useLoopSettings,
  useSetLoopSettings,
  useIsSingleLoop,
  useSetIsSingleLoop
} from '@renderer/stores/slices/videoConfigStore'
import { useVideoPlayerContext } from '@renderer/hooks/core/useVideoPlayerContext'
import { useSubtitleListContext } from '@renderer/hooks/core/useSubtitleListContext'
import { useVideoControls } from '@renderer/hooks/features/video/useVideoPlayerHooks'
import type { LoopSettings, SubtitleItem } from '@types_/shared'
import { RendererLogger } from '@renderer/utils/logger'
import {
  loopComponentReducer,
  initialLoopComponentState,
  loopToggleActions
} from '../reducers/loopToggleReducer'

// 循环播放状态类型定义 / Loop playback state type definitions
interface LoopPlaybackState {
  currentLoopSubtitle: SubtitleItem | null
  currentSubtitleIndex: number
  lastLoopTime: number
  isInitialized: boolean
}

// 循环播放动作类型定义 / Loop playback action type definitions
type LoopPlaybackAction =
  | { type: 'INITIALIZE_LOOP'; subtitle: SubtitleItem; index: number }
  | { type: 'CLEAR_LOOP_STATE' }
  | { type: 'UPDATE_LOOP_TIME'; time: number }
  | { type: 'MOVE_TO_NEXT_SUBTITLE'; subtitle: SubtitleItem; index: number }

// 初始循环播放状态 / Initial loop playback state
const initialLoopPlaybackState: LoopPlaybackState = {
  currentLoopSubtitle: null,
  currentSubtitleIndex: -1,
  lastLoopTime: 0,
  isInitialized: false
}

// 循环播放状态 Reducer / Loop playback state reducer
function loopPlaybackReducer(
  state: LoopPlaybackState,
  action: LoopPlaybackAction
): LoopPlaybackState {
  switch (action.type) {
    case 'INITIALIZE_LOOP':
      return {
        ...state,
        currentLoopSubtitle: action.subtitle,
        currentSubtitleIndex: action.index,
        isInitialized: true
      }

    case 'CLEAR_LOOP_STATE':
      return initialLoopPlaybackState

    case 'UPDATE_LOOP_TIME':
      return {
        ...state,
        lastLoopTime: action.time
      }

    case 'MOVE_TO_NEXT_SUBTITLE':
      return {
        ...state,
        currentLoopSubtitle: action.subtitle,
        currentSubtitleIndex: action.index
      }

    default:
      return state
  }
}

// Hook 返回值接口 / Hook return value interface
export interface UseLoopToggleReturn {
  // UI 状态 / UI state
  remainingCount: number
  isMenuOpen: boolean
  isCustomModalOpen: boolean
  loopSettings: LoopSettings
  isSingleLoop: boolean

  // 播放状态 / Playback state
  currentLoopSubtitle: SubtitleItem | null
  isLoopActive: boolean

  // 事件处理器 / Event handlers
  handleLoopToggle: () => void
  handleCountChange: (count: number) => void
  handleContextMenu: (e: React.MouseEvent) => void
  handleMenuOpenChange: (open: boolean) => void
  handleCustomModalConfirm: (count: number) => void
  handleCustomModalCancel: () => void

  // 内部方法（用于复杂场景）/ Internal methods (for complex scenarios)
  dispatch: React.Dispatch<ReturnType<(typeof loopToggleActions)[keyof typeof loopToggleActions]>>
}

/**
 * 循环切换统一 Hook / Unified loop toggle hook
 *
 * 特性 / Features:
 * - 简化架构：2层结构替代4层 / Simplified architecture: 2-layer instead of 4-layer
 * - 统一状态管理：UI状态和播放状态统一管理 / Unified state management
 * - 性能优化：减少不必要的重新渲染和参数传递 / Performance optimization
 * - 类型安全：完整的 TypeScript 支持 / Type safety: full TypeScript support
 * - 易于测试：核心逻辑可独立测试 / Easy to test: core logic can be tested independently
 *
 * @param fileId - 当前文件ID / Current file ID
 * @returns 循环切换的完整状态和方法 / Complete state and methods for loop toggle
 */
export function useLoopToggle(fileId: string): UseLoopToggleReturn {
  // ===== 外部依赖获取 / External dependencies =====
  const { isVideoLoadedRef, isPlayingRef, subscribeToTime, currentTimeRef } =
    useVideoPlayerContext()
  const { subtitleItemsRef, getCurrentSubtitleIndex: getSubtitleIndexForTime } =
    useSubtitleListContext()
  const { seekTo } = useVideoControls()

  // ===== 外部状态管理 / External state management =====
  const rawLoopSettings = useLoopSettings(fileId)
  const setLoopSettings = useSetLoopSettings()
  const isSingleLoop = useIsSingleLoop(fileId)
  const setIsSingleLoop = useSetIsSingleLoop()

  // 使用 useMemo 优化默认值逻辑 / Use useMemo to optimize default value logic
  const loopSettings = useMemo(() => {
    return rawLoopSettings || { count: -1 } // 默认无限循环 / Default infinite loop
  }, [rawLoopSettings])

  // ===== 内部状态管理 / Internal state management =====
  const [uiState, uiDispatch] = useReducer(loopComponentReducer, initialLoopComponentState)
  const [playbackState, playbackDispatch] = useReducer(
    loopPlaybackReducer,
    initialLoopPlaybackState
  )

  // 性能优化：缓存稳定的引用 / Performance optimization: cache stable references
  const stableRefsRef = useRef({
    getCurrentSubtitleIndex: () => getSubtitleIndexForTime(currentTimeRef.current || 0),
    seekTo,
    setIsSingleLoop,
    uiDispatch
  })

  // 更新稳定引用 / Update stable references
  stableRefsRef.current = {
    getCurrentSubtitleIndex: () => getSubtitleIndexForTime(currentTimeRef.current || 0),
    seekTo,
    setIsSingleLoop,
    uiDispatch
  }

  // ===== 状态同步副作用 / State synchronization side effects =====

  // 同步循环设置变化时的剩余次数 / Sync remaining count when loop settings change
  useEffect(() => {
    uiDispatch(loopToggleActions.initializeLoopState(isSingleLoop, loopSettings.count))
  }, [isSingleLoop, loopSettings.count])

  // 循环状态清理副作用 / Loop state cleanup side effect
  useEffect(() => {
    if (!isSingleLoop) {
      RendererLogger.info('🔄 清理循环状态')
      playbackDispatch({ type: 'CLEAR_LOOP_STATE' })
      uiDispatch(loopToggleActions.clearLoopState())
    }
  }, [isSingleLoop])

  // ===== 事件处理器 / Event handlers =====

  // 循环开关切换逻辑 / Loop toggle logic
  const handleLoopToggle = useCallback(() => {
    if (!fileId) return

    // 简单的开启/关闭切换 / Simple on/off toggle
    const newIsSingleLoop = !isSingleLoop
    setIsSingleLoop(fileId, newIsSingleLoop)

    // 更新内部状态 / Update internal state
    uiDispatch(loopToggleActions.toggleLoop(newIsSingleLoop, loopSettings.count))

    RendererLogger.info('🔄 循环开关切换:', {
      action: isSingleLoop ? '关闭' : '开启',
      count: loopSettings.count === -1 ? '无限' : loopSettings.count
    })
  }, [fileId, isSingleLoop, loopSettings.count, setIsSingleLoop])

  // 处理循环次数设置 / Handle loop count setting
  const handleCountChange = useCallback(
    (count: number) => {
      if (!fileId) return

      const newSettings: LoopSettings = { count }
      setLoopSettings(fileId, newSettings)

      // 更新内部状态 / Update internal state
      uiDispatch(loopToggleActions.setLoopCount(count, isSingleLoop))

      RendererLogger.info('🔄 循环次数设置:', count === -1 ? '无限循环' : `${count}次`)
    },
    [fileId, isSingleLoop, setLoopSettings]
  )

  // 处理右键菜单 / Handle right-click menu
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    uiDispatch(loopToggleActions.openMenu())
  }, [])

  // 处理菜单开关状态变化 / Handle menu open/close state change
  const handleMenuOpenChange = useCallback((open: boolean) => {
    if (!open) {
      uiDispatch(loopToggleActions.closeMenu())
    }
  }, [])

  // 处理自定义次数确认 / Handle custom count confirmation
  const handleCustomModalConfirm = useCallback(
    (count: number) => {
      handleCountChange(count)
      uiDispatch(loopToggleActions.closeCustomModal())
    },
    [handleCountChange]
  )

  // 处理自定义次数取消 / Handle custom count cancellation
  const handleCustomModalCancel = useCallback(() => {
    uiDispatch(loopToggleActions.closeCustomModal())
  }, [])

  // ===== 循环播放核心逻辑 / Core loop playback logic =====

  // 循环播放核心逻辑副作用 / Core loop playback logic side effect
  useEffect(() => {
    if (!isSingleLoop || !fileId) {
      return
    }

    RendererLogger.info('🔄 开始设置循环监听器')

    const handleTimeUpdate = (currentTime: number, source?: string): void => {
      // 忽略来自循环逻辑的时间更新，避免无限递归 / Ignore time updates from loop logic to avoid infinite recursion
      if (source === 'loop') {
        return
      }

      // 基础条件检查 / Basic condition check
      const isVideoLoaded = isVideoLoadedRef.current
      const isPlaying = isPlayingRef.current
      const subtitleItems = subtitleItemsRef.current || []

      if (!isVideoLoaded || !isPlaying || subtitleItems.length === 0) {
        return
      }

      const { getCurrentSubtitleIndex, seekTo, setIsSingleLoop, uiDispatch } = stableRefsRef.current

      const currentIndex = getCurrentSubtitleIndex()
      const currentSubtitle = subtitleItems[currentIndex]

      // 初始化循环状态 / Initialize loop state
      if (!playbackState.isInitialized) {
        if (currentIndex >= 0 && currentSubtitle) {
          playbackDispatch({
            type: 'INITIALIZE_LOOP',
            subtitle: currentSubtitle,
            index: currentIndex
          })

          // 为指定次数循环模式初始化剩余次数 / Initialize remaining count for count loop mode
          if (loopSettings.count >= 2) {
            uiDispatch(loopToggleActions.resetRemainingCount(loopSettings.count))
          }

          RendererLogger.info('🔄 循环：自动锁定当前字幕', {
            index: currentIndex,
            text: currentSubtitle.text,
            startTime: currentSubtitle.startTime,
            endTime: currentSubtitle.endTime,
            count: loopSettings.count
          })
        }
        return
      }

      // 检查是否需要重新初始化循环状态（用户跳转到新字幕时）/ Check if need to reinitialize loop state (when user jumps to new subtitle)
      if (
        source === 'user' &&
        currentIndex >= 0 &&
        currentSubtitle &&
        playbackState.currentSubtitleIndex !== currentIndex
      ) {
        RendererLogger.info('🔄 用户跳转：重新初始化循环状态到新字幕', {
          oldIndex: playbackState.currentSubtitleIndex,
          newIndex: currentIndex,
          newText: currentSubtitle.text,
          newStartTime: currentSubtitle.startTime,
          newEndTime: currentSubtitle.endTime
        })

        playbackDispatch({
          type: 'INITIALIZE_LOOP',
          subtitle: currentSubtitle,
          index: currentIndex
        })

        // 重置剩余次数 / Reset remaining count
        if (loopSettings.count >= 2) {
          uiDispatch(loopToggleActions.resetRemainingCount(loopSettings.count))
        }
        return
      }

      // 处理循环逻辑 / Handle loop logic
      if (
        playbackState.currentLoopSubtitle &&
        currentTime > playbackState.currentLoopSubtitle.endTime
      ) {
        const now = Date.now()

        // 防抖处理 / Debounce handling
        if (now - playbackState.lastLoopTime < 500) {
          return
        }

        playbackDispatch({ type: 'UPDATE_LOOP_TIME', time: now })

        // 根据循环模式处理 / Handle based on loop mode
        handleLoopLogic({
          loopSubtitle: playbackState.currentLoopSubtitle,
          currentIndex: playbackState.currentSubtitleIndex,
          loopCount: loopSettings.count,
          remainingCount: uiState.remainingCount,
          subtitleItems,
          seekTo,
          setIsSingleLoop,
          uiDispatch,
          playbackDispatch,
          fileId
        })
      }
    }

    // 订阅时间更新 / Subscribe to time updates
    const unsubscribe = subscribeToTime(handleTimeUpdate)

    return () => {
      RendererLogger.info('🔄 清理循环监听器')
      unsubscribe()
    }
  }, [
    isSingleLoop,
    fileId,
    loopSettings.count,
    playbackState.isInitialized,
    playbackState.currentLoopSubtitle,
    playbackState.currentSubtitleIndex,
    playbackState.lastLoopTime,
    uiState.remainingCount,
    subscribeToTime,
    isVideoLoadedRef,
    isPlayingRef,
    subtitleItemsRef
  ])

  // 计算派生状态 / Calculate derived state
  const isLoopActive = useMemo(() => {
    return isSingleLoop && playbackState.currentLoopSubtitle !== null
  }, [isSingleLoop, playbackState.currentLoopSubtitle])

  return {
    // UI 状态 / UI state
    remainingCount: uiState.remainingCount,
    isMenuOpen: uiState.isMenuOpen,
    isCustomModalOpen: uiState.isCustomModalOpen,
    loopSettings,
    isSingleLoop,

    // 播放状态 / Playback state
    currentLoopSubtitle: playbackState.currentLoopSubtitle,
    isLoopActive,

    // 事件处理器 / Event handlers
    handleLoopToggle,
    handleCountChange,
    handleContextMenu,
    handleMenuOpenChange,
    handleCustomModalConfirm,
    handleCustomModalCancel,

    // 内部方法 / Internal methods
    dispatch: uiDispatch
  }
}

// ===== 辅助函数 / Helper functions =====

// 循环逻辑处理参数接口 / Loop logic handling parameters interface
interface HandleLoopLogicParams {
  loopSubtitle: SubtitleItem
  currentIndex: number
  loopCount: number
  remainingCount: number
  subtitleItems: SubtitleItem[]
  seekTo: (time: number, source?: 'user' | 'loop' | 'system') => void
  setIsSingleLoop: (fileId: string, value: boolean) => void
  uiDispatch: React.Dispatch<ReturnType<(typeof loopToggleActions)[keyof typeof loopToggleActions]>>
  playbackDispatch: React.Dispatch<LoopPlaybackAction>
  fileId: string
}

/**
 * 处理循环播放逻辑 / Handle loop playback logic
 *
 * 职责分离：
 * - 无限循环处理 / Infinite loop handling
 * - 有限次数循环处理 / Finite count loop handling
 * - 下一句跳转处理 / Next subtitle jump handling
 * - 循环结束处理 / Loop completion handling
 *
 * @param params - 循环逻辑处理参数 / Loop logic handling parameters
 */
function handleLoopLogic(params: HandleLoopLogicParams): void {
  const {
    loopSubtitle,
    currentIndex,
    loopCount,
    remainingCount,
    subtitleItems,
    seekTo,
    setIsSingleLoop,
    uiDispatch,
    playbackDispatch,
    fileId
  } = params

  // 无限循环模式 / Infinite loop mode
  if (loopCount === -1) {
    RendererLogger.info('🔄 无限循环：跳转到字幕开始', {
      text: loopSubtitle.text,
      startTime: loopSubtitle.startTime
    })
    seekTo(loopSubtitle.startTime, 'loop')
    return
  }

  // 有限次数循环模式 / Finite count loop mode
  if (loopCount >= 2) {
    if (remainingCount > 1) {
      // 还有剩余次数，继续循环 / Still have remaining count, continue looping
      RendererLogger.info('🔄 有限循环：继续循环', {
        remainingCount: remainingCount - 1,
        text: loopSubtitle.text
      })
      seekTo(loopSubtitle.startTime, 'loop')
      uiDispatch(loopToggleActions.decreaseRemainingCount())
    } else {
      // 循环次数用完，跳转到下一句 / Loop count exhausted, jump to next subtitle
      const nextIndex = currentIndex + 1
      if (nextIndex < subtitleItems.length) {
        const nextSubtitle = subtitleItems[nextIndex]
        RendererLogger.info('🔄 有限循环：跳转到下一句', {
          nextText: nextSubtitle.text,
          nextStartTime: nextSubtitle.startTime
        })

        seekTo(nextSubtitle.startTime, 'loop')
        playbackDispatch({
          type: 'MOVE_TO_NEXT_SUBTITLE',
          subtitle: nextSubtitle,
          index: nextIndex
        })
        uiDispatch(loopToggleActions.resetRemainingCount(loopCount))
      } else {
        // 已到最后一句，关闭循环 / Reached last subtitle, turn off loop
        RendererLogger.info('🔄 有限循环：已到最后一句，关闭循环')
        setIsSingleLoop(fileId, false)
      }
    }
    return
  }

  // 其他情况：关闭循环 / Other cases: turn off loop
  RendererLogger.info('🔄 循环：无效的循环次数，关闭循环', { loopCount })
  setIsSingleLoop(fileId, false)
}
