import { loggerService } from '@logger'
import FFmpegDownloadPrompt from '@renderer/components/FFmpegDownloadPrompt'
import HomePageVideoService, { type HomePageVideoItem } from '@renderer/services/HomePageVideos'
import { VideoLibraryService } from '@renderer/services/VideoLibrary'
import { useSettingsStore } from '@renderer/state/stores/settings.store'
import { useVideoListStore } from '@renderer/state/stores/video-list.store'
import { message, Modal, Tooltip } from 'antd'
import { AnimatePresence, motion } from 'framer-motion'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'

import DeleteButton from './DeleteButton'
import EmptyState from './EmptyState'
import HeaderNavbar from './HeaderNavbar'
import LoadingState from './LoadingState'
import ThumbnailWithFallback from './ThumbnailWithFallback'

const logger = loggerService.withContext('HomePage')

// Helper function to format date (用于卡片元信息显示)
const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date)
}

// 优化的卡片动画配置 - 减少复杂度
const cardVariants = {
  hidden: {
    y: 15,
    opacity: 0,
    scale: 0.98
  },
  visible: {
    y: 0,
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: 'easeOut' as const,
      delay: 0.02
    }
  }
}

// 优化的过渡动画配置 - 避免 layout 动画，使用 transform
const viewModeTransition = {
  duration: 0.2,
  ease: 'easeOut' as const
}

// 视图模式切换动画变体
const gridVariants = {
  initial: { opacity: 0, scale: 0.95, y: 10 },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: viewModeTransition
  },
  exit: {
    opacity: 0,
    scale: 1.05,
    y: -10,
    transition: { ...viewModeTransition, duration: 0.15 }
  }
}

