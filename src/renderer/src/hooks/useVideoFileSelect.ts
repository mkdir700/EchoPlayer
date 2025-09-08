import { loggerService } from '@logger'
import FileManager from '@renderer/services/FileManager'
import { VideoLibraryService } from '@renderer/services/VideoLibrary'
import { createPerformanceMonitor } from '@renderer/utils/PerformanceMonitor'
import { videoExts } from '@shared/config/constant'
import { message } from 'antd'
import type { FileMetadata, VideoLibraryRecord } from 'packages/shared/types/database'
import { useCallback, useState } from 'react'

const logger = loggerService.withContext('useVideoFileSelect')

interface UseVideoFileSelectOptions {
  onSuccess?: () => void
}

export interface UseVideoFileSelectReturn {
  selectVideoFile: () => Promise<void>
  isProcessing: boolean
}

/**
 * Hook to select a video file, validate/process it, and add it to the video library.
 *
 * Opens a file picker restricted to configured video extensions, verifies video parser availability
 * (MediaInfo WebAssembly preferred, FFmpeg as fallback), persists the file via FileManager,
 * extracts video metadata (duration, codec, resolution) using the available parser,
 * creates a VideoLibrary record, and invokes an optional success callback.
 * Exposes a function to trigger the flow and a flag that indicates ongoing processing to
 * prevent concurrent operations.
 *
 * @param options - Optional settings.
 * @param options.onSuccess - Callback invoked after a video file is successfully processed and recorded.
 * @returns An object containing:
 *  - `selectVideoFile`: async function that opens the file picker and runs the processing flow for the first selected file.
 *  - `isProcessing`: boolean flag that is true while a file is being processed.
 */
export function useVideoFileSelect(
  options: UseVideoFileSelectOptions = {}
): UseVideoFileSelectReturn {
  const { onSuccess } = options
  const [isProcessing, setIsProcessing] = useState(false)

  const processVideoFile = useCallback(
    async (file: FileMetadata) => {
      try {
        // 创建性能监控器
        const monitor = createPerformanceMonitor('视频添加流程')

        logger.info('📄 选中的文件信息:', {
          file: file
        })

        try {
          // 1. 检查 MediaInfo 是否可用（优先使用），回退到 FFmpeg
          monitor.startTiming('视频解析器检查')
          const mediaInfoExists = await window.api.mediainfo.checkExists()
          const ffmpegExists = !mediaInfoExists ? await window.api.ffmpeg.checkExists() : false
          monitor.endTiming('视频解析器检查')

          if (!mediaInfoExists && !ffmpegExists) {
            throw new Error('视频解析器不可用。MediaInfo 和 FFmpeg 都无法使用，请检查系统配置。')
          }

          const usingMediaInfo = mediaInfoExists
          logger.info(`📊 使用视频解析器: ${usingMediaInfo ? 'MediaInfo' : 'FFmpeg'}`, {
            mediaInfoAvailable: mediaInfoExists,
            ffmpegAvailable: ffmpegExists
          })

          // 2. 将文件添加到文件数据库
          monitor.startTiming('文件数据库添加', { fileName: file.name, fileSize: file.size })
          const addedFile = await FileManager.addFile(file)
          monitor.endTiming('文件数据库添加')

          // 3. 解析视频文件信息，包括：分辨率、码率、时长等
          // 优先使用 MediaInfo (WebAssembly)，回退到 FFmpeg
          monitor.startTiming('视频信息获取', {
            filePath: file.path,
            parser: usingMediaInfo ? 'MediaInfo' : 'FFmpeg'
          })
          const videoInfo = usingMediaInfo
            ? await window.api.mediainfo.getVideoInfo(file.path)
            : await window.api.ffmpeg.getVideoInfo(file.path)
          monitor.endTiming('视频信息获取', {
            parser: usingMediaInfo ? 'MediaInfo' : 'FFmpeg',
            duration: videoInfo?.duration,
            videoCodec: videoInfo?.videoCodec,
            resolution: videoInfo?.resolution
          })

          if (!videoInfo) {
            throw new Error('无法获取视频信息，请检查文件是否为有效的视频文件')
          }

          // 4. 构建 VideoLibraryRecord 并写入数据库
          monitor.startTiming('视频库记录添加')
          const videoLibraryService = new VideoLibraryService()
          const videoRecord: Omit<VideoLibraryRecord, 'id'> = {
            fileId: addedFile.id,
            currentTime: 0,
            duration: videoInfo.duration,
            playedAt: Date.now(),
            firstPlayedAt: Date.now(),
            playCount: 0,
            isFinished: false,
            isFavorite: false,
            thumbnailPath: null
          }

          await videoLibraryService.addRecord(videoRecord)
          monitor.endTiming('视频库记录添加')

          // 生成性能报告
          const report = monitor.finish(50) // 50ms 作为性能瓶颈阈值

          const totalTimeMs = Math.round(report.totalDuration)
          logger.info(`视频文件添加成功！总耗时: ${totalTimeMs}ms`)
          // 调用成功回调
          onSuccess?.()
        } catch (error) {
          logger.error('处理视频文件失败:', { error: error as Error })
          throw error
        }
      } catch (error) {
        logger.error('视频文件处理流程失败:', { error: error as Error })
        throw error
      }
    },
    [onSuccess]
  )

  const selectVideoFile = useCallback(async () => {
    if (isProcessing) {
      return
    }

    try {
      setIsProcessing(true)

      const files = await window.api.file.select({
        properties: ['openFile'],
        filters: [
          {
            name: 'Video Files',
            extensions: videoExts
          }
        ]
      })

      if (files && files.length > 0) {
        const file = files[0]
        await processVideoFile(file)
        message.success('视频文件添加成功！')
      }
    } catch (error) {
      logger.error('添加文件失败:', { error: error as Error })
      message.error('添加文件失败')
    } finally {
      setIsProcessing(false)
    }
  }, [isProcessing, processVideoFile])

  return {
    selectVideoFile,
    isProcessing
  }
}
