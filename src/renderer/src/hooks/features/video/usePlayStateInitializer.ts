import { useEffect, useRef } from 'react'
import { useRecentPlayList } from './useRecentPlayList'
import { FileSystemHelper } from '@renderer/utils/fileSystemHelper'
import { parseSubtitles } from '@renderer/utils/subtitleParser'
import { useSubtitleListContext } from '@renderer/hooks/core/useSubtitleListContext'
import { usePlayingVideoContext } from '@renderer/hooks/core/usePlayingVideoContext'
import { useVideoControls } from '@renderer/hooks/features/video/useVideoPlayerHooks'

interface UsePlayStateInitializerProps {
  /** 保存播放状态的函数引用 */
  savePlayStateRef: React.RefObject<((force?: boolean) => Promise<void>) | null>
}

interface UsePlayStateInitializerReturn {
  // 移除字幕模态框相关的返回值
}

/**
 * 播放状态初始化 Hook
 * @description 负责恢复保存的播放进度、字幕数据，以及自动检测字幕文件
 * 🚀 优化版本：减少重新渲染，使用稳定的依赖
 */
export function usePlayStateInitializer({
  savePlayStateRef
}: UsePlayStateInitializerProps): UsePlayStateInitializerReturn {
  const { getRecentPlayByPath, addRecentPlay } = useRecentPlayList()
  const subtitleListContext = useSubtitleListContext()
  const playingVideoContext = usePlayingVideoContext()
  const { restoreVideoState } = useVideoControls()

  // 🔧 使用 ref 来存储函数引用和状态，避免作为依赖
  const getRecentPlayByPathRef = useRef(getRecentPlayByPath)
  const addRecentPlayRef = useRef(addRecentPlay)
  const subtitleListContextRef = useRef(subtitleListContext)
  const restoreVideoStateRef = useRef(restoreVideoState)
  const savePlayStateRefStable = useRef(savePlayStateRef)
  const isInitializedRef = useRef(false)

  // 更新 ref 的值
  getRecentPlayByPathRef.current = getRecentPlayByPath
  addRecentPlayRef.current = addRecentPlay
  subtitleListContextRef.current = subtitleListContext
  restoreVideoStateRef.current = restoreVideoState
  savePlayStateRefStable.current = savePlayStateRef

  // 🚀 优化：只在视频文件实际变化时才初始化
  useEffect(() => {
    // 检查视频文件是否有效
    if (!playingVideoContext.originalFilePath || !playingVideoContext.videoFile) {
      console.log('❌ usePlayStateInitializer: 缺少必要的文件信息，跳过初始化')
      return
    }

    // 避免重复初始化同一个文件
    const currentFilePath = playingVideoContext.originalFilePath
    const currentFileName = playingVideoContext.videoFileName

    console.log('🔍 usePlayStateInitializer 开始初始化:', {
      originalFilePath: currentFilePath,
      videoFileName: currentFileName,
      isInitialized: isInitializedRef.current
    })

    // region 检测并加载同名字幕文件
    const detectAndLoadSubtitles = async (videoPath: string): Promise<boolean> => {
      const videoDir = FileSystemHelper.getDirectoryPath(videoPath)
      const videoBaseName = FileSystemHelper.getFileName(videoPath).replace(/\.[^/.]+$/, '')
      const subtitleExtensions = ['srt', 'vtt', 'json', 'ass', 'ssa']

      for (const ext of subtitleExtensions) {
        const isWindows = navigator.platform.toLowerCase().includes('win')
        const separator = isWindows ? '\\' : '/'
        const subtitlePath = `${videoDir}${separator}${videoBaseName}.${ext}`
        const exists = await FileSystemHelper.checkFileExists(subtitlePath)

        if (exists) {
          const content = await FileSystemHelper.readSubtitleFile(subtitlePath)
          if (content) {
            const parsed = parseSubtitles(content, `${videoBaseName}.${ext}`)
            if (parsed.length > 0) {
              console.log('📁 自动加载同名字幕文件:', subtitlePath)
              subtitleListContextRef.current.restoreSubtitles(parsed, 0)

              // 立即保存字幕数据
              setTimeout(async () => {
                if (savePlayStateRefStable.current.current) {
                  console.log('📝 自动检测字幕完成，立即保存字幕数据')
                  await savePlayStateRefStable.current.current(true)
                }
              }, 100)

              return true
            }
          }
        }
      }
      return false
    }
    // endregion

    // region 初始化播放状态
    const loadPlayState = async (): Promise<void> => {
      try {
        // 获取保存的播放记录
        const recent = await getRecentPlayByPathRef.current(currentFilePath)
        if (recent) {
          console.log('🔄 恢复保存的数据:', recent)

          // 恢复播放进度
          if (recent.currentTime && recent.currentTime > 0) {
            console.log('⏰ 恢复播放进度:', recent.currentTime)
            restoreVideoStateRef.current(
              recent.currentTime,
              1, // 使用默认播放速度
              1 // 使用默认音量
            )
          }

          // 恢复字幕数据
          let hasRestoredSubtitles = false
          if (recent.subtitleItems && recent.subtitleItems.length > 0) {
            console.log('📝 恢复字幕数据:', recent.subtitleItems.length, '条字幕')
            const subtitleIndex = subtitleListContextRef.current.getSubtitleIndexForTime(
              recent.currentTime || 0
            )
            subtitleListContextRef.current.restoreSubtitles(recent.subtitleItems, subtitleIndex)
            hasRestoredSubtitles = true
          }

          // 如果恢复了字幕数据，就不需要自动检测字幕文件了
          if (hasRestoredSubtitles) {
            return
          }
        }
      } catch (error) {
        console.error('恢复保存数据失败:', error)
      }

      // 如果没有保存的字幕数据，则自动检测并导入同名字幕文件
      if (subtitleListContextRef.current.subtitleItemsRef.current.length === 0) {
        const found = await detectAndLoadSubtitles(currentFilePath)

        // 如果没有找到字幕文件，通知 SubtitleListContext 处理
        if (!found) {
          console.log('📝 未找到同名字幕文件，显示字幕导入提示')
          // 显示字幕导入提示
          subtitleListContextRef.current.setShowSubtitlePrompt(true)
        }
      }
    }
    // endregion

    // 执行初始化
    loadPlayState()
    isInitializedRef.current = true
  }, [
    playingVideoContext.originalFilePath,
    playingVideoContext.videoFile,
    playingVideoContext.videoFileName
  ])

  return {}
}
