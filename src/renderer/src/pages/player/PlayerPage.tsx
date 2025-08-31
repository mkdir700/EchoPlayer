import { loggerService } from '@logger'
import { Navbar, NavbarCenter, NavbarLeft } from '@renderer/components/app/Navbar'
import db from '@renderer/databases'
import { VideoLibraryService } from '@renderer/services'
import { usePlayerSessionStore } from '@renderer/state/stores/player-session.store'
import { Splitter, Tooltip } from 'antd'
import { ArrowLeft } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'

import { NavbarIcon } from '.'
import { ControllerPanel, SettingsPopover, SubtitleListPanel, VideoSurface } from './components'
import { PlayerPageProvider } from './state/player-page.provider'

const logger = loggerService.withContext('PlayerPage')

interface VideoData {
  id: number
  title: string
  src: string
  duration: number
}

/**
 * Player page component that loads a video by ID from the route and renders the video player UI.
 *
 * This component:
 * - Reads the `id` route parameter and loads the corresponding video record and file from the database.
 * - Constructs a file:// URL as the video source, stores per-page VideoData in local state and synchronizes it to the global per-video session store.
 * - Renders a top navbar with a back button and title, a two-pane Splitter layout with the video surface and controls on the left and a subtitle list on the right, and a settings popover.
 * - Shows a centered loading view while fetching data and an error view with a back button if loading fails or the video is missing.
 * - Cleans up the per-video session state on unmount.
 *
 * Side effects:
 * - Performs async data fetches from the VideoLibraryService and the app database.
 * - Updates a global player session store with the loaded VideoData and clears it when the component unmounts.
 *
 * Error handling:
 * - Loading or playback errors set local error state and cause the component to render the error view.
 *
 * Note: This is a React component (returns JSX) and does not accept props; it derives the target video ID from route params.
 */
function PlayerPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const videoId = Number(id)
  const [splitterSizes, setSplitterSizes] = useState<[number, number]>([70, 30])
  const { t } = useTranslation()

  const [videoData, setVideoData] = useState<VideoData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // const { pokeInteraction } = usePlayerUI()

  // 加载视频数据并绑定 per-video 配置
  useEffect(() => {
    const loadData = async () => {
      if (!id) {
        setError('无效的视频 ID')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        const recordId = parseInt(id, 10)
        if (isNaN(recordId)) {
          throw new Error('无效的视频 ID')
        }

        const videoLibService = new VideoLibraryService()
        const record = await videoLibService.getRecordById(recordId)
        if (!record) throw new Error('视频不存在')

        const file = await db.files.getFile(record.fileId)
        if (!file) throw new Error('关联文件不存在')

        logger.info(`从数据库加载视频文件:`, { file })

        // 将 path 转为 file:// URL
        const fileUrl = new URL(`file://${file.path}`).href

        // 构造页面所需的视频数据
        const vd = {
          id: record.id!,
          title: file.origin_name || file.name,
          src: fileUrl,
          duration: record.duration
        } as const
        setVideoData(vd)
        // 同步到全局会话 store，供任意组件访问
        usePlayerSessionStore.getState().setVideo(vd)

        // per-video 编排已迁移至 PlayerPageProvider
      } catch (err) {
        logger.error(`加载视频数据失败: ${err}`)
        setError(err instanceof Error ? err.message : '加载失败')
      } finally {
        setLoading(false)
      }
    }

    loadData()
    return () => {
      // 页面卸载时清理会话态
      usePlayerSessionStore.getState().clear()
    }
  }, [id])

  const handleVideoError = (errorMessage: string) => {
    setError(errorMessage)
  }

  // 处理 Splitter 尺寸变化（仅在尺寸实际变化时更新，避免无效重复渲染）
  const handleSplitterResize = useCallback((sizes: number[]) => {
    if (sizes.length >= 2) {
      const next: [number, number] = [sizes[0], sizes[1]]
      setSplitterSizes((prev) => (prev[0] === next[0] && prev[1] === next[1] ? prev : next))
    }
  }, [])

  if (loading) {
    return (
      <Container>
        <LoadingContainer>
          <LoadingText>加载中...</LoadingText>
        </LoadingContainer>
      </Container>
    )
  }

  if (error) {
    return (
      <Container>
        <ErrorContainer>
          <ErrorText>{error}</ErrorText>
          <BackButton onClick={() => navigate(-1)}>返回</BackButton>
        </ErrorContainer>
      </Container>
    )
  }

  if (!videoData || videoId === undefined) {
    return (
      <Container>
        <ErrorContainer>
          <ErrorText>视频数据不存在</ErrorText>
          <BackButton onClick={() => navigate(-1)}>返回</BackButton>
        </ErrorContainer>
      </Container>
    )
  }

  return (
    <PlayerPageProvider videoId={videoId}>
      <Container>
        <Navbar>
          <NavbarLeft>
            <Tooltip title={t('common.return')} mouseEnterDelay={0.8}>
              <NavbarIcon style={{ marginLeft: 10 }} onClick={() => navigate(-1)}>
                <ArrowLeft size={18} />
              </NavbarIcon>
            </Tooltip>
          </NavbarLeft>
          <NavbarCenter>
            <NavTitle title={videoData.title}>{videoData.title}</NavTitle>
          </NavbarCenter>
        </Navbar>
        <ContentContainer id="content-container">
          <ContentBody>
            <MainArea>
              <Splitter
                layout="horizontal"
                onResize={handleSplitterResize}
                style={{ height: '100%' }}
              >
                <Splitter.Panel defaultSize={`${splitterSizes[0]}%`} min="40%" max="80%">
                  <LeftMain>
                    <VideoStage>
                      <VideoSurface src={videoData.src} onError={handleVideoError} />
                      {/* <SubtitleOverlay /> */}
                    </VideoStage>
                    <BottomBar>
                      <ControllerPanel />
                    </BottomBar>
                  </LeftMain>
                </Splitter.Panel>
                <Splitter.Panel defaultSize={`${splitterSizes[1]}%`} min="20%" max="60%">
                  <RightSidebar>
                    <SubtitleListPanel />
                  </RightSidebar>
                </Splitter.Panel>
              </Splitter>
            </MainArea>
          </ContentBody>
          <SettingsPopover />
        </ContentContainer>
      </Container>
    </PlayerPageProvider>
  )
}

