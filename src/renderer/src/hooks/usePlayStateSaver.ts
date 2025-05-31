import { useRef, useEffect, RefObject } from 'react'
import { useRecentPlayList } from './useRecentPlayList'
import { useSubtitleListContext } from '@renderer/hooks/useSubtitleListContext'
import { usePlayingVideoContext } from '@renderer/hooks/usePlayingVideoContext'

interface UsePlayStateSaverProps {
  /** 当前播放时间 */
  currentTimeRef: RefObject<number>
  /** 视频总时长 */
  duration: number
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
  currentTimeRef,
  duration
}: UsePlayStateSaverProps): UsePlaySateSaverReturn {
  const subtitleListContext = useSubtitleListContext()
  const playingVideoContext = usePlayingVideoContext()
  const { getRecentPlayByPath, updateRecentPlay } = useRecentPlayList()
  const saveProgressRef = useRef<((force?: boolean) => Promise<void>) | null>(null)
  const durationRef = useRef(duration)
  durationRef.current = duration

  // 添加一个标记，防止在视频初始化期间立即保存0时间
  const isInitializingRef = useRef(true)
  const initializationTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // 只有当有原始文件路径时才保存进度（本地文件）
    if (!playingVideoContext.originalFilePath || !playingVideoContext.videoFile) return

    let timer: NodeJS.Timeout | null = null
    let isUnmounted = false
    let lastSavedTime = -1
    let lastSavedSubtitleIndex = -1
    let lastSavedSubtitlesLength = -1
    let recentId: string | undefined

    // 重置初始化状态
    isInitializingRef.current = true

    // 5秒后允许保存，避免初始化期间保存0时间覆盖恢复的进度
    if (initializationTimeoutRef.current) {
      clearTimeout(initializationTimeoutRef.current)
    }
    initializationTimeoutRef.current = setTimeout(() => {
      isInitializingRef.current = false
      console.log('🔓 播放状态保存已启用')
    }, 5000)

    async function saveProgress(force = false): Promise<void> {
      if (!playingVideoContext.originalFilePath) return

      // 使用 ref 获取最新的时间值
      const currentTimeValue = currentTimeRef.current
      const durationValue = durationRef.current

      // 如果是初始化期间，且不是强制保存，且当前时间为0，则跳过保存
      if (isInitializingRef.current && !force && currentTimeValue === 0) {
        console.log('⏸️ 跳过初始化期间的保存，避免覆盖恢复的进度:', {
          currentTime: currentTimeValue,
          isInitializing: isInitializingRef.current,
          force
        })
        return
      }

      // 查找当前视频的 recentPlay 项（使用原始文件路径）
      if (!recentId) {
        const recent = await getRecentPlayByPath(playingVideoContext.originalFilePath)
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
          filePath: playingVideoContext.originalFilePath,
          isInitializing: isInitializingRef.current
        })

        const success = await updateRecentPlay(recentId, {
          currentTime: currentTimeValue,
          duration: durationValue > 0 ? durationValue : undefined,
          subtitleItems:
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
      if (initializationTimeoutRef.current) {
        clearTimeout(initializationTimeoutRef.current)
      }
      // 卸载时强制保存一次
      if (!isUnmounted) {
        saveProgress(true)
      }
    }
  }, [
    subtitleListContext,
    getRecentPlayByPath,
    updateRecentPlay,
    currentTimeRef,
    playingVideoContext.originalFilePath,
    playingVideoContext.videoFile
  ])

  return {
    savePlayStateRef: saveProgressRef
  }
}
