import { loggerService } from '@logger'
import FileManager from '@renderer/services/FileManager'
import { VideoLibraryService } from '@renderer/services/VideoLibrary'
import { createPerformanceMonitor } from '@renderer/utils/PerformanceMonitor'
import { videoExts } from '@shared/config/constant'
import { VideoLibraryRecord } from '@types'
import { message, Tooltip } from 'antd'
import { FilePlus } from 'lucide-react'
import { FC, useCallback } from 'react'
import { useTranslation } from 'react-i18next'

import { NavbarIcon } from '.'

const logger = loggerService.withContext('VideoAddButton')

const VideoAddButton: FC = () => {
  const { t } = useTranslation()

  const onSelectFile = useCallback(async () => {
    try {
      // 创建性能监控器
      const monitor = createPerformanceMonitor('视频添加流程')

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
        logger.info('📄 选中的文件信息:', {
          name: file.name,
          path: file.path,
          size: file.size,
          ext: file.ext
        })

        // 显示加载消息
        const loadingMessage = message.loading('正在处理视频文件...', 0)

        try {
          // 1. 检查 FFmpeg 是否可用
          monitor.startTiming('FFmpeg检查')
          const ffmpegExists = await window.api.ffmpeg.checkExists()
          monitor.endTiming('FFmpeg检查')

          if (!ffmpegExists) {
            throw new Error('FFmpeg 不可用。请确保系统已安装 FFmpeg 并添加到 PATH 环境变量中。')
          }

          // 2. 将文件添加到文件数据库
          monitor.startTiming('文件数据库添加', { fileName: file.name, fileSize: file.size })
          const fileRecord = await FileManager.addFile(file)
          monitor.endTiming('文件数据库添加')

          // 3. 解析视频文件信息，包括：分辨率、码率、时长等
          // TODO: 当前使用系统 FFmpeg，后续需要实现：
          // - FFmpeg 的自动下载和安装
          // - 更完整的视频信息解析（包括分辨率、帧率、编解码器等）
          monitor.startTiming('视频信息获取', { filePath: file.path })
          const videoInfo = await window.api.ffmpeg.getVideoInfo(file.path)
          monitor.endTiming('视频信息获取', {
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
            fileId: fileRecord.id,
            currentTime: 0,
            duration: videoInfo.duration,
            playedAt: Date.now(),
            firstPlayedAt: Date.now(),
            playCount: 0,
            isFinished: false,
            isFavorite: false,
            thumbnailPath: undefined
          }

          await videoLibraryService.addOrUpdateRecord(videoRecord)
          monitor.endTiming('视频库记录添加')

          // 生成性能报告
          const report = monitor.finish(50) // 50ms 作为性能瓶颈阈值

          loadingMessage()

          const totalTimeMs = Math.round(report.totalDuration)
          logger.info(`视频文件添加成功！总耗时: ${totalTimeMs}ms`)
          message.success(`视频文件添加成功！`)
        } catch (error) {
          loadingMessage()
          logger.error('处理视频文件失败:', error as Error)
          message.error(`处理视频文件失败: ${error instanceof Error ? error.message : '未知错误'}`)
        }
      }
    } catch (error) {
      logger.error('选择文件失败:', error as Error)
      message.error('选择文件失败')
    }
  }, [])

  return (
    <Tooltip title={t('home.add_video')} mouseEnterDelay={0.8}>
      <NavbarIcon style={{ marginLeft: 10 }} onClick={onSelectFile}>
        <FilePlus size={18} />
      </NavbarIcon>
    </Tooltip>
  )
}

export default VideoAddButton