export function HomePage(): React.JSX.Element {
  const { t } = useTranslation()
  const { videoListViewMode, setVideoListViewMode } = useSettingsStore()
  const {
    refreshTrigger,
    isLoading,
    isInitialized,
    cachedVideos,
    setLoading,
    setInitialized,
    setCachedVideos
  } = useVideoListStore()

  const [videos, setVideos] = React.useState<HomePageVideoItem[]>([])
  const [showFFmpegPrompt, setShowFFmpegPrompt] = React.useState(false)
  const navigate = useNavigate()

  // 初始化时使用缓存数据
  React.useEffect(() => {
    if (isInitialized && cachedVideos.length > 0 && videos.length === 0) {
      logger.info('HomePage 使用缓存数据初始化', { cachedCount: cachedVideos.length })
      setVideos(cachedVideos)
    }
  }, [isInitialized, cachedVideos, videos.length])

  const loadVideos = React.useCallback(async () => {
    try {
      setLoading(true)
      const svc = new HomePageVideoService()
      const items = await svc.getHomePageVideos(50)
      setVideos(items)
      setCachedVideos(items)

      // 标记为已初始化
      if (!isInitialized) {
        setInitialized(true)
      }
    } catch (error) {
      logger.error('加载视频列表失败', { error })
    } finally {
      setLoading(false)
    }
  }, [setLoading, isInitialized, setInitialized, setCachedVideos])

  // 监听刷新触发器变化
  React.useEffect(() => {
    // 如果已经初始化且不是刷新触发（refreshTrigger = 0），则跳过加载
    if (isInitialized && refreshTrigger === 0) {
      logger.info('HomePage 跳过重复数据加载，已在 App.tsx 中预加载', {
        isInitialized,
        refreshTrigger
      })
      return
    }

    loadVideos()
  }, [loadVideos, refreshTrigger, isInitialized])

  const handleVideoAdded = React.useCallback(() => {
    loadVideos()
  }, [loadVideos])

  const handleShowFFmpegPrompt = React.useCallback((show: boolean) => {
    setShowFFmpegPrompt(show)
  }, [])

  const handleCloseFFmpegPrompt = React.useCallback(() => {
    setShowFFmpegPrompt(false)
  }, [])

  // 删除视频记录
  const handleDeleteVideo = React.useCallback(
    async (video: HomePageVideoItem) => {
      Modal.confirm({
        title: t('home.delete.confirm_title'),
        centered: true,
        content: (
          <div>
            <p
              dangerouslySetInnerHTML={{
                __html: t('home.delete.confirm_content', { title: video.title })
              }}
            />
            <p style={{ color: 'var(--color-status-warning)', fontSize: '14px', marginTop: '8px' }}>
              ⚠️ {t('home.delete.confirm_warning')}
            </p>
          </div>
        ),
        okText: t('home.delete.button_ok'),
        cancelText: t('home.delete.button_cancel'),
        okType: 'danger',
        onOk: async () => {
          try {
            const videoLibraryService = new VideoLibraryService()
            await videoLibraryService.deleteRecord(video.id)

            // 从本地状态中移除该视频
            setVideos((prev) => prev.filter((v) => v.id !== video.id))

            // 同步更新store缓存，确保UI状态一致
            setCachedVideos(cachedVideos.filter((v) => v.id !== video.id))

            message.success(t('home.delete.success_message'))
          } catch (error) {
            logger.error('删除视频记录失败', { error })
            message.error(t('home.delete.error_message'))
          }
        }
      })
    },
    [t, setCachedVideos, cachedVideos]
  )

  return (
    <Container>
      <HeaderNavbar
        videoListViewMode={videoListViewMode}
        setVideoListViewMode={setVideoListViewMode}
        onShowFFmpegPrompt={handleShowFFmpegPrompt}
      />
      <ContentContainer id="content-container">
        <ContentBody>
          {isLoading && !isInitialized ? (
            <LoadingState />
          ) : videos.length === 0 ? (
            <EmptyState
              onVideoAdded={handleVideoAdded}
              onShowFFmpegPrompt={handleShowFFmpegPrompt}
            />
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={videoListViewMode}
                variants={gridVariants}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                <VideoGrid $viewMode={videoListViewMode}>
                  {videos.map((video: HomePageVideoItem, index: number) => (
                    <VideoCard
                      key={video.id}
                      variants={cardVariants}
                      initial="hidden"
                      animate="visible"
                      custom={index}
                      $viewMode={videoListViewMode}
                    >
                      <CardContent
                        $viewMode={videoListViewMode}
                        onClick={() => navigate(`/player/${video.id}`)}
                      >
                        <ThumbnailContainer $viewMode={videoListViewMode}>
                          <ThumbnailWithFallback src={video.thumbnail} alt={video.title} />
                          <ThumbnailOverlay>
                            <Duration>{video.durationText}</Duration>
                            <TopRightActions>
                              <DeleteButton onClick={() => handleDeleteVideo(video)} />
                            </TopRightActions>
                          </ThumbnailOverlay>
                          <ProgressBarContainer>
                            <MotionProgressBar
                              progress={video.watchProgress}
                              initial={{ width: 0 }}
                              animate={{ width: `${video.watchProgress * 100}%` }}
                              transition={{
                                duration: 1.2,
                                delay: index * 0.1 + 0.5,
                                ease: [0.25, 0.46, 0.45, 0.94]
                              }}
                            />
                          </ProgressBarContainer>
                        </ThumbnailContainer>

                        <VideoInfo $viewMode={videoListViewMode}>
                          <VideoContent
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                              duration: 0.5,
                              delay: index * 0.1 + 0.3,
                              ease: [0.25, 0.46, 0.45, 0.94]
                            }}
                          >
                            <VideoTitleTooltip
                              title={video.title}
                              mouseEnterDelay={0.6}
                              placement="top"
                              getPopupContainer={() => document.body}
                            >
                              <VideoTitle>{video.title}</VideoTitle>
                            </VideoTitleTooltip>
                            <VideoMeta>
                              {video.subtitle && (
                                <MetaRow>
                                  <VideoSubtitle>{video.subtitle}</VideoSubtitle>
                                </MetaRow>
                              )}
                              <MetaRow>
                                <MetaText>{formatDate(video.createdAt)}</MetaText>
                                <MetaText>{video.publishedAt}</MetaText>
                              </MetaRow>
                            </VideoMeta>
                          </VideoContent>
                        </VideoInfo>
                      </CardContent>
                    </VideoCard>
                  ))}
                </VideoGrid>
              </motion.div>
            </AnimatePresence>
          )}
        </ContentBody>
      </ContentContainer>

      {/* FFmpeg下载引导对话框 */}
      <FFmpegDownloadPrompt open={showFFmpegPrompt} onClose={handleCloseFFmpegPrompt} />
    </Container>
  )
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100%;
`

const ContentContainer = styled.div`
  display: flex;
  flex: 1;
  flex-direction: row;
  height: 100vh;
`

const ContentBody = styled.div`
  flex: 1;
  padding: 24px 32px 48px 32px;
  overflow-y: auto;
  height: 100%;
  min-height: 0;
`

const VideoGrid = styled.div<{ $viewMode: 'grid' | 'list' }>`
  display: grid;
  /* 默认：中屏 3 列 */
  grid-template-columns: ${(props) => (props.$viewMode === 'list' ? '1fr' : 'repeat(3, 1fr)')};
  gap: ${(props) => (props.$viewMode === 'list' ? '16px' : '24px')};
  will-change: transform;
  transform: translateZ(0); /* 强制 GPU 加速 */

  /* 小屏：≤900px → 2 列 */
  @media (max-width: 900px) {
    grid-template-columns: ${(props) => (props.$viewMode === 'list' ? '1fr' : 'repeat(2, 1fr)')};
  }

  /* 大屏：≥1025px → 4 列 */
  @media (min-width: 1025px) {
    grid-template-columns: ${(props) => (props.$viewMode === 'list' ? '1fr' : 'repeat(4, 1fr)')};
  }

  /* 超大屏：≥1440px → 6 列（1920 宽标准可见 6 列）*/
  @media (min-width: 1440px) {
    grid-template-columns: ${(props) => (props.$viewMode === 'list' ? '1fr' : 'repeat(6, 1fr)')};
  }
