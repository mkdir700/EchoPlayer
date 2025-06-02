import { useState, useCallback, useEffect } from 'react'
import type { VideoFileState } from '../types'
import { cleanupBlobUrl } from '../utils/helpers'
import { getVideoAspectRatioFromUrl, guessAspectRatioName } from '../utils/videoUtils'
import RendererLogger from '@renderer/utils/logger'
import { useVideoFileUpload } from './useVideoFileUpload'
import { useVideoFileSelection } from './useVideoFileSelection'

export interface UseVideoFileReturn extends VideoFileState {
  originalFilePath?: string
  isLocalFile: boolean
  handleVideoUpload: (file: File, resetVideoState?: () => void) => boolean
  handleVideoFileSelect: (
    resetVideoState?: () => void
  ) => Promise<{ success: boolean; filePath?: string; fileName?: string }>
  setVideoFile: (fileId: string, url: string, fileName: string, filePath?: string) => void
  clearVideoFile: () => void
}

export function useVideoFile(): UseVideoFileReturn {
  const [state, setState] = useState<VideoFileState>({
    fileId: '',
    videoFile: null,
    videoFileName: '',
    displayAspectRatio: 16 / 9
  })

  const [originalFilePath, setOriginalFilePath] = useState<string | undefined>()
  const [isLocalFile, setIsLocalFile] = useState(false)

  const { handleVideoUpload: uploadHandler } = useVideoFileUpload()
  const { handleVideoFileSelect: selectionHandler } = useVideoFileSelection()

  // 设置视频文件
  const setVideoFile = useCallback(
    async (fileId: string, url: string, fileName: string, filePath?: string) => {
      // 清理之前的 URL
      cleanupBlobUrl(state.videoFile)

      // 先设置基本信息，使用默认宽高比
      setState({
        fileId,
        videoFile: url,
        videoFileName: fileName,
        displayAspectRatio: 16 / 9 // 默认值
      })

      setOriginalFilePath(filePath)
      setIsLocalFile(!!filePath)

      RendererLogger.info('✅ 设置视频文件:', { fileId, url, fileName, filePath })

      // 异步获取视频的真实宽高比
      try {
        const aspectRatio = await getVideoAspectRatioFromUrl(url)
        const aspectRatioName = guessAspectRatioName(aspectRatio)

        RendererLogger.info('✅ 获取到视频DAR:', {
          aspectRatio: aspectRatio.toFixed(3),
          aspectRatioName,
          fileName
        })

        // 更新状态中的宽高比
        setState((prevState) => ({
          ...prevState,
          displayAspectRatio: aspectRatio
        }))
        RendererLogger.info(`视频DAR: ${aspectRatioName} (${aspectRatio.toFixed(3)})`)
      } catch (error) {
        RendererLogger.warn('⚠️ 获取视频DAR失败，使用默认值:', error)
      }
    },
    [state.videoFile]
  )

  // 清除视频文件
  const clearVideoFile = useCallback(() => {
    // 清理之前的 URL
    cleanupBlobUrl(state.videoFile)

    setState({
      fileId: '',
      videoFile: null,
      videoFileName: '',
      displayAspectRatio: 16 / 9 // 重置为默认值
    })

    setOriginalFilePath(undefined)
    setIsLocalFile(false)

    RendererLogger.info('✅ 清除视频文件')
  }, [state.videoFile])

  // 包装上传处理器，自动传递 setVideoFile
  const handleVideoUpload = useCallback(
    (file: File, resetVideoState?: () => void): boolean => {
      return uploadHandler(file, setVideoFile, resetVideoState)
    },
    [uploadHandler, setVideoFile]
  )

  // 包装选择处理器，自动传递 setVideoFile
  const handleVideoFileSelect = useCallback(
    async (
      resetVideoState?: () => void
    ): Promise<{ success: boolean; filePath?: string; fileName?: string }> => {
      // 适配参数: selection handler 需要 4 个参数的回调，但 setVideoFile 兼容这个调用
      const adaptedSetVideoFile = (
        fileId: string,
        url: string,
        fileName: string,
        filePath: string
      ): void => {
        setVideoFile(fileId, url, fileName, filePath)
      }
      return selectionHandler(adaptedSetVideoFile, resetVideoState)
    },
    [selectionHandler, setVideoFile]
  )

  // 组件卸载时清理 URL
  useEffect(() => {
    return (): void => {
      cleanupBlobUrl(state.videoFile)
    }
  }, [state.videoFile])

  return {
    ...state,
    originalFilePath,
    isLocalFile,
    setVideoFile,
    clearVideoFile,
    handleVideoUpload,
    handleVideoFileSelect
  }
}
