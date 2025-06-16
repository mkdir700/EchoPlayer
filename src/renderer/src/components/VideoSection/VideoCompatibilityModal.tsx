import React, { useState, useCallback, useEffect } from 'react'
import { Button, Space, Modal, Progress, Typography, Tag, Spin } from 'antd'
import {
  ToolOutlined,
  CheckCircleOutlined,
  DownloadOutlined,
  PlayCircleOutlined,
  FolderOpenOutlined,
  InfoCircleOutlined,
  ExclamationCircleOutlined,
  CloseOutlined
} from '@ant-design/icons'
import { useTheme } from '@renderer/hooks/features/ui/useTheme'
import { ffmpegNativeClient } from '@renderer/utils/ffmpegNativeClient'
import {
  transcodeDecisionHelper,
  TranscodeStrategy,
  type TranscodeDecision,
  type TranscodeExecutionResult
} from '@renderer/utils/transcodeDecision'
import { getDecodedFileName, truncateFileName } from '@renderer/utils/fileHandler'
import RendererLogger from '@renderer/utils/logger'
import {
  SPACING,
  FONT_WEIGHTS,
  BORDER_RADIUS,
  ANIMATION_DURATION,
  EASING
} from '@renderer/styles/theme'

const { Text, Title } = Typography

export interface VideoCompatibilityModalProps {
  /** 是否显示Modal */
  visible: boolean
  /** 视频文件路径 */
  videoFile?: string
  /** 是否全屏模式 */
  isFullscreen?: boolean
  /** 关闭Modal回调 */
  onClose: () => void
  /** 转码完成回调 */
  onTranscodeComplete?: (transcodedFilePath: string) => void
  /** 初始步骤 - 可以跳过分析直接显示特定步骤 */
  initialStep?: ModalStep
  /** 预先分析的结果 - 避免重复分析 */
  initialAnalysisResult?: {
    decision: TranscodeDecision
    recommendation: string
    canExecute: boolean
  }
}

/**
 * Modal steps type / Modal 步骤类型
 */
type ModalStep =
  | 'initial'
  | 'checking-ffmpeg'
  | 'ffmpeg-not-found'
  | 'downloading'
  | 'analyzing'
  | 'decision-ready'
  | 'transcoding'
  | 'completed'
  | 'error'

interface ProgressInfo {
  progress: number
  status: string
  detail?: string
}

