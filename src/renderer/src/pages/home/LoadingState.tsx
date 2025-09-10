import { Spin } from 'antd'
import { LoaderCircle } from 'lucide-react'
import React from 'react'
import { useTranslation } from 'react-i18next'
import styled, { keyframes } from 'styled-components'

export function LoadingState(): React.JSX.Element {
  const { t } = useTranslation()

  return (
    <Container>
      <ContentWrapper>
        <LoadingIconContainer>
          <StyledSpin indicator={<LoaderCircle size={40} />} size="large" />
        </LoadingIconContainer>
        <LoadingText>{t('home.loading_videos', '正在加载视频...')}</LoadingText>
      </ContentWrapper>
    </Container>
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

const spin = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`

const Container = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  height: 100%;
  min-height: 400px;
  padding: 48px 24px;
  animation: ${fadeIn} 0.3s ease-out;
`

const ContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 24px;
`

const LoadingIconContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;

  .lucide-loader-circle {
    animation: ${spin} 1s linear infinite;
    color: var(--color-primary);
  }
`

const StyledSpin = styled(Spin)`
  .ant-spin-dot {
    display: none;
  }
`

const LoadingText = styled.div`
  font-size: 16px;
  font-weight: 500;
  color: var(--color-text-secondary);
  line-height: 1.5;
  opacity: 0.8;
`

export default LoadingState
