import { loggerService } from '@logger'
import { ffmpegWarmupManager, WarmupState } from '@renderer/services/FFmpegWarmupManager'
import { AudioWaveform } from 'lucide-react'
import React, { useCallback, useEffect, useState } from 'react'
import styled, { keyframes } from 'styled-components'

const logger = loggerService.withContext('StartupLoadingState')

interface StartupLoadingStateProps {
  visible: boolean
  onComplete?: () => void
}

export const StartupLoadingState: React.FC<StartupLoadingStateProps> = ({
  visible,
  onComplete
}) => {
  const [warmupState, setWarmupState] = useState<WarmupState>({
    isWarming: false,
    isComplete: false,
    hasError: false
  })
  const [minDisplayTimeElapsed, setMinDisplayTimeElapsed] = useState(false)

  // 预热状态变化回调
  const handleWarmupStateChange = useCallback((state: WarmupState) => {
    setWarmupState(state)
    logger.info('🔥 预热状态变化', state)
  }, [])

  // 检查是否可以完成启动
  const checkCanComplete = useCallback(() => {
    const canComplete = minDisplayTimeElapsed && warmupState.isComplete

    if (canComplete) {
      logger.info('✅ 启动条件满足，执行完成回调', {
        minDisplayTimeElapsed,
        warmupComplete: warmupState.isComplete,
        warmupError: warmupState.hasError,
        warmupDuration: warmupState.duration
      })
      onComplete?.()
    } else {
      logger.info('⏳ 启动条件未满足，继续等待', {
        minDisplayTimeElapsed,
        warmupComplete: warmupState.isComplete
      })
    }
  }, [
    minDisplayTimeElapsed,
    warmupState.isComplete,
    warmupState.hasError,
    warmupState.duration,
    onComplete
  ])

  useEffect(() => {
    logger.info('🎦 StartupLoadingState useEffect 执行', {
      visible
    })

    if (visible) {
      logger.info('🚀 StartupLoadingState 开始显示')

      // 检查是否开启了减少动效偏好
      const reduced =
        window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
      const minDisplayTime = reduced ? 100 : 1800 // 最小展示时间

      logger.info(`⏱️ 最小展示时间: ${minDisplayTime}ms`, { reduced })

      // 开始预热 FFmpeg
      ffmpegWarmupManager.startWarmup().catch((error) => {
        logger.error('启动预热失败:', { error })
      })

      // 订阅预热状态变化
      const unsubscribe = ffmpegWarmupManager.subscribe(handleWarmupStateChange)

      // 最小展示时间计时器
      const minDisplayTimer = setTimeout(() => {
        logger.info('⏰ 最小展示时间已到')
        setMinDisplayTimeElapsed(true)
      }, minDisplayTime)

      return () => {
        logger.info('🧹 StartupLoadingState useEffect 清理')
        clearTimeout(minDisplayTimer)
        unsubscribe()
      }
    }

    return undefined
  }, [visible, handleWarmupStateChange])

  // 当条件满足时检查是否可以完成
  useEffect(() => {
    if (visible) {
      checkCanComplete()
    }
  }, [visible, checkCanComplete])

  if (!visible) {
    return null
  }

  return (
    <StartupContainer>
      <ContentWrapper>
        {/* 品牌 Logo 区域 */}
        <BrandSection>
          <LogoContainer>
            <LogoGlow />
            <LogoIcon>
              <AudioWaveform size={32} />
            </LogoIcon>
          </LogoContainer>
          <BrandText>EchoPlayer</BrandText>
        </BrandSection>
      </ContentWrapper>

      {/* 背景效果 */}
      <BackgroundOverlay />
    </StartupContainer>
  )
}

// 动画定义
const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0px);
  }
`

const glow = keyframes`
  0%, 100% {
    opacity: 0.6;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.05);
  }
`

const shimmer = keyframes`
  0% {
    background-position: -200% center;
  }
  100% {
    background-position: 200% center;
  }
`

// 样式组件
const StartupContainer = styled.div`
  position: fixed;
  inset: 0;
  z-index: 60;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-background);
  animation: ${fadeIn} 0.5s ease-out;
  overflow: hidden;
`

const BackgroundOverlay = styled.div`
  position: absolute;
  inset: 0;
  background:
    radial-gradient(1200px circle at 50% 40%, transparent 60%, rgba(0, 0, 0, 0.02)),
    radial-gradient(800px circle at 50% 55%, var(--color-primary, #007aff) / 3, transparent 65%);
  backdrop-filter: blur(20px) saturate(120%);
  -webkit-backdrop-filter: blur(20px) saturate(120%);

  /* macOS 专属增强 */
  @supports (backdrop-filter: blur(20px)) {
    background-color: rgba(0, 0, 0, 0.02);
  }
`

const ContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 48px;
  position: relative;
  z-index: 1;
`

const BrandSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
`

const LogoContainer = styled.div`
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  will-change: transform;
`

const LogoGlow = styled.div`
  position: absolute;
  inset: -8px;
  border-radius: 50%;
  background: var(--color-primary, #007aff) / 15;
  filter: blur(16px);
  animation: ${glow} 3s ease-in-out infinite;
`

const LogoIcon = styled.div`
  width: 64px;
  height: 64px;
  border-radius: 16px;
  background: linear-gradient(
    135deg,
    var(--color-primary, #007aff),
    var(--color-primary, #007aff) / 80
  );
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 28px;
  font-weight: 700;
  position: relative;
  z-index: 1;
  box-shadow:
    0 12px 32px rgba(0, 122, 255, 0.25),
    0 4px 16px rgba(0, 122, 255, 0.15);
  will-change: transform;
`

const BrandText = styled.h1`
  font-size: 42px;
  font-weight: 650;
  color: var(--color-text);
  margin: 0;
  line-height: 1.2;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif;
  letter-spacing: -1px;

  /* 添加渐变文字效果 */
  background: linear-gradient(
    135deg,
    var(--color-text) 0%,
    var(--color-text) 60%,
    var(--color-primary) 100%
  );
  background-size: 200% auto;
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: ${shimmer} 3s ease-in-out infinite;
`

export default StartupLoadingState
