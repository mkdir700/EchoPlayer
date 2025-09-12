import { loggerService } from '@logger'
import FileManager from '@renderer/services/FileManager'
import { VideoLibraryService } from '@renderer/services/VideoLibrary'
import { ParallelVideoProcessor } from '@renderer/utils/ParallelVideoProcessor'
import { createPerformanceMonitor } from '@renderer/utils/PerformanceMonitor'
import { getVideoDialogExtensions } from '@shared/config/constant'
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
        const monitor = createPerformanceMonitor('视频添加流程（优化版）')

        logger.info('📄 选中的文件信息:', {
          file: file,
          fileSize: `${Math.round(file.size / 1024 / 1024)}MB`
        })

        try {
          // 1. 并行准备处理（文件验证、解析器检查、格式分析）
          monitor.startTiming('并行准备阶段')
          const context = await ParallelVideoProcessor.prepareProcessing(file)
          monitor.endTiming('并行准备阶段')

          // 验证处理上下文
          const validationErrors = ParallelVideoProcessor.validateContext(context)
          if (validationErrors.length > 0) {
            throw new Error(`处理准备失败: ${validationErrors.join(', ')}`)
          }

          // 获取优化的解析策略
          const { useParser, allowFallback, timeoutMs } =
            ParallelVideoProcessor.getOptimizedStrategy(context)

          logger.info('📊 使用优化策略:', {
            useParser,
            allowFallback,
            timeoutMs: `${timeoutMs}ms`,
            strategy: context.formatAnalysis.strategy,
            confidence: context.formatAnalysis.confidence,
            reasoning: context.formatAnalysis.reasoning
          })

          // 2. 并行执行文件添加和视频信息解析准备
          monitor.startTiming('文件数据库添加')
          const addFilePromise = FileManager.addFile(file)

          // 3. 策略化解析视频文件信息
          monitor.startTiming('策略化视频信息获取', {
            filePath: file.path,
            strategy: context.formatAnalysis.strategy,
            parser: useParser,
            timeout: timeoutMs
          })

          const videoInfoPromise = window.api.mediainfo.getVideoInfoWithStrategy(
            file.path,
            context.formatAnalysis.strategy,
            timeoutMs
          )

          // 等待并行操作完成
          const [addedFile, videoInfo] = await Promise.all([addFilePromise, videoInfoPromise])

          monitor.endTiming('文件数据库添加')
          monitor.endTiming('策略化视频信息获取', {
            parser: useParser,
            strategy: context.formatAnalysis.strategy,
            duration: videoInfo?.duration,
            videoCodec: videoInfo?.videoCodec,
            resolution: videoInfo?.resolution,
            success: !!videoInfo
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
          const preparationTime = monitor.getDuration('并行准备阶段') || 0
          const parseTime = monitor.getDuration('策略化视频信息获取') || 0

          logger.info(`✅ 视频文件添加成功！总耗时: ${totalTimeMs}ms`, {
            preparationTime: `${preparationTime.toFixed(2)}ms`,
            parseTime: `${parseTime.toFixed(2)}ms`,
            strategy: context.formatAnalysis.strategy,
            actualParser: useParser,
            estimatedTime: `${context.formatAnalysis.estimatedTime}ms`,
            performanceGain:
              context.formatAnalysis.estimatedTime > totalTimeMs
                ? `节省 ${Math.round(((context.formatAnalysis.estimatedTime - totalTimeMs) / context.formatAnalysis.estimatedTime) * 100)}%`
                : '符合预期'
          })

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
            extensions: getVideoDialogExtensions()
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
