import React, { useState, useCallback, useEffect } from 'react'
import { VideoPlayer } from '@renderer/components/VideoPlayer/VideoPlayer'
import { VideoControlsCompact } from '@renderer/components/VideoPlayer/VideoControlsCompact'

import { SubtitleControlProvider } from '@renderer/contexts/subtitle-control-context'
import { useVideoError } from '@renderer/hooks/useVideoPlayerHooks'
import { usePlayingVideoContext } from '@renderer/hooks/usePlayingVideoContext'
import { useSubtitleControl } from '@renderer/hooks/useSubtitleControl'
import { useShortcutGroup } from '@renderer/hooks/useComponentShortcuts'
import { useFullscreenMode } from '@renderer/hooks/useFullscreenMode'
import { ImmersiveTopBar } from './ImmersiveTopBar'
import { VideoCompatibilityModal } from './VideoCompatibilityModal'

import styles from './VideoSection.module.css'
import { useRecentPlayList } from '@renderer/hooks/useRecentPlayList'

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

  // 注册组件特定的快捷键 / Register component-specific shortcuts
  useShortcutGroup('VideoSection', {
    singleLoop: subtitleControl.toggleSingleLoop,
    autoPause: subtitleControl.toggleAutoPause,
    previousSubtitle: subtitleControl.goToPreviousSubtitle,
    nextSubtitle: subtitleControl.goToNextSubtitle
  })

  // 检测视频兼容性 / Check video compatibility
  useEffect(() => {
    if (playingVideoContext.videoFile) {
      const fileName = playingVideoContext.videoFile.toLowerCase()

      // 检查是否是可能有兼容性问题的格式
      if (fileName.endsWith('.mkv') || fileName.endsWith('.m2ts') || fileName.endsWith('.ts')) {
        setShowCompatibilityModal(true)
      } else {
        setShowCompatibilityModal(false)
      }
    } else {
      setShowCompatibilityModal(false)
    }
  }, [playingVideoContext.videoFile])

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
        setShowCompatibilityModal(true)
      }
    }
  }, [videoError, playingVideoContext.videoFile])

  // 关闭兼容性模态框 / Close compatibility modal
  const handleCloseCompatibilityModal = useCallback(() => {
    setShowCompatibilityModal(false)
  }, [])

  const recentPlayList = useRecentPlayList()
  // 转码完成处理 / Handle transcoding completion
  const handleTranscodeComplete = useCallback(
    async (transcodedFilePath: string) => {
      try {
        console.log('转码完成，新文件路径:', transcodedFilePath)

        // 检查是否是 file:// URL，如果是则转换为本地路径
        let localFilePath = transcodedFilePath
        if (transcodedFilePath.startsWith('file://')) {
          // 移除 file:// 前缀并解码 URL 编码
          localFilePath = decodeURIComponent(transcodedFilePath.replace('file://', ''))
          console.log('转换后的本地文件路径:', localFilePath)
        }

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
