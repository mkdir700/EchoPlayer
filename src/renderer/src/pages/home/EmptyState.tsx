import { useVideoFileSelect } from '@renderer/hooks/useVideoFileSelect'
import { Button, Typography } from 'antd'
import { Upload as UploadIcon, Video } from 'lucide-react'
import React from 'react'
import { useTranslation } from 'react-i18next'
import styled, { keyframes } from 'styled-components'

const { Title: AntTitle, Paragraph } = Typography

interface EmptyStateProps {
  onVideoAdded?: () => void
}

export function EmptyState({ onVideoAdded }: EmptyStateProps): React.JSX.Element {
  const { t } = useTranslation()
  const { selectVideoFile, isProcessing } = useVideoFileSelect({
    onSuccess: onVideoAdded
  })

  return (
    <Container>
      <ContentWrapper>
        <IconSection>
          <AnimatedIconWrapper>
            <GlowEffect />
            <VideoIconContainer>
              <Video size={64} />
            </VideoIconContainer>
          </AnimatedIconWrapper>
        </IconSection>

        <TextSection>
          <StyledTitle level={2}>{t('home.no_video')}</StyledTitle>

          <MainDescription>
            <Paragraph>{t('home.no_video_desc')}</Paragraph>
          </MainDescription>
        </TextSection>

        <ActionSection>
          <PrimaryActionButton
            type="primary"
            size="large"
            icon={<UploadIcon size={20} />}
            loading={isProcessing}
            onClick={selectVideoFile}
          >
            {isProcessing ? `${t('home.processing')}...` : t('home.select_video')}
          </PrimaryActionButton>
        </ActionSection>
      </ContentWrapper>
    </Container>
  )
}

// 动画定义
const float = keyframes`
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-8px); }
`

const glow = keyframes`
  0%, 100% {
    opacity: 0.6;
    transform: scale(1);
  }
  50% {
    opacity: 0.9;
    transform: scale(1.1);
  }
`

const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0px);
  }
`

const Container = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  height: 100%;
  min-height: 500px;
  padding: 48px 24px;
  border-radius: 20px;
  background: linear-gradient(
    135deg,
    var(--color-background) 0%,
    var(--color-background-hover) 100%
  );
  backdrop-filter: blur(10px);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);

  /* 响应式布局 */
  @media (max-width: 768px) {
    min-height: 400px;
    padding: 32px 20px;
    border-radius: 16px;
  }

  @media (min-width: 1200px) {
    min-height: 600px;
    padding: 64px 48px;
  }
`

const ContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  max-width: 500px;
  width: 100%;
  gap: 32px;

  @media (max-width: 768px) {
    max-width: 400px;
    gap: 24px;
  }
`

const IconSection = styled.div`
  position: relative;
  margin-bottom: 8px;
  animation: ${float} 3s ease-in-out infinite;
`

const AnimatedIconWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
`

const GlowEffect = styled.div`
  position: absolute;
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(24, 144, 255, 0.15) 0%, transparent 70%);
  animation: ${glow} 2s ease-in-out infinite;
`

const VideoIconContainer = styled.div`
  position: relative;
  z-index: 2;
  padding: 24px;
  border-radius: 50%;
  background: linear-gradient(
    135deg,
    var(--color-background) 0%,
    var(--color-background-hover) 100%
  );
  border: 1px solid var(--color-border);
  color: var(--color-primary);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;

  &:hover {
    transform: scale(1.05);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.12);
  }
`

const TextSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  width: 100%;
`

const StyledTitle = styled(AntTitle)`
  && {
    color: var(--color-text);
    font-size: 28px;
    font-weight: 600;
    line-height: 1.2;
    margin: 0;
    animation: ${fadeInUp} 0.6s ease-out;

    @media (max-width: 768px) {
      font-size: 24px;
    }
  }
`

const MainDescription = styled.div`
  animation: ${fadeInUp} 0.6s ease-out 0.1s both;

  .ant-typography {
    color: var(--color-text-secondary);
    font-size: 16px;
    line-height: 1.6;
    margin: 0;

    @media (max-width: 768px) {
      font-size: 15px;
    }
  }
`

const ActionSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  animation: ${fadeInUp} 0.6s ease-out 0.3s both;
`

const PrimaryActionButton = styled(Button)`
  height: 48px;
  padding: 0 40px;
  font-size: 16px;
  font-weight: 500;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(24, 144, 255, 0.2);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(24, 144, 255, 0.3);
  }

  &:active {
    transform: translateY(0px);
  }

  .ant-btn-loading-icon {
    margin-right: 8px;
  }

  @media (max-width: 768px) {
    height: 44px;
    padding: 0 32px;
    font-size: 15px;
  }
`

export default EmptyState
