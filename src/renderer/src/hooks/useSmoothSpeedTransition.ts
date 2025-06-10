/**
 * Hook for smooth speed transitions in video player
 * 视频播放器平滑速度过渡的 Hook
 *
 * Integrates the smooth speed transition algorithm with the existing player system
 * 将平滑速度过渡算法集成到现有播放器系统中
 */

import { useCallback, useEffect, useRef, useMemo } from 'react'
import { useVideoPlayerContext } from './useVideoPlayerContext'
import { useVideoConfig } from './useVideoConfig'
import {
  SmoothSpeedTransition,
  DebouncedSpeedTransition,
  SpeedTransitionOptions
} from '@renderer/utils/smoothSpeedTransition'

export interface SmoothSpeedTransitionConfig {
  enabled?: boolean // Whether smooth transitions are enabled - 是否启用平滑过渡
  duration?: number // Transition duration in milliseconds - 过渡持续时间（毫秒）
  debounceDelay?: number // Debounce delay for rapid changes - 快速变化的防抖延迟
  useDebouncing?: boolean // Whether to use debouncing for rapid changes - 是否对快速变化使用防抖
  onTransitionStart?: (fromSpeed: number, toSpeed: number) => void // Callback when transition starts - 过渡开始时的回调
  onTransitionEnd?: (finalSpeed: number) => void // Callback when transition ends - 过渡结束时的回调
}

export interface SmoothSpeedTransitionReturn {
  // Core transition methods - 核心过渡方法
  transitionToSpeed: (targetSpeed: number, options?: Partial<SpeedTransitionOptions>) => void
  cancelTransition: () => void

  // State queries - 状态查询
  isTransitioning: boolean
  currentTransitionSpeed: number
  transitionProgress: number

  // Configuration - 配置
  updateConfig: (config: Partial<SmoothSpeedTransitionConfig>) => void

  // Utility methods - 工具方法
  setSpeedInstantly: (speed: number) => void // Bypass smooth transition - 绕过平滑过渡
}

/**
 * Hook for managing smooth speed transitions
 * 管理平滑速度过渡的 Hook
 */
