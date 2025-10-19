import {
  ANIMATION_DURATION,
  FONT_SIZES,
  FONT_WEIGHTS,
  SPACING
} from '@renderer/infrastructure/styles/theme'
import { ASRProgress, ASRProgressStage } from '@shared/types'
import { Button, Flex, Modal, Progress } from 'antd'
import { FC, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

interface ASRProgressModalProps {
  open: boolean
  progress: ASRProgress
  onCancel: () => void
}

const Section = styled.div``

const StageTitle = styled.div`
  font-size: ${FONT_SIZES.BASE}px;
  font-weight: ${FONT_WEIGHTS.MEDIUM};
  margin-bottom: ${SPACING.MD}px;
`

const EstimatedText = styled.div`
  font-size: ${FONT_SIZES.SM}px;
  color: var(--ant-color-text-secondary);
`

const MessageText = styled.div`
  font-size: ${FONT_SIZES.XS}px;
  color: var(--ant-color-text-tertiary);
`

const CancelButton = styled(Button)<{ $confirmMode: boolean }>`
  transition:
    color ${ANIMATION_DURATION.SLOW} ease-in-out,
    border-color ${ANIMATION_DURATION.SLOW} ease-in-out;

  ${(props) =>
    props.$confirmMode &&
    `
    border-color: var(--ant-color-error) !important;
    color: var(--color-error-text) !important;

    &:hover {
      border-color: var(--ant-color-error) !important;
    }
  `}
`

const ASRProgressModal: FC<ASRProgressModalProps> = ({ open, progress, onCancel }) => {
  const { t } = useTranslation()
  const [confirmMode, setConfirmMode] = useState(false)

  const getStageText = () => {
    switch (progress.stage) {
      case ASRProgressStage.Initializing:
        return t('player.asr.progress.stages.initializing')
      case ASRProgressStage.ExtractingAudio:
        return t('player.asr.progress.stages.extracting')
      case ASRProgressStage.Transcribing:
        return t('player.asr.progress.stages.transcribing')
      case ASRProgressStage.Formatting:
        return t('player.asr.progress.stages.formatting')
      case ASRProgressStage.Saving:
        return t('player.asr.progress.stages.saving')
      case ASRProgressStage.Complete:
        return t('player.asr.progress.stages.complete')
      case ASRProgressStage.Failed:
        return t('player.asr.progress.stages.failed')
      default:
        return ''
    }
  }

  const handleCancel = () => {
    if (confirmMode) {
      onCancel()
      setConfirmMode(false)
    } else {
      setConfirmMode(true)
    }
  }

  const handleCancelMouseLeave = () => {
    if (confirmMode) {
      setConfirmMode(false)
    }
  }

  useEffect(() => {
    if (confirmMode) {
      const timer = setTimeout(() => {
        setConfirmMode(false)
      }, 3000)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [confirmMode])

  const estimatedMinutes = progress.eta ? Math.ceil(progress.eta / 60) : undefined

  return (
    <Modal
      open={open}
      title={t('player.asr.progress.title')}
      footer={null}
      closable={false}
      maskClosable={false}
      centered
    >
      <Flex vertical gap={SPACING.LG}>
        <Section>
          <StageTitle>{getStageText()}</StageTitle>
          <Progress percent={progress.percent} status="active" />
        </Section>

        {estimatedMinutes !== undefined && estimatedMinutes > 0 && (
          <EstimatedText>
            {t('player.asr.progress.estimatedTime', { minutes: estimatedMinutes })}
          </EstimatedText>
        )}

        {progress.message && <MessageText>{progress.message}</MessageText>}

        <Flex justify="flex-end">
          <CancelButton
            $confirmMode={confirmMode}
            onClick={handleCancel}
            onMouseLeave={handleCancelMouseLeave}
            disabled={progress.stage === ASRProgressStage.Complete}
          >
            {confirmMode ? t('player.asr.progress.confirmCancel') : t('player.asr.progress.cancel')}
          </CancelButton>
        </Flex>
      </Flex>
    </Modal>
  )
}

export default ASRProgressModal
