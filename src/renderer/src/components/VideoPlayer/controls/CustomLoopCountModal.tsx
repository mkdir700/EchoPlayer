import React, { useState, useEffect } from 'react'
import { Modal, InputNumber, Space, Typography, Button } from 'antd'

const { Text } = Typography

interface CustomLoopCountModalProps {
  open: boolean
  currentCount: number
  onConfirm: (count: number) => void
  onCancel: () => void
}

/**
 * 自定义循环次数设置模态框
 * Custom loop count setting modal
 */
export function CustomLoopCountModal({
  open,
  currentCount,
  onConfirm,
  onCancel
}: CustomLoopCountModalProps): React.JSX.Element {
  const [count, setCount] = useState<number>(currentCount)

  // 当模态框打开时，重置输入值为当前值
  useEffect(() => {
    if (open) {
      setCount(currentCount)
    }
  }, [open, currentCount])

  const handleConfirm = (): void => {
    if (count >= 1 && count <= 50) {
      onConfirm(count)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent): void => {
    if (e.key === 'Enter') {
      handleConfirm()
    }
  }

  return (
    <Modal
      title="自定义循环次数"
      open={open}
      onCancel={onCancel}
      width={320}
      centered
      footer={[
        <Button key="cancel" onClick={onCancel}>
          取消
        </Button>,
        <Button
          key="confirm"
          type="primary"
          onClick={handleConfirm}
          disabled={!count || count < 1 || count > 50}
        >
          确定
        </Button>
      ]}
    >
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <div>
          <Text type="secondary">设置循环播放次数，范围：2-50次</Text>
        </div>

        <div>
          <Text strong>循环次数：</Text>
          <InputNumber
            value={count}
            onChange={(value) => setCount(value || 2)}
            min={2}
            max={50}
            style={{ width: '100%', marginTop: 8 }}
            placeholder="请输入循环次数"
            onKeyPress={handleKeyPress}
            autoFocus
          />
        </div>

        <div>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            💡 提示：设置为 -1 表示无限循环，2-50 表示指定次数循环
          </Text>
        </div>
      </Space>
    </Modal>
  )
}