export function useSmoothSpeedTransition(
  config: SmoothSpeedTransitionConfig = {}
): SmoothSpeedTransitionReturn {
  const { playerRef, isVideoLoadedRef } = useVideoPlayerContext()
  const { playbackRate, setPlaybackRate } = useVideoConfig()

  // Configuration with defaults - 带默认值的配置
  const configRef = useRef<Required<SmoothSpeedTransitionConfig>>({
    enabled: true,
    duration: 300,
    debounceDelay: 100,
    useDebouncing: true,
    onTransitionStart: () => {},
    onTransitionEnd: () => {},
    ...config
  })

  // Update config when props change - 当 props 变化时更新配置
  useEffect(() => {
    configRef.current = { ...configRef.current, ...config }
  }, [config])

  // Transition state - 过渡状态
  const transitionStateRef = useRef({
    isTransitioning: false,
    currentSpeed: playbackRate,
    progress: 0
  })

  // Create transition managers - 创建过渡管理器
  const transitionManager = useMemo(() => {
    const baseOptions: SpeedTransitionOptions = {
      duration: configRef.current.duration,
      onUpdate: (currentSpeed: number) => {
        // Update internal player speed - 更新内部播放器速度
        if (playerRef.current && isVideoLoadedRef.current) {
          const internalPlayer = playerRef.current.getInternalPlayer()
          if (internalPlayer && 'playbackRate' in internalPlayer) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ;(internalPlayer as any).playbackRate = currentSpeed
          }
        }

        // Update transition state - 更新过渡状态
        transitionStateRef.current.currentSpeed = currentSpeed
        transitionStateRef.current.progress =
          Math.abs(currentSpeed - transitionStateRef.current.currentSpeed) /
          Math.abs(configRef.current.duration)
      },
      onComplete: (finalSpeed: number) => {
        // Update transition state - 更新过渡状态
        transitionStateRef.current.isTransitioning = false
        transitionStateRef.current.currentSpeed = finalSpeed
        transitionStateRef.current.progress = 1

        // Call user callback - 调用用户回调
        configRef.current.onTransitionEnd(finalSpeed)
      },
      onCancel: () => {
        transitionStateRef.current.isTransitioning = false
        transitionStateRef.current.progress = 0
      }
    }

    if (configRef.current.useDebouncing) {
      return new DebouncedSpeedTransition(baseOptions, configRef.current.debounceDelay)
    } else {
      return new SmoothSpeedTransition(baseOptions)
    }
  }, [playerRef, isVideoLoadedRef, setPlaybackRate])

  // Apply speed directly to player without transition - 直接应用速度到播放器，无过渡
  const applySpeedDirectly = useCallback(
    (speed: number) => {
      if (playerRef.current && isVideoLoadedRef.current) {
        const internalPlayer = playerRef.current.getInternalPlayer()
        if (internalPlayer && 'playbackRate' in internalPlayer) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ;(internalPlayer as any).playbackRate = speed
        }
      }
      setPlaybackRate(speed)
    },
    [playerRef, isVideoLoadedRef, setPlaybackRate]
  )

  // Main transition method - 主要过渡方法
  const transitionToSpeed = useCallback(
    (targetSpeed: number, options?: Partial<SpeedTransitionOptions>) => {
      // If transitions are disabled, apply speed directly - 如果禁用过渡，直接应用速度
      if (!configRef.current.enabled) {
        applySpeedDirectly(targetSpeed)
        return
      }

      // Get current speed from player or store - 从播放器或存储获取当前速度
      let currentSpeed = playbackRate
      if (playerRef.current && isVideoLoadedRef.current) {
        const internalPlayer = playerRef.current.getInternalPlayer()
        if (internalPlayer && 'playbackRate' in internalPlayer) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          currentSpeed = (internalPlayer as any).playbackRate || playbackRate
        }
      }

      // Update transition state - 更新过渡状态
      transitionStateRef.current.isTransitioning = true
      transitionStateRef.current.progress = 0

      // Call user callback - 调用用户回调
      configRef.current.onTransitionStart(currentSpeed, targetSpeed)

      // Start transition - 开始过渡
      if (transitionManager instanceof DebouncedSpeedTransition) {
        transitionManager.requestTransition(targetSpeed, currentSpeed, options)
      } else {
        transitionManager.transitionTo(targetSpeed, currentSpeed, options)
      }
    },
    [playbackRate, playerRef, isVideoLoadedRef, transitionManager, applySpeedDirectly]
  )

  // Cancel transition - 取消过渡
  const cancelTransition = useCallback(() => {
    if (transitionManager instanceof DebouncedSpeedTransition) {
      transitionManager.cancel()
    } else {
      transitionManager.cancel()
    }
  }, [transitionManager])

  // Update configuration - 更新配置
  const updateConfig = useCallback(
    (newConfig: Partial<SmoothSpeedTransitionConfig>) => {
      configRef.current = { ...configRef.current, ...newConfig }

      // Update transition manager options if needed - 如果需要，更新过渡管理器选项
      const transition =
        transitionManager instanceof DebouncedSpeedTransition
          ? transitionManager.getTransition()
          : transitionManager

      transition.updateOptions({
        duration: configRef.current.duration
      })
    },
    [transitionManager]
  )

  // Set speed instantly without transition - 立即设置速度，无过渡
  const setSpeedInstantly = useCallback(
    (speed: number) => {
      cancelTransition()
      applySpeedDirectly(speed)
    },
    [cancelTransition, applySpeedDirectly]
  )

  // Cleanup on unmount - 卸载时清理
  useEffect(() => {
    return () => {
      cancelTransition()
    }
  }, [cancelTransition])

  return {
    // Core transition methods - 核心过渡方法
    transitionToSpeed,
    cancelTransition,

    // State queries - 状态查询
    isTransitioning: transitionStateRef.current.isTransitioning,
    currentTransitionSpeed: transitionStateRef.current.currentSpeed,
    transitionProgress: transitionStateRef.current.progress,

    // Configuration - 配置
    updateConfig,

    // Utility methods - 工具方法
    setSpeedInstantly
  }
}

/**
 * Hook for smooth speed transitions with preset configurations
 * 带预设配置的平滑速度过渡 Hook
 */
export function useSmoothSpeedTransitionPresets(): {
  standard: SmoothSpeedTransitionReturn
  fast: SmoothSpeedTransitionReturn
  slow: SmoothSpeedTransitionReturn
  instant: SmoothSpeedTransitionReturn
} {
  // Standard smooth transition - 标准平滑过渡
  const standard = useSmoothSpeedTransition({
    enabled: true,
    duration: 300,
    useDebouncing: true,
    debounceDelay: 100
  })

  // Fast transition for quick adjustments - 快速调整的快速过渡
  const fast = useSmoothSpeedTransition({
    enabled: true,
    duration: 150,
    useDebouncing: false
  })

  // Slow transition for precise control - 精确控制的慢速过渡
  const slow = useSmoothSpeedTransition({
    enabled: true,
    duration: 500,
    useDebouncing: true,
    debounceDelay: 200
  })

  // Instant transition (no smoothing) - 即时过渡（无平滑）
  const instant = useSmoothSpeedTransition({
    enabled: false
  })

  return {
    standard,
    fast,
    slow,
    instant
  }
}
