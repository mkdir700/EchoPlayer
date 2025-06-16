import { useCallback } from 'react'
import RendererLogger from '@renderer/utils/logger'
import { FileSystemHelper } from '@renderer/utils/fileSystemHelper'
import { message } from 'antd'

export interface UseVideoFileSelectionReturn {
  handleVideoFileSelect: (
    onVideoSet: (fileId: string, url: string, fileName: string, filePath: string) => void,
    resetVideoState?: () => void
  ) => Promise<{ success: boolean; filePath?: string; fileName?: string }>
}

export function useVideoFileSelection(): UseVideoFileSelectionReturn {
  // 通过文件对话框选择视频文件
  const handleVideoFileSelect = useCallback(
    async (
      onVideoSet: (fileId: string, url: string, fileName: string, filePath: string) => void,
      resetVideoState?: () => void
    ): Promise<{ success: boolean; filePath?: string; fileName?: string }> => {
      try {
        // 🧪 测试环境：直接使用测试视频文件，跳过文件选择对话框
        // Test environment: directly use test video file, skip file selection dialog
        if (window.api.env.isTestEnv()) {
          console.log('🧪 Test mode detected, using test video file...')

          // 使用新的API获取测试视频文件路径 / Use new API to get test video file path
          const testVideoPath = await window.api.appConfig.getTestVideoPath()
          const testFileName = 'test-video.mp4'

          // 在设置新视频文件之前，先重置视频播放器状态
          if (resetVideoState) {
            RendererLogger.info('🔄 重置视频播放器状态 (测试模式)...')
            resetVideoState()
          }

          // 创建测试文件 URL
          const testFileUrl = `file://${testVideoPath}`

          RendererLogger.info('🧪 使用测试视频文件:', {
            filePath: testVideoPath,
            fileName: testFileName,
            fileUrl: testFileUrl
          })

          // 直接调用回调设置视频文件
          onVideoSet('test-file-id', testFileUrl, testFileName, testVideoPath)

          RendererLogger.info('✅ 测试视频文件设置成功')
          message.success(`测试视频文件 ${testFileName} 已加载`)

          return { success: true, filePath: testVideoPath, fileName: testFileName }
        }

        // 🎬 生产环境：正常的文件选择流程
        // Production environment: normal file selection flow
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
          '@renderer/utils/videoCompatibility'
        )
        printCompatibilityReport()

        // 如果是 H.265 视频但不支持，给出警告
        if (fileName.toLowerCase().includes('hevc') || fileName.toLowerCase().includes('h265')) {
          if (!supportsH265()) {
            RendererLogger.warn('⚠️ 检测到 H.265 视频文件，但当前环境可能不支持 H.265 解码')
            message.warning('检测到 H.265 视频文件，如果播放失败，建议转换为 H.264 格式')
          }
        }

        // 调用回调设置视频文件
        onVideoSet('', fileUrl, fileName, filePath)

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
    []
  )

  return {
    handleVideoFileSelect
  }
}
