import React from 'react'
import { Modal } from 'antd'
import { DeleteOutlined } from '@ant-design/icons'
import { useTheme } from '@renderer/hooks/features/ui/useTheme'
import { FONT_WEIGHTS } from '@renderer/styles/theme'

interface ConfirmModalsProps {
  // Delete modal props / 删除模态框属性
  isDeleteModalOpen: boolean
  selectedFileName: string
  onDeleteCancel: () => void
  onDeleteConfirm: () => void

  // Clear modal props / 清空模态框属性
  isClearModalOpen: boolean
  recentPlaysCount: number
  onClearCancel: () => void
  onClearConfirm: () => void
}

/**
 * ConfirmModals component for handling delete and clear confirmation modals
 * 用于处理删除和清空确认模态框的组件
 */
export function ConfirmModals({
  isDeleteModalOpen,
  selectedFileName,
  onDeleteCancel,
  onDeleteConfirm,
  isClearModalOpen,
  recentPlaysCount,
  onClearCancel,
  onClearConfirm
}: ConfirmModalsProps): React.JSX.Element {
  const { token, styles, utils } = useTheme()

  return (
    <>
      {/* 删除确认模态框 / Delete confirmation modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: token.marginSM }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: utils.hexToRgba(token.colorError, 0.1),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <DeleteOutlined style={{ color: token.colorError, fontSize: token.fontSize }} />
            </div>
            <span style={{ fontSize: token.fontSize, fontWeight: FONT_WEIGHTS.SEMIBOLD }}>
              确认删除
            </span>
          </div>
        }
        open={isDeleteModalOpen}
        onCancel={onDeleteCancel}
        onOk={onDeleteConfirm}
        okText="删除"
        cancelText="取消"
        okType="danger"
        centered
        width={480}
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
            border: `1px solid ${token.colorBorderSecondary}`
          }
        }}
      >
        <div style={{ padding: `${token.paddingSM}px 0` }}>
          <p
            style={{
              fontSize: token.fontSize,
              color: token.colorText,
              margin: `0 0 ${token.marginSM}px 0`,
              lineHeight: 1.5
            }}
          >
            确定要删除视频{' '}
            <strong
              style={{
                color: token.colorPrimary,
                background: utils.hexToRgba(token.colorPrimary, 0.1),
                padding: `${token.paddingXXS}px ${token.paddingXS}px`,
                borderRadius: token.borderRadius,
                fontWeight: FONT_WEIGHTS.SEMIBOLD
              }}
            >
              &ldquo;{selectedFileName}&rdquo;
            </strong>{' '}
            的观看记录吗？
          </p>
          <div
            style={{
              background: utils.hexToRgba(token.colorWarning, 0.08),
              border: `1px solid ${utils.hexToRgba(token.colorWarning, 0.2)}`,
              borderRadius: token.borderRadius,
              padding: token.paddingXS
            }}
          >
            <p
              style={{
                fontSize: token.fontSizeSM,
                color: token.colorTextSecondary,
                margin: 0,
                lineHeight: 1.4
              }}
            >
              此操作将删除该视频的观看进度等所有相关数据，且无法恢复。
            </p>
          </div>
        </div>
      </Modal>

      {/* 清空确认模态框 / Clear confirmation modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: token.marginSM }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: utils.hexToRgba(token.colorWarning, 0.1),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <DeleteOutlined style={{ color: token.colorWarning, fontSize: token.fontSize }} />
            </div>
            <span style={{ fontSize: token.fontSize, fontWeight: FONT_WEIGHTS.SEMIBOLD }}>
              确认清空
            </span>
          </div>
        }
        open={isClearModalOpen}
        onCancel={onClearCancel}
        onOk={onClearConfirm}
        okText="清空"
        cancelText="取消"
        okType="danger"
        centered
        width={480}
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
            border: `1px solid ${token.colorBorderSecondary}`
          }
        }}
      >
        <div style={{ padding: `${token.paddingSM}px 0` }}>
          <p
            style={{
              fontSize: token.fontSize,
              color: token.colorText,
              margin: `0 0 ${token.marginSM}px 0`,
              lineHeight: 1.5
            }}
          >
            确定要清空所有最近观看记录吗？
          </p>
          <div
            style={{
              background: utils.hexToRgba(token.colorError, 0.08),
              border: `1px solid ${utils.hexToRgba(token.colorError, 0.2)}`,
              borderRadius: token.borderRadius,
              padding: token.paddingXS
            }}
          >
            <p
              style={{
                fontSize: token.fontSizeSM,
                color: token.colorTextSecondary,
                margin: 0,
                lineHeight: 1.4
              }}
            >
              此操作将删除所有视频的观看记录（共 {recentPlaysCount}{' '}
              个项目），包括观看进度等所有相关数据，且无法恢复。
            </p>
          </div>
        </div>
      </Modal>
    </>
  )
}
