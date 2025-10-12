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
import { Button, message, Popconfirm } from 'antd'
import { CheckCircle, Download, Trash2 } from 'lucide-react'
import { FC, useCallback, useEffect, useRef, useState } from 'react'
import styled from 'styled-components'

import {
  SettingDescription,
  SettingDivider,
  SettingGroup,
  SettingRow,
  SettingRowTitle,
  SettingTitle
} from '.'

const logger = loggerService.withContext('MediaServerSection')

type DependencyType = 'ffmpeg' | 'ffprobe'

interface MediaServerSectionProps {
  onDependencyReady?: (dependency: DependencyType) => void
}

interface MediaServerInfo {
  status: 'stopped' | 'starting' | 'running' | 'stopping' | 'error'
  pid?: number
  port?: number
  startTime?: number
  uptime?: number
  error?: string
}

interface VenvInfo {
  exists: boolean
  venvPath?: string
  pythonPath?: string
  pythonVersion?: string
  hasProjectConfig: boolean
  hasLockfile: boolean
}

interface InstallProgress {
  stage: 'init' | 'venv' | 'deps' | 'completed' | 'error'
  message: string
  percent: number
}

const MediaServerSection: FC<MediaServerSectionProps> = ({ onDependencyReady }) => {
  const { theme } = useTheme()

  const [serverInfo, setServerInfo] = useState<MediaServerInfo | null>(null)
  const [venvInfo, setVenvInfo] = useState<VenvInfo | null>(null)
  const [isInstalling, setIsInstalling] = useState(false)
  const [installProgress, setInstallProgressState] = useState<InstallProgress | null>(null)
  const [showSuccessState, setShowSuccessState] = useState(false)
  const isCompletionHandledRef = useRef(false)
  const successTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const updateInstallProgress = useCallback(
    (progress: InstallProgress | null) => {
      if (progress === null) {
        setInstallProgressState(null)
        return
      }

      setInstallProgressState((prev) => {
        // 确保轮询返回的百分比不会让进度条倒退
        const prevPercentCandidate = prev?.percent
        const prevPercent =
          typeof prevPercentCandidate === 'number' && Number.isFinite(prevPercentCandidate)
            ? prevPercentCandidate
            : 0
        const nextPercentCandidate = progress.percent
        const nextPercentRaw =
          typeof nextPercentCandidate === 'number' && Number.isFinite(nextPercentCandidate)
            ? nextPercentCandidate
            : 0
        const clampedNextPercent = Math.min(100, Math.max(0, nextPercentRaw))
        const safePercent = Math.max(clampedNextPercent, prevPercent)

        return {
          ...progress,
          percent: safePercent
        }
      })
    },
    [setInstallProgressState]
  )

  // 获取服务器状态
  const fetchServerInfo = useCallback(async () => {
    try {
      const info = await window.api.mediaServer.getInfo()
      setServerInfo(info)
    } catch (error) {
      logger.error('获取 Media Server 状态失败:', { error })
    }
  }, [])

  // 获取 Python 环境状态
  const fetchVenvInfo = useCallback(async () => {
    try {
      const info = await window.api.pythonVenv.checkInfo()
      setVenvInfo(info)
    } catch (error) {
      logger.error('获取 Python 环境状态失败:', { error })
    }
  }, [])

  // 初始化时获取状态
  useEffect(() => {
    fetchServerInfo()
    fetchVenvInfo()
  }, [fetchServerInfo, fetchVenvInfo])

  // 安装进度轮询
  useEffect(() => {
    let progressInterval: NodeJS.Timeout | null = null

    if (isInstalling) {
      progressInterval = setInterval(async () => {
        try {
          const progress = await window.api.pythonVenv.getProgress()
          if (progress) {
            updateInstallProgress(progress)
          }

          // 检查安装是否完成
          const currentVenvInfo = await window.api.pythonVenv.checkInfo()
          if (currentVenvInfo.exists && !isCompletionHandledRef.current) {
            isCompletionHandledRef.current = true

            // 立即停止轮询
            if (progressInterval) {
              clearInterval(progressInterval)
              progressInterval = null
            }

            // 显示成功状态
            setShowSuccessState(true)
            message.success('Media Server 环境安装成功')

            // 清理之前的 timeout（如果存在）
            if (successTimeoutRef.current) {
              clearTimeout(successTimeoutRef.current)
              successTimeoutRef.current = null
            }

            // 2秒后恢复正常状态
            successTimeoutRef.current = setTimeout(() => {
              setIsInstalling(false)
              setShowSuccessState(false)
              setVenvInfo(currentVenvInfo)
              updateInstallProgress(null)
              successTimeoutRef.current = null
            }, 2000)
          }
        } catch (error) {
          logger.error('获取安装进度失败:', { error })
        }
      }, 2000)
    }

    return () => {
      if (progressInterval) {
        clearInterval(progressInterval)
      }
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current)
        successTimeoutRef.current = null
      }
    }
  }, [isInstalling, updateInstallProgress])

  // 安装 Media Server 环境
  const handleInstall = useCallback(async () => {
    try {
      // 清理之前的 timeout（如果存在）
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current)
        successTimeoutRef.current = null
      }

      isCompletionHandledRef.current = false
      setIsInstalling(true)
      updateInstallProgress({ stage: 'init', message: '正在检查依赖...', percent: 0 })

      const ensureDependency = async (
        type: DependencyType,
        label: 'FFprobe' | 'FFmpeg',
        startPercent: number,
        completionPercent: number
      ) => {
        const checkExists =
          type === 'ffprobe'
            ? () => window.api.ffprobe.checkExists()
            : () => window.api.ffmpeg.checkExists()
        const download =
          type === 'ffprobe'
            ? () => window.api.ffprobe.download.download()
            : () => window.api.ffmpeg.download.download()

        logger.info(`检查 ${label} 安装状态`)
        const exists = await checkExists()

        if (exists) {
          logger.info(`${label} 已安装，跳过下载`)
          updateInstallProgress({
            stage: 'deps',
            message: `${label} 已就绪`,
            percent: completionPercent
          })
          onDependencyReady?.(type)
          return
        }

        logger.info(`${label} 未安装，开始下载`)
        updateInstallProgress({
          stage: 'deps',
          message: `正在安装 ${label}...`,
          percent: startPercent
        })
        message.info(`正在安装 ${label}，请稍候...`)

        const result = await download()
        if (!result) {
          const installedAfterAttempt = await checkExists()
          if (!installedAfterAttempt) {
            throw new Error(`${label} 安装失败，请先完成 ${label} 安装后重试`)
          }
        }

        updateInstallProgress({
          stage: 'deps',
          message: `${label} 安装完成`,
          percent: completionPercent
        })
        message.success(`${label} 安装完成`)
        onDependencyReady?.(type)
      }

      // 依赖安装：先安装 FFprobe，再安装 FFmpeg
      await ensureDependency('ffprobe', 'FFprobe', 5, 10)
      await ensureDependency('ffmpeg', 'FFmpeg', 15, 20)

      updateInstallProgress({ stage: 'init', message: '正在检查环境...', percent: 25 })

      // 步骤 1: 检查并安装 UV
      logger.info('检查 UV 安装状态')
      const uvInfo = await window.api.uv.checkInstallation()

      if (!uvInfo.exists) {
        logger.info('UV 未安装，开始下载...')
        updateInstallProgress({ stage: 'init', message: '正在下载 UV 包管理器...', percent: 35 })

        // 下载 UV
        const uvDownloaded = await window.api.uv.download()
        if (!uvDownloaded) {
          throw new Error('UV 下载失败')
        }

        logger.info('UV 下载完成')
        updateInstallProgress({ stage: 'init', message: 'UV 安装完成', percent: 45 })
      } else {
        logger.info('UV 已存在，跳过下载', { uvInfo })
        updateInstallProgress({ stage: 'init', message: 'UV 已就绪', percent: 45 })
      }

      // 步骤 2: 初始化 Python 环境（uv 会自动下载匹配的 Python 解释器）
      logger.info('开始初始化 Python 环境')
      updateInstallProgress({ stage: 'init', message: '正在初始化 Python 环境...', percent: 55 })

      const result = await window.api.pythonVenv.initialize()
      if (!result) {
        throw new Error('Python 环境初始化失败')
      }

      logger.info('Media Server 环境安装完成')

      // 步骤 3: 安装完成后自动启动 Media Server
      logger.info('准备启动 Media Server')
      updateInstallProgress({
        stage: 'completed',
        message: '正在启动 Media Server...',
        percent: 95
      })

      try {
        const startResult = await window.api.mediaServer.start()
        if (startResult) {
          logger.info('Media Server 启动成功')
          // 刷新服务器状态
          await fetchServerInfo()
        } else {
          logger.warn('Media Server 启动失败，但环境安装成功')
        }
      } catch (startError) {
        logger.error('启动 Media Server 失败，但环境安装成功:', { error: startError })
        // 不抛出错误，因为安装已成功
      }
    } catch (error) {
      // 清理 timeout
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current)
        successTimeoutRef.current = null
      }

      setIsInstalling(false)
      updateInstallProgress(null)
      message.error(
        error instanceof Error ? error.message : 'Media Server 环境安装失败，请稍后重试'
      )
      logger.error('安装 Media Server 环境失败:', { error })
    }
  }, [fetchServerInfo, onDependencyReady, updateInstallProgress])

  // 卸载环境
  const handleUninstall = useCallback(async () => {
    try {
      // 如果服务器正在运行，先停止
      if (serverInfo?.status === 'running') {
        await window.api.mediaServer.stop()
      }

      const result = await window.api.pythonVenv.remove()
      if (result) {
        message.success('Media Server 环境已卸载')
        await fetchVenvInfo()
        await fetchServerInfo()
      } else {
        message.error('卸载失败')
      }
    } catch (error) {
      message.error('卸载失败')
      logger.error('卸载 Media Server 环境失败:', { error })
    }
  }, [serverInfo?.status, fetchVenvInfo, fetchServerInfo])

  // 获取状态显示信息
  const getStatusInfo = () => {
    if (!serverInfo) {
      return {
        text: '加载中...',
        color: 'gray' as const,
        pulsing: true
      }
    }

    if (isInstalling) {
      return {
        text: '正在安装...',
        color: 'blue' as const,
        pulsing: true
      }
    }

    if (!venvInfo?.exists) {
      return {
        text: '未安装',
        color: 'red' as const,
        pulsing: false
      }
    }

    switch (serverInfo.status) {
      case 'running':
        return {
          text: '运行中',
          color: 'green' as const,
          pulsing: false
        }
      case 'starting':
        return {
          text: '正在启动...',
          color: 'yellow' as const,
          pulsing: true
        }
      case 'stopping':
        return {
          text: '正在停止...',
          color: 'yellow' as const,
          pulsing: true
        }
      case 'error':
        return {
          text: '错误',
          color: 'red' as const,
          pulsing: false
        }
      default:
        return {
          text: '已停止',
          color: 'gray' as const,
          pulsing: false
        }
    }
  }

  const statusInfo = getStatusInfo()
  const installProgressPercent = installProgress?.percent || 0

  return (
    <SettingGroup theme={theme}>
      <SettingTitle>Media Server</SettingTitle>
      <SettingDescription>
        视频转码和媒体处理服务，提供 HLS 流媒体和视频格式转换功能
      </SettingDescription>
      <SettingDivider />

      {/* 状态显示 */}
      <SettingRow>
        <SettingRowTitle>服务状态</SettingRowTitle>
        <StatusContainer>
          <span>{statusInfo.text}</span>
          <IndicatorLight color={statusInfo.color} pulsing={statusInfo.pulsing} />
        </StatusContainer>
      </SettingRow>

      {/* 操作按钮 - 简化为只显示安装/卸载 */}
      <SettingDivider />
      <SettingRow>
        <SettingRowTitle>操作</SettingRowTitle>
        <ActionButtonContainer>
          {venvInfo === null ? (
            // 加载中状态，不显示按钮避免闪烁
            <Button loading disabled>
              检查中...
            </Button>
          ) : !venvInfo.exists ? (
            <InstallButton
              type="primary"
              icon={showSuccessState ? <CheckCircle size={14} /> : <Download size={14} />}
              onClick={handleInstall}
              disabled={isInstalling || showSuccessState}
              $isInstalling={isInstalling}
              $installProgress={installProgressPercent}
              $showSuccessState={showSuccessState}
            >
              <ButtonText>
                {showSuccessState
                  ? '安装成功'
                  : isInstalling
                    ? `安装中 ${installProgressPercent.toFixed(0)}%`
                    : '安装'}
              </ButtonText>
              {isInstalling && <ProgressBar $progress={installProgressPercent} />}
            </InstallButton>
          ) : (
            <Popconfirm
              title="确认卸载"
              description="这将卸载媒体服务，部分视频格式将不能完美支持。"
              onConfirm={handleUninstall}
              okText="确认"
              cancelText="取消"
              okType="danger"
            >
              <Button danger icon={<Trash2 size={14} />}>
                卸载
              </Button>
            </Popconfirm>
          )}
        </ActionButtonContainer>
      </SettingRow>

      {/* 错误信息 */}
      {/* {serverInfo?.error && (
        <>
          <SettingDivider />
          <SettingRow>
            <SettingRowTitle>错误信息</SettingRowTitle>
            <ErrorText>{serverInfo.error}</ErrorText>
          </SettingRow>
        </>
      )} */}

      {/* 安装进度信息 */}
      {/* {installProgress && isInstalling && (
        <>
          <SettingDivider />
          <SettingRow>
            <SettingRowTitle>安装进度</SettingRowTitle>
            <span>{installProgress.message}</span>
          </SettingRow>
        </>
      )} */}
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

const ActionButtonContainer = styled.div`
  display: flex;
  gap: ${SPACING.XS}px;
  align-items: flex-start;
  flex-direction: column;

  @media (min-width: 640px) {
    flex-direction: row;
    align-items: center;
  }
`

const InstallButton = styled(Button)<{
  $isInstalling: boolean
  $installProgress: number
  $showSuccessState?: boolean
}>`
  position: relative;
  min-width: 160px;
  height: 32px;
  padding: ${SPACING.XXS}px ${SPACING.SM}px;
  overflow: hidden;
  border-radius: ${BORDER_RADIUS.SM}px;
  transition: all ${ANIMATION_DURATION.MEDIUM} ${EASING.APPLE};

  .ant-btn-content {
    position: relative;
    z-index: 2;
    width: 100%;
  }

  &.ant-btn-primary[disabled] {
    background: ${({ $showSuccessState }) =>
      $showSuccessState ? 'var(--ant-color-success)' : 'var(--ant-color-primary)'};
    border-color: ${({ $showSuccessState }) =>
      $showSuccessState ? 'var(--ant-color-success)' : 'var(--ant-color-primary)'};
    color: var(--ant-color-white);
    opacity: 1;
    transform: ${({ $showSuccessState }) => ($showSuccessState ? 'scale(1.02)' : 'none')};
  }

  &:not([disabled]):hover {
    transform: translateY(-1px);
    box-shadow: var(--ant-box-shadow-secondary);
  }
`

const ButtonText = styled.span`
  font-weight: ${FONT_WEIGHTS.SEMIBOLD};
  font-size: ${FONT_SIZES.SM}px;
  line-height: 1.2;
  position: relative;
  z-index: 2;
`

const ProgressBar = styled.div<{ $progress: number }>`
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

// const ErrorText = styled.span`
//   color: var(--ant-color-error);
//   font-size: ${FONT_SIZES.SM}px;
// `

export default MediaServerSection
