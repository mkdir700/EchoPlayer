import { usePlayerStore } from '@renderer/state'
import type { SubtitleItem } from '@types'
import { useMemo } from 'react'

import { useSubtitles } from '../state/player-context'

interface SubtitleEngine {
  subtitles: SubtitleItem[]
  currentSubtitle: SubtitleItem | null
  currentIndex: number
  findSubtitleByTime: (time: number) => SubtitleItem | null
  findIndexByTime: (time: number) => number
}

/**
 * 字幕引擎 Hook
 * 提供字幕数据索引、查找和时间匹配功能
 */
export function useSubtitleEngine(): SubtitleEngine {
  const subtitles = useSubtitles()
  const currentTime = usePlayerStore((s) => s.currentTime)
  const storeActiveCueIndex = usePlayerStore((s) => s.activeCueIndex)

  // 创建时间索引，用于二分查找优化
  const timeIndex = useMemo(() => {
    return subtitles
      .map((subtitle, index) => ({
        startTime: subtitle.startTime,
        endTime: subtitle.endTime,
        index
      }))
      .sort((a, b) => a.startTime - b.startTime)
  }, [subtitles])

  // 二分查找当前时间对应的字幕
  const findIndexByTime = useMemo(() => {
    return (time: number): number => {
      if (timeIndex.length === 0) return -1

      // 二分查找
      let left = 0
      let right = timeIndex.length - 1
      let result = -1

      while (left <= right) {
        const mid = Math.floor((left + right) / 2)
        const item = timeIndex[mid]

        if (time >= item.startTime && time <= item.endTime) {
          return item.index
        }

        if (time < item.startTime) {
          right = mid - 1
        } else {
          left = mid + 1
          // 记录最后一个开始时间小于当前时间的项
          if (time >= item.startTime) {
            result = item.index
          }
        }
      }

      // 如果没有精确匹配，返回最近的前一个字幕索引（即 startTime <= time 的最大项）
      if (result >= 0 && result < subtitles.length) {
        return result
      }

      // 若 time 早于第一条字幕的开始时间，仍返回 -1，表示“尚未开始”
      return -1
    }
  }, [timeIndex, subtitles])

  // 根据时间查找字幕
  const findSubtitleByTime = useMemo(() => {
    return (time: number): SubtitleItem | null => {
      const index = findIndexByTime(time)
      return index >= 0 ? subtitles[index] : null
    }
  }, [findIndexByTime, subtitles])

  // 当前字幕和索引 - 优先使用 PlayerOrchestrator 的 activeCueIndex，回退到基于时间的计算
  const currentIndex = useMemo(() => {
    // 如果 PlayerOrchestrator 提供了有效的 activeCueIndex，直接使用
    if (storeActiveCueIndex >= 0 && storeActiveCueIndex < subtitles.length) {
      return storeActiveCueIndex
    }
    // 否则回退到基于时间的计算
    return findIndexByTime(currentTime)
  }, [storeActiveCueIndex, subtitles.length, findIndexByTime, currentTime])

  const currentSubtitle = useMemo(() => {
    return currentIndex >= 0 ? subtitles[currentIndex] : null
  }, [subtitles, currentIndex])

  return {
    subtitles,
    currentSubtitle,
    currentIndex,
    findSubtitleByTime,
    findIndexByTime
  }
}
