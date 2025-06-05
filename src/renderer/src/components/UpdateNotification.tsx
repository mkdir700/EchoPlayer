import React, { useEffect, useState } from 'react'
import { Modal, Button, Progress, Typography, Space } from 'antd'
import { CloudDownloadOutlined, CheckCircleOutlined, InfoCircleOutlined } from '@ant-design/icons'

const { Text, Paragraph } = Typography

// 更新状态类型
interface UpdateStatus {
  status: 'checking' | 'available' | 'not-available' | 'downloading' | 'downloaded' | 'error'
  info?: {
    version: string
    releaseDate?: string
    releaseNotes?: string | Record<string, unknown>
    [key: string]: unknown
  }
  error?: string
  progress?: {
    percent: number
    bytesPerSecond: number
    total: number
    transferred: number
  }
}

const UpdateNotification: React.FC = () => {
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    // 监听来自主进程的更新状态消息
    window.electron.ipcRenderer.on('update-status', (_event, status: UpdateStatus) => {
      console.log('收到更新状态:', status)
      setUpdateStatus(status)

      // 当有新版本可用或下载完成时显示模态框
      if (status.status === 'available' || status.status === 'downloaded') {
        setIsModalOpen(true)
      }

      // 当发生错误时显示通知
      // if (status.status === 'error') {
      //   notification.error({
      //     message: '更新错误',
      //     description: status.error || '检查更新时发生未知错误',
      //     duration: 0
      //   })
      // }
    })

    // 组件挂载时自动检查更新（静默模式）
    checkForUpdates(true)

    // 清理函数
    return () => {
      window.electron.ipcRenderer.removeAllListeners('update-status')
    }
  }, [])

  // 检查更新
  const checkForUpdates = async (silent = false): Promise<void> => {
    try {
      const result = await window.api.update.checkForUpdates({ silent })
      console.log('检查更新结果:', result)
    } catch (error) {
      console.error('检查更新失败:', error)
    }
  }

  // 下载更新
  const downloadUpdate = async (): Promise<void> => {
    try {
      await window.api.update.downloadUpdate()
    } catch (error) {
      console.error('下载更新失败:', error)
    }
  }

  // 安装更新
  const installUpdate = (): void => {
    window.api.update.installUpdate()
  }

  // 关闭模态框
  const handleCancel = (): void => {
    setIsModalOpen(false)
  }

  // 渲染更新内容
  const renderUpdateContent = (): React.ReactNode => {
    if (!updateStatus) return null

    switch (updateStatus.status) {
      case 'checking':
        return <Text>正在检查更新...</Text>
      case 'available':
        return (
          <Space direction="vertical" style={{ width: '100%' }}>
            <Text strong>发现新版本: {updateStatus.info?.version}</Text>
            {updateStatus.info?.releaseDate && (
              <Text>发布日期: {new Date(updateStatus.info.releaseDate).toLocaleString()}</Text>
            )}
            {updateStatus.info?.releaseNotes && (
              <>
                <Text strong>更新内容:</Text>
                <Paragraph>
                  {typeof updateStatus.info.releaseNotes === 'string'
                    ? updateStatus.info.releaseNotes
                    : JSON.stringify(updateStatus.info.releaseNotes, null, 2)}
                </Paragraph>
              </>
            )}
            <Button
              type="primary"
              icon={<CloudDownloadOutlined />}
              onClick={downloadUpdate}
              style={{ marginTop: 16 }}
            >
              下载更新
            </Button>
          </Space>
        )
      case 'downloading':
        return (
          <Space direction="vertical" style={{ width: '100%' }}>
            <Text>正在下载更新...</Text>
            {updateStatus.progress && (
              <>
                <Progress percent={Math.round(updateStatus.progress.percent)} status="active" />
                <Text>
                  {Math.round(updateStatus.progress.transferred / 1024 / 1024)} MB /{' '}
                  {Math.round(updateStatus.progress.total / 1024 / 1024)} MB (
                  {Math.round(updateStatus.progress.bytesPerSecond / 1024)} KB/s)
                </Text>
              </>
            )}
          </Space>
        )
      case 'downloaded':
        return (
          <Space direction="vertical" style={{ width: '100%' }}>
            <Text type="success" strong>
              <CheckCircleOutlined /> 更新已下载完成，准备安装
            </Text>
            <Paragraph>
              点击&quot;立即安装&quot;按钮将关闭应用并安装更新。安装完成后，应用将自动重启。
            </Paragraph>
            <Button type="primary" onClick={installUpdate} style={{ marginTop: 16 }}>
              立即安装
            </Button>
          </Space>
        )
      case 'error':
        return (
          <Space direction="vertical">
            <Text type="danger">检查更新失败: {updateStatus.error}</Text>
            <Button onClick={() => checkForUpdates()}>重试</Button>
          </Space>
        )
      default:
        return null
    }
  }

  return (
    <>
      <Modal
        title={
          <Space>
            <InfoCircleOutlined />
            应用更新
          </Space>
        }
        open={isModalOpen}
        onCancel={handleCancel}
        footer={
          updateStatus?.status !== 'available' && updateStatus?.status !== 'downloaded'
            ? [
                <Button key="close" onClick={handleCancel}>
                  关闭
                </Button>
              ]
            : null
        }
        maskClosable={updateStatus?.status !== 'downloading'}
        closable={updateStatus?.status !== 'downloading'}
      >
        {renderUpdateContent()}
      </Modal>
    </>
  )
}

export default UpdateNotification
