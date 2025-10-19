import { ASRProgress, ASRProgressStage } from '@shared/types'
import { Button, Flex, Modal, Progress } from 'antd'
import { FC } from 'react'
import { useTranslation } from 'react-i18next'

interface ASRProgressModalProps {
  open: boolean
  progress: ASRProgress
  onCancel: () => void
}

const ASRProgressModal: FC<ASRProgressModalProps> = ({ open, progress, onCancel }) => {
  const { t } = useTranslation()

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
      default:
        return ''
    }
  }

  const handleCancel = () => {
    Modal.confirm({
      title: t('player.asr.progress.cancelConfirm'),
      content: t('player.asr.progress.cancelConfirmDescription'),
      okText: t('player.asr.progress.cancel'),
      cancelText: t('common.cancel'),
      onOk: () => {
        onCancel()
      }
    })
  }

  const estimatedMinutes = progress.eta ? Math.ceil(progress.eta / 60) : undefined

  return (
    <Modal
      open={open}
      title={t('player.asr.progress.title')}
      footer={null}
      closable={false}
      maskClosable={false}
      width={500}
      centered
    >
      <Flex vertical gap={24}>
        <div>
          <div style={{ fontSize: '16px', fontWeight: 500, marginBottom: '16px' }}>
            {getStageText()}
          </div>
          <Progress percent={progress.percent} status="active" />
        </div>

        {estimatedMinutes !== undefined && estimatedMinutes > 0 && (
          <div style={{ fontSize: '14px', color: '#666' }}>
            {t('player.asr.progress.estimatedTime', { minutes: estimatedMinutes })}
          </div>
        )}

        {progress.message && (
          <div style={{ fontSize: '13px', color: '#999' }}>{progress.message}</div>
        )}

        <Flex justify="flex-end">
          <Button onClick={handleCancel} disabled={progress.stage === ASRProgressStage.Complete}>
            {t('player.asr.progress.cancel')}
          </Button>
        </Flex>
      </Flex>
    </Modal>
  )
}

export default ASRProgressModal
