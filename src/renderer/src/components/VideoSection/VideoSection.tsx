import React, { useState, useCallback, useEffect } from 'react'
import VideoPlayer from '@renderer/components/VideoPlayer/VideoPlayer'
import { VideoControlsCompact } from '@renderer/components/VideoPlayer/VideoControlsCompact'

import { SubtitleControlProvider } from '@renderer/contexts/subtitle-control-context'
import { useVideoError } from '@renderer/hooks/features/video/useVideoPlayerHooks'
import { usePlayingVideoContext } from '@renderer/hooks/core/usePlayingVideoContext'
import { useSubtitleControl } from '@renderer/hooks/features/subtitle/useSubtitleControl'
import { useShortcutGroup } from '@renderer/hooks/features/shortcuts/useComponentShortcuts'
import { useFullscreenMode } from '@renderer/hooks/features/ui/useFullscreenMode'
import { ImmersiveTopBar } from './ImmersiveTopBar'
import { VideoCompatibilityModal } from './VideoCompatibilityModal'

import styles from './VideoSection.module.css'
import { useRecentPlayList } from '@renderer/hooks/features/video/useRecentPlayList'
import { isWindows } from '@renderer/utils/system'
import { ffmpegNativeClient } from '@renderer/utils/ffmpegNativeClient'
import {
  transcodeDecisionHelper,
  TranscodeStrategy,
  type TranscodeDecision
} from '@renderer/utils/transcodeDecision'
import RendererLogger from '@renderer/utils/logger'

// 内部组件 - 需要在 SubtitleControlProvider 内部使用
interface VideoSectionInnerProps {
  onBack?: () => void
}