export function VideoCompatibilityModal({
  visible,
  videoFile,
  isFullscreen = false,
  onClose,
  onTranscodeComplete,
  initialStep,
  initialAnalysisResult
}: VideoCompatibilityModalProps): React.JSX.Element {
  const { token } = useTheme()

  // 状态管理 / State management
  const [currentStep, setCurrentStep] = useState<ModalStep>(initialStep || 'initial')
  const [transcodeDecision, setTranscodeDecision] = useState<TranscodeDecision | null>(null)
  const [analysisResult, setAnalysisResult] = useState<{
    decision: TranscodeDecision
    recommendation: string
    canExecute: boolean
  } | null>(initialAnalysisResult || null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [transcodedFilePath, setTranscodedFilePath] = useState<string | null>(null)
  const [progressInfo, setProgressInfo] = useState<ProgressInfo>({ progress: 0, status: '' })

  // 苹果风格的样式定义 / Apple-style style definitions
  const modalStyles = {
    modal: {
      borderRadius: token.borderRadiusLG,
      overflow: 'hidden',
      backdropFilter: isFullscreen ? 'blur(20px) saturate(180%)' : 'none',
      WebkitBackdropFilter: isFullscreen ? 'blur(20px) saturate(180%)' : 'none',
      backgroundColor: isFullscreen ? 'rgba(20, 20, 20, 0.95)' : token.colorBgContainer,
      border: isFullscreen
        ? '1px solid rgba(255, 255, 255, 0.1)'
        : `1px solid ${token.colorBorderSecondary}`,
      boxShadow: isFullscreen
        ? `0 8px 32px rgba(0, 0, 0, 0.8)`
        : `0 ${token.boxShadowTertiary?.split(' ')[1] || '16px'} ${token.boxShadowTertiary?.split(' ')[2] || '40px'} rgba(0, 0, 0, 0.12)`
    } as React.CSSProperties,

    container: {
      width: '100%',
      height: '380px', // 固定高度，与"需要下载 FFmpeg 工具"步骤保持一致
      display: 'flex',
      flexDirection: 'column',
      padding: 0
    } as React.CSSProperties,

    header: {
      padding: `${token.paddingMD}px ${token.paddingMD}px ${token.paddingSM}px`,
      borderBottom: `1px solid ${isFullscreen ? 'rgba(255, 255, 255, 0.1)' : token.colorBorderSecondary}`,
      backgroundColor: 'transparent',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    } as React.CSSProperties,

    headerTitle: {
      color: isFullscreen ? 'rgba(255, 255, 255, 0.9)' : token.colorText,
      fontSize: token.fontSize,
      fontWeight: token.fontWeightStrong || FONT_WEIGHTS.SEMIBOLD,
      margin: 0
    } as React.CSSProperties,

    closeButton: {
      border: 'none',
      backgroundColor: 'transparent',
      color: isFullscreen ? 'rgba(255, 255, 255, 0.6)' : token.colorTextTertiary,
      cursor: 'pointer',
      fontSize: '14px', // 从16px减少到14px
      padding: SPACING.XS,
      borderRadius: BORDER_RADIUS.SM,
      transition: `all ${ANIMATION_DURATION.MEDIUM} ${EASING.APPLE}`,
      ':hover': {
        backgroundColor: isFullscreen ? 'rgba(255, 255, 255, 0.1)' : token.colorBgTextHover,
        color: isFullscreen ? 'rgba(255, 255, 255, 0.9)' : token.colorText
      }
    } as React.CSSProperties,

    content: {
      flex: '1 1 auto',
      minHeight: 0,
      padding: `${SPACING.MD}px ${SPACING.MD}px`, // 减少上下padding
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      textAlign: 'center',
      overflow: 'hidden',
      gap: SPACING.SM // 减小间距
    } as React.CSSProperties,

    icon: {
      fontSize: '28px', // 进一步减小图标尺寸
      marginBottom: 0
    } as React.CSSProperties,

    title: {
      color: isFullscreen ? 'rgba(255, 255, 255, 0.9)' : token.colorText,
      fontSize: token.fontSizeLG, // 保持合适的标题大小
      fontWeight: FONT_WEIGHTS.SEMIBOLD,
      marginBottom: 0,
      margin: 0,
      lineHeight: 1.3 // 减小行高
    } as React.CSSProperties,

    description: {
      color: isFullscreen ? 'rgba(255, 255, 255, 0.7)' : token.colorTextSecondary,
      fontSize: token.fontSizeSM,
      marginBottom: 0,
      maxWidth: '400px', // 稍微减小宽度
      lineHeight: 1.4, // 减小行高
      margin: 0
    } as React.CSSProperties,

    progressContainer: {
      width: '100%',
      maxWidth: '400px', // 减小宽度
      marginBottom: 0
    } as React.CSSProperties,

    progressBar: {
      marginBottom: SPACING.XS // 进一步减小间距
    } as React.CSSProperties,

    progressText: {
      color: isFullscreen ? 'rgba(255, 255, 255, 0.7)' : token.colorTextSecondary,
      fontSize: token.fontSizeSM,
      textAlign: 'center'
    } as React.CSSProperties,

    footer: {
      flexShrink: 0,
      minHeight: '50px', // 进一步减小footer高度
      padding: `${SPACING.XS}px ${SPACING.MD}px`, // 最小化上下padding
      borderTop: `1px solid ${isFullscreen ? 'rgba(255, 255, 255, 0.1)' : token.colorBorderSecondary}`,
      display: 'flex',
      justifyContent: 'center', // 直接居中，移除flex-direction: column
      alignItems: 'center'
    } as React.CSSProperties,

    primaryButton: {
      backgroundColor: token.colorPrimary,
      borderColor: token.colorPrimary,
      color: '#ffffff',
      fontWeight: FONT_WEIGHTS.SEMIBOLD,
      borderRadius: BORDER_RADIUS.BASE,
      height: '36px', // 从40px减少到36px
      padding: `0 ${SPACING.MD}px`, // 从SPACING.LG减少到SPACING.MD
      transition: `all ${ANIMATION_DURATION.MEDIUM} ${EASING.APPLE}`
    } as React.CSSProperties,

    secondaryButton: {
      backgroundColor: 'transparent',
      borderColor: isFullscreen ? 'rgba(255, 255, 255, 0.3)' : token.colorBorder,
      color: isFullscreen ? 'rgba(255, 255, 255, 0.8)' : token.colorText,
      fontWeight: FONT_WEIGHTS.MEDIUM,
      borderRadius: BORDER_RADIUS.BASE,
      height: '36px', // 从40px减少到36px
      padding: `0 ${SPACING.MD}px`, // 从SPACING.LG减少到SPACING.MD
      transition: `all ${ANIMATION_DURATION.MEDIUM} ${EASING.APPLE}`
    } as React.CSSProperties,

    tag: {
      borderRadius: BORDER_RADIUS.SM,
      fontWeight: FONT_WEIGHTS.MEDIUM,
      fontSize: token.fontSizeSM
    } as React.CSSProperties
  }

  // 分析视频兼容性 / Analyze video compatibility
  const analyzeVideoCompatibility = useCallback(async () => {
    if (!videoFile) return

    try {
      setCurrentStep('analyzing')
      setErrorMessage(null)
      setProgressInfo({ progress: 0, status: '正在分析视频兼容性...' })

      RendererLogger.info('开始分析视频兼容性', { videoFile })

      // 检查 FFmpeg 是否存在 / Check if FFmpeg exists
      const ffmpegExists = await ffmpegNativeClient.checkExists()
      RendererLogger.info('FFmpeg 存在性检查结果', { ffmpegExists })

      if (!ffmpegExists) {
        setCurrentStep('ffmpeg-not-found')
        return
      }

      setProgressInfo({ progress: 50, status: '正在获取视频信息...' })

      const videoInfo = await ffmpegNativeClient.getVideoInfo(videoFile)
      RendererLogger.info('获取到的原始视频信息', { videoInfo })

      if (!videoInfo) {
        throw new Error('无法获取视频信息，请确认文件格式是否支持')
      }

      setProgressInfo({ progress: 80, status: '正在进行兼容性分析...' })

      // 使用智能转码决策系统分析 / Use intelligent transcoding decision system
      const analysisResult = await transcodeDecisionHelper.analyzeVideo(videoFile)
      RendererLogger.info('转码决策结果', { analysisResult })

      setProgressInfo({ progress: 100, status: '分析完成' })
      setAnalysisResult(analysisResult)
      setTranscodeDecision(analysisResult.decision)

      // 根据决策结果设置对应的步骤 / Set step based on decision result
      if (analysisResult.decision.strategy === TranscodeStrategy.NOT_NEEDED) {
        // 如果视频完全兼容，直接关闭 modal，不显示兼容性步骤 / If video is fully compatible, close modal directly
        RendererLogger.info('视频完全兼容，无需转码，自动关闭 modal')
        onClose()
        return
      } else {
        setCurrentStep('decision-ready')
      }
    } catch (error) {
      RendererLogger.error('分析视频兼容性失败:', { error })
      setErrorMessage(error instanceof Error ? error.message : '未知错误')
      setCurrentStep('error')
    }
  }, [videoFile, onClose])

  // 下载 FFmpeg / Download FFmpeg
  const downloadFFmpeg = useCallback(async () => {
    try {
      setCurrentStep('downloading')
      setProgressInfo({ progress: 0, status: '正在连接下载服务器...' })
      setErrorMessage(null)

      RendererLogger.info('开始下载 FFmpeg...')

      const result = await ffmpegNativeClient.download((progress) => {
        setProgressInfo({
          progress: Math.round(progress),
          status:
            progress < 100 ? `正在下载 FFmpeg... ${Math.round(progress)}%` : '下载完成，正在验证...'
        })
        RendererLogger.debug('下载进度:', progress)
      })

      if (result.success) {
        RendererLogger.info('FFmpeg 下载完成')
        setProgressInfo({ progress: 100, status: '下载完成' })

        // 稍作停留让用户看到100%
        await new Promise((resolve) => setTimeout(resolve, 1000))

        // 继续分析流程
        await analyzeVideoCompatibility()
      } else {
        const errorMsg = result.error || 'FFmpeg 下载失败'
        RendererLogger.error('FFmpeg 下载失败:', errorMsg)
        setErrorMessage(errorMsg)
        setCurrentStep('error')
      }
    } catch (error) {
      RendererLogger.error('下载 FFmpeg 过程中出错:', error)
      setErrorMessage(error instanceof Error ? error.message : '下载过程中出现未知错误')
      setCurrentStep('error')
    }
  }, [analyzeVideoCompatibility])

  // 取消转码 / Cancel transcoding
  const cancelTranscoding = useCallback(async () => {
    if (currentStep === 'transcoding') {
      Modal.confirm({
        title: '确认取消转码',
        content: '转码进度将会丢失，确定要取消当前的转码任务吗？',
        okText: '确认取消',
        cancelText: '继续转码',
        okType: 'danger',
        onOk: async () => {
          RendererLogger.info('用户确认取消转码')

          try {
            // 调用取消转码 API / Call cancel transcoding API
            const success = await ffmpegNativeClient.cancelTranscode()

            if (success) {
              RendererLogger.info('转码取消信号已发送，等待转码进程终止...')
              // 不在这里设置状态，让转码函数的错误处理来处理取消结果
            } else {
              RendererLogger.warn('无法取消转码进程，可能已经完成或没有正在运行的转码任务')
              setCurrentStep('error')
              setErrorMessage('无法取消转码，任务可能已经完成')
            }
          } catch (error) {
            RendererLogger.error('取消转码时出错:', error)
            setCurrentStep('error')
            setErrorMessage('取消转码时发生错误，请检查是否有正在运行的转码任务')
          }
        }
      })
    } else {
      // 非转码状态，直接关闭
      onClose()
    }
  }, [currentStep, onClose])

  // 统一的关闭处理函数 / Unified close handler
  const handleClose = useCallback(() => {
    // 如果正在下载，需要确认
    if (currentStep === 'downloading') {
      Modal.confirm({
        title: '确认取消下载',
        content: '下载进度将会丢失，确定要取消当前的下载任务吗？',
        okText: '确认取消',
        cancelText: '继续下载',
        okType: 'danger',
        onOk: () => {
          RendererLogger.info('用户确认取消下载并关闭Modal')
          onClose()
        }
      })
    } else if (currentStep === 'transcoding') {
      // 如果正在转码，调用专门的取消转码函数
      cancelTranscoding()
    } else {
      // 其他状态直接关闭
      onClose()
    }
  }, [currentStep, onClose, cancelTranscoding])

  // 执行转码 / Execute transcoding
  const executeTranscoding = useCallback(async () => {
    if (!videoFile || !transcodeDecision) return

    try {
      setCurrentStep('transcoding')
      setProgressInfo({ progress: 0, status: '正在准备转码...' })

      RendererLogger.info('开始执行转码决策', {
        strategy: transcodeDecision.strategy,
        estimatedTime: transcodeDecision.estimatedTime
      })

      const result: TranscodeExecutionResult = await transcodeDecisionHelper.executeDecision(
        videoFile,
        transcodeDecision,
        undefined,
        (progress) => {
          setProgressInfo({
            progress: Math.round(progress.progress),
            status: '正在转码...',
            detail: `${progress.time || '00:00:00'} | ${progress.speed || '1x'} | FPS: ${progress.fps || '0'} | 码率: ${progress.bitrate || '0kbps'}`
          })
        }
      )

      if (result.success && result.outputPath) {
        setTranscodedFilePath(result.outputPath)
        setCurrentStep('completed')
        setProgressInfo({
          progress: 100,
          status: '转码完成',
          detail: `用时: ${Math.round((result.executionTime || 0) / 1000)}秒`
        })
        RendererLogger.info('转码完成', {
          outputPath: result.outputPath,
          executionTime: result.executionTime
        })
      } else if (result.cancelled) {
        // 用户取消转码，直接关闭 modal / User cancelled transcoding, close modal directly
        RendererLogger.info('转码已被用户取消，关闭 modal')
        onClose()
        return
      } else {
        setErrorMessage(result.error || '转码失败')
        setCurrentStep('error')
      }
    } catch (error) {
      RendererLogger.error('执行转码失败:', error)
      setErrorMessage(error instanceof Error ? error.message : '转码失败')
      setCurrentStep('error')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoFile, transcodeDecision])

  // 使用转码后的文件 / Use transcoded file
  const useTranscodedFile = useCallback(() => {
    if (transcodedFilePath && onTranscodeComplete) {
      onTranscodeComplete(transcodedFilePath)
    }
    onClose()
  }, [transcodedFilePath, onTranscodeComplete, onClose])

  // 当模态框显示时初始化状态 / Initialize state when modal shows
  useEffect(() => {
    if (visible && videoFile) {
      // 重置状态
      setErrorMessage(null)
      setTranscodedFilePath(null)
      setProgressInfo({ progress: 0, status: '' })

      // 如果有预设的分析结果，直接使用，否则开始分析
      if (initialAnalysisResult && initialStep) {
        RendererLogger.info('使用预设的分析结果，跳过重复分析', {
          initialStep,
          strategy: initialAnalysisResult.decision.strategy
        })
        setCurrentStep(initialStep)
        setAnalysisResult(initialAnalysisResult)
        setTranscodeDecision(initialAnalysisResult.decision)
      } else {
        RendererLogger.info('开始分析视频兼容性')
        setCurrentStep('analyzing')
        setTranscodeDecision(null)
        setAnalysisResult(null)
        analyzeVideoCompatibility()
      }
    }
  }, [visible, videoFile, initialStep, initialAnalysisResult, analyzeVideoCompatibility])

  // 重试操作 / Retry operation
  const retryOperation = useCallback(() => {
    setErrorMessage(null)
    if (videoFile) {
      analyzeVideoCompatibility()
    }
  }, [videoFile, analyzeVideoCompatibility])

  // 获取策略颜色 / Get strategy color
  const getStrategyColor = (strategy: TranscodeStrategy): string => {
    switch (strategy) {
      case TranscodeStrategy.NOT_NEEDED:
        return 'success'
      case TranscodeStrategy.CONTAINER_ONLY:
        return 'blue'
      case TranscodeStrategy.AUDIO_ONLY:
        return 'orange'
      case TranscodeStrategy.VIDEO_ONLY:
        return 'gold'
      case TranscodeStrategy.FULL_TRANSCODE:
        return 'red'
      default:
        return 'default'
    }
  }

  // 渲染不同步骤的内容 / Render content for different steps
  const renderStepContent = (): React.ReactNode => {
    switch (currentStep) {
      case 'analyzing':
        return (
          <>
            <Spin size="large" style={modalStyles.icon} />
            <Title level={4} style={modalStyles.title}>
              分析视频兼容性
            </Title>
            <Text style={modalStyles.description}>
              正在检查视频格式和编码信息，分析是否需要转码处理...
            </Text>
            <div style={modalStyles.progressContainer}>
              <Progress
                percent={progressInfo.progress}
                showInfo={false}
                strokeColor={token.colorPrimary}
                style={modalStyles.progressBar}
              />
              <Text style={modalStyles.progressText}>{progressInfo.status}</Text>
            </div>
          </>
        )

      case 'ffmpeg-not-found':
        return (
          <>
            <DownloadOutlined style={{ ...modalStyles.icon, color: token.colorWarning }} />
            <Title level={4} style={modalStyles.title}>
              需要下载 FFmpeg 工具
            </Title>
            <Text style={modalStyles.description}>
              转码功能需要 FFmpeg 工具支持。下载大小约 30-50MB，仅需下载一次。
            </Text>
          </>
        )

      case 'downloading':
        return (
          <>
            <DownloadOutlined style={{ ...modalStyles.icon, color: token.colorPrimary }} />
            <Title level={4} style={modalStyles.title}>
              下载 FFmpeg 工具
            </Title>
            <Text style={modalStyles.description}>正在下载 FFmpeg 可执行文件，请稍候...</Text>
            <div style={modalStyles.progressContainer}>
              <Progress
                percent={progressInfo.progress}
                showInfo={false}
                strokeColor={token.colorPrimary}
                style={modalStyles.progressBar}
              />
              <Text style={modalStyles.progressText}>{progressInfo.status}</Text>
            </div>
          </>
        )

      case 'decision-ready':
        return (
          <>
            <InfoCircleOutlined style={{ ...modalStyles.icon, color: token.colorPrimary }} />
            <Title level={4} style={modalStyles.title}>
              需要转码处理
            </Title>
            <Text style={modalStyles.description}>
              为获得最佳播放体验，建议对视频进行转码处理。
            </Text>
            {analysisResult && (
              <div style={{ marginTop: SPACING.XS, textAlign: 'center' }}>
                <Tag
                  color={getStrategyColor(analysisResult.decision.strategy)}
                  style={modalStyles.tag}
                >
                  {transcodeDecisionHelper.getStrategyFriendlyName(
                    analysisResult.decision.strategy
                  )}
                </Tag>
                {analysisResult.decision.estimatedTime &&
                  analysisResult.decision.estimatedTime > 0 && (
                    <div style={{ marginTop: SPACING.XS }}>
                      <Text
                        style={{
                          color: isFullscreen
                            ? 'rgba(255, 255, 255, 0.7)'
                            : token.colorTextSecondary,
                          fontSize: token.fontSizeSM
                        }}
                      >
                        预计用时: {Math.round(analysisResult.decision.estimatedTime)} 秒
                      </Text>
                    </div>
                  )}
              </div>
            )}
          </>
        )

      case 'transcoding':
        return (
          <>
            <ToolOutlined style={{ ...modalStyles.icon, color: token.colorPrimary }} />
            <Title level={4} style={modalStyles.title}>
              正在转码
            </Title>
            <Text style={modalStyles.description}>
              {transcodeDecision &&
                `使用 ${transcodeDecisionHelper.getStrategyFriendlyName(transcodeDecision.strategy)} 策略进行转码...`}
            </Text>
            <div style={modalStyles.progressContainer}>
              <Progress
                percent={progressInfo.progress}
                showInfo={true}
                strokeColor={token.colorPrimary}
                style={modalStyles.progressBar}
                format={(percent) => `${percent}%`}
              />
              <Text style={modalStyles.progressText}>{progressInfo.status}</Text>
              {progressInfo.detail && (
                <Text
                  style={{
                    ...modalStyles.progressText,
                    fontSize: token.fontSizeSM,
                    marginTop: SPACING.XS
                  }}
                >
                  {progressInfo.detail}
                </Text>
              )}
            </div>
          </>
        )

      case 'completed':
        return (
          <>
            <CheckCircleOutlined style={{ ...modalStyles.icon, color: token.colorSuccess }} />
            <Title level={4} style={modalStyles.title}>
              转码完成
            </Title>
            <Text style={modalStyles.description}>视频已成功转码。</Text>
            <div style={{ marginTop: SPACING.XS, textAlign: 'center' }}>
              {transcodedFilePath && (
                <Text
                  style={{
                    color: isFullscreen ? 'rgba(255, 255, 255, 0.9)' : token.colorText,
                    fontWeight: FONT_WEIGHTS.MEDIUM,
                    fontSize: token.fontSizeSM
                  }}
                  title={getDecodedFileName(transcodedFilePath)}
                >
                  {truncateFileName(getDecodedFileName(transcodedFilePath))}
                </Text>
              )}
              {progressInfo.detail && (
                <div style={{ marginTop: SPACING.XS }}>
                  <Text
                    style={{
                      color: isFullscreen ? 'rgba(255, 255, 255, 0.7)' : token.colorTextSecondary,
                      fontSize: token.fontSizeSM
                    }}
                  >
                    {progressInfo.detail}
                  </Text>
                </div>
              )}
            </div>
          </>
        )

      case 'error':
        return (
          <>
            <ExclamationCircleOutlined style={{ ...modalStyles.icon, color: token.colorError }} />
            <Title level={4} style={modalStyles.title}>
              操作失败
            </Title>
            <Text style={modalStyles.description}>{errorMessage || '发生了未知错误，请重试'}</Text>
          </>
        )

      default:
        return null
    }
  }

  // 渲染底部按钮 / Render footer buttons
  const renderFooterButtons = (): React.ReactNode => {
    RendererLogger.debug('renderFooterButtons called', { currentStep })
    switch (currentStep) {
      case 'ffmpeg-not-found':
        return (
          <>
            <Button style={modalStyles.secondaryButton} onClick={handleClose}>
              稍后下载
            </Button>
            <Button
              type="primary"
              style={modalStyles.primaryButton}
              icon={<DownloadOutlined />}
              onClick={downloadFFmpeg}
            >
              立即下载
            </Button>
          </>
        )

      case 'decision-ready':
        return (
          <>
            <Button style={modalStyles.secondaryButton} onClick={handleClose}>
              取消
            </Button>
            <Button
              type="primary"
              style={modalStyles.primaryButton}
              icon={<ToolOutlined />}
              onClick={executeTranscoding}
            >
              开始转码
            </Button>
          </>
        )

      case 'completed':
        return (
          <>
            <Button
              style={modalStyles.secondaryButton}
              icon={<FolderOpenOutlined />}
              onClick={async () => {
                if (transcodedFilePath) {
                  try {
                    const success = await window.api.fileSystem.showItemInFolder(transcodedFilePath)
                    if (success) {
                      RendererLogger.info('成功打开文件位置', { transcodedFilePath })
                    } else {
                      RendererLogger.error('打开文件位置失败', { transcodedFilePath })
                    }
                  } catch (error) {
                    RendererLogger.error('打开文件位置时出错:', error)
                  }
                }
              }}
            >
              打开位置
            </Button>
            <Button
              type="primary"
              style={modalStyles.primaryButton}
              icon={<PlayCircleOutlined />}
              onClick={useTranscodedFile}
            >
              使用转码文件
            </Button>
          </>
        )

      case 'error':
        return (
          <>
            <Button style={modalStyles.secondaryButton} onClick={handleClose}>
              关闭
            </Button>
            <Button type="primary" style={modalStyles.primaryButton} onClick={retryOperation}>
              重试
            </Button>
          </>
        )

      case 'analyzing':
        return (
          <Button style={modalStyles.secondaryButton} onClick={handleClose}>
            取消
          </Button>
        )

      case 'downloading':
        // 下载步骤正在进行中，不显示按钮
        return null

      case 'transcoding':
        return (
          <Button style={modalStyles.secondaryButton} onClick={cancelTranscoding}>
            取消转码
          </Button>
        )

      default:
        return null
    }
  }

  return (
    <Modal
      open={visible}
      onCancel={handleClose}
      footer={null}
      width={560} // 适当增加宽度，保持内容舒适度
      centered={!isFullscreen}
      closable={false}
      style={modalStyles.modal}
      styles={{
        body: { padding: 0 },
        mask: isFullscreen ? { backgroundColor: 'rgba(0, 0, 0, 0.8)' } : undefined
      }}
      destroyOnClose
    >
      <div style={modalStyles.container}>
        {/* Header */}
        <div style={modalStyles.header}>
          <Space>
            <ToolOutlined style={{ color: token.colorPrimary }} />
            <Text style={modalStyles.headerTitle}>视频转码助手</Text>
          </Space>
          <button
            style={modalStyles.closeButton}
            onClick={handleClose}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = isFullscreen
                ? 'rgba(255, 255, 255, 0.1)'
                : token.colorBgTextHover
              e.currentTarget.style.color = isFullscreen
                ? 'rgba(255, 255, 255, 0.9)'
                : token.colorText
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
              e.currentTarget.style.color = isFullscreen
                ? 'rgba(255, 255, 255, 0.6)'
                : token.colorTextTertiary
            }}
          >
            <CloseOutlined />
          </button>
        </div>

        {/* Content */}
        <div style={modalStyles.content}>{renderStepContent()}</div>

        {/* Footer */}
        <div style={modalStyles.footer}>
          {renderFooterButtons() && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: SPACING.SM }}>
              {renderFooterButtons()}
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}
