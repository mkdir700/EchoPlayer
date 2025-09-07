import { loggerService } from '@logger'
import { usePlayerStore } from '@renderer/state/stores/player.store'
import { Button } from 'antd'
import { Play, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import styled, { keyframes } from 'styled-components'

import { usePlayerEngine } from '../hooks'
import { usePlayerCommands } from '../hooks/usePlayerCommands'

const logger = loggerService.withContext('AutoResumeCountdown')

/**
 * 自动恢复倒计时通知组件
 *
 * 设计原则：
 * - 低侵入性：使用小型悬浮通知而非全屏遮罩
 * - 渐进式显示：温和的动画和过渡效果
 * - 清晰的信息层级：优先显示时间信息
 * - 便捷的交互：一键取消或立即恢复
 */
export default function AutoResumeCountdown() {
  const { orchestrator } = usePlayerEngine()
  const isAutoResumeCountdownOpen = usePlayerStore((s) => s.isAutoResumeCountdownOpen)
  const closeAutoResumeCountdown = usePlayerStore((s) => s.closeAutoResumeCountdown)
  const resumeDelay = usePlayerStore((s) => s.resumeDelay)

  // 本地状态：剩余时间（毫秒）
  const [remainingTime, setRemainingTime] = useState(resumeDelay)
  // 悬停状态：用于暂停自动隐藏
  const [isHovered, setIsHovered] = useState(false)

  // 播放器命令 Hook
  const { playPause } = usePlayerCommands()

  // 计算显示值
  const remainingSeconds = Math.ceil(remainingTime / 1000)
  const progress = 1 - remainingTime / resumeDelay // 反向进度，从0到1

  // 恢复播放
  const resumePlay = useCallback(() => {
    closeAutoResumeCountdown()
    playPause()
  }, [closeAutoResumeCountdown, playPause])

  // 取消自动恢复
  const cancelAutoResume = useCallback(() => {
    closeAutoResumeCountdown()
  }, [closeAutoResumeCountdown])

  useEffect(() => {
    if (!isAutoResumeCountdownOpen) {
      setRemainingTime(resumeDelay)
      return
    }

    setRemainingTime(resumeDelay)

    // 设置倒计时定时器
    const countdownTimer = setTimeout(() => {
      resumePlay()
    }, resumeDelay)

    // 设置更新进度的定时器（每100ms更新一次）
    const progressTimer = setInterval(() => {
      setRemainingTime((prev) => {
        const newTime = prev - 100
        if (newTime <= 0) {
          clearInterval(progressTimer)
          return 0
        }
        return newTime
      })
    }, 100)

    return () => {
      clearTimeout(countdownTimer)
      clearInterval(progressTimer)
    }
  }, [isAutoResumeCountdownOpen, resumeDelay, resumePlay, cancelAutoResume])

  // 监听 paused 状态变更：当正在倒计时且 paused 变为 false 时，关闭倒计时
  useEffect(() => {
    const id = setInterval(() => {
      if (isAutoResumeCountdownOpen && !orchestrator.isPaused()) {
        logger.info(`用户手动恢复播放, 关闭倒计时`)
        closeAutoResumeCountdown()
      }
    }, 100)

    return () => {
      clearInterval(id)
    }
  }, [orchestrator, isAutoResumeCountdownOpen, closeAutoResumeCountdown])

  if (!isAutoResumeCountdownOpen) {
    return null
  }

  return (
    <NotificationContainer
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CountdownCard $isHovered={isHovered}>
        {/* 进度条 */}
        <ProgressBar progress={progress} />

        {/* 主要内容 */}
        <ContentWrapper>
          <MainContent>
            <TimeDisplay>{remainingSeconds}</TimeDisplay>
            <MessageText>秒后自动播放</MessageText>
          </MainContent>

          {/* 操作按钮 */}
          <ActionButtons>
            <ActionButton
              type="text"
              size="small"
              icon={<Play size={12} />}
              onClick={resumePlay}
              className="play-btn"
            />
            <ActionButton
              type="text"
              size="small"
              icon={<X size={12} />}
              onClick={cancelAutoResume}
              className="cancel-btn"
            />
          </ActionButtons>
        </ContentWrapper>
      </CountdownCard>
    </NotificationContainer>
  )
}

// === 样式组件 ===

const slideInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`

// 通知容器：定位在右上角，不阻挡视频内容
const NotificationContainer = styled.div`
  position: absolute;
  bottom: 24px;
  left: 24px;
  z-index: 50;
  animation: ${slideInUp} 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  pointer-events: auto;
`

// 主卡片：紧凑的设计，温和的视觉效果
const CountdownCard = styled.div<{ $isHovered: boolean }>`
  background: var(--modal-background-glass);
  border: 1px solid var(--modal-border-color);
  border-radius: 12px;
  backdrop-filter: blur(20px);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.12),
    0 4px 16px rgba(0, 0, 0, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);

  width: 200px;
  position: relative;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);

  /* 悬停效果：轻微放大和阴影增强 */
  transform: ${(props) => (props.$isHovered ? 'scale(1.02)' : 'scale(1)')};
  box-shadow: ${(props) =>
    props.$isHovered
      ? `
    0 12px 40px rgba(0, 0, 0, 0.16),
    0 6px 20px rgba(0, 0, 0, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 0.08)
  `
      : `
    0 8px 32px rgba(0, 0, 0, 0.12),
    0 4px 16px rgba(0, 0, 0, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.05)
  `};
`

// 进度条：顶部细线指示器
const ProgressBar = styled.div<{ progress: number }>`
  position: absolute;
  top: 0;
  left: 0;
  height: 2px;
  width: ${(props) => props.progress * 100}%;
  background: linear-gradient(90deg, var(--color-primary) 0%, var(--color-primary-soft) 100%);
  border-radius: 0 2px 0 0;
  transition: width 0.1s linear;
`

// 内容包装器
const ContentWrapper = styled.div`
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`

// 主要内容：时间和文字
const MainContent = styled.div`
  display: flex;
  align-items: baseline;
  gap: 6px;
  flex: 1;
`

// 时间显示：醒目但不夸张
const TimeDisplay = styled.span`
  font-size: 18px;
  font-weight: 600;
  color: var(--color-primary);
  line-height: 1;
  font-variant-numeric: tabular-nums;
  min-width: 20px;
  text-align: center;
`

// 消息文本：辅助信息
const MessageText = styled.span`
  font-size: 13px;
  color: var(--color-text-2);
  line-height: 1.2;
  white-space: nowrap;
`

// 操作按钮组：右侧紧凑布局
const ActionButtons = styled.div`
  display: flex;
  gap: 4px;
  align-items: center;
`

// 操作按钮：简洁的图标按钮
const ActionButton = styled(Button)`
  border: none;
  border-radius: 8px;
  width: 28px;
  height: 28px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);

  &.play-btn {
    color: var(--color-primary);
    background: rgba(0, 185, 107, 0.1);

    &:hover {
      color: var(--color-primary);
      background: rgba(0, 185, 107, 0.15);
      transform: scale(1.1);
    }
  }

  &.cancel-btn {
    color: var(--color-text-2);
    background: rgba(255, 255, 255, 0.05);

    &:hover {
      color: var(--color-text);
      background: rgba(255, 255, 255, 0.1);
      transform: scale(1.1);
    }
  }

  /* 移除 antd 的默认样式 */
  &:focus {
    box-shadow: none;
  }
`
