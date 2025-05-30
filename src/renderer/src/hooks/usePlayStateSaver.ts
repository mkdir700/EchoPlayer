import { useRef, useEffect, RefObject } from 'react'
import { useRecentPlayList } from './useRecentPlayList'
import { type ISubtitleListContextType } from '@renderer/contexts/subtitle-list-context'

interface UsePlayStateSaverProps {
  /** 原始文件路径 */
  originalFilePath: string | null
  /** 视频文件对象 */
  videoFile: string | null
  /** 当前播放时间 */
  currentTimeRef: RefObject<number>
  /** 视频总时长 */
  duration: number
  subtitleListContext: ISubtitleListContextType
}

interface UsePlaySateSaverReturn {
  /** 保存进度的函数引用，可以在组件外部调用 */
  savePlayStateRef: React.RefObject<((force?: boolean) => Promise<void>) | null>
}

/**
 * 播放进度保存 Hook
 * 负责定期保存视频播放进度到最近播放记录中
 */
export function usePlayStateSaver({
  originalFilePath,
  videoFile,
  currentTimeRef,
  duration,
  subtitleListContext
}: UsePlayStateSaverProps): UsePlaySateSaverReturn {
  const { getRecentPlayByPath, updateRecentPlay } = useRecentPlayList()
  const saveProgressRef = useRef<((force?: boolean) => Promise<void>) | null>(null)
  const durationRef = useRef(duration)
  durationRef.current = duration

  useEffect(() => {
    // 只有当有原始文件路径时才保存进度（本地文件）
    if (!originalFilePath || !videoFile) return

    let timer: NodeJS.Timeout | null = null
    let isUnmounted = false
    let lastSavedTime = -1
    let lastSavedSubtitleIndex = -1
    let lastSavedSubtitlesLength = -1
    let recentId: string | undefined

    async function saveProgress(force = false): Promise<void> {
      if (!originalFilePath) return

      // 使用 ref 获取最新的时间值
      const currentTimeValue = currentTimeRef.current
      const durationValue = durationRef.current

      // 查找当前视频的 recentPlay 项（使用原始文件路径）
      if (!recentId) {
        const recent = await getRecentPlayByPath(originalFilePath)
        if (recent && recent.id) {
          recentId = recent.id
        } else {
          console.log('未找到对应的最近播放记录，跳过保存进度')
          return
        }
      }

      // 计算当前实际的字幕索引
      const actualCurrentSubtitleIndex =
        subtitleListContext.getCurrentSubtitleIndex(currentTimeValue)

      // 只在进度有明显变化时才保存，或强制保存
      if (
        force ||
        Math.abs(currentTimeValue - lastSavedTime) > 2 ||
        actualCurrentSubtitleIndex !== lastSavedSubtitleIndex ||
        subtitleListContext.subtitleItemsRef.current.length !== lastSavedSubtitlesLength
      ) {
        console.log('保存播放进度:', {
          recentId,
          currentTime: currentTimeValue,
          subtitleIndex: actualCurrentSubtitleIndex,
          subtitlesCount: subtitleListContext.subtitleItemsRef.current.length,
          filePath: originalFilePath
        })

        const currentSubtitleIndex = subtitleListContext.getCurrentSubtitleIndex(currentTimeValue)
        const success = await updateRecentPlay(recentId, {
          currentTime: currentTimeValue,
          subtitleIndex: currentSubtitleIndex,
          duration: durationValue > 0 ? durationValue : undefined,
          subtitles:
            subtitleListContext.subtitleItemsRef.current.length > 0
              ? subtitleListContext.subtitleItemsRef.current
              : undefined
        })

        if (success) {
          lastSavedTime = currentTimeValue
          lastSavedSubtitleIndex = actualCurrentSubtitleIndex
          lastSavedSubtitlesLength = subtitleListContext.subtitleItemsRef.current.length
        } else {
          console.error('保存播放进度失败')
        }
      }
    }

    // 将 saveProgress 函数赋值给 ref，以便在外部使用
    saveProgressRef.current = saveProgress

    // 每5秒保存一次进度
    timer = setInterval(() => {
      if (!isUnmounted) saveProgress(false)
    }, 5000)

    return () => {
      isUnmounted = true
      if (timer) clearInterval(timer)
      // 卸载时强制保存一次
      if (!isUnmounted) {
        saveProgress(true)
      }
    }
  }, [
    originalFilePath,
    videoFile,
    subtitleListContext,
    getRecentPlayByPath,
    updateRecentPlay,
    currentTimeRef
  ])

  return {
    savePlayStateRef: saveProgressRef
  }
}
