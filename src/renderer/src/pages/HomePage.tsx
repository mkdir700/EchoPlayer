import React, { useCallback, useState } from 'react'
import { Button, Typography, message, Modal } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { useRecentPlayList } from '@renderer/hooks/useRecentPlayList'
import { usePlayingVideoContext } from '@renderer/hooks/usePlayingVideoContext'
import { useVideoControls } from '@renderer/hooks/useVideoPlayerHooks'
import { useVideoFileSelection } from '@renderer/hooks/useVideoFileSelection'
import { diagnoseAudioIssues } from '@renderer/utils/videoCompatibility'
import type { RecentPlayItem } from '@renderer/types'
import { useTheme } from '@renderer/hooks/useTheme'
import { useThemeCustomization } from '@renderer/hooks/useThemeCustomization'
import { FONT_WEIGHTS } from '@renderer/styles/theme'
import { EmptyState, VideoGrid, ConfirmModals } from '@renderer/components/HomePage'

const { Title } = Typography

interface HomePageProps {
  onNavigateToPlay: () => void
}

/**
 * Displays the home page for video playback, allowing users to view, add, open, and manage recently watched videos.
 *
 * Provides a responsive, theme-aware interface for selecting video files, viewing recent play history, resuming playback, and deleting records. Integrates with custom hooks for video control, recent play list management, and theme customization. Handles user interactions with confirmation dialogs and feedback messages.
 *
 * @param onNavigateToPlay - Callback invoked to navigate to the video playback page after a video is selected or opened.
 * @returns The rendered home page React element.
 */
