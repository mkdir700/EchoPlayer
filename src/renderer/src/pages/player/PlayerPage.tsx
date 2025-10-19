import { loggerService } from '@logger'
import { Navbar, NavbarCenter, NavbarLeft, NavbarRight } from '@renderer/components/app/Navbar'
import db from '@renderer/databases'
import {
  CodecCompatibilityChecker,
  type ExtendedErrorType,
  SessionError,
  SessionService,
  VideoLibraryService
} from '@renderer/services'
import { PlayerSettingsService } from '@renderer/services/PlayerSettingsLoader'
import { playerSettingsPersistenceService } from '@renderer/services/PlayerSettingsSaver'
import { usePlayerStore } from '@renderer/state'
import { usePlayerSessionStore } from '@renderer/state/stores/player-session.store'
import { usePlayerUIStore } from '@renderer/state/stores/player-ui.store'
import { IpcChannel } from '@shared/IpcChannel'
import { Layout, Tooltip } from 'antd'

const { Content, Sider } = Layout
import { MediaServerRecommendationPrompt } from '@renderer/components/MediaServerRecommendationPrompt'
import {
  ANIMATION_DURATION,
  COMPONENT_TOKENS,
  EASING,
  FONT_SIZES,
  SPACING
} from '@renderer/infrastructure/styles/theme'
import type { SubtitleStreamsResponse } from '@types'
import { ArrowLeft, PanelRightClose, PanelRightOpen, Search } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'

import { NavbarIcon } from '.'
import {
  ASRProgressModal,
  ASRSubtitlePrompt,
  ControllerPanel,
  PlayerSelector,
  ProgressBar,
  SettingsPopover,
  SubtitleListPanel,
  SubtitleTrackSelector,
  VideoErrorRecovery
} from './components'
import { useASRSubtitle } from './hooks/useASRSubtitle'
import { disposeGlobalOrchestrator } from './hooks/usePlayerEngine'
import { PlayerPageProvider } from './state/player-page.provider'

const logger = loggerService.withContext('PlayerPage')

// 浏览器兼容的文件路径转换函数
function toFileUrl(filePath: string): string {
  if (!filePath) return ''
  if (filePath.startsWith('file://')) return filePath

  // 处理Windows路径
  const normalizedPath = filePath.replace(/\\/g, '/')
  return `file://${normalizedPath.startsWith('/') ? '' : '/'}${normalizedPath}`
}

interface VideoData {
  id: number
  title: string
  src: string
  duration: number
}

/**
 * Render the player page for the video identified by the current route and manage its loading,
 * transcoding session, subtitle detection, and related UI state.
 *
 * Loads the video record and associated file, determines an appropriate playback source (original
 * file or HLS from a transcoding session), synchronizes per-video state with global stores,
 * detects embedded subtitle streams from the original file, and performs cleanup (including
 * deleting any created transcoding session) when the component unmounts.
 *
 * @returns The React element for the player page for the requested video
 */
function PlayerPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()

  // 安全地转换 videoId，避免 NaN 导致的无限循环
  const videoId = useMemo(() => {
    if (!id) return 0
    const parsed = parseInt(id, 10)
    return isNaN(parsed) ? 0 : parsed
  }, [id])

  const { t } = useTranslation()
  const { subtitlePanelVisible, toggleSubtitlePanel } = usePlayerStore()
  const toggleSubtitleSearch = usePlayerUIStore((s) => s.toggleSubtitleSearch)
  const setVideoAreaHovered = usePlayerUIStore((s) => s.setVideoAreaHovered)
  const pokeVideoAreaInteraction = usePlayerUIStore((s) => s.pokeVideoAreaInteraction)

  const [videoData, setVideoData] = useState<VideoData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [videoError, setVideoError] = useState<{
    message: string
    type: ExtendedErrorType
    originalPath?: string
  } | null>(null)
  const [showMediaServerPrompt, setShowMediaServerPrompt] = useState(false)
  const [waitingForSessionReady, setWaitingForSessionReady] = useState(false)
  const [sessionProgress, setSessionProgress] = useState<{
    percent: number
    stage: string
    status: string
  } | null>(null)
  const [subtitleStreams, setSubtitleStreams] = useState<SubtitleStreamsResponse | null>(null)
  const [showSubtitleTrackSelector, setShowSubtitleTrackSelector] = useState(false)
  const [userDismissedEmbeddedSubtitles, setUserDismissedEmbeddedSubtitles] = useState(false)
  // const { pokeInteraction } = usePlayerUI()

  // 保存转码会话 ID 用于清理
  const sessionIdRef = useRef<string | null>(null)
  // 保存原始文件路径用于字幕检测（不是 HLS 播放源）
  const originalFilePathRef = useRef<string | null>(null)

  // ASR subtitle generation
  const {
    asrEnabled,
    showAsrPrompt,
    showAsrProgress,
    asrProgress,
    handleOpenASRGenerator,
    handleGenerateSubtitle,
    handleCancelAsr,
    handleAsrLater
  } = useASRSubtitle(videoId, originalFilePathRef.current)

  // 加载视频数据
  useEffect(() => {
    let cancelled = false
    const pollIntervalMs = 2000

    const waitForSessionReady = async (sessionId: string) => {
      while (!cancelled) {
        try {
          const progress = await SessionService.getSessionProgress(sessionId)
          if (cancelled) {
            break
          }

          setSessionProgress((prev) => {
            const stage = progress.progress_stage?.trim() || prev?.stage || '处理中...'
            const rawPercent =
              typeof progress.progress_percent === 'number'
                ? progress.progress_percent
                : Number(progress.progress_percent)
            const percent = Number.isFinite(rawPercent) ? rawPercent : (prev?.percent ?? 0)
            return {
              percent,
              stage,
              status: progress.status
            }
          })

          if (progress.is_ready) {
            setSessionProgress((prev) => ({
              percent: 100,
              stage: progress.progress_stage?.trim() || prev?.stage || '就绪',
              status: progress.status
            }))
            return progress
          }
        } catch (progressError) {
          if (
            progressError instanceof SessionError &&
            progressError.statusCode &&
            progressError.statusCode === 425
          ) {
            // 会话尚未返回进度，等待下一轮
          } else {
            throw progressError
          }
        }

        if (cancelled) {
          break
        }

        await new Promise((resolve) => setTimeout(resolve, pollIntervalMs))
      }

      throw new Error('会话进度轮询已取消')
    }

    const loadData = async () => {
      setLoading(true)
      setWaitingForSessionReady(false)
      setSessionProgress(null)
      if (!videoId) {
        setError('无效的视频 ID')
        setVideoData(null)
        setLoading(false)
        return
      }

      try {
        setError(null)

        // 清除之前的 HLS 状态，防止旧的转码信息影响新视频加载
        usePlayerStore.getState().resetTranscodeInfo()

        const videoLibService = new VideoLibraryService()
        const record = await videoLibService.getRecordById(videoId)
        if (!record) throw new Error('视频不存在')

        const playerSettings = await PlayerSettingsService.load(videoId)
        if (playerSettings) {
          // 因为 currentTime 和 duration 是存储在 PlayerState 中的，所以需要手动注入
          playerSettings.currentTime = record.currentTime
          playerSettings.duration = record.duration
        }

        const file = await db.files.getFile(record.fileId)
        if (!file) throw new Error('关联文件不存在')

        logger.info(`从数据库加载视频文件:`, { file })

        // 保存原始文件路径用于字幕检测
        originalFilePathRef.current = file.path

        // 将 path 转为 file:// URL (Windows-safe)
        const fileUrl = toFileUrl(file.path)

        // 主动进行编解码器兼容性检测和转码预处理
        let finalSrc = fileUrl

        try {
          logger.info('开始编解码器兼容性检测', { filePath: file.path })

          // 检测编解码器兼容性
          const compatibilityResult = await CodecCompatibilityChecker.checkCompatibility(file.path)

          logger.info('编解码器兼容性检测结果', {
            compatibilityResult,
            filePath: file.path
          })

          // 如果需要转码，在数据加载阶段就进行转码
          if (compatibilityResult.needsTranscode) {
            logger.warn('检测到不兼容编解码器，开始预转码处理', {
              videoCodec: compatibilityResult.detectedCodecs.video,
              audioCodec: compatibilityResult.detectedCodecs.audio,
              reasons: compatibilityResult.incompatibilityReasons
            })

            // 检查 Media Server 是否已安装
            try {
              const venvInfo = await window.api.pythonVenv.checkInfo()
              if (!venvInfo.exists) {
                logger.warn('Media Server 未安装，显示推荐安装弹窗')
                setShowMediaServerPrompt(true)
                // 继续使用原始播放源，让用户决定是否安装
                finalSrc = fileUrl
                // 跳过转码流程
                logger.info('跳过转码流程，等待用户安装 Media Server')
              } else {
                // Media Server 已安装，继续转码流程
                // 设置转码状态
                usePlayerStore.getState().setTranscodeStatus('transcoding')
                usePlayerStore.getState().updateTranscodeInfo({
                  originalSrc: fileUrl,
                  error: undefined,
                  startTime: Date.now()
                })

                // 调用会话服务创建播放会话
                const sessionResult = await SessionService.createSession({
                  file_path: file.path,
                  initial_time: record.currentTime || 0
                })

                logger.info('会话创建完成', { sessionResult })

                // 保存会话 ID 用于后续清理
                sessionIdRef.current = sessionResult.session_id
                setWaitingForSessionReady(true)
                setSessionProgress({
                  percent: 0,
                  stage: '正在创建转码会话...',
                  status: 'initializing'
                })

                try {
                  const readyProgress = await waitForSessionReady(sessionResult.session_id)

                  if (cancelled) {
                    return
                  }

                  const fallbackPlaylistUrl = await SessionService.getPlaylistUrl(
                    sessionResult.session_id
                  )
                  let playListUrl = fallbackPlaylistUrl

                  if (readyProgress.playlist_url) {
                    try {
                      playListUrl = new URL(
                        readyProgress.playlist_url,
                        fallbackPlaylistUrl
                      ).toString()
                    } catch (urlError) {
                      logger.warn('解析会话进度返回的播放列表 URL 失败，将使用默认值', {
                        sessionId: sessionResult.session_id,
                        playlistUrl: readyProgress.playlist_url,
                        error: urlError instanceof Error ? urlError.message : String(urlError)
                      })
                      playListUrl = fallbackPlaylistUrl
                    }
                  }

                  // 更新转码信息和播放源
                  usePlayerStore.getState().updateTranscodeInfo({
                    hlsSrc: playListUrl,
                    windowId: 0, // 会话模式不再使用 windowId
                    assetHash: sessionResult.asset_hash,
                    profileHash: sessionResult.profile_hash,
                    cached: false, // 会话模式由后端管理缓存
                    sessionId: sessionResult.session_id,
                    endTime: Date.now()
                  })

                  // 切换到 HLS 播放模式
                  usePlayerStore.getState().switchToHlsSource(playListUrl, {
                    windowId: 0,
                    assetHash: sessionResult.asset_hash,
                    profileHash: sessionResult.profile_hash,
                    cached: false,
                    sessionId: sessionResult.session_id
                  })
                  if (!cancelled) {
                    usePlayerStore.getState().setTranscodeStatus('completed')
                  }

                  finalSrc = playListUrl

                  logger.info('预转码流程完成，使用 HLS 播放源', {
                    originalSrc: fileUrl,
                    hlsSrc: finalSrc
                  })
                } catch (progressError) {
                  if (!cancelled) {
                    const message =
                      progressError instanceof Error ? progressError.message : '获取会话进度失败'
                    logger.error('会话进度轮询失败，转码流程终止', {
                      error: message,
                      sessionId: sessionResult.session_id
                    })
                    setError(message || '获取会话进度失败')
                    usePlayerStore.getState().setTranscodeStatus('failed')
                  }
                  return
                }
              }
            } catch (checkError) {
              logger.error('检查 Media Server 状态失败，显示推荐安装弹窗', {
                error: checkError instanceof Error ? checkError.message : String(checkError)
              })
              setShowMediaServerPrompt(true)
              finalSrc = fileUrl
            }
          } else {
            logger.info('编解码器兼容，使用原始播放源', { filePath: file.path })
          }
        } catch (transcodeError) {
          logger.error('预转码处理失败，回退到原始播放源', {
            error:
              transcodeError instanceof Error ? transcodeError.message : String(transcodeError),
            filePath: file.path
          })

          // 转码失败时更新状态但不阻止播放
          usePlayerStore.getState().setTranscodeStatus('failed')
          usePlayerStore.getState().updateTranscodeInfo({
            error:
              transcodeError instanceof Error ? transcodeError.message : String(transcodeError),
            endTime: Date.now()
          })

          // 继续使用原始播放源
          finalSrc = fileUrl
        }

        // 构造页面所需的视频数据（使用处理后的播放源）
        const vd = {
          id: record.id!,
          title: file.origin_name || file.name,
          src: finalSrc,
          duration: record.duration
        } as const
        if (!cancelled) setVideoData(vd)
        // 同步到全局会话 store，供任意组件访问
        if (!cancelled) usePlayerSessionStore.getState().setVideo(vd)
        // 注入播放器设置
        if (playerSettings) {
          usePlayerStore.getState().loadSettings(playerSettings)
        }
        // 监听设置和视频进度变化
        playerSettingsPersistenceService.attach(videoId)
        logger.info('已加载视频数据:', { vd, playerSettings })
      } catch (err) {
        logger.error(`加载视频数据失败: ${err}`)
        setError(err instanceof Error ? err.message : '加载失败')
      } finally {
        if (!cancelled) {
          setWaitingForSessionReady(false)
          setLoading(false)
        }
      }
    }

    loadData()
    return () => {
      cancelled = true
      // 页面卸载时清理会话态
      usePlayerSessionStore.getState().clear()
      playerSettingsPersistenceService.detach()

      // 清理 HLS 转码状态，确保下次加载视频时不会受到影响
      usePlayerStore.getState().resetTranscodeInfo()

      // 清理转码会话资源
      const currentSessionId = sessionIdRef.current
      if (currentSessionId) {
        SessionService.deleteSession(currentSessionId)
          .then(() => {
            logger.debug('转码会话已清理', { sessionId: currentSessionId })
          })
          .catch((error) => {
            logger.error('清理转码会话时出错:', { error, sessionId: currentSessionId })
          })
          .finally(() => {
            sessionIdRef.current = null
          })
      }

      // 清理播放器编排器资源
      try {
        disposeGlobalOrchestrator()
        logger.debug('播放器编排器已清理')
      } catch (error) {
        logger.error('清理播放器编排器时出错:', { error })
      }
    }
  }, [videoId])

  const handleVideoError = useCallback(
    (errorMessage: string, errorType?: ExtendedErrorType) => {
      logger.error('视频播放错误', { errorMessage, errorType, videoId })
      setVideoError({
        message: errorMessage,
        type: errorType || 'unknown',
        originalPath: videoData?.src
          ? decodeURIComponent(videoData.src.replace('file://', ''))
          : undefined
      })
    },
    [videoId, videoData?.src]
  )

  const handleFileRelocate = useCallback(
    async (newPath: string) => {
      if (!videoData) return

      try {
        logger.info('开始重新定位视频文件', { videoId, newPath })

        // 1. 获取视频记录以获得文件ID
        const videoLibService = new VideoLibraryService()
        const record = await videoLibService.getRecordById(videoId)
        if (!record) {
          throw new Error('视频记录不存在')
        }

        // 2. 更新数据库中的文件路径
        const updatedFile = await db.files.updateFile(record.fileId, { path: newPath })
        if (!updatedFile) {
          throw new Error('更新文件路径失败')
        }

        // 3. 更新本地状态
        const newFileUrl = toFileUrl(newPath)
        const updatedVideoData = {
          ...videoData,
          src: newFileUrl
        }

        setVideoData(updatedVideoData)
        setVideoError(null) // 清除错误状态

        logger.info('视频文件路径已成功更新到数据库', {
          videoId,
          fileId: record.fileId,
          oldPath: updatedFile.path !== newPath ? '已更新' : '未知',
          newPath,
          newFileUrl
        })
      } catch (error) {
        logger.error('重新定位视频文件时出错', { error })
        // 可以考虑向用户显示错误提示
      }
    },
    [videoData, videoId]
  )

  const handleRemoveFromLibrary = useCallback(async () => {
    try {
      logger.info('从媒体库中移除视频', { videoId })

      // 调用数据库服务删除记录
      const videoLibService = new VideoLibraryService()
      await videoLibService.deleteRecord(videoId)

      // 返回首页
      navigate('/')
    } catch (error) {
      logger.error('从媒体库移除视频时出错', { error })
    }
  }, [videoId, navigate])

  // 处理全屏快捷键
  const handleToggleFullscreen = useCallback(async () => {
    try {
      await window.electron.ipcRenderer.invoke(IpcChannel.Window_ToggleFullScreen)
    } catch (error) {
      logger.error('切换全屏失败:', { error })
    }
  }, [])

  // 处理视频区域悬停
  const handleVideoAreaEnter = useCallback(() => {
    setVideoAreaHovered(true)
  }, [setVideoAreaHovered])

  const handleVideoAreaLeave = useCallback(() => {
    setVideoAreaHovered(false)
  }, [setVideoAreaHovered])

  const handleVideoAreaMove = useCallback(() => {
    pokeVideoAreaInteraction()
  }, [pokeVideoAreaInteraction])

  // 检测字幕轨道
  useEffect(() => {
    if (!videoData || !originalFilePathRef.current || userDismissedEmbeddedSubtitles) {
      return
    }

    const detectSubtitleStreams = async () => {
      try {
        // 使用原始文件路径检测字幕，而不是 HLS 播放源
        const detectionPath = originalFilePathRef.current
        logger.info('🔍 开始检测字幕轨道', {
          detectionPath,
          playSource: videoData.src
        })

        const result = await window.electron.ipcRenderer.invoke(
          IpcChannel.Media_GetSubtitleStreams,
          detectionPath
        )

        if (result && result.streams && result.streams.length > 0) {
          logger.info('✅ 检测到字幕轨道', {
            total: result.streams.length,
            text: result.textStreams?.length || 0,
            image: result.imageStreams?.length || 0
          })

          setSubtitleStreams(result)
        } else {
          logger.info('📄 此视频文件不含字幕轨道', {
            path: detectionPath,
            videoId
          })
        }
      } catch (error) {
        logger.warn('检测字幕轨道失败', {
          error: error instanceof Error ? error.message : String(error)
        })
      }
    }

    detectSubtitleStreams()
  }, [videoData, userDismissedEmbeddedSubtitles, showMediaServerPrompt, videoId])

  // 键盘事件处理
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // 如果焦点在输入框等表单元素上，不处理快捷键
      const target = event.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return
      }

      // F键切换全屏
      if (event.code === 'KeyF' && !event.ctrlKey && !event.altKey && !event.metaKey) {
        event.preventDefault()
        handleToggleFullscreen()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleToggleFullscreen])

  if (loading) {
    const progressPercent = Math.max(0, Math.min(100, Math.round(sessionProgress?.percent ?? 0)))

    return (
      <Container>
        <LoadingContainer>
          {waitingForSessionReady ? (
            <>
              <ProgressStageText>
                {sessionProgress?.stage || '正在创建转码会话...'}
              </ProgressStageText>
              <DeterminateBarTrack>
                <DeterminateBarFill $percent={progressPercent} />
              </DeterminateBarTrack>
              <ProgressPercentText>{progressPercent}%</ProgressPercentText>
            </>
          ) : (
            <>
              <LoadingText>加载中...</LoadingText>
              <LoadingBarContainer>
                <LoadingBarProgress />
              </LoadingBarContainer>
            </>
          )}
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

  if (!videoData) {
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
          <NavbarRight>
            <Tooltip title={t('player.subtitles.search')} mouseEnterDelay={0.8}>
              <NavbarIcon onClick={toggleSubtitleSearch}>
                <Search size={18} />
              </NavbarIcon>
            </Tooltip>
            <Tooltip
              title={subtitlePanelVisible ? t('player.subtitles.hide') : t('player.subtitles.show')}
              mouseEnterDelay={0.8}
            >
              <NavbarIcon onClick={toggleSubtitlePanel}>
                {subtitlePanelVisible ? (
                  <PanelRightClose size={18} />
                ) : (
                  <PanelRightOpen size={18} />
                )}
              </NavbarIcon>
            </Tooltip>
          </NavbarRight>
        </Navbar>
        <ContentContainer id="content-container">
          <ContentBody>
            <MainArea>
              <Layout style={{ height: '100%' }}>
                <Content>
                  <LeftMain>
                    <VideoInteractionArea
                      onMouseEnter={handleVideoAreaEnter}
                      onMouseLeave={handleVideoAreaLeave}
                      onMouseMove={handleVideoAreaMove}
                    >
                      <VideoStage>
                        <PlayerSelector src={videoData.src} onError={handleVideoError} />
                      </VideoStage>
                      <ProgressBarArea>
                        <ProgressBar />
                      </ProgressBarArea>
                    </VideoInteractionArea>
                    <BottomBar>
                      <ControllerPanel />
                    </BottomBar>
                  </LeftMain>
                </Content>
                <Sider
                  width="30%"
                  collapsedWidth={0}
                  collapsed={!subtitlePanelVisible}
                  trigger={null}
                  collapsible={false}
                  style={{
                    background: 'transparent',
                    overflow: 'hidden',
                    flexShrink: 0
                  }}
                >
                  <RightSidebar>
                    <SubtitleListPanel
                      hasEmbeddedSubtitles={
                        subtitleStreams !== null && subtitleStreams.streams.length > 0
                      }
                      onOpenEmbeddedSubtitleSelector={() => setShowSubtitleTrackSelector(true)}
                      asrEnabled={asrEnabled}
                      onOpenASRGenerator={handleOpenASRGenerator}
                    />
                  </RightSidebar>
                </Sider>
              </Layout>
            </MainArea>
          </ContentBody>
          <SettingsPopover />
        </ContentContainer>

        {/* 错误恢复 Modal */}
        <VideoErrorRecovery
          open={!!videoError}
          onClose={() => setVideoError(null)}
          videoId={videoId}
          videoTitle={videoData.title}
          originalPath={videoError?.originalPath}
          errorType={videoError?.type || 'unknown'}
          onFileRelocate={handleFileRelocate}
          onRemoveFromLibrary={handleRemoveFromLibrary}
        />

        {/* Media Server 推荐安装弹窗 */}
        <MediaServerRecommendationPrompt
          open={showMediaServerPrompt}
          onClose={() => setShowMediaServerPrompt(false)}
        />

        {/* 字幕轨道选择对话框 */}
        <SubtitleTrackSelector
          visible={showSubtitleTrackSelector}
          streams={subtitleStreams}
          originalFilePath={originalFilePathRef.current || undefined}
          onClose={() => setShowSubtitleTrackSelector(false)}
          onImported={() => setShowSubtitleTrackSelector(false)}
          onDismiss={() => setUserDismissedEmbeddedSubtitles(true)}
        />

        {/* ASR 字幕生成提示弹窗 */}
        <ASRSubtitlePrompt
          open={showAsrPrompt}
          onGenerate={handleGenerateSubtitle}
          onLater={handleAsrLater}
          estimatedMinutes={5}
        />

        {/* ASR 字幕生成进度弹窗 */}
        <ASRProgressModal
          open={showAsrProgress}
          progress={asrProgress}
          onCancel={handleCancelAsr}
        />
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
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  gap: 16px;
`

const LoadingText = styled.div`
  font-size: 16px;
  color: var(--color-text-2, #bbb);
`

const LoadingBarContainer = styled.div`
  width: 240px;
  height: 4px;
  background: var(--ant-color-fill-quaternary, rgba(255, 255, 255, 0.08));
  border-radius: 2px;
  overflow: hidden;
  position: relative;
`

const LoadingBarProgress = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 40%;
  background: var(--ant-color-primary, #1677ff);
  border-radius: 2px;
  animation: loadingSlide 1.5s ease-in-out infinite;

  @keyframes loadingSlide {
    0% {
      transform: translateX(-100%);
    }
    50% {
      transform: translateX(250%);
    }
    100% {
      transform: translateX(-100%);
    }
  }
`

const DETERMINATE_BAR_WIDTH = SPACING.XXL * 5

const DeterminateBarTrack = styled.div`
  width: ${DETERMINATE_BAR_WIDTH}px;
  height: ${COMPONENT_TOKENS.PROGRESS_BAR.TRACK_HEIGHT_HOVER}px;
  background: var(--ant-color-fill-quaternary, rgba(255, 255, 255, 0.08));
  border-radius: ${COMPONENT_TOKENS.PROGRESS_BAR.TRACK_BORDER_RADIUS}px;
  overflow: hidden;
`

const DeterminateBarFill = styled.div<{ $percent: number }>`
  height: 100%;
  width: ${({ $percent }) => `${$percent}%`};
  background: var(--ant-color-primary, #1677ff);
  border-radius: ${COMPONENT_TOKENS.PROGRESS_BAR.TRACK_BORDER_RADIUS}px;
  transition: width ${ANIMATION_DURATION.SLOW} ${EASING.STANDARD};
`

const ProgressStageText = styled.div`
  font-size: ${FONT_SIZES.BASE}px;
  color: var(--color-text-1, #ddd);
  text-align: center;
`

const ProgressPercentText = styled.div`
  font-size: ${FONT_SIZES.SM}px;
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

  /* Antd Layout 组件样式 */
  .ant-layout {
    background: transparent;
  }

  .ant-layout-content {
    background: transparent;
    overflow: hidden;
  }

  .ant-layout-sider {
    background: transparent !important;
    transition: all 0.2s ease-in-out;
  }

  .ant-layout-sider-collapsed {
    min-width: 0 !important;
    max-width: 0 !important;
    width: 0 !important;
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

const VideoInteractionArea = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
`

const VideoStage = styled.div`
  position: relative;
  width: 100%;
  flex: 1;
  min-height: 0;
  border-radius: 0;
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

const ProgressBarArea = styled.div`
  flex: 0 0 auto;
  background: transparent;
  position: relative;
`

const BottomBar = styled.div`
  flex: 0 0 auto;
`
