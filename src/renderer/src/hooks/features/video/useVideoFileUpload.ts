import { useCallback } from 'react'
import { isValidVideoFile } from '@renderer/utils/helpers'
import RendererLogger from '@renderer/utils/logger'
import { message } from 'antd'

export interface UseVideoFileUploadReturn {
  handleVideoUpload: (
    file: File,
    onVideoSet: (fileId: string, url: string, fileName: string) => void,
    resetVideoState?: () => void
  ) => boolean
}

export function useVideoFileUpload(): UseVideoFileUploadReturn {
  // 视频文件上传处理（拖拽或选择文件）
  const handleVideoUpload = useCallback(
    (
      file: File,
      onVideoSet: (fileId: string, url: string, fileName: string) => void,
      resetVideoState?: () => void
    ): boolean => {
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

      // 调用回调设置视频文件
      onVideoSet('', url, file.name)

      message.success(`视频文件 ${file.name} 已加载`)
      return true
    },
    []
  )

  return {
    handleVideoUpload
  }
}
