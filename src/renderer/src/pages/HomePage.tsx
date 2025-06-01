import React, { useCallback, useState } from 'react'
import { Button, Typography, Card, Tooltip, Tag, Row, Col, Empty, Modal, message } from 'antd'
import {
  VideoCameraOutlined,
  PlayCircleOutlined,
  ClockCircleOutlined,
  StarOutlined,
  PlusOutlined,
  DeleteOutlined
} from '@ant-design/icons'
import { useRecentPlayList } from '@renderer/hooks/useRecentPlayList'
import { usePlayingVideoContext } from '@renderer/hooks/usePlayingVideoContext'
import { useVideoControls } from '@renderer/hooks/useVideoPlayerHooks'
import { formatTime } from '@renderer/utils/helpers'
import { diagnoseAudioIssues } from '@renderer/utils/videoCompatibility'
import type { RecentPlayItem } from '@renderer/types'
import styles from './HomePage.module.css'

const { Title, Text } = Typography

interface HomePageProps {
  onNavigateToPlay: () => void
}

// 推荐视频假数据
const recommendedVideos = [
  {
    id: '1',
    title: 'English Conversation Practice',
    duration: 1800,
    poster: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=300&h=400&fit=crop',
    category: '英语学习'
  },
  {
    id: '2',
    title: 'JavaScript Advanced Concepts',
    duration: 2400,
    poster: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=300&h=400&fit=crop',
    category: '编程教程'
  },
  {
    id: '3',
    title: 'French Pronunciation Guide',
    duration: 1200,
    poster: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=400&fit=crop',
    category: '法语学习'
  },
  {
    id: '4',
    title: 'React Hooks Tutorial',
    duration: 3600,
    poster: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=300&h=400&fit=crop',
    category: '前端开发'
  }
]

