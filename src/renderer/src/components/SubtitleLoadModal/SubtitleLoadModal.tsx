import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Modal, Button, Typography, Spin, Alert, message } from 'antd'
import {
  FileTextOutlined,
  UploadOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  CloseOutlined
} from '@ant-design/icons'
import { FileSystemHelper } from '@renderer/utils/fileSystemHelper'
import { parseSubtitles } from '@renderer/utils/subtitleParser'
import type { SubtitleItem } from '@types_/shared'
import styles from './SubtitleLoadModal.module.css'
import { ReactCallback } from '@renderer/types/shared'

const { Text } = Typography

interface SubtitleLoadModalProps {
  visible: boolean
  videoFilePath: string
  onCancel: ReactCallback<() => void>
  onSkip: ReactCallback<() => void>
  onSubtitlesLoaded: ReactCallback<(subtitles: SubtitleItem[]) => void>
}

interface SubtitleFileInfo {
  path: string
  name: string
  exists: boolean
}

export function SubtitleLoadModal({
  visible,
  videoFilePath,
  onCancel,
  onSkip,
  onSubtitlesLoaded
}: SubtitleLoadModalProps): React.JSX.Element {
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(false)
  const [subtitleFiles, setSubtitleFiles] = useState<SubtitleFileInfo[]>([])
  const [selectedFile, setSelectedFile] = useState<SubtitleFileInfo | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [loadingMessage, setLoadingMessage] = useState<string>('')

  // 用于取消文件读取操作的引用
  const cancelTokenRef = useRef<{ cancelled: boolean }>({ cancelled: false })

  // 重置状态
  const resetState = useCallback(() => {
    setLoading(false)
    setChecking(false)
    setSubtitleFiles([])
    setSelectedFile(null)
    setUploadError(null)
    setLoadingMessage('')
    cancelTokenRef.current = { cancelled: false }
  }, [])

  // 检查同目录下的字幕文件
  const checkSubtitleFiles = useCallback(async (): Promise<void> => {
    if (!videoFilePath) return

    setChecking(true)
    try {
      const videoDir = FileSystemHelper.getDirectoryPath(videoFilePath)
      const videoBaseName = FileSystemHelper.getFileName(videoFilePath).replace(/\.[^/.]+$/, '')

      // 支持的字幕文件扩展名
      const subtitleExtensions = ['srt', 'vtt', 'json', 'ass', 'ssa']
      const possibleFiles: SubtitleFileInfo[] = []

      for (const ext of subtitleExtensions) {
        // 使用正确的路径分隔符
        const isWindows = navigator.userAgent.toLowerCase().includes('win')
        const separator = isWindows ? '\\' : '/'
        const subtitlePath = `${videoDir}${separator}${videoBaseName}.${ext}`
        const exists = await FileSystemHelper.checkFileExists(subtitlePath)

        possibleFiles.push({
          path: subtitlePath,
          name: `${videoBaseName}.${ext}`,
          exists
        })
      }

      const existingFiles = possibleFiles.filter((file) => file.exists)
      setSubtitleFiles(existingFiles)

      if (existingFiles.length > 0) {
        setSelectedFile(existingFiles[0]) // 默认选择第一个找到的字幕文件
      }
    } catch (error) {
      console.error('检查字幕文件失败:', error)
      message.error('检查字幕文件失败')
    } finally {
      setChecking(false)
    }
  }, [videoFilePath])

  // 加载选中的字幕文件
  const loadSelectedSubtitle = async (): Promise<void> => {
    if (!selectedFile) return

    setLoading(true)
    setLoadingMessage(`正在加载字幕文件：${selectedFile.name}`)
    cancelTokenRef.current = { cancelled: false }

    try {
      const content = await FileSystemHelper.readSubtitleFile(selectedFile.path)

      // 检查是否被取消
      if (cancelTokenRef.current.cancelled) {
        return
      }

      if (!content) {
        throw new Error('无法读取字幕文件内容')
      }

      setLoadingMessage('正在解析字幕内容...')

      // 模拟解析延迟，让用户看到进度
      await new Promise((resolve) => setTimeout(resolve, 500))

      // 再次检查是否被取消
      if (cancelTokenRef.current.cancelled) {
        return
      }

      const subtitles = parseSubtitles(content, selectedFile.name)
      if (subtitles.length === 0) {
        throw new Error('字幕文件解析失败或为空')
      }

      setLoadingMessage('字幕加载完成！')
      message.success(`成功加载字幕文件：${selectedFile.name}，共 ${subtitles.length} 条字幕`)

      // 延迟一下让用户看到成功消息
      await new Promise((resolve) => setTimeout(resolve, 800))

      if (!cancelTokenRef.current.cancelled) {
        onSubtitlesLoaded(subtitles)
        // 不需要手动关闭，因为父组件会处理
      }
    } catch (error) {
      if (!cancelTokenRef.current.cancelled) {
        console.error('加载字幕文件失败:', error)
        message.error(`加载字幕文件失败：${(error as Error).message}`)
      }
    } finally {
      if (!cancelTokenRef.current.cancelled) {
        setLoading(false)
        setLoadingMessage('')
      }
    }
  }

  // 处理手动选择字幕文件
  const handleManualFileSelect = (): void => {
    setUploadError(null)

    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.srt,.vtt,.json,.ass,.ssa'

    input.onchange = async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0]
      if (!file) {
        return
      }

      setLoading(true)
      setLoadingMessage(`正在加载字幕文件：${file.name}`)
      cancelTokenRef.current = { cancelled: false }

      try {
        const content = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = (e) => resolve(e.target?.result as string)
          reader.onerror = () => reject(new Error('读取文件失败'))
          reader.readAsText(file)
        })

        // 检查是否被取消
        if (cancelTokenRef.current.cancelled) {
          return
        }

        setLoadingMessage('正在解析字幕内容...')

        // 模拟解析延迟
        await new Promise((resolve) => setTimeout(resolve, 500))

        if (cancelTokenRef.current.cancelled) {
          return
        }

        const subtitles = parseSubtitles(content, file.name)
        if (subtitles.length === 0) {
          throw new Error('字幕文件解析失败或为空')
        }

        setLoadingMessage('字幕加载完成！')
        message.success(`成功加载字幕文件：${file.name}，共 ${subtitles.length} 条字幕`)

        // 延迟一下让用户看到成功消息
        await new Promise((resolve) => setTimeout(resolve, 800))

        if (!cancelTokenRef.current.cancelled) {
          onSubtitlesLoaded(subtitles)
        }
      } catch (error) {
        if (!cancelTokenRef.current.cancelled) {
          console.error('加载字幕文件失败:', error)
          const errorMessage = `加载字幕文件失败：${(error as Error).message}`
          setUploadError(errorMessage)
        }
      } finally {
        if (!cancelTokenRef.current.cancelled) {
          setLoading(false)
          setLoadingMessage('')
        }
      }
    }

    input.click()
  }

  // 取消加载操作
  const handleCancelLoading = (): void => {
    cancelTokenRef.current.cancelled = true
    setLoading(false)
    setLoadingMessage('')
    message.info('已取消字幕加载操作')
  }

  // 处理模态框关闭
  const handleModalCancel = (): void => {
    if (loading) {
      handleCancelLoading()
    }
    resetState()
    onCancel()
  }

  // 当Modal显示时检查字幕文件
  useEffect(() => {
    if (visible && videoFilePath) {
      resetState()
      checkSubtitleFiles()
    }
  }, [visible, videoFilePath, checkSubtitleFiles, resetState])

  return (
    <Modal
      title={
        <div className={styles.modalTitle}>
          <FileTextOutlined className={styles.titleIcon} />
          字幕文件检查
        </div>
      }
      open={visible}
      onCancel={handleModalCancel}
      footer={null}
      width={600}
      className="subtitle-modal"
      maskClosable={!loading} // loading时不允许点击遮罩关闭
      closable={!loading} // loading时隐藏关闭按钮
    >
      <div className={styles.modalContent}>
        {/* Loading 蒙版 */}
        {loading && (
          <div className={styles.loadingOverlay}>
            <div className={styles.loadingContent}>
              <Spin size="large" />
              <Text className={styles.loadingText}>{loadingMessage}</Text>
              <Button
                type="default"
                icon={<CloseOutlined />}
                onClick={handleCancelLoading}
                className={styles.cancelButton}
              >
                取消
              </Button>
            </div>
          </div>
        )}

        {checking ? (
          <div className={styles.checkingSection}>
            <Spin size="large" />
            <Text className={styles.checkingText}>正在检查同目录下的字幕文件...</Text>
          </div>
        ) : (
          <>
            {subtitleFiles.length > 0 ? (
              <div className={styles.foundSection}>
                <Alert
                  message="找到字幕文件"
                  description={`在视频文件同目录下找到 ${subtitleFiles.length} 个字幕文件`}
                  type="success"
                  icon={<CheckCircleOutlined />}
                  className={styles.alert}
                />

                <div className={styles.subtitleList}>
                  {subtitleFiles.map((file) => (
                    <div
                      key={file.path}
                      className={`${styles.subtitleItem} ${
                        selectedFile?.path === file.path ? styles.selected : ''
                      }`}
                      onClick={() => setSelectedFile(file)}
                    >
                      <FileTextOutlined className={styles.fileIcon} />
                      <Text className={styles.subtitleName}>{file.name}</Text>
                      {selectedFile?.path === file.path && (
                        <CheckCircleOutlined className={styles.selectedIcon} />
                      )}
                    </div>
                  ))}
                </div>

                <div className={styles.actionButtons}>
                  <Button
                    type="primary"
                    size="large"
                    onClick={loadSelectedSubtitle}
                    disabled={!selectedFile || loading}
                    className={styles.loadButton}
                  >
                    加载选中的字幕文件
                  </Button>
                  <Button
                    size="large"
                    onClick={onSkip}
                    className={styles.skipButton}
                    disabled={loading}
                  >
                    稍后添加
                  </Button>
                </div>
              </div>
            ) : (
              <div className={styles.notFoundSection}>
                <Alert
                  message="未找到字幕文件"
                  description="在视频文件同目录下未找到匹配的字幕文件（.srt, .vtt, .json, .ass, .ssa）"
                  type="warning"
                  icon={<ExclamationCircleOutlined />}
                  className={styles.alert}
                />

                {uploadError && (
                  <Alert
                    message="加载失败"
                    description={uploadError}
                    type="error"
                    closable
                    onClose={() => setUploadError(null)}
                    className={styles.alert}
                    style={{ marginBottom: 16 }}
                  />
                )}

                <div className={styles.actionButtons}>
                  <Button
                    type="primary"
                    size="large"
                    icon={<UploadOutlined />}
                    onClick={handleManualFileSelect}
                    className={styles.uploadButton}
                    disabled={loading}
                  >
                    手动添加字幕文件
                  </Button>
                  <Button
                    size="large"
                    onClick={onSkip}
                    className={styles.skipButton}
                    disabled={loading}
                  >
                    稍后添加
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  )
}
