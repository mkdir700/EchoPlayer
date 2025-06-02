import { useRef, useEffect, useCallback } from 'react'
import { useRecentPlayList } from './useRecentPlayList'
import { useSubtitleListContext } from '@renderer/hooks/useSubtitleListContext'
import { usePlayingVideoContext } from '@renderer/hooks/usePlayingVideoContext'
import { useVideoTimeRef, useVideoStateRefs } from './useVideoPlayerHooks'

interface UsePlayStateSaverReturn {
  /** 保存进度的函数引用，可以在组件外部调用 */
  savePlayStateRef: React.RefObject<((force?: boolean) => Promise<void>) | null>
  /** 是否正在初始化中 */
  isInitializing: boolean
}

interface SaveProgressState {
  recentId?: string
  lastSavedTime: number
  lastSavedSubtitleIndex: number
  lastSavedSubtitlesLength: number
}

/**
 * 播放进度保存 Hook
 * 负责定期保存视频播放进度到最近播放记录中
 *
 * 功能特性：
 * - 每5秒自动保存播放进度
 * - 初始化期间防止覆盖恢复的进度
 * - 智能判断是否需要保存（避免频繁无效保存）
 * - 组件卸载时强制保存最新状态
 * - 🚀 不会导致组件重新渲染（使用 ref 而不是状态订阅）
 */