export function HomePage({ onNavigateToPlay }: HomePageProps): React.JSX.Element {
  // 使用自定义 Hooks
  const videoControls = useVideoControls()
  const { recentPlays, removeRecentPlay, clearRecentPlays, addRecentPlay } = useRecentPlayList()
  const playingVideoContext = usePlayingVideoContext()

  // 处理视频文件选择(首次打开)
  const handleVideoFileSelect = useCallback(async (): Promise<boolean> => {
    const result = await playingVideoContext.handleVideoFileSelect(videoControls.resetVideoState)
    if (!result.success) {
      console.error('❌ 无法选择视频文件')
      return false
    }

    // 文件选择成功后，handleVideoFileSelect 已经通过 setVideoFile 设置了视频文件
    // 现在我们需要添加到最近播放记录
    const { filePath, fileName } = result

    console.log('🎬 文件选择成功:', { filePath, fileName })
    if (filePath && fileName) {
      // 更新最近播放记录
      await addRecentPlay({
        filePath: filePath,
        fileName: fileName,
        duration: 0,
        currentTime: 0,
        subtitleFile: '',
        subtitleItems: []
      })
    }

    console.log('🎬 导航前检查 playingVideoContext 状态:', {
      videoFile: playingVideoContext.videoFile,
      originalFilePath: playingVideoContext.originalFilePath,
      videoFileName: playingVideoContext.videoFileName
    })

    onNavigateToPlay()
    return result.success
  }, [playingVideoContext, videoControls.resetVideoState, addRecentPlay, onNavigateToPlay])

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
              removeRecentPlay(item.id)
            }
          })
          return false
        }

        console.log('🎬 准备设置视频文件:', {
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
        playingVideoContext.setVideoFile(fileUrl, item.fileName, item.filePath)

        // 如果有保存的播放时间，恢复播放位置
        if (item.currentTime && item.currentTime > 0) {
          console.log('⏰ HomePage 恢复播放进度:', item.currentTime)
          videoControls.restoreVideoState(item.currentTime, 1, 0.8)
        }

        // 更新最近播放记录的最后打开时间，但保持原有的播放进度和字幕数据
        await addRecentPlay({
          filePath: item.filePath,
          fileName: item.fileName,
          duration: item.duration,
          currentTime: item.currentTime, // 保持原有的播放进度
          subtitleFile: item.subtitleFile,
          subtitleItems: item.subtitleItems // 保持原有的字幕数据
        })

        onNavigateToPlay()
        return true
      } catch (error) {
        console.error('打开最近文件失败:', error)
        return false
      }
    },
    [playingVideoContext, addRecentPlay, onNavigateToPlay, removeRecentPlay, videoControls]
  )

  // 处理移除最近文件
  const handleRemoveResouce = useCallback(
    async (id: string) => {
      await removeRecentPlay(id)
    },
    [removeRecentPlay]
  )

  // 处理清空最近文件列表
  const handleClearResouces = useCallback(async () => {
    await clearRecentPlays()
  }, [clearRecentPlays])

  // 格式化最后打开时间
  const formatLastOpened = (timestamp: number): string => {
    const now = Date.now()
    const diff = now - timestamp
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (minutes < 1) return '刚刚'
    if (minutes < 60) return `${minutes}分钟前`
    if (hours < 24) return `${hours}小时前`
    if (days < 7) return `${days}天前`
    return new Date(timestamp).toLocaleDateString()
  }

  // 生成视频海报占位符
  const generatePosterPlaceholder = (fileName: string): string => {
    const colors = [
      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)'
    ]
    const index = fileName.length % colors.length
    return colors[index]
  }

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedFileId, setSelectedFileId] = useState('')
  const [selectedFileName, setSelectedFileName] = useState('')

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
    <div className={styles.homePageContainer}>
      {/* 顶部欢迎区域 */}
      <div className={styles.welcomeSection}>
        <div className={styles.welcomeContent}>
          <Title level={1} className={styles.welcomeTitle}>
            我的视频库
          </Title>
          <Text className={styles.welcomeSubtitle}>发现、学习、成长 - 您的个人视频学习中心</Text>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Button
            type="primary"
            size="large"
            icon={<PlusOutlined />}
            onClick={handleVideoFileSelect}
            className={styles.addVideoButton}
          >
            <span>添加视频</span>
          </Button>
        </div>
      </div>

      <div className={styles.mainContent}>
        {/* 最近视频区域 */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <Title level={2} className={styles.sectionTitle}>
              <ClockCircleOutlined className={styles.titleIcon} />
              最近观看
            </Title>
            {recentPlays.length > 0 && (
              <Button
                type="text"
                size="small"
                onClick={handleClearResouces}
                className={styles.clearButton}
              >
                清空列表
              </Button>
            )}
          </div>

          {recentPlays.length === 0 ? (
            <Empty
              image={<VideoCameraOutlined className={styles.emptyIcon} />}
              description={
                <div className={styles.emptyDescription}>
                  <Text>还没有观看过任何视频</Text>
                  <br />
                  <Text type="secondary">点击上方按钮添加您的第一个视频</Text>
                </div>
              }
            />
          ) : (
            <Row gutter={[24, 24]} className={styles.videoGrid}>
              {recentPlays.slice(0, 8).map((item) => (
                <Col xs={12} sm={8} md={6} lg={4} xl={4} key={item.id}>
                  <div
                    onClick={() => {
                      console.log('卡片被点击了！', item.fileName)
                      handleOpenResouce(item)
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    <Card
                      className={styles.videoCard}
                      hoverable
                      cover={
                        <div className={styles.videoPoster}>
                          <div
                            className={styles.posterPlaceholder}
                            style={{ background: generatePosterPlaceholder(item.fileName) }}
                          >
                            <VideoCameraOutlined className={styles.posterIcon} />
                          </div>
                          <div className={styles.playOverlay}>
                            <PlayCircleOutlined className={styles.playIcon} />
                          </div>
                          <div className={styles.deleteButton}>
                            <Tooltip title="删除记录">
                              <Button
                                type="text"
                                size="small"
                                icon={<DeleteOutlined />}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  showDeleteConfirm(item.id, item.fileName)
                                }}
                                className={styles.deleteIcon}
                              />
                            </Tooltip>
                          </div>
                          {item.duration && (
                            <div className={styles.durationBadge}>{formatTime(item.duration)}</div>
                          )}
                        </div>
                      }
                    >
                      <div className={styles.videoInfo}>
                        <Tooltip title={item.fileName}>
                          <Text strong ellipsis className={styles.videoTitle}>
                            {item.fileName.replace(/\.[^/.]+$/, '')}
                          </Text>
                        </Tooltip>
                        <Text type="secondary" className={styles.lastWatched}>
                          {formatLastOpened(item.lastOpenedAt)}
                        </Text>
                      </div>
                    </Card>
                  </div>
                </Col>
              ))}
            </Row>
          )}
        </div>

        {/* 推荐视频区域 */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <Title level={2} className={styles.sectionTitle}>
              <StarOutlined className={styles.titleIcon} />
              推荐视频
            </Title>
          </div>

          <Row gutter={[24, 24]} className={styles.videoGrid}>
            {recommendedVideos.map((video) => (
              <Col xs={12} sm={8} md={6} lg={4} xl={4} key={video.id}>
                <Card
                  className={styles.videoCard}
                  hoverable
                  cover={
                    <div className={styles.videoPoster}>
                      <img
                        src={video.poster}
                        alt={video.title}
                        className={styles.posterImage}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.style.display = 'none'
                          const placeholder = target.nextElementSibling as HTMLElement
                          if (placeholder) {
                            placeholder.style.display = 'flex'
                          }
                        }}
                      />
                      <div
                        className={styles.posterPlaceholder}
                        style={{
                          background: generatePosterPlaceholder(video.title),
                          display: 'none'
                        }}
                      >
                        <VideoCameraOutlined className={styles.posterIcon} />
                      </div>
                      <div className={styles.playOverlay}>
                        <PlayCircleOutlined className={styles.playIcon} />
                      </div>
                      <div className={styles.durationBadge}>{formatTime(video.duration)}</div>
                      <div className={styles.categoryBadge}>
                        <Tag color="blue">{video.category}</Tag>
                      </div>
                    </div>
                  }
                >
                  <div className={styles.videoInfo}>
                    <Tooltip title={video.title}>
                      <Text strong ellipsis className={styles.videoTitle}>
                        {video.title}
                      </Text>
                    </Tooltip>
                    <Text type="secondary" className={styles.videoCategory}>
                      推荐内容
                    </Text>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      </div>

      <Modal
        title={
          <div className={styles.modalTitle}>
            <DeleteOutlined className={styles.modalTitleIcon} />
            确认删除
          </div>
        }
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={handleRemove}
        okText="删除"
        cancelText="取消"
        okType="danger"
        className="delete-modal"
        centered
        width={480}
      >
        <div className={styles.modalContent}>
          <p className={styles.confirmText}>
            确定要删除视频{' '}
            <strong className={styles.fileName}>&ldquo;{selectedFileName}&rdquo;</strong>{' '}
            的观看记录吗？
          </p>
          <div className={styles.warningBox}>
            <p className={styles.warningText}>
              此操作将删除该视频的观看进度等所有相关数据，且无法恢复。
            </p>
          </div>
        </div>
      </Modal>
    </div>
  )
}
