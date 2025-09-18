import { loggerService } from '@logger'
import { usePlayerStore } from '@renderer/state/stores/player.store'
import { AlertCircle, CheckCircle, Clock, Loader2 } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import styled, { keyframes } from 'styled-components'

const logger = loggerService.withContext('TranscodeIndicator')

/**
 * 转码状态指示器组件
 *
 * 显示转码进度和状态，包括：
 * - 编解码器检测中
 * - 转码进行中
 * - 转码成功
 * - 转码失败
 * - 缓存命中
 */
const TranscodeIndicator: React.FC = () => {
  const transcodeInfo = usePlayerStore((s) => s.transcodeInfo)
  const hlsMode = usePlayerStore((s) => s.hlsMode)

  // 从 transcodeInfo 中获取状态
  const transcodeStatus = transcodeInfo?.status || 'idle'

  // 控制显示/隐藏动画
  const [visible, setVisible] = useState(false)
  const [shouldRender, setShouldRender] = useState(false)

  // 根据转码状态决定是否显示指示器
  useEffect(() => {
    const shouldShow = transcodeStatus !== 'idle' && transcodeStatus !== 'completed'

    if (shouldShow) {
      setShouldRender(true)
      // 短暂延迟后显示，避免闪烁
      const timer = setTimeout(() => setVisible(true), 100)
      return () => clearTimeout(timer)
    } else {
      setVisible(false)
      // 等待动画完成后再隐藏组件
      const timer = setTimeout(() => setShouldRender(false), 300)
      return () => clearTimeout(timer)
    }
  }, [transcodeStatus])

  // 生成状态显示内容
  const getStatusContent = () => {
    switch (transcodeStatus) {
      case 'detecting':
        return {
          icon: <Loader2 size={16} />,
          text: '检测编解码器兼容性...',
          color: '#1890ff'
        }

      case 'transcoding': {
        const elapsed = transcodeInfo?.startTime
          ? Math.round((Date.now() - transcodeInfo.startTime) / 1000)
          : 0

        return {
          icon: <Loader2 size={16} />,
          text: `转码中... (${elapsed}s)`,
          color: '#1890ff'
        }
      }

      case 'completed': {
        const duration =
          transcodeInfo?.startTime && transcodeInfo?.endTime
            ? Math.round((transcodeInfo.endTime - transcodeInfo.startTime) / 1000)
            : 0

        return {
          icon: <CheckCircle size={16} />,
          text: transcodeInfo?.cached ? '使用缓存播放' : `转码完成 (${duration}s)`,
          color: '#52c41a'
        }
      }

      case 'failed':
        return {
          icon: <AlertCircle size={16} />,
          text: `转码失败: ${transcodeInfo?.error || '未知错误'}`,
          color: '#ff4d4f'
        }

      case 'cached':
        return {
          icon: <Clock size={16} />,
          text: '使用缓存播放',
          color: '#52c41a'
        }

      default:
        return null
    }
  }

  const content = getStatusContent()

  // 如果没有内容或不应该渲染，返回 null
  if (!content || !shouldRender) {
    return null
  }

  logger.debug('转码指示器状态', {
    status: transcodeStatus,
    visible,
    hlsMode,
    transcodeInfo
  })

  return (
    <Container $visible={visible} $color={content.color}>
      <IconContainer $color={content.color}>{content.icon}</IconContainer>
      <TextContainer>
        <StatusText>{content.text}</StatusText>
        {hlsMode && <DetailText>HLS 模式播放</DetailText>}
      </TextContainer>
    </Container>
  )
}

export default TranscodeIndicator

// 旋转动画
const spin = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`

// 淡入淡出动画
const fadeInOut = keyframes`
  0% {
    opacity: 0;
    transform: translateY(-10px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
`

const Container = styled.div<{ $visible: boolean; $color: string }>`
  position: fixed;
  top: 80px;
  right: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--ant-color-bg-elevated, rgba(0, 0, 0, 0.8));
  border: 1px solid ${(props) => props.$color};
  border-radius: 8px;
  backdrop-filter: blur(10px);
  box-shadow: var(--ant-box-shadow-secondary, 0 4px 12px rgba(0, 0, 0, 0.15));
  z-index: 1000;
  max-width: 300px;
  opacity: ${(props) => (props.$visible ? 1 : 0)};
  transform: ${(props) => (props.$visible ? 'translateY(0)' : 'translateY(-10px)')};
  transition: all 0.3s ease;
  animation: ${fadeInOut} 0.3s ease;

  @media (max-width: 768px) {
    top: 60px;
    right: 10px;
    max-width: 250px;
    padding: 6px 10px;
  }
`

const IconContainer = styled.div<{ $color: string }>`
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${(props) => props.$color};

  svg {
    animation: ${(props) => (props.$color === '#1890ff' ? `${spin} 1s linear infinite` : 'none')};
  }
`

const TextContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`

const StatusText = styled.div`
  color: var(--ant-color-text, #ffffff);
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

const DetailText = styled.div`
  color: var(--ant-color-text-secondary, rgba(255, 255, 255, 0.65));
  font-size: 11px;
  white-space: nowrap;
`
