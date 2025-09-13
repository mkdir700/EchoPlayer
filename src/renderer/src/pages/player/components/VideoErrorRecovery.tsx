import { loggerService } from '@logger'
import { getVideoDialogExtensions } from '@shared/config/constant'
import { Button, Modal, Space } from 'antd'
import { AlertTriangle, FileSearch, RotateCcw, Trash2 } from 'lucide-react'
import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'

const logger = loggerService.withContext('VideoErrorRecovery')

interface VideoErrorRecoveryProps {
  open: boolean
  onClose: () => void
  videoId: number
  videoTitle: string
  originalPath?: string
  errorType: 'file-missing' | 'unsupported-format' | 'decode-error' | 'network-error' | 'unknown'
  onFileRelocate?: (newPath: string) => void
  onRemoveFromLibrary?: () => void
}

function VideoErrorRecovery({
  open,
  onClose,
  videoId,
  videoTitle,
  originalPath,
  errorType,
  onFileRelocate,
  onRemoveFromLibrary
}: VideoErrorRecoveryProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [isRelocating, setIsRelocating] = useState(false)
  const [showRelocateConfirm, setShowRelocateConfirm] = useState(false)
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false)

  // 获取简化的错误信息
  const getErrorInfo = useCallback(() => {
    switch (errorType) {
      case 'file-missing':
        return {
          title: t('player.errorRecovery.errors.fileMissing.title'),
          description: t('player.errorRecovery.errors.fileMissing.description')
        }
      case 'unsupported-format':
        return {
          title: t('player.errorRecovery.errors.unsupportedFormat.title'),
          description: t('player.errorRecovery.errors.unsupportedFormat.description')
        }
      case 'decode-error':
        return {
          title: t('player.errorRecovery.errors.decodeError.title'),
          description: t('player.errorRecovery.errors.decodeError.description')
        }
      case 'network-error':
        return {
          title: t('player.errorRecovery.errors.networkError.title'),
          description: t('player.errorRecovery.errors.networkError.description')
        }
      default:
        return {
          title: t('player.errorRecovery.errors.unknown.title'),
          description: t('player.errorRecovery.errors.unknown.description')
        }
    }
  }, [errorType, t])

  const handleRelocateFile = useCallback(() => {
    if (!onFileRelocate) return
    setShowRelocateConfirm(true)
  }, [onFileRelocate])

  const handleConfirmRelocate = useCallback(async () => {
    if (!onFileRelocate) return

    try {
      setIsRelocating(true)
      setShowRelocateConfirm(false)
      logger.info('开始重新定位视频文件', { videoId, originalPath })

      // 使用文件选择对话框让用户选择新的文件位置
      const files = await window.api.file.select({
        properties: ['openFile'],
        filters: [
          {
            name: t('player.errorRecovery.fileDialog.videoFiles'),
            extensions: getVideoDialogExtensions()
          },
          { name: t('player.errorRecovery.fileDialog.allFiles'), extensions: ['*'] }
        ]
      })

      if (files && files.length > 0) {
        const newPath = files[0].path
        logger.info('用户选择了新的文件路径', { newPath })
        onFileRelocate(newPath)
      }
    } catch (error) {
      logger.error('重新定位文件时出错:', { error })
    } finally {
      setIsRelocating(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId, originalPath, onFileRelocate])

  const handleRemoveFromLibrary = useCallback(() => {
    if (!onRemoveFromLibrary) return
    setShowRemoveConfirm(true)
  }, [onRemoveFromLibrary])

  const handleConfirmRemove = useCallback(() => {
    if (!onRemoveFromLibrary) return

    logger.info('用户确认从媒体库中移除视频', { videoId })
    setShowRemoveConfirm(false)
    onRemoveFromLibrary()
  }, [videoId, onRemoveFromLibrary])

  const handleBackToHome = useCallback(() => {
    onClose()
    navigate('/')
  }, [navigate, onClose])

  const errorInfo = getErrorInfo()

  const modalFooter = (
    <Space size="middle">
      {errorType === 'file-missing' && (
        <Button
          type="primary"
          icon={<FileSearch size={16} />}
          loading={isRelocating}
          onClick={handleRelocateFile}
        >
          {t('player.errorRecovery.actions.relocateFile')}
        </Button>
      )}

      <Button icon={<RotateCcw size={16} />} onClick={handleBackToHome}>
        {t('player.errorRecovery.actions.backToHome')}
      </Button>

      {(errorType === 'file-missing' || errorType === 'unsupported-format') && (
        <Button danger icon={<Trash2 size={16} />} onClick={handleRemoveFromLibrary}>
          {t('player.errorRecovery.actions.removeFromLibrary')}
        </Button>
      )}
    </Space>
  )

  return (
    <>
      <Modal
        title={
          <ModalTitle>
            <AlertTriangle size={20} />
            {errorInfo.title}
          </ModalTitle>
        }
        open={open}
        onCancel={undefined}
        footer={modalFooter}
        centered
        width={480}
        closable={false}
        maskClosable={false}
        destroyOnHidden
      >
        <ModalContent>
          <VideoTitle title={videoTitle}>{videoTitle}</VideoTitle>
          <ErrorDescription>{errorInfo.description}</ErrorDescription>

          {originalPath && (
            <PathInfo>
              <PathLabel>{t('player.errorRecovery.pathInfo.label')}</PathLabel>
              <PathValue title={originalPath}>{originalPath}</PathValue>
            </PathInfo>
          )}
        </ModalContent>
      </Modal>

      {/* 重新选择文件确认对话框 */}
      <Modal
        title={t('player.errorRecovery.dialogs.relocate.title')}
        open={showRelocateConfirm}
        onOk={handleConfirmRelocate}
        onCancel={() => setShowRelocateConfirm(false)}
        okText={t('player.errorRecovery.dialogs.relocate.confirmText')}
        cancelText={t('common.cancel')}
        centered
      >
        <div>
          <p style={{ marginBottom: '12px', color: 'var(--color-text-2)' }}>
            {t('player.errorRecovery.dialogs.relocate.content.warning')}
          </p>
          <p style={{ margin: '0', fontSize: '13px', color: 'var(--color-text-3)' }}>
            {t('player.errorRecovery.dialogs.relocate.content.note')}
          </p>
        </div>
      </Modal>

      {/* 从媒体库移除确认对话框 */}
      <Modal
        title={t('player.errorRecovery.dialogs.remove.title')}
        open={showRemoveConfirm}
        onOk={handleConfirmRemove}
        onCancel={() => setShowRemoveConfirm(false)}
        okText={t('player.errorRecovery.dialogs.remove.confirmText')}
        cancelText={t('common.cancel')}
        okType="danger"
        centered
      >
        <div>
          <p style={{ marginBottom: '12px', color: 'var(--color-text-2)' }}>
            {t('player.errorRecovery.dialogs.remove.content.description')}
          </p>
          <ul style={{ margin: '0 0 12px 0', paddingLeft: '20px', color: 'var(--color-text-2)' }}>
            <li>{t('player.errorRecovery.dialogs.remove.content.items.playbackHistory')}</li>
            <li>{t('player.errorRecovery.dialogs.remove.content.items.subtitleLinks')}</li>
            <li>{t('player.errorRecovery.dialogs.remove.content.items.personalSettings')}</li>
          </ul>
          <p style={{ margin: '0', fontSize: '13px', color: 'var(--color-warning)' }}>
            {t('player.errorRecovery.dialogs.remove.content.warning')}
          </p>
        </div>
      </Modal>
    </>
  )
}

export default VideoErrorRecovery

const ModalTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--color-text-1);

  svg {
    color: var(--color-status-warning);
    filter: drop-shadow(0 1px 2px rgba(250, 173, 20, 0.2));
  }
`

const ModalContent = styled.div`
  text-align: left;
`

const VideoTitle = styled.div`
  color: var(--color-text-1);
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  padding: 12px 16px;
  background: var(--color-background-soft);
  border-radius: 8px;
  border-left: 3px solid var(--color-primary);
  word-break: break-all;
`

const ErrorDescription = styled.p`
  color: var(--color-text-2);
  margin: 0 0 20px 0;
  font-size: 14px;
  line-height: 1.6;
`

const PathInfo = styled.div`
  background: var(--color-background-soft);
  border-radius: 8px;
  padding: 16px;
  margin-top: 16px;
  border: 1px solid var(--color-border-soft);
`

const PathLabel = styled.div`
  font-size: 12px;
  color: var(--color-text-3);
  margin-bottom: 8px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`

const PathValue = styled.div`
  font-size: 13px;
  color: var(--color-text-2);
  font-family: 'Menlo', 'Monaco', 'Consolas', monospace;
  word-break: break-all;
  background: var(--color-background);
  padding: 10px 12px;
  border-radius: 6px;
  border: 1px solid var(--color-border);
`