export function usePlayStateSaver(): UsePlayStateSaverReturn {
  const subtitleListContext = useSubtitleListContext()
  const playingVideoContext = usePlayingVideoContext()
  const { updateRecentPlaySilent } = useRecentPlayList()

  const saveProgressRef = useRef<((force?: boolean) => Promise<void>) | null>(null)
  const isInitializingRef = useRef(true)
  const initializationTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const saveStateRef = useRef<SaveProgressState>({
    lastSavedTime: -1,
    lastSavedSubtitleIndex: -1,
    lastSavedSubtitlesLength: -1
  })
  const fileId = playingVideoContext.fileId

  console.log('videoFileState', playingVideoContext)

  // 🔧 使用 ref 而不是状态订阅，避免重新渲染
  const currentTimeRef = useVideoTimeRef()
  const { durationRef } = useVideoStateRefs()

  /**
   * 检查是否需要保存进度
   */
  const shouldSaveProgress = useCallback(
    (force: boolean, currentTime: number): boolean => {
      if (force) return true

      const state = saveStateRef.current
      const actualCurrentSubtitleIndex = subtitleListContext.getCurrentSubtitleIndex(currentTime)
      const currentSubtitlesLength = subtitleListContext.subtitleItemsRef.current.length

      // 检查各项条件
      const timeChanged = Math.abs(currentTime - state.lastSavedTime) > 2
      const subtitleIndexChanged = actualCurrentSubtitleIndex !== state.lastSavedSubtitleIndex
      const subtitlesLengthChanged = currentSubtitlesLength !== state.lastSavedSubtitlesLength

      return timeChanged || subtitleIndexChanged || subtitlesLengthChanged
    },
    [subtitleListContext]
  )

  /**
   * 获取 recentPlay 记录 ID
   */
  const getRecentPlayId = useCallback(async (): Promise<string | null> => {
    if (!playingVideoContext.originalFilePath) return null

    if (saveStateRef.current.recentId) {
      return saveStateRef.current.recentId
    }

    try {
      if (fileId) {
        saveStateRef.current.recentId = fileId
        return fileId
      }
    } catch (error) {
      console.error('获取最近播放记录失败:', error)
    }

    return null
  }, [playingVideoContext.originalFilePath, fileId])

  /**
   * 保存播放进度
   */
  const saveProgress = useCallback(
    async (force = false): Promise<void> => {
      // 基础检查
      if (!playingVideoContext.originalFilePath || !playingVideoContext.videoFile) {
        return
      }

      // 🔧 从 ref 读取当前时间，不触发重新渲染
      const currentTime = currentTimeRef.current
      const duration = durationRef.current

      // 初始化期间的特殊处理
      if (isInitializingRef.current && !force && currentTime === 0) {
        console.log('⏸️ 跳过初始化期间的保存，避免覆盖恢复的进度:', {
          currentTime,
          isInitializing: isInitializingRef.current,
          force
        })
        return
      }

      // 检查是否需要保存
      if (!shouldSaveProgress(force, currentTime)) {
        return
      }

      try {
        // 获取 recent play ID
        const recentId = await getRecentPlayId()
        if (!recentId) {
          console.warn('未找到对应的最近播放记录，跳过保存进度', recentId)
          return
        }

        // 计算当前字幕索引
        const actualCurrentSubtitleIndex = subtitleListContext.getCurrentSubtitleIndex(currentTime)
        const currentSubtitlesLength = subtitleListContext.subtitleItemsRef.current.length

        console.log('💾 保存播放进度 (静默模式):', {
          recentId,
          currentTime,
          subtitleIndex: actualCurrentSubtitleIndex,
          subtitlesCount: currentSubtitlesLength,
          filePath: playingVideoContext.originalFilePath,
          isInitializing: isInitializingRef.current
        })

        // 🚀 执行静默保存 - 不会触发状态更新和重新渲染
        const success = await updateRecentPlaySilent(recentId, {
          currentTime,
          duration: duration > 0 ? duration : undefined,
          subtitleItems:
            currentSubtitlesLength > 0 ? subtitleListContext.subtitleItemsRef.current : undefined
        })

        if (success) {
          // 更新保存状态
          saveStateRef.current = {
            ...saveStateRef.current,
            lastSavedTime: currentTime,
            lastSavedSubtitleIndex: actualCurrentSubtitleIndex,
            lastSavedSubtitlesLength: currentSubtitlesLength
          }
        } else {
          console.error('❌ 保存播放进度失败')
        }
      } catch (error) {
        console.error('💥 保存播放进度时发生错误:', error)
      }
    },
    [
      playingVideoContext.originalFilePath,
      playingVideoContext.videoFile,
      currentTimeRef,
      durationRef,
      shouldSaveProgress,
      getRecentPlayId,
      subtitleListContext,
      updateRecentPlaySilent
    ]
  )

  /**
   * 初始化和清理逻辑
   */
  useEffect(() => {
    // 只有当有原始文件路径时才启动自动保存
    if (!playingVideoContext.originalFilePath || !playingVideoContext.videoFile) {
      return
    }

    let autoSaveTimer: NodeJS.Timeout | null = null
    let isUnmounted = false

    // 重置状态
    isInitializingRef.current = true
    saveStateRef.current = {
      lastSavedTime: -1,
      lastSavedSubtitleIndex: -1,
      lastSavedSubtitlesLength: -1
    }

    // 设置初始化超时
    if (initializationTimeoutRef.current) {
      clearTimeout(initializationTimeoutRef.current)
    }

    initializationTimeoutRef.current = setTimeout(() => {
      if (!isUnmounted) {
        isInitializingRef.current = false
        console.log('🔓 播放状态自动保存已启用（无重新渲染模式）')
      }
    }, 5000)

    // 将保存函数暴露给外部
    saveProgressRef.current = saveProgress

    // 启动自动保存定时器
    autoSaveTimer = setInterval(() => {
      if (!isUnmounted) {
        saveProgress(false)
      }
    }, 5000)

    // 清理函数
    return () => {
      isUnmounted = true

      // 清理定时器
      if (autoSaveTimer) {
        clearInterval(autoSaveTimer)
      }

      if (initializationTimeoutRef.current) {
        clearTimeout(initializationTimeoutRef.current)
        initializationTimeoutRef.current = null
      }

      // 组件卸载时强制保存最新状态
      if (saveProgressRef.current) {
        saveProgressRef.current(true).catch((error) => {
          console.error('卸载时保存进度失败:', error)
        })
      }
    }
  }, [playingVideoContext.originalFilePath, playingVideoContext.videoFile, saveProgress])

  return {
    savePlayStateRef: saveProgressRef,
    isInitializing: isInitializingRef.current
  }
}
