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
import { useTheme } from '@renderer/hooks/useTheme'
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
  const { token, styles } = useTheme()
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(false)
  const [subtitleFiles, setSubtitleFiles] = useState<SubtitleFileInfo[]>([])
  const [selectedFile, setSelectedFile] = useState<SubtitleFileInfo | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [loadingMessage, setLoadingMessage] = useState<string>('')

  // 用于取消文件读取操作的引用
  const cancelTokenRef = useRef<{ cancelled: boolean }>({ cancelled: false })

  // 组件特有样式
  const componentStyles = {
    modalTitle: {
      display: 'flex',
      alignItems: 'center',
      gap: token.marginMD,
      color: token.colorText,
      fontSize: token.fontSizeXL,
      fontWeight: token.fontWeightStrong
    },
    titleIcon: {
      color: token.colorPrimary,
      fontSize: token.fontSizeHeading2,
      filter: `drop-shadow(0 0 8px ${token.colorPrimary}30)`
    },
    modalContent: {
      padding: token.paddingXL,
      position: 'relative' as const
    },
    checkingSection: {
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      gap: token.marginXL,
      padding: `${token.paddingXL}px ${token.paddingXL}px`,
      textAlign: 'center' as const
    },
    checkingText: {
      color: token.colorText,
      fontSize: token.fontSizeLG,
      fontWeight: token.fontWeightStrong
    },
    foundSection: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: token.marginXL
    },
    notFoundSection: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: token.marginXL
    },
    subtitleList: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: token.marginSM,
      maxHeight: '200px',
      overflowY: 'auto' as const,
      padding: token.paddingSM,
      background: token.colorBgContainer,
      borderRadius: token.borderRadiusLG,
      border: `1px solid ${token.colorBorderSecondary}`
    },
    subtitleItem: {
      display: 'flex',
      alignItems: 'center',
      gap: token.marginMD,
      padding: token.paddingMD,
      borderRadius: token.borderRadius,
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      border: `1px solid transparent`,
      background: token.colorBgContainer
    },
    subtitleItemSelected: {
      background: token.colorPrimaryBg,
      borderColor: token.colorPrimary,
      boxShadow: `0 0 0 2px ${token.colorPrimary}20`
    },
    subtitleItemHover: {
      background: token.colorBgTextHover,
      borderColor: token.colorBorder
    },
    fileIcon: {
      color: token.colorPrimary,
      fontSize: token.fontSizeLG
    },
    subtitleName: {
      flex: 1,
      color: token.colorText,
      fontSize: token.fontSize,
      fontWeight: token.fontWeightStrong
    },
    selectedIcon: {
      color: token.colorSuccess,
      fontSize: token.fontSizeLG
    },
    actionButtons: {
      display: 'flex',
      gap: token.marginMD,
      justifyContent: 'center',
      marginTop: token.marginXL
    },
    loadingOverlay: {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: `${token.colorBgMask}80`,
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      borderRadius: token.borderRadiusLG
    },
    loadingContent: {
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      gap: token.marginLG,
      padding: token.paddingXL,
      background: token.colorBgContainer,
      borderRadius: token.borderRadiusLG,
      border: `1px solid ${token.colorBorderSecondary}`,
      boxShadow: token.boxShadowSecondary
    },
    loadingText: {
      color: token.colorText,
      fontSize: token.fontSizeLG,
      fontWeight: token.fontWeightStrong,
      textAlign: 'center' as const,
      marginTop: token.marginMD
    },
    cancelButton: {
      marginTop: token.marginLG
    }
  }

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
        <div style={componentStyles.modalTitle}>
          <FileTextOutlined style={componentStyles.titleIcon} />
          字幕文件检查
        </div>
      }
      open={visible}
      onCancel={handleModalCancel}
      footer={null}
      width={600}
      maskClosable={!loading} // loading时不允许点击遮罩关闭
      closable={!loading} // loading时隐藏关闭按钮
    >
      <div style={componentStyles.modalContent}>
        {/* Loading 蒙版 */}
        {loading && (
          <div style={componentStyles.loadingOverlay}>
            <div style={componentStyles.loadingContent}>
              <Spin size="large" />
              <Text style={componentStyles.loadingText}>{loadingMessage}</Text>
              <Button
                type="default"
                icon={<CloseOutlined />}
                onClick={handleCancelLoading}
                style={componentStyles.cancelButton}
              >
                取消
              </Button>
            </div>
          </div>
        )}

        {checking ? (
          <div style={componentStyles.checkingSection}>
            <Spin size="large" />
            <Text style={componentStyles.checkingText}>正在检查同目录下的字幕文件...</Text>
          </div>
        ) : (
          <>
            {subtitleFiles.length > 0 ? (
              <div style={componentStyles.foundSection}>
                <Alert
                  message="找到字幕文件"
                  description={`在视频文件同目录下找到 ${subtitleFiles.length} 个字幕文件`}
                  type="success"
                  icon={<CheckCircleOutlined />}
                  style={{ marginBottom: token.marginLG }}
                />

                <div style={componentStyles.subtitleList}>
                  {subtitleFiles.map((file) => (
                    <div
                      key={file.path}
                      style={{
                        ...componentStyles.subtitleItem,
                        ...(selectedFile?.path === file.path
                          ? componentStyles.subtitleItemSelected
                          : {})
                      }}
                      onClick={() => setSelectedFile(file)}
                      onMouseEnter={(e) => {
                        if (selectedFile?.path !== file.path) {
                          Object.assign(e.currentTarget.style, componentStyles.subtitleItemHover)
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedFile?.path !== file.path) {
                          Object.assign(e.currentTarget.style, componentStyles.subtitleItem)
                        }
                      }}
                    >
                      <FileTextOutlined style={componentStyles.fileIcon} />
                      <Text style={componentStyles.subtitleName}>{file.name}</Text>
                      {selectedFile?.path === file.path && (
                        <CheckCircleOutlined style={componentStyles.selectedIcon} />
                      )}
                    </div>
                  ))}
                </div>

                <div style={componentStyles.actionButtons}>
                  <Button
                    type="primary"
                    size="large"
                    onClick={loadSelectedSubtitle}
                    disabled={!selectedFile || loading}
                    style={styles.primaryButton}
                  >
                    加载选中的字幕文件
                  </Button>
                  <Button
                    size="large"
                    onClick={onSkip}
                    disabled={loading}
                    style={styles.secondaryButton}
                  >
                    稍后添加
                  </Button>
                </div>
              </div>
            ) : (
              <div style={componentStyles.notFoundSection}>
                <Alert
                  message="未找到字幕文件"
                  description="在视频文件同目录下未找到匹配的字幕文件（.srt, .vtt, .json, .ass, .ssa）"
                  type="warning"
                  icon={<ExclamationCircleOutlined />}
                  style={{ marginBottom: token.marginLG }}
                />

                {uploadError && (
                  <Alert
                    message="加载失败"
                    description={uploadError}
                    type="error"
                    closable
                    onClose={() => setUploadError(null)}
                    style={{ marginBottom: token.marginMD }}
                  />
                )}

                <div style={componentStyles.actionButtons}>
                  <Button
                    type="primary"
                    size="large"
                    icon={<UploadOutlined />}
                    onClick={handleManualFileSelect}
                    disabled={loading}
                    style={styles.primaryButton}
                  >
                    手动添加字幕文件
                  </Button>
                  <Button
                    size="large"
                    onClick={onSkip}
                    disabled={loading}
                    style={styles.secondaryButton}
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