export function HomePage({ onNavigateToPlay }: HomePageProps): React.JSX.Element {
  const { token, styles, utils } = useTheme()
  const { customization } = useThemeCustomization()

  // 判断是否为紧凑模式
  const isCompactMode =
    customization.algorithm === 'compact' || customization.algorithm === 'darkCompact'

  // 使用自定义 Hooks
  const videoControls = useVideoControls()
  const { recentPlays, removeRecentPlay, clearRecentPlays, addRecentPlay, updateRecentPlay } =
    useRecentPlayList()
  const playingVideoContext = usePlayingVideoContext()
  const { handleVideoFileSelect: selectVideoFile } = useVideoFileSelection()

  // 添加 loading 状态 / Add loading state
  const [isSelectingFile, setIsSelectingFile] = useState(false)

  // 处理视频文件选择(首次打开)
  const handleVideoFileSelect = useCallback(async (): Promise<boolean> => {
    // 设置 loading 状态 / Set loading state
    setIsSelectingFile(true)

    try {
      let selectedFileInfo: { url: string; fileName: string; filePath: string } | null = null

      // 使用拆分的视频选择hook，并暂存文件信息
      const result = await selectVideoFile(
        (_fileId: string, url: string, fileName: string, filePath: string) => {
          // 暂存文件信息，等添加到最近播放记录后再设置
          selectedFileInfo = { url, fileName, filePath }
        },
        videoControls.resetVideoState
      )

      if (!result.success || !selectedFileInfo) {
        console.error('❌ 无法选择视频文件')
        return false
      }

      // 文件选择成功后，现在我们需要添加到最近播放记录
      const { filePath, fileName } = result
      const { url } = selectedFileInfo

      console.log('🎬 文件选择成功:', { filePath, fileName })
      if (filePath && fileName) {
        // 更新最近播放记录
        const { success, fileId } = await addRecentPlay({
          filePath: filePath,
          fileName: fileName,
          duration: 0,
          currentTime: 0,
          subtitleFile: '',
          subtitleItems: [],
          videoPlaybackSettings: {
            displayMode: 'bilingual',
            volume: 1,
            playbackRate: 1,
            isSingleLoop: false,
            isAutoPause: false
          }
        })
        if (success && fileId) {
          console.log('🎬 添加最近播放记录成功:', fileId)
          // 现在用正确的 fileId 设置视频文件
          playingVideoContext.setVideoFile(fileId, url, fileName, filePath)
        } else {
          console.error('❌ 添加最近播放记录失败')
          return false
        }
      }

      console.log('🎬 导航前检查 playingVideoContext 状态:', {
        videoFile: playingVideoContext.videoFile,
        originalFilePath: playingVideoContext.originalFilePath,
        videoFileName: playingVideoContext.videoFileName
      })

      onNavigateToPlay()
      return result.success
    } finally {
      // 无论成功失败都清除 loading 状态 / Clear loading state regardless of success or failure
      setIsSelectingFile(false)
    }
  }, [
    selectVideoFile,
    playingVideoContext,
    videoControls.resetVideoState,
    addRecentPlay,
    onNavigateToPlay
  ])

  // 处理打开项目
  const handleOpenResouce = useCallback(
    async (item: RecentPlayItem) => {
      console.log('🎬 开始处理视频:', item)

      // 诊断音频兼容性问题
      const audioIssues = diagnoseAudioIssues(item.fileName)
      if (audioIssues.length > 0) {
        console.warn('🔍 检测到潜在的音频兼容性问题:')
        audioIssues.forEach((issue) => console.warn(issue))

        // 如果是MKV文件且可能有音频问题，显示警告
        if (item.fileName.toLowerCase().endsWith('.mkv')) {
          message.warning({
            content: 'MKV 文件可能存在音频兼容性问题，如果没有声音请查看控制台建议',
            duration: 5
          })
        }
      }

      try {
        // 检查文件是否存在
        console.log('🔍 检查文件是否存在:', item.filePath)
        const exists = await window.api.fileSystem.checkFileExists(item.filePath)
        console.log('📁 文件存在检查结果:', exists)
        if (!exists) {
          // 文件不存在，询问是否从列表中移除
          Modal.confirm({
            title: '文件不存在',
            content: `文件 "${item.fileName}" 不存在，是否从最近播放列表中移除？`,
            okText: '移除',
            cancelText: '取消',
            onOk: () => {
              removeRecentPlay(item.fileId)
            }
          })
          return false
        }

        console.log('🎬 准备设置视频文件:', {
          fileId: item.fileId,
          filePath: item.filePath,
          fileName: item.fileName,
          currentTime: item.currentTime
        })

        // 将文件路径转换为 URL
        const fileUrl = await window.api.fileSystem.getFileUrl(item.filePath)
        if (!fileUrl) {
          console.error('❌ 无法获取视频文件 URL:', item.filePath)
          return false
        }

        console.log('🔗 生成的视频文件 URL:', fileUrl)

        // 设置视频文件
        playingVideoContext.setVideoFile(item.fileId, fileUrl, item.fileName, item.filePath)

        // 如果有保存的播放时间，恢复播放位置
        if (item.currentTime && item.currentTime > 0) {
          console.log('⏰ HomePage 恢复播放进度:', item.currentTime)
          videoControls.restoreVideoState(item.currentTime, 1, 0.8)
        }

        await updateRecentPlay(item.fileId, {
          lastOpenedAt: Date.now()
        })

        onNavigateToPlay()
        return true
      } catch (error) {
        console.error('打开最近文件失败:', error)
        return false
      }
    },
    [playingVideoContext, onNavigateToPlay, removeRecentPlay, videoControls, updateRecentPlay]
  )

  // 处理移除最近文件
  const handleRemoveResouce = useCallback(
    async (id: string) => {
      await removeRecentPlay(id)
    },
    [removeRecentPlay]
  )

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedFileId, setSelectedFileId] = useState('')
  const [selectedFileName, setSelectedFileName] = useState('')

  // 添加清空确认弹窗状态 / Add clear confirmation modal state
  const [isClearModalOpen, setIsClearModalOpen] = useState(false)

  // 处理清空最近文件列表 - 显示确认弹窗 / Handle clear recent files - show confirmation modal
  const handleClearResouces = useCallback(() => {
    setIsClearModalOpen(true)
  }, [])

  // 确认清空操作 / Confirm clear operation
  const handleConfirmClear = useCallback(async () => {
    await clearRecentPlays()
    setIsClearModalOpen(false)
  }, [clearRecentPlays])

  const handleRemove = (): void => {
    handleRemoveResouce(selectedFileId)
    setIsModalOpen(false)
    setSelectedFileId('')
    setSelectedFileName('')
  }

  const showDeleteConfirm = (id: string, fileName: string): void => {
    setSelectedFileId(id)
    setSelectedFileName(fileName)
    setIsModalOpen(true)
  }

  return (
    <div style={styles.pageContainer}>
      {/* 主要内容区域 */}
      <div
        style={{
          maxWidth: 1400,
          margin: '0 auto',
          paddingBottom: token.paddingXL, // 添加底部间距
          minHeight: 'calc(100vh - 60px)' // 改为最小高度而不是固定高度
        }}
      >
        {/* 最近观看区域 - 移除固定高度限制 */}
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: token.marginLG,
              padding: `0 ${token.paddingXS}px`
            }}
          >
            <Title level={3} style={{ ...styles.sectionTitle, margin: 0 }}>
              最近观看
              <div
                style={{
                  background: utils.hexToRgba(token.colorPrimary, 0.1),
                  color: token.colorPrimary,
                  padding: `${token.paddingXXS}px ${token.paddingXS}px`,
                  borderRadius: token.borderRadius,
                  fontSize: token.fontSizeSM,
                  fontWeight: FONT_WEIGHTS.SEMIBOLD,
                  marginLeft: token.marginSM
                }}
              >
                {recentPlays.length}
              </div>
            </Title>

            <div>
              {recentPlays.length > 0 && (
                <Button
                  type="text"
                  size="small"
                  onClick={handleClearResouces}
                  style={{
                    color: token.colorTextTertiary,
                    fontWeight: FONT_WEIGHTS.MEDIUM,
                    borderRadius: token.borderRadius
                  }}
                >
                  清空
                </Button>
              )}
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleVideoFileSelect}
                loading={isSelectingFile}
                disabled={isSelectingFile}
                style={{ marginLeft: token.marginXS, borderRadius: token.borderRadiusLG }}
              >
                {isSelectingFile ? '选择视频中...' : '添加视频'}
              </Button>
            </div>
          </div>

          {recentPlays.length === 0 ? (
            <EmptyState onAddVideo={handleVideoFileSelect} isSelectingFile={isSelectingFile} />
          ) : (
            // 卡片网格 - 移除内部滚动，让内容自然流动 / Card grid - remove internal scrolling, let content flow naturally
            <div style={{ paddingBottom: token.paddingXL }}>
              <VideoGrid
                recentPlays={recentPlays}
                isCompactMode={isCompactMode}
                onOpenVideo={handleOpenResouce}
                onDeleteVideo={showDeleteConfirm}
              />
            </div>
          )}
        </div>
      </div>

      {/* 确认模态框组件 / Confirmation modals component */}
      <ConfirmModals
        isDeleteModalOpen={isModalOpen}
        selectedFileName={selectedFileName}
        onDeleteCancel={() => setIsModalOpen(false)}
        onDeleteConfirm={handleRemove}
        isClearModalOpen={isClearModalOpen}
        recentPlaysCount={recentPlays.length}
        onClearCancel={() => setIsClearModalOpen(false)}
        onClearConfirm={handleConfirmClear}
      />

      <style
        dangerouslySetInnerHTML={{
          __html: `
          .ant-card:hover .play-overlay,
          .ant-card:hover .delete-button {
            opacity: 1 !important;
          }
        `
        }}
      />
    </div>
  )
}
