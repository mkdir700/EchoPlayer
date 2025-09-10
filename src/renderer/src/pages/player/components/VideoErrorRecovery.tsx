import { loggerService } from '@logger'
import { Button, Modal, Space } from 'antd'
import { AlertTriangle, FileSearch, RotateCcw, Trash2 } from 'lucide-react'
import { useCallback, useState } from 'react'
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
  const navigate = useNavigate()
  const [isRelocating, setIsRelocating] = useState(false)
  const [showRelocateConfirm, setShowRelocateConfirm] = useState(false)
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false)

  // 获取简化的错误信息
  const getErrorInfo = useCallback(() => {
    switch (errorType) {
      case 'file-missing':
        return {
          title: '视频文件缺失',
          description: '原视频文件可能已被删除、移动或重命名'
        }
      case 'unsupported-format':
        return {
          title: '不支持的视频格式',
          description: '当前视频格式不受支持或文件已损坏'
        }
      case 'decode-error':
        return {
          title: '视频解码错误',
          description: '视频文件可能损坏或编码格式不兼容'
        }
      case 'network-error':
        return {
          title: '网络错误',
          description: '加载网络视频时发生连接错误'
        }
      default:
        return {
          title: '播放错误',
          description: '视频播放时发生未知错误'
        }
    }
  }, [errorType])

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
          { name: '视频文件', extensions: ['mp4', 'mkv', 'avi', 'mov', 'wmv', 'flv', 'webm'] },
          { name: '所有文件', extensions: ['*'] }
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
          重新选择文件
        </Button>
      )}

      <Button icon={<RotateCcw size={16} />} onClick={handleBackToHome}>
        返回首页
      </Button>

      {(errorType === 'file-missing' || errorType === 'unsupported-format') && (
        <Button danger icon={<Trash2 size={16} />} onClick={handleRemoveFromLibrary}>
          从媒体库移除
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
        destroyOnClose
      >
        <ModalContent>
          <VideoTitle title={videoTitle}>{videoTitle}</VideoTitle>
          <ErrorDescription>{errorInfo.description}</ErrorDescription>

          {originalPath && (
            <PathInfo>
              <PathLabel>文件路径</PathLabel>
              <PathValue title={originalPath}>{originalPath}</PathValue>
            </PathInfo>
          )}
        </ModalContent>
      </Modal>

      {/* 重新选择文件确认对话框 */}
      <Modal
        title="重新选择文件"
        open={showRelocateConfirm}
        onOk={handleConfirmRelocate}
        onCancel={() => setShowRelocateConfirm(false)}
        okText="我已了解，继续选择"
        cancelText="取消"
        centered
      >
        <div>
          <p style={{ marginBottom: '12px', color: 'var(--color-text-2)' }}>
            请务必选择与当前视频记录对应的<strong>原始文件</strong>。
          </p>
          <p style={{ margin: '0', fontSize: '13px', color: 'var(--color-text-3)' }}>
            ⚠️ 选择错误的文件可能导致播放进度、字幕等数据不匹配。
          </p>
        </div>
      </Modal>

      {/* 从媒体库移除确认对话框 */}
      <Modal
        title="确认从媒体库移除？"
        open={showRemoveConfirm}
        onOk={handleConfirmRemove}
        onCancel={() => setShowRemoveConfirm(false)}
        okText="确认移除"
        cancelText="取消"
        okType="danger"
        centered
      >
        <div>
          <p style={{ marginBottom: '12px', color: 'var(--color-text-2)' }}>
            此操作将从媒体库中永久删除该视频记录，包括：
          </p>
          <ul style={{ margin: '0 0 12px 0', paddingLeft: '20px', color: 'var(--color-text-2)' }}>
            <li>播放进度和历史记录</li>
            <li>已导入的字幕文件关联</li>
            <li>个人设置和标记</li>
          </ul>
          <p style={{ margin: '0', fontSize: '13px', color: 'var(--color-warning)' }}>
            ⚠️ 此操作不可撤销，但不会删除原视频文件。
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
