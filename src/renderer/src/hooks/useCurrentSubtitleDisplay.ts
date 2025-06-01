import { useRef, useCallback, useState, useEffect } from 'react'
import type { SubtitleItem } from '@types_/shared'
import { useSubtitleListContext } from './useSubtitleListContext'
import { useVideoPlayerContext } from './useVideoPlayerContext'
import { RendererLogger } from '@renderer/utils/logger'

export interface UseCurrentSubtitleDisplayReturn {
  /** 当前显示的字幕 */
  currentDisplaySubtitle: SubtitleItem | null
  /** 是否为手动设置的字幕（非时间自动切换） */
  isManuallySet: boolean
  /** 手动设置当前显示的字幕 */
  setCurrentDisplaySubtitle: (subtitle: SubtitleItem | null, isManual?: boolean) => void
  /** 根据时间获取字幕并更新显示 */
  updateSubtitleByTime: (time: number) => void
  /** 清除手动设置状态，恢复时间自动控制 */
  clearManualMode: () => void
  /** 根据索引设置字幕 */
  setSubtitleByIndex: (index: number) => void
}

/**
 * 管理播放器区域当前字幕显示的hook
 * 支持时间自动切换和手动点击立即显示
 */
export function useCurrentSubtitleDisplay(): UseCurrentSubtitleDisplayReturn {
  // 获取字幕列表上下文
  const { subtitleItemsRef, getCurrentSubtitle } = useSubtitleListContext()
  const { currentTimeRef, subscribeToTime } = useVideoPlayerContext()

  // 当前显示的字幕状态
  const [currentDisplaySubtitle, setCurrentDisplaySubtitleState] = useState<SubtitleItem | null>(
    null
  )

  // 是否为手动设置状态
  const [isManuallySet, setIsManuallySet] = useState(false)

  // 手动设置的定时器引用
  const manualTimerRef = useRef<NodeJS.Timeout | null>(null)

  // 手动模式持续时间（毫秒）- 手动点击后保持显示3秒
  const MANUAL_DISPLAY_DURATION = 3000

  // 手动设置当前显示的字幕
  const setCurrentDisplaySubtitle = useCallback(
    (subtitle: SubtitleItem | null, isManual = true): void => {
      RendererLogger.debug('🎯 设置当前显示字幕:', {
        subtitle: subtitle ? `${subtitle.text.substring(0, 20)}...` : null,
        isManual,
        startTime: subtitle?.startTime,
        endTime: subtitle?.endTime
      })

      setCurrentDisplaySubtitleState(subtitle)

      if (isManual && subtitle) {
        setIsManuallySet(true)

        // 清除之前的定时器
        if (manualTimerRef.current) {
          clearTimeout(manualTimerRef.current)
        }

        // 设置新的定时器，在指定时间后恢复自动模式
        manualTimerRef.current = setTimeout(() => {
          RendererLogger.debug('⏰ 手动模式超时，恢复自动模式')
          setIsManuallySet(false)
          // 恢复到当前时间对应的字幕
          const currentSubtitle = getCurrentSubtitle(currentTimeRef.current)
          setCurrentDisplaySubtitleState(currentSubtitle)
        }, MANUAL_DISPLAY_DURATION)
      } else if (!isManual) {
        setIsManuallySet(false)
      }
    },
    [getCurrentSubtitle, currentTimeRef]
  )

  // 根据时间更新字幕显示
  const updateSubtitleByTime = useCallback(
    (time: number): void => {
      // 如果当前是手动模式，不自动更新
      if (isManuallySet) {
        return
      }

      const subtitle = getCurrentSubtitle(time)
      setCurrentDisplaySubtitleState(subtitle)
    },
    [getCurrentSubtitle, isManuallySet]
  )

  // 清除手动模式
  const clearManualMode = useCallback((): void => {
    RendererLogger.debug('🔄 清除手动模式')

    if (manualTimerRef.current) {
      clearTimeout(manualTimerRef.current)
      manualTimerRef.current = null
    }

    setIsManuallySet(false)
    // 恢复到当前时间对应的字幕
    const currentSubtitle = getCurrentSubtitle(currentTimeRef.current)
    setCurrentDisplaySubtitleState(currentSubtitle)
  }, [getCurrentSubtitle, currentTimeRef])

  // 根据索引设置字幕
  const setSubtitleByIndex = useCallback(
    (index: number): void => {
      const subtitle = subtitleItemsRef.current[index] || null
      setCurrentDisplaySubtitle(subtitle, true)
    },
    [subtitleItemsRef, setCurrentDisplaySubtitle]
  )

  // 订阅时间变化，自动更新字幕显示
  useEffect(() => {
    const unsubscribe = subscribeToTime((time) => {
      updateSubtitleByTime(time)
    })

    return unsubscribe
  }, [subscribeToTime, updateSubtitleByTime])

  // 当字幕数据变化时重置状态
  useEffect(() => {
    if (subtitleItemsRef.current.length === 0) {
      setCurrentDisplaySubtitleState(null)
      setIsManuallySet(false)
      if (manualTimerRef.current) {
        clearTimeout(manualTimerRef.current)
        manualTimerRef.current = null
      }
    }
  }, [subtitleItemsRef])

  // 清理定时器
  useEffect(() => {
    return () => {
      if (manualTimerRef.current) {
        clearTimeout(manualTimerRef.current)
      }
    }
  }, [])

  return {
    currentDisplaySubtitle,
    isManuallySet,
    setCurrentDisplaySubtitle,
    updateSubtitleByTime,
    clearManualMode,
    setSubtitleByIndex
  }
}