`

const VideoCard = styled(motion.div)<{ $viewMode: 'grid' | 'list' }>`
  --card-scale: 1;
  --card-y: 0px;
  --card-x: 0px;
  --shadow-opacity: 0.08;
  --border-opacity: 1;
  --bg-opacity: 1;

  background: var(--color-background);
  border: 1px solid var(--color-border);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: ${(props) => (props.$viewMode === 'list' ? '12px' : '20px')};
  overflow: hidden;
  cursor: pointer;
  position: relative;
  will-change: transform, box-shadow;
  transform: translateZ(0) scale(var(--card-scale)) translateY(var(--card-y))
    translateX(var(--card-x));
  box-shadow: 0 8px 32px rgba(0, 0, 0, var(--shadow-opacity));
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    --card-scale: ${(props) => (props.$viewMode === 'list' ? '1' : '1.01')};
    --card-y: ${(props) => (props.$viewMode === 'list' ? '0px' : '-2px')};
    --card-x: ${(props) => (props.$viewMode === 'list' ? '4px' : '0px')};
    --shadow-opacity: 0.15;
    --border-opacity: 0.8;
    --bg-opacity: 0.95;
  }

  [theme-mode='dark'] & {
    --shadow-opacity: 0.3;

    &:hover {
      --shadow-opacity: 0.5;
    }
  }
`

// 普通的卡片内容容器 - 不使用 motion
const CardContent = styled.div<{ $viewMode: 'grid' | 'list' }>`
  display: flex;
  flex-direction: ${(props) => (props.$viewMode === 'list' ? 'row' : 'column')};
  height: 100%;
  width: 100%;
  will-change: transform;
  transform: translateZ(0);
`

const ThumbnailOverlay = styled.div`
  --overlay-opacity: 0;

  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 12px;
  opacity: var(--overlay-opacity);
  background: linear-gradient(
    180deg,
    rgba(0, 0, 0, 0.3) 0%,
    transparent 30%,
    transparent 70%,
    rgba(0, 0, 0, 0.4) 100%
  );
  transition: opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  will-change: opacity;
  transform: translateZ(0);

  ${VideoCard}:hover & {
    --overlay-opacity: 1;
  }
`

const TopRightActions = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;

  /* 当父卡片悬停时，显示删除按钮 */
  ${VideoCard}:hover & {
    button {
      --delete-opacity: 1;
      --delete-scale: 1;
    }
  }
`

const ThumbnailContainer = styled.div<{ $viewMode: 'grid' | 'list' }>`
  position: relative;
  width: ${(props) => (props.$viewMode === 'list' ? '240px' : '100%')};
  aspect-ratio: 16/9;
  overflow: hidden;
  border-radius: ${(props) => (props.$viewMode === 'list' ? '11px 0 0 11px' : '19px 19px 0 0')};
  background: var(--color-background-mute);
  flex-shrink: 0;
  will-change: transform;
  transition: all 0.2s ease-out;
`

const Duration = styled.div`
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(10px);
  color: white;
  padding: 6px 10px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif;
  letter-spacing: -0.2px;
  align-self: flex-end;
  margin-top: auto;
  will-change: transform;
`

const ProgressBarContainer = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(10px);
`

const MotionProgressBar = styled(motion.div)<{ progress: number }>`
  height: 100%;
  background: linear-gradient(90deg, #007aff 0%, #5ac8fa 100%);
  position: relative;

  &::after {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    width: 2px;
    background: rgba(255, 255, 255, 0.8);
    border-radius: 1px;
  }
`

const VideoInfo = styled.div<{ $viewMode: 'grid' | 'list' }>`
  padding: ${(props) => (props.$viewMode === 'list' ? '16px 20px' : '20px')};
  background-color: var(--color-background);
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  will-change: transform;
  transform: translateZ(0);
`

// 视频内容容器 - 保留入场动画
const VideoContent = styled(motion.div)`
  will-change: transform, opacity;
  transform: translateZ(0);
`

const VideoTitle = styled.h3`
  font-size: 17px;
  font-weight: 590;
  color: var(--color-text);
  margin: 0 0 12px 0;
  line-height: 1.35;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif;
  letter-spacing: -0.3px;

  &:hover {
    color: var(--color-primary);
  }
`

const VideoTitleTooltip = styled(Tooltip)`
  .video-title-tooltip {
    .ant-tooltip-arrow {
      &::before {
        background: var(--color-background);
        border: 0.5px solid var(--color-border);
      }
    }
    .ant-tooltip-inner {
      color: var(--color-text);
      background: var(--color-background);
      border: 0.5px solid var(--color-border);
      border-radius: 8px;
      padding: 8px 10px;
      box-shadow:
        0 8px 32px rgba(0, 0, 0, 0.16),
        0 2px 8px rgba(0, 0, 0, 0.08);
      max-width: 60vw;
      white-space: normal;
      word-break: break-word;
    }
  }
`

const VideoMeta = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const MetaRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`

const MetaText = styled.div`
  font-size: 13px;
  font-weight: 400;
  color: #8e8e93;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif;
  letter-spacing: -0.1px;
`

const VideoSubtitle = styled.div`
  font-size: 12px;
  font-weight: 400;
  color: var(--color-text-3, #666);
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif;
  letter-spacing: -0.1px;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

export default HomePage
