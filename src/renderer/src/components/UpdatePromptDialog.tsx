import * as React from 'react'
import { Modal, Button, Typography, Space, Progress, Tag, Alert } from 'antd'
import {
  RocketOutlined,
  CloudDownloadOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
  ExclamationCircleOutlined,
  EyeInvisibleOutlined
} from '@ant-design/icons'
import { useTheme } from '@renderer/hooks/useTheme'
import { useResponsiveDialog } from '@renderer/hooks/useResponsiveDialog'
import { FONT_WEIGHTS } from '@renderer/styles/theme'
import {
  UpdatePromptDialogProps,
  isMandatoryUpdate,
  formatFileSize,
  formatSpeed
} from '../../../types/update'
import {
  renderMarkdown,
  isMarkdownContent,
  createHtmlProps
} from '@renderer/utils/markdownRenderer'

const { Text, Paragraph } = Typography

/**
 * Apple-style update prompt dialog component
 * 苹果风格的更新提示对话框组件
 */
export function UpdatePromptDialog({
  isVisible,
  updateStatus,
  onDownload,
  onInstall,
  onRetry,
  onDismiss,
  onSkipVersion
}: UpdatePromptDialogProps): React.JSX.Element {
  const { token, styles, utils } = useTheme()
  const responsiveConfig = useResponsiveDialog()

  // 检查是否为强制更新 / Check if this is a mandatory update
  const isUpdateMandatory = isMandatoryUpdate(updateStatus)

  // 渲染标题 / Render title
  const renderTitle = (): React.ReactNode => {
    if (!updateStatus) return null

    let icon: React.ReactNode
    let text: string
    let iconColor: string

    switch (updateStatus.status) {
      case 'checking':
        icon = <InfoCircleOutlined />
        text = '检查更新中'
        iconColor = token.colorInfo
        break
      case 'available':
        icon = <RocketOutlined />
        text = '发现新版本'
        iconColor = token.colorSuccess
        break
      case 'downloading':
        icon = <CloudDownloadOutlined />
        text = '正在下载更新'
        iconColor = token.colorPrimary
        break
      case 'downloaded':
        icon = <CheckCircleOutlined />
        text = '更新已准备就绪'
        iconColor = token.colorSuccess
        break
      case 'error':
        icon = <ExclamationCircleOutlined />
        text = '更新遇到问题'
        iconColor = token.colorError
        break
      default:
        icon = <InfoCircleOutlined />
        text = '应用更新'
        iconColor = token.colorInfo
    }

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: token.marginSM }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: utils.hexToRgba(iconColor, 0.12),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: `2px solid ${utils.hexToRgba(iconColor, 0.2)}`
          }}
        >
          <span style={{ color: iconColor, fontSize: 18 }}>{icon}</span>
        </div>
        <span
          style={{
            fontSize: responsiveConfig.titleFontSize,
            fontWeight: FONT_WEIGHTS.SEMIBOLD,
            color: token.colorText
          }}
        >
          {text}
        </span>
      </div>
    )
  }

  // 渲染内容 / Render content
  const renderContent = (): React.ReactNode => {
    if (!updateStatus) return null

    const containerStyle = {
      padding: `${token.paddingMD}px 0`
    }

    switch (updateStatus.status) {
      case 'checking':
        return (
          <div style={containerStyle}>
            <div style={{ textAlign: 'center', padding: `${responsiveConfig.padding.lg}px 0` }}>
              <Text
                style={{
                  fontSize: responsiveConfig.contentFontSize,
                  color: token.colorTextSecondary
                }}
              >
                正在检查是否有可用的更新...
              </Text>
            </div>
          </div>
        )

      case 'available':
        return (
          <div style={containerStyle}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              {/* 版本信息 */}
              <div
                style={{
                  background: utils.hexToRgba(token.colorPrimary, 0.05),
                  border: `1px solid ${utils.hexToRgba(token.colorPrimary, 0.15)}`,
                  borderRadius: token.borderRadius,
                  padding: responsiveConfig.padding.sm
                }}
              >
                <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                  <div>
                    <Text strong style={{ fontSize: responsiveConfig.contentFontSize }}>
                      版本 {updateStatus.info?.version}
                    </Text>
                    <div style={{ marginTop: token.marginXXS }}>
                      <Space split={<span style={{ color: token.colorTextTertiary }}>•</span>}>
                        {updateStatus.info?.releaseDate && (
                          <Text
                            style={{
                              fontSize: responsiveConfig.smallFontSize,
                              color: token.colorTextSecondary
                            }}
                          >
                            发布于 {new Date(updateStatus.info.releaseDate).toLocaleDateString()}
                          </Text>
                        )}
                        {updateStatus.info?.updateSize && (
                          <Text
                            style={{
                              fontSize: responsiveConfig.smallFontSize,
                              color: token.colorTextSecondary
                            }}
                          >
                            大小 {formatFileSize(updateStatus.info.updateSize)}
                          </Text>
                        )}
                      </Space>
                    </div>
                  </div>
                  <Tag color="blue" style={{ margin: 0 }}>
                    新版本
                  </Tag>
                </Space>
              </div>

              {/* 更新内容 */}
              {updateStatus.info?.releaseNotes && (
                <div>
                  <Text
                    strong
                    style={{
                      fontSize: responsiveConfig.contentFontSize,
                      color: token.colorText,
                      marginBottom: token.marginSM,
                      display: 'block'
                    }}
                  >
                    更新内容：
                  </Text>
                  <div
                    style={{
                      background: token.colorFillQuaternary,
                      borderRadius: token.borderRadius,
                      padding: responsiveConfig.padding.sm,
                      maxHeight: 120,
                      overflowY: 'auto',
                      border: `1px solid ${token.colorBorderSecondary}`
                    }}
                  >
                    {(() => {
                      const content =
                        typeof updateStatus.info.releaseNotes === 'string'
                          ? updateStatus.info.releaseNotes
                          : JSON.stringify(updateStatus.info.releaseNotes, null, 2)

                      // Check if content appears to be markdown formatted
                      // 检查内容是否看起来是Markdown格式
                      if (isMarkdownContent(content)) {
                        // Render as markdown with sanitization
                        // 渲染为经过净化的Markdown
                        const htmlContent = renderMarkdown(content)
                        return (
                          <div
                            style={{
                              margin: 0,
                              fontSize: responsiveConfig.smallFontSize,
                              color: token.colorText,
                              lineHeight: 1.6
                            }}
                            {...createHtmlProps(htmlContent)}
                          />
                        )
                      } else {
                        // Render as plain text
                        // 渲染为纯文本
                        return (
                          <Paragraph
                            style={{
                              margin: 0,
                              fontSize: responsiveConfig.smallFontSize,
                              color: token.colorText,
                              lineHeight: 1.6
                            }}
                          >
                            {content}
                          </Paragraph>
                        )
                      }
                    })()}
                  </div>
                </div>
              )}

              {/* 操作提示 */}
              <Alert
                message="点击立即更新开始下载，或选择跳过此版本。"
                type="info"
                showIcon
                style={{ borderRadius: token.borderRadius }}
              />
            </Space>
          </div>
        )

      case 'downloading':
        return (
          <div style={containerStyle}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div style={{ textAlign: 'center' }}>
                <Text
                  style={{ fontSize: responsiveConfig.contentFontSize, color: token.colorText }}
                >
                  正在下载更新包...
                </Text>
              </div>

              {updateStatus.progress && (
                <>
                  <Progress
                    percent={Math.round(updateStatus.progress.percent)}
                    status="active"
                    strokeColor={{
                      '0%': token.colorPrimary,
                      '100%': token.colorSuccess
                    }}
                    style={{ margin: 0 }}
                  />

                  <div style={{ textAlign: 'center' }}>
                    <Space split={<span style={{ color: token.colorTextTertiary }}>•</span>}>
                      <Text
                        style={{
                          fontSize: responsiveConfig.smallFontSize,
                          color: token.colorTextSecondary
                        }}
                      >
                        {formatFileSize(updateStatus.progress.transferred)} /{' '}
                        {formatFileSize(updateStatus.progress.total)}
                      </Text>
                      <Text
                        style={{
                          fontSize: responsiveConfig.smallFontSize,
                          color: token.colorTextSecondary
                        }}
                      >
                        {formatSpeed(updateStatus.progress.bytesPerSecond)}
                      </Text>
                    </Space>
                  </div>
                </>
              )}

              <Alert
                message="请保持网络连接，下载完成后将自动提示安装。"
                type="info"
                showIcon
                style={{ borderRadius: token.borderRadius }}
              />
            </Space>
          </div>
        )

      case 'downloaded':
        return (
          <div style={containerStyle}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div
                style={{
                  background: utils.hexToRgba(token.colorSuccess, 0.05),
                  border: `1px solid ${utils.hexToRgba(token.colorSuccess, 0.15)}`,
                  borderRadius: token.borderRadius,
                  padding: responsiveConfig.padding.md,
                  textAlign: 'center'
                }}
              >
                <CheckCircleOutlined
                  style={{
                    fontSize: 32,
                    color: token.colorSuccess,
                    marginBottom: token.marginSM
                  }}
                />
                <div>
                  <Text
                    strong
                    style={{
                      fontSize: responsiveConfig.titleFontSize,
                      color: token.colorText,
                      display: 'block',
                      marginBottom: token.marginXS
                    }}
                  >
                    更新已下载完成
                  </Text>
                  <Text
                    style={{
                      fontSize: responsiveConfig.contentFontSize,
                      color: token.colorTextSecondary
                    }}
                  >
                    版本 {updateStatus.info?.version} 已准备安装
                  </Text>
                </div>
              </div>

              <Alert
                message="安装过程中应用将重新启动"
                description="点击立即安装将关闭应用并自动安装更新，完成后应用会重新启动。"
                type="warning"
                showIcon
                style={{ borderRadius: token.borderRadius }}
              />
            </Space>
          </div>
        )

      case 'error':
        return (
          <div style={containerStyle}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Alert
                message="更新检查失败"
                description={updateStatus.error || '检查更新时发生未知错误，请检查网络连接后重试。'}
                type="error"
                showIcon
                style={{ borderRadius: token.borderRadius }}
              />
            </Space>
          </div>
        )

      default:
        return null
    }
  }

  // 渲染底部按钮 / Render footer buttons
  const renderFooter = (): React.ReactNode[] | null => {
    if (!updateStatus) return null

    const commonButtonStyle = {
      borderRadius: token.borderRadius,
      fontWeight: FONT_WEIGHTS.MEDIUM,
      height: responsiveConfig.buttonHeight,
      minWidth: responsiveConfig.stackButtons ? 'auto' : 120, // 确保按钮有最小宽度
      flex: responsiveConfig.stackButtons ? 'none' : '0 0 auto', // 防止按钮被压缩
      ...(responsiveConfig.stackButtons && { width: '100%' })
    }

    switch (updateStatus.status) {
      case 'available':
        return [
          // 跳过此版本按钮 / Skip this version button
          !isUpdateMandatory && onSkipVersion && (
            <Button
              key="skip"
              onClick={onSkipVersion}
              style={{
                ...commonButtonStyle,
                borderColor: token.colorBorderSecondary,
                color: token.colorTextSecondary,
                // 在水平布局时确保按钮不会太窄
                ...(!responsiveConfig.stackButtons && { minWidth: 120 })
              }}
              icon={<EyeInvisibleOutlined />}
            >
              跳过此版本
            </Button>
          ),
          <Button
            key="download"
            type="primary"
            onClick={onDownload}
            style={{
              ...commonButtonStyle,
              background: `linear-gradient(135deg, ${token.colorPrimary} 0%, ${token.colorPrimaryHover} 100%)`,
              border: 'none',
              boxShadow: `0 4px 12px ${utils.hexToRgba(token.colorPrimary, 0.3)}`,
              // 在水平布局时确保主要按钮有足够宽度
              ...(!responsiveConfig.stackButtons && { minWidth: 140 })
            }}
            icon={<CloudDownloadOutlined />}
          >
            {isUpdateMandatory ? '立即更新（必需）' : '立即更新'}
          </Button>
        ].filter(Boolean) // 过滤掉 false 值 / Filter out false values

      case 'downloaded':
        return [
          // 跳过此版本按钮 / Skip this version button
          !isUpdateMandatory && onSkipVersion && (
            <Button
              key="skip"
              onClick={onSkipVersion}
              style={{
                ...commonButtonStyle,
                borderColor: token.colorBorderSecondary,
                color: token.colorTextSecondary,
                // 在水平布局时确保按钮不会太窄
                ...(!responsiveConfig.stackButtons && { minWidth: 120 })
              }}
              icon={<EyeInvisibleOutlined />}
            >
              跳过此版本
            </Button>
          ),
          <Button
            key="install"
            type="primary"
            onClick={onInstall}
            style={{
              ...commonButtonStyle,
              background: `linear-gradient(135deg, ${token.colorSuccess} 0%, ${token.colorSuccessHover} 100%)`,
              border: 'none',
              boxShadow: `0 4px 12px ${utils.hexToRgba(token.colorSuccess, 0.3)}`,
              // 在水平布局时确保主要按钮有足够宽度
              ...(!responsiveConfig.stackButtons && { minWidth: 140 })
            }}
            icon={<CheckCircleOutlined />}
          >
            {isUpdateMandatory ? '立即安装（必需）' : '立即安装'}
          </Button>
        ].filter(Boolean) // 过滤掉 false 值 / Filter out false values

      case 'error':
        return [
          <Button
            key="cancel"
            onClick={() => {
              onDismiss?.()
            }}
            style={{
              ...commonButtonStyle,
              borderColor: token.colorBorderSecondary,
              // 在水平布局时确保按钮不会太窄，为800px宽度优化
              ...(!responsiveConfig.stackButtons && { minWidth: 90 })
            }}
          >
            关闭
          </Button>,
          <Button
            key="retry"
            type="primary"
            onClick={onRetry}
            style={{
              ...commonButtonStyle,
              // 在水平布局时确保按钮不会太窄，为800px宽度优化
              ...(!responsiveConfig.stackButtons && { minWidth: 90 })
            }}
            icon={<InfoCircleOutlined />}
          >
            重试
          </Button>
        ]

      case 'downloading':
        // 下载过程中不显示按钮，防止用户误操作
        return null

      case 'checking':
        return [
          <Button
            key="cancel"
            onClick={() => {
              onDismiss?.()
            }}
            style={{
              ...commonButtonStyle,
              borderColor: token.colorBorderSecondary,
              // 在水平布局时确保按钮不会太窄
              ...(!responsiveConfig.stackButtons && { minWidth: 80 })
            }}
          >
            取消
          </Button>
        ]

      default:
        return [
          <Button
            key="close"
            onClick={() => {
              onDismiss?.()
            }}
            style={{
              ...commonButtonStyle,
              borderColor: token.colorBorderSecondary,
              // 在水平布局时确保按钮不会太窄
              ...(!responsiveConfig.stackButtons && { minWidth: 80 })
            }}
          >
            关闭
          </Button>
        ]
    }
  }

  // 处理用户主动关闭对话框 / Handle user-initiated dialog dismissal
  const handleCancel = (): void => {
    if (updateStatus?.status !== 'downloading') {
      // 强制更新不允许关闭，不调用 onDismiss 进行抑制
      // Mandatory updates cannot be dismissed, don't call onDismiss for suppression
      if (!isUpdateMandatory) {
        onDismiss?.()
      }
    }
  }

  return (
    <Modal
      title={renderTitle()}
      open={isVisible}
      onCancel={updateStatus?.status !== 'downloading' ? handleCancel : undefined}
      footer={renderFooter()}
      centered
      width={responsiveConfig.width}
      maskClosable={updateStatus?.status !== 'downloading'}
      closable={updateStatus?.status !== 'downloading'}
      style={{
        borderRadius: token.borderRadiusLG,
        overflow: 'hidden'
      }}
      styles={{
        content: {
          borderRadius: token.borderRadiusLG,
          background: styles.glassEffect.background,
          backdropFilter: styles.glassEffect.backdropFilter,
          WebkitBackdropFilter: styles.glassEffect.WebkitBackdropFilter,
          border: `1px solid ${token.colorBorderSecondary}`,
          padding: 0
        },
        header: {
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
          background: utils.hexToRgba(token.colorPrimary, 0.02),
          borderRadius: `${token.borderRadiusLG}px ${token.borderRadiusLG}px 0 0`,
          padding: `${responsiveConfig.padding.md}px ${responsiveConfig.padding.lg}px`
        },
        body: {
          padding: `0 ${responsiveConfig.padding.lg}px ${responsiveConfig.padding.md}px`
        },
        footer: {
          borderTop: `1px solid ${token.colorBorderSecondary}`,
          background: utils.hexToRgba(token.colorFillQuaternary, 0.3),
          borderRadius: `0 0 ${token.borderRadiusLG}px ${token.borderRadiusLG}px`,
          padding: `${responsiveConfig.padding.md}px ${responsiveConfig.padding.lg}px`,
          display: 'flex',
          flexDirection: responsiveConfig.stackButtons ? 'column' : 'row',
          justifyContent: responsiveConfig.stackButtons ? 'center' : 'flex-end',
          alignItems: responsiveConfig.stackButtons ? 'stretch' : 'center',
          gap: `${responsiveConfig.buttonGap}px`,
          flexWrap: 'nowrap', // 防止按钮换行
          minHeight: responsiveConfig.buttonHeight + responsiveConfig.padding.md * 2 // 确保footer有足够高度
        }
      }}
    >
      {renderContent()}
    </Modal>
  )
}
