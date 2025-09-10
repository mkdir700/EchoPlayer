import { loggerService } from '@logger'
import { useCallback, useEffect, useRef } from 'react'

import { usePlayerCommands } from './usePlayerCommands'

const logger = loggerService.withContext('VolumeWheelControl')

export interface UseVolumeWheelControlOptions {
  /** 是否启用滚轮控制 */
  enabled: boolean
  /** 基础滚轮步长，默认为0.02 (2%) */
  wheelStep?: number
  /** 最小步长，默认为0.01 (1%) */
  minStep?: number
  /** 最大步长，默认为0.08 (8%) */
  maxStep?: number
}

/**
 * 音量滚轮控制Hook
 * 当hover菜单打开时，激活滚轮控制音量功能
 * 提供丝滑的即时响应体验，支持智能加速和精细控制
 */
export function useVolumeWheelControl({
  enabled,
  wheelStep = 0.02,
  minStep = 0.01,
  maxStep = 0.08
}: UseVolumeWheelControlOptions) {
  const { changeVolumeBy } = usePlayerCommands()
  const containerRef = useRef<HTMLDivElement>(null)
  const lastWheelTimeRef = useRef<number>(0)
  const wheelVelocityRef = useRef<number>(0)

  const handleWheel = useCallback(
    (event: WheelEvent) => {
      if (!enabled) return

      // 阻止默认滚动行为
      event.preventDefault()
      event.stopPropagation()

      const currentTime = Date.now()
      const timeDelta = currentTime - lastWheelTimeRef.current
      lastWheelTimeRef.current = currentTime

      // 计算滚轮速度（基于时间间隔）
      if (timeDelta < 50) {
        // 快速滚动时增加速度感知
        wheelVelocityRef.current = Math.min(wheelVelocityRef.current + 0.3, 2.0)
      } else if (timeDelta > 200) {
        // 慢速滚动时重置速度
        wheelVelocityRef.current = 1.0
      } else {
        // 中等速度时保持或微调
        wheelVelocityRef.current = Math.max(wheelVelocityRef.current * 0.9, 1.0)
      }

      // 基于滚轮强度和速度计算步长
      const wheelIntensity = Math.abs(event.deltaY)
      const normalizedIntensity = Math.min(wheelIntensity / 100, 1.5) // 基础强度控制
      const velocityMultiplier = wheelVelocityRef.current // 速度加成

      // 计算最终步长
      let adjustedStep = wheelStep * normalizedIntensity * velocityMultiplier
      adjustedStep = Math.max(minStep, Math.min(maxStep, adjustedStep))

      // deltaY > 0 表示向下滚动（降低音量）
      // deltaY < 0 表示向上滚动（提高音量）
      const delta = event.deltaY > 0 ? -adjustedStep : adjustedStep

      // 立即响应，无防抖
      changeVolumeBy(delta)

      logger.debug('Volume changed by wheel', {
        delta,
        intensity: normalizedIntensity,
        velocity: velocityMultiplier,
        timeDelta,
        wheelDirection: event.deltaY > 0 ? 'down' : 'up'
      })
    },
    [enabled, wheelStep, minStep, maxStep, changeVolumeBy]
  )

  // 添加滚轮事件监听器
  useEffect(() => {
    const container = containerRef.current
    if (!container || !enabled) return

    container.addEventListener('wheel', handleWheel, { passive: false })

    return () => {
      container.removeEventListener('wheel', handleWheel)
    }
  }, [enabled, handleWheel])

  return {
    containerRef
  }
}
