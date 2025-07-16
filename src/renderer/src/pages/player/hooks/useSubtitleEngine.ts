import { useMemo } from 'react'
import type { SubtitleItem } from '@types'

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
export function useSubtitleEngine(subtitles: SubtitleItem[], currentTime: number): SubtitleEngine {
  // 防御式处理，确保始终为数组
  const list = Array.isArray(subtitles) ? subtitles : []

  // 创建时间索引，用于二分查找优化
  const timeIndex = useMemo(() => {
    return list
      .map((subtitle, index) => ({
        startTime: subtitle.startTime,
        endTime: subtitle.endTime,
        index
      }))
      .sort((a, b) => a.startTime - b.startTime)
  }, [list])

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

      // 如果没有精确匹配，检查最近的项是否在时间范围内
      if (result >= 0 && result < list.length) {
        const subtitle = list[result]
        if (time >= subtitle.startTime && time <= subtitle.endTime) {
          return result
        }
      }

      return -1
    }
  }, [timeIndex, list])

  // 根据时间查找字幕
  const findSubtitleByTime = useMemo(() => {
    return (time: number): SubtitleItem | null => {
      const index = findIndexByTime(time)
      return index >= 0 ? list[index] : null
    }
  }, [findIndexByTime, list])

  // 当前字幕和索引
  const currentIndex = useMemo(() => {
    return findIndexByTime(currentTime)
  }, [findIndexByTime, currentTime])

  const currentSubtitle = useMemo(() => {
    return currentIndex >= 0 ? list[currentIndex] : null
  }, [list, currentIndex])

  return {
    subtitles: list,
    currentSubtitle,
    currentIndex,
    findSubtitleByTime,
    findIndexByTime
  }
}
