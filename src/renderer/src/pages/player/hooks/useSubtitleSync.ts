import { useEffect, useMemo } from 'react'
import { usePlayerStore } from '@renderer/state/stores/player.store'
import { useSubtitleEngine } from './useSubtitleEngine'
import type { SubtitleItem } from '@types'

/**
 * 字幕同步 Hook
 * 实现播放时间与字幕列表的实时同步和高亮显示
 */
export function useSubtitleSync(subtitles: SubtitleItem[]) {
  const currentTime = usePlayerStore((s) => s.currentTime)
  const setActiveCueIndex = usePlayerStore((s) => s.setActiveCueIndex)

  // 使用字幕引擎获取当前字幕信息
  const { currentIndex, currentSubtitle } = useSubtitleEngine(subtitles, currentTime)

  // 同步当前字幕索引到 store
  useEffect(() => {
    setActiveCueIndex(currentIndex)
  }, [currentIndex, setActiveCueIndex])

  // 计算字幕统计信息
  const stats = useMemo(() => {
    const total = subtitles.length
    const current = currentIndex + 1 // 1-based index for display
    const progress = total > 0 ? (current / total) * 100 : 0

    return {
      total,
      current: currentIndex >= 0 ? current : 0,
      progress: Math.round(progress)
    }
  }, [subtitles.length, currentIndex])

  // 导航功能
  const navigation = useMemo(() => {
    const hasPrevious = currentIndex > 0
    const hasNext = currentIndex < subtitles.length - 1

    const goToPrevious = () => {
      if (hasPrevious) {
        const prevSubtitle = subtitles[currentIndex - 1]
        return prevSubtitle.startTime
      }
      return null
    }

    const goToNext = () => {
      if (hasNext) {
        const nextSubtitle = subtitles[currentIndex + 1]
        return nextSubtitle.startTime
      }
      return null
    }

    return {
      hasPrevious,
      hasNext,
      goToPrevious,
      goToNext
    }
  }, [currentIndex, subtitles])

  // 字幕时间范围信息
  const timeRange = useMemo(() => {
    if (subtitles.length === 0) {
      return { start: 0, end: 0, duration: 0 }
    }

    const start = subtitles[0].startTime
    const end = subtitles[subtitles.length - 1].endTime
    const duration = end - start

    return { start, end, duration }
  }, [subtitles])

  return {
    // 当前状态
    currentSubtitle,
    currentIndex,

    // 统计信息
    stats,

    // 导航功能
    navigation,

    // 时间范围
    timeRange,

    // 原始数据
    subtitles
  }
}
