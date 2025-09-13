import {
  BORDER_RADIUS,
  FONT_SIZES,
  FONT_WEIGHTS,
  SPACING
} from '@renderer/infrastructure/styles/theme'
import { Modal } from 'antd'
import { Film, Gauge, Shield, Zap } from 'lucide-react'
import { FC } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'

interface FFmpegDownloadPromptProps {
  open: boolean
  onClose: () => void
}

/**
 * FFmpeg下载引导对话框
 * 当视频解析失败且缺少FFmpeg时显示，引导用户下载FFmpeg
 */
export const FFmpegDownloadPrompt: FC<FFmpegDownloadPromptProps> = ({ open, onClose }) => {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const handleDownload = () => {
    onClose()
    // 跳转到设置页面并传递自动下载参数
    navigate('/settings/plugins?autoDownload=true')
  }

  const handleLater = () => {
    onClose()
  }

  return (
    <Modal
      title={null}
      open={open}
      onCancel={onClose}
      footer={null}
      width={520}
      centered
      maskClosable={false}
    >
      <PromptContainer>
        <HeaderSection>
          <IconWrapper>
            <Film size={32} />
          </IconWrapper>
          <HeaderContent>
            <Title>{t('settings.plugins.ffmpeg.prompt.title')}</Title>
            <Subtitle>{t('settings.plugins.ffmpeg.prompt.subtitle')}</Subtitle>
          </HeaderContent>
        </HeaderSection>

        <BenefitsSection>
          <SectionTitle>{t('settings.plugins.ffmpeg.prompt.benefits.title')}</SectionTitle>
          <BenefitsList>
            <BenefitItem>
              <BenefitIcon>
                <Zap size={18} />
              </BenefitIcon>
              <BenefitContent>
                <BenefitTitle>
                  {t('settings.plugins.ffmpeg.prompt.benefits.compatibility.title')}
                </BenefitTitle>
                <BenefitDescription>
                  {t('settings.plugins.ffmpeg.prompt.benefits.compatibility.description')}
                </BenefitDescription>
              </BenefitContent>
            </BenefitItem>

            <BenefitItem>
              <BenefitIcon>
                <Gauge size={18} />
              </BenefitIcon>
              <BenefitContent>
                <BenefitTitle>
                  {t('settings.plugins.ffmpeg.prompt.benefits.performance.title')}
                </BenefitTitle>
                <BenefitDescription>
                  {t('settings.plugins.ffmpeg.prompt.benefits.performance.description')}
                </BenefitDescription>
              </BenefitContent>
            </BenefitItem>

            <BenefitItem>
              <BenefitIcon>
                <Shield size={18} />
              </BenefitIcon>
              <BenefitContent>
                <BenefitTitle>
                  {t('settings.plugins.ffmpeg.prompt.benefits.reliability.title')}
                </BenefitTitle>
                <BenefitDescription>
                  {t('settings.plugins.ffmpeg.prompt.benefits.reliability.description')}
                </BenefitDescription>
              </BenefitContent>
            </BenefitItem>
          </BenefitsList>
        </BenefitsSection>

        <EffortSection>
          <EffortTitle>{t('settings.plugins.ffmpeg.prompt.effort.title')}</EffortTitle>
          <EffortDescription>
            {t('settings.plugins.ffmpeg.prompt.effort.description')}
          </EffortDescription>
        </EffortSection>

        <ActionSection>
          <SecondaryButton onClick={handleLater}>
            {t('settings.plugins.ffmpeg.prompt.actions.later')}
          </SecondaryButton>
          <PrimaryButton onClick={handleDownload}>
            {t('settings.plugins.ffmpeg.prompt.actions.download')}
          </PrimaryButton>
        </ActionSection>
      </PromptContainer>
    </Modal>
  )
}

const PromptContainer = styled.div`
  padding: ${SPACING.LG}px;
`

const HeaderSection = styled.div`
  display: flex;
  align-items: flex-start;
  gap: ${SPACING.MD}px;
  margin-bottom: ${SPACING.LG}px;
`

const IconWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, var(--ant-color-primary), var(--ant-color-info));
  border-radius: ${BORDER_RADIUS.LG}px;
  color: white;
  flex-shrink: 0;
`

const HeaderContent = styled.div`
  flex: 1;
`

const Title = styled.h2`
  font-size: ${FONT_SIZES.XL}px;
  font-weight: ${FONT_WEIGHTS.BOLD};
  color: var(--ant-color-text);
  margin: 0 0 ${SPACING.XXS}px 0;
  line-height: 1.3;
`

const Subtitle = styled.p`
  font-size: ${FONT_SIZES.SM}px;
  color: var(--ant-color-text-secondary);
  margin: 0;
  line-height: 1.5;
`

const BenefitsSection = styled.div`
  margin-bottom: ${SPACING.LG}px;
`

const SectionTitle = styled.h3`
  font-size: ${FONT_SIZES.LG}px;
  font-weight: ${FONT_WEIGHTS.SEMIBOLD};
  color: var(--ant-color-text);
  margin: 0 0 ${SPACING.MD}px 0;
`

const BenefitsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${SPACING.MD}px;
`

const BenefitItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: ${SPACING.SM}px;
`

const BenefitIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: var(--ant-color-primary-bg);
  border-radius: ${BORDER_RADIUS.BASE}px;
  color: var(--ant-color-primary);
  flex-shrink: 0;
  margin-top: 2px;
`

const BenefitContent = styled.div`
  flex: 1;
`

const BenefitTitle = styled.h4`
  font-size: ${FONT_SIZES.SM}px;
  font-weight: ${FONT_WEIGHTS.SEMIBOLD};
  color: var(--ant-color-text);
  margin: 0 0 ${SPACING.XXS}px 0;
`

const BenefitDescription = styled.p`
  font-size: ${FONT_SIZES.XS}px;
  color: var(--ant-color-text-secondary);
  margin: 0;
  line-height: 1.5;
`

const EffortSection = styled.div`
  padding: ${SPACING.MD}px;
  background: var(--ant-color-fill-quaternary);
  border-radius: ${BORDER_RADIUS.BASE}px;
  margin-bottom: ${SPACING.LG}px;
`

const EffortTitle = styled.h4`
  font-size: ${FONT_SIZES.SM}px;
  font-weight: ${FONT_WEIGHTS.SEMIBOLD};
  color: var(--ant-color-text);
  margin: 0 0 ${SPACING.XXS}px 0;
`

const EffortDescription = styled.p`
  font-size: ${FONT_SIZES.XS}px;
  color: var(--ant-color-text-secondary);
  margin: 0;
  line-height: 1.5;
`

const ActionSection = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: ${SPACING.SM}px;
`

const SecondaryButton = styled.button`
  padding: ${SPACING.XS}px ${SPACING.MD}px;
  background: transparent;
  border: 1px solid var(--ant-color-border);
  border-radius: ${BORDER_RADIUS.SM}px;
  color: var(--ant-color-text-secondary);
  font-size: ${FONT_SIZES.SM}px;
  font-weight: ${FONT_WEIGHTS.MEDIUM};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: var(--ant-color-primary);
    color: var(--ant-color-primary);
  }
`

const PrimaryButton = styled.button`
  display: flex;
  align-items: center;
  gap: ${SPACING.XS}px;
  padding: ${SPACING.XS}px ${SPACING.MD}px;
  background: var(--ant-color-primary);
  border: 1px solid var(--ant-color-primary);
  border-radius: ${BORDER_RADIUS.SM}px;
  color: white;
  font-size: ${FONT_SIZES.SM}px;
  font-weight: ${FONT_WEIGHTS.SEMIBOLD};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: var(--ant-color-primary-hover);
    border-color: var(--ant-color-primary-hover);
    transform: translateY(-1px);
  }
`

export default FFmpegDownloadPrompt
