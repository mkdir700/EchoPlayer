import { loggerService } from '@logger'
import IndicatorLight from '@renderer/components/IndicatorLight'
import { useTheme } from '@renderer/contexts'
import {
  ANIMATION_DURATION,
  BORDER_RADIUS,
  EASING,
  FONT_SIZES,
  FONT_WEIGHTS,
  SPACING
} from '@renderer/infrastructure/styles/theme'
import { Button, Input, message, Popconfirm, Space } from 'antd'
import { CheckCircle, Download, FolderOpen, RefreshCw, Trash2 } from 'lucide-react'
import { FC, useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router-dom'
import styled from 'styled-components'

import {
  SettingDescription,
  SettingDivider,
  SettingGroup,
  SettingRow,
  SettingRowTitle,
  SettingTitle
} from '.'

const logger = loggerService.withContext('FFmpegSection')

interface FFmpegSectionProps {
  refreshKey?: number
}

interface FFmpegStatus {
  path: string
  isBundled: boolean
  isDownloaded: boolean
  isSystemFFmpeg: boolean
  platform: string
  arch: string
  version?: string
  needsDownload: boolean
}

interface FFmpegWarmupStatus {
  isWarmedUp: boolean
  isWarming: boolean
}

interface FFmpegDownloadProgress {
  percent?: number
  downloaded?: number
  total?: number
  speed?: number
  remainingTime?: number
  status?: 'downloading' | 'extracting' | 'verifying' | 'completed' | 'error'
}

const FFmpegSection: FC<FFmpegSectionProps> = ({ refreshKey = 0 }) => {
  const { theme } = useTheme()
  const { t } = useTranslation()
  const location = useLocation()

  // 状态管理
  const [ffmpegStatus, setFFmpegStatus] = useState<FFmpegStatus | null>(null)
  const [warmupStatus, setWarmupStatus] = useState<FFmpegWarmupStatus>({
    isWarmedUp: false,
    isWarming: false
  })
  const [ffmpegPath, setFFmpegPath] = useState<string>('')
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState<FFmpegDownloadProgress>({})
  const [showSuccessState, setShowSuccessState] = useState(false)
  const isCancellingRef = useRef(false)
  const isCompletionHandledRef = useRef(false)
  const [isValidatingPath, setIsValidatingPath] = useState(false)

  // 获取 FFmpeg 状态
  const fetchFFmpegStatus = useCallback(async () => {
    try {
      const status = await window.api.ffmpeg.getInfo()
      setFFmpegStatus(status)

      // 同步 FFmpeg 路径
      if (status.path) {
        setFFmpegPath(status.path)
      }

      const warmup = await window.api.ffmpeg.getWarmupStatus()
      setWarmupStatus(warmup)
    } catch (error) {
      logger.error('获取 FFmpeg 状态失败:', { error })
    }
  }, [])

  // 初始化时获取状态
  useEffect(() => {
    fetchFFmpegStatus()
  }, [fetchFFmpegStatus, refreshKey])

  // 预热 FFmpeg
  const handleWarmup = useCallback(async () => {
    try {
      setWarmupStatus((prev) => ({ ...prev, isWarming: true }))
      const result = await window.api.ffmpeg.warmup()

      if (result) {
        setWarmupStatus({ isWarmedUp: true, isWarming: false })
        message.success(t('settings.plugins.ffmpeg.download.warmup_success'))
      } else {
        setWarmupStatus({ isWarmedUp: false, isWarming: false })
        message.error(t('settings.plugins.ffmpeg.download.warmup_failed'))
      }
    } catch (error) {
      setWarmupStatus({ isWarmedUp: false, isWarming: false })
      message.error(t('settings.plugins.ffmpeg.download.warmup_failed'))
      logger.error('预热失败:', { error })
    }
  }, [t])

  // 下载进度轮询
  useEffect(() => {
    let progressInterval: NodeJS.Timeout | null = null

    if (isDownloading) {
      progressInterval = setInterval(async () => {
        try {
          const progress = await window.api.ffmpeg.download.getProgress()
          setDownloadProgress(progress || {})

          // 检查下载是否完成
          const currentStatus = await window.api.ffmpeg.getInfo()
          if (
            currentStatus.isDownloaded &&
            !currentStatus.needsDownload &&
            !isCompletionHandledRef.current
          ) {
            // 标记已处理，防止重复
            isCompletionHandledRef.current = true

            // 立即停止轮询
            if (progressInterval) {
              clearInterval(progressInterval)
              progressInterval = null
            }

            // 先显示成功状态
            setShowSuccessState(true)
            message.success(t('settings.plugins.ffmpeg.download.success'))

            // 2秒后恢复正常状态
            setTimeout(() => {
              setIsDownloading(false)
              setShowSuccessState(false)
              setFFmpegStatus(currentStatus)
              // 更新 FFmpeg 路径为下载后的路径
              setFFmpegPath(currentStatus.path)
              // 自动开始预热
              handleWarmup()
            }, 2000)
          }
        } catch (error) {
          logger.error('获取下载进度失败:', { error })
        }
      }, 2000)
    }

    return () => {
      if (progressInterval) {
        clearInterval(progressInterval)
      }
    }
  }, [handleWarmup, isDownloading, t])

  // 下载 FFmpeg
  const handleDownload = useCallback(async () => {
    try {
      isCancellingRef.current = false // 重置取消标志
      isCompletionHandledRef.current = false // 重置完成处理标志
      setIsDownloading(true)
      setDownloadProgress({ percent: 0 })

      const result = await window.api.ffmpeg.download.download()
      if (!result) {
        throw new Error('下载失败')
      }
    } catch (error) {
      setIsDownloading(false)
      // 如果是用户主动取消，不显示失败message
      if (!isCancellingRef.current) {
        message.error(t('settings.plugins.ffmpeg.download.failed'))
        logger.error('下载 FFmpeg 失败:', { error })
      }
    }
  }, [t])

  // 检查URL参数，触发自动下载
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search)
    const shouldAutoDownload = searchParams.get('autoDownload') === 'true'

    if (shouldAutoDownload && ffmpegStatus?.needsDownload && !isDownloading) {
      // 延迟一点时间确保UI已经渲染
      const timer = setTimeout(() => {
        handleDownload()
      }, 500)

      return () => clearTimeout(timer)
    }

    // 确保所有分支都有返回值
    return undefined
  }, [location.search, ffmpegStatus?.needsDownload, isDownloading, handleDownload])

  // 取消下载
  const handleCancelDownload = useCallback(async () => {
    try {
      isCancellingRef.current = true
      await window.api.ffmpeg.download.cancel()
      setIsDownloading(false)
      setDownloadProgress({})
      message.info(t('settings.plugins.ffmpeg.download.cancelled'))
    } catch (error) {
      logger.error('取消下载失败:', { error })
    } finally {
      // 延迟重置，确保下载函数的catch能够检测到
      setTimeout(() => {
        isCancellingRef.current = false
      }, 100)
    }
  }, [t])

  // 选择文件路径
  const handleBrowsePath = useCallback(async () => {
    try {
      const result = await window.api.select({
        title: t('settings.plugins.ffmpeg.path.browse_title'),
        properties: ['openFile'],
        filters: [{ name: 'FFmpeg 可执行文件', extensions: ['exe', 'app', '*'] }]
      })

      if (result && result.filePaths && result.filePaths.length > 0) {
        setFFmpegPath(result.filePaths[0])
      }
    } catch (error) {
      logger.error('选择路径失败:', { error })
    }
  }, [t])

  // 验证 FFmpeg 路径
  const validateFFmpegPath = useCallback(
    async (path: string) => {
      if (!path.trim()) return

      setIsValidatingPath(true)
      try {
        // 检查文件是否存在
        const exists = await window.api.fs.checkFileExists(path)
        if (!exists) {
          message.warning(t('settings.plugins.ffmpeg.path.invalid'))
          return false
        }

        // 这里可以进一步验证是否是有效的 FFmpeg 可执行文件
        // 例如执行 ffmpeg -version 命令检查
        message.success(t('settings.plugins.ffmpeg.path.valid'))
        return true
      } catch (error) {
        logger.error('验证路径失败:', { error })
        message.error(t('settings.plugins.ffmpeg.path.validation_failed'))
        return false
      } finally {
        setIsValidatingPath(false)
      }
    },
    [t]
  )

  // 卸载 FFmpeg
  const handleUninstall = useCallback(async () => {
    try {
      const result = await window.api.ffmpeg.download.remove()
      if (result) {
        message.success(t('settings.plugins.ffmpeg.uninstall.success'))
        // 卸载后重新获取状态，路径会自动更新
        await fetchFFmpegStatus()
      } else {
        message.error(t('settings.plugins.ffmpeg.uninstall.failed'))
      }
    } catch (error) {
      message.error(t('settings.plugins.ffmpeg.uninstall.failed'))
      logger.error('卸载 FFmpeg 失败:', { error })
    }
  }, [t, fetchFFmpegStatus])

  // 获取状态显示信息
  const getStatusInfo = () => {
    if (!ffmpegStatus) {
      return {
        text: t('settings.plugins.ffmpeg.status.loading'),
        color: 'gray' as const,
        pulsing: true
      }
    }

    if (isDownloading) {
      return {
        text: t('settings.plugins.ffmpeg.status.downloading'),
        color: 'blue' as const,
        pulsing: true
      }
    }

    if (warmupStatus.isWarming) {
      return {
        text: t('settings.plugins.ffmpeg.download.warming_up'),
        color: 'yellow' as const,
        pulsing: true
      }
    }

    if (ffmpegStatus.needsDownload) {
      return {
        text: t('settings.plugins.ffmpeg.status.not_installed'),
        color: 'red' as const,
        pulsing: false
      }
    }

    if (ffmpegStatus.isSystemFFmpeg) {
      return {
        text: t('settings.plugins.ffmpeg.status.system_version'),
        color: 'green' as const,
        pulsing: false
      }
    }

    if (ffmpegStatus.isDownloaded || ffmpegStatus.isBundled) {
      return {
        text: warmupStatus.isWarmedUp
          ? t('settings.plugins.ffmpeg.status.available')
          : t('settings.plugins.ffmpeg.status.installed'),
        color: 'green' as const,
        pulsing: false
      }
    }

    return {
      text: t('settings.plugins.ffmpeg.status.unknown'),
      color: 'gray' as const,
      pulsing: false
    }
  }

  const statusInfo = getStatusInfo()
  const downloadProgressPercent = downloadProgress.percent || 0

  return (
    <SettingGroup theme={theme}>
      <SettingTitle>{t('settings.plugins.ffmpeg.title')}</SettingTitle>
      <SettingDescription>{t('settings.plugins.ffmpeg.description')}</SettingDescription>
      <SettingDivider />

      {/* 状态显示 */}
      <SettingRow>
        <SettingRowTitle>{t('settings.plugins.ffmpeg.status.label')}</SettingRowTitle>
        <StatusContainer>
          <span>{statusInfo.text}</span>
          <IndicatorLight color={statusInfo.color} pulsing={statusInfo.pulsing} />
        </StatusContainer>
      </SettingRow>

      {/* 版本信息 */}
      {ffmpegStatus?.version && (
        <>
          <SettingDivider />
          <SettingRow>
            <SettingRowTitle>{t('settings.plugins.ffmpeg.version')}</SettingRowTitle>
            <span>{ffmpegStatus.version}</span>
          </SettingRow>
        </>
      )}

      {/* FFmpeg 路径 */}
      <SettingDivider />
      <SettingRow>
        <SettingRowTitle>{t('settings.plugins.ffmpeg.path.label')}</SettingRowTitle>
        <PathInputContainer>
          <Input
            value={ffmpegPath}
            onChange={(e) => setFFmpegPath(e.target.value)}
            onBlur={() => validateFFmpegPath(ffmpegPath)}
            placeholder={t('settings.plugins.ffmpeg.path.placeholder')}
            suffix={isValidatingPath ? <RefreshCw size={12} className="spin" /> : null}
          />
          <Button icon={<FolderOpen size={14} />} onClick={handleBrowsePath}>
            {t('settings.plugins.ffmpeg.path.browse')}
          </Button>
        </PathInputContainer>
      </SettingRow>

      {/* 操作按钮 */}
      <SettingDivider />
      <SettingRow>
        <SettingRowTitle>{t('settings.plugins.ffmpeg.actions.label')}</SettingRowTitle>
        <DownloadButtonContainer>
          {ffmpegStatus?.needsDownload ? (
            <DownloadButton
              type="primary"
              icon={showSuccessState ? <CheckCircle size={14} /> : <Download size={14} />}
              onClick={handleDownload}
              disabled={isDownloading || showSuccessState}
              $isDownloading={isDownloading}
              $downloadProgress={downloadProgressPercent}
              $showSuccessState={showSuccessState}
            >
              <DownloadButtonText>
                {showSuccessState
                  ? t('settings.plugins.ffmpeg.download.success')
                  : isDownloading
                    ? `${t('settings.plugins.ffmpeg.download.downloading')} ${downloadProgressPercent.toFixed(0)}%`
                    : '安装'}
              </DownloadButtonText>
              {isDownloading && <DownloadProgressBar $progress={downloadProgressPercent} />}
            </DownloadButton>
          ) : (
            <ActionButtonGroup>
              {/* <Button
                icon={<RefreshCw size={14} />}
                onClick={handleWarmup}
                loading={warmupStatus.isWarming}
              >
                {t('settings.plugins.ffmpeg.actions.warmup')}
              </Button>
              <Button onClick={fetchFFmpegStatus}>
                {t('settings.plugins.ffmpeg.actions.refresh')}
              </Button> */}
              {(ffmpegStatus?.isDownloaded || ffmpegStatus?.isBundled) &&
                !ffmpegStatus?.isSystemFFmpeg && (
                  <Popconfirm
                    title={t('settings.plugins.ffmpeg.uninstall.confirm_title')}
                    description={t('settings.plugins.ffmpeg.uninstall.confirm_description')}
                    onConfirm={handleUninstall}
                    okText={t('settings.plugins.ffmpeg.uninstall.confirm')}
                    cancelText={t('common.cancel')}
                    okType="danger"
                  >
                    <Button danger icon={<Trash2 size={14} />}>
                      {t('settings.plugins.ffmpeg.uninstall.button')}
                    </Button>
                  </Popconfirm>
                )}
            </ActionButtonGroup>
          )}

          {isDownloading && (
            <CancelButton onClick={handleCancelDownload}>
              {t('settings.plugins.ffmpeg.download.cancel')}
            </CancelButton>
          )}
        </DownloadButtonContainer>
      </SettingRow>
    </SettingGroup>
  )
}

