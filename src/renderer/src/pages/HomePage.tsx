import React, { useCallback, useState } from 'react'
import { Button, Typography, Card, Tooltip, Row, Col, Modal, message, Space } from 'antd'
import {
  VideoCameraOutlined,
  PlayCircleOutlined,
  PlusOutlined,
  DeleteOutlined
} from '@ant-design/icons'
import { useRecentPlayList } from '@renderer/hooks/useRecentPlayList'
import { usePlayingVideoContext } from '@renderer/hooks/usePlayingVideoContext'
import { useVideoControls } from '@renderer/hooks/useVideoPlayerHooks'
import { useVideoFileSelection } from '@renderer/hooks/useVideoFileSelection'
import { formatTime } from '@renderer/utils/helpers'
import { diagnoseAudioIssues } from '@renderer/utils/videoCompatibility'
import type { RecentPlayItem } from '@renderer/types'
import { useTheme } from '@renderer/hooks/useTheme'
import { useThemeCustomization } from '@renderer/hooks/useThemeCustomization'
import { FONT_WEIGHTS } from '@renderer/styles/theme'

const { Title, Text } = Typography

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
            <div
              style={{
                ...styles.emptyContainer,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: token.paddingXL,
                minHeight: '400px' // 给空状态一个合适的最小高度
              }}
            >
              <div
                style={{
                  fontSize: 64,
                  marginBottom: token.marginLG,
                  opacity: 0.6
                }}
              >
                📺
              </div>
              <Title
                level={4}
                style={{
                  color: token.colorText,
                  fontWeight: FONT_WEIGHTS.SEMIBOLD,
                  marginBottom: token.marginSM
                }}
              >
                还没有观看过任何视频
              </Title>
              <Text
                style={{
                  color: token.colorTextDescription,
                  fontSize: token.fontSize,
                  marginBottom: token.marginLG
                }}
              >
                点击下方按钮添加您的第一个视频
              </Text>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleVideoFileSelect}
                loading={isSelectingFile}
                disabled={isSelectingFile}
                style={{ borderRadius: token.borderRadiusLG }}
              >
                {isSelectingFile ? '选择视频中...' : '立即添加'}
              </Button>
            </div>
          ) : (
            // 卡片网格 - 移除内部滚动，让内容自然流动
            <div style={{ paddingBottom: token.paddingXL }}>
              <Row gutter={[token.paddingSM, token.paddingSM]}>
                {recentPlays.slice(0, 12).map((item) => (
                  <Col
                    xs={isCompactMode ? 12 : 24}
                    sm={isCompactMode ? 4 : 8}
                    md={isCompactMode ? 4 : 8}
                    lg={isCompactMode ? 4 : 8}
                    xl={isCompactMode ? 4 : 8}
                    key={item.fileId}
                  >
                    <div
                      onClick={() => {
                        console.log('卡片被点击了！', item.fileName)
                        handleOpenResouce(item)
                      }}
                      style={{
                        cursor: 'pointer',
                        transition: `all ${token.motionDurationMid} ${token.motionEaseInOut}`,
                        transformOrigin: 'center bottom'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)'
                        e.currentTarget.style.boxShadow = styles.cardHover.boxShadow as string
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0) scale(1)'
                        e.currentTarget.style.boxShadow = styles.cardContainer.boxShadow as string
                      }}
                    >
                      <Card
                        size="small"
                        style={{
                          ...styles.cardContainer,
                          border: 'none',
                          overflow: 'hidden',
                          height: isCompactMode ? 'auto' : '100%',
                          minHeight: isCompactMode ? 200 : 280,
                          display: 'flex',
                          flexDirection: 'column'
                        }}
                        bodyStyle={{
                          padding: isCompactMode ? token.paddingXS : token.paddingSM,
                          flex: 1,
                          display: 'flex',
                          flexDirection: 'column'
                        }}
                        cover={
                          <div
                            style={{
                              ...styles.videoPoster,
                              height: isCompactMode ? 120 : 180, // 紧凑模式120px，默认模式180px
                              position: 'relative'
                            }}
                          >
                            <div
                              style={{
                                width: '100%',
                                height: '100%',
                                background: utils.generatePosterBackground(item.fileName),
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                position: 'relative'
                              }}
                            >
                              <VideoCameraOutlined
                                style={{
                                  fontSize: isCompactMode ? 32 : 48,
                                  color: utils.hexToRgba('#fff', 0.8)
                                }}
                              />

                              {/* 播放覆盖层 */}
                              <div style={styles.playOverlay} className="play-overlay">
                                <PlayCircleOutlined
                                  style={{
                                    fontSize: isCompactMode ? 40 : 56,
                                    color: '#fff'
                                  }}
                                />
                              </div>

                              {/* 删除按钮 */}
                              <div
                                style={{
                                  position: 'absolute',
                                  top: token.paddingXS,
                                  right: token.paddingXS,
                                  opacity: 0,
                                  transition: `opacity ${token.motionDurationMid} ease`
                                }}
                                className="delete-button"
                              >
                                <Tooltip title="删除">
                                  <Button
                                    type="text"
                                    size="small"
                                    icon={<DeleteOutlined />}
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      showDeleteConfirm(item.fileId, item.fileName)
                                    }}
                                    style={{
                                      ...styles.deleteButton,
                                      width: isCompactMode ? 24 : 32,
                                      height: isCompactMode ? 24 : 32,
                                      fontSize: isCompactMode ? 12 : 14
                                    }}
                                  />
                                </Tooltip>
                              </div>

                              {/* 时长标签 */}
                              {item.duration && (
                                <div
                                  style={{
                                    ...styles.durationBadge,
                                    fontSize: isCompactMode ? token.fontSizeSM : token.fontSize,
                                    padding: isCompactMode
                                      ? `${token.paddingXXS}px ${token.paddingXS}px`
                                      : `${token.paddingXS}px ${token.paddingSM}px`
                                  }}
                                >
                                  {formatTime(item.duration)}
                                </div>
                              )}

                              {/* 进度条 */}
                              {item.duration && item.duration > 0 && (
                                <div
                                  style={{
                                    position: 'absolute',
                                    bottom: 0,
                                    left: 0,
                                    right: 0,
                                    height: isCompactMode ? 2 : 3,
                                    background: utils.hexToRgba('#fff', 0.2)
                                  }}
                                >
                                  <div
                                    style={{
                                      height: '100%',
                                      width: `${Math.min(100, Math.max(0, ((item.currentTime || 0) / item.duration) * 100))}%`,
                                      background: `linear-gradient(90deg, ${token.colorPrimary}, ${token.colorSuccess})`,
                                      borderRadius: `0 ${token.borderRadiusSM}px ${token.borderRadiusSM}px 0`,
                                      transition: 'width 0.3s ease'
                                    }}
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        }
                      >
                        <div
                          style={{
                            padding: isCompactMode ? 0 : `${token.paddingXS}px 0`,
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between'
                          }}
                        >
                          <div>
                            <Tooltip title={item.fileName}>
                              <Text
                                strong
                                ellipsis
                                style={{
                                  display: 'block',
                                  fontSize: isCompactMode ? token.fontSizeSM : token.fontSize,
                                  fontWeight: FONT_WEIGHTS.SEMIBOLD,
                                  color: token.colorText,
                                  marginBottom: isCompactMode ? token.marginXXS : token.marginXS,
                                  lineHeight: 1.3
                                }}
                              >
                                {item.fileName.replace(/\.[^/.]+$/, '')}
                              </Text>
                            </Tooltip>

                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                fontSize: token.fontSizeSM,
                                marginBottom: isCompactMode ? token.marginXS : token.marginSM
                              }}
                            >
                              <Text
                                style={{
                                  fontSize: token.fontSizeSM,
                                  color: token.colorTextDescription
                                }}
                              >
                                {utils.formatTimeAgo(item.lastOpenedAt)}
                              </Text>
                              {item.duration && item.duration > 0 && (
                                <Text
                                  style={{
                                    fontSize: token.fontSizeSM,
                                    color: token.colorPrimary,
                                    fontWeight: FONT_WEIGHTS.MEDIUM,
                                    background: isCompactMode
                                      ? 'transparent'
                                      : utils.hexToRgba(token.colorPrimary, 0.1),
                                    padding: isCompactMode
                                      ? 0
                                      : `${token.paddingXXS}px ${token.paddingXS}px`,
                                    borderRadius: isCompactMode ? 0 : token.borderRadius
                                  }}
                                >
                                  {Math.round(((item.currentTime || 0) / item.duration) * 100)}%
                                </Text>
                              )}
                            </div>
                          </div>

                          {/* 默认模式显示操作区域 */}
                          {!isCompactMode && (
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                              }}
                            >
                              <Space size="small">
                                {item.duration && item.duration > 0 ? (
                                  <Text
                                    style={{
                                      fontSize: token.fontSizeSM,
                                      color: token.colorTextSecondary
                                    }}
                                  >
                                    {formatTime(item.currentTime || 0)} /{' '}
                                    {formatTime(item.duration)}
                                  </Text>
                                ) : (
                                  <Text
                                    style={{
                                      fontSize: token.fontSizeSM,
                                      color: token.colorTextTertiary
                                    }}
                                  >
                                    未知时长
                                  </Text>
                                )}
                              </Space>
                              <Button
                                type="text"
                                size="small"
                                style={{
                                  color: token.colorPrimary,
                                  fontWeight: FONT_WEIGHTS.MEDIUM,
                                  height: 24,
                                  fontSize: token.fontSizeSM
                                }}
                              >
                                继续观看
                              </Button>
                            </div>
                          )}
                        </div>
                      </Card>
                    </div>
                  </Col>
                ))}
              </Row>
            </div>
          )}
        </div>
      </div>

      {/* 删除确认模态框 */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: token.marginSM }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: utils.hexToRgba(token.colorError, 0.1),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <DeleteOutlined style={{ color: token.colorError, fontSize: token.fontSize }} />
            </div>
            <span style={{ fontSize: token.fontSize, fontWeight: FONT_WEIGHTS.SEMIBOLD }}>
              确认删除
            </span>
          </div>
        }
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={handleRemove}
        okText="删除"
        cancelText="取消"
        okType="danger"
        centered
        width={480}
        style={{
          borderRadius: token.borderRadiusLG,
          overflow: 'hidden'
        }}
        styles={{
          content: {
            borderRadius: token.borderRadiusLG,
            background: styles.glassEffect.background,
            backdropFilter: styles.glassEffect.backdropFilter,
            WebkitBackdropFilter: styles.glassEffect.WebkitBackdropFilter,
            border: `1px solid ${token.colorBorderSecondary}`
          }
        }}
      >
        <div style={{ padding: `${token.paddingSM}px 0` }}>
          <p
            style={{
              fontSize: token.fontSize,
              color: token.colorText,
              margin: `0 0 ${token.marginSM}px 0`,
              lineHeight: 1.5
            }}
          >
            确定要删除视频{' '}
            <strong
              style={{
                color: token.colorPrimary,
                background: utils.hexToRgba(token.colorPrimary, 0.1),
                padding: `${token.paddingXXS}px ${token.paddingXS}px`,
                borderRadius: token.borderRadius,
                fontWeight: FONT_WEIGHTS.SEMIBOLD
              }}
            >
              &ldquo;{selectedFileName}&rdquo;
            </strong>{' '}
            的观看记录吗？
          </p>
          <div
            style={{
              background: utils.hexToRgba(token.colorWarning, 0.08),
              border: `1px solid ${utils.hexToRgba(token.colorWarning, 0.2)}`,
              borderRadius: token.borderRadius,
              padding: token.paddingXS
            }}
          >
            <p
              style={{
                fontSize: token.fontSizeSM,
                color: token.colorTextSecondary,
                margin: 0,
                lineHeight: 1.4
              }}
            >
              此操作将删除该视频的观看进度等所有相关数据，且无法恢复。
            </p>
          </div>
        </div>
      </Modal>

      {/* 清空确认模态框 / Clear confirmation modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: token.marginSM }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: utils.hexToRgba(token.colorWarning, 0.1),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <DeleteOutlined style={{ color: token.colorWarning, fontSize: token.fontSize }} />
            </div>
            <span style={{ fontSize: token.fontSize, fontWeight: FONT_WEIGHTS.SEMIBOLD }}>
              确认清空
            </span>
          </div>
        }
        open={isClearModalOpen}
        onCancel={() => setIsClearModalOpen(false)}
        onOk={handleConfirmClear}
        okText="清空"
        cancelText="取消"
        okType="danger"
        centered
        width={480}
        style={{
          borderRadius: token.borderRadiusLG,
          overflow: 'hidden'
        }}
        styles={{
          content: {
            borderRadius: token.borderRadiusLG,
            background: styles.glassEffect.background,
            backdropFilter: styles.glassEffect.backdropFilter,
            WebkitBackdropFilter: styles.glassEffect.WebkitBackdropFilter,
            border: `1px solid ${token.colorBorderSecondary}`
          }
        }}
      >
        <div style={{ padding: `${token.paddingSM}px 0` }}>
          <p
            style={{
              fontSize: token.fontSize,
              color: token.colorText,
              margin: `0 0 ${token.marginSM}px 0`,
              lineHeight: 1.5
            }}
          >
            确定要清空所有最近观看记录吗？
          </p>
          <div
            style={{
              background: utils.hexToRgba(token.colorError, 0.08),
              border: `1px solid ${utils.hexToRgba(token.colorError, 0.2)}`,
              borderRadius: token.borderRadius,
              padding: token.paddingXS
            }}
          >
            <p
              style={{
                fontSize: token.fontSizeSM,
                color: token.colorTextSecondary,
                margin: 0,
                lineHeight: 1.4
              }}
            >
              此操作将删除所有视频的观看记录（共 {recentPlays.length}{' '}
              个项目），包括观看进度等所有相关数据，且无法恢复。
            </p>
          </div>
        </div>
      </Modal>

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
