import { useState, useCallback, useEffect } from 'react'
import { message } from 'antd'
import type { VideoFileState } from '../types'
import { isValidVideoFile, cleanupBlobUrl } from '../utils/helpers'
import { FileSystemHelper } from '../utils/fileSystemHelper'
import { getVideoAspectRatioFromUrl, guessAspectRatioName } from '../utils/videoUtils'
import RendererLogger from '@renderer/utils/logger'

export interface UseFileUploadReturn extends VideoFileState {
  originalFilePath?: string
  isLocalFile: boolean
  handleVideoUpload: (file: File, resetVideoState?: () => void) => boolean
  handleVideoFileSelect: (
    resetVideoState?: () => void
  ) => Promise<{ success: boolean; filePath?: string; fileName?: string }>
  setVideoFile: (url: string, fileName: string, filePath?: string) => void
  clearVideoFile: () => void
}

export function useFileUpload(): UseFileUploadReturn {
  const [state, setState] = useState<VideoFileState>({
    videoFile: null,
    videoFileName: '',
    displayAspectRatio: 16 / 9
  })

  const [originalFilePath, setOriginalFilePath] = useState<string | undefined>()
  const [isLocalFile, setIsLocalFile] = useState(false)

  // 设置视频文件
  const setVideoFile = useCallback(
    async (url: string, fileName: string, filePath?: string) => {
      // 清理之前的 URL
      cleanupBlobUrl(state.videoFile)

      // 先设置基本信息，使用默认宽高比
      setState({
        videoFile: url,
        videoFileName: fileName,
        displayAspectRatio: 16 / 9 // 默认值
      })

      setOriginalFilePath(filePath)
      setIsLocalFile(!!filePath)

      RendererLogger.info('✅ 设置视频文件:', { state })

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

        message.success(`视频DAR: ${aspectRatioName} (${aspectRatio.toFixed(3)})`)
      } catch (error) {
        console.warn('⚠️ 获取视频DAR失败，使用默认值:', error)
        // 保持默认的16:9宽高比
      }
    },
    [state]
  )

  // 清除视频文件
  const clearVideoFile = useCallback(() => {
    // 清理之前的 URL
    cleanupBlobUrl(state.videoFile)

    setState({
      videoFile: null,
      videoFileName: '',
      displayAspectRatio: 16 / 9 // 重置为默认值
    })

    setOriginalFilePath(undefined)
    setIsLocalFile(false)

    RendererLogger.info('✅ 清除视频文件')
  }, [state])

  // 通过文件对话框选择视频文件
  const handleVideoFileSelect = useCallback(
    async (
      resetVideoState?: () => void
    ): Promise<{ success: boolean; filePath?: string; fileName?: string }> => {
      try {
        const filePaths = await FileSystemHelper.openFileDialog({
          title: '选择视频文件',
          filters: [
            {
              name: '视频文件',
              extensions: ['mp4', 'avi', 'mov', 'mkv', 'webm', 'ogg', 'm4v', 'flv', 'wmv']
            },
            {
              name: '所有文件',
              extensions: ['*']
            }
          ],
          properties: ['openFile']
        })

        if (!filePaths || filePaths.length === 0) {
          return { success: false }
        }

        const filePath = filePaths[0]

        // 验证文件格式
        if (!FileSystemHelper.isSupportedVideoFormat(filePath)) {
          message.error('不支持的视频格式，请选择支持的视频文件')
          return { success: false }
        }

        // 获取文件 URL
        const fileUrl = await FileSystemHelper.getVideoFileUrl(filePath)
        if (!fileUrl) {
          message.error('无法访问选择的视频文件，请检查文件路径和权限')
          return { success: false }
        }

        // 验证生成的 URL 格式
        RendererLogger.info('生成的视频文件URL:', fileUrl)

        // 检查文件信息
        const fileInfo = await FileSystemHelper.getFileInfo(filePath)
        if (fileInfo) {
          RendererLogger.info('视频文件信息:', {
            size: `${(fileInfo.size / 1024 / 1024).toFixed(2)} MB`,
            isFile: fileInfo.isFile,
            lastModified: new Date(fileInfo.mtime).toLocaleString()
          })
        }

        // 在设置新视频文件之前，先重置视频播放器状态
        if (resetVideoState) {
          RendererLogger.info('🔄 重置视频播放器状态...')
          resetVideoState()
        }

        const fileName = FileSystemHelper.getFileName(filePath)

        // 检查视频兼容性
        const { printCompatibilityReport, supportsH265 } = await import(
          '../utils/videoCompatibility'
        )
        printCompatibilityReport()

        // 如果是 H.265 视频但不支持，给出警告
        if (fileName.toLowerCase().includes('hevc') || fileName.toLowerCase().includes('h265')) {
          if (!supportsH265()) {
            RendererLogger.warn('⚠️ 检测到 H.265 视频文件，但当前环境可能不支持 H.265 解码')
            message.warning('检测到 H.265 视频文件，如果播放失败，建议转换为 H.264 格式')
          }
        }

        // 使用新的 setVideoFile 方法
        await setVideoFile(fileUrl, fileName, filePath)

        RendererLogger.info('✅ 通过文件对话框选择视频文件:', {
          filePath,
          fileName,
          fileUrl
        })

        message.success(`视频文件 ${fileName} 已加载`)
        return { success: true, filePath, fileName }
      } catch (error) {
        RendererLogger.error('选择视频文件失败:', error)
        message.error('选择视频文件失败')
        return { success: false }
      }
    },
    [setVideoFile]
  )

  // 视频文件上传处理（拖拽或选择文件）
  const handleVideoUpload = useCallback(
    (file: File, resetVideoState?: () => void): boolean => {
      // 检查文件类型
      if (!isValidVideoFile(file)) {
        message.error('不支持的视频格式，请选择 MP4、AVI、MOV、MKV、WebM 或 OGG 格式的视频文件')
        return false
      }

      // 在设置新视频文件之前，先重置视频播放器状态
      if (resetVideoState) {
        RendererLogger.info('🔄 重置视频播放器状态...')
        resetVideoState()
      }

      // 创建新的 blob URL
      const url = URL.createObjectURL(file)
      RendererLogger.info('Created blob URL:', url)
      RendererLogger.info('File info:', {
        name: file.name,
        type: file.type,
        size: file.size,
        lastModified: file.lastModified
      })

      // 使用新的 setVideoFile 方法（异步获取DAR）
      setVideoFile(url, file.name)

      message.success(`视频文件 ${file.name} 已加载`)
      return true
    },
    [setVideoFile]
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
    handleVideoUpload,
    handleVideoFileSelect,
    setVideoFile,
    clearVideoFile
  }
}