// 样式组件
const StatusContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
`

// 下载按钮容器
const DownloadButtonContainer = styled.div`
  display: flex;
  gap: ${SPACING.XS}px;
  align-items: flex-start;
  flex-direction: column;

  @media (min-width: 640px) {
    flex-direction: row;
    align-items: center;
  }
`

// 增强的下载按钮
const DownloadButton = styled(Button)<{
  $isDownloading: boolean
  $downloadProgress: number
  $showSuccessState?: boolean
}>`
  position: relative;
  min-width: 160px;
  height: 32px;
  padding: ${SPACING.XXS}px ${SPACING.SM}px;
  overflow: hidden;
  border-radius: ${BORDER_RADIUS.SM}px;
  transition: all ${ANIMATION_DURATION.MEDIUM} ${EASING.APPLE};

  // 确保内容在进度条之上
  .ant-btn-content {
    position: relative;
    z-index: 2;
    width: 100%;
  }

  // 禁用状态样式
  &.ant-btn-primary[disabled] {
    background: ${({ $showSuccessState }) =>
      $showSuccessState ? 'var(--ant-color-success)' : 'var(--ant-color-primary)'};
    border-color: ${({ $showSuccessState }) =>
      $showSuccessState ? 'var(--ant-color-success)' : 'var(--ant-color-primary)'};
    color: var(--ant-color-white);
    opacity: 1;
    transform: ${({ $showSuccessState }) => ($showSuccessState ? 'scale(1.02)' : 'none')};
  }

  // 悬停效果
  &:not([disabled]):hover {
    transform: translateY(-1px);
    box-shadow: var(--ant-box-shadow-secondary);
  }