// PlayerPage.whyDidYouRender = true

export default PlayerPage

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
  overflow-y: auto;
  height: 100%;
  min-height: 0;
`

const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
`

const LoadingText = styled.div`
  font-size: 16px;
  color: var(--color-text-2, #bbb);
`

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  gap: 16px;
`

const ErrorText = styled.div`
  font-size: 16px;
  color: var(--color-error, #ff4d4f);
  text-align: center;
`

const BackButton = styled.button`
  background: var(--color-primary, #1677ff);
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 8px 16px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background: var(--color-primary-hover, #0958d9);
  }
  &:active {
    background: var(--color-primary-active, #003eb3);
  }
`

const NavTitle = styled.div`
  margin-left: 8px;
  font-size: 13px;
  color: var(--color-text-1, #ddd);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

const MainArea = styled.div`
  display: flex;
  height: calc(100vh - var(--navbar-height, 48px));
  min-height: 0;
  box-sizing: border-box;
  overflow: hidden;

  /* Splitter 组件会处理布局 */
  .ant-splitter {
    width: 100%;
    height: 100%;
  }

  /* 小屏幕时的单列布局样式 */
  &.small-screen {
    flex-direction: column;
    height: auto;
  }
`

const LeftMain = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
`

const VideoStage = styled.div`
  position: relative;
  width: 100%;
  flex: 1;
  min-height: 0;
  border-radius: var(--panel-radius, 12px) 0 0 0;
  background: #000;
  overflow: hidden;
`

const RightSidebar = styled.aside`
  height: 100%;
  display: flex;
  flex-direction: column;
  min-width: 0;
  background: var(--panel-sidebar-bg, rgba(28, 28, 30, 0.85));
  backdrop-filter: blur(18px) saturate(160%);
  -webkit-backdrop-filter: blur(18px) saturate(160%);
  border-left: 1px solid var(--color-border-soft);
  overflow: hidden;

  @media (max-width: 900px) {
    background: transparent;
    border-left: none;
    padding-left: 0;
    margin-top: 12px;
  }

  [theme-mode='light'] & {
    background: rgba(255, 255, 255, 0.85);
    border-left: 1px solid var(--color-border);
  }
`

const BottomBar = styled.div`
  flex: 0 0 auto;
  padding: 0;
`