function VideoSectionInner({ onBack }: VideoSectionInnerProps): React.JSX.Element {
  const videoError = useVideoError()
  const playingVideoContext = usePlayingVideoContext()
  const { isFullscreen } = useFullscreenMode()
  const [isVideoLoaded, setIsVideoLoaded] = useState(false)
  const subtitleControl = useSubtitleControl()

  // 兼容性警告状态 / Compatibility warning state
  const [showCompatibilityModal, setShowCompatibilityModal] = useState(false)
  const [modalInitialStep, setModalInitialStep] = useState<
    'ffmpeg-not-found' | 'decision-ready' | undefined
  >(undefined)
  const [modalAnalysisResult, setModalAnalysisResult] = useState<
    | {
        decision: TranscodeDecision
        recommendation: string
        canExecute: boolean
      }
    | undefined
  >(undefined)

  // 注册组件特定的快捷键 / Register component-specific shortcuts
  useShortcutGroup('VideoSection', {
    singleLoop: subtitleControl.toggleSingleLoop,
    autoPause: subtitleControl.toggleAutoPause,
    previousSubtitle: subtitleControl.goToPreviousSubtitle,
    nextSubtitle: subtitleControl.goToNextSubtitle
  })

  // 静默检查视频兼容性 / Silently check video compatibility
  const silentCompatibilityCheck = useCallback(async (videoFile: string) => {
    try {
      RendererLogger.info('开始静默检查视频兼容性', { videoFile })

      // 重置状态
      setModalInitialStep(undefined)
      setModalAnalysisResult(undefined)

      // 检查 FFmpeg 是否存在 / Check if FFmpeg exists
      const ffmpegExists = await ffmpegNativeClient.checkExists()

      if (!ffmpegExists) {
        // FFmpeg 不存在，需要下载，显示 modal
        RendererLogger.info('FFmpeg 不存在，需要显示下载提示')
        setModalInitialStep('ffmpeg-not-found')
        setShowCompatibilityModal(true)
        return
      }

      // 获取视频信息并分析兼容性
      const videoInfo = await ffmpegNativeClient.getVideoInfo(videoFile)
      if (!videoInfo) {
        RendererLogger.warn('无法获取视频信息，可能需要用户干预')
        setModalInitialStep('decision-ready')
        setShowCompatibilityModal(true)
        return
      }

      // 使用智能转码决策系统分析
      const analysisResult = await transcodeDecisionHelper.analyzeVideo(videoFile)
      RendererLogger.info('静默兼容性检查结果', {
        strategy: analysisResult.decision.strategy,
        canExecute: analysisResult.canExecute
      })

      // 只有在需要转码时才显示 modal
      if (analysisResult.decision.strategy !== TranscodeStrategy.NOT_NEEDED) {
        RendererLogger.info('视频需要转码处理，显示兼容性 modal')
        setModalInitialStep('decision-ready')
        setModalAnalysisResult(analysisResult)
        setShowCompatibilityModal(true)
      } else {
        RendererLogger.info('视频完全兼容，无需显示 modal')
        setShowCompatibilityModal(false)
      }
    } catch (error) {
      RendererLogger.error('静默兼容性检查失败，显示 modal 让用户处理:', error)
      // 检查失败时显示 modal，让用户看到具体错误
      setModalInitialStep(undefined) // 让 modal 自己分析
      setShowCompatibilityModal(true)
    }
  }, [])

  // 检测视频兼容性 / Check video compatibility
  useEffect(() => {
    if (playingVideoContext.videoFile) {
      const fileName = playingVideoContext.videoFile.toLowerCase()

      // 对于可能有兼容性问题的格式，进行静默检查
      if (
        fileName.endsWith('.mkv') ||
        fileName.endsWith('.m2ts') ||
        fileName.endsWith('.ts') ||
        fileName.includes('hevc') ||
        fileName.includes('h265')
      ) {
        silentCompatibilityCheck(playingVideoContext.videoFile)
      } else {
        // 对于常见的兼容格式，不显示 modal
        setShowCompatibilityModal(false)
      }
    } else {
      setShowCompatibilityModal(false)
    }
  }, [playingVideoContext.videoFile, silentCompatibilityCheck])

  // 监听视频错误，如果播放失败可能是编解码器问题 / Listen for video errors
  useEffect(() => {
    if (videoError && playingVideoContext.videoFile) {
      const errorMessage = videoError.toLowerCase()

      if (
        errorMessage.includes('codec') ||
        errorMessage.includes('format') ||
        errorMessage.includes('unsupported') ||
        errorMessage.includes('decode')
      ) {
        RendererLogger.info('检测到视频播放错误，显示兼容性 modal', { videoError })
        setShowCompatibilityModal(true)
      }
    }
  }, [videoError, playingVideoContext.videoFile])

  // 关闭兼容性模态框 / Close compatibility modal
  const handleCloseCompatibilityModal = useCallback(() => {
    setShowCompatibilityModal(false)
    setModalInitialStep(undefined)
    setModalAnalysisResult(undefined)
  }, [])

  const recentPlayList = useRecentPlayList()
  // 转码完成处理 / Handle transcoding completion
  const handleTranscodeComplete = useCallback(
    async (transcodedFilePath: string) => {
      try {
        console.log('转码完成，新文件路径:', transcodedFilePath)

        let localFilePath = transcodedFilePath

        // 判断当前平台是否为 unix 或者 windows
        // 如果是 unix 平台，则使用 / 作为开始
        // 如果是 windows 平台
        if (isWindows()) {
          if (transcodedFilePath.startsWith('file:///')) {
            // 移除 file:/// 前缀并解码 URL 编码
            localFilePath = decodeURIComponent(transcodedFilePath.replace('file:///', ''))
          }
        } else {
          if (transcodedFilePath.startsWith('file://')) {
            // 移除 file:// 前缀并解码 URL 编码
            localFilePath = decodeURIComponent(transcodedFilePath.replace('file://', ''))
          }
        }

        console.log('转换后的本地文件路径:', localFilePath)

        // 从转码后的文件路径中提取文件名
        const transcodedFileName = localFilePath.split(/[\\/]/).pop() || 'transcoded_video.mp4'

        // 获取转码后文件的 URL
        const { FileSystemHelper } = await import('@renderer/utils/fileSystemHelper')
        const transcodedFileUrl = await FileSystemHelper.getVideoFileUrl(localFilePath)

        if (!transcodedFileUrl) {
          console.error('❌ 无法获取转码后文件的 URL')
          return
        }

        // 保持当前的 fileId，只更新视频文件 URL 和路径
        const currentFileId = playingVideoContext.fileId

        // 更新播放的视频文件路径（保持相同的 fileId）
        playingVideoContext.setVideoFile(
          currentFileId,
          transcodedFileUrl,
          transcodedFileName,
          localFilePath
        )

        // 将转码后的文件路径持久化存储
        recentPlayList.updateRecentPlaySilent(currentFileId, {
          fileName: transcodedFileName,
          filePath: localFilePath
        })

        console.log('✅ 成功切换到转码后的视频文件:', {
          fileId: currentFileId,
          fileName: transcodedFileName,
          filePath: localFilePath,
          url: transcodedFileUrl
        })
      } catch (error) {
        console.error('❌ 切换到转码后文件时出错:', error)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [playingVideoContext]
  )

  return (
    <div className={`${styles.videoSectionContainer} ${isFullscreen ? styles.fullscreen : ''}`}>
      {/* 兼容性与转码模态框 - Compatibility and Transcoding Modal */}
      <VideoCompatibilityModal
        visible={showCompatibilityModal}
        videoFile={playingVideoContext.videoFile || undefined}
        isFullscreen={isFullscreen}
        onClose={handleCloseCompatibilityModal}
        onTranscodeComplete={handleTranscodeComplete}
        initialStep={modalInitialStep}
        initialAnalysisResult={modalAnalysisResult}
      />

      {/* 视频播放区域 / Video player area */}
      <div className={styles.videoPlayerSection}>
        {/* 沉浸式顶部 Bar / Immersive top bar */}
        <ImmersiveTopBar onBack={onBack} />

        <VideoPlayer isVideoLoaded={isVideoLoaded} onVideoReady={() => setIsVideoLoaded(true)} />
      </div>

      {/* 视频控制区域 - 仅在非全屏模式下显示 / Video controls area - only show in non-fullscreen mode */}
      {playingVideoContext.videoFile && !isFullscreen && (
        <div className={styles.videoControlsSection}>
          <VideoControlsCompact isVideoLoaded={isVideoLoaded} videoError={videoError} />
        </div>
      )}
    </div>
  )
}

// 外部组件 - 提供所有必要的 Context / External component - provides all necessary Context
interface VideoSectionProps {
  onBack?: () => void
}

export function VideoSection({ onBack }: VideoSectionProps): React.JSX.Element {
  return (
    <SubtitleControlProvider>
      <VideoSectionInner onBack={onBack} />
    </SubtitleControlProvider>
  )
}