`

// 按钮文本
const DownloadButtonText = styled.span`
  font-weight: ${FONT_WEIGHTS.SEMIBOLD};
  font-size: ${FONT_SIZES.SM}px;
  line-height: 1.2;
  position: relative;
  z-index: 2;
`

// 进度条
const DownloadProgressBar = styled.div<{ $progress: number }>`
  position: absolute;
  bottom: 0;
  left: 0;
  height: 2px;
  width: ${({ $progress }) => $progress}%;
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.3) 0%,
    rgba(255, 255, 255, 0.6) 50%,
    rgba(255, 255, 255, 0.3) 100%
  );
  border-radius: 0 0 ${BORDER_RADIUS.SM}px ${BORDER_RADIUS.SM}px;
  transition: width ${ANIMATION_DURATION.MEDIUM} ${EASING.APPLE};
  z-index: 1;

  // 添加光效动画
  &::after {
    content: '';
    position: absolute;
    top: 0;
    right: -20px;
    width: 20px;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(255, 255, 255, 0.4) 50%,
      transparent 100%
    );
    animation: shimmer 2s infinite;
  }

  @keyframes shimmer {
    0% {
      transform: translateX(-100%);
    }
    100% {
      transform: translateX(100%);
    }
  }
`

// 操作按钮组
const ActionButtonGroup = styled(Space)``

// 取消按钮
const CancelButton = styled(Button)`
  font-size: ${FONT_SIZES.XS}px;
  height: 32px;
  padding: 0 ${SPACING.SM}px;
  border-radius: ${BORDER_RADIUS.SM}px;
  transition: all ${ANIMATION_DURATION.MEDIUM} ${EASING.APPLE};

  &:hover {
    transform: translateY(-1px);
  }
`

const PathInputContainer = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;

  .ant-input {
    flex: 1;
    max-width: 250px;
  }

  .spin {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`

export default FFmpegSection
